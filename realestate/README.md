# 🏠 Gurukripa Estate — Real Estate Website + Admin Panel (MERN)

Gurukripa Estate ke liye complete real-estate system — **public website** + **alag admin panel** (CRM + Property Management + Website CMS). Single owner ke liye bana hai — **saara content admin panel se edit hota hai, koi code change nahi chahiye**.

---

## 📦 Kya-kya hai (ek nazar me)

| App | Port | Kya hai |
|---|---|---|
| 🌐 **Website** | `http://localhost:5173` | Properties, About, Contact, Find-a-Home — visitors ke liye |
| ⚙️ **Admin Panel** | `http://localhost:5174` | Dashboard, Properties, Leads/CRM, Website CMS, Analytics, Settings |
| 🔌 **API Server** | `http://localhost:5000` | Backend — MongoDB Atlas se connected |
| 🗄️ **Database** | MongoDB Atlas (cloud) | `gurukripa_estate` — properties, enquiries, content, users |

**Login:** Fresh install par `.env` ka `ADMIN_EMAIL` / `admin123` — ownership transfer ke baad naya email/password.

---

## ✨ Features (current)

### 🌐 Website
- **Home** — Hero (brand + trust), stats count-up, selected properties, services, story + founder, areas marquee, why-us, testimonials slider (mobile par 1 card), CTA band, footer
- **Properties** — search, filter (buy/rent, type, city), sort (price/newest/popular), pagination, skeleton loading
- **Property detail** — gallery, specs, amenities, enquiry form, similar homes
- **Find a Home** — requirement form (type/city/budget/bedrooms/timeline) → admin ko lead
- **About / Contact / Privacy / Terms / 404** — sab admin se editable
- **WhatsApp float button** — direct chat (number admin se editable)
- **Live sync** — website har 60s (aur tab focus par) content refresh karti hai → admin edits automatically live

### ⚙️ Admin Panel
- 📊 **Dashboard** — KPI cards, **2 dynamic line charts** (Property Performance + Daily Website Visits), recent enquiries, follow-ups, upcoming visits, notifications
- 🏡 **Properties** — CRUD, 20 photos (cover/order), custom amenities, featured/active toggles, listing status
- 📥 **Leads & Enquiries** — pipeline (new → contacted → qualified → site_visit → negotiation → closed), follow-up dates, notes, call buttons
- 📅 **Site Visits** — schedule, status, feedback
- ✏️ **Website CMS** — 18 content blocks editable (hero, about, stats, services, testimonials, contact, footer, SEO...). **Property types (Duplex/Villa...) bhi yahan se editable** — jo types yahan hain wahi Add Property form me dikhenge
- 📈 **Analytics** — funnel (visitors → views → enquiries → visits → negotiations → closed), most-viewed properties
- 🔔 **Notifications** — real-time (SSE): jaise hi enquiry aaye, panel me turant dikhe + email bhi
- 📋 **Activity Log** — har sensitive action logged (login, password, transfer, edits) with IP
- ⚙️ **Settings** — password change, 2FA (Google Authenticator), **Account Ownership Transfer**, **Email/SMTP card** (UI se sender Gmail + app password)

### 📧 Email System (fully DB-driven — kuch hardcode nahi)
- **Recipient** (kis ko enquiry email jayegi) = **current admin user ka email** — DB se automatically. Ownership transfer karo → mail auto naye owner ko
- **Sender** (kis Gmail SE jayegi) = **Admin Panel → Settings → Email/SMTP card** se change hota hai — DB me save, koi file edit nahi
- **Send Test Email** button — 1 click me verify, exact error screen par
- Gmail app password (16-char) required — Google Account → Security → 2-Step ON → App passwords

### 🔐 Security
- JWT auth + bcrypt + rate limiting + CAPTCHA (failed attempts par) + 2FA TOTP + account lockout + password history (last 3)
- **Ownership Transfer** — purana email **puri tarah saaf** hota hai: duplicate users, audit logs, OTPs, reset tokens sab delete; sab sessions terminate; email-recipient cache reset
- Activity log (audit trail) with IP + user-agent
- Helmet headers, CORS allow-list, graceful shutdown, `/api/health`

### 📊 Daily Website Visits
- **1 device = 1 visit per day** (unique device ID in localStorage, server par dedupe)
- Day boundary **IST** me (raat 12 baje reset)
- Dashboard me 14-din ka line chart + today/total/unique

---

## 🛠️ Tech Stack

- **MongoDB Atlas** (cloud DB — direct connection URI, SRV nahi kyunki kuch ISPs par SRV fail hota hai)
- **Express** (Node.js API) — JWT auth, SSE notifications, Nodemailer
- **React + Vite** (website `client/`, admin `admin/` — alag apps)
- Self-hosted fonts, no external CDN dependencies

---

## 📁 Folder Structure

```
realestate/
├── client/          # Public website (React + Vite, port 5173)
├── admin/           # Admin panel (React + Vite, port 5174)
├── server/          # API (Express, port 5000)
│   ├── src/
│   │   ├── models/      # User, Property, Content, Enquiry, Notification, SiteVisit, Visit, Setting, ...
│   │   ├── routes/      # auth, properties, content, enquiries, sitevisits, settings, uploads, audit
│   │   ├── services/    # mailer (DB-driven SMTP), notifier (SSE), otp, totp
│   │   └── seed.js      # sample data (admin, 9 properties, 18 content blocks)
│   └── .env             # config (MONGO_URI, JWT_SECRET, SMTP fallback...)
├── setup.bat        # Windows one-time setup (deps + MongoDB + seed)
├── start.bat        # Windows daily start (MongoDB + seed + all 3 servers)
├── START-HERE.txt   # Quick start guide (Hindi)
└── DEPLOYMENT.md    # VPS/domain/SSL deployment guide
```

