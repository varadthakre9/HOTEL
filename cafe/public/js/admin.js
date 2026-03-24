// ===== ADMIN STATE =====
let adminToken = localStorage.getItem('admin_token');
let allCategories = [];

if (adminToken) showDashboard();

// ===== AUTH =====
async function doLogin() {
  const username = document.getElementById('login-user').value.trim();
  const password = document.getElementById('login-pass').value.trim();
  const errEl = document.getElementById('login-error');

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (data.success) {
      adminToken = data.token;
      localStorage.setItem('admin_token', adminToken);
      errEl.style.display = 'none';
      showDashboard();
    } else {
      errEl.style.display = 'block';
      errEl.textContent = data.error || 'Invalid credentials';
    }
  } catch (e) {
    errEl.style.display = 'block';
    errEl.textContent = 'Connection failed';
  }
}

function doLogout() {
  adminToken = null;
  localStorage.removeItem('admin_token');
  document.getElementById('admin-login').style.display = 'flex';
  document.getElementById('admin-app').classList.remove('active');
}

function showDashboard() {
  document.getElementById('admin-login').style.display = 'none';
  document.getElementById('admin-app').classList.add('active');
  loadStats();
  loadOrders();
  loadAdminMenu();
  loadCategoriesForSelect();
}

// ===== TABS =====
function switchTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');

  event.target.classList.add('active');
  document.getElementById('tab-' + tab).style.display = 'block';

  if (tab === 'dashboard') loadStats();
  if (tab === 'orders') loadOrders();
  if (tab === 'menu') loadAdminMenu();
}

// ===== STATS =====
async function loadStats() {
  try {
    const res = await fetch('/api/admin/stats');
    const data = await res.json();

    document.getElementById('stats-grid').innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Today's Orders</div>
        <div class="stat-value">${data.today.orders}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Today's Revenue</div>
        <div class="stat-value">₹${data.today.revenue.toLocaleString()}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">All Time Orders</div>
        <div class="stat-value">${data.allTime.orders}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">All Time Revenue</div>
        <div class="stat-value">₹${data.allTime.revenue.toLocaleString()}</div>
      </div>
    `;

    const popEl = document.getElementById('popular-items');
    if (data.topItems.length === 0) {
      popEl.innerHTML = '<p style="color:var(--text-secondary)">No orders today yet.</p>';
    } else {
      popEl.innerHTML = data.topItems.map((item, i) => `
        <div style="display:flex; justify-content:space-between; padding:0.6rem 0; border-bottom:1px solid var(--border); color:var(--text-secondary);">
          <span>${i + 1}. ${item.name}</span>
          <span style="color:var(--accent); font-weight:600;">${item.count} orders</span>
        </div>
      `).join('');
    }
  } catch (e) {
    console.error('Failed to load stats:', e);
  }
}

// ===== ORDERS =====
async function loadOrders() {
  try {
    const res = await fetch('/api/admin/orders');
    const orders = await res.json();

    const tbody = document.getElementById('orders-tbody');
    if (orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-secondary); padding:2rem;">No orders yet</td></tr>';
      return;
    }

    tbody.innerHTML = orders.map(order => {
      const time = new Date(order.created_at + 'Z').toLocaleString();
      const itemSummary = order.items.map(i => `${i.name} ×${i.quantity}`).join(', ');
      const typeIcon = order.order_type === 'delivery' ? '🚚' : '🛍️';
      const addrLine = order.order_type === 'delivery' && order.address
        ? `${order.address.address}, ${order.address.city} - ${order.address.pincode}`
        : 'Pickup from store';

      return `
        <tr>
          <td>#${String(order.id).padStart(4, '0')}</td>
          <td>
            <strong>${order.customer_name}</strong>
            <br><small style="color:var(--text-secondary)">${order.phone || ''}</small>
            <br><small style="color:var(--accent)">${typeIcon} ${order.order_type || 'delivery'}</small>
            ${order.order_type === 'delivery' && order.address ? `<br><small style="color:var(--text-secondary);font-size:0.75rem">${addrLine}</small>` : ''}
          </td>
          <td style="max-width:200px; font-size:0.82rem; color:var(--text-secondary)">${itemSummary}</td>
          <td style="font-weight:600; color:var(--accent)">₹${order.total}</td>
          <td style="text-transform:uppercase; font-size:0.8rem">${order.payment_method}</td>
          <td><span class="status-badge ${order.status}">${order.status}</span></td>
          <td style="font-size:0.8rem; color:var(--text-secondary)">${time}</td>
          <td>
            <select class="status-select" onchange="updateOrderStatus(${order.id}, this.value)">
              <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option>
              <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>Ready</option>
              <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
            </select>
          </td>
        </tr>
      `;
    }).join('');
  } catch (e) {
    console.error('Failed to load orders:', e);
  }
}

async function updateOrderStatus(id, status) {
  try {
    await fetch(`/api/admin/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    loadOrders();
    loadStats();
  } catch (e) {
    console.error('Failed to update status:', e);
  }
}

