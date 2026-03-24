const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

const PORT = 3000;
const DB_PATH = path.join(__dirname, 'database.json');
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ===== JSON DATABASE =====
function loadDB() {
  if (!fs.existsSync(DB_PATH)) return null;
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function initDB() {
  let db = loadDB();
  if (db) return db;

  const adminHash = hashPassword('admin123');

  db = {
    admin: { username: 'admin', password: adminHash },
    categories: [
      { id: 1,  name: 'Dosa', icon: '🥘' },
      { id: 2,  name: 'Uttapam', icon: '🫓' },
      { id: 3,  name: 'Chilla', icon: '🥞' },
      { id: 4,  name: 'Idli-Vada-Upma', icon: '🍛' },
      { id: 5,  name: 'Beverages', icon: '☕' },
      { id: 6,  name: 'Combos', icon: '🍱' },
      { id: 7,  name: 'Sandwich', icon: '🥪' },
      { id: 8,  name: 'Maggie', icon: '🍜' },
      { id: 9,  name: 'Pav Bhaji & Pulao', icon: '🍲' },
      { id: 10, name: 'Pasta', icon: '🍝' },
      { id: 11, name: 'Vada Pav', icon: '🍔' }
    ],
    menu_items: [
      // ===== DOSA (cat 1) — ₹70 → ₹130 =====
      { id: 1,  name: 'Plain Dosa',              description: 'Crispy rice & lentil crepe served with chutney & sambar', price: 70,  image: '/images/menu/masala-dosa.jpg',   category_id: 1, is_veg: 1, is_available: 1 },
      { id: 2,  name: 'Masala Dosa',             description: 'Crispy dosa stuffed with spiced potato filling',          price: 90,  image: '/images/menu/masala-dosa.jpg',   category_id: 1, is_veg: 1, is_available: 1 },
      { id: 7,  name: 'Loni Masala Dosa',        description: 'Dosa made with loni (white butter) & potato masala',      price: 90,  image: '/images/menu/masala-dosa.jpg',   category_id: 1, is_veg: 1, is_available: 1 },
      { id: 10, name: 'Cut Piece Masala Dosa',   description: 'Masala dosa cut into bite-sized pieces',                  price: 90,  image: '/images/menu/masala-dosa.jpg',   category_id: 1, is_veg: 1, is_available: 1 },
      { id: 4,  name: 'Onion Masala Dosa',       description: 'Masala dosa with crispy onion topping',                   price: 95,  image: '/images/menu/masala-dosa.jpg',   category_id: 1, is_veg: 1, is_available: 1 },
      { id: 6,  name: 'Schezwan Masala Dosa',    description: 'Dosa with spicy schezwan sauce & potato masala',          price: 100, image: '/images/menu/masala-dosa.jpg',   category_id: 1, is_veg: 1, is_available: 1 },
      { id: 11, name: 'Rava Masala Dosa',        description: 'Crispy semolina dosa with potato masala',                 price: 100, image: '/images/menu/masala-dosa.jpg',   category_id: 1, is_veg: 1, is_available: 1 },
      { id: 3,  name: 'Butter Masala Dosa',      description: 'Butter-roasted dosa with spiced potato masala',           price: 110, image: '/images/menu/masala-dosa.jpg',   category_id: 1, is_veg: 1, is_available: 1 },
      { id: 8,  name: 'Paper Masala Dosa',       description: 'Thin crispy paper dosa with potato masala',               price: 110, image: '/images/menu/masala-dosa.jpg',   category_id: 1, is_veg: 1, is_available: 1 },
      { id: 5,  name: 'Cheese Masala Dosa',      description: 'Masala dosa loaded with melted cheese',                   price: 115, image: '/images/menu/masala-dosa.jpg',   category_id: 1, is_veg: 1, is_available: 1 },
      { id: 9,  name: 'Mysore Masala Dosa',      description: 'Spicy red chutney dosa with potato masala',               price: 130, image: '/images/menu/masala-dosa.jpg',   category_id: 1, is_veg: 1, is_available: 1 },
      { id: 12, name: 'Rava Paneer Masala Dosa', description: 'Rava dosa stuffed with paneer & potato masala',           price: 130, image: '/images/menu/masala-dosa.jpg',   category_id: 1, is_veg: 1, is_available: 1 },
      { id: 13, name: 'Rava Cheese Masala Dosa', description: 'Rava dosa with cheese & potato masala',                   price: 130, image: '/images/menu/masala-dosa.jpg',   category_id: 1, is_veg: 1, is_available: 1 },

      // ===== UTTAPAM (cat 2) — ₹80 → ₹120 =====
      { id: 14, name: 'Plain Uttapam',          description: 'Thick South Indian pancake with sambar & chutney',         price: 80,  image: '/images/menu/uttapam-new.jpg',    category_id: 2, is_veg: 1, is_available: 1 },
      { id: 15, name: 'Onion Uttapam',          description: 'Uttapam topped with chopped onion',                        price: 90,  image: '/images/menu/uttapam-new.jpg',    category_id: 2, is_veg: 1, is_available: 1 },
      { id: 16, name: 'Tomato Uttapam',         description: 'Uttapam topped with fresh tomato',                         price: 90,  image: '/images/menu/uttapam-new.jpg',    category_id: 2, is_veg: 1, is_available: 1 },
      { id: 21, name: 'Schezwan Uttapam',       description: 'Uttapam with spicy schezwan sauce',                        price: 90,  image: '/images/menu/uttapam-new.jpg',    category_id: 2, is_veg: 1, is_available: 1 },
      { id: 17, name: 'Mix Uttapam',            description: 'Uttapam with mixed vegetables topping',                    price: 100, image: '/images/menu/uttapam-new.jpg',    category_id: 2, is_veg: 1, is_available: 1 },
      { id: 22, name: 'Mysore Uttapam',         description: 'Uttapam with spicy Mysore red chutney',                    price: 100, image: '/images/menu/uttapam-new.jpg',    category_id: 2, is_veg: 1, is_available: 1 },
      { id: 18, name: 'Cheese Uttapam',         description: 'Uttapam loaded with melted cheese',                        price: 110, image: '/images/menu/uttapam-new.jpg',    category_id: 2, is_veg: 1, is_available: 1 },
      { id: 19, name: 'Paneer Uttapam',         description: 'Uttapam topped with crumbled paneer',                      price: 110, image: '/images/menu/uttapam-new.jpg',    category_id: 2, is_veg: 1, is_available: 1 },
      { id: 20, name: 'Cheese Paneer Uttapam',  description: 'Uttapam with both cheese & paneer topping',                price: 120, image: '/images/menu/uttapam-new.jpg',    category_id: 2, is_veg: 1, is_available: 1 },

      // ===== CHILLA (cat 3) — ₹70 → ₹100 =====
      { id: 23, name: 'Moong Dal Chilla',         description: 'Healthy moong dal crepe with green chutney',             price: 70,  image: '/images/menu/chilla-new.jpg', category_id: 3, is_veg: 1, is_available: 1 },
      { id: 24, name: 'Moong Dal Paneer Chilla',  description: 'Moong dal chilla stuffed with paneer',                   price: 90,  image: '/images/menu/chilla-new.jpg', category_id: 3, is_veg: 1, is_available: 1 },
      { id: 25, name: 'Moong Dal Cheese Chilla',  description: 'Moong dal chilla with melted cheese',                    price: 100, image: '/images/menu/chilla-new.jpg', category_id: 3, is_veg: 1, is_available: 1 },
      { id: 26, name: 'Moong Dal Butter Chilla',  description: 'Moong dal chilla with rich butter',                      price: 100, image: '/images/menu/chilla-new.jpg', category_id: 3, is_veg: 1, is_available: 1 },

      // ===== IDLI-VADA-UPMA (cat 4) — ₹30 → ₹50 =====
      { id: 27, name: 'Idli',      description: 'Soft steamed rice cake with sambar & chutney',                          price: 30,  image: '/images/menu/idli-new.jpg',      category_id: 4, is_veg: 1, is_available: 1 },
      { id: 29, name: 'Vada',      description: 'Crispy fried lentil donut with sambar & chutney',                       price: 30,  image: '/images/menu/vada-new.jpg',      category_id: 4, is_veg: 1, is_available: 1 },
      { id: 30, name: 'Upma',      description: 'Savory semolina cooked with vegetables & mustard seeds',                price: 30,  image: '/images/menu/upma-new.jpg',      category_id: 4, is_veg: 1, is_available: 1 },
      { id: 28, name: 'Idli Fry',  description: 'Crispy pan-fried idli with spices',                                     price: 50,  image: '/images/menu/idli-fry-new.jpg',  category_id: 4, is_veg: 1, is_available: 1 },

      // ===== BEVERAGES (cat 5) — ₹10 → ₹40 =====
      { id: 31, name: 'Chai',          description: 'Classic Indian tea',                                                price: 10,  image: '/images/menu/chai.jpg',          category_id: 5, is_veg: 1, is_available: 1 },
      { id: 32, name: 'Elaichi Chai',  description: 'Cardamom-flavored Indian tea',                                      price: 10,  image: '/images/menu/chai.jpg',          category_id: 5, is_veg: 1, is_available: 1 },
      { id: 33, name: 'Adrak Chai',    description: 'Ginger-flavored Indian tea',                                        price: 10,  image: '/images/menu/chai.jpg',          category_id: 5, is_veg: 1, is_available: 1 },
      { id: 34, name: 'Coffee',        description: 'Classic hot brewed coffee',                                          price: 20,  image: '/images/menu/coffee.jpg',        category_id: 5, is_veg: 1, is_available: 1 },
      { id: 35, name: 'Lemon Tea',     description: 'Light tea with a squeeze of fresh lemon',                            price: 20,  image: '/images/menu/lemon-tea.jpg',     category_id: 5, is_veg: 1, is_available: 1 },
      { id: 36, name: 'Green Tea',     description: 'Healthy antioxidant-rich green tea',                                 price: 40,  image: '/images/menu/green-tea.jpg',     category_id: 5, is_veg: 1, is_available: 1 },

      // ===== COMBOS (cat 6) — ₹50 → ₹90 =====
      { id: 37, name: 'Idli - Vada',            description: 'Idli & vada combo with sambar & chutney',                  price: 50,  image: '/images/menu/combo.jpg', category_id: 6, is_veg: 1, is_available: 1 },
      { id: 38, name: 'Idli - Vada - Upma',     description: 'TCK Special — idli, vada & upma combo',                    price: 90,  image: '/images/menu/combo.jpg', category_id: 6, is_veg: 1, is_available: 1 },

      // ===== SANDWICH (cat 7) — ₹40 → ₹240 =====
      { id: 52, name: 'Butter Toast',                 description: 'Crispy toast with butter',                            price: 40,  image: '/images/menu/toast.jpg',              category_id: 7, is_veg: 1, is_available: 1 },
      { id: 53, name: 'Jam Toast',                    description: 'Crispy toast with jam',                               price: 40,  image: '/images/menu/butter-toast.jpg',       category_id: 7, is_veg: 1, is_available: 1 },
      { id: 46, name: 'Aloo Masala Sandwich',         description: 'Grilled sandwich with spiced potato filling',         price: 120, image: '/images/menu/grilled-sandwich.jpg',  category_id: 7, is_veg: 1, is_available: 1 },
      { id: 39, name: 'Veg Grilled Sandwich',         description: 'Grilled sandwich with fresh vegetables',              price: 150, image: '/images/menu/grilled-sandwich.jpg',  category_id: 7, is_veg: 1, is_available: 1 },
      { id: 41, name: 'Grilled Bombay Sandwich',      description: 'Mumbai-style grilled sandwich with chutneys',         price: 150, image: '/images/menu/sandwich.jpg',          category_id: 7, is_veg: 1, is_available: 1 },
      { id: 42, name: 'Cheese Corn Sandwich',         description: 'Grilled sandwich with cheese & sweet corn',           price: 150, image: '/images/menu/grilled-sandwich.jpg',  category_id: 7, is_veg: 1, is_available: 1 },
      { id: 40, name: 'Veg Cheese Grilled Sandwich',  description: 'Grilled veg sandwich with melted cheese',             price: 180, image: '/images/menu/sandwich.jpg',          category_id: 7, is_veg: 1, is_available: 1 },
      { id: 45, name: 'Veg Schezwan Sandwich',        description: 'Grilled veg sandwich with schezwan sauce',            price: 180, image: '/images/menu/sandwich.jpg',          category_id: 7, is_veg: 1, is_available: 1 },
      { id: 51, name: 'Junglie Sandwich',             description: 'Loaded grilled sandwich with all toppings',            price: 180, image: '/images/menu/exotic-sandwich.jpg',   category_id: 7, is_veg: 1, is_available: 1 },
      { id: 43, name: 'Paneer Tikka Sandwich',        description: 'Grilled sandwich with spiced paneer tikka',           price: 200, image: '/images/menu/paneer-sandwich.jpg',  category_id: 7, is_veg: 1, is_available: 1 },
      { id: 44, name: 'Schezwan Paneer Sandwich',     description: 'Grilled sandwich with schezwan paneer',               price: 210, image: '/images/menu/paneer-sandwich.jpg',  category_id: 7, is_veg: 1, is_available: 1 },
      { id: 47, name: 'Veg Pizza Sandwich',           description: 'Pizza-style grilled sandwich with cheese & veggies',  price: 220, image: '/images/menu/veg-pizza-sandwich.jpg', category_id: 7, is_veg: 1, is_available: 1 },
      { id: 48, name: 'Peri-Peri Paneer Sandwich',    description: 'Grilled sandwich with peri-peri paneer',              price: 220, image: '/images/menu/paneer-sandwich.jpg',  category_id: 7, is_veg: 1, is_available: 1 },
      { id: 50, name: 'Veg Exotic Sandwich',          description: 'Premium grilled sandwich with exotic veggies',         price: 230, image: '/images/menu/exotic-sandwich.jpg',  category_id: 7, is_veg: 1, is_available: 1 },
      { id: 49, name: 'Paneer Exotic Sandwich',       description: 'Premium grilled sandwich with exotic paneer filling',  price: 240, image: '/images/menu/exotic-sandwich.jpg',  category_id: 7, is_veg: 1, is_available: 1 },

      // ===== MAGGIE (cat 8) — ₹40 → ₹90 =====
      { id: 54, name: 'Plain Maggie',           description: 'Classic Maggi noodles cooked to perfection',                price: 40,  image: '/images/menu/maggi.jpg',        category_id: 8, is_veg: 1, is_available: 1 },
      { id: 55, name: 'Masala Maggie',          description: 'Maggi with extra spices & masala',                           price: 50,  image: '/images/menu/maggi.jpg',        category_id: 8, is_veg: 1, is_available: 1 },
      { id: 56, name: 'Vegetable Maggie',       description: 'Maggi loaded with fresh vegetables',                         price: 60,  image: '/images/menu/noodles.jpg',      category_id: 8, is_veg: 1, is_available: 1 },
      { id: 57, name: 'Schezwan Maggie',        description: 'Maggi with spicy schezwan sauce',                            price: 70,  image: '/images/menu/noodles.jpg',      category_id: 8, is_veg: 1, is_available: 1 },
      { id: 58, name: 'Cheese Maggie',          description: 'Maggi loaded with melted cheese',                            price: 80,  image: '/images/menu/cheese-maggi.jpg', category_id: 8, is_veg: 1, is_available: 1 },
      { id: 59, name: 'Schezwan Cheese Maggie', description: 'Maggi with schezwan sauce & melted cheese',                  price: 90,  image: '/images/menu/cheese-maggi.jpg', category_id: 8, is_veg: 1, is_available: 1 },

      // ===== PAV BHAJI & PULAO (cat 9) — ₹20 → ₹130 =====
      { id: 67, name: 'Extra Pav',               description: 'Additional buttered pav',                                   price: 20,  image: '/images/menu/pav-bhaji.jpg',       category_id: 9, is_veg: 1, is_available: 1 },
      { id: 66, name: 'Masala Pav',              description: 'Buttered pav with spicy masala',                             price: 40,  image: '/images/menu/pav-bhaji.jpg',       category_id: 9, is_veg: 1, is_available: 1 },
      { id: 63, name: 'Tawa Pulao',              description: 'Spiced rice cooked on tawa with vegetables',                price: 90,  image: '/images/menu/pulao.jpg',           category_id: 9, is_veg: 1, is_available: 1 },
      { id: 60, name: 'Pav Bhaji',               description: 'Spiced mashed vegetable curry with buttered pav',           price: 100, image: '/images/menu/pav-bhaji.jpg',       category_id: 9, is_veg: 1, is_available: 1 },
      { id: 61, name: 'Amul Butter Pav Bhaji',   description: 'Pav bhaji topped with Amul butter',                        price: 110, image: '/images/menu/pav-bhaji.jpg',       category_id: 9, is_veg: 1, is_available: 1 },
      { id: 65, name: 'Tawa Pulao With Bhaji',   description: 'Tawa pulao served with pav bhaji',                          price: 120, image: '/images/menu/pulao.jpg',           category_id: 9, is_veg: 1, is_available: 1 },
      { id: 62, name: 'Cheese Pav Bhaji',        description: 'Pav bhaji topped with melted cheese',                       price: 130, image: '/images/menu/cheese-pav-bhaji.jpg', category_id: 9, is_veg: 1, is_available: 1 },
      { id: 64, name: 'Paneer Tawa Pulao',       description: 'Tawa pulao with paneer cubes',                              price: 130, image: '/images/menu/pulao.jpg',           category_id: 9, is_veg: 1, is_available: 1 },

      // ===== PASTA (cat 10) — ₹190 → ₹220 =====
      { id: 68, name: 'Alfredo Pasta',    description: 'Penne in creamy white sauce with vegetables',                      price: 190, image: '/images/menu/alfredo-pasta.jpg', category_id: 10, is_veg: 1, is_available: 1 },
      { id: 69, name: 'Arrabiata Pasta',  description: 'Penne in spicy tomato-garlic sauce with herbs',                    price: 190, image: '/images/menu/pasta.jpg',         category_id: 10, is_veg: 1, is_available: 1 },
      { id: 72, name: 'Aglio E Olio',     description: 'Pasta tossed in garlic, olive oil & chilli flakes',                price: 210, image: '/images/menu/pesto-pasta.jpg',   category_id: 10, is_veg: 1, is_available: 1 },
      { id: 70, name: 'Pesto Pasta',      description: 'Pasta in fresh basil pesto sauce',                                 price: 220, image: '/images/menu/pesto-pasta.jpg',   category_id: 10, is_veg: 1, is_available: 1 },
      { id: 71, name: 'Mac N Cheese',     description: 'Classic macaroni in rich cheese sauce',                             price: 220, image: '/images/menu/mac-cheese.jpg',    category_id: 10, is_veg: 1, is_available: 1 },

      // ===== VADA PAV (cat 11) — ₹25 → ₹30 =====
      { id: 73, name: 'Vada Pav',              description: 'Classic spiced potato fritter in a bun with chutneys',        price: 25,  image: '/images/menu/vada-pav.jpg', category_id: 11, is_veg: 1, is_available: 1 },
      { id: 74, name: 'Mumbai Style Vada Pav', description: 'Authentic Mumbai-style vada pav with dry garlic chutney',     price: 25,  image: '/images/menu/vada-pav.jpg', category_id: 11, is_veg: 1, is_available: 1 },
      { id: 75, name: 'Cheese Vada Pav',       description: 'Vada pav with melted cheese slice',                           price: 30,  image: '/images/menu/vada-pav.jpg', category_id: 11, is_veg: 1, is_available: 1 }
    ],
    orders: [],
    nextItemId: 76,
    nextOrderId: 1
  };

  saveDB(db);
  return db;
}

// ===== SIMPLE PASSWORD HASHING =====
function hashPassword(pass) {
  return crypto.createHash('sha256').update(pass + 'brewhouse_salt').digest('hex');
}

// ===== MIME TYPES =====
const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

// ===== HELPERS =====
function sendJSON(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function parseJSON(req) {
  const body = await readBody(req);
  return JSON.parse(body.toString());
}

// Multipart form parser for image uploads
async function parseMultipart(req) {
  const body = await readBody(req);
  const contentType = req.headers['content-type'] || '';
  const boundaryMatch = contentType.match(/boundary=(.+)/);
  if (!boundaryMatch) return { fields: {}, file: null };

  const boundary = boundaryMatch[1];
  const parts = body.toString('latin1').split('--' + boundary);
  const fields = {};
  let file = null;

  for (const part of parts) {
    if (part === '' || part === '--\r\n' || part === '--') continue;
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;

    const header = part.substring(0, headerEnd);
    const content = part.substring(headerEnd + 4, part.length - 2);

    const nameMatch = header.match(/name="([^"]+)"/);
    if (!nameMatch) continue;
    const fieldName = nameMatch[1];

    const filenameMatch = header.match(/filename="([^"]+)"/);
    if (filenameMatch) {
      const originalName = filenameMatch[1].replace(/\s/g, '_');
      const ext = path.extname(originalName);
      const filename = Date.now() + '-' + crypto.randomBytes(4).toString('hex') + ext;
      const filepath = path.join(UPLOAD_DIR, filename);
      const binaryStart = body.indexOf(Buffer.from('\r\n\r\n', 'latin1'), body.indexOf(Buffer.from(header.substring(0, 30), 'latin1'))) + 4;
      const nextBoundary = body.indexOf(Buffer.from('\r\n--' + boundary, 'latin1'), binaryStart);
      if (nextBoundary > binaryStart) {
        fs.writeFileSync(filepath, body.slice(binaryStart, nextBoundary));
      }
      file = { filename, path: '/uploads/' + filename };
    } else {
      fields[fieldName] = content.trim();
    }
  }

  return { fields, file };
}