---

## 🚀 Setup (Windows — easy tarika)

> **Zaroorat:** Node.js (v18+) aur internet (Atlas ke liye). MongoDB **zip ke andar bundled** hai — kuch install nahi karna.

### Pehli baar (ek baar):
1. Zip extract karo (koi folder, e.g. `D:\gurukripa-site`)
2. Folder me `setup.bat` par **double-click**
   - VC++ runtime (agar prompt aaye to **Yes**)
   - npm dependencies install (root + server + client + admin)
   - Bundled MongoDB start + data seed
3. **"Done!"** dikhe to complete ✅

### Har baar (roz):
1. `start.bat` par **double-click** → teeno servers chal jayenge
2. Website: `http://localhost:5173` · Admin: `http://localhost:5174`
3. Band karne ke liye: start.bat wali window me `Ctrl+C`

### Manual (PowerShell/cmd, line by line):
```powershell
cd D:\gurukripa-site\realestate
npm install
npm --prefix server install
npm --prefix client install
npm --prefix admin install
npm run dev
```

> ⚠️ Note: PowerShell 5.1 me `&&` use mat karo — commands line-by-line chalao.

---

## 📧 Email Setup (enquiry emails — 5 minute)

1. **Google App Password banao:** Google Account → Security → **2-Step Verification ON** → **App passwords** → app: Mail → Generate → 16-char code (e.g. `abcd efgh ijkl mnop`)
2. **Admin Panel → Settings → "Email / SMTP (Sender)"** card:
   - Sender Gmail: apna Gmail (jis account ka app password hai)
   - App password: 16-char code (spaces hata ke)
   - **💾 Save SMTP** → **📧 Send Test Email**
3. ✅ Success = email aayi (inbox/spam check). Ab har enquiry par **"📩 You have a new enquiry"** email jayegi current admin ke email par.

> ⚡ **Recipient change karna ho?** Admin Panel → Settings → **Account Ownership Transfer** → naya email. Mail automatically naye owner ko jayegi — purana email puri tarah saaf (users, logs, OTPs sab delete).

---

## 🔄 Ownership Transfer (website bechne par)

**Admin Panel → Settings → Account Ownership Transfer:**
- Current password + buyer ka naya email + naya strong password
- Kya hota hai:
  - Admin email + password change
  - **Sab sessions terminate** (server-side tokenVersion — har device logout)
  - 2FA reset (naya owner apna 2FA set karega)
  - **Purana email ka nishan mit jata hai** — duplicate users, audit logs, OTPs, reset tokens
  - Enquiry emails ab naye owner ke email par
- Naya owner login: naye email + naye password se

---

## 🧹 Maintenance

- **Data storage full?** Cleanup script:
  ```
  npm run cleanup            # dry-run (dikhata hai)
  npm run cleanup -- --yes   # asli cleanup (purane notifications/audits/OTPs)
  ```
- **Backup:** Atlas UI (Data Explorer → Export) ya `mongodump` — saare collections ki periodic backup karo
- **Logs:** start.bat wali window me — errors yahin dikhte hain

---

## 🐛 Troubleshooting

| Problem | Fix |
|---|---|
| **ECONNREFUSED startup par** | Normal hai — API 5-8s me ready hota hai. Website ab khud retry karti hai (har 2s, 6 baar). Bas F5 karo ya 10s wait karo. |
| **Website content 60s tak nahi aata** | `client/src/SiteContext.jsx` me `setSite(data);` line honi chahiye (tryLoad me). Zip fresh extract karo. |
| **Settings page crash — "useEffect is not defined"** | `admin/src/pages/Settings.jsx` line 1: `import React, { useEffect, useState } from 'react';` |
| **Email nahi aa rahi** | Admin → Settings → Send Test Email. Error padho: EAUTH = galat app password / galat account; ESOCKET = internet/firewall. Spam folder check karo. |
| **White screen** | Incognito kholo. Ad-blocker ho to production mode (`start-prod.bat`). Console me `GURUKRIPA v2.3` dikhna chahiye. |
| **Mongo connection fail** | Internet check. `.env` me **direct URI** (mongodb://...ac-5goiirv...) hona chahiye — SRV kuch ISPs par fail hota hai. |
| **Admin login fail** | Ownership transfer ke baad purana email kaam nahi karta (by design). Naye email + naye password se login karo. |

---

## 🚀 Deployment (production)

`DEPLOYMENT.md` padho — VPS setup, PM2, domain, SSL, reverse proxy, Atlas whitelist. Short version:
1. Server par code + `.env` (production values)
2. `npm run build` (client + admin dist)
3. `npm start` (API serves website at `/`, admin at `/admin`)
4. PM2 (`ecosystem.config.js`) + Nginx + SSL

---

## 📝 License / Owner

Single-owner business tool — Gurukripa Estate ke liye. Saara data owner ka hai (Atlas cloud me). Handover = Ownership Transfer (upar dekho).
