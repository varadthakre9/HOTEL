// ===== STATE =====
let cart = [];
let menuItems = [];
let categories = [];
let activeCategory = null;
let orderType = 'delivery';
const DELIVERY_FEE = 40;

// ===== NAVIGATION =====
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  window.scrollTo(0, 0);

  if (page === 'menu') { loadMenu(); updateFloatingCart(); }
  if (page === 'cart') renderCart();
  if (page === 'checkout') renderCheckout();
}

// ===== LOAD DATA =====
async function loadMenu() {
  try {
    const [catRes, menuRes] = await Promise.all([
      fetch('/api/categories'),
      fetch('/api/menu' + (activeCategory ? '?category=' + activeCategory : ''))
    ]);
    categories = await catRes.json();
    menuItems = await menuRes.json();
    renderCategories();
    renderMenuItems();
  } catch (e) {
    console.error('Failed to load menu:', e);
  }
}

// ===== CATEGORIES =====
function renderCategories() {
  const strip = document.getElementById('categories-strip');
  strip.innerHTML = `
    <div class="cat-chip ${!activeCategory ? 'active' : ''}" onclick="selectCategory(null)">All</div>
    ${categories.map(c => `
      <div class="cat-chip ${activeCategory == c.id ? 'active' : ''}" onclick="selectCategory(${c.id})">
        ${c.icon} ${c.name}
      </div>
    `).join('')}
  `;
}

function selectCategory(id) {
  activeCategory = id;
  loadMenu();
}

