import React, { useState } from 'react';
import Navbar from './components/Navbar.jsx';
import KPIGrid from './components/KPIGrid.jsx';
import BookingSimulator from './components/BookingSimulator.jsx';
import OrdersTable from './components/OrdersTable.jsx';
import AnalyticsDashboard from './components/AnalyticsDashboard.jsx';
import DriversGrid from './components/DriversGrid.jsx';
import CustomersTable from './components/CustomersTable.jsx';
import DispatchModal from './components/DispatchModal.jsx';
import OrderDetailModal from './components/OrderDetailModal.jsx';
import LoginModal from './components/LoginModal.jsx';

import { dataService } from './services/dataService.js';
import { createBookingSimulation } from './services/bookingEngine.js';

export default function App() {
  const [userRole, setUserRole] = useState('customer'); // 'customer' | 'admin'
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalType, setLoginModalType] = useState('customer');

  const [activeTab, setActiveTab] = useState('booking');
  const [stats, setStats] = useState(() => dataService.getSummaryStats());
  const [refreshTrigger, setRefreshTrigger] = useState(Date.now());
  const [activeSimulation, setActiveSimulation] = useState(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [inspectTrip, setInspectTrip] = useState(null);

  const handleOpenLogin = (type = 'customer') => {
    setLoginModalType(type);
    setIsLoginModalOpen(true);
  };

  const handleLoginSuccess = (user) => {
    if (user.role === 'admin') {
      setUserRole('admin');
      setCurrentUser(user);
      setActiveTab('orders'); // Switch directly to Admin Orders Dashboard
    } else {
      setUserRole('customer');
      setCurrentUser(user);
      setActiveTab('booking');
    }
  };

  const handleAutoLogin = (passenger) => {
    if (!passenger?.name) return;
    setUserRole('customer');
    setCurrentUser({
      role: 'customer',
      name: passenger.name,
      phone: passenger.phone || 'N/A'
    });
  };

  const handleLogout = () => {
    setUserRole('customer');
    setCurrentUser(null);
    setActiveTab('booking'); // Reset back to Customer Booking
  };

  const handleStartBooking = (bookingParams) => {
    const sim = createBookingSimulation({
      ...bookingParams,
      customerId: Math.floor(Math.random() * 490) + 1
    });
    setActiveSimulation(sim);
  };

  const handleCompleteBooking = (sim) => {
    dataService.addNewLiveBooking(sim.order, sim.delivery, sim.driver);
    setStats(dataService.getSummaryStats());
    setRefreshTrigger(Date.now());
  };

  const handleCancelBooking = (sim) => {
    sim.delivery.DeliveryStatus = 'Cancelled';
    sim.delivery.PaymentAmount = 0;
    dataService.addNewLiveBooking(sim.order, sim.delivery, sim.driver);
    setStats(dataService.getSummaryStats());
    setRefreshTrigger(Date.now());
  };

  const handleInspectMap = (order) => {
    setSelectedOrderDetail(null);
    setInspectTrip({
      city: order.City,
      pickupArea: order.PickupLocation?.Area,
      dropArea: order.DropLocation?.Area
    });
    setActiveTab('booking');
  };

  // Ensure non-admin users cannot access admin tabs
  const effectiveTab = userRole === 'admin' ? activeTab : 'booking';

  return (
    <div>
      <Navbar
        activeTab={effectiveTab}
        setActiveTab={setActiveTab}
        userRole={userRole}
        currentUser={currentUser}
        onOpenLogin={handleOpenLogin}
        onLogout={handleLogout}
      />

      <main className="container" style={{ paddingTop: '24px' }}>
        <KPIGrid stats={stats} userRole={userRole} />

        {/* Customer Only or Admin: Book Ride */}
        {effectiveTab === 'booking' && (
          <BookingSimulator
            onStartBooking={handleStartBooking}
            inspectTrip={inspectTrip}
            currentUser={currentUser}
            onAutoLogin={handleAutoLogin}
          />
        )}

        {/* Admin Protected Views: Orders, Analytics, Drivers, Customers */}
        {userRole === 'admin' && effectiveTab === 'orders' && (
          <OrdersTable
            onViewDetails={(order) => setSelectedOrderDetail(order)}
            refreshTrigger={refreshTrigger}
          />
        )}

        {userRole === 'admin' && effectiveTab === 'analytics' && (
          <AnalyticsDashboard refreshTrigger={refreshTrigger} />
        )}

        {userRole === 'admin' && effectiveTab === 'drivers' && (
          <DriversGrid />
        )}

        {userRole === 'admin' && effectiveTab === 'customers' && (
          <CustomersTable />
        )}
      </main>

      {/* Login Modal (Passenger or Admin) */}
      <LoginModal
        isOpen={isLoginModalOpen}
        initialType={loginModalType}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Dispatch Modal */}
      {activeSimulation && (
        <DispatchModal
          simData={activeSimulation}
          onClose={() => setActiveSimulation(null)}
          onComplete={handleCompleteBooking}
          onCancel={handleCancelBooking}
        />
      )}

      {/* Order Journey Details Modal */}
      {selectedOrderDetail && (
        <OrderDetailModal
          order={selectedOrderDetail}
          onClose={() => setSelectedOrderDetail(null)}
          onInspectMap={handleInspectMap}
        />
      )}
    </div>
  );
}
