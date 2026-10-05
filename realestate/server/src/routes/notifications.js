const router = require('express').Router();
const Notification = require('../models/Notification');
const { addClient } = require('../services/notifier');

/**
 * Notifications API (admin only — mounted with auth in index.js)
 */

// GET /api/notifications — latest 50 + unread count
router.get('/', async (req, res) => {
  try {
    const [items, unread] = await Promise.all([
      Notification.find().sort({ createdAt: -1 }).limit(50),
      Notification.countDocuments({ read: false }),
    ]);
    res.json({ items, unread });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', async (req, res) => {
  try {
    res.json({ unread: await Notification.countDocuments({ read: false }) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/notifications/stream — Server-Sent Events (real-time push)
router.get('/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  // Send initial snapshot so the panel syncs on (re)connect
  try {
    const [items, unread] = await Promise.all([
      Notification.find().sort({ createdAt: -1 }).limit(10),
      Notification.countDocuments({ read: false }),
    ]);
    res.write(`event: init\ndata: ${JSON.stringify({ items, unread })}\n\n`);
  } catch (err) {
    // still keep the connection alive
  }

  addClient(res);

  // keep-alive ping so proxies don't drop the connection
  const ping = setInterval(() => {
    try { res.write(': ping\n\n'); } catch (e) { clearInterval(ping); }
  }, 25000);

  res.on('close', () => clearInterval(ping));
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: 'Notification not found' });
    res.json({ notification: notif });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/notifications/read-all
router.post('/read-all', async (req, res) => {
  try {
    await Notification.updateMany({ read: false }, { read: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