// ===== MENU ITEMS =====
function renderMenuItems() {
  const grid = document.getElementById('menu-grid');
  const search = document.getElementById('search-input').value.toLowerCase();

  let filtered = menuItems;
  if (search) {
    filtered = menuItems.filter(item =>
      item.name.toLowerCase().includes(search) ||
      (item.description && item.description.toLowerCase().includes(search))
    );
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="text-align:center; padding:3rem 1rem; color: var(--text-dim);">
        <div style="font-size:2.5rem; margin-bottom:0.5rem;">🔍</div>
        <p>No items found</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map((item, i) => {
    const inCart = cart.find(c => c.id === item.id);
    const delay = Math.min(i * 0.04, 0.5);
    const imgHtml = item.image
      ? `<img class="menu-card-img" src="${item.image}" alt="${item.name}" loading="lazy">`
      : `<div class="placeholder-img">${item.category_icon || '☕'}</div>`;

    return `
      <div class="menu-card" style="animation-delay:${delay}s">
        ${imgHtml}
        <div class="menu-card-info">
          <div class="menu-card-top">
            <div class="menu-card-row">
              <div class="veg-dot ${item.is_veg ? 'veg' : 'non-veg'}"></div>
              <div class="menu-card-name">${item.name}</div>
            </div>
            <div class="menu-card-desc">${item.description || ''}</div>
          </div>
          <div class="menu-card-bottom">
            <div class="menu-card-price">₹${item.price}</div>
            ${inCart
              ? `<div class="qty-control">
                  <button class="qty-btn" onclick="event.stopPropagation();updateQty(${item.id},-1)">−</button>
                  <span class="qty-value">${inCart.quantity}</span>
                  <button class="qty-btn" onclick="event.stopPropagation();updateQty(${item.id},1)">+</button>
                </div>`
              : `<button class="btn-add" onclick="event.stopPropagation();addToCart(${item.id})">ADD</button>`
            }
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function filterMenu() {
  renderMenuItems();
}

// ===== CART OPERATIONS =====
function addToCart(itemId) {
  const item = menuItems.find(i => i.id === itemId);
  if (!item) return;

  const existing = cart.find(c => c.id === itemId);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      category_icon: item.category_icon,
      quantity: 1
    });
  }

  updateCartBadge();
  updateFloatingCart();
  renderMenuItems();
  showToast(`${item.name} added`);
}

function updateQty(itemId, delta) {
  const item = cart.find(c => c.id === itemId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter(c => c.id !== itemId);
  }

  updateCartBadge();
  updateFloatingCart();
  renderMenuItems();
  renderCart();
}

function removeFromCart(itemId) {
  const item = cart.find(c => c.id === itemId);
  cart = cart.filter(c => c.id !== itemId);
  updateCartBadge();
  updateFloatingCart();
  renderCart();
  if (item) showToast(`${item.name} removed`);
}

function updateCartBadge() {
  const count = cart.reduce((sum, c) => sum + c.quantity, 0);
  const badge = document.getElementById('cart-badge');
  badge.textContent = count;
  badge.classList.remove('bump');
  void badge.offsetWidth;
  badge.classList.add('bump');
}

function updateFloatingCart() {
  const fc = document.getElementById('floating-cart');
  if (!fc) return;
  const count = cart.reduce((sum, c) => sum + c.quantity, 0);
  const { total } = getCartTotals();

  if (count > 0) {
    fc.classList.add('show');
    document.getElementById('fc-count').textContent = count + (count === 1 ? ' item' : ' items');
    document.getElementById('fc-total').textContent = '₹' + total;
  } else {
    fc.classList.remove('show');
  }
}

function getCartTotals() {
  const subtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const deliveryFee = orderType === 'delivery' ? DELIVERY_FEE : 0;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + deliveryFee + tax;
  return { subtotal, deliveryFee, tax, total };
}

// ===== ORDER TYPE =====
function setOrderType(type) {
  orderType = type;
  document.getElementById('btn-delivery').classList.toggle('active', type === 'delivery');
  document.getElementById('btn-pickup').classList.toggle('active', type === 'pickup');
  document.getElementById('delivery-address-section').style.display = type === 'delivery' ? 'block' : 'none';
  renderCheckoutTotals();
}

// ===== RENDER CART =====
function renderCart() {
  const emptyEl = document.getElementById('cart-empty');
  const filledEl = document.getElementById('cart-filled');
  const bottomBar = document.getElementById('cart-bottom-bar');

  if (cart.length === 0) {
    emptyEl.style.display = 'block';
    filledEl.style.display = 'none';
    bottomBar.style.display = 'none';
    return;
  }

  emptyEl.style.display = 'none';
  filledEl.style.display = 'block';
  bottomBar.style.display = 'flex';

  const itemsEl = document.getElementById('cart-items');
  itemsEl.innerHTML = cart.map(item => {
    const imgHtml = item.image
      ? `<img class="cart-item-img" src="${item.image}" alt="${item.name}">`
      : `<div class="cart-item-img" style="display:flex;align-items:center;justify-content:center;font-size:1.3rem;color:var(--text-dim)">${item.category_icon || '☕'}</div>`;

    return `
      <div class="cart-item">
        ${imgHtml}
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">₹${item.price} × ${item.quantity} = ₹${item.price * item.quantity}</div>
        </div>
        <div class="cart-item-qty">
          <div class="qty-control">
            <button class="qty-btn" onclick="updateQty(${item.id},-1)">−</button>
            <span class="qty-value">${item.quantity}</span>
            <button class="qty-btn" onclick="updateQty(${item.id},1)">+</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const { subtotal, deliveryFee, tax, total } = getCartTotals();
  document.getElementById('cart-subtotal').textContent = '₹' + subtotal;
  document.getElementById('cart-delivery').textContent = deliveryFee > 0 ? '₹' + deliveryFee : 'FREE';
  document.getElementById('cart-tax').textContent = '₹' + tax;
  document.getElementById('cart-total').textContent = '₹' + total;
  document.getElementById('bb-total').textContent = '₹' + total;
}

// ===== RENDER CHECKOUT =====
function renderCheckout() {
  const itemsEl = document.getElementById('checkout-items');
  itemsEl.innerHTML = cart.map(item => `
    <div class="checkout-item">
      <span>${item.name} × ${item.quantity}</span>
      <span>₹${item.price * item.quantity}</span>
    </div>
  `).join('');

  setOrderType(orderType);
  renderCheckoutTotals();
}

function renderCheckoutTotals() {
  const { total } = getCartTotals();
  const totalEl = document.getElementById('checkout-total');
  const bbEl = document.getElementById('bb-checkout-total');
  if (totalEl) totalEl.textContent = '₹' + total;
  if (bbEl) bbEl.textContent = '₹' + total;
}

// ===== PLACE ORDER =====
async function placeOrder() {
  const name = document.getElementById('cust-name').value.trim();
  const phone = document.getElementById('cust-phone').value.trim();
  const email = document.getElementById('cust-email').value.trim();

  if (!name) { showToast('Please enter your name'); document.getElementById('cust-name').focus(); return; }
  if (!phone || phone.length < 10) { showToast('Please enter a valid phone number'); document.getElementById('cust-phone').focus(); return; }
  if (cart.length === 0) { showToast('Your cart is empty'); return; }

  let address = '', landmark = '', city = '', pincode = '';
  if (orderType === 'delivery') {
    address = document.getElementById('cust-address').value.trim();
    landmark = document.getElementById('cust-landmark').value.trim();
    city = document.getElementById('cust-city').value.trim();
    pincode = document.getElementById('cust-pincode').value.trim();

    if (!address) { showToast('Please enter your address'); document.getElementById('cust-address').focus(); return; }
    if (!city) { showToast('Please enter your city'); document.getElementById('cust-city').focus(); return; }
    if (!pincode || pincode.length < 6) { showToast('Please enter a valid pincode'); document.getElementById('cust-pincode').focus(); return; }
  }

  const payment = document.querySelector('input[name="payment"]:checked').value;
  const { subtotal, deliveryFee, tax, total } = getCartTotals();

  document.getElementById('payment-modal').classList.add('active');
  document.getElementById('btn-place-order').disabled = true;

  await new Promise(r => setTimeout(r, 2000));

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: name, phone, email,
        order_type: orderType,
        address: orderType === 'delivery' ? { address, landmark, city, pincode } : null,
        items: cart, subtotal, delivery_fee: deliveryFee, tax, total,
        payment_method: payment
      })
    });

    const data = await res.json();
    document.getElementById('payment-modal').classList.remove('active');

    if (data.success) {
      document.getElementById('conf-order-id').textContent = '#' + String(data.orderId).padStart(4, '0');

      const typeLabel = orderType === 'delivery' ? '🚚 Delivery' : '🛍️ Pickup';
      const addrLine = orderType === 'delivery' ? `${address}, ${city} - ${pincode}` : 'Pickup from store';

      document.getElementById('conf-subtitle').textContent = orderType === 'delivery'
        ? 'Your order is being prepared and will be delivered soon!'
        : 'Your order is being prepared. Pick it up at the store!';

      document.getElementById('conf-details').innerHTML = `
        <div class="bill-row"><span>Name</span><span>${name}</span></div>
        <div class="bill-row"><span>Phone</span><span>${phone}</span></div>
        <div class="bill-row"><span>Type</span><span>${typeLabel}</span></div>
        <div class="bill-row"><span>${orderType === 'delivery' ? 'Address' : 'Pickup'}</span><span style="text-align:right;max-width:180px;font-size:0.8rem">${addrLine}</span></div>
        <div class="bill-row"><span>Payment</span><span style="text-transform:uppercase">${payment}</span></div>
        <div class="bill-row"><span>Items</span><span>${cart.reduce((s, c) => s + c.quantity, 0)}</span></div>
        <div class="bill-row bill-total"><span>Total Paid</span><span>₹${total}</span></div>
      `;

      navigateTo('confirmation');
    } else {
      showToast('Order failed. Please try again.');
    }
  } catch (e) {
    document.getElementById('payment-modal').classList.remove('active');
    showToast('Something went wrong. Try again.');
    console.error(e);
  }

  document.getElementById('btn-place-order').disabled = false;
}

