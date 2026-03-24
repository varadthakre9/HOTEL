# The Container Kitchen - Online Ordering Website

A mobile-first cafe ordering website with menu browsing, cart, online ordering, and an admin panel for order management.

## Prerequisites

- **Node.js** (v14 or higher) installed on your machine
  - Download from [https://nodejs.org](https://nodejs.org)
  - Verify installation: `node -v`

> **Note:** This project uses zero external dependencies — only Node.js built-in modules (`http`, `fs`, `path`, `url`, `crypto`). No `npm install` is needed.

## Project Structure

```
cafe/
├── server.js              # Backend server (Node.js, zero dependencies)
├── database.json          # Auto-generated JSON database
├── package.json
├── README.md
└── public/
    ├── index.html         # Customer-facing SPA
    ├── admin.html         # Admin panel
    ├── css/
    │   └── style.css
    ├── js/
    │   ├── app.js         # Customer app logic
    │   └── admin.js       # Admin panel logic
    ├── images/
    │   ├── logo.png
    │   └── menu/          # Menu item images
    └── uploads/           # Auto-created for file uploads
```

## How to Run

### 1. Start the server

```bash
node server.js
```

The server starts on **port 3000**. You'll see output like:

```
  🍱 The Container Kitchen - Server
  ─────────────────────────────────
  🌐 Local:       http://localhost:3000
  📱 Mobile:      http://192.168.1.x:3000
  📋 Admin Panel: http://localhost:3000/admin
  🔑 Admin Login: admin / admin123
```

### 2. Access the website

| Purpose | URL |
|---------|-----|
| Customer website | [http://localhost:3000](http://localhost:3000) |
| Admin panel | [http://localhost:3000/admin](http://localhost:3000/admin) |

### 3. Access from mobile (same Wi-Fi network)

1. Make sure your phone and computer are on the **same Wi-Fi network**
2. Open the **Mobile** URL shown in the server output (e.g. `http://192.168.1.x:3000`)
3. If it doesn't connect, you may need to allow port 3000 through Windows Firewall:

```powershell
netsh advfirewall firewall add rule name="Cafe Server" dir=in action=allow protocol=TCP localport=3000
```

## Admin Panel

- **URL:** `/admin`
- **Username:** `admin`
- **Password:** `admin123`

From the admin panel you can:
- View and manage incoming orders
- Update order status (Pending → Preparing → Ready → Delivered)
- View order details and customer information

## Resetting the Database

Delete `database.json` and restart the server. A fresh database with the full menu will be auto-generated:

```bash
# Windows PowerShell
Remove-Item database.json; node server.js

# macOS / Linux
rm database.json && node server.js
```

## Deployment

> **Netlify is not compatible** with this project. Netlify only hosts static sites and cannot run a persistent Node.js server, handle API routes, or provide a writable filesystem for the JSON database.

### Recommended: Render (free tier)

1. Push your code to a **GitHub** repository
2. Go to [render.com](https://render.com) and sign up
3. Click **New → Web Service** and connect your GitHub repo
4. Configure:
   - **Runtime:** Node
   - **Build Command:** _(leave blank)_
   - **Start Command:** `node server.js`
5. Click **Deploy** — the site will be live at a `*.onrender.com` URL

### Alternative: Railway

1. Go to [railway.app](https://railway.app) and sign up
2. Click **New Project → Deploy from GitHub Repo**
3. Select your repo — Railway auto-detects Node.js and deploys

### Why not Netlify?

| Feature | This Project | Netlify |
|---------|-------------|---------|
| Node.js HTTP server | `http.createServer` | Not supported |
| Persistent database | `database.json` file R/W | No writable filesystem |
| API endpoints | `/api/menu`, `/api/orders` | Only via serverless functions (requires full rewrite) |
| File uploads | `public/uploads/` | No writable filesystem |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js (built-in `http` module, zero dependencies) |
| Frontend | Vanilla HTML, CSS, JavaScript (SPA) |
| Database | JSON file (`database.json`) |
| Styling | Mobile-first CSS with Swiggy-inspired color palette |
