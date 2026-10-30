/**
 * DiyaMart Fashion & Apparel — Unified Storefront & Store Admin Web Application
 * Connected to SQLite Database via REST API
 */

// Application State
const state = {
  products: [],
  categories: {},
  cart: JSON.parse(localStorage.getItem('diyamart_fashion_cart') || '[]'),
  stores: [],
  customers: [],
  activeCustomer: null,
  selectedBranch: 1,
  currentTab: 'hub',
  activeCategory: 'all',
  activeSubcategory: null,
  searchQuery: '',
  sortBy: 'id_asc',
  lastPlacedOrderId: null,
  customerOrders: [],

  // Admin Portal State
  isAdminLoggedIn: sessionStorage.getItem('diyamart_admin_token') === 'true',
  currentAdminSection: 'inventory',
  adminInventory: [],
  adminBillingOrders: [],
  adminReturns: [],
  currentMathChallenge: { question: '', answer: 0 },
  selectedInvoiceOrder: null
};

const DEFAULT_APPAREL_IMAGE = '/images/products/product_1.jpg';

// SVG Icon Assets
const ICONS = {
  user: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
  phone: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`,
  email: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`,
  location: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
  star: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
  reward: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>`,
  shield: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
  edit: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px;"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`,
  print: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px;"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>`,
  check: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle; margin-right: 3px;"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  exchange: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 3px;"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`,
  card: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px;"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>`,
  lock: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`
};

// Generic API Fetch Helper
async function api(endpoint, options = {}) {
  try {
    const res = await fetch(endpoint, options);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    showToast(error.message, 'error');
    throw error;
  }
}

// Convert Number to Words Helper (for Tax Invoices)
function numberToWords(num) {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  num = Math.floor(num || 0);
  if (num === 0) return 'Zero Rupees Only';
  function convert(n) {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
  }
  return convert(num) + ' Rupees Only';
}

// ==========================================================
// Initialization
// ==========================================================
document.addEventListener('DOMContentLoaded', async () => {
  updateCartBadge();
  await loadStores();
  await loadCustomers();
  initCustomerAuth();
  await loadCategories();
  await loadProducts();

  // Route according to URL hash, defaulting to 'shop' (DiyaMart Fashion Store)
  const initialHash = window.location.hash ? window.location.hash.replace('#', '') : '';
  if (initialHash && document.getElementById(`tab-${initialHash}`)) {
    switchTab(initialHash);
  } else {
    switchTab('shop');
  }

  // Handle browser back/forward navigation
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash ? window.location.hash.replace('#', '') : 'shop';
    if (document.getElementById(`tab-${hash}`) && state.currentTab !== hash) {
      switchTab(hash);
    }
  });
});

function goToDiyaHub() {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage('return_to_hub', '*');
  } else {
    window.location.href = '/';
  }
}



// ==========================================================
// Customer Authentication & Header Profile System
// ==========================================================
function initCustomerAuth() {
  const savedUserJson = localStorage.getItem('diyamart_logged_user');
  if (savedUserJson) {
    try {
      const user = JSON.parse(savedUserJson);
      state.activeCustomer = user;
    } catch (e) {
      state.activeCustomer = null;
    }
  }

  updateCustomerAuthUI();
}

function updateCustomerAuthUI() {
  const loginBtn = document.getElementById('navLoginBtn');
  const userBadge = document.getElementById('activeCustomerBadge');
  const userNameEl = document.getElementById('activeCustomerName');
  const adminBtn = document.getElementById('navAdminBtn');

  if (state.activeCustomer) {
    // User is Logged In:
    if (loginBtn) loginBtn.style.display = 'none';
    if (userBadge) userBadge.style.display = 'flex';
    if (userNameEl) {
      userNameEl.textContent = `${state.activeCustomer.first_name} (${state.activeCustomer.city || 'Member'})`;
    }
    // REQUIREMENT: Show Store Admin button ONLY after login
    if (adminBtn) adminBtn.style.display = 'inline-flex';

    populateCheckoutCustomers();
  } else {
    // User is NOT Logged In (Guest State):
    if (loginBtn) loginBtn.style.display = 'flex';
    if (userBadge) userBadge.style.display = 'none';
    // REQUIREMENT: Hide Store Admin button when not logged in
    if (adminBtn) adminBtn.style.display = 'none';

    populateCheckoutCustomers();
  }
}

function openLoginModal() {
  populateQuickProfiles();
  document.getElementById('customerLoginModal').classList.add('active');
}

function closeLoginModal() {
  document.getElementById('customerLoginModal').classList.remove('active');
}

function populateQuickProfiles() {
  const select = document.getElementById('quickProfileSelect');
  if (!select) return;

  select.innerHTML = '<option value="">-- Or Choose Existing Profile --</option>' + 
    state.customers.map(c => `
      <option value="${c.customer_id}">${c.first_name} ${c.last_name} (${c.city} • Tier: ${c.customer_segment})</option>
    `).join('');
}

function onQuickProfileSelect(customerId) {
  if (!customerId) return;
  const cust = state.customers.find(c => c.customer_id === parseInt(customerId));
  if (cust) {
    document.getElementById('loginCustomerName').value = `${cust.first_name} ${cust.last_name}`;
    document.getElementById('loginCustomerPhone').value = cust.phone || '';
    if (cust.city) {
      const citySelect = document.getElementById('loginCustomerCity');
      if (citySelect) citySelect.value = cust.city;
    }
  }
}

async function submitCustomerLogin() {
  const name = document.getElementById('loginCustomerName').value.trim();
  const phone = document.getElementById('loginCustomerPhone').value.trim();
  const city = document.getElementById('loginCustomerCity').value;

  if (!name) {
    showToast('Please enter your name', 'error');
    return;
  }

  try {
    const res = await api('/api/customers/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, city })
    });

    state.activeCustomer = res.customer;
    localStorage.setItem('diyamart_logged_user', JSON.stringify(res.customer));
    updateCustomerAuthUI();
    closeLoginModal();

    await loadCustomers();
    showToast(res.message);

    if (state.currentTab === 'account') {
      renderAccountTab();
    }
  } catch (e) {
    showToast(`Login failed: ${e.message}`, 'error');
  }
}

function openCustomerProfileModal() {
  if (!state.activeCustomer) {
    openLoginModal();
    return;
  }

  const c = state.activeCustomer;
  const modalBody = document.getElementById('modalCustomerProfileBody');
  if (modalBody) {
    modalBody.innerHTML = `
      <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 20px; background: var(--bg-subtle); padding: 16px; border-radius: var(--radius-md);">
        <div style="width: 56px; height: 56px; border-radius: var(--radius-full); background: var(--primary-gradient); color: #fff; display: flex; align-items: center; justify-content: center;">
          ${ICONS.user}
        </div>
        <div>
          <h3 style="margin: 0; font-size: 18px;">${c.first_name} ${c.last_name}</h3>
          <div style="font-size: 13px; color: var(--text-muted); margin-top: 2px;">
            ${ICONS.email} ${c.email || 'Registered Shopper'} &nbsp;|&nbsp; ${ICONS.phone} ${c.phone || 'N/A'}
          </div>
          <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
            ${ICONS.location} Preferred Boutique: <strong>${c.city || 'Chennai'}</strong> &nbsp;|&nbsp; Member Since: <strong>${c.signup_date || '2026'}</strong>
          </div>
        </div>
      </div>

      <div class="kpi-grid" style="grid-template-columns: repeat(2, 1fr); margin-bottom: 16px;">
        <div class="kpi-card">
          <div class="kpi-icon" style="background: #fdf2f8; color: #db2777;">
            ${ICONS.star}
          </div>
          <div class="kpi-details">
            <span class="kpi-label">Membership Tier</span>
            <span class="kpi-value" style="font-size: 16px;">${c.customer_segment || 'Silver Member'}</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background: #fef3c7; color: #d97706;">
            ${ICONS.reward}
          </div>
          <div class="kpi-details">
            <span class="kpi-label">Loyalty Balance</span>
            <span class="kpi-value" style="font-size: 18px;">${c.loyalty_points || 0} pts</span>
          </div>
        </div>
      </div>

      <div style="background: var(--bg-main); border: 1px solid var(--border-color); padding: 12px 16px; border-radius: var(--radius-md); font-size: 13px;">
        <strong>Fashion Club Privilege:</strong> Earn 1 loyalty point for every ₹100 spent. Verified store admin access enabled for active members.
      </div>
    `;
  }

  document.getElementById('customerProfileModal').classList.add('active');
}

function closeCustomerProfileModal() {
  document.getElementById('customerProfileModal').classList.remove('active');
}

function logoutCustomer() {
  localStorage.removeItem('diyamart_logged_user');
  sessionStorage.removeItem('diyamart_admin_token');
  state.activeCustomer = null;
  state.isAdminLoggedIn = false;
  updateCustomerAuthUI();
  closeCustomerProfileModal();
  showToast('Logged out successfully');
  switchTab('shop');
}

// ==========================================================
// Navigation & Tab Switching
// ==========================================================
function switchTab(tabId) {
  // If attempting to open admin tab directly without auth
  if (tabId === 'admin') {
    if (!state.activeCustomer) {
      showToast('Please log in first to access Store Admin', 'error');
      openLoginModal();
      return;
    }
    if (!state.isAdminLoggedIn) {
      openAdminAuthModal();
      return;
    }
  }

  state.currentTab = tabId;
  document.querySelectorAll('.tab-view').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

  // Header is HIDDEN on Dashboard (Hub) and VISIBLE inside DiyaMart
  if (tabId === 'hub') {
    document.body.classList.add('in-hub');
  } else {
    document.body.classList.remove('in-hub');
  }

  const targetTab = document.getElementById(`tab-${tabId}`);
  const targetBtn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
  
  if (targetTab) targetTab.classList.add('active');
  if (targetBtn) targetBtn.classList.add('active');

  // Update URL hash without reload
  if (window.location.hash !== `#${tabId}`) {
    if (history.replaceState) {
      history.replaceState(null, null, `#${tabId}`);
    } else {
      window.location.hash = `#${tabId}`;
    }
  }

  // Update brand header subtitle
  const brandSub = document.getElementById('brandSubTitle');
  if (brandSub) {
    if (tabId === 'hub') {
      brandSub.textContent = 'Unified Super-App & Services';
    } else {
      brandSub.textContent = 'DiyaMart — Apparel, Couture & Lifestyle';
    }
  }

  // Lazy load data per tab
  if (tabId === 'account') {
    renderAccountTab();
  } else if (tabId === 'stores') {
    renderCustomerStoreCards();
  } else if (tabId === 'admin') {
    loadAdminSection(state.currentAdminSection);
  }
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================================
// Ecosystem Coming Soon Notification
// ==========================================================
function showComingSoonToast(serviceName) {
  showToast(`⏳ ${serviceName} is coming soon! For now, explore our active DiyaMart fashion store.`);
}

