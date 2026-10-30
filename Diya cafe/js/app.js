// Diya Cafe - Main Application Logic
// Full integration with 500 customers, 2039 orders, 1246 deliveries from DIYA_FULL_DB & DIYA_CAFE_DATA

let appState = {
  activeCity: "All",
  selectedOutlet: DIYA_CAFE_DATA.hotels[0], // Indiranagar, Bengaluru
  fulfillmentMode: "Delivery", // 'Delivery' or 'Self-Collection' (Drive-In)
  categoryFilter: "All",
  dietaryFilter: "All", // 'All', 'Veg', 'NonVeg'
  searchQuery: "",
  cart: [],
  orders: [],
  customers: [],
  deliveries: [],
  activeTrackingOrder: null,
  
  // Auth state
  loggedInCustomer: null, // Customer Name
  loggedInManager: null,  // Manager Name
  
  // Admin dashboard state
  currentAdminTab: "orders",
  adminOrderSearch: "",
  adminCustSearch: "",
  adminCustCity: "All",
  adminDeliverySearch: "",
  adminDeliveryStatus: "All"
};

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  loadDatabase();
  loadLocalState();
  initBackgroundSlider();
  renderCityTabs();
  renderOutlets();
  renderCategoryTabs();
  renderMenu();
  renderQuickProfiles();
  renderLoginCustomerSuggestions();
  updateAuthUI();
  updateCartUI();
  updateModeUI();

  // If customer is already logged in, check for their orders
  if (appState.loggedInCustomer) {
    const myOrders = getCustomerOrders();
    if (myOrders.length > 0) {
      appState.activeTrackingOrder = myOrders[0];
    }
  }
});

// Load DB from window.DIYA_FULL_DB or fallback
function loadDatabase() {
  if (window.DIYA_FULL_DB) {
    appState.customers = window.DIYA_FULL_DB.customers || [];
    appState.deliveries = window.DIYA_FULL_DB.deliveries || [];
    
    // Normalize orders from DB
    const dbOrders = (window.DIYA_FULL_DB.orders || []).map(o => ({
      orderId: o.OrderID,
      cid: o.CID,
      customerName: o.CustomerName || `Customer #${o.CID}`,
      phone: o.CustomerPhone || '+91 98000 00000',
      hotelId: o.OrderHotel,
      hotelName: o.HotelName || 'DiyaCafe Outlet',
      city: o.City || 'Metro Outlet',
      orderTime: o.OrderTime,
      orderType: o.OrderType,
      orderMenu: o.OrderMenu,
      orderPrice: o.OrderPrice,
      orderStatus: o.OrderStatus,
      deliveryPerson: o.DeliveryPerson || 'N/A',
      deliveryStatus: o.DeliveryStatus,
      deliveryStart: o.DeliveryStart,
      deliveryEnd: o.DeliveryEnd,
      vehicleNumber: o.OrderType === 'Self-Collection' ? 'TN 09 BX 9012' : null,
      bayNumber: o.OrderType === 'Self-Collection' ? 'Bay 3' : null
    }));

    appState.orders = dbOrders;
  } else {
    appState.customers = DIYA_CAFE_DATA.sampleCustomers;
    appState.orders = [...DIYA_CAFE_DATA.sampleOrders];
    appState.deliveries = [];
  }
}

// Load state from localStorage
function loadLocalState() {
  try {
    const savedCustomer = localStorage.getItem("diyacafe_logged_customer");
    if (savedCustomer) {
      appState.loggedInCustomer = savedCustomer;
    }
    const savedManager = localStorage.getItem("diyacafe_logged_manager");
    if (savedManager) {
      appState.loggedInManager = savedManager;
    }

    const savedCart = localStorage.getItem("diyacafe_cart");
    if (savedCart) {
      appState.cart = JSON.parse(savedCart);
    }
    const savedOrders = localStorage.getItem("diyacafe_orders");
    if (savedOrders) {
      const localOrders = JSON.parse(savedOrders);
      const existingIds = new Set(localOrders.map(o => o.orderId));
      const dbFiltered = appState.orders.filter(o => !existingIds.has(o.orderId));
      appState.orders = [...localOrders, ...dbFiltered];
    }
  } catch (e) {
    console.error("Error loading local state", e);
  }
}

function saveCart() {
  localStorage.setItem("diyacafe_cart", JSON.stringify(appState.cart));
  updateCartUI();
}

function saveOrders() {
  localStorage.setItem("diyacafe_orders", JSON.stringify(appState.orders));
}

// -------------------------------------------------------------
// Customer Login & Gating
// -------------------------------------------------------------
function openCustomerLoginModal() {
  document.getElementById("customerLoginModalBackdrop").classList.add("open");
  const input = document.getElementById("custLoginName");
  if (input) {
    input.value = appState.loggedInCustomer || "";
    input.focus();
  }
}

function closeCustomerLoginModal() {
  document.getElementById("customerLoginModalBackdrop").classList.remove("open");
}

function renderLoginCustomerSuggestions() {
  const container = document.getElementById("loginCustomerPills");
  if (!container) return;

  const topSample = [
    "Priya Nayak", "Kiran Swamy", "Senthil Balasubramanian", 
    "Dhruv Kamble", "Manish Saxena", "Arnab Saha", "Divya Reddy"
  ];

  container.innerHTML = topSample.map(name => `
    <button type="button" class="profile-pill-btn" onclick="fillCustomerLoginInput('${name}')">
      👤 ${name}
    </button>
  `).join("");
}

function fillCustomerLoginInput(name) {
  const input = document.getElementById("custLoginName");
  if (input) input.value = name;
}

function handleCustomerLoginSubmit(e) {
  e.preventDefault();
  const nameInput = document.getElementById("custLoginName");
  if (!nameInput) return;

  const name = nameInput.value.trim();
  if (!name) {
    showToast("Please enter your name");
    return;
  }

  appState.loggedInCustomer = name;
  localStorage.setItem("diyacafe_logged_customer", name);
  closeCustomerLoginModal();
  updateAuthUI();
  showToast(`👋 Welcome, ${name}! You are now logged in and can place orders.`);
}

function logoutCustomer() {
  appState.loggedInCustomer = null;
  localStorage.removeItem("diyacafe_logged_customer");
  // Also logout manager if customer logs out
  appState.loggedInManager = null;
  localStorage.removeItem("diyacafe_logged_manager");
  
  // Ensure we are back on customer storefront view
  switchViewToStorefront();
  updateAuthUI();
  showToast("Logged out successfully.");
}

