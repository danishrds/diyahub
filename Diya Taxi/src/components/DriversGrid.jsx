import React, { useState, useMemo } from 'react';
import { dataService } from '../services/dataService.js';
import { VEHICLE_CONFIG } from '../services/bookingEngine.js';

export default function DriversGrid() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');

  const filteredDrivers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return dataService.providers.filter(p => {
      const matchCity = selectedCity === 'all' || (p.City && p.City.toLowerCase() === selectedCity.toLowerCase());
      const matchSearch = !q || p.Name.toLowerCase().includes(q) || p.VehicleNumber.toLowerCase().includes(q) || p.Phone.includes(q);
      return matchCity && matchSearch;
    });
  }, [searchTerm, selectedCity]);

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
              placeholder="Search driver name, vehicle number..."
            />
          </div>

          <select
            className="select-control"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
          >
            <option value="all">All Cities</option>
            <option value="Delhi">Delhi</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Bengaluru">Bengaluru</option>
            <option value="Chennai">Chennai</option>
            <option value="Kolkata">Kolkata</option>
          </select>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {filteredDrivers.length} Verified Fleet Drivers
        </div>
      </div>

      <div className="drivers-grid">
        {filteredDrivers.slice(0, 48).map(d => {
          const vConfig = VEHICLE_CONFIG[d.VehicleType] || { icon: '🚖' };
          return (
            <div key={d.PID} className="driver-item-card">
              <div className="driver-item-top">
                <div className="driver-avatar-circle">{vConfig.icon}</div>
                <div className="driver-details">
                  <h4>{d.Name}</h4>
                  <div className="phone">{d.Phone}</div>
                </div>
              </div>

              <div className="driver-vehicle-plate">
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>{d.VehicleType}</span>
                <span className="plate-number">{d.VehicleNumber}</span>
              </div>

              <div className="driver-meta-row">
                <span className="driver-city-tag">📍 {d.City}</span>
                <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>● Active Driver</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
