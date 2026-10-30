import React, { useState, useEffect } from 'react';
import { VEHICLE_CONFIG, calculateDistanceKm, calculateFareBreakdown } from '../services/bookingEngine.js';
import { dataService } from '../services/dataService.js';
import LiveMap from './LiveMap.jsx';

export default function BookingSimulator({ onStartBooking, inspectTrip, currentUser, onAutoLogin }) {
  const cities = dataService.getCities();
  const [selectedCity, setSelectedCity] = useState(inspectTrip?.city || 'Delhi');
  const [areas, setAreas] = useState([]);
  const [pickupArea, setPickupArea] = useState('');
  const [dropArea, setDropArea] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('Auto');
  const [paymentMode, setPaymentMode] = useState('UPI');

  // Manual passenger name and contact
  const [passengerName, setPassengerName] = useState(currentUser?.name || '');
  const [passengerPhone, setPassengerPhone] = useState(currentUser?.phone && currentUser.phone !== 'N/A' ? currentUser.phone : '');
  const [nameError, setNameError] = useState('');

  // Sync if currentUser updates or logs out
  useEffect(() => {
    if (currentUser?.name) {
      setPassengerName(currentUser.name);
      if (currentUser.phone && currentUser.phone !== 'N/A') {
        setPassengerPhone(currentUser.phone);
      }
    } else {
      setPassengerName('');
      setPassengerPhone('');
    }
  }, [currentUser]);

  // Helper to trigger auto-login
  const triggerAutoLogin = (nameVal, phoneVal) => {
    const trimmed = (nameVal || '').trim();
    if (!trimmed) return;
    if (onAutoLogin) {
      onAutoLogin({
        name: trimmed,
        phone: (phoneVal || '').trim() || 'N/A'
      });
    }
  };

  // Debounced auto-login while typing name (if guest or name changed)
  useEffect(() => {
    const trimmed = passengerName.trim();
    if (!trimmed || trimmed.length < 2) return;
    if (currentUser?.name === trimmed) return;

    const timer = setTimeout(() => {
      triggerAutoLogin(passengerName, passengerPhone);
    }, 700);

    return () => clearTimeout(timer);
  }, [passengerName, passengerPhone, currentUser]);

  // Load areas when city changes
  useEffect(() => {
    const cityAreas = dataService.getAreasForCity(selectedCity);
    const validAreas = cityAreas.length > 0 ? cityAreas : ['Central Hub', 'Airport Terminal', 'Railway Station'];
    setAreas(validAreas);

    if (inspectTrip && inspectTrip.city === selectedCity) {
      setPickupArea(inspectTrip.pickupArea);
      setDropArea(inspectTrip.dropArea);
    } else {
      setPickupArea(validAreas[0] || '');
      setDropArea(validAreas[1] || validAreas[0] || '');
    }
  }, [selectedCity, inspectTrip]);

  // Determine coordinates
  let pCoords = dataService.getCoordinatesForArea(selectedCity, pickupArea) || [77.2090, 28.6139];
  let dCoords = dataService.getCoordinatesForArea(selectedCity, dropArea);
  if (!dCoords || (pCoords[0] === dCoords[0] && pCoords[1] === dCoords[1])) {
    dCoords = [pCoords[0] + 0.045, pCoords[1] + 0.035];
  }

  const distanceKm = calculateDistanceKm(pCoords[1], pCoords[0], dCoords[1], dCoords[0]);
  const fareBreakdown = calculateFareBreakdown(selectedVehicle, distanceKm);

  const handleBooking = () => {
    const trimmedName = passengerName.trim();
    if (!trimmedName) {
      setNameError('Please enter your name to book the ride.');
      return;
    }
    setNameError('');

    // Ensure auto-login is completed before dispatch
    if (onAutoLogin && (!currentUser || currentUser.name !== trimmedName)) {
      onAutoLogin({
        name: trimmedName,
        phone: passengerPhone.trim() || 'N/A'
      });
    }

    onStartBooking({
      passengerName: trimmedName,
      passengerPhone: passengerPhone.trim() || 'N/A',
      city: selectedCity,
      pickupArea,
      pickupCoords: pCoords,
      dropArea,
      dropCoords: dCoords,
      vehicleType: selectedVehicle,
      paymentMode
    });
  };

  return (
    <div className="booking-hero-wrapper">
      {/* Booking Form Panel */}
      <div className="booking-panel">
        <h2 className="booking-panel-title">
          <span>Book Your DiyaTaxi</span>
          <span style={{ fontSize: '11px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '4px' }}>
            ACCURATE KM PRICING
          </span>
        </h2>
        <p className="booking-panel-desc">Enter your name, locations, and view exact price calculation per km.</p>

        {/* Passenger Manual Name & Contact Input with Auto-Login */}
        <div style={{
          background: currentUser?.name ? 'rgba(16, 185, 129, 0.08)' : '#f8fafc',
          border: currentUser?.name ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid #e2e8f0',
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px',
          marginBottom: '18px',
          transition: 'all 0.25s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: currentUser?.name ? 'var(--accent-emerald)' : 'var(--text-secondary)' }}>
              {currentUser?.name ? '👤 Logged-in Passenger' : '👤 Passenger Details'}
            </span>
            {currentUser?.name ? (
              <span style={{
                fontSize: '11px',
                background: 'rgba(16, 185, 129, 0.2)',
                color: 'var(--accent-emerald)',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontWeight: 700
              }}>
                ✓ Active Passenger Session
              </span>
            ) : (
              <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>
                ⚡ Auto-login on typing name
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 180px' }}>
              <label className="route-field-label">
                Passenger Name <span style={{ color: 'var(--primary)' }}>*</span>
              </label>
              <input
                type="text"
                className="input-control"
                style={{ width: '100%' }}
                placeholder="Enter your name (e.g. Pavithra)"
                value={passengerName}
                onChange={(e) => {
                  setPassengerName(e.target.value);
                  if (nameError) setNameError('');
                }}
                onBlur={() => {
                  if (passengerName.trim() && (!currentUser || currentUser.name !== passengerName.trim())) {
                    triggerAutoLogin(passengerName, passengerPhone);
                  }
                }}
                required
              />
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <label className="route-field-label">📞 Mobile Number (Optional)</label>
              <input
                type="tel"
                className="input-control"
                style={{ width: '100%' }}
                placeholder="Enter 10-digit mobile number"
                value={passengerPhone}
                onChange={(e) => {
                  setPassengerPhone(e.target.value);
                  if (currentUser?.name && passengerName.trim()) {
                    triggerAutoLogin(passengerName, e.target.value);
                  }
                }}
              />
            </div>
          </div>

          {nameError && (
            <div style={{ color: '#f87171', fontSize: '12px', marginTop: '8px' }}>
              ⚠️ {nameError}
            </div>
          )}

          {currentUser?.name ? (
            <div style={{ fontSize: '11px', color: 'var(--accent-emerald)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>✓</span> Logged in as <strong>{currentUser.name}</strong>. Ready to book your ride!
            </div>
          ) : (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
              💡 Entering your name automatically logs you in as a passenger.
            </div>
          )}
        </div>

        {/* City Selector */}
        <div style={{ marginBottom: '18px' }}>
          <label className="route-field-label">Target City</label>
          <select
            className="select-control"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            style={{ width: '100%' }}
          >
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Route Locations */}
        <div className="route-inputs-container">
          <div className="route-indicator-line"></div>

          <div className="input-with-pin">
            <div className="pin-icon pickup">●</div>
            <div className="route-field-wrap">
              <div className="route-field-label">Pickup Location</div>
              <select
                className="select-control"
                value={pickupArea}
                onChange={(e) => setPickupArea(e.target.value)}
                style={{ width: '100%' }}
              >
                {areas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <div className="input-with-pin">
            <div className="pin-icon drop">●</div>
            <div className="route-field-wrap">
              <div className="route-field-label">Drop Destination</div>
              <select
                className="select-control"
                value={dropArea}
                onChange={(e) => setDropArea(e.target.value)}
                style={{ width: '100%' }}
              >
                {areas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Vehicle Tier Selector */}
        <div className="vehicle-selector-label">
          <span>Choose Vehicle Class</span>
          <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Distance: {distanceKm} km</span>
        </div>

        <div className="vehicle-tiers-grid">
          {Object.keys(VEHICLE_CONFIG).map(vKey => {
            const v = VEHICLE_CONFIG[vKey];
            const tierBreakdown = calculateFareBreakdown(vKey, distanceKm);
            const isSelected = vKey === selectedVehicle;
            return (
              <div
                key={vKey}
                className={`vehicle-tier-card ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedVehicle(vKey)}
              >
                <div className="vehicle-tier-left">
                  <div className="vehicle-emoji">{v.icon}</div>
                  <div className="vehicle-tier-info">
                    <h4>{v.name}</h4>
                    <div className="vehicle-tier-sub">
                      <span>₹{v.baseFare} base</span> &bull; 
                      <span style={{ color: 'var(--primary)', fontWeight: 600 }}>₹{v.perKm}/km</span>
                    </div>
                  </div>
                </div>
                <div className="vehicle-tier-price">
                  <div className="vehicle-price-val">₹{tierBreakdown.totalFare}</div>
                  <div className="vehicle-price-eta">~{v.etaMin} mins away</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Exact Fare Breakdown Box */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px',
          marginBottom: '18px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)' }}>
              TRANSPARENT FARE BREAKDOWN
            </span>
            <span style={{ fontSize: '12px', color: 'var(--accent-emerald)', fontWeight: 600 }}>
              {distanceKm} km Route
            </span>
          </div>

          <div style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Base Fare:</span>
            <span>₹{fareBreakdown.baseFare}</span>
          </div>

          <div style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Distance Rate ({distanceKm} km &times; ₹{fareBreakdown.perKm}/km):</span>
            <span>₹{fareBreakdown.distanceCost}</span>
          </div>

          <div style={{
            borderTop: '1px dashed #cbd5e1',
            marginTop: '6px',
            paddingTop: '6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontWeight: 700, fontSize: '14px' }}>Total Calculated Price:</span>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 800, color: 'var(--primary)' }}>
              ₹{fareBreakdown.totalFare}
            </span>
          </div>
        </div>

        {/* Payment Mode */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Payment:
          </label>
          <select
            className="select-control"
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
            <option value="Cash">Cash at Drop</option>
            <option value="Card">Credit / Debit Card</option>
            <option value="Wallet">Diya Wallet</option>
          </select>
        </div>

        <button className="btn btn-primary" onClick={handleBooking} style={{ width: '100%', padding: '14px', fontSize: '16px' }}>
          Confirm & Dispatch DiyaTaxi 🚖
        </button>
      </div>

      {/* Live Route Map */}
      <LiveMap
        pickup={{ coords: pCoords, area: pickupArea }}
        drop={{ coords: dCoords, area: dropArea }}
        city={selectedCity}
      />
    </div>
  );
}