// Update UI based on Customer Login State
function updateAuthUI() {
  const navUserAuthArea = document.getElementById("navUserAuthArea");
  const navStoreManagerBtn = document.getElementById("navStoreManagerBtn");
  const navStoreManagerLink = document.getElementById("navStoreManagerLink");
  const navTrackBtn = document.getElementById("navTrackBtn");

  if (appState.loggedInCustomer) {
    // Logged in as customer
    const userBadgeHtml = `
      <div class="user-badge">
        <span>👤</span>
        <span class="user-badge-name">${appState.loggedInCustomer}</span>
        <button class="btn-logout-small" onclick="logoutCustomer()" title="Logout">Logout</button>
      </div>
    `;

    if (navUserAuthArea) {
      navUserAuthArea.innerHTML = userBadgeHtml;
    }

    // Show Store Manager button ONLY after customer login
    if (navStoreManagerBtn) navStoreManagerBtn.style.display = "inline-flex";
    if (navStoreManagerLink) navStoreManagerLink.style.display = "inline-flex";

    // Show Track My Order button ONLY after customer login
    if (navTrackBtn) {
      navTrackBtn.style.display = "inline-flex";
      navTrackBtn.innerHTML = `<span>📍</span><span>Track My Order</span>`;
    }

    // Pre-populate customer name in checkout
    const custNameField = document.getElementById("custName");
    if (custNameField && !custNameField.value) {
      custNameField.value = appState.loggedInCustomer;
    }
  } else {
    // NOT logged in as customer
    const loginBtnHtml = `
      <button class="btn-auth" onclick="openCustomerLoginModal()">
        <span>👤</span>
        <span>Customer Login</span>
      </button>
    `;

    if (navUserAuthArea) {
      navUserAuthArea.innerHTML = loginBtnHtml;
    }

    // Hide the Store Manager button when not logged in
    if (navStoreManagerBtn) navStoreManagerBtn.style.display = "none";
    if (navStoreManagerLink) navStoreManagerLink.style.display = "none";

    // Hide tracking completely before login
    if (navTrackBtn) navTrackBtn.style.display = "none";
  }
}

// -------------------------------------------------------------
// Store Manager View Switching (FULL PAGE, NOT POPUP)
// -------------------------------------------------------------
// REQUIREMENT: "store manager la athu popup la open aguthu enaku page la open aganum"
function triggerStoreManagerAccess() {
  if (!appState.loggedInCustomer) {
    showToast("⚠️ Please login as a customer first!");
    openCustomerLoginModal();
    return;
  }

  if (appState.loggedInManager) {
    showStoreManagerPage();
  } else {
    openManagerLoginModal();
  }
}

function openManagerLoginModal() {
  document.getElementById("managerLoginModalBackdrop").classList.add("open");
  const input = document.getElementById("mgrLoginName");
  if (input) {
    input.value = "";
    input.focus();
  }
}

function closeManagerLoginModal() {
  document.getElementById("managerLoginModalBackdrop").classList.remove("open");
}

function fillMgrName(name) {
  const input = document.getElementById("mgrLoginName");
  if (input) input.value = name;
}

function handleManagerLoginSubmit(e) {
  e.preventDefault();
  const nameInput = document.getElementById("mgrLoginName");
  if (!nameInput) return;

  const mgrName = nameInput.value.trim();
  if (!mgrName) {
    showToast("Please enter Store Manager name");
    return;
  }

  appState.loggedInManager = mgrName;
  localStorage.setItem("diyacafe_logged_manager", mgrName);
  closeManagerLoginModal();
  showStoreManagerPage();
  showToast(`🛡️ Store Manager Login Approved: ${mgrName}`);
}

function showStoreManagerPage() {
  const storefront = document.getElementById("customerStorefrontView");
  const managerPage = document.getElementById("storeManagerPageView");
  const greetingEl = document.getElementById("adminManagerGreeting");

  if (greetingEl) greetingEl.textContent = appState.loggedInManager || "Store Admin";

  if (storefront) storefront.style.display = "none";
  if (managerPage) managerPage.style.display = "block";

  window.scrollTo({ top: 0, behavior: "smooth" });

  renderAdminStats();
  switchAdminTab(appState.currentAdminTab);
}

