import React, { useState, useMemo } from 'react';
import { dataService } from '../services/dataService.js';

export default function OrdersTable({ onViewDetails, refreshTrigger }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const filteredOrders = useMemo(() => {
    return dataService.getEnrichedOrders({
      search: searchTerm,
      city: selectedCity,
      vehicleType: selectedVehicle,
      status: selectedStatus
    });
  }, [searchTerm, selectedCity, selectedVehicle, selectedStatus, refreshTrigger]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const startIdx = (activePage - 1) * pageSize;
  const paginatedOrders = filteredOrders.slice(startIdx, startIdx + pageSize);

  return (
    <section>
      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="input-control"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search Order ID, passenger, driver, area..."
            />
          </div>

          <select
            className="select-control"
            value={selectedCity}
            onChange={(e) => { setSelectedCity(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">All Cities</option>
            <option value="Delhi">Delhi</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Bengaluru">Bengaluru</option>
            <option value="Chennai">Chennai</option>
            <option value="Kolkata">Kolkata</option>
          </select>

          <select
            className="select-control"
            value={selectedVehicle}
            onChange={(e) => { setSelectedVehicle(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">All Vehicles</option>
            <option value="Bike">Bike</option>
            <option value="Auto">Auto</option>
            <option value="Mini">Mini</option>
            <option value="Sedan">Sedan</option>
            <option value="SUV">SUV</option>
          </select>

          <select
            className="select-control"
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Showing {Math.min(startIdx + 1, filteredOrders.length)} - {Math.min(startIdx + pageSize, filteredOrders.length)} of {filteredOrders.length} trips
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Vehicle</th>
              <th>Route (Pickup ➔ Drop)</th>
              <th>Assigned Provider</th>
              <th>Fare / Mode</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No DiyaTaxi trips found matching your filters.
                </td>
              </tr>
            ) : (
              paginatedOrders.map(order => {
                const status = order.delivery?.DeliveryStatus || 'Pending';
                const statusClass = status === 'Completed' ? 'badge-completed' : status === 'Cancelled' ? 'badge-cancelled' : 'badge-pending';
                return (
                  <tr key={order.OrderID} onClick={() => onViewDetails(order)}>
                    <td><strong style={{ color: 'var(--primary)' }}>#{order.OrderID}</strong></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{order.customer?.Name || 'Passenger'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{order.customer?.Phone || ''}</div>
                    </td>
                    <td>
                      <span className="badge badge-vehicle">{order.VehicleType}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '12.5px' }}><span style={{ color: '#10b981' }}>●</span> {order.PickupLocation?.Area || 'Pickup'}</div>
                      <div style={{ fontSize: '12.5px' }}><span style={{ color: '#ef4444' }}>●</span> {order.DropLocation?.Area || 'Drop'}</div>
                    </td>
                    <td>
                      <div>{order.provider?.Name || 'Driver'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>
                        {order.provider?.VehicleNumber || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <strong>₹{order.delivery?.PaymentAmount || 0}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{order.delivery?.PaymentMode || 'N/A'}</div>
                    </td>
                    <td>
                      <span className={`badge ${statusClass}`}>{status}</span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                        onClick={(e) => { e.stopPropagation(); onViewDetails(order); }}
                      >
                        Details ↗
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="pagination-wrapper">
          <div className="pagination-info">Click any trip row to view full journey breakdown</div>
          <div className="pagination-controls">
            <button
              className="btn-page"
              disabled={activePage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <button
              className="btn-page"
              disabled={activePage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
