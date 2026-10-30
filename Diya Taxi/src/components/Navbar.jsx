import React from 'react';

export default function Navbar({ activeTab, setActiveTab, userRole, currentUser, onOpenLogin, onLogout }) {
  // Only show Admin tabs if logged in as Admin.
  // For Passenger / Guest, home page is already Book Ride, so no redundant Book Ride tab in header!
  const tabs = userRole === 'admin' 
    ? [
        { id: 'booking', label: '🚖 Book Ride' },
        { id: 'orders', label: '📋 Orders & Trips' },
        { id: 'analytics', label: '📊 Analytics' },
        { id: 'drivers', label: '👨‍✈️ Drivers Fleet' },
        { id: 'customers', label: '👥 Customers' }
      ]
    : [];

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <a href="#" className="brand-logo" onClick={(e) => { e.preventDefault(); setActiveTab('booking'); }}>
          <div className="logo-badge">🚖</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="brand-name">DiyaTaxi</span>
              <span className="brand-tag">
                {userRole === 'admin' ? 'ADMIN' : 'PASSENGER'}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.2px' }}>
              {userRole === 'admin' ? 'Operations Control Center' : 'Urban Ride Hailing'}
            </div>
          </div>
        </a>

        {/* Navigation Tabs - only shown for Admin operations */}
        {tabs.length > 0 && (
          <ul className="nav-tabs" role="tablist">
            {tabs.map(tab => (
              <li key={tab.id}>
                <button
                  className={`nav-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Right side auth & status */}
        <div className="nav-right-actions">
          {userRole === 'admin' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#fffbeb',
                border: '1px solid #fde68a',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '12px'
              }}>
                <span>🛡️</span>
                <span style={{ fontWeight: 700, color: '#b45309' }}>
                  {currentUser?.name || 'Admin'}
                </span>
                <span style={{ fontSize: '10px', background: '#fef3c7', padding: '1px 6px', borderRadius: '4px', color: '#92400e', fontWeight: 700 }}>
                  Admin
                </span>
              </div>
              <button
                className="btn btn-secondary"
                style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '9999px' }}
                onClick={onLogout}
              >
                Logout 🚪
              </button>
            </div>
          ) : currentUser?.name ? (
            /* Logged in Passenger: Passenger is logged in, SO NOW Admin Login is shown! */
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '12px',
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.08)'
              }}>
                <span>👤</span>
                <span style={{ fontWeight: 700, color: '#047857' }}>
                  {currentUser.name}
                </span>
                <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.2)', padding: '1px 6px', borderRadius: '4px', color: '#065f46', fontWeight: 700 }}>
                  Passenger
                </span>
              </div>
              <button
                className="btn btn-secondary"
                style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '9999px' }}
                onClick={onLogout}
              >
                Logout 🚪
              </button>
              {/* ADMIN LOGIN SHOWN AFTER PASSENGER LOGIN */}
              <button
                className="btn btn-primary"
                style={{ padding: '7px 16px', fontSize: '12.5px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                onClick={() => onOpenLogin('admin')}
              >
                <span>🔐 Admin Portal</span>
              </button>
            </div>
          ) : (
            /* Guest / Not logged in: Show Passenger Login first! Admin Login comes after passenger login! */
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                className="btn btn-primary"
                style={{
                  padding: '8px 18px',
                  fontSize: '13px',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.25)'
                }}
                onClick={() => onOpenLogin('customer')}
              >
                <span>👤 Passenger Login</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
