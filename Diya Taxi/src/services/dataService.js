// DiyaTaxi React Data Service
import customersData from '../data/customers.json';
import providersData from '../data/providers.json';
import ordersData from '../data/orders.json';
import deliveriesData from '../data/deliveries.json';

class DataService {
  constructor() {
    this.customers = [...customersData];
    this.providers = [...providersData];
    this.orders = [...ordersData];
    this.deliveries = [...deliveriesData];

    this.customersMap = new Map();
    this.providersMap = new Map();
    this.deliveriesByOrderId = new Map();
    this.ordersMap = new Map();

    this.initMaps();
  }

  initMaps() {
    for (const c of this.customers) this.customersMap.set(c.CID, c);
    for (const p of this.providers) this.providersMap.set(p.PID, p);
    for (const d of this.deliveries) this.deliveriesByOrderId.set(d.OrderID, d);
    for (const o of this.orders) this.ordersMap.set(o.OrderID, o);
  }

  static parseDate(val) {
    if (!val) return null;
    if (typeof val === 'string') return new Date(val);
    if (val.$date) return new Date(val.$date);
    return null;
  }

  getEnrichedOrder(order) {
    const delivery = this.deliveriesByOrderId.get(order.OrderID);
    const customer = this.customersMap.get(order.CID);
    const provider = delivery ? this.providersMap.get(delivery.PID) : null;

    return {
      ...order,
      customer: customer || { Name: 'Unknown Passenger', Phone: 'N/A', CustomerType: 'Regular' },
      delivery: delivery || { DeliveryStatus: 'Pending', PaymentAmount: 0, PaymentMode: 'N/A', DistanceKm: 0 },
      provider: provider || { Name: 'Driver Dispatched', VehicleNumber: 'N/A', Phone: 'N/A', VehicleType: order.VehicleType }
    };
  }

  getEnrichedOrders(filter = {}) {
    let list = this.orders.map(o => this.getEnrichedOrder(o));

    if (filter.city && filter.city !== 'all') {
      list = list.filter(o => o.City && o.City.toLowerCase() === filter.city.toLowerCase());
    }

    if (filter.vehicleType && filter.vehicleType !== 'all') {
      list = list.filter(o => o.VehicleType && o.VehicleType.toLowerCase() === filter.vehicleType.toLowerCase());
    }

    if (filter.status && filter.status !== 'all') {
      list = list.filter(o => {
        const s = (o.delivery?.DeliveryStatus || 'Pending').toLowerCase();
        return s === filter.status.toLowerCase();
      });
    }

    if (filter.search && filter.search.trim()) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(o => {
        return (
          String(o.OrderID).includes(q) ||
          (o.customer?.Name && o.customer.Name.toLowerCase().includes(q)) ||
          (o.provider?.Name && o.provider.Name.toLowerCase().includes(q)) ||
          (o.PickupLocation?.Area && o.PickupLocation.Area.toLowerCase().includes(q)) ||
          (o.DropLocation?.Area && o.DropLocation.Area.toLowerCase().includes(q)) ||
          (o.provider?.VehicleNumber && o.provider.VehicleNumber.toLowerCase().includes(q))
        );
      });
    }

    // Sort newest orders first
    list.sort((a, b) => {
      const ta = DataService.parseDate(a.BookingTime)?.getTime() || 0;
      const tb = DataService.parseDate(b.BookingTime)?.getTime() || 0;
      return tb - ta;
    });

    return list;
  }

  getSummaryStats() {
    let totalRevenue = 0;
    let completedCount = 0;
    let cancelledCount = 0;
    let totalDistanceKm = 0;

    for (const d of this.deliveries) {
      if (d.DeliveryStatus === 'Completed') {
        completedCount++;
        totalRevenue += (d.PaymentAmount || 0);
        totalDistanceKm += (d.DistanceKm || 0);
      } else if (d.DeliveryStatus === 'Cancelled') {
        cancelledCount++;
      }
    }

    const totalOrders = this.orders.length;
    const avgFare = completedCount > 0 ? (totalRevenue / completedCount).toFixed(1) : 0;
    const completionRate = totalOrders > 0 ? ((completedCount / totalOrders) * 100).toFixed(1) : 0;

    return {
      totalOrders,
      completedCount,
      cancelledCount,
      totalRevenue,
      avgFare,
      completionRate,
      totalDistanceKm: Math.round(totalDistanceKm),
      totalCustomers: this.customers.length,
      totalDrivers: this.providers.length
    };
  }

  getAnalyticsData() {
    const cityMap = {};
    for (const o of this.orders) {
      const c = o.City || 'Other';
      cityMap[c] = (cityMap[c] || 0) + 1;
    }

    const vehicleMap = {};
    for (const o of this.orders) {
      const vt = o.VehicleType || 'Other';
      if (!vehicleMap[vt]) {
        vehicleMap[vt] = { count: 0, revenue: 0 };
      }
      vehicleMap[vt].count++;
      const del = this.deliveriesByOrderId.get(o.OrderID);
      if (del && del.DeliveryStatus === 'Completed') {
        vehicleMap[vt].revenue += (del.PaymentAmount || 0);
      }
    }

    const paymentMap = {};
    for (const d of this.deliveries) {
      if (d.PaymentMode) {
        paymentMap[d.PaymentMode] = (paymentMap[d.PaymentMode] || 0) + 1;
      }
    }

    return {
      cities: cityMap,
      vehicles: vehicleMap,
      payments: paymentMap
    };
  }

  getCities() {
    return ['Delhi', 'Mumbai', 'Bengaluru', 'Chennai', 'Kolkata'];
  }

  getAreasForCity(city) {
    const areas = new Set();
    for (const o of this.orders) {
      if (o.City && o.City.toLowerCase() === city.toLowerCase()) {
        if (o.PickupLocation?.Area) areas.add(o.PickupLocation.Area);
        if (o.DropLocation?.Area) areas.add(o.DropLocation.Area);
      }
    }
    return Array.from(areas).sort();
  }

  getCoordinatesForArea(city, area) {
    for (const o of this.orders) {
      if (o.City && o.City.toLowerCase() === city.toLowerCase()) {
        if (o.PickupLocation?.Area === area && o.PickupLocation.Location?.coordinates) {
          return o.PickupLocation.Location.coordinates;
        }
        if (o.DropLocation?.Area === area && o.DropLocation.Location?.coordinates) {
          return o.DropLocation.Location.coordinates;
        }
      }
    }
    return null;
  }

  getAvailableProviders(city, vehicleType) {
    return this.providers.filter(p => {
      const matchCity = p.City && p.City.toLowerCase() === city.toLowerCase();
      const matchType = !vehicleType || (p.VehicleType && p.VehicleType.toLowerCase() === vehicleType.toLowerCase());
      return matchCity && matchType;
    });
  }

  addNewLiveBooking(orderData, deliveryData, provider) {
    this.orders.unshift(orderData);
    this.ordersMap.set(orderData.OrderID, orderData);

    this.deliveries.unshift(deliveryData);
    this.deliveriesByOrderId.set(orderData.OrderID, deliveryData);

    if (provider && !this.providersMap.has(provider.PID)) {
      this.providers.push(provider);
      this.providersMap.set(provider.PID, provider);
    }

    return this.getEnrichedOrder(orderData);
  }
}

export const dataService = new DataService();