// ==========================================================
// Store Admin Math Security Challenge & Portal Access
// ==========================================================
function handleAdminNavClick() {
  if (!state.activeCustomer) {
    showToast('Please log in first to access Store Admin', 'error');
    openLoginModal();
    return;
  }

  if (state.isAdminLoggedIn) {
    switchTab('admin');
  } else {
    openAdminAuthModal();
  }
}

function generateMathChallenge() {
  const operations = ['+', '-', '×'];
  const op = operations[Math.floor(Math.random() * operations.length)];
  let n1, n2, ans;

  if (op === '+') {
    n1 = Math.floor(Math.random() * 25) + 6;
    n2 = Math.floor(Math.random() * 20) + 4;
    ans = n1 + n2;
  } else if (op === '-') {
    n1 = Math.floor(Math.random() * 30) + 15;
    n2 = Math.floor(Math.random() * (n1 - 5)) + 3;
    ans = n1 - n2;
  } else {
    n1 = Math.floor(Math.random() * 9) + 3;
    n2 = Math.floor(Math.random() * 8) + 2;
    ans = n1 * n2;
  }

  state.currentMathChallenge = {
    question: `What is ${n1} ${op} ${n2} = ?`,
    answer: ans
  };

  const questionEl = document.getElementById('mathQuestionText');
  const answerInput = document.getElementById('mathAnswerInput');
  const errorEl = document.getElementById('mathErrorMsg');

  if (questionEl) questionEl.textContent = state.currentMathChallenge.question;
  if (answerInput) {
    answerInput.value = '';
    answerInput.focus();
  }
  if (errorEl) errorEl.style.display = 'none';
}

function openAdminAuthModal() {
  generateMathChallenge();
  document.getElementById('adminAuthModal').classList.add('active');
}

function closeAdminAuthModal() {
  document.getElementById('adminAuthModal').classList.remove('active');
}

function submitAdminMathChallenge() {
  const inputEl = document.getElementById('mathAnswerInput');
  const errorEl = document.getElementById('mathErrorMsg');
  const userAnswer = parseInt(inputEl.value);

  if (isNaN(userAnswer)) {
    if (errorEl) {
      errorEl.textContent = 'Please enter a valid number';
      errorEl.style.display = 'block';
    }
    return;
  }

  if (userAnswer === state.currentMathChallenge.answer) {
    // Verified successfully
    state.isAdminLoggedIn = true;
    sessionStorage.setItem('diyamart_admin_token', 'true');
    closeAdminAuthModal();
    showToast('Security challenge verified! Welcome to Store Admin Hub');
    switchTab('admin');
  } else {
    // Incorrect answer
    if (errorEl) {
      errorEl.textContent = `Incorrect answer (${userAnswer}). Please calculate carefully.`;
      errorEl.style.display = 'block';
    }
    inputEl.classList.add('shake');
    setTimeout(() => {
      inputEl.classList.remove('shake');
      generateMathChallenge();
    }, 1200);
  }
}

function logoutAdmin() {
  state.isAdminLoggedIn = false;
  sessionStorage.removeItem('diyamart_admin_token');
  showToast('Store Admin session locked');
  switchTab('shop');
}

// ==========================================================
// Admin Portal Management (3 Sections: Inventory, Billing, Returns)
// ==========================================================
function switchAdminSection(sectionName) {
  state.currentAdminSection = sectionName;
  document.querySelectorAll('.admin-section-content').forEach(sec => sec.classList.remove('active'));
  document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));

  const targetSec = document.getElementById(`admin-sec-${sectionName}`);
  const targetBtn = document.querySelector(`.admin-tab-btn[data-admin-sec="${sectionName}"]`);

  if (targetSec) targetSec.classList.add('active');
  if (targetBtn) targetBtn.classList.add('active');

  loadAdminSection(sectionName);
}

function loadAdminSection(sectionName) {
  if (sectionName === 'inventory') {
    loadAdminInventory();
  } else if (sectionName === 'billing') {
    loadAdminBilling();
  } else if (sectionName === 'returns') {
    loadAdminReturns();
  }
}

// ----------------------------------------------------------
// ADMIN SECTION 1: Store Inventory (All 144 Records & All Details)
// ----------------------------------------------------------
async function loadAdminInventory(showFeedback = false) {
  const tbody = document.getElementById('adminInventoryTableBody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="15" class="text-center">Loading live store inventory records...</td></tr>';

  try {
    const storeFilter = document.getElementById('adminInvStoreFilter')?.value || 'all';
    let url = '/api/inventory';
    if (storeFilter && storeFilter !== 'all') {
      url += `?store_id=${storeFilter}`;
    }

    state.adminInventory = await api(url);
    renderAdminInventory(state.adminInventory);
    updateInventoryKPIs(state.adminInventory);
    if (showFeedback) showToast('Live stock inventory refreshed');
  } catch (e) {
    if (tbody) tbody.innerHTML = '<tr><td colspan="15" class="text-center error-msg">Failed to load inventory data.</td></tr>';
  }
}

function updateInventoryKPIs(invList) {
  let totalStock = 0;
  let lowStockCount = 0;
  let totalSold = 0;
  let totalDamaged = 0;

  invList.forEach(item => {
    totalStock += item.closing_qty || 0;
    totalSold += item.sold_qty || 0;
    totalDamaged += item.damaged_qty || 0;
    if ((item.closing_qty || 0) <= (item.reorder_level || 0)) {
      lowStockCount++;
    }
  });

  const stockEl = document.getElementById('adminInvTotalStock');
  const lowEl = document.getElementById('adminInvLowStock');
  const soldEl = document.getElementById('adminInvTotalSold');
  const damEl = document.getElementById('adminInvDamaged');

  if (stockEl) stockEl.textContent = totalStock.toLocaleString('en-IN');
  if (lowEl) lowEl.textContent = lowStockCount;
  if (soldEl) soldEl.textContent = totalSold.toLocaleString('en-IN');
  if (damEl) damEl.textContent = totalDamaged.toLocaleString('en-IN');
}

function filterAdminInventory() {
  const storeId = document.getElementById('adminInvStoreFilter')?.value || 'all';
  const search = document.getElementById('adminInvSearch')?.value.toLowerCase().trim() || '';
  const levelFilter = document.getElementById('adminInvLevelFilter')?.value || 'all';

  let filtered = state.adminInventory;

  if (storeId !== 'all') {
    filtered = filtered.filter(i => i.store_id === parseInt(storeId));
  }

  if (search) {
    filtered = filtered.filter(i => 
      i.product_name.toLowerCase().includes(search) ||
      i.sku.toLowerCase().includes(search) ||
      i.brand.toLowerCase().includes(search) ||
      i.category.toLowerCase().includes(search) ||
      (i.subcategory && i.subcategory.toLowerCase().includes(search)) ||
      i.store_name.toLowerCase().includes(search)
    );
  }

  if (levelFilter === 'low') {
    filtered = filtered.filter(i => (i.closing_qty || 0) <= (i.reorder_level || 0));
  } else if (levelFilter === 'healthy') {
    filtered = filtered.filter(i => (i.closing_qty || 0) > (i.reorder_level || 0));
  }

  renderAdminInventory(filtered);
  updateInventoryKPIs(filtered);
}

function renderAdminInventory(invList) {
  const tbody = document.getElementById('adminInventoryTableBody');
  const countEl = document.getElementById('adminInvResultsCount');

  if (countEl) countEl.textContent = `Showing all ${invList.length} inventory line records`;
  if (!tbody) return;

  if (invList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="15" class="text-center">No inventory matching the selected filters.</td></tr>';
    return;
  }

  tbody.innerHTML = invList.map((item, idx) => {
    const isLow = (item.closing_qty || 0) <= (item.reorder_level || 0);
    const isOut = (item.closing_qty || 0) === 0;
    
    let stockBadge = `<span class="status-badge delivered"><span class="status-dot green"></span> ${item.closing_qty} In-Stock</span>`;
    if (isOut) {
      stockBadge = `<span class="status-badge shipped"><span class="status-dot red"></span> Out of Stock</span>`;
    } else if (isLow) {
      stockBadge = `<span class="status-badge processing"><span class="status-dot yellow"></span> Reorder (${item.closing_qty})</span>`;
    }

    const unitPrice = item.unit_price || 0;
    const totalVal = unitPrice * (item.closing_qty || 0);

    return `
      <tr>
        <td class="text-center" style="color: var(--text-muted); font-size: 11.5px;">${idx + 1}</td>
        <td><code>#INV-${item.inventory_id}</code></td>
        <td><code>${item.sku}</code></td>
        <td>
          <div class="table-product-cell">
            <img src="${item.image_url || `/images/products/product_${item.product_id}.jpg`}" alt="${item.product_name}" class="table-product-thumb" loading="lazy" onerror="this.onerror=null; this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%23f1f5f9%22/><text x=%2250%22 y=%2250%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%2394a3b8%22 font-size=%2212%22>DM</text></svg>'">
            <div>
              <strong>${item.product_name}</strong>
              <div style="font-size: 11.5px; color: var(--text-muted);">${item.brand} • ${item.subcategory || ''}</div>
            </div>
          </div>
        </td>
        <td><span class="cat-badge">${item.category}</span></td>
        <td>
          <strong>${item.store_name}</strong>
          <div style="font-size: 11.5px; color: var(--text-muted);">${item.city}</div>
        </td>
        <td><strong>₹${unitPrice.toFixed(2)}</strong></td>
        <td>${item.opening_qty || 0}</td>
        <td>${item.received_qty || 0}</td>
        <td>${item.sold_qty || 0}</td>
        <td>${item.damaged_qty || 0}</td>
        <td>${stockBadge}</td>
        <td><code>${item.reorder_level || 20}</code></td>
        <td><strong>₹${totalVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="openAdjustStockModal(${item.inventory_id})" title="Adjust stock levels">
            ${ICONS.edit} Adjust
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function openAdjustStockModal(inventoryId) {
  const inv = state.adminInventory.find(i => i.inventory_id === inventoryId);
  if (!inv) return;

  document.getElementById('adjustInventoryId').value = inv.inventory_id;
  document.getElementById('adjustProductName').value = `${inv.sku} — ${inv.product_name} (${inv.brand})`;
  document.getElementById('adjustStoreName').value = `${inv.store_name} (${inv.city})`;
  document.getElementById('adjustClosingQty').value = inv.closing_qty;
  document.getElementById('adjustReorderLevel').value = inv.reorder_level;
  document.getElementById('adjustReceivedQty').value = inv.received_qty || 0;
  document.getElementById('adjustDamagedQty').value = inv.damaged_qty || 0;

  document.getElementById('adjustStockModal').classList.add('active');
}

function closeAdjustStockModal() {
  document.getElementById('adjustStockModal').classList.remove('active');
}

async function submitStockAdjustment() {
  const inventoryId = parseInt(document.getElementById('adjustInventoryId').value);
  const closing_qty = parseInt(document.getElementById('adjustClosingQty').value);
  const reorder_level = parseInt(document.getElementById('adjustReorderLevel').value);
  const received_qty = parseInt(document.getElementById('adjustReceivedQty').value);
  const damaged_qty = parseInt(document.getElementById('adjustDamagedQty').value);

  try {
    await api(`/api/inventory/${inventoryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ closing_qty, reorder_level, received_qty, damaged_qty })
    });

    closeAdjustStockModal();
    showToast('Stock quantity updated successfully');
    await loadAdminInventory();
  } catch (e) {
    showToast(`Update failed: ${e.message}`, 'error');
  }
}

