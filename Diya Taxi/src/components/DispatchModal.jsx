import React, { useState, useEffect } from 'react';

export default function DispatchModal({ simData, onClose, onComplete, onCancel }) {
  const [stage, setStage] = useState('searching'); // searching | matched | completed

  useEffect(() => {
    if (!simData) return;
    setStage('searching');
    const timer = setTimeout(() => {
      setStage('matched');
    }, 1200);
    return () => clearTimeout(timer);
  }, [simData]);

  if (!simData) return null;

  return (
    <div className="modal-overlay open">
      <div className="modal-card">
        <div className="modal-header">
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--primary)' }}>
            🚖 DiyaTaxi Ride Dispatcher
          </h3>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {stage === 'searching' && (
            <div className="dispatch-radar-wrap">
              <div className="radar-circle">🚖</div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>Contacting Nearby Drivers...</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>
                Broadcasting booking request in {simData.order.City} for {simData.order.VehicleType}
              </p>
            </div>
          )}

          {stage === 'matched' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontSize: '28px', marginBottom: '12px' }}>
                  ✓
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Driver Confirmed!</h3>
                <p style={{ color: 'var(--accent-emerald)', fontSize: '13px', fontWeight: 600 }}>
                  Arriving at {simData.order.PickupLocation.Area} in ~3 mins
                </p>
              </div>

              <div className="driver-card-matched">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div className="driver-avatar">{simData.driver.Name.charAt(0)}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>{simData.driver.Name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {simData.driver.Phone} &bull; ★ 4.9
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase' }}>
                      {simData.driver.VehicleType}
                    </div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>START TRIP OTP</div>
                  <div className="otp-box">7294</div>
                </div>
              </div>

              <div className="receipt-box">
                <div className="receipt-row">
                  <span style={{ color: 'var(--text-secondary)' }}>Passenger</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {simData.passengerName} {simData.passengerPhone && simData.passengerPhone !== 'N/A' ? `(${simData.passengerPhone})` : ''}
                  </span>
                </div>
                <div className="receipt-row">
                  <span style={{ color: 'var(--text-secondary)' }}>Assigned Vehicle</span>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--primary)' }}>
                    {simData.driver.VehicleType} &bull; {simData.driver.VehicleNumber}
                  </span>
                </div>
                <div className="receipt-row">
                  <span style={{ color: 'var(--text-secondary)' }}>Distance Rate</span>
                  <span>{simData.distanceKm} km &times; ₹{simData.breakdown?.perKm || 12}/km = ₹{simData.breakdown?.distanceCost || (simData.fare - 35)}</span>
                </div>
                <div className="receipt-row">
                  <span style={{ color: 'var(--text-secondary)' }}>Base Fare</span>
                  <span>₹{simData.breakdown?.baseFare || 35}</span>
                </div>
                <div className="receipt-row">
                  <span style={{ color: 'var(--text-secondary)' }}>Payment Mode</span>
                  <span>{simData.delivery.PaymentMode}</span>
                </div>
                <div className="receipt-row total">
                  <span>Total Calculated Fare</span>
                  <span>₹{simData.fare}</span>
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => {
                    onComplete(simData);
                    setStage('completed');
                  }}
                >
                  Complete & Save Trip
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    onCancel(simData);
                    onClose();
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {stage === 'completed' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏁</div>
              <h3 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--accent-emerald)' }}>Trip Completed!</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Fare ₹{simData.fare} received via {simData.delivery.PaymentMode}. Order #{simData.order.OrderID} recorded in DiyaTaxi.
              </p>
              <button className="btn btn-primary" onClick={onClose}>
                Close Window
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