function serveStatic(req, res, filePath) {
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';
  const content = fs.readFileSync(filePath);
  res.writeHead(200, { 'Content-Type': mime });
  res.end(content);
}

// ===== SERVER =====
const db = initDB();

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;
  const method = req.method;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  try {
    // ===== API ROUTES =====

    // GET /api/categories
    if (pathname === '/api/categories' && method === 'GET') {
      const currentDB = loadDB();
      return sendJSON(res, currentDB.categories);
    }

    // GET /api/menu
    if (pathname === '/api/menu' && method === 'GET') {
      const currentDB = loadDB();
      let items = currentDB.menu_items.filter(i => i.is_available);

      if (parsed.query.category) {
        items = items.filter(i => i.category_id == parsed.query.category);
      }
      if (parsed.query.search) {
        const s = parsed.query.search.toLowerCase();
        items = items.filter(i =>
          i.name.toLowerCase().includes(s) ||
          (i.description && i.description.toLowerCase().includes(s))
        );
      }
      const result = items.map(i => {
        const cat = currentDB.categories.find(c => c.id === i.category_id);
        return { ...i, category_name: cat ? cat.name : null, category_icon: cat ? cat.icon : '☕' };
      }).sort((a, b) => a.category_id - b.category_id || a.price - b.price);

      return sendJSON(res, result);
    }

    // POST /api/orders
    if (pathname === '/api/orders' && method === 'POST') {
      const body = await parseJSON(req);
      const currentDB = loadDB();

      if (!body.customer_name || !body.items || !body.total) {
        return sendJSON(res, { error: 'Missing required fields' }, 400);
      }

      const order = {
        id: currentDB.nextOrderId++,
        customer_name: body.customer_name,
        phone: body.phone || '',
        email: body.email || '',
        order_type: body.order_type || 'delivery',
        address: body.address || null,
        items: body.items,
        subtotal: body.subtotal,
        delivery_fee: body.delivery_fee || 0,
        tax: body.tax,
        total: body.total,
        status: 'pending',
        payment_status: 'paid',
        payment_method: body.payment_method || 'online',
        created_at: new Date().toISOString()
      };

      currentDB.orders.push(order);
      saveDB(currentDB);
      return sendJSON(res, { success: true, orderId: order.id });
    }

    // GET /api/orders/:id
    const orderMatch = pathname.match(/^\/api\/orders\/(\d+)$/);
    if (orderMatch && method === 'GET') {
      const currentDB = loadDB();
      const order = currentDB.orders.find(o => o.id == orderMatch[1]);
      if (!order) return sendJSON(res, { error: 'Not found' }, 404);
      return sendJSON(res, order);
    }

    // POST /api/admin/login
    if (pathname === '/api/admin/login' && method === 'POST') {
      const body = await parseJSON(req);
      const currentDB = loadDB();
      const hash = hashPassword(body.password || '');

      if (body.username === currentDB.admin.username && hash === currentDB.admin.password) {
        return sendJSON(res, { success: true, token: 'admin-' + Date.now() });
      }
      return sendJSON(res, { error: 'Invalid credentials' }, 401);
    }

    // GET /api/admin/orders
    if (pathname === '/api/admin/orders' && method === 'GET') {
      const currentDB = loadDB();
      const orders = [...currentDB.orders].reverse();
      return sendJSON(res, orders);
    }

    // PUT /api/admin/orders/:id/status
    const orderStatusMatch = pathname.match(/^\/api\/admin\/orders\/(\d+)\/status$/);
    if (orderStatusMatch && method === 'PUT') {
      const body = await parseJSON(req);
      const currentDB = loadDB();
      const order = currentDB.orders.find(o => o.id == orderStatusMatch[1]);
      if (order) {
        order.status = body.status;
        saveDB(currentDB);
      }
      return sendJSON(res, { success: true });
    }

    // GET /api/admin/menu
    if (pathname === '/api/admin/menu' && method === 'GET') {
      const currentDB = loadDB();
      const items = currentDB.menu_items.map(i => {
        const cat = currentDB.categories.find(c => c.id === i.category_id);
        return { ...i, category_name: cat ? cat.name : 'Uncategorized' };
      }).sort((a, b) => a.category_id - b.category_id || a.name.localeCompare(b.name));
      return sendJSON(res, items);
    }

    // POST /api/admin/menu  (add new item)
    if (pathname === '/api/admin/menu' && method === 'POST') {
      const { fields, file } = await parseMultipart(req);
      const currentDB = loadDB();

      const item = {
        id: currentDB.nextItemId++,
        name: fields.name || 'New Item',
        description: fields.description || '',
        price: parseFloat(fields.price) || 0,
        image: file ? file.path : null,
        category_id: parseInt(fields.category_id) || 1,
        is_veg: parseInt(fields.is_veg) ?? 1,
        is_available: 1
      };

      currentDB.menu_items.push(item);
      saveDB(currentDB);
      return sendJSON(res, { success: true, id: item.id });
    }

    // PUT /api/admin/menu/:id
    const menuEditMatch = pathname.match(/^\/api\/admin\/menu\/(\d+)$/);
    if (menuEditMatch && method === 'PUT') {
      const { fields, file } = await parseMultipart(req);
      const currentDB = loadDB();
      const item = currentDB.menu_items.find(i => i.id == menuEditMatch[1]);

      if (!item) return sendJSON(res, { error: 'Not found' }, 404);

      item.name = fields.name || item.name;
      item.description = fields.description !== undefined ? fields.description : item.description;
      item.price = fields.price ? parseFloat(fields.price) : item.price;
      item.category_id = fields.category_id ? parseInt(fields.category_id) : item.category_id;
      item.is_veg = fields.is_veg !== undefined ? parseInt(fields.is_veg) : item.is_veg;
      item.is_available = fields.is_available !== undefined ? parseInt(fields.is_available) : item.is_available;
      if (file) item.image = file.path;

      saveDB(currentDB);
      return sendJSON(res, { success: true });
    }

    // DELETE /api/admin/menu/:id
    if (menuEditMatch && method === 'DELETE') {
      const currentDB = loadDB();
      currentDB.menu_items = currentDB.menu_items.filter(i => i.id != menuEditMatch[1]);
      saveDB(currentDB);
      return sendJSON(res, { success: true });
    }

    // POST /api/admin/categories
    if (pathname === '/api/admin/categories' && method === 'POST') {
      const body = await parseJSON(req);
      const currentDB = loadDB();
      const maxId = currentDB.categories.reduce((m, c) => Math.max(m, c.id), 0);
      currentDB.categories.push({ id: maxId + 1, name: body.name, icon: body.icon || '☕' });
      saveDB(currentDB);
      return sendJSON(res, { success: true, id: maxId + 1 });
    }

    // GET /api/admin/stats
    if (pathname === '/api/admin/stats' && method === 'GET') {
      const currentDB = loadDB();
      const today = new Date().toISOString().split('T')[0];

      const todayOrders = currentDB.orders.filter(o => o.created_at && o.created_at.startsWith(today));
      const todayRevenue = todayOrders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + o.total, 0);

      const allRevenue = currentDB.orders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + o.total, 0);

      const itemCounts = {};
      todayOrders.forEach(o => {
        (o.items || []).forEach(i => { itemCounts[i.name] = (itemCounts[i.name] || 0) + i.quantity; });
      });
      const topItems = Object.entries(itemCounts)
        .sort((a, b) => b[1] - a[1]).slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      return sendJSON(res, {
        today: { orders: todayOrders.length, revenue: todayRevenue },
        allTime: { orders: currentDB.orders.length, revenue: allRevenue },
        topItems
      });
    }

    // ===== STATIC FILES =====
    let filePath = pathname;

    if (filePath === '/' || filePath === '/index.html') {
      filePath = '/index.html';
    } else if (filePath === '/admin' || filePath === '/admin.html') {
      filePath = '/admin.html';
    }

    const fullPath = path.join(__dirname, 'public', filePath);
    const normalizedFull = path.normalize(fullPath);
    const publicDir = path.join(__dirname, 'public');

    if (!normalizedFull.startsWith(publicDir)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    serveStatic(req, res, normalizedFull);

  } catch (err) {
    console.error('Server error:', err);
    sendJSON(res, { error: 'Internal server error' }, 500);
  }
});

const os = require('os');
function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const iface of Object.values(nets)) {
    for (const cfg of iface) {
      if (cfg.family === 'IPv4' && !cfg.internal && cfg.address.startsWith('192.168')) return cfg.address;
    }
  }
  for (const iface of Object.values(nets)) {
    for (const cfg of iface) {
      if (cfg.family === 'IPv4' && !cfg.internal) return cfg.address;
    }
  }
  return 'localhost';
}

server.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log('');
  console.log('  🍱 The Container Kitchen - Server');
  console.log('  ─────────────────────────────────');
  console.log(`  🌐 Local:       http://localhost:${PORT}`);
  console.log(`  📱 Mobile:      http://${ip}:${PORT}`);
  console.log(`  📋 Admin Panel: http://localhost:${PORT}/admin`);
  console.log(`  🔑 Admin Login: admin / admin123`);
  console.log('');
});
