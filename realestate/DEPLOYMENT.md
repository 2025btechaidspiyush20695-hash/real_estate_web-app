# 🌍 Gurukripa Estate — Deployment & Selling Guide

Complete guide to put the website online with your own **domain + hosting**,
keep it running 24×7, and safely **hand it over to the buyer** .

---

## 1.  What you are selling

| Item | Details |
|---|---|
| Public website | `https://www.yourdomain.com` |
| Admin panel | `https://yourdomain.com/admin` (or admin subdomain) |
| Admin login | Transferred to the buyer via **Ownership Transfer** (Settings page) |
| Code | Full MERN stack in this repo |
| Database | MongoDB (Atlas free tier or VPS) |

---

## 2. Buy a domain

Any registrar works — popular & cheap in India: **Hostinger**, **GoDaddy**, **Namecheap**, **BigRock**.

- Pick something like `yourbusiness.in` / `.com`
- After purchase you get DNS management access

**Recommendation:** put the domain on **Cloudflare (free)** for:
- Free CDN + DDoS protection
- Free SSL (even for Nginx on your VPS)
- DNS management that survives registrar changes

---

## 3. Hosting — 3 options

### ✅ Option A — VPS (recommended for a business you are selling)
DigitalOcean / Hetzner / Vultr / Hostinger VPS — cheapest Linux droplet (~$4–6/mo).

- Full control, files (uploaded images) live on disk — nothing disappears
- PM2 keeps the site alive; Nginx + SSL in front
- Can add `pm2 startup` so it survives reboots

### Option B — Render / Railway (PaaS, simpler)
- Deploy the repo, set env vars in the dashboard
- ⚠️ Ephemeral disk: uploaded images vanish on redeploy
  → use **MongoDB Atlas** + move uploads to S3/Cloudinary (or accept losing uploads on redeploys)

### Option C — Shared hosting (cPanel) — NOT suitable
Node.js apps need a proper server; shared hosting usually can't run Express + MongoDB.

---

## 4. Database — MongoDB Atlas (free tier)

1. Go to https://www.mongodb.com/atlas → sign up → create a **free M0 cluster**
2. Database Access → create user (e.g. `gurukripa_admin`) with a strong password
3. Network Access → `0.0.0.0/0` (or your VPS IP only, stricter)
4. Get the connection string:
   `mongodb+srv://gurukripa_admin:<password>@cluster0.xxxxx.mongodb.net/gurukripa_estate?retryWrites=true&w=majority`
5. Set it as `MONGO_URI` in `server/.env`

---

## 5. VPS setup (Option A) — step by step

### 5.1 Basics
```bash
# SSH into your server, then:
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx git curl build-essential

# Node 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # v20.x

# PM2
sudo npm i -g pm2
```

### 5.2 Upload the project
```bash
# Option 1: from your PC (run locally)
scp -r /path/to/realestate root@YOUR_SERVER_IP:/var/www/

# Option 2: git
cd /var/www && git clone <your-repo> realestate && cd realestate
```

### 5.3 Install & configure
```bash
cd /var/www/realestate

# deps
npm install
npm --prefix server install --production
npm --prefix client install
npm --prefix admin install

# build the frontends
npm run build

# configure environment
nano server/.env
```
Set in `server/.env` (production):
```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/gurukripa_estate?retryWrites=true&w=majority
JWT_SECRET=<openssl rand -hex 64>
CLIENT_URL=https://www.yourdomain.com
ADMIN_URL=https://www.yourdomain.com/admin
CORS_ORIGINS=https://www.yourdomain.com
SMTP_HOST=smtp.hostinger.com        # or Gmail/Zoho/Brevo…
SMTP_PORT=587
SMTP_USER=no-reply@yourdomain.com
SMTP_PASS=<smtp password>
EMAIL_FROM="Gurukripa Estate <no-reply@yourdomain.com>"
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<set once — change it right after!>
```

### 5.4 Start with PM2 (auto-restart, never dies)
```bash
cd /var/www/realestate
NODE_ENV=production pm2 start ecosystem.config.js
pm2 save
pm2 startup            # follow the printed command — enables boot-start
pm2 status             # check it is online
pm2 logs               # watch logs
```

