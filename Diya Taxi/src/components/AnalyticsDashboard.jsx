import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { dataService } from '../services/dataService.js';

Chart.register(...registerables);
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = '#1e293b';
Chart.defaults.font.family = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";

export default function AnalyticsDashboard({ refreshTrigger }) {
  const cityCanvasRef = useRef(null);
  const vehicleCanvasRef = useRef(null);
  const paymentCanvasRef = useRef(null);

  const chartsRef = useRef({ city: null, vehicle: null, payment: null });

  useEffect(() => {
    const data = dataService.getAnalyticsData();

    // 1. City Chart
    if (cityCanvasRef.current) {
      if (chartsRef.current.city) chartsRef.current.city.destroy();
      chartsRef.current.city = new Chart(cityCanvasRef.current, {
        type: 'bar',
        data: {
          labels: Object.keys(data.cities),
          datasets: [{
            data: Object.values(data.cities),
            backgroundColor: [
              'rgba(245, 158, 11, 0.8)',
              'rgba(59, 130, 246, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(236, 72, 153, 0.8)',
              'rgba(168, 85, 247, 0.8)'
            ],
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#64748b' } },
            y: { beginAtZero: true, grid: { color: 'rgba(15, 23, 42, 0.06)' }, ticks: { color: '#64748b' } }
          }
        }
      });
    }

    // 2. Vehicle Chart
    if (vehicleCanvasRef.current) {
      if (chartsRef.current.vehicle) chartsRef.current.vehicle.destroy();
      const vLabels = Object.keys(data.vehicles);
      const vRevenues = vLabels.map(k => data.vehicles[k].revenue);

      chartsRef.current.vehicle = new Chart(vehicleCanvasRef.current, {
        type: 'doughnut',
        data: {
          labels: vLabels,
          datasets: [{
            data: vRevenues,
            backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, padding: 16, color: '#cbd5e1' } },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ₹${ctx.raw.toLocaleString()}`
              }
            }
          }
        }
      });
    }

    // 3. Payment Chart
    if (paymentCanvasRef.current) {
      if (chartsRef.current.payment) chartsRef.current.payment.destroy();
      chartsRef.current.payment = new Chart(paymentCanvasRef.current, {
        type: 'polarArea',
        data: {
          labels: Object.keys(data.payments),
          datasets: [{
            data: Object.values(data.payments),
            backgroundColor: [
              'rgba(16, 185, 129, 0.75)',
              'rgba(245, 158, 11, 0.75)',
              'rgba(59, 130, 246, 0.75)',
              'rgba(168, 85, 247, 0.75)'
            ],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12, color: '#475569' } }
          },
          scales: {
            r: { grid: { color: 'rgba(15, 23, 42, 0.06)' }, ticks: { display: false } }
          }
        }
      });
    }

    return () => {
      if (chartsRef.current.city) chartsRef.current.city.destroy();
      if (chartsRef.current.vehicle) chartsRef.current.vehicle.destroy();
      if (chartsRef.current.payment) chartsRef.current.payment.destroy();
    };
  }, [refreshTrigger]);

  return (
    <section>
      <h2 className="section-title">Fleet & Financial Analytics</h2>
      <p className="section-subtitle">Real-time performance metrics derived from 2,216 orders and 2,141 delivery settlements.</p>

      <div className="analytics-charts-grid">
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">🏙️ Trips Booked by City</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Metropolitan distribution</span>
          </div>
          <div className="chart-canvas-wrapper">
            <canvas ref={cityCanvasRef}></canvas>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">🚗 Revenue Share by Vehicle Class</h3>
            <span style={{ fontSize: '12px', color: 'var(--primary)' }}>Total ₹ Revenue</span>
          </div>
          <div className="chart-canvas-wrapper">
            <canvas ref={vehicleCanvasRef}></canvas>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">💳 Payment Method Distribution</h3>
            <span style={{ fontSize: '12px', color: 'var(--accent-emerald)' }}>Settlement channels</span>
          </div>
          <div className="chart-canvas-wrapper">
            <canvas ref={paymentCanvasRef}></canvas>
          </div>
        </div>
      </div>
    </section>
  );
}
