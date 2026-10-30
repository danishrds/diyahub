import React from 'react';
import { dataService } from '../services/dataService.js';

export default function OrderDetailModal({ order, onClose, onInspectMap }) {
  if (!order) return null;

  const bookingDate = dataService.constructor.parseDate(order.BookingTime);

  return (
    <div className="modal-overlay open">
      <div className="modal-card">
        <div className="modal-header">
          <h3 style={{ fontSize: '17px', fontWeight: 700 }}>Trip Journey Details</h3>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 700 }}>Trip #{order.OrderID}</h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {order.City} &bull; {bookingDate ? bookingDate.toLocaleString() : 'N/A'}
              </span>
            </div>
            <span className={`badge ${order.delivery?.DeliveryStatus === 'Completed' ? 'badge-completed' : 'badge-cancelled'}`}>
              {order.delivery?.DeliveryStatus}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>CUSTOMER</div>
              <div style={{ fontWeight: 700, marginTop: '4px' }}>{order.customer?.Name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{order.customer?.Phone}</div>
              <span className={`badge ${order.customer?.CustomerType === 'Premium' ? 'badge-premium' : 'badge-regular'}`} style={{ marginTop: '6px' }}>
                {order.customer?.CustomerType} Tier
              </span>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>DRIVER & VEHICLE</div>
              <div style={{ fontWeight: 700, marginTop: '4px' }}>{order.provider?.Name || 'Not Assigned'}</div>
              <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600 }}>{order.provider?.VehicleNumber || 'N/A'}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{order.provider?.Phone || ''}</div>
            </div>
          </div>

          <div className="receipt-box" style={{ marginTop: 0, marginBottom: '20px' }}>
            <div className="receipt-row">
              <span style={{ color: 'var(--text-secondary)' }}>Pickup Location</span>
              <span style={{ fontWeight: 600 }}>🟢 {order.PickupLocation?.Area || 'N/A'}</span>
            </div>
            <div className="receipt-row">
              <span style={{ color: 'var(--text-secondary)' }}>Drop Destination</span>
              <span style={{ fontWeight: 600 }}>🏁 {order.DropLocation?.Area || 'N/A'}</span>
            </div>
            <div className="receipt-row">
              <span style={{ color: 'var(--text-secondary)' }}>Distance Traveled</span>
              <span>{order.delivery?.DistanceKm || 0} km</span>
            </div>
            <div className="receipt-row">
              <span style={{ color: 'var(--text-secondary)' }}>Vehicle Type</span>
              <span>{order.VehicleType}</span>
            </div>
            <div className="receipt-row">
              <span style={{ color: 'var(--text-secondary)' }}>Payment Mode</span>
              <span>{order.delivery?.PaymentMode || 'N/A'}</span>
            </div>
            <div className="receipt-row total">
              <span>Total Fare Paid</span>
              <span>₹{order.delivery?.PaymentAmount || 0}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={() => onInspectMap(order)}
            >
              View Route on Live Map 🗺️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