### 5.5 Nginx reverse proxy + SSL
Create `/etc/nginx/sites-available/gurukripa`:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 12m;   # property image uploads

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/gurukripa /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 5.6 Free SSL (Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
# auto-renewal is installed automatically; test with:
sudo certbot renew --dry-run
```
(If you used Cloudflare, you can also set their "Full (strict)" SSL — no certbot needed.)

### 5.7 Point the domain
At your registrar/Cloudflare, create DNS records:
```
A     @         -> <VPS IP>
A     www       -> <VPS IP>
```
Wait 5–30 minutes for DNS to propagate, then visit `https://yourdomain.com` 🎉

---

## 6. Keep it alive — ops checklist

| Concern | Solution |
|---|---|
| App crashes | PM2 `autorestart` + `exp_backoff_restart_delay` |
| Server reboot | `pm2 startup` + `pm2 save` |
| Memory leak | PM2 `max_memory_restart: 300M` |
| DB goes down | Mongoose auto-reconnects; API retries at boot |
| Brute-force login | Rate limiting (30 tries/15 min) + strong passwords |
| Security headers | Helmet (CSP, X-Frame-Options…) in production |
| DDoS / DNS | Free Cloudflare plan in front |
| Monitoring | UptimeRobot (free) → hit `https://yourdomain.com/api/health` every 5 min, alert to your phone |
| Backups | Daily MongoDB dump via cron (below) |

### Automatic daily backups
```bash
crontab -e
# add:
0 3 * * * mongodump --uri="mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net" --db=gurukripa_estate --out=/var/backups/gurukripa/$(date +\%F) && find /var/backups/gurukripa -mtime +14 -delete
```
Test the backup once manually; keep at least 14 days of history.

---

## 7. Selling & handover to the buyer 🔑

### Before the handover (seller — you)
1. Change the demo credentials: Settings → **Change password** (and your email via transfer).
2. Replace the sample properties with real ones (or leave — buyer's choice).
3. Configure a **real SMTP** so the buyer gets reset emails.
4. Do the handover on a video call with the buyer.

### The handover (both on call)
1. Seller logs into the admin panel → **Settings → Account Ownership Transfer**
2. Seller enters current password + buyer's email + buyer's chosen strong password
3. Confirm → **all sessions everywhere die instantly** (seller can no longer log in)
4. Buyer logs in with the new credentials and changes anything else
5. (Optional) Buyer can also test **Forgot Password** on the login page — a 15-minute reset link is emailed to them

### What the buyer owns after handover
- ✅ Admin panel login (email + password they chose)
- ✅ Full control of website content & properties
- ✅ Ability to change password / reset via email anytime
- ❌ Seller access — permanently revoked (server-side token versioning)

---

## 8. Security architecture (what's built in)

| Feature | Implementation |
|---|---|
| Password hashing | bcrypt (10 rounds) |
| JWT sessions | Signed, 12 h expiry, carries `tokenVersion` |
| **Instant session kill** | `tokenVersion` bumped on transfer / reset / password change → every old token rejected everywhere |
| Reset tokens | 256-bit random, stored **SHA-256 hashed**, 15 min TTL (Mongo TTL index), single-use, deleted after use |
| Brute force | express-rate-limit on login/forgot/reset/transfer |
| Enumeration | Same generic response whether or not the email exists |
| Headers | Helmet CSP in production |
| Input validation | Strong password policy (8+ chars, upper, digit, special) |

## 9. Troubleshooting

- **Site down after reboot?** → `pm2 status`; if stopped: `pm2 resurrect` (after `pm2 save` was run once).
- **Emails not sending?** → SMTP vars in `.env`, then `pm2 restart gurukripa-estate`; test via Forgot Password.
- **Uploads fail?** → `client_max_body_size 12m` in Nginx; folder `server/uploads` must be writable.
- **HTTPS not working?** → check Cloudflare SSL mode, or re-run `certbot --nginx`.
- **503 from Nginx?** → is PM2 running? `pm2 status`; check `pm2 logs`.
- **Buyer locked out?** → they can always use Forgot Password (email must be configured) — or seller's last resort: `mongosh` / Atlas UI → set a new password hash via the app seed.