function switchViewToStorefront() {
  const storefront = document.getElementById("customerStorefrontView");
  const managerPage = document.getElementById("storeManagerPageView");

  if (managerPage) managerPage.style.display = "none";
  if (storefront) storefront.style.display = "block";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function logoutManager() {
  appState.loggedInManager = null;
  localStorage.removeItem("diyacafe_logged_manager");
  switchViewToStorefront();
  showToast("Exited Store Manager Portal.");
}

// -------------------------------------------------------------
// Admin Multi-Tab Database Views
// -------------------------------------------------------------
function renderAdminStats() {
  const statOrders = document.getElementById("statTotalOrders");
  const statCusts = document.getElementById("statTotalCustomers");
  const statDeliveries = document.getElementById("statTotalDeliveries");
  const statHotels = document.getElementById("statTotalHotels");

  if (statOrders) statOrders.textContent = appState.orders.length.toLocaleString();
  if (statCusts) statCusts.textContent = appState.customers.length.toLocaleString();
  if (statDeliveries) statDeliveries.textContent = appState.deliveries.length.toLocaleString();
  if (statHotels) statHotels.textContent = (window.DIYA_FULL_DB ? window.DIYA_FULL_DB.hotels.length : 15);

  const badgeOrders = document.getElementById("badgeCountOrders");
  const badgeCusts = document.getElementById("badgeCountCustomers");
  const badgeDeliveries = document.getElementById("badgeCountDeliveries");

  if (badgeOrders) badgeOrders.textContent = appState.orders.length;
  if (badgeCusts) badgeCusts.textContent = appState.customers.length;
  if (badgeDeliveries) badgeDeliveries.textContent = appState.deliveries.length;
}

function switchAdminTab(tabName) {
  appState.currentAdminTab = tabName;

  const tabs = ["orders", "customers", "deliveries", "outlets", "menu"];
  tabs.forEach(t => {
    const btn = document.getElementById(`tabBtn${t.charAt(0).toUpperCase() + t.slice(1)}`);
    const content = document.getElementById(`adminTabContent${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (btn) btn.classList.toggle("active", t === tabName);
    if (content) content.style.display = (t === tabName ? "block" : "none");
  });

  if (tabName === "orders") renderAdminOrders();
  else if (tabName === "customers") renderAdminCustomers();
  else if (tabName === "deliveries") renderAdminDeliveries();
  else if (tabName === "outlets") renderAdminOutlets();
  else if (tabName === "menu") renderAdminMenu();
}

function onAdminOrderSearch(val) {
  appState.adminOrderSearch = val.toLowerCase().trim();
  renderAdminOrders();
}

function renderAdminOrders() {
  const tbody = document.getElementById("mgrOrdersTbody");
  if (!tbody) return;

  const outletFilter = document.getElementById("mgrOutletFilter") ? document.getElementById("mgrOutletFilter").value : "All";
  const statusFilter = document.getElementById("mgrStatusFilter") ? document.getElementById("mgrStatusFilter").value : "All";

  let filtered = appState.orders;

  if (outletFilter !== "All") {
    filtered = filtered.filter(o => o.hotelName === outletFilter);
  }
  if (statusFilter !== "All") {
    filtered = filtered.filter(o => o.orderStatus === statusFilter);
  }
  if (appState.adminOrderSearch) {
    filtered = filtered.filter(o =>
      String(o.orderId).includes(appState.adminOrderSearch) ||
      (o.customerName && o.customerName.toLowerCase().includes(appState.adminOrderSearch)) ||
      (o.orderMenu && o.orderMenu.toLowerCase().includes(appState.adminOrderSearch))
    );
  }

  tbody.innerHTML = filtered.slice(0, 35).map(o => `
    <tr>
      <td><strong style="color: var(--primary);">#${o.orderId}</strong></td>
      <td>
        <div style="font-weight: 600;">${o.customerName}</div>
        <div style="font-size: 0.75rem; color: var(--text-dim);">${o.phone || ''}</div>
      </td>
      <td>
        <span style="font-size: 0.8rem; font-weight: 600; color: ${o.orderType === 'Delivery' ? '#34d399' : '#38bdf8'};">
          ${o.orderType === 'Delivery' ? '🛵 Delivery' : '🚗 ' + (o.vehicleNumber || 'Drive-In')}
        </span>
      </td>
      <td><span style="font-size: 0.8rem;">${o.hotelName ? o.hotelName.replace('DiyaCafe ', '') : o.city}</span></td>
      <td style="max-width: 240px; font-size: 0.8rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${o.orderMenu}">${o.orderMenu}</td>
      <td><strong>₹${Number(o.orderPrice).toFixed(0)}</strong></td>
      <td>
        <span class="tracker-badge badge-${(o.orderStatus || 'Placed').toLowerCase().replace(/ /g, '-')}">
          ${o.orderStatus}
        </span>
      </td>
      <td>
        <button class="mgr-action-btn" onclick="advanceOrderStatus(${o.orderId})">
          Next Step ➔
        </button>
      </td>
    </tr>
  `).join("");
}

function onAdminCustomerSearch(val) {
  appState.adminCustSearch = val.toLowerCase().trim();
  renderAdminCustomers();
}

function renderAdminCustomers() {
  const tbody = document.getElementById("mgrCustomersTbody");
  if (!tbody) return;

  const cityFilter = document.getElementById("adminCustCityFilter") ? document.getElementById("adminCustCityFilter").value : "All";
  let filtered = appState.customers;

  if (cityFilter !== "All") {
    filtered = filtered.filter(c => c.City && c.City.toLowerCase() === cityFilter.toLowerCase());
  }

  if (appState.adminCustSearch) {
    filtered = filtered.filter(c =>
      (c.Name && c.Name.toLowerCase().includes(appState.adminCustSearch)) ||
      (c.Phone && c.Phone.toLowerCase().includes(appState.adminCustSearch)) ||
      (c.City && c.City.toLowerCase().includes(appState.adminCustSearch)) ||
      (c.Address && c.Address.toLowerCase().includes(appState.adminCustSearch))
    );
  }

  tbody.innerHTML = filtered.slice(0, 40).map(c => `
    <tr>
      <td><strong style="color: var(--primary);">CID #${c.CID}</strong></td>
      <td><div style="font-weight: 700; color: var(--text-main);">${c.Name}</div></td>
      <td><span style="font-family: monospace; font-size: 0.82rem;">${c.Phone}</span></td>
      <td><span class="item-badge">${c.City}</span></td>
      <td style="max-width: 260px; font-size: 0.8rem; color: var(--text-muted);">${c.Address}</td>
      <td style="text-align: center;"><strong>${c.TotalOrders || 0}</strong></td>
      <td style="color: #34d399; font-weight: 700;">₹${(c.TotalSpent || 0).toLocaleString()}</td>
    </tr>
  `).join("");
}

function onAdminDeliverySearch(val) {
  appState.adminDeliverySearch = val.toLowerCase().trim();
  renderAdminDeliveries();
}

function renderAdminDeliveries() {
  const tbody = document.getElementById("mgrDeliveriesTbody");
  if (!tbody) return;

  const statusFilter = document.getElementById("adminDeliveryStatusFilter") ? document.getElementById("adminDeliveryStatusFilter").value : "All";
  let filtered = appState.deliveries;

  if (statusFilter !== "All") {
    filtered = filtered.filter(d => d.DeliveryStatus === statusFilter);
  }

  if (appState.adminDeliverySearch) {
    filtered = filtered.filter(d =>
      (d.DeliveryPerson && d.DeliveryPerson.toLowerCase().includes(appState.adminDeliverySearch)) ||
      String(d.OrderID).includes(appState.adminDeliverySearch) ||
      String(d.DeliveryID).includes(appState.adminDeliverySearch)
    );
  }

  tbody.innerHTML = filtered.slice(0, 35).map(d => `
    <tr>
      <td><strong>DEL #${d.DeliveryID}</strong></td>
      <td><strong style="color: var(--primary);">Order #${d.OrderID}</strong></td>
      <td><div style="font-weight: 600; color: #fdba74;">🛵 ${d.DeliveryPerson}</div></td>
      <td>Customer #${d.CID}</td>
      <td style="font-size: 0.78rem; color: var(--text-dim);">${d.DeliveryStart || 'Pending'}</td>
      <td style="font-size: 0.78rem; color: var(--text-dim);">${d.DeliveryEnd || 'In Transit'}</td>
      <td>
        <span class="tracker-badge badge-${(d.DeliveryStatus || 'Assigned').toLowerCase().replace(/ /g, '-')}">
          ${d.DeliveryStatus}
        </span>
      </td>
    </tr>
  `).join("");
}

function renderAdminOutlets() {
  const tbody = document.getElementById("mgrOutletsTbody");
  if (!tbody) return;

  const hotels = (window.DIYA_FULL_DB ? window.DIYA_FULL_DB.hotels : DIYA_CAFE_DATA.hotels);
  tbody.innerHTML = hotels.map(h => `
    <tr>
      <td><strong>#${h.HotelID || h.id}</strong></td>
      <td><strong style="color: var(--primary);">${h.HotelName || h.name}</strong></td>
      <td><span class="outlet-city-badge">${h.City || h.city}</span></td>
      <td style="font-size: 0.82rem; color: var(--text-muted);">${h.Address || h.address}</td>
      <td style="font-family: monospace; font-size: 0.78rem;">${h.Latitude || h.latitude}, ${h.Longitude || h.longitude}</td>
      <td><span style="color: #38bdf8; font-weight: 700;">${h.driveInBays || 8} Bays</span></td>
    </tr>
  `).join("");
}

function renderAdminMenu() {
  const tbody = document.getElementById("mgrMenuTbody");
  if (!tbody) return;

  const menus = (window.DIYA_FULL_DB ? window.DIYA_FULL_DB.menus : DIYA_CAFE_DATA.menu);
  tbody.innerHTML = menus.map(m => `
    <tr>
      <td><strong>#${m.MenuID || m.id}</strong></td>
      <td><strong style="color: var(--text-main);">${m.MenuName || m.name}</strong></td>
      <td><span class="item-badge">${m.Category || m.category}</span></td>
      <td>
        <div style="display: flex; align-items: center; gap: 6px;">
          <div class="dietary-marker ${(m.IsVeg === 1 || m.isVeg) ? 'veg' : 'non-veg'}"></div>
          <span style="font-size: 0.8rem;">${(m.IsVeg === 1 || m.isVeg) ? 'Veg' : 'Non-Veg'}</span>
        </div>
      </td>
      <td><strong style="color: var(--primary); font-size: 1rem;">₹${Number(m.Price || m.price).toFixed(0)}</strong></td>
    </tr>
  `).join("");
}

// -------------------------------------------------------------
// Track My Order (Only Logged-in Customer's Orders)
// -------------------------------------------------------------
// REQUIREMENT: "na order potatha mattum tha kamikanum"
function getCustomerOrders() {
  if (!appState.loggedInCustomer) return [];
  const searchName = appState.loggedInCustomer.toLowerCase().trim();
  return appState.orders.filter(o => 
    o.customerName && o.customerName.toLowerCase().trim() === searchName
  );
}

function openOrderTracker() {
  if (!appState.loggedInCustomer) {
    showToast("⚠️ Please login first to track your orders!");
    openCustomerLoginModal();
    return;
  }

  const myOrders = getCustomerOrders();
  const picker = document.getElementById("customerOrdersPicker");
  const subtitle = document.getElementById("trackMyOrderSubtitle");

  if (subtitle) {
    subtitle.textContent = `Showing orders placed by ${appState.loggedInCustomer}`;
  }

  if (myOrders.length === 0) {
    picker.innerHTML = "";
    document.getElementById("trackerDisplayContent").innerHTML = `
      <div style="text-align: center; padding: 40px 20px;">
        <div style="font-size: 3rem; margin-bottom: 12px;">🛍️</div>
        <h3>No Orders Found</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 6px;">
          Hi ${appState.loggedInCustomer}, you haven't placed any orders yet.
        </p>
        <button class="btn-primary" onclick="closeOrderTracker(); document.getElementById('menu-section').scrollIntoView({behavior: 'smooth'});" style="margin-top: 18px;">
          <span>Explore Menu & Order Now</span>
          <span>➔</span>
        </button>
      </div>
    `;
  } else {
    // If we have an active order not set or not in myOrders, set it to the first order
    if (!appState.activeTrackingOrder || !myOrders.some(o => o.orderId === appState.activeTrackingOrder.orderId)) {
      appState.activeTrackingOrder = myOrders[0];
    }

    // Render order selection tabs if more than 1 order
    if (myOrders.length > 1) {
      picker.innerHTML = `
        <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px;">
          ${myOrders.map(o => `
            <button class="profile-pill-btn ${o.orderId === appState.activeTrackingOrder.orderId ? 'active' : ''}" 
                    style="${o.orderId === appState.activeTrackingOrder.orderId ? 'background: var(--primary); color: #fff; border-color: var(--primary);' : ''}"
                    onclick="selectCustomerOrderToTrack(${o.orderId})">
              Order #${o.orderId} (${o.orderStatus})
            </button>
          `).join("")}
        </div>
      `;
    } else {
      picker.innerHTML = "";
    }

    renderTrackingView(appState.activeTrackingOrder);
  }

  document.getElementById("trackerModalBackdrop").classList.add("open");
}

function selectCustomerOrderToTrack(orderId) {
  const found = appState.orders.find(o => Number(o.orderId) === Number(orderId));
  if (found) {
    appState.activeTrackingOrder = found;
    openOrderTracker();
  }
}

function closeOrderTracker() {
  document.getElementById("trackerModalBackdrop").classList.remove("open");
}

function renderTrackingView(order) {
  const container = document.getElementById("trackerDisplayContent");
  if (!container) return;

  order = order || appState.activeTrackingOrder;
  if (!order) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px;">
        <div style="font-size: 3rem; margin-bottom: 12px;">🛍️</div>
        <h3>No Order Selected</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 6px;">
          Please select an order to view live tracking details.
        </p>
      </div>
    `;
    return;
  }

  const isDriveIn = order.orderType === "Self-Collection";
  const stages = isDriveIn
    ? [
        { id: "Placed", label: "Placed", icon: "📝" },
        { id: "Preparing", label: "Kitchen Prep", icon: "🍳" },
        { id: "Ready", label: "Bay Ready", icon: "🚗" },
        { id: "Completed", label: "Collected", icon: "✅" }
      ]
    : [
        { id: "Placed", label: "Placed", icon: "📝" },
        { id: "Preparing", label: "Cooking", icon: "🍳" },
        { id: "Ready", label: "Packed", icon: "📦" },
        { id: "Out for Delivery", label: "On The Way", icon: "🛵" },
        { id: "Completed", label: "Delivered", icon: "✅" }
      ];

  const currentIdx = stages.findIndex(s => s.id === order.orderStatus);

  container.innerHTML = `
    <div class="tracker-status-box">
      <div class="tracker-top-meta">
        <div>
          <div class="tracker-order-id">Order #${order.orderId}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Placed at ${order.orderTime}</div>
        </div>
        <div class="tracker-badge badge-${(order.orderStatus || 'Placed').toLowerCase().replace(/ /g, '-')}">
          ${order.orderStatus}
        </div>
      </div>

      <!-- Stepper Line -->
      <div class="timeline-stepper">
        ${stages.map((stage, idx) => {
          let stateClass = "";
          if (idx < currentIdx) stateClass = "completed";
          else if (idx === currentIdx) stateClass = "current";

          return `
            <div class="step-node ${stateClass}">
              <div class="step-circle">${stage.icon}</div>
              <span class="step-node-label">${stage.label}</span>
            </div>
          `;
        }).join("")}
      </div>

      <!-- Key Details Grid -->
      <div class="tracker-details-grid">
        <div class="tracker-info-cell">
          <div class="cell-label">Fulfillment Mode</div>
          <div class="cell-value" style="color: ${isDriveIn ? 'var(--accent-drivein)' : 'var(--accent-delivery)'};">
            ${isDriveIn ? '🚗 Drive-In / Curbside' : '🛵 Doorstep Delivery'}
          </div>
        </div>

        <div class="tracker-info-cell">
          <div class="cell-label">Outlet</div>
          <div class="cell-value">${order.hotelName || 'DiyaCafe Outlet'} (${order.city || 'Metro'})</div>
        </div>

        <div class="tracker-info-cell">
          <div class="cell-label">${isDriveIn ? 'Vehicle & Bay' : 'Assigned Rider'}</div>
          <div class="cell-value">${isDriveIn ? (order.vehicleNumber || 'Car') + ' • ' + (order.bayNumber || 'Bay 3') : order.deliveryPerson}</div>
        </div>

        <div class="tracker-info-cell">
          <div class="cell-label">Customer</div>
          <div class="cell-value">${order.customerName} (${order.phone})</div>
        </div>
      </div>

      <!-- Order Items Preview -->
      <div style="margin-top: 20px; padding: 14px; background: rgba(255, 255, 255, 0.02); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
        <div class="cell-label" style="margin-bottom: 6px;">Dishes Ordered</div>
        <div style="font-size: 0.92rem; color: var(--text-main); font-weight: 600;">${order.orderMenu}</div>
        <div style="font-size: 0.88rem; color: var(--primary); font-weight: 700; margin-top: 6px;">Total Bill: ₹${Number(order.orderPrice).toFixed(0)}</div>
      </div>

      <!-- Simulation Action Button -->
      <div style="margin-top: 22px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div style="font-size: 0.82rem; color: var(--text-muted);">
          💡 Test live order flow:
        </div>
        <button class="btn-primary" onclick="advanceOrderStatus(${order.orderId})" style="padding: 8px 18px; font-size: 0.86rem;">
          Simulate Next Stage (➔)
        </button>
      </div>
    </div>
  `;
}

function advanceOrderStatus(orderId, newStatus) {
  const order = appState.orders.find(o => Number(o.orderId) === Number(orderId));
  if (!order) return;

  const stages = order.orderType === "Delivery"
    ? ["Placed", "Preparing", "Ready", "Out for Delivery", "Completed"]
    : ["Placed", "Preparing", "Ready", "Completed"];

  if (newStatus) {
    order.orderStatus = newStatus;
  } else {
    const curIdx = stages.indexOf(order.orderStatus);
    if (curIdx < stages.length - 1) {
      order.orderStatus = stages[curIdx + 1];
    }
  }

  saveOrders();
  if (appState.activeTrackingOrder && Number(appState.activeTrackingOrder.orderId) === Number(orderId)) {
    renderTrackingView(order);
  }
  renderAdminOrders();
  showToast(`Order #${orderId} is now ${order.orderStatus}!`);
}

// -------------------------------------------------------------
// Cart & Gated Ordering
// -------------------------------------------------------------
// REQUIREMENT: "login pannama order panna mudiyathu apd order pannnaumna login pannatha tha panna mudiyanum"
function addToCart(itemId) {
  if (!appState.loggedInCustomer) {
    showToast("⚠️ Please login with your name to order from Diya Cafe!");
    openCustomerLoginModal();
    return;
  }

  const item = DIYA_CAFE_DATA.menu.find(m => m.id === itemId);
  if (!item) return;

  const existing = appState.cart.find(c => c.id === itemId);
  if (existing) {
    existing.qty += 1;
  } else {
    appState.cart.push({
      id: item.id,
      name: item.name,
      price: item.price,
      isVeg: item.isVeg,
      icon: item.icon,
      qty: 1
    });
  }

  saveCart();
  renderMenu();
  showToast(`Added ${item.name} to cart`);
}

function addHeroComboToCart() {
  if (!appState.loggedInCustomer) {
    showToast("⚠️ Please login with your name to order from Diya Cafe!");
    openCustomerLoginModal();
    return;
  }

  // Add Masala Dosa (id: 2) and Filter Coffee (id: 5)
  const dosa = DIYA_CAFE_DATA.menu.find(m => m.id === 2);
  const coffee = DIYA_CAFE_DATA.menu.find(m => m.id === 5);

  [dosa, coffee].forEach(item => {
    if (!item) return;
    const existing = appState.cart.find(c => c.id === item.id);
    if (existing) {
      existing.qty += 1;
    } else {
      appState.cart.push({
        id: item.id,
        name: item.name,
        price: item.price,
        isVeg: item.isVeg,
        icon: item.icon,
        qty: 1
      });
    }
  });

  saveCart();
  renderMenu();
  showToast("Added Heritage Ghee Dosa & Filter Coffee Combo to cart! ☕🌯");
}

function updateItemQty(itemId, delta) {
  const idx = appState.cart.findIndex(c => c.id === itemId);
  if (idx > -1) {
    appState.cart[idx].qty += delta;
    if (appState.cart[idx].qty <= 0) {
      appState.cart.splice(idx, 1);
    }
  }
  saveCart();
  renderMenu();
}

function updateCartUI() {
  const badge = document.getElementById("cartCountBadge");
  const totalItems = appState.cart.reduce((sum, item) => sum + item.qty, 0);
  if (badge) badge.textContent = totalItems;

  const cartBody = document.getElementById("cartBody");
  const cartFooter = document.getElementById("cartFooter");
  if (!cartBody || !cartFooter) return;

  if (appState.cart.length === 0) {
    cartBody.innerHTML = `
      <div class="cart-empty-state">
        <div class="empty-cart-icon">🛒</div>
        <h3>Your Cart is Empty</h3>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 8px;">Explore our signature filter coffee, hot dosas, and street rolls to add items.</p>
        <button class="btn-primary" onclick="closeCartDrawer(); document.getElementById('menu-section').scrollIntoView({behavior: 'smooth'});" style="margin-top: 20px;">
          Browse Menu
        </button>
      </div>
    `;
    cartFooter.innerHTML = "";
    return;
  }

  const subtotal = appState.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const gst = Math.round(subtotal * 0.05);
  let deliveryFee = 0;
  if (appState.fulfillmentMode === "Delivery") {
    deliveryFee = subtotal >= DIYA_CAFE_DATA.brand.freeDeliveryThreshold ? 0 : DIYA_CAFE_DATA.brand.deliveryFee;
  }
  const grandTotal = subtotal + gst + deliveryFee;

  cartBody.innerHTML = `
    <div class="cart-outlet-notice">
      <span>${appState.fulfillmentMode === 'Delivery' ? '🛵 Delivering from:' : '🚗 Drive-In Pickup at:'}</span>
      <strong>${appState.selectedOutlet.name}</strong>
    </div>

    <div class="cart-items-list">
      ${appState.cart.map(item => `
        <div class="cart-item-row">
          <div class="cart-item-info">
            <div class="cart-item-name">
              <span class="dietary-marker ${item.isVeg ? 'veg' : 'non-veg'}" style="display: inline-block; vertical-align: middle; margin-right: 6px;"></span>
              ${item.name}
            </div>
            <div class="cart-item-price">₹${item.price.toFixed(0)} × ${item.qty} = ₹${(item.price * item.qty).toFixed(0)}</div>
          </div>
          <div class="item-qty-control">
            <button class="qty-btn" onclick="updateItemQty(${item.id}, -1)">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="updateItemQty(${item.id}, 1)">+</button>
          </div>
        </div>
      `).join("")}
    </div>
  `;

  cartFooter.innerHTML = `
    <div class="cart-bill-row">
      <span>Item Subtotal</span>
      <span>₹${subtotal.toFixed(0)}</span>
    </div>
    <div class="cart-bill-row">
      <span>GST (5%)</span>
      <span>₹${gst.toFixed(0)}</span>
    </div>
    <div class="cart-bill-row">
      <span>${appState.fulfillmentMode === 'Delivery' ? 'Delivery Fee' : 'Curbside Bay Fee'}</span>
      <span>${deliveryFee === 0 ? '<span style="color: #22c55e;">FREE</span>' : '₹' + deliveryFee}</span>
    </div>
    <div class="cart-bill-row total-row">
      <span>To Pay</span>
      <span>₹${grandTotal.toFixed(0)}</span>
    </div>

    <button class="btn-checkout" onclick="openCheckoutModal()">
      <span>Proceed to Checkout</span>
      <span>➔</span>
    </button>
  `;
}

function openCartDrawer() {
  updateCartUI();
  document.getElementById("cartDrawerBackdrop").classList.add("open");
}

function closeCartDrawer() {
  document.getElementById("cartDrawerBackdrop").classList.remove("open");
}

function handleDrawerBackdropClick(e) {
  if (e.target.id === "cartDrawerBackdrop") {
    closeCartDrawer();
  }
}

// -------------------------------------------------------------
// Checkout Modal
// -------------------------------------------------------------
function openCheckoutModal() {
  if (!appState.loggedInCustomer) {
    showToast("⚠️ Please login with your name to proceed to checkout!");
    openCustomerLoginModal();
    return;
  }

  closeCartDrawer();
  const subtotal = appState.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const gst = Math.round(subtotal * 0.05);
  let deliveryFee = 0;
  if (appState.fulfillmentMode === "Delivery") {
    deliveryFee = subtotal >= DIYA_CAFE_DATA.brand.freeDeliveryThreshold ? 0 : DIYA_CAFE_DATA.brand.deliveryFee;
  }
  const grandTotal = subtotal + gst + deliveryFee;

  document.getElementById("checkoutSubmitTotal").textContent = grandTotal.toFixed(0);

  const custNameField = document.getElementById("custName");
  if (custNameField) custNameField.value = appState.loggedInCustomer;

  const citySelect = document.getElementById("custCity");
  if (citySelect) {
    citySelect.value = appState.selectedOutlet.city;
    populateCheckoutOutlets(appState.selectedOutlet.city);
  }

  updateModeUI();
  document.getElementById("checkoutModalBackdrop").classList.add("open");
}

function closeCheckoutModal() {
  document.getElementById("checkoutModalBackdrop").classList.remove("open");
}

function onCheckoutCityChange(city) {
  populateCheckoutOutlets(city);
}

function populateCheckoutOutlets(city) {
  const outletSelect = document.getElementById("custOutlet");
  if (!outletSelect) return;

  const outlets = DIYA_CAFE_DATA.hotels.filter(h => h.city.toLowerCase() === city.toLowerCase());
  outletSelect.innerHTML = outlets.map(h => `
    <option value="${h.id}" ${h.id === appState.selectedOutlet.id ? 'selected' : ''}>
      ${h.name} (${h.driveInBays} Drive-in Bays)
    </option>
  `).join("");
}

function renderQuickProfiles() {
  const container = document.getElementById("quickProfilesStrip");
  if (!container) return;

  container.innerHTML = DIYA_CAFE_DATA.sampleCustomers.map(cust => `
    <button type="button" class="profile-pill-btn" onclick="fillCustomerProfile(${cust.id})">
      👤 ${cust.name} (${cust.city})
    </button>
  `).join("");
}

function fillCustomerProfile(custId) {
  const cust = DIYA_CAFE_DATA.sampleCustomers.find(c => c.id === custId);
  if (!cust) return;

  document.getElementById("custName").value = cust.name;
  document.getElementById("custPhone").value = cust.phone;
  document.getElementById("custCity").value = cust.city;
  populateCheckoutOutlets(cust.city);

  const addressField = document.getElementById("custAddress");
  if (addressField) addressField.value = cust.address;

  const vehicleField = document.getElementById("custVehicle");
  if (vehicleField && !vehicleField.value) {
    const states = { 'Bengaluru': 'KA 01 MJ 4210', 'Chennai': 'TN 07 BK 8820', 'Mumbai': 'MH 02 CK 1923', 'Delhi': 'DL 03 CA 9041', 'Kolkata': 'WB 02 AB 3319' };
    vehicleField.value = states[cust.city] || 'KA 05 AB 1234';
  }

  showToast(`Autofilled details for ${cust.name}`);
}

function handleCheckoutSubmit(e) {
  e.preventDefault();

  if (appState.cart.length === 0) {
    showToast("Cart is empty!");
    return;
  }

  const name = document.getElementById("custName").value.trim() || appState.loggedInCustomer;
  const phone = document.getElementById("custPhone").value.trim();
  const city = document.getElementById("custCity").value;
  const outletId = parseInt(document.getElementById("custOutlet").value);
  const outlet = DIYA_CAFE_DATA.hotels.find(h => h.id === outletId) || appState.selectedOutlet;
  const orderNotes = document.getElementById("orderNotes").value.trim();

  let vehicleNumber = null;
  let bayNumber = null;
  let address = null;

  if (appState.fulfillmentMode === "Self-Collection") {
    vehicleNumber = document.getElementById("custVehicle").value.trim() || "KA 01 CA 1234";
    bayNumber = document.getElementById("custBay").value;
  } else {
    address = document.getElementById("custAddress").value.trim() || `${name}'s residence, ${city}`;
  }

  const subtotal = appState.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const gst = Math.round(subtotal * 0.05);
  let deliveryFee = (appState.fulfillmentMode === "Delivery" && subtotal < 500) ? 40 : 0;
  const grandTotal = subtotal + gst + deliveryFee;

  const menuSummary = appState.cart.map(c => `${c.name} x${c.qty}`).join(", ");
  const maxExistingId = appState.orders.reduce((max, o) => Math.max(max, Number(o.orderId) || 0), 2039);
  const newOrderId = maxExistingId + 1;

  const randomRider = DIYA_CAFE_DATA.deliveryFleet[Math.floor(Math.random() * DIYA_CAFE_DATA.deliveryFleet.length)];

  const newOrder = {
    orderId: newOrderId,
    cid: Math.floor(Math.random() * 500) + 1,
    customerName: name,
    phone: phone,
    hotelId: outlet.id,
    hotelName: outlet.name,
    city: city,
    orderTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    orderType: appState.fulfillmentMode,
    orderMenu: menuSummary,
    orderPrice: grandTotal,
    orderStatus: "Placed",
    deliveryPerson: appState.fulfillmentMode === "Delivery" ? randomRider : "N/A (Drive-in Curbside)",
    vehicleNumber: vehicleNumber,
    bayNumber: bayNumber,
    deliveryAddress: address,
    orderNotes: orderNotes,
    deliveryStart: null,
    estimatedMins: appState.fulfillmentMode === "Delivery" ? 30 : 15
  };

  appState.orders.unshift(newOrder);
  saveOrders();

  appState.cart = [];
  saveCart();
  renderMenu();
  closeCheckoutModal();

  appState.activeTrackingOrder = newOrder;
  openOrderTracker();
  showToast(`🎉 Order #${newOrderId} successfully placed!`);

  setTimeout(() => {
    advanceOrderStatus(newOrderId, "Preparing");
  }, 4000);
}

// -------------------------------------------------------------
// Other Core Renderers
// -------------------------------------------------------------
function initBackgroundSlider() {
  const images = ["images/hero_cafe.jpg", "images/hero_food.jpg", "images/drivein_pickup.jpg"];
  let idx = 0;
  const bgImg = document.getElementById("heroBgImage");
  if (!bgImg) return;

  setInterval(() => {
    idx = (idx + 1) % images.length;
    bgImg.style.opacity = "0";
    setTimeout(() => {
      bgImg.src = images[idx];
      bgImg.style.opacity = "0.28";
    }, 400);
  }, 7000);
}

function setFulfillmentMode(mode) {
  appState.fulfillmentMode = mode;
  updateModeUI();
  updateCartUI();
  showToast(mode === "Delivery" ? "🛵 Switched to Home Delivery mode" : "🚗 Switched to Drive-In Curbside Collection mode");
}

function toggleFulfillmentMode() {
  setFulfillmentMode(appState.fulfillmentMode === "Delivery" ? "Self-Collection" : "Delivery");
}

function updateModeUI() {
  const isDelivery = appState.fulfillmentMode === "Delivery";
  const navBtn = document.getElementById("navModeToggleBtn");
  const navIcon = document.getElementById("navModeIcon");
  const navLabel = document.getElementById("navModeLabel");
  const btnDelivery = document.getElementById("modeBtnDelivery");
  const btnDriveIn = document.getElementById("modeBtnDriveIn");
  const checkoutBadge = document.getElementById("checkoutModeBadge");
  const deliveryFields = document.getElementById("deliveryFieldsGroup");
  const driveInFields = document.getElementById("driveInFieldsGroup");

  if (isDelivery) {
    if (navBtn) {
      navBtn.className = "nav-mode-pill delivery-active";
      navIcon.textContent = "🛵";
      navLabel.textContent = "Delivery";
    }
    if (btnDelivery) btnDelivery.classList.add("active");
    if (btnDriveIn) btnDriveIn.classList.remove("active");
    if (checkoutBadge) checkoutBadge.textContent = "Home Delivery";
    if (deliveryFields) deliveryFields.style.display = "block";
    if (driveInFields) driveInFields.style.display = "none";
  } else {
    if (navBtn) {
      navBtn.className = "nav-mode-pill drivein-active";
      navIcon.textContent = "🚗";
      navLabel.textContent = "Drive-In";
    }
    if (btnDelivery) btnDelivery.classList.remove("active");
    if (btnDriveIn) btnDriveIn.classList.add("active");
    if (checkoutBadge) checkoutBadge.textContent = "Drive-In Curbside Collection";
    if (deliveryFields) deliveryFields.style.display = "none";
    if (driveInFields) driveInFields.style.display = "block";
  }

  const outletTag = document.getElementById("selectedOutletTag");
  if (outletTag && appState.selectedOutlet) {
    outletTag.textContent = `${appState.selectedOutlet.name.replace('DiyaCafe ', '')}, ${appState.selectedOutlet.city}`;
  }
}

function onNavCityChange(city) {
  selectCity(city);
}

function selectCity(city) {
  appState.activeCity = city;
  const navCitySelect = document.getElementById("navCitySelect");
  if (navCitySelect) navCitySelect.value = city;

  if (city !== "All") {
    const firstInCity = DIYA_CAFE_DATA.hotels.find(h => h.city.toLowerCase() === city.toLowerCase());
    if (firstInCity) {
      selectOutlet(firstInCity.id, false);
    }
  }

  renderCityTabs();
  renderOutlets();
}

function renderCityTabs() {
  const container = document.getElementById("cityFilterBar");
  if (!container) return;

  container.innerHTML = DIYA_CAFE_DATA.cities.map(city => `
    <button class="city-tab-btn ${appState.activeCity === city ? 'active' : ''}" onclick="selectCity('${city}')">
      ${city === 'All' ? 'All Metros' : city}
    </button>
  `).join("");
}

function renderOutlets() {
  const container = document.getElementById("outletsGrid");
  if (!container) return;

  let filtered = DIYA_CAFE_DATA.hotels;
  if (appState.activeCity !== "All") {
    filtered = filtered.filter(h => h.city.toLowerCase() === appState.activeCity.toLowerCase());
  }

  container.innerHTML = filtered.map(outlet => {
    const isSelected = appState.selectedOutlet && appState.selectedOutlet.id === outlet.id;
    return `
      <div class="outlet-card ${isSelected ? 'selected-outlet' : ''}">
        <div>
          <div class="outlet-top">
            <span class="outlet-city-badge">${outlet.city}</span>
            <div class="outlet-rating">★ ${outlet.rating} <span style="color: var(--text-dim); font-size: 0.72rem;">(${outlet.reviewsCount})</span></div>
          </div>
          <h3 class="outlet-name">${outlet.name}</h3>
          <div class="outlet-address">
            <span>📍</span>
            <span>${outlet.address}</span>
          </div>
          <div class="outlet-amenities">
            <div class="amenity-chip"><span>🚗</span> ${outlet.driveInBays} Drive-In Bays</div>
            <div class="amenity-chip"><span>🕒</span> ${outlet.timing}</div>
            <div class="amenity-chip"><span>⚡</span> Express Pickup</div>
          </div>
        </div>
        <div class="outlet-footer">
          <span class="outlet-phone">📞 ${outlet.phone}</span>
          <button class="btn-select-outlet" onclick="selectOutlet(${outlet.id}, true)">
            ${isSelected ? '✓ Selected Outlet' : 'Select Outlet'}
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function selectOutlet(outletId, notify = true) {
  const found = DIYA_CAFE_DATA.hotels.find(h => h.id === outletId);
  if (found) {
    appState.selectedOutlet = found;
    updateModeUI();
    renderOutlets();
    if (notify) {
      showToast(`📍 Selected outlet: ${found.name}`);
    }
  }
}

function renderCategoryTabs() {
  const container = document.getElementById("categoryTabs");
  if (!container) return;

  container.innerHTML = DIYA_CAFE_DATA.categories.map(cat => `
    <button class="category-btn ${appState.categoryFilter === cat ? 'active' : ''}" onclick="setCategoryFilter('${cat}')">
      ${cat}
    </button>
  `).join("");
}

function setCategoryFilter(category) {
  appState.categoryFilter = category;
  renderCategoryTabs();
  renderMenu();
}

function setDietaryFilter(diet) {
  appState.dietaryFilter = diet;
  document.getElementById("filterAllDiet").className = `veg-btn ${diet === 'All' ? 'active' : ''}`;
  document.getElementById("filterVeg").className = `veg-btn veg-only ${diet === 'Veg' ? 'active' : ''}`;
  document.getElementById("filterNonVeg").className = `veg-btn nonveg-only ${diet === 'NonVeg' ? 'active' : ''}`;
  renderMenu();
}

function onMenuSearch(query) {
  appState.searchQuery = query.toLowerCase().trim();
  renderMenu();
}

function renderMenu() {
  const container = document.getElementById("menuGrid");
  if (!container) return;

  let items = DIYA_CAFE_DATA.menu;

  if (appState.categoryFilter !== "All") {
    items = items.filter(item => item.category === appState.categoryFilter);
  }

  if (appState.dietaryFilter === "Veg") {
    items = items.filter(item => item.isVeg === true);
  } else if (appState.dietaryFilter === "NonVeg") {
    items = items.filter(item => item.isVeg === false);
  }

  if (appState.searchQuery) {
    items = items.filter(item =>
      item.name.toLowerCase().includes(appState.searchQuery) ||
      item.category.toLowerCase().includes(appState.searchQuery) ||
      item.description.toLowerCase().includes(appState.searchQuery)
    );
  }

  if (items.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <div style="font-size: 3rem; margin-bottom: 12px;">🔍</div>
        <h3>No dishes matched your criteria</h3>
        <p style="font-size: 0.9rem; margin-top: 6px;">Try adjusting your search terms or dietary filter.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(item => {
    const cartItem = appState.cart.find(c => c.id === item.id);
    const qty = cartItem ? cartItem.qty : 0;
    const itemImg = item.image || `images/menu/item_${item.id}.jpg`;

    return `
      <div class="menu-card">
        <div class="menu-card-image-wrap">
          <img 
            src="${itemImg}" 
            alt="${item.name}" 
            class="menu-item-img" 
            loading="lazy" 
            onerror="this.onerror=null; this.src='images/hero_food.jpg';"
          />
          <div class="menu-card-top-overlay">
            <div class="dietary-marker ${item.isVeg ? 'veg' : 'non-veg'}" title="${item.isVeg ? 'Pure Vegetarian' : 'Non-Vegetarian'}"></div>
            ${item.badge ? `<span class="item-badge">${item.badge}</span>` : ''}
          </div>
        </div>

        <div class="menu-card-body">
          <h3 class="menu-item-name">${item.name}</h3>
          <p class="menu-item-desc">${item.description}</p>

          <div class="menu-item-meta">
            <span>⏱️ ${item.prepTime}</span>
            <span>•</span>
            <span>🔥 ${item.calories}</span>
            <span>•</span>
            <span>${item.category}</span>
          </div>
        </div>

        <div class="menu-card-bottom">
          <div class="item-price">₹${item.price.toFixed(0)}</div>
          <div>
            ${qty > 0 ? `
              <div class="item-qty-control">
                <button class="qty-btn" onclick="updateItemQty(${item.id}, -1)">−</button>
                <span class="qty-num">${qty}</span>
                <button class="qty-btn" onclick="updateItemQty(${item.id}, 1)">+</button>
              </div>
            ` : `
              <button class="btn-add-cart" onclick="addToCart(${item.id})">
                <span>+ ADD</span>
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// Toast Alert System
function showToast(msg) {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span>☕</span><span>${msg}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}