// ===== ADMIN MENU =====
async function loadAdminMenu() {
  try {
    const res = await fetch('/api/admin/menu');
    const items = await res.json();

    const grid = document.getElementById('admin-menu-grid');
    if (items.length === 0) {
      grid.innerHTML = '<p style="color:var(--text-secondary)">No menu items. Add your first item!</p>';
      return;
    }

    grid.innerHTML = items.map(item => {
      const imgHtml = item.image
        ? `<img src="${item.image}" alt="${item.name}">`
        : `<div style="width:70px;height:70px;border-radius:10px;background:var(--bg-surface);display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0">☕</div>`;

      return `
        <div class="admin-menu-card">
          ${imgHtml}
          <div class="admin-menu-info">
            <h4>${item.name}</h4>
            <div class="price">₹${item.price}</div>
            <div class="cat">${item.category_name || 'Uncategorized'} ${item.is_veg ? '🟢' : '🔴'}</div>
          </div>
          <div class="admin-menu-actions">
            <button onclick="openEditItemModal(${item.id}, '${item.name.replace(/'/g, "\\'")}', '${(item.description || '').replace(/'/g, "\\'")}', ${item.price}, ${item.category_id}, ${item.is_veg})" title="Edit">✏️</button>
            <button class="delete" onclick="deleteItem(${item.id}, '${item.name.replace(/'/g, "\\'")}')" title="Delete">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (e) {
    console.error('Failed to load admin menu:', e);
  }
}

async function loadCategoriesForSelect() {
  try {
    const res = await fetch('/api/categories');
    allCategories = await res.json();
    const select = document.getElementById('item-category');
    select.innerHTML = allCategories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
  } catch (e) {
    console.error(e);
  }
}

// ===== ADD/EDIT MODAL =====
function openAddItemModal() {
  document.getElementById('modal-title').textContent = 'Add New Item';
  document.getElementById('edit-item-id').value = '';
  document.getElementById('item-name').value = '';
  document.getElementById('item-desc').value = '';
  document.getElementById('item-price').value = '';
  document.getElementById('item-veg').value = '1';
  document.getElementById('item-image').value = '';
  document.getElementById('item-modal').classList.add('active');
}

function openEditItemModal(id, name, desc, price, catId, isVeg) {
  document.getElementById('modal-title').textContent = 'Edit Item';
  document.getElementById('edit-item-id').value = id;
  document.getElementById('item-name').value = name;
  document.getElementById('item-desc').value = desc;
  document.getElementById('item-price').value = price;
  document.getElementById('item-category').value = catId;
  document.getElementById('item-veg').value = isVeg;
  document.getElementById('item-image').value = '';
  document.getElementById('item-modal').classList.add('active');
}

function closeItemModal() {
  document.getElementById('item-modal').classList.remove('active');
}

async function saveItem() {
  const id = document.getElementById('edit-item-id').value;
  const formData = new FormData();
  formData.append('name', document.getElementById('item-name').value.trim());
  formData.append('description', document.getElementById('item-desc').value.trim());
  formData.append('price', document.getElementById('item-price').value);
  formData.append('category_id', document.getElementById('item-category').value);
  formData.append('is_veg', document.getElementById('item-veg').value);
  formData.append('is_available', '1');

  const imageFile = document.getElementById('item-image').files[0];
  if (imageFile) formData.append('image', imageFile);

  const name = document.getElementById('item-name').value.trim();
  if (!name) return alert('Please enter item name');
  if (!document.getElementById('item-price').value) return alert('Please enter price');

  try {
    const url = id ? `/api/admin/menu/${id}` : '/api/admin/menu';
    const method = id ? 'PUT' : 'POST';
    await fetch(url, { method, body: formData });
    closeItemModal();
    loadAdminMenu();
  } catch (e) {
    alert('Failed to save item');
    console.error(e);
  }
}

async function deleteItem(id, name) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
  try {
    await fetch(`/api/admin/menu/${id}`, { method: 'DELETE' });
    loadAdminMenu();
  } catch (e) {
    alert('Failed to delete');
    console.error(e);
  }
}
