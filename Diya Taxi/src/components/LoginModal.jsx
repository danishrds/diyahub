import React, { useState } from 'react';

export default function LoginModal({ isOpen, onClose, onLoginSuccess, initialType = 'customer' }) {
  const [activeLoginType, setActiveLoginType] = useState(initialType);

  // Sync active login type whenever modal opens
  React.useEffect(() => {
    if (isOpen) {
      setActiveLoginType(initialType);
      setError('');
    }
  }, [isOpen, initialType]);

  // Passenger form
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');

  // Admin form - Name or Email only (NO PASSWORD NEEDED)
  const [adminIdentity, setAdminIdentity] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCustomerSubmit = (e) => {
    e.preventDefault();
    if (!passengerName.trim()) {
      setError('Please enter your name to login.');
      return;
    }
    setError('');
    const finalName = passengerName.trim();
    const finalPhone = passengerPhone.trim() || 'N/A';
    onLoginSuccess({
      role: 'customer',
      name: finalName,
      phone: finalPhone
    });
    setPassengerName('');
    setPassengerPhone('');
    onClose();
  };

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    const finalName = adminIdentity.trim() || 'Admin';
    setError('');
    onLoginSuccess({
      role: 'admin',
      name: finalName,
      email: finalName.includes('@') ? finalName : `${finalName.toLowerCase()}@diyataxi.com`
    });
    onClose();
  };

  return (
    <div className="modal-overlay open">
      <div className="modal-card" style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              color: '#080c14'
            }}>
              {activeLoginType === 'admin' ? '🛡️' : '👤'}
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
                {activeLoginType === 'admin' ? 'Admin Portal Access' : 'Passenger Login'}
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {activeLoginType === 'admin' ? 'Enter name or email to access dashboard' : 'Enter your name to start booking'}
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* Tab switch between Passenger & Admin: Passenger is 1st, Admin is 2nd */}
        <div style={{
          display: 'flex',
          background: '#f1f5f9',
          border: '1px solid #e2e8f0',
          padding: '4px',
          borderRadius: '12px',
          margin: '16px 24px 0 24px',
          gap: '4px'
        }}>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '9px',
              borderRadius: '9px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '13px',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              background: activeLoginType === 'customer' ? '#ffffff' : 'transparent',
              color: activeLoginType === 'customer' ? '#0f172a' : '#64748b',
              boxShadow: activeLoginType === 'customer' ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none'
            }}
            onClick={() => { setActiveLoginType('customer'); setError(''); }}
          >
            👤 1. Passenger Login
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '9px',
              borderRadius: '9px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '13px',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              background: activeLoginType === 'admin' ? '#ffffff' : 'transparent',
              color: activeLoginType === 'admin' ? '#0f172a' : '#64748b',
              boxShadow: activeLoginType === 'admin' ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none'
            }}
            onClick={() => { setActiveLoginType('admin'); setError(''); }}
          >
            🛡️ 2. Admin Portal
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px'
            }}>
              ⚠️ {error}
            </div>
          )}

          {activeLoginType === 'customer' ? (
            /* Passenger Login Form */
            <form onSubmit={handleCustomerSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Your Name <span style={{ color: 'var(--primary)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input-control"
                  style={{ width: '100%' }}
                  placeholder="Enter your name"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Mobile Number (Optional)
                </label>
                <input
                  type="tel"
                  className="input-control"
                  style={{ width: '100%' }}
                  placeholder="Enter 10-digit mobile number"
                  value={passengerPhone}
                  onChange={(e) => setPassengerPhone(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '15px' }}>
                Continue as Passenger 🚖
              </button>

              <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
                Admin Portal access will also appear in the top bar once you log in as passenger.
              </div>
            </form>
          ) : (
            /* Admin Form - Direct Name / Email Entry without password */
            <form onSubmit={handleAdminSubmit}>
              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Admin Name or Email
                </label>
                <input
                  type="text"
                  className="input-control"
                  style={{ width: '100%' }}
                  value={adminIdentity}
                  onChange={(e) => setAdminIdentity(e.target.value)}
                  placeholder="Enter admin name or email (e.g. Pavithra or admin)"
                  autoFocus
                />
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  💡 No password required. Just enter your name or email to access admin dashboard.
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '15px' }}>
                Enter Admin Dashboard 🚀
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
