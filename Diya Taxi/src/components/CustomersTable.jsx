import React, { useState, useMemo } from 'react';
import { dataService } from '../services/dataService.js';

export default function CustomersTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  const filteredCustomers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return dataService.customers.filter(c => {
      const matchType = selectedType === 'all' || (c.CustomerType && c.CustomerType.toLowerCase() === selectedType.toLowerCase());
      const matchSearch = !q || c.Name.toLowerCase().includes(q) || c.Phone.includes(q) || (c.City && c.City.toLowerCase().includes(q));
      return matchType && matchSearch;
    });
  }, [searchTerm, selectedType]);

  return (
    <section>
      <div className="filter-bar">
        <div className="filter-group">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="input-control"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search passenger name, phone, city..."
            />
          </div>

          <select
            className="select-control"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">All Customer Tiers</option>
            <option value="Regular">Regular</option>
            <option value="Premium">Premium</option>
          </select>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {filteredCustomers.length} Registered Customers
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Full Name</th>
              <th>Phone Number</th>
              <th>City</th>
              <th>Membership Tier</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.slice(0, 35).map(c => (
              <tr key={c.CID}>
                <td><strong style={{ color: 'var(--primary)' }}>#{c.CID}</strong></td>
                <td style={{ fontWeight: 600 }}>{c.Name}</td>
                <td>{c.Phone}</td>
                <td>📍 {c.City || 'N/A'}</td>
                <td>
                  <span className={`badge ${c.CustomerType === 'Premium' ? 'badge-premium' : 'badge-regular'}`}>
                    {c.CustomerType}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
