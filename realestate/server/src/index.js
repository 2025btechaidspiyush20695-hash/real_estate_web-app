require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const auth = require('./middleware/auth');

const app = express();
app.use(express.json({ limit: '4mb' }));

const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

/* ================================================================
   SECURITY MIDDLEWARE
   ================================================================ */

// Behind Nginx / proxies we must trust the first hop so rate-limiters
// and logs see the real client IP (only in production).
if (isProd) app.set('trust proxy', 1);

// ---- CORS: restrict to known origins in production ----
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true, // dev: reflect any origin
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })
);

// ---- Helmet: secure HTTP headers (production only — keeps Vite dev HMR happy) ----
if (isProd) {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // React inline style props
          imgSrc: ["'self'", 'data:', 'blob:'],
          fontSrc: ["'self'", 'data:'],
          mediaSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
        },
      },
      hsts: false, // terminate TLS at Nginx; it can add HSTS itself
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
}

// ---- Rate limiting (brute-force protection) ----
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 600 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests — please try again later.' },
});
app.use('/api', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // login / forgot / transfer / reset attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts — please wait 15 minutes and try again.' },
});
app.use(['/api/auth/login', '/api/auth/forgot', '/api/auth/transfer', '/api/auth/reset'], authLimiter);

/* ================================================================
   ROUTES
   ================================================================ */