// ===== RESET =====
function resetAndGoHome() {
  cart = [];
  activeCategory = null;
  orderType = 'delivery';
  updateCartBadge();
  ['cust-name','cust-phone','cust-email','cust-address','cust-landmark','cust-city','cust-pincode','search-input']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  navigateTo('landing');
}

// ===== TOAST =====
function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.remove('show');
  void toast.offsetWidth;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

// ===== HERO SLIDER =====
let currentSlide = 0;
let sliderInterval = null;

function goToSlide(index) {
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.dot');
  if (!slides.length) return;

  slides.forEach(s => s.classList.remove('active'));
  dots.forEach(d => d.classList.remove('active'));

  currentSlide = index;
  slides[currentSlide].classList.add('active');
  dots[currentSlide].classList.add('active');
}

function nextSlide() {
  const slides = document.querySelectorAll('.slide');
  if (!slides.length) return;
  goToSlide((currentSlide + 1) % slides.length);
}

function startSlider() {
  if (sliderInterval) clearInterval(sliderInterval);
  sliderInterval = setInterval(nextSlide, 4500);
}

// Touch swipe support for slider
(function initSliderTouch() {
  let startX = 0;
  const slider = document.getElementById('hero-slider');
  if (!slider) return;

  slider.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  slider.addEventListener('touchend', e => {
    const diff = startX - e.changedTouches[0].clientX;
    const slides = document.querySelectorAll('.slide');
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToSlide((currentSlide + 1) % slides.length);
      else goToSlide((currentSlide - 1 + slides.length) % slides.length);
      startSlider();
    }
  }, { passive: true });
})();

startSlider();

// Navbar scroll effect — transparent at top, solid when scrolled
(function initNavScroll() {
  const nav = document.querySelector('.home-nav');
  if (!nav) return;
  const hero = document.querySelector('.hero-slider');
  const threshold = hero ? hero.offsetHeight * 0.15 : 80;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > threshold);
  }, { passive: true });
})();
