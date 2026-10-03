# Aaradhya's Creation — Full-Stack E-Commerce

A production-ready saree e-commerce platform with a **luxury storefront**, **full admin panel**, **cart & checkout**, and built-in hooks for **Razorpay** payments and **Shiprocket** shipping.

---

## Project Structure

```
aaradhyas-creation/
├── backend/                 # Node + Express API server
│   ├── server.js            # Main entry point
│   ├── db.js                # JSON file-backed DB (swap for Postgres later)
│   ├── seed.js              # Seeds products, collections, admin account
│   ├── routes/              # auth, products, collections, orders, payments…
│   ├── services/            # shiprocket.js (auto-pushes orders)
│   ├── middleware/          # auth.js (JWT)
│   ├── data/db.json         # Auto-created by seed; your live database
│   └── uploads/             # Banner/media uploads
├── frontend/                # Vite + React storefront + admin
│   ├── src/
│   │   ├── App.jsx          # All routes
│   │   ├── pages/
│   │   │   ├── Storefront.jsx        # Public store
│   │   │   ├── Checkout.jsx          # Cart checkout (Razorpay + COD)
│   │   │   ├── OrderConfirmation.jsx
│   │   │   └── admin/               # Admin panel (separate routes)
│   │   ├── components/      # Shared UI components
│   │   ├── context/         # CartContext, AuthContext
│   │   ├── api/client.js    # All API calls in one place
│   │   └── data/content.js  # Marketing copy, icons
│   └── public/logo.svg      # Your brand logo
└── package.json             # Root scripts
```

---

## Quick Start (Local Development)

### 1. Prerequisites
- Node.js 18+
- npm 9+

### 2. Clone & install
```bash
git clone <your-repo>
cd aaradhyas-creation

# Install all deps + seed the database with starter products
npm run setup
```

### 3. Configure environment
```bash
# Backend — copy the example and add your keys
cp backend/.env.example backend/.env

# Frontend — set the API URL
cp frontend/.env.example frontend/.env
```

### 4. Start dev servers
```bash
npm run dev
```

- **Storefront:** http://localhost:5173
- **Admin panel:** http://localhost:5173/admin
- **API health:** http://localhost:5000/api/health

**Default admin login:**
- Email: `admin@aaradhyascreation.com`
- Password: `ChangeThisPassword123!`
  *(Change in backend/.env before deploying!)*

---

## Integrating Razorpay (Payments)

