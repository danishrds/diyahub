import React from 'react';

export default function KPIGrid({ stats, userRole }) {
  if (userRole !== 'admin') {
    // Customer banner
    return (
      <section style={{
        background: '#ffffff',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 28px',
        marginBottom: '28px',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--primary)', background: '#fffbeb', border: '1px solid #fde68a', padding: '3px 10px', borderRadius: '9999px', marginBottom: '8px' }}>
            <span>⚡ FASTEST URBAN CABS</span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '4px', color: 'var(--text-primary)' }}>
            Seamless City Rides with <span style={{ color: 'var(--primary)' }}>DiyaTaxi</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>
            Book Bikes, Autos, Minis, Sedans & SUVs across Delhi, Mumbai, Bengaluru, Chennai, and Kolkata.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '20px' }}>⏱️</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>~3 Mins ETA</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Quick Arrival</div>
            </div>
          </div>

          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '20px' }}>🛡️</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Verified Fleet</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>100% Safe Drivers</div>
            </div>
          </div>

          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '20px' }}>💵</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700 }}>Transparent Fares</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No Surge Pricing</div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Admin view with full operational metrics
  if (!stats) return null;

  return (
    <section className="kpi-grid" aria-label="Executive Metrics">
      <div className="kpi-card" style={{ '--card-accent': '#f59e0b' }}>
        <div className="kpi-header">
          <span className="kpi-title">Total Revenue</span>
          <div className="kpi-icon">💰</div>
        </div>
        <div className="kpi-value">₹{stats.totalRevenue?.toLocaleString()}</div>
        <div className="kpi-footer">
          <span className="kpi-trend-up">↑ 100%</span> verified settlements
        </div>
      </div>

      <div className="kpi-card" style={{ '--card-accent': '#38bdf8' }}>
        <div className="kpi-header">
          <span className="kpi-title">Total Trips Booked</span>
          <div className="kpi-icon">🧭</div>
        </div>
        <div className="kpi-value">{stats.totalOrders?.toLocaleString()}</div>
        <div className="kpi-footer">
          Across 5 metropolitan cities
        </div>
      </div>

      <div className="kpi-card" style={{ '--card-accent': '#10b981' }}>
        <div className="kpi-header">
          <span className="kpi-title">Fulfillment Rate</span>
          <div className="kpi-icon">🎯</div>
        </div>
        <div className="kpi-value">{stats.completionRate}%</div>
        <div className="kpi-footer">
          Completed rides vs cancellations
        </div>
      </div>

      <div className="kpi-card" style={{ '--card-accent': '#a855f7' }}>
        <div className="kpi-header">
          <span className="kpi-title">Registered Fleet</span>
          <div className="kpi-icon">🚘</div>
        </div>
        <div className="kpi-value">{stats.totalDrivers?.toLocaleString()}</div>
        <div className="kpi-footer">
          Autos, Bikes, Sedans & SUVs
        </div>
      </div>

      <div className="kpi-card" style={{ '--card-accent': '#ec4899' }}>
        <div className="kpi-header">
          <span className="kpi-title">Total Distance</span>
          <div className="kpi-icon">🛣️</div>
        </div>
        <div className="kpi-value">{stats.totalDistanceKm?.toLocaleString()} km</div>
        <div className="kpi-footer">
          City transit routes covered
        </div>
      </div>
    </section>
  );
}
