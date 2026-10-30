// DiyaHub Central In-Page Ecosystem Controller (Single Port :5000)

const SERVICES = {
  diyamart: {
    name: 'DiyaMart Fashion Store',
    shortName: 'DiyaMart',
    icon: '🛍️',
    url: '/diyamart/',
    statusBadgeId: 'status-mart',
    hash: 'mart'
  },
  diyataxi: {
    name: 'DiyaTaxi Mobility Platform',
    shortName: 'DiyaTaxi',
    icon: '🚖',
    url: '/diyataxi/',
    statusBadgeId: 'status-taxi',
    hash: 'taxi'
  },
  diyacafe: {
    name: 'DiyaCafe Artisanal Bistro & Drive-In',
    shortName: 'DiyaCafe',
    icon: '☕',
    url: '/diyacafe/',
    statusBadgeId: 'status-cafe',
    hash: 'cafe'
  },
  diyabuzz: {
    name: 'DiyaBuzz Social Media Platform',
    shortName: 'DiyaBuzz',
    icon: '🔥',
    url: '/diyabuzz/',
    statusBadgeId: 'status-buzz',
    hash: 'buzz'
  },
  service4: {
    name: 'DiyaBuzz Social Media Platform',
    shortName: 'DiyaBuzz',
    icon: '🔥',
    url: '/diyabuzz/',
    statusBadgeId: 'status-buzz',
    hash: 'buzz'
  }
};

const THEME_KEY = 'diyahub_theme';

function applyTheme(theme) {
  const currentTheme = theme || 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  if (document.body) document.body.setAttribute('data-theme', currentTheme);
  localStorage.setItem(THEME_KEY, currentTheme);
  syncThemeToFrame(currentTheme);
}

function syncThemeToFrame(theme) {
  const frame = document.getElementById('service-frame');
  if (!frame) return;

  const targetTheme = theme || 'light';

  try {
    if (frame.contentDocument) {
      frame.contentDocument.documentElement.setAttribute('data-theme', targetTheme);
      if (frame.contentDocument.body) {
        frame.contentDocument.body.setAttribute('data-theme', targetTheme);
      }
    }
  } catch (e) {
    // Fail-safe for cross-frame
  }

  try {
    if (frame.contentWindow) {
      frame.contentWindow.postMessage({ type: 'set_theme', theme: targetTheme }, '*');
    }
  } catch (e) {
    // Fail-safe
  }
}

let currentActiveService = null;

// Open service in the same window (No new page!)
function openService(serviceKey) {
  const svc = SERVICES[serviceKey];
  if (!svc) return;

  currentActiveService = serviceKey;

  const hubView = document.getElementById('hub-view');
  const appViewport = document.getElementById('app-viewport');
  const frame = document.getElementById('service-frame');
  const appIcon = document.getElementById('activeAppIcon');
  const appTitle = document.getElementById('activeAppTitle');

  // Hide Hub, show in-page viewport
  hubView.style.display = 'none';
  appViewport.style.display = 'flex';

  // Update header info
  if (appIcon) appIcon.textContent = svc.icon;
  if (appTitle) appTitle.textContent = svc.name;

  // Load service inside the iframe on the exact same port
  if (frame && frame.getAttribute('data-loaded-service') !== serviceKey) {
    frame.src = svc.url;
    frame.setAttribute('data-loaded-service', serviceKey);
  } else {
    syncThemeToFrame(document.documentElement.getAttribute('data-theme') || getStoredTheme());
  }

  // Update URL hash without creating external history jumps
  if (window.location.hash !== `#${svc.hash}`) {
    history.pushState(null, null, `#${svc.hash}`);
  }
}

// Return back to Central Hub Dashboard view
function closeService() {
  currentActiveService = null;

  const hubView = document.getElementById('hub-view');
  const appViewport = document.getElementById('app-viewport');
  const frame = document.getElementById('service-frame');

  if (appViewport) appViewport.style.display = 'none';
  if (hubView) hubView.style.display = 'block';

  // Reset hash
  if (window.location.hash) {
    history.pushState(null, null, ' ');
  }
}

// Refresh currently active service iframe
function reloadCurrentService() {
  const frame = document.getElementById('service-frame');
  if (frame && currentActiveService) {
    frame.src = SERVICES[currentActiveService].url;
  }
}

// Check services availability from the central server
async function checkServicesHealth() {
  try {
    const res = await fetch('/api/services', { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      updateBadge('status-mart', data.diyamart, true);
      updateBadge('status-taxi', data.diyataxi, true);
      updateBadge('status-cafe', data.diyacafe, true);
      updateBadge('status-buzz', data.diyabuzz, true);
    }
  } catch (e) {
    // Keep current visual states
  }
}

function updateBadge(elementId, isReady, isCoreService) {
  const el = document.getElementById(elementId);
  if (!el) return;

  if (isReady) {
    if (isCoreService) {
      el.className = 'status-badge status-live';
      el.innerHTML = `<span class="pulse-dot"></span> Live Online`;
    } else {
      el.className = 'status-badge status-ready';
      el.innerHTML = `<span>⚡</span> Ready Slot`;
    }
  } else {
    el.className = 'status-badge status-standby';
    el.innerHTML = `<span>⏳</span> Standby`;
  }
}

// Handle routing based on URL hash
function handleHashRoute() {
  const hash = window.location.hash.replace('#', '').toLowerCase();
  if (hash === 'mart' || hash === 'diyamart') {
    openService('diyamart');
  } else if (hash === 'taxi' || hash === 'diyataxi') {
    openService('diyataxi');
  } else if (hash === 'cafe' || hash === 'diyacafe') {
    openService('diyacafe');
  } else if (hash === 'buzz' || hash === 'diyabuzz' || hash === 'service4') {
    openService('diyabuzz');
  } else {
    closeService();
  }
}

// Listen for messages from inside child iframes (e.g. Return to Hub)
window.addEventListener('message', (event) => {
  if (event.data === 'return_to_hub' || event.data?.action === 'return_to_hub') {
    closeService();
  }
});

// Window navigation back/forward support
window.addEventListener('hashchange', handleHashRoute);

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  applyTheme('light');
  const frame = document.getElementById('service-frame');
  if (frame) {
    frame.addEventListener('load', () => {
      syncThemeToFrame('light');
    });
  }
  handleHashRoute();
  checkServicesHealth();
});