1. Sign up at [dashboard.razorpay.com](https://dashboard.razorpay.com) → Settings → API Keys → Generate Key
2. Add to `backend/.env`:
   ```
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxx
   ```
3. Restart the backend. Checkout will now use real Razorpay.

> **Test mode:** Leave the keys blank. Checkout still works end-to-end using a mock flow so you can test orders without real money.

### Also set up the webhook (strongly recommended before going live)

Without this, payment confirmation relies entirely on the customer's browser calling your server right after paying. If they close the tab at exactly the wrong moment, Razorpay has their money but your database might never record the order as paid. The webhook is a direct server-to-server call from Razorpay, independent of the customer's browser — the reliable source of truth.

1. Razorpay Dashboard → **Settings → Webhooks → Add New Webhook**
2. Webhook URL: `https://your-backend.onrender.com/api/payments/razorpay/webhook`
3. Active events: check **`payment.captured`**
4. Set any secret string, then add it to `backend/.env`:
   ```
   RAZORPAY_WEBHOOK_SECRET=the_secret_you_just_set
   ```
5. Save. Test it by placing a real order — you should see `Webhook: order AC-xxxx confirmed paid` in your Render logs.

---

## Order Confirmation Emails & Invoices

By default, orders complete fine but no real email is sent (it's logged to the console instead) — safe for local development. To send real confirmation emails with a PDF invoice attached:

1. **Simplest option — Gmail with an App Password** (free, no new account needed if you already have Gmail):
   - Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Create an app password for "Mail"
   - Add to `backend/.env`:
     ```
     SMTP_HOST=smtp.gmail.com
     SMTP_PORT=587
     SMTP_USER=youremail@gmail.com
     SMTP_PASS=the_16_character_app_password
     SMTP_FROM="Aaradhya's Creation <youremail@gmail.com>"
     ADMIN_NOTIFY_EMAIL=youremail@gmail.com
     ```
2. Any other SMTP provider (Brevo, Zoho Mail, SendGrid, etc.) works too — just change the host/port/credentials.

**What happens automatically once this is set:**
- Customer gets an order confirmation email with a PDF invoice attached, immediately after checkout
- You (the store owner) get an email alert for every new order
- The order confirmation page also lets customers download their invoice directly, and the admin Orders panel has a "Invoice" download button on every order

Email sending never blocks or slows down checkout — it happens in the background after the customer already sees their order confirmed, and if it fails for any reason, the order itself is unaffected.

---

## Integrating Shiprocket (Shipping)

1. Sign up at [app.shiprocket.in](https://app.shiprocket.in) → Settings → API
2. Add to `backend/.env`:
   ```
   SHIPROCKET_EMAIL=you@example.com
   SHIPROCKET_PASSWORD=your_shiprocket_password
   SHIPROCKET_PICKUP_LOCATION=Primary
   ```
3. New orders placed after a customer pays (Razorpay) or COD are **automatically pushed** to Shiprocket. The AWB tracking code is saved to the order and shown in the admin Orders panel.

---

## Deploying to Production

### Frontend → Vercel or Netlify

**Vercel:**
```bash
# In the Vercel dashboard, set root to `frontend/`
# Or use the CLI:
npm i -g vercel
cd frontend
vercel --prod
```

Set environment variable in Vercel dashboard:
```
VITE_API_URL = https://your-api.render.com/api
```

**Netlify:**
```bash
cd frontend
npm run build
# Deploy the `dist/` folder
```

Add a `frontend/_redirects` file for React Router:
```
/*  /index.html  200
```

---

### Backend → Render or Railway

**Render:**
1. New Web Service → connect your repo
2. Root directory: `backend`
3. Build command: `npm install && npm run seed`
4. Start command: `npm start`
5. Add all environment variables from `backend/.env.example`

**Railway:**
```bash
npm i -g @railway/cli
cd backend
railway login
railway init
railway up
```

Set env vars in Railway dashboard.

---

## Admin Panel Features

| Section | What you can do |
|---|---|
| **Dashboard** | Revenue, orders, customer stats; low-stock alert; recent orders |
| **Products** | Add / edit / hide / delete products; image preview; featured flag |
| **Collections** | Create and manage saree collections |
| **Orders** | View all orders; update status (placed → confirmed → shipped → delivered); Razorpay & Shiprocket details |
| **Customers** | Auto-built from orders; sorted by spend |
| **Discounts** | Create percentage or fixed coupons; set expiry & usage limits |
| **Banners** | Upload hero/promotional images |
| **Settings** | Store name, shipping thresholds, return windows |

---

## Persistent Database & Image Storage (Supabase — Recommended)

**Important for Render/Railway free tier deploys:** by default this project stores data in a local JSON file (`backend/data/db.json`) and uploaded photos on local disk. That's fine for local development, but on free hosting tiers the filesystem is wiped on every redeploy or restart — meaning your products, orders, admin login, and uploaded images would all reset each time.

The fix: connect a free Supabase project (500MB database + 1GB file storage, free forever, no credit card required). This single account handles **both** your database and your uploaded images — no need for two separate services.

### Setup (5–10 minutes)

**1. Create your project**
- Sign up at [supabase.com/dashboard/sign-up](https://supabase.com/dashboard/sign-up)
- Create a new project (pick a region close to you, set a database password — save it somewhere, though you won't need it for the app itself)
- Wait ~2 minutes for the project to finish provisioning

**2. Create the database table**
- In your project, open **SQL Editor** (left sidebar) → **New Query**
- Open `backend/supabase-setup.sql` from this project, copy its contents, paste into the SQL editor
- Click **Run**. You should see "Success. No rows returned."

**3. Create the image storage bucket**
- Open **Storage** (left sidebar) → **New Bucket**
- Name it exactly: `images`
- Toggle **Public bucket** ON (so uploaded photos actually load in the browser)
- Click **Create bucket**

**4. Get your API credentials**
- Open **Settings** (gear icon, bottom of sidebar) → **API**
- Copy the **Project URL**
- Copy the **`service_role`** secret key — **not** the `anon` public key. The service_role key is what lets your backend bypass Row Level Security; it must never be exposed to the frontend, which is why it only ever goes in `backend/.env` or Render's environment variables, never in any frontend `VITE_` variable.

### Add it to your backend

**Local development** — add to `backend/.env`:
```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....(long string)
SUPABASE_STORAGE_BUCKET=images
```

**Render production** — go to your backend service → **Environment** tab → add the same three variables.

Then redeploy. Check the deploy logs — you should see:
```
Supabase: connected and data loaded successfully.
Storage mode: Supabase (persistent)
```

That's it. Your products, orders, customers, settings, and every uploaded photo now survive every redeploy permanently, all inside one free Supabase project.

### Alternative: MongoDB Atlas (if you'd rather not use Supabase)

This project still supports MongoDB Atlas for the database (see `MONGODB_URI` in `.env.example`) and Cloudinary for images (`CLOUDINARY_URL`) — kept for anyone with an existing setup from an earlier version. If `SUPABASE_URL` is set, it always takes priority; leave it blank to use MongoDB/Cloudinary instead.

---


## Replacing Placeholder Images

Products currently use [Picsum Photos](https://picsum.photos) (seeded, so the same `seed` always gives the same image). To use real photography:

1. Upload images to Cloudinary / AWS S3
2. In `frontend/src/data/content.js`, change the `img()` helper to return your CDN URL pattern
3. In the admin Products panel, store the image key/path in the `seed` field (or rename it `imageKey`)

---

## Support

Admin panel: `/admin`  
API base: `/api`  
Health check: `/api/health`
