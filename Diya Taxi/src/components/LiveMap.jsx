import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet asset paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createCustomIcon = (type, color = '#f59e0b') => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background: ${color};
        color: #0f172a;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 15px ${color}88, 0 4px 6px rgba(0,0,0,0.3);
        border: 2px solid #ffffff;
        font-size: 16px;
        font-weight: bold;
      ">
        ${type === 'pickup' ? '🟢' : type === 'drop' ? '🏁' : '🚖'}
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18]
  });
};

const CITY_CENTERS = {
  delhi: [28.6139, 77.2090],
  mumbai: [19.0760, 72.8777],
  bengaluru: [12.9716, 77.5946],
  chennai: [13.0827, 80.2707],
  kolkata: [22.5726, 88.3639]
};

export default function LiveMap({ pickup, drop, city }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef({ markers: [], polyline: null });

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialCenter = CITY_CENTERS[(city || 'delhi').toLowerCase()] || [28.6139, 77.2090];
    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: false
    }).setView(initialCenter, 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c']
    }).addTo(map);

    L.control.attribution({ position: 'bottomright' })
      .addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; DiyaTaxi')
      .addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update center or route when props change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old layers
    layersRef.current.markers.forEach(m => map.removeLayer(m));
    layersRef.current.markers = [];
    if (layersRef.current.polyline) {
      map.removeLayer(layersRef.current.polyline);
      layersRef.current.polyline = null;
    }

    if (pickup?.coords && drop?.coords) {
      const pCoords = [pickup.coords[1], pickup.coords[0]];
      const dCoords = [drop.coords[1], drop.coords[0]];

      const pMarker = L.marker(pCoords, { icon: createCustomIcon('pickup', '#10b981') })
        .addTo(map)
        .bindPopup(`
          <div class="map-popup-card">
            <span class="popup-badge pickup">PICKUP POINT</span>
            <strong>${pickup.area || 'Pickup Point'}</strong>
            <div class="popup-sub">${city || ''}</div>
          </div>
        `);

      const dMarker = L.marker(dCoords, { icon: createCustomIcon('drop', '#ef4444') })
        .addTo(map)
        .bindPopup(`
          <div class="map-popup-card">
            <span class="popup-badge drop">DESTINATION</span>
            <strong>${drop.area || 'Drop Point'}</strong>
            <div class="popup-sub">${city || ''}</div>
          </div>
        `);

      const polyline = L.polyline([pCoords, dCoords], {
        color: '#f59e0b',
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.9,
        lineCap: 'round'
      }).addTo(map);

      layersRef.current.markers = [pMarker, dMarker];
      layersRef.current.polyline = polyline;

      const bounds = L.latLngBounds([pCoords, dCoords]);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    } else if (city) {
      const c = CITY_CENTERS[city.toLowerCase()] || CITY_CENTERS.delhi;
      map.setView(c, 12);
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 150);
  }, [pickup, drop, city]);

  return (
    <div className="map-view-wrapper">
      <div className="map-header-bar">
        <div className="map-title">
          <span>🗺️ Live Route Radar & Geo Coordinates</span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--accent-emerald)', fontWeight: 700 }}>
          LEAFLET LIVE MAP
        </span>
      </div>
      <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '520px', background: '#0b0f19' }} />
    </div>
  );
}