// ----------------------------------------------------------
// ADMIN SECTION 2: Billing & Invoices (All Details & Columns)
// ----------------------------------------------------------
async function loadAdminBilling(showFeedback = false) {
  const tbody = document.getElementById('adminBillingTableBody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="15" class="text-center">Fetching complete live purchase billing register...</td></tr>';

  try {
    state.adminBillingOrders = await api('/api/orders?limit=1000');
    renderAdminBilling(state.adminBillingOrders);
    updateBillingKPIs(state.adminBillingOrders);
    if (showFeedback) showToast('Live billing data refreshed');
  } catch (e) {
    if (tbody) tbody.innerHTML = '<tr><td colspan="15" class="text-center error-msg">Failed to load billing records.</td></tr>';
  }
}

function updateBillingKPIs(orders) {
  let totalRevenue = 0;
  let totalTax = 0;

  orders.forEach(o => {
    totalRevenue += o.net_amount || 0;
    totalTax += o.tax_amount || 0;
  });

  const totalCount = orders.length;
  const avgValue = totalCount > 0 ? totalRevenue / totalCount : 0;

  const countEl = document.getElementById('adminBillTotalCount');
  const revEl = document.getElementById('adminBillTotalRevenue');
  const taxEl = document.getElementById('adminBillTotalTax');
  const avgEl = document.getElementById('adminBillAvgValue');

  if (countEl) countEl.textContent = totalCount.toLocaleString('en-IN');
  if (revEl) revEl.textContent = `₹${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (taxEl) taxEl.textContent = `₹${totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (avgEl) avgEl.textContent = `₹${avgValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function filterAdminBilling() {
  const search = document.getElementById('adminBillSearch')?.value.toLowerCase().trim() || '';
  const channel = document.getElementById('adminBillChannelFilter')?.value || 'all';
  const status = document.getElementById('adminBillStatusFilter')?.value || 'all';

  let filtered = state.adminBillingOrders;

  if (channel !== 'all') {
    filtered = filtered.filter(o => o.channel === channel);
  }

  if (status !== 'all') {
    filtered = filtered.filter(o => o.order_status === status);
  }

  if (search) {
    filtered = filtered.filter(o => 
      String(o.order_id).includes(search) ||
      (o.first_name && o.first_name.toLowerCase().includes(search)) ||
      (o.last_name && o.last_name.toLowerCase().includes(search)) ||
      (o.customer_phone && o.customer_phone.includes(search)) ||
      (o.customer_email && o.customer_email.toLowerCase().includes(search)) ||
      (o.store_name && o.store_name.toLowerCase().includes(search)) ||
      (o.transaction_ref && o.transaction_ref.toLowerCase().includes(search))
    );
  }

  renderAdminBilling(filtered);
}

function renderAdminBilling(orders) {
  const tbody = document.getElementById('adminBillingTableBody');
  const countEl = document.getElementById('adminBillResultsCount');

  if (countEl) countEl.textContent = `Showing all ${orders.length} billed purchases`;
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="15" class="text-center">No billing records found matching filters.</td></tr>';
    return;
  }

  tbody.innerHTML = orders.map((o, idx) => {
    const custName = `${o.first_name || 'Customer'} ${o.last_name || ''}`;
    const statusClass = (o.order_status || 'delivered').toLowerCase();
    const invoiceNo = `DM-INV-2026-${String(o.order_id).padStart(6, '0')}`;

    return `
      <tr>
        <td class="text-center" style="color: var(--text-muted); font-size: 11.5px;">${idx + 1}</td>
        <td><strong>#${o.order_id}</strong></td>
        <td><code>${invoiceNo}</code></td>
        <td>
          <div style="font-size: 13px; font-weight: 600;">${o.order_date}</div>
        </td>
        <td>
          <strong>${custName}</strong>
          <div style="font-size: 11.5px; color: var(--text-muted);">Tier: <strong>${o.customer_segment || 'Member'}</strong></div>
        </td>
        <td>
          <div style="font-size: 12px;">${ICONS.phone} ${o.customer_phone || 'N/A'}</div>
          <div style="font-size: 11.5px; color: var(--text-muted);">${ICONS.email} ${o.customer_email || 'N/A'}</div>
        </td>
        <td>
          <strong>${o.store_name || 'Chennai Flagship'}</strong>
          <div style="font-size: 11.5px; color: var(--text-muted);">${o.store_city || 'Chennai'}</div>
        </td>
        <td><span class="badge">${o.channel || 'Web'}</span></td>
        <td>₹${(o.gross_amount || o.net_amount).toFixed(2)}</td>
        <td style="color: var(--success-color);">-₹${(o.discount_amount || 0).toFixed(2)}</td>
        <td>₹${(o.tax_amount || 0).toFixed(2)}</td>
        <td>
          <span style="font-size: 15px; font-weight: 800; color: var(--primary-dark);">
            ₹${(o.net_amount || 0).toFixed(2)}
          </span>
        </td>
        <td>
          <strong>${o.payment_method || 'UPI'}</strong>
          <div style="font-size: 11px; color: var(--success-color); font-weight: 700;">PAID (<code>${o.transaction_ref || 'TXN' + o.order_id}</code>)</div>
        </td>
        <td>
          <span class="status-badge ${statusClass}">${o.order_status}</span>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${o.delivery_partner || 'Express'}</div>
        </td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="openInvoiceModal(${o.order_id})" title="Print Official GST Tax Invoice PDF">
            ${ICONS.print} Print Bill (PDF)
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// ----------------------------------------------------------
// ADMIN SECTION 3: Return and Exchange (All Details & Columns)
// ----------------------------------------------------------
async function loadAdminReturns(showFeedback = false) {
  const tbody = document.getElementById('adminReturnsTableBody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="14" class="text-center">Loading all customer garment return and exchange records...</td></tr>';

  try {
    state.adminReturns = await api('/api/returns');
    renderAdminReturns(state.adminReturns);
    updateReturnsKPIs(state.adminReturns);
    if (showFeedback) showToast('Return requests refreshed');
  } catch (e) {
    if (tbody) tbody.innerHTML = '<tr><td colspan="14" class="text-center error-msg">Failed to load return requests.</td></tr>';
  }
}

function updateReturnsKPIs(returns) {
  let totalRefund = 0;
  let approvedCount = 0;
  let pendingCount = 0;

  returns.forEach(r => {
    totalRefund += r.refund_amount || 0;
    const status = (r.return_status || '').toLowerCase();
    if (status.includes('approved') || status.includes('refund')) {
      approvedCount++;
    } else if (status.includes('pending')) {
      pendingCount++;
    }
  });

  const totalEl = document.getElementById('adminRetTotalCount');
  const appEl = document.getElementById('adminRetApprovedCount');
  const pendEl = document.getElementById('adminRetPendingCount');
  const refEl = document.getElementById('adminRetTotalRefund');
  const counterBadge = document.getElementById('adminReturnsCounter');

  if (totalEl) totalEl.textContent = returns.length;
  if (appEl) appEl.textContent = approvedCount;
  if (pendEl) pendEl.textContent = pendingCount;
  if (refEl) refEl.textContent = `₹${totalRefund.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (counterBadge) counterBadge.textContent = pendingCount;
}

function filterAdminReturns() {
  const statusFilter = document.getElementById('adminRetStatusFilter')?.value || 'all';
  const search = document.getElementById('adminRetSearch')?.value.toLowerCase().trim() || '';

  let filtered = state.adminReturns;

  if (statusFilter !== 'all') {
    filtered = filtered.filter(r => r.return_status === statusFilter);
  }

  if (search) {
    filtered = filtered.filter(r => 
      String(r.return_id).includes(search) ||
      String(r.order_id).includes(search) ||
      (r.customer_name && r.customer_name.toLowerCase().includes(search)) ||
      (r.customer_phone && r.customer_phone.includes(search)) ||
      (r.customer_email && r.customer_email.toLowerCase().includes(search)) ||
      (r.product_name && r.product_name.toLowerCase().includes(search)) ||
      (r.sku && r.sku.toLowerCase().includes(search)) ||
      (r.return_reason && r.return_reason.toLowerCase().includes(search))
    );
  }

  renderAdminReturns(filtered);
}

function renderAdminReturns(returns) {
  const tbody = document.getElementById('adminReturnsTableBody');
  const countEl = document.getElementById('adminRetResultsCount');

  if (countEl) countEl.textContent = `Showing all ${returns.length} return / exchange requests`;
  if (!tbody) return;

  if (returns.length === 0) {
    tbody.innerHTML = '<tr><td colspan="14" class="text-center">No return requests found matching filters.</td></tr>';
    return;
  }

  tbody.innerHTML = returns.map((r, idx) => {
    let statusClass = 'delivered';
    const status = (r.return_status || '').toLowerCase();
    if (status.includes('pending')) statusClass = 'processing';
    else if (status.includes('reject')) statusClass = 'shipped';

    return `
      <tr>
        <td class="text-center" style="color: var(--text-muted); font-size: 11.5px;">${idx + 1}</td>
        <td><strong>#RET-${r.return_id}</strong></td>
        <td><code>#ITM-${r.order_item_id}</code></td>
        <td>
          <a href="javascript:void(0)" onclick="openInvoiceModal(${r.order_id})" style="font-weight:700; color: var(--primary);">
            #${r.order_id}
          </a>
        </td>
        <td>
          <strong>${r.product_name}</strong>
          <div style="font-size: 11.5px; color: var(--text-muted);">${r.brand || ''} • SKU: <code>${r.sku || 'N/A'}</code></div>
        </td>
        <td><span class="cat-badge">${r.category || 'Apparel'}</span></td>
        <td><strong>${r.customer_name || 'Customer'}</strong></td>
        <td>
          <div style="font-size: 12px;">${ICONS.phone} ${r.customer_phone || 'N/A'}</div>
          <div style="font-size: 11.5px; color: var(--text-muted);">${ICONS.email} ${r.customer_email || 'N/A'}</div>
        </td>
        <td>${r.request_date || 'Today'}</td>
        <td><span style="font-size: 13px; color: var(--text-secondary); font-weight: 500;">${r.return_reason}</span></td>
        <td><strong>₹${(r.refund_amount || 0).toFixed(2)}</strong></td>
        <td>${r.refund_date || '<span style="color: var(--text-muted);">Pending</span>'}</td>
        <td><span class="status-badge ${statusClass}">${r.return_status}</span></td>
        <td>
          <div style="display: flex; gap: 4px;">
            <button class="btn btn-sm btn-primary" style="padding: 4px 8px; font-size: 11px;" onclick="updateReturnStatus(${r.return_id}, 'Approved & Refunded')" title="Approve Refund">
              ${ICONS.check} Refund
            </button>
            <button class="btn btn-sm btn-outline" style="padding: 4px 8px; font-size: 11px;" onclick="updateReturnStatus(${r.return_id}, 'Exchange Dispatched')" title="Send Replacement">
              ${ICONS.exchange} Exchange
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function updateReturnStatus(returnId, newStatus) {
  try {
    await api(`/api/returns/${returnId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ return_status: newStatus })
    });

    showToast(`Return #${returnId} status updated to: ${newStatus}`);
    await loadAdminReturns();
  } catch (e) {
    showToast(`Failed to update return: ${e.message}`, 'error');
  }
}

// ==========================================================
// Comprehensive GST Tax Invoice Generation & PDF Printing
// ==========================================================
async function openInvoiceModal(orderId) {
  const container = document.getElementById('invoiceSheetContent');
  if (container) container.innerHTML = '<div class="loading-spinner">Generating official GST Tax Invoice with complete transaction details...</div>';
  document.getElementById('invoiceModal').classList.add('active');

  try {
    const data = await api(`/api/orders/${orderId}`);
    const o = data.order;
    const items = data.items;
    state.selectedInvoiceOrder = data;

    const invoiceNo = `DM-INV-2026-${String(o.order_id).padStart(6, '0')}`;
    const custName = `${o.first_name || 'Valued'} ${o.last_name || 'Customer'}`;
    const storeName = o.store_name || 'DiyaMart Flagship Boutique';
    const storeCity = o.store_city || 'Chennai';
    const stateName = storeCity === 'Bengaluru' ? 'Karnataka' : (storeCity === 'Mumbai' ? 'Maharashtra' : 'Tamil Nadu');
    const stateCode = storeCity === 'Bengaluru' ? '29' : (storeCity === 'Mumbai' ? '27' : '33');

    let totalQty = 0;
    let itemRowsHtml = items.map((itm, idx) => {
      totalQty += (itm.quantity || 1);
      const taxable = itm.line_amount - (itm.tax_amount || 0);
      const cgst = ((itm.tax_amount || 0) / 2).toFixed(2);
      const sgst = ((itm.tax_amount || 0) / 2).toFixed(2);

      return `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td>
            <strong>${itm.product_name}</strong>
            <div style="font-size: 11px; color: #555;">Brand: <strong>${itm.brand}</strong> | Category: ${itm.category} • ${itm.subcategory || ''}</div>
          </td>
          <td><code>${itm.sku || '6204.00'}</code></td>
          <td class="text-center"><strong>${itm.quantity}</strong></td>
          <td class="text-right">₹${itm.unit_price.toFixed(2)}</td>
          <td class="text-right">₹${taxable.toFixed(2)}</td>
          <td class="text-right">2.5% (₹${cgst})</td>
          <td class="text-right">2.5% (₹${sgst})</td>
          <td class="text-right"><strong>₹${itm.line_amount.toFixed(2)}</strong></td>
        </tr>
      `;
    }).join('');

    const cgstTotal = ((o.tax_amount || 0) / 2).toFixed(2);
    const sgstTotal = ((o.tax_amount || 0) / 2).toFixed(2);
    const netAmountWords = numberToWords(o.net_amount);

    container.innerHTML = `
      <div class="tax-invoice-printable">
        <!-- Invoice Header -->
        <div class="inv-header">
          <div class="inv-brand-box">
            <div class="inv-logo" style="background: linear-gradient(135deg, #e11d48, #9f1239); color: #fff; font-size: 20px; font-weight: 800; border-radius: 8px; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(225,29,72,0.3);">DM</div>
            <div>
              <div class="inv-company-name">DIYAMART FASHION & APPAREL RETAIL PRIVATE LIMITED</div>
              <div class="inv-company-details">
                GSTIN: <strong>33AABCD1234F1Z5</strong> | CIN: <strong>U52100TN2026PTC089765</strong> | PAN: <strong>AABCD1234F</strong><br>
                Branch: <strong>${storeName}</strong>, High Street Avenue, ${storeCity}, State: <strong>${stateName} (Code: ${stateCode})</strong><br>
                Support: support@diyamart.com | Web: www.diyamart.com | Toll-Free: 1800-419-3492
              </div>
            </div>
          </div>
          <div class="inv-type-box">
            <div class="inv-type-title">TAX INVOICE / CASH BILL</div>
            <div class="inv-type-subtitle">ORIGINAL FOR RECIPIENT</div>
            <div style="font-size: 11px; color: #059669; font-weight: 700; margin-top: 4px;">GST COMPLIANT RETAIL INVOICE</div>
          </div>
        </div>

        <hr class="inv-divider">

        <!-- Invoice Info Meta Grid -->
        <div class="inv-meta-grid">
          <div class="inv-meta-col">
            <div class="inv-meta-label">Billed & Delivered To (Customer):</div>
            <div class="inv-meta-val"><strong>${custName}</strong></div>
            <div class="inv-meta-sub">Phone: <strong>${o.customer_phone || 'N/A'}</strong></div>
            <div class="inv-meta-sub">Email: <strong>${o.customer_email || 'N/A'}</strong></div>
            <div class="inv-meta-sub">Delivery Address: ${o.customer_city || storeCity}, ${stateName}, India</div>
            <div class="inv-meta-sub">Customer Membership: <strong>${o.customer_segment || 'Fashion Club Member'}</strong></div>
          </div>

          <div class="inv-meta-col">
            <div class="inv-meta-row"><span>Invoice Number:</span> <strong>${invoiceNo}</strong></div>
            <div class="inv-meta-row"><span>Order Reference ID:</span> <strong>#${o.order_id}</strong></div>
            <div class="inv-meta-row"><span>Invoice Date & Time:</span> <strong>${o.order_date}</strong></div>
            <div class="inv-meta-row"><span>Sales Channel:</span> <strong>${o.channel || 'Web Application'}</strong></div>
            <div class="inv-meta-row"><span>Fulfillment Boutique:</span> <strong>${storeName}</strong></div>
            <div class="inv-meta-row"><span>Payment Status:</span> <strong style="color: #059669;">PAID FULLY</strong></div>
          </div>
        </div>

        <!-- Line Items Table -->
        <table class="inv-items-table">
          <thead>
            <tr>
              <th class="text-center" style="width: 30px;">#</th>
              <th>Description of Garment / Apparel</th>
              <th>HSN / SKU</th>
              <th class="text-center">Qty</th>
              <th class="text-right">Unit Rate</th>
              <th class="text-right">Taxable Amt</th>
              <th class="text-right">CGST (2.5%)</th>
              <th class="text-right">SGST (2.5%)</th>
              <th class="text-right">Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${itemRowsHtml}
          </tbody>
        </table>

        <!-- Summary Calculation Area -->
        <div class="inv-summary-section">
          <div class="inv-summary-left">
            <div class="inv-payment-box">
              <strong>Payment & Delivery Receipt:</strong><br>
              Mode: <strong>${o.payment_method || 'UPI (Instant Settlement)'}</strong><br>
              TXN Reference: <code>${o.transaction_ref || 'TXN000' + o.order_id}</code><br>
              Delivery Logistics: <strong>${o.delivery_partner || 'DiyaExpress'}</strong> (${o.delivery_status || 'Delivered'})<br>
              Total Apparel Units: <strong>${totalQty} items</strong>
            </div>

            <div style="background: #fff; border: 1px dashed #cbd5e1; padding: 8px 12px; margin-top: 10px; font-size: 11.5px; border-radius: 4px;">
              <strong>Amount in Words:</strong><br>
              <em style="color: #0f172a; font-weight: 600;">${netAmountWords}</em>
            </div>
          </div>

          <div class="inv-summary-right">
            <div class="inv-calc-row">
              <span>Gross Total Amount:</span>
              <span>₹${(o.gross_amount || o.net_amount).toFixed(2)}</span>
            </div>
            <div class="inv-calc-row">
              <span>Multi-Buy Discount:</span>
              <span style="color: #059669;">-₹${(o.discount_amount || 0).toFixed(2)}</span>
            </div>
            <div class="inv-calc-row">
              <span>CGST (Central Tax 2.5%):</span>
              <span>₹${cgstTotal}</span>
            </div>
            <div class="inv-calc-row">
              <span>SGST (State Tax 2.5%):</span>
              <span>₹${sgstTotal}</span>
            </div>
            <div class="inv-calc-row">
              <span>Delivery / Shipping Fee:</span>
              <span>${o.delivery_fee === 0 || !o.delivery_fee ? 'FREE (₹0.00)' : '₹' + o.delivery_fee.toFixed(2)}</span>
            </div>
            <div class="inv-calc-row total">
              <span>Grand Net Payable:</span>
              <span>₹${(o.net_amount || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <!-- Invoice Signatory & Footer -->
        <div class="inv-footer-box">
          <div class="inv-qr-code">
            <div style="font-size: 16px; font-weight: 800; color: #0f172a; border: 2px solid #0f172a; padding: 6px 10px; display: inline-block; border-radius: 4px;">[QR VERIFIED]</div>
            <div style="font-size: 10px; color: #475569; font-weight: 600; margin-top: 4px;">Official E-Invoice Verification</div>
          </div>

          <div style="font-size: 11px; color: #64748b; max-width: 320px; text-align: center;">
            * 7-day hassle-free size exchange and boutique trials valid across all DiyaMart Flagship Boutiques.
          </div>

          <div class="inv-auth-sign">
            <div style="font-size: 11px; color: #555; margin-bottom: 25px;">For DIYAMART FASHION & APPAREL RETAIL PVT LTD</div>
            <div class="sign-line">Authorized Signatory / Boutique Cashier</div>
          </div>
        </div>
      </div>
    `;
  } catch (e) {
    if (container) container.innerHTML = '<div class="error-msg">Failed to load invoice details.</div>';
  }
}

function closeInvoiceModal() {
  document.getElementById('invoiceModal').classList.remove('active');
}

function printInvoice() {
  window.print();
}

// ==========================================================
// Store & Customer Data Context
// ==========================================================
async function loadStores() {
  try {
    state.stores = await api('/api/stores');
    const branchSelect = document.getElementById('branchSelect');
    const checkoutStoreSelect = document.getElementById('checkoutStoreSelect');
    const adminStoreFilter = document.getElementById('adminInvStoreFilter');
    
    if (state.stores.length > 0) {
      const optionsHtml = state.stores.map(s => 
        `<option value="${s.store_id}">${s.store_name} (${s.city})</option>`
      ).join('');
      
      if (branchSelect) {
        branchSelect.innerHTML = optionsHtml;
        branchSelect.value = state.selectedBranch;
      }
      if (checkoutStoreSelect) {
        checkoutStoreSelect.innerHTML = optionsHtml;
        checkoutStoreSelect.value = state.selectedBranch;
      }
      if (adminStoreFilter) {
        adminStoreFilter.innerHTML = '<option value="all">All Boutiques (All 3 Stores)</option>' + state.stores.map(s => 
          `<option value="${s.store_id}">${s.store_name} (${s.city})</option>`
        ).join('');
      }
    }
  } catch (e) {
    console.error('Failed to load stores', e);
  }
}

async function loadCustomers() {
  try {
    state.customers = await api('/api/customers');
  } catch (e) {
    console.error('Failed to load customers', e);
  }
}

function populateCheckoutCustomers() {
  const select = document.getElementById('checkoutCustomerSelect');
  if (!select) return;

  if (state.activeCustomer) {
    select.innerHTML = `
      <option value="${state.activeCustomer.customer_id}" selected>
        ${state.activeCustomer.first_name} ${state.activeCustomer.last_name} (${state.activeCustomer.city} • Tier: ${state.activeCustomer.customer_segment || 'Silver'})
      </option>
    ` + state.customers.filter(c => c.customer_id !== state.activeCustomer.customer_id).map(c => `
      <option value="${c.customer_id}">
        ${c.first_name} ${c.last_name} (${c.city} • Tier: ${c.customer_segment})
      </option>
    `).join('');
  } else {
    select.innerHTML = state.customers.map(c => `
      <option value="${c.customer_id}">
        ${c.first_name} ${c.last_name} (${c.city} • Tier: ${c.customer_segment})
      </option>
    `).join('');
  }
}

function onBranchChange(val) {
  state.selectedBranch = parseInt(val);
  const s = state.stores.find(item => item.store_id === state.selectedBranch);
  
  // Sync all store dropdowns
  const branchSelect = document.getElementById('branchSelect');
  const checkoutStoreSelect = document.getElementById('checkoutStoreSelect');
  if (branchSelect) branchSelect.value = state.selectedBranch;
  if (checkoutStoreSelect) checkoutStoreSelect.value = state.selectedBranch;

  showToast(`Active boutique switched to: ${s?.store_name || 'Store ' + val} (${s?.city || ''})`);
  loadProducts();
}

// ==========================================================
// Collections & Catalog
// ==========================================================
async function loadCategories() {
  try {
    state.categories = await api('/api/categories');
    renderCategoryPills();
  } catch (e) {
    console.error('Failed to load categories', e);
  }
}

function renderCategoryPills() {
  const container = document.getElementById('categoryChips');
  if (!container) return;
  
  let totalCount = 0;
  Object.values(state.categories).forEach(subs => {
    subs.forEach(s => totalCount += s.count);
  });
  
  const heroProdCount = document.getElementById('heroProductCount');
  if (heroProdCount) heroProdCount.textContent = totalCount;
  
  let html = `
    <button class="chip ${state.activeCategory === 'all' ? 'active' : ''}" onclick="selectCategory('all')">
      <span>All Collections</span>
      <span class="chip-count">${totalCount}</span>
    </button>
  `;
  
  for (const [cat, subcats] of Object.entries(state.categories)) {
    const catTotal = subcats.reduce((acc, curr) => acc + curr.count, 0);
    html += `
      <button class="chip ${state.activeCategory === cat ? 'active' : ''}" onclick="selectCategory('${cat}')">
        <span>${cat}</span>
        <span class="chip-count">${catTotal}</span>
      </button>
    `;
  }
  container.innerHTML = html;
  renderSubcategories();
}

function selectCategory(cat) {
  state.activeCategory = cat;
  state.activeSubcategory = null;
  renderCategoryPills();
  loadProducts();
}

function renderSubcategories() {
  const subcatContainer = document.getElementById('subcatPills');
  if (!subcatContainer) return;
  
  if (state.activeCategory === 'all' || !state.categories[state.activeCategory]) {
    subcatContainer.innerHTML = '';
    return;
  }
  
  const subs = state.categories[state.activeCategory];
  let html = `
    <span class="subcat-pill ${state.activeSubcategory === null ? 'active' : ''}" onclick="selectSubcategory(null)">
      All ${state.activeCategory}
    </span>
  `;
  
  subs.forEach(s => {
    html += `
      <span class="subcat-pill ${state.activeSubcategory === s.name ? 'active' : ''}" onclick="selectSubcategory('${s.name}')">
        ${s.name} (${s.count})
      </span>
    `;
  });
  subcatContainer.innerHTML = html;
}

function selectSubcategory(sub) {
  state.activeSubcategory = sub;
  renderSubcategories();
  loadProducts();
}

async function loadProducts() {
  const grid = document.getElementById('productGrid');
  if (grid) {
    grid.innerHTML = '<div class="loading-spinner" style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">Loading apparel collections...</div>';
  }

  let url = `/api/products?sort=${state.sortBy}`;
  if (state.selectedBranch) {
    url += `&store_id=${state.selectedBranch}`;
  }
  if (state.activeCategory && state.activeCategory !== 'all') {
    url += `&category=${encodeURIComponent(state.activeCategory)}`;
  }
  if (state.activeSubcategory) {
    url += `&subcategory=${encodeURIComponent(state.activeSubcategory)}`;
  }
  if (state.searchQuery) {
    url += `&search=${encodeURIComponent(state.searchQuery)}`;
  }

  try {
    state.products = await api(url);
    renderProducts();
  } catch (e) {
    if (grid) grid.innerHTML = '<div class="error-msg">Failed to load apparel products. Please check server.</div>';
  }
}

function renderProducts() {
  const grid = document.getElementById('productGrid');
  const countEl = document.getElementById('resultsCount');
  const currentStore = state.stores.find(s => s.store_id === state.selectedBranch);
  const storeCityLabel = currentStore ? currentStore.city : 'Hub';
  
  if (countEl) countEl.textContent = `Showing all ${state.products.length} curated apparel styles (${currentStore ? currentStore.store_name : 'All Hubs'})`;
  if (!grid) return;

  if (state.products.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <h3>No apparel styles found</h3>
        <p>Try clearing your search query or choosing another fashion category.</p>
        <button class="btn btn-outline" onclick="clearSearch(); selectCategory('all');" style="margin-top: 12px;">Reset Filters</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = state.products.map(p => {
    const isLowStock = p.total_stock <= (p.avg_reorder_level * 1.5);
    const stockClass = isLowStock ? 'low-stock' : 'in-stock';
    const stockText = isLowStock 
      ? `Low Stock (${p.total_stock} in ${p.store_city || storeCityLabel})` 
      : `In Stock (${p.total_stock} in ${p.store_city || storeCityLabel})`;
    
    const sizes = p.category === 'Footwear' ? ['UK 7', 'UK 8', 'UK 9', 'UK 10'] : ['S', 'M', 'L', 'XL'];
    const sizeTags = sizes.map(sz => `<span class="size-pill">${sz}</span>`).join(' ');
    const imgSrc = p.image_url || `/images/products/product_${p.product_id}.jpg`;

    return `
      <div class="product-card">
        <div class="product-card-img-wrap" onclick="openProductModal(${p.product_id})" title="Click to view ${p.product_name}">
          <img src="${imgSrc}" alt="${p.product_name}" class="product-card-img" loading="lazy" onerror="this.onerror=null; this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%23f1f5f9%22/><text x=%2250%22 y=%2250%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%2394a3b8%22 font-size=%2212%22>DiyaMart</text></svg>'">
          <span class="product-card-overlay-badge">${p.category}</span>
          <span class="product-card-sku-badge">${p.sku}</span>
          <span class="product-card-quick-view-btn">Quick View</span>
        </div>

        <div class="product-card-body">
          <div>
            <div class="card-top">
              <span class="brand-label">${p.brand}</span>
              <span class="cat-badge">${p.subcategory}</span>
            </div>
            <div class="product-info-block">
              <h3 class="product-title" title="${p.product_name}">${p.product_name}</h3>
            </div>
            <div class="sizes-box">
              <span class="size-label">Sizes:</span> ${sizeTags}
            </div>
          </div>

          <div>
            <div class="product-meta">
              <div class="price-box">
                <span class="price-val">₹${p.unit_price.toFixed(2)}</span>
                <span class="tax-tag">+${p.tax_pct || 0}% GST</span>
              </div>
              <span class="stock-indicator ${stockClass}">${stockText}</span>
            </div>

            <div class="product-actions">
              <button class="btn btn-outline" onclick="openProductModal(${p.product_id})">
                Details
              </button>
              <button class="btn btn-primary" onclick="addToCart(${p.product_id})">
                + Add to Bag
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Search & Sort Handlers
let searchDebounce = null;
function handleSearch(val) {
  clearTimeout(searchDebounce);
  state.searchQuery = val.trim();
  const clearBtn = document.getElementById('clearSearchBtn');
  if (clearBtn) clearBtn.style.display = state.searchQuery ? 'block' : 'none';
  
  searchDebounce = setTimeout(() => {
    loadProducts();
  }, 250);
}

function clearSearch() {
  const input = document.getElementById('searchInput');
  if (input) input.value = '';
  state.searchQuery = '';
  const clearBtn = document.getElementById('clearSearchBtn');
  if (clearBtn) clearBtn.style.display = 'none';
  loadProducts();
}

function handleSort(val) {
  state.sortBy = val;
  loadProducts();
}

// ==========================================================
// Product Quick View Modal
// ==========================================================
async function openProductModal(productId) {
  try {
    const data = await api(`/api/products/${productId}`);
    const p = data.product;
    const inv = data.inventory;
    
    document.getElementById('modalProductName').textContent = p.product_name;
    const modalBody = document.getElementById('modalProductBody');
    
    let invRowsHtml = inv.map(i => `
      <tr>
        <td><strong>${i.store_name}</strong> (${i.city})</td>
        <td>${i.closing_qty} units available</td>
        <td><span class="stock-indicator ${i.closing_qty > 15 ? 'in-stock' : 'low-stock'}">${i.closing_qty > 15 ? 'In Stock' : 'Selling Fast'}</span></td>
      </tr>
    `).join('');

    const imgSrc = p.image_url || `/images/products/product_${p.product_id}.jpg`;
    const sizes = p.category === 'Footwear' ? ['UK 7', 'UK 8', 'UK 9', 'UK 10'] : ['S', 'M', 'L', 'XL', 'XXL'];
    const sizeTags = sizes.map(sz => `<span class="size-pill" style="font-size: 12px; padding: 3px 10px;">${sz}</span>`).join(' ');

    modalBody.innerHTML = `
      <div class="modal-product-layout">
        <div class="modal-product-img-wrap">
          <img src="${imgSrc}" alt="${p.product_name}" class="modal-product-img" onerror="this.onerror=null; this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%23f1f5f9%22/><text x=%2250%22 y=%2250%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%2394a3b8%22 font-size=%2212%22>DiyaMart</text></svg>'">
        </div>

        <div style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="background: var(--bg-subtle); padding: 18px 22px; border-radius: var(--radius-md); margin-bottom: 18px; border: 1px solid var(--border-color);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span class="brand-label" style="font-size: 14px;">${p.brand}</span>
                <span class="cat-badge">${p.category} › ${p.subcategory}</span>
              </div>
              <h3 style="font-size: 22px; margin: 0 0 8px; color: var(--bg-dark); font-weight: 800; line-height: 1.3;">${p.product_name}</h3>
              <div style="font-size: 13.5px; color: var(--text-muted); margin-bottom: 12px;">
                Item SKU: <code>${p.sku}</code> • Tax: <strong>${p.tax_pct}% GST</strong>
              </div>
              <div style="font-size: 28px; font-weight: 800; color: var(--primary-dark);">
                ₹${p.unit_price.toFixed(2)} <span style="font-size: 13px; color: var(--text-muted); font-weight: normal;">(All Inclusive)</span>
              </div>
            </div>

            <div style="margin-bottom: 18px;">
              <div style="font-size: 13px; font-weight: 700; color: var(--text-secondary); margin-bottom: 8px;">Select Garment Size:</div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">${sizeTags}</div>
            </div>

            <h4 style="margin: 18px 0 10px; font-size: 14px; font-weight: 700; color: var(--bg-dark);">In-Store Boutique Stock Availability</h4>
            <div class="table-responsive" style="margin-bottom: 16px;">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Boutique Branch</th>
                    <th>Stock Count</th>
                    <th>Availability Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${invRowsHtml || '<tr><td colspan="3" class="text-center">Available for express home delivery</td></tr>'}
                </tbody>
              </table>
            </div>

            <div style="background: var(--bg-subtle); padding: 12px 16px; border-radius: 8px; font-size: 13px; color: var(--text-secondary); border-left: 3px solid var(--primary);">
              <strong>Guaranteed Quality:</strong> 100% Authentic apparel directly from verified textile mills. 7-day easy size exchange available.
            </div>
          </div>

          <div style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px;">
            <button class="btn btn-outline" onclick="closeProductModal();" style="padding: 10px 20px;">Close</button>
            <button class="btn btn-primary" onclick="addToCart(${p.product_id}); closeProductModal();" style="padding: 10px 24px; font-size: 14px;">
              + Add to Bag (₹${p.unit_price.toFixed(2)})
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('productModal').classList.add('active');
  } catch (e) {
    console.error('Error viewing product', e);
  }
}

function closeProductModal() {
  const modal = document.getElementById('productModal');
  if (modal) {
    modal.classList.remove('active');
    const card = modal.querySelector('.modal-card');
    if (card) card.classList.remove('fullscreen');
  }
}

function toggleModalFullscreen(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  const card = modal.querySelector('.modal-card');
  if (card) {
    card.classList.toggle('fullscreen');
  }
}

// ==========================================================
// Shopping Bag Operations
// ==========================================================
function saveCart() {
  localStorage.setItem('diyamart_fashion_cart', JSON.stringify(state.cart));
  updateCartBadge();
  renderCartDrawer();
}

function updateCartBadge() {
  const count = state.cart.reduce((sum, itm) => sum + itm.quantity, 0);
  const badge = document.getElementById('cartBadgeCount');
  const drawerCount = document.getElementById('cartDrawerCount');
  if (badge) badge.textContent = count;
  if (drawerCount) drawerCount.textContent = count;
}

function addToCart(productId) {
  const prod = state.products.find(p => p.product_id === productId);
  if (!prod) return;

  const existing = state.cart.find(i => i.product_id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({
      product_id: prod.product_id,
      product_name: prod.product_name,
      brand: prod.brand,
      category: prod.category,
      subcategory: prod.subcategory,
      unit_price: prod.unit_price,
      tax_pct: prod.tax_pct || 0,
      image_url: prod.image_url || `/images/products/product_${prod.product_id}.jpg`,
      quantity: 1
    });
  }

  saveCart();
  showToast(`Added "${prod.product_name}" to bag`);
}

function updateCartItemQty(productId, delta) {
  const item = state.cart.find(i => i.product_id === productId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    state.cart = state.cart.filter(i => i.product_id !== productId);
  }
  saveCart();
}

function removeCartItem(productId) {
  state.cart = state.cart.filter(i => i.product_id !== productId);
  saveCart();
}

function clearCart() {
  state.cart = [];
  saveCart();
  showToast('Shopping bag cleared');
}

function toggleCartDrawer(show = null) {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  
  const isCurrentlyOpen = drawer.classList.contains('active');
  const shouldOpen = show !== null ? show : !isCurrentlyOpen;

  if (shouldOpen) {
    renderCartDrawer();
    drawer.classList.add('active');
    overlay.classList.add('active');
  } else {
    drawer.classList.remove('active');
    overlay.classList.remove('active');
  }
}

function renderCartDrawer() {
  const container = document.getElementById('cartDrawerItems');
  const footer = document.getElementById('cartDrawerFooter');
  if (!container) return;

  if (state.cart.length === 0) {
    container.innerHTML = `
      <div class="empty-cart">
        <h4>Your shopping bag is empty</h4>
        <p>Explore our fashion collections and add your favorite apparel items.</p>
        <button class="btn btn-primary" onclick="toggleCartDrawer(false); switchTab('shop');">Start Shopping</button>
      </div>
    `;
    if (footer) footer.style.display = 'none';
    return;
  }

  let grossTotal = 0;
  let taxTotal = 0;
  let discountTotal = 0;

  let itemsHtml = state.cart.map(itm => {
    const itemGross = itm.unit_price * itm.quantity;
    const itemDisc = itm.quantity > 1 ? itemGross * 0.05 : 0;
    const itemTax = (itemGross - itemDisc) * ((itm.tax_pct || 0) / 100);
    const itemNet = itemGross - itemDisc + itemTax;
    const imgSrc = itm.image_url || `/images/products/product_${itm.product_id}.jpg`;

    grossTotal += itemGross;
    discountTotal += itemDisc;
    taxTotal += itemTax;

    return `
      <div class="cart-item">
        <img src="${imgSrc}" alt="${itm.product_name}" class="cart-item-thumb" onerror="this.onerror=null; this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%23f1f5f9%22/><text x=%2250%22 y=%2250%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%2394a3b8%22 font-size=%2212%22>DM</text></svg>'">
        <div class="cart-item-details" style="flex: 1; min-width: 0;">
          <div class="cart-item-title">${itm.product_name}</div>
          <div class="cart-item-brand">${itm.brand} • ${itm.category}</div>
          <div class="cart-item-price">₹${itm.unit_price.toFixed(2)} × ${itm.quantity} = ₹${itemNet.toFixed(2)}</div>
        </div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="updateCartItemQty(${itm.product_id}, -1)">-</button>
          <span class="qty-val">${itm.quantity}</span>
          <button class="qty-btn" onclick="updateCartItemQty(${itm.product_id}, 1)">+</button>
          <button class="remove-btn" onclick="removeCartItem(${itm.product_id})" title="Remove item">&times;</button>
        </div>
      </div>
    `;
  }).join('');

  const netTotal = grossTotal - discountTotal + taxTotal;

  container.innerHTML = itemsHtml;
  if (footer) {
    footer.style.display = 'block';
    document.getElementById('cartGrossAmount').textContent = `₹${grossTotal.toFixed(2)}`;
    document.getElementById('cartDiscountAmount').textContent = `-₹${discountTotal.toFixed(2)}`;
    document.getElementById('cartTaxAmount').textContent = `₹${taxTotal.toFixed(2)}`;
    document.getElementById('cartTotalAmount').textContent = `₹${netTotal.toFixed(2)}`;
  }
}

// ==========================================================
// Checkout & Order Placement
// ==========================================================
function openCheckoutModal() {
  if (state.cart.length === 0) return;
  toggleCartDrawer(false);

  let gross = 0, tax = 0, disc = 0;
  state.cart.forEach(i => {
    const g = i.unit_price * i.quantity;
    const d = i.quantity > 1 ? g * 0.05 : 0;
    const t = (g - d) * ((i.tax_pct || 0) / 100);
    gross += g; disc += d; tax += t;
  });
  const net = gross - disc + tax;

  const count = state.cart.reduce((s, i) => s + i.quantity, 0);
  document.getElementById('checkoutItemsCount').textContent = `${count} garment unit${count > 1 ? 's' : ''}`;
  document.getElementById('checkoutFinalAmount').textContent = `₹${net.toFixed(2)}`;

  populateCheckoutCustomers();
  document.getElementById('checkoutModal').classList.add('active');
}

function closeCheckoutModal() {
  document.getElementById('checkoutModal').classList.remove('active');
}

async function submitOrder() {
  const customerId = parseInt(document.getElementById('checkoutCustomerSelect').value) || 1;
  const storeId = parseInt(document.getElementById('checkoutStoreSelect').value);
  const channel = document.getElementById('checkoutChannelSelect').value;
  const paymentMethod = document.getElementById('checkoutPaymentSelect').value;
  const deliveryPartner = document.getElementById('checkoutDeliveryPartner').value;

  const orderPayload = {
    customer_id: customerId,
    store_id: storeId,
    channel: channel,
    payment_method: paymentMethod,
    delivery_partner: deliveryPartner,
    items: state.cart.map(i => ({
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price: i.unit_price
    }))
  };

  const btn = document.getElementById('placeOrderBtn');
  btn.disabled = true;
  btn.innerHTML = 'Placing Order...';

  try {
    const res = await api('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });

    closeCheckoutModal();
    clearCart();

    state.lastPlacedOrderId = res.order_id;
    document.getElementById('successOrderId').textContent = `#${res.order_id}`;
    document.getElementById('successOrderAmount').textContent = `₹${res.net_amount.toFixed(2)}`;
    document.getElementById('successTxnRef').textContent = res.transaction_ref;
    document.getElementById('successModal').classList.add('active');

    await loadCustomers();
    showToast(res.message);

    // Live refresh billing table in background
    if (state.adminBillingOrders.length > 0) {
      loadAdminBilling();
    }
  } catch (e) {
    showToast(`Order failed: ${e.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>Confirm & Place Order</span>';
  }
}

function closeSuccessModal() {
  document.getElementById('successModal').classList.remove('active');
}

function trackNewOrderFromModal() {
  closeSuccessModal();
  if (state.lastPlacedOrderId) {
    switchTab('track');
    quickTrack(state.lastPlacedOrderId);
  }
}

// ==========================================================
// Order Tracking System
// ==========================================================
function quickTrack(orderId) {
  const input = document.getElementById('trackInput');
  if (input) input.value = orderId;
  trackOrder(orderId);
}

function trackOrderFromInput() {
  const input = document.getElementById('trackInput');
  if (!input || !input.value.trim()) return;
  trackOrder(input.value.trim());
}

async function trackOrder(query) {
  const container = document.getElementById('trackResultContainer');
  if (!container) return;

  container.innerHTML = '<div class="loading-spinner">Searching for your order details...</div>';

  try {
    const data = await api(`/api/track/${encodeURIComponent(query)}`);
    const o = data.order;
    const items = data.items;

    let isDelivered = o.delivery_status === 'Delivered';
    let isDispatched = o.delivery_status === 'In Transit' || isDelivered;
    let isConfirmed = true;

    let itemsHtml = items.map(i => {
      const imgSrc = i.image_url || `/images/products/product_${i.product_id}.jpg`;
      return `
        <div class="order-item-row" style="display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-bottom: 1px solid var(--border-color); gap: 14px;">
          <div style="display: flex; align-items: center; gap: 14px; min-width: 0;">
            <img src="${imgSrc}" alt="${i.product_name}" class="order-item-thumb" onerror="this.onerror=null; this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%23f1f5f9%22/><text x=%2250%22 y=%2250%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%2394a3b8%22 font-size=%2212%22>DM</text></svg>'">
            <div>
              <div style="font-weight: 700; font-size: 15px;">${i.product_name}</div>
              <div style="font-size: 13px; color: var(--text-muted); margin-top: 2px;">${i.brand} • ${i.category} • SKU: <code>${i.sku}</code></div>
            </div>
          </div>
          <div style="text-align: right; flex-shrink: 0;">
            <div>${i.quantity} × ₹${i.unit_price.toFixed(2)}</div>
            <div style="font-weight: 700; color: var(--primary-dark); font-size: 15px;">₹${i.line_amount.toFixed(2)}</div>
            <button class="btn btn-link" style="font-size: 12px; padding: 0; margin-top: 2px;" onclick="openExchangeModal(${i.order_item_id})">Exchange Size</button>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="card order-card">
        <div class="order-header-row">
          <div>
            <div class="order-main-title">Order #${o.order_id}</div>
            <div class="order-sub-title">Placed on ${o.order_date} via <strong>${o.channel}</strong></div>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <button class="btn btn-sm btn-outline" onclick="openInvoiceModal(${o.order_id})">
              ${ICONS.print} View & Print Bill
            </button>
            <span class="status-badge ${o.order_status.toLowerCase()}">${o.order_status}</span>
          </div>
        </div>

        <!-- Tracking Timeline -->
        <div class="tracking-timeline">
          <div class="timeline-step done">
            <div class="step-dot">1</div>
            <div class="step-label">Order Placed</div>
            <div class="step-time">${o.order_date.split(' ')[0]}</div>
          </div>
          <div class="timeline-line ${isConfirmed ? 'done' : ''}"></div>
          <div class="timeline-step ${isConfirmed ? 'done' : ''}">
            <div class="step-dot">2</div>
            <div class="step-label">Confirmed</div>
            <div class="step-time">${o.payment_method} (${o.payment_proc_status || 'Paid'})</div>
          </div>
          <div class="timeline-line ${isDispatched ? 'done' : ''}"></div>
          <div class="timeline-step ${isDispatched ? 'done' : ''}">
            <div class="step-dot">3</div>
            <div class="step-label">Dispatched</div>
            <div class="step-time">${o.delivery_partner || 'Courier'}</div>
          </div>
          <div class="timeline-line ${isDelivered ? 'done' : ''}"></div>
          <div class="timeline-step ${isDelivered ? 'done' : ''}">
            <div class="step-dot">4</div>
            <div class="step-label">Delivered</div>
            <div class="step-time">${o.delivered_at ? o.delivered_at.split(' ')[0] : 'In Progress'}</div>
          </div>
        </div>

        <!-- Order Information Columns -->
        <div class="order-details-grid">
          <div class="info-block">
            <h4>Delivery Recipient</h4>
            <div class="info-row"><span>Name:</span> <strong>${o.first_name} ${o.last_name}</strong></div>
            <div class="info-row"><span>Phone:</span> <strong>${o.customer_phone || 'N/A'}</strong></div>
            <div class="info-row"><span>Email:</span> <strong>${o.customer_email || 'N/A'}</strong></div>
            <div class="info-row"><span>City:</span> <strong>${o.customer_city || 'N/A'}</strong></div>
          </div>

          <div class="info-block">
            <h4>Delivery Partner</h4>
            <div class="info-row"><span>Courier:</span> <strong>${o.delivery_partner || 'DiyaExpress'}</strong></div>
            <div class="info-row"><span>Shipping Fee:</span> <strong>${o.delivery_fee === 0 ? 'FREE' : '₹' + o.delivery_fee}</strong></div>
            <div class="info-row"><span>Fulfillment:</span> <strong>${o.store_name || 'Flagship Hub'}</strong></div>
          </div>

          <div class="info-block">
            <h4>Payment Summary</h4>
            <div class="info-row"><span>Method:</span> <strong>${o.payment_method}</strong></div>
            <div class="info-row"><span>TXN Reference:</span> <code>${o.transaction_ref || 'N/A'}</code></div>
            <div class="info-row total-highlight"><span>Total Paid:</span> <strong>₹${o.net_amount.toFixed(2)}</strong></div>
          </div>
        </div>

        <!-- Itemized List -->
        <h4 style="margin: 20px 0 10px;">Items in this Delivery (${items.length})</h4>
        <div class="order-items-list">
          ${itemsHtml}
        </div>
      </div>
    `;
  } catch (e) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No Order Found</h3>
        <p>We couldn't find an order matching <strong>"${query}"</strong>. Please check your order ID or phone number.</p>
      </div>
    `;
  }
}

function openExchangeModal(orderItemId) {
  document.getElementById('returnOrderItemId').value = orderItemId;
  document.getElementById('returnModal').classList.add('active');
}

function closeReturnModal() {
  document.getElementById('returnModal').classList.remove('active');
}

async function submitReturn() {
  const orderItemId = parseInt(document.getElementById('returnOrderItemId').value);
  const reason = document.getElementById('returnReasonSelect').value;

  try {
    const res = await api('/api/returns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_item_id: orderItemId, reason: reason })
    });
    closeReturnModal();
    showToast(`Size exchange request #${res.return_id} registered successfully!`);
    if (state.adminReturns.length > 0) {
      loadAdminReturns();
    }
  } catch (e) {
    showToast(`Failed: ${e.message}`, 'error');
  }
}

// ==========================================================
// Customer Account & Fashion Rewards
// ==========================================================
async function renderAccountTab() {
  const profileContainer = document.getElementById('customerProfileCard');
  const tbody = document.getElementById('myOrdersTableBody');
  if (!profileContainer) return;

  if (!state.activeCustomer) {
    profileContainer.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1; padding: 40px;">
        <h3>Please Log In to View Your Account</h3>
        <p>Log in with your name to access your Fashion Club rewards and purchase history.</p>
        <button class="btn btn-primary" onclick="openLoginModal()" style="margin-top: 14px;">
          Customer Login / Sign In
        </button>
      </div>
    `;
    if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="text-center">Please log in to view past orders.</td></tr>';
    return;
  }

  const c = state.activeCustomer;
  
  profileContainer.innerHTML = `
    <div class="kpi-grid" style="margin-bottom: 24px;">
      <div class="kpi-card">
        <div class="kpi-icon" style="background: #fdf2f8; color: #be185d;">
          ${ICONS.star}
        </div>
        <div class="kpi-details">
          <span class="kpi-label">Fashion Club Tier</span>
          <span class="kpi-value" style="font-size: 18px;">${c.customer_segment || 'Silver'}</span>
          <span class="kpi-trend positive">Active Member</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon" style="background: #fef3c7; color: #d97706;">
          ${ICONS.reward}
        </div>
        <div class="kpi-details">
          <span class="kpi-label">Available Points</span>
          <span class="kpi-value">${c.loyalty_points || 0} pts</span>
          <span class="kpi-trend">Worth ₹${((c.loyalty_points || 0) * 0.5).toFixed(0)} discount</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon" style="background: #eff6ff; color: #2563eb;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
        </div>
        <div class="kpi-details">
          <span class="kpi-label">Orders Placed</span>
          <span class="kpi-value">${c.total_orders || 0}</span>
          <span class="kpi-trend">Lifetime Purchases</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon" style="background: #ecfdf5; color: #059669;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>
        <div class="kpi-details">
          <span class="kpi-label">Total Spent</span>
          <span class="kpi-value">₹${(c.total_spent || 0).toLocaleString('en-IN')}</span>
          <span class="kpi-trend positive">Verified Shopper</span>
        </div>
      </div>
    </div>
  `;

  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Loading your orders...</td></tr>';
    try {
      const allOrders = await api('/api/orders?limit=1000');
      const myOrders = allOrders.filter(o => o.customer_id === c.customer_id);

      if (myOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No past orders found for this profile. Start shopping in Collections!</td></tr>';
        return;
      }

      tbody.innerHTML = myOrders.map(o => `
        <tr>
          <td><strong>#${o.order_id}</strong></td>
          <td>${o.order_date}</td>
          <td><span class="badge">${o.channel}</span></td>
          <td>${o.payment_method}</td>
          <td><strong>₹${o.net_amount.toFixed(2)}</strong></td>
          <td><span class="status-badge ${o.order_status.toLowerCase()}">${o.order_status}</span></td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-sm btn-outline" onclick="switchTab('track'); quickTrack(${o.order_id});">
                Track
              </button>
              <button class="btn btn-sm btn-primary" onclick="openInvoiceModal(${o.order_id})">
                ${ICONS.print} Bill PDF
              </button>
            </div>
          </td>
        </tr>
      `).join('');
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center error-msg">Failed to load orders.</td></tr>';
    }
  }
}

// ==========================================================
// Boutique Locations Tab
// ==========================================================
function renderCustomerStoreCards() {
  const container = document.getElementById('customerStoreCardsGrid');
  if (!container) return;

  container.innerHTML = state.stores.map(s => `
    <div class="store-card">
      <div class="store-card-header">
        <div class="store-badge-pill">${s.city}</div>
        <span class="store-type-tag">${s.store_type || 'Fashion Boutique'}</span>
      </div>
      <h3>${s.store_name}</h3>
      <p style="font-size: 13.5px; color: var(--text-secondary); margin: 6px 0;">
        Experience personal styling, sizing trials, and direct returns.
      </p>
      <div style="font-size: 13px; color: var(--text-muted); margin: 12px 0;">
        Open Daily: <strong>10:00 AM – 9:30 PM</strong><br>
        Boutique Manager: <strong>${s.manager_name}</strong><br>
        Location: <strong>${s.city}, ${s.state}</strong>
      </div>
      <div class="store-footer">
        <span style="color: var(--success-color); font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
          <span class="status-dot green"></span> Open Now
        </span>
        <button class="btn btn-sm btn-primary" onclick="onBranchChange(${s.store_id}); switchTab('shop');">
          Shop this Boutique
        </button>
      </div>
    </div>
  `).join('');
}

// ==========================================================
// Toast Notification
// ==========================================================
let toastTimer = null;
function showToast(message, type = 'success') {
  const toast = document.getElementById('toastNotification');
  const msgEl = document.getElementById('toastMessage');
  if (!toast || !msgEl) return;

  msgEl.textContent = message;
  toast.className = `toast show ${type === 'error' ? 'toast-error' : ''}`;

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}