app.use('/api/auth', require('./routes/auth'));
app.use('/api/audit', auth, require('./routes/audit'));
app.use('/api/settings', auth, require('./routes/settings'));
app.use('/api/notifications', auth, require('./routes/notifications'));
app.use('/api/sitevisits', auth, require('./routes/sitevisits'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/content', require('./routes/content'));
app.use('/api/enquiries', require('./routes/enquiries'));
app.use('/api/upload', require('./routes/uploads'));

// GET /api/site — everything the public site needs in one call
app.get('/api/site', async (req, res) => {
  try {
    const Content = require('./models/Content');
    const Property = require('./models/Property');
    const Enquiry = require('./models/Enquiry');
    const [docs, featuredCount, activeCount, enquiryCount] = await Promise.all([
      Content.find(),
      Property.countDocuments({ featured: true, active: true }),
      Property.countDocuments({ active: true }),
      Enquiry.countDocuments(),
    ]);
    const blocks = {};
    for (const d of docs) blocks[d.key] = d.data;
    res.json({
      blocks,
      stats: {
        featured: featuredCount,
        activeProperties: activeCount,
        enquiries: enquiryCount,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/analytics/visit — record a website visit (1 per device per day)
app.post('/api/analytics/visit', async (req, res) => {
  try {
    const Visit = require('./models/Visit');
    const deviceId = String(req.body.deviceId || '').trim().slice(0, 80);
    if (!deviceId) return res.status(400).json({ error: 'deviceId required' });

    // IST calendar day (owner's local day boundary)
    const now = new Date();
    const date = now.toLocaleString('en-CA', {
      timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
    });

    const result = await Visit.updateOne(
      { deviceId, date },
      {
        $setOnInsert: {
          deviceId,
          date,
          ip: String(req.ip || '').slice(0, 45),
          userAgent: String(req.headers['user-agent'] || '').slice(0, 300),
          path: String(req.body.path || '/').slice(0, 150),
        },
      },
      { upsert: true }
    );

    res.json({ ok: true, counted: result.upsertedCount === 1, date });
  } catch (e) {
    // duplicate race -> still ok
    res.json({ ok: true, counted: false, date: null });
  }
});

// GET /api/analytics/visits — daily visit counts (admin)
app.get('/api/analytics/visits', auth, async (req, res) => {
  const Visit = require('./models/Visit');
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 14, 1), 90);
  const fmt = (d) => d.toLocaleString('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const start = fmt(new Date(Date.now() - (days - 1) * 86400000));

  const rows = await Visit.aggregate([
    { $match: { date: { $gte: start } } },
    { $group: { _id: '$date', n: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  const map = new Map(rows.map((r) => [r._id, r.n]));
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = fmt(new Date(Date.now() - i * 86400000));
    out.push({ date: d, count: map.get(d) || 0 });
  }
  res.json({
    days: out,
    total: out.reduce((s, x) => s + x.count, 0),
    today: out[out.length - 1]?.count || 0,
  });
});

// GET /api/analytics — insights (views trend, funnel, most viewed)
app.get('/api/analytics', auth, async (req, res) => {
  const Property = require('./models/Property');
  const Enquiry = require('./models/Enquiry');
  const SiteVisit = require('./models/SiteVisit');

  const [mostViewed, viewsAgg, enquiryCount, visitCount, closedCount] = await Promise.all([
    Property.find({}).sort({ views: -1 }).limit(5).select('title slug views price city images'),
    Property.aggregate([
      { $match: { views: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$views' }, avg: { $avg: '$views' } } },
    ]),
    Enquiry.countDocuments(),
    SiteVisit.countDocuments(),
    Enquiry.countDocuments({ status: 'closed' }),
  ]);

  // views per property -> funnel
  const totalViews = viewsAgg[0]?.total || 0;
  const funnel = {
    visitors: Math.max(totalViews, enquiryCount),
    propertyViews: totalViews,
    enquiries: enquiryCount,
    siteVisits: visitCount,
    negotiations: await Enquiry.countDocuments({ status: 'negotiation' }),
    closed: closedCount,
  };

  res.json({
    mostViewed,
    totalViews,
    avgViewsPerProperty: Math.round(viewsAgg[0]?.avg || 0),
    funnel,
  });
});

// GET /api/stats — admin dashboard
app.get('/api/stats', auth, async (req, res) => {
  const Property = require('./models/Property');
  const Enquiry = require('./models/Enquiry');
  const User = require('./models/User');

  const [properties, byType, byCity, byStatus, enquiries, users, views] = await Promise.all([
    Property.countDocuments(),
    Property.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Property.aggregate([{ $group: { _id: '$city', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Property.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Enquiry.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    User.countDocuments(),
    Property.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]),
  ]);

  const today = new Date();
  const weekAhead = new Date(today.getTime() + 7 * 24 * 3600 * 1000);
  const [followUpsDue, siteVisitsToday, pipeline] = await Promise.all([
    Enquiry.countDocuments({ nextFollowUp: { $ne: null, $lte: weekAhead }, status: { $nin: ['closed'] } }),
    require('./models/SiteVisit').countDocuments({ date: { $gte: new Date(today.setHours(0,0,0,0)), $lte: new Date(today.setHours(23,59,59,999)) } }),
    Enquiry.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  res.json({
    properties,
    featured: await Property.countDocuments({ featured: true }),
    followUpsDue,
    siteVisitsToday,
    pipeline,
    newEnquiries: await Enquiry.countDocuments({ status: 'new' }),
    views: views[0]?.total || 0,
    users,
    byType,
    byCity,
    byStatus,
    enquiries,
  });
});

/* ================================================================
   STATIC + SEO
   ================================================================ */
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), { maxAge: '1d' }));

// Dynamic robots.txt (uses the real public domain)
app.get('/robots.txt', (req, res) => {
  const base = process.env.CLIENT_URL || `http://localhost:${PORT}`;
  res.type('text/plain').send(`User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
});

// Dynamic sitemap.xml — includes every active property for SEO
app.get('/sitemap.xml', async (req, res) => {
  try {
    const Property = require('./models/Property');
    const base = (process.env.CLIENT_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
    const props = await Property.find({ active: true }).select('slug updatedAt').sort({ createdAt: -1 });
    const url = (loc, lastmod) =>
      `  <url><loc>${loc}</loc>${lastmod ? `<lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>` : ''}</url>`;
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${url(
      `${base}/`,
      new Date()
    )}\n${url(`${base}/properties`)}\n${url(`${base}/about`)}\n${url(`${base}/contact`)}\n${props
      .map((p) => url(`${base}/properties/${p.slug}`, p.updatedAt))
      .join('\n')}\n</urlset>`;
    res.type('application/xml').send(xml);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------- Health + API 404 (before SPA catch-all) ----------
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.use('/api', (req, res) => res.status(404).json({ message: 'API route not found' }));

// ---------- Production: serve built client (/) and admin (/admin) ----------
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
const adminDist = path.join(__dirname, '..', '..', 'admin', 'dist');

if (fs.existsSync(adminDist)) {
  app.use('/admin', express.static(adminDist));
  app.get('/admin/*', (req, res) => res.sendFile(path.join(adminDist, 'index.html')));
}
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

// error handler (multer errors etc.)
app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

// Do not crash on stray async rejections — log them (uptime matters)
process.on('unhandledRejection', (reason) => console.error('[unhandledRejection]', reason));

/* ================================================================
   BOOT (retries MongoDB) + GRACEFUL SHUTDOWN
   ================================================================ */
const MAX_TRIES = 45; // ~3 minutes of retrying

let server = null;

function boot(attempt = 1) {
  connectDB()
    .then(() => {
      server = app.listen(PORT, '0.0.0.0', () =>
        console.log(`[server] Gurukripa Estate API running on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`)
      );
    })
    .catch((err) => {
      if (attempt >= MAX_TRIES) {
        console.error('[db] giving up after 45 attempts. Is MongoDB running on port 27017?');
        process.exit(1);
      }
      console.error(
        `[db] MongoDB not reachable yet (${err.message}) — retrying in 4s (attempt ${attempt}/${MAX_TRIES}).`
      );
      console.error('     Windows: run start.bat · Linux/macOS: run `npm run setup` first.');
      setTimeout(() => boot(attempt + 1), 4000);
    });
}

// Clean shutdown: stop accepting requests, close DB, then exit.
// PM2/systemd send SIGTERM on restart — this makes restarts seamless.
async function shutdown(signal) {
  console.log(`[server] ${signal} received — shutting down gracefully…`);
  if (server) {
    server.close(async () => {
      try {
        await mongoose.disconnect();
        console.log('[server] DB closed. Goodbye.');
        process.exit(0);
      } catch (err) {
        process.exit(1);
      }
    });
    // Hard-stop safety net if connections hang
    setTimeout(() => process.exit(1), 8000).unref();
  } else {
    process.exit(0);
  }
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

boot();
