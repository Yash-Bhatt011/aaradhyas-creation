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

## Upgrading the Database

The current database is a JSON file (`backend/data/db.json`) — perfect for a single-server deployment, handles thousands of orders comfortably. When you're ready to scale:

1. Add `pg` or `mongoose` to backend
2. Re-implement `db.js` with the same `read()` / `write()` / `nextId()` interface
3. No other files need to change

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
