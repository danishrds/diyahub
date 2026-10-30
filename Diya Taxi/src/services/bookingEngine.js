// DiyaTaxi React Booking Engine
import { dataService } from './dataService.js';

export const VEHICLE_CONFIG = {
  Bike: {
    icon: '🛵',
    name: 'Diya Bike',
    baseFare: 25,
    perKm: 9,
    capacity: '1 Passenger',
    etaMin: 2,
    desc: 'Fastest for single riders & tight city traffic'
  },
  Auto: {
    icon: '🛺',
    name: 'Diya Auto',
    baseFare: 35,
    perKm: 12,
    capacity: '3 Passengers',
    etaMin: 3,
    desc: 'Pocket-friendly doorstep auto rides'
  },
  Mini: {
    icon: '🚗',
    name: 'Diya Mini',
    baseFare: 50,
    perKm: 14,
    capacity: '4 Passengers',
    etaMin: 4,
    desc: 'Comfortable compact AC hatchbacks'
  },
  Sedan: {
    icon: '🚘',
    name: 'Diya Prime Sedan',
    baseFare: 75,
    perKm: 17,
    capacity: '4 Passengers',
    etaMin: 5,
    desc: 'Top-rated drivers with spacious sedans'
  },
  SUV: {
    icon: '🚙',
    name: 'Diya Prime SUV',
    baseFare: 100,
    perKm: 22,
    capacity: '6 Passengers',
    etaMin: 6,
    desc: 'Spacious 6-seater for family & luggage'
  }
};

export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const directDistance = R * c;
  return Math.max(1.5, Math.round(directDistance * 1.28 * 10) / 10);
}

export function estimateFare(vehicleType, distanceKm) {
  const cfg = VEHICLE_CONFIG[vehicleType] || VEHICLE_CONFIG.Mini;
  const distanceCost = Math.round(distanceKm * cfg.perKm);
  return cfg.baseFare + distanceCost;
}

export function calculateFareBreakdown(vehicleType, distanceKm) {
  const cfg = VEHICLE_CONFIG[vehicleType] || VEHICLE_CONFIG.Mini;
  const distanceCost = Math.round(distanceKm * cfg.perKm);
  const total = cfg.baseFare + distanceCost;
  return {
    baseFare: cfg.baseFare,
    perKm: cfg.perKm,
    distanceKm: distanceKm,
    distanceCost: distanceCost,
    totalFare: total,
    formula: `₹${cfg.baseFare} Base + (${distanceKm} km × ₹${cfg.perKm}/km) = ₹${total}`
  };
}

export function createBookingSimulation({ customerId, passengerName, passengerPhone, city, pickupArea, pickupCoords, dropArea, dropCoords, vehicleType, paymentMode }) {
  const distKm = calculateDistanceKm(
    pickupCoords[1], pickupCoords[0],
    dropCoords[1], dropCoords[0]
  );

  const breakdown = calculateFareBreakdown(vehicleType, distKm);
  const fare = breakdown.totalFare;

  const availableDrivers = dataService.getAvailableProviders(city, vehicleType);
  let chosenDriver;
  if (availableDrivers.length > 0) {
    chosenDriver = availableDrivers[Math.floor(Math.random() * availableDrivers.length)];
  } else {
    chosenDriver = {
      PID: 999,
      Name: 'Karthik Raja',
      Phone: '+91 98401 23456',
      VehicleType: vehicleType,
      VehicleNumber: 'TN 01 DT 9999',
      City: city
    };
  }

  const newOrderId = dataService.orders.length + 100;
  const newDeliveryId = dataService.deliveries.length + 100;

  const now = new Date();
  const pickupTime = new Date(now.getTime() + (4 * 60000));
  const dropTime = new Date(now.getTime() + (Math.round(distKm * 3.5) * 60000));

  // If a manual name is entered, dynamically create or assign customer
  const finalPassengerName = passengerName && passengerName.trim() ? passengerName.trim() : 'Guest Passenger';
  const finalPassengerPhone = passengerPhone && passengerPhone.trim() ? passengerPhone.trim() : 'N/A';
  const finalCustomerId = customerId || (dataService.customers.length + 100);

  const newCustomerObj = {
    CID: finalCustomerId,
    Name: finalPassengerName,
    Phone: finalPassengerPhone,
    CustomerType: 'Regular',
    City: city
  };
  dataService.customersMap.set(finalCustomerId, newCustomerObj);
  dataService.customers.unshift(newCustomerObj);

  const orderObj = {
    OrderID: newOrderId,
    CID: finalCustomerId,
    VehicleType: vehicleType,
    BookingTime: { $date: now.toISOString() },
    PickUpTime: { $date: pickupTime.toISOString() },
    City: city,
    PickupLocation: {
      Area: pickupArea,
      Location: {
        type: "Point",
        coordinates: pickupCoords
      }
    },
    DropLocation: {
      Area: dropArea,
      Location: {
        type: "Point",
        coordinates: dropCoords
      }
    }
  };

  const deliveryObj = {
    DeliveryID: newDeliveryId,
    OrderID: newOrderId,
    PID: chosenDriver.PID,
    DropTime: { $date: dropTime.toISOString() },
    PaymentAmount: fare,
    DeliveryStatus: "Completed",
    DistanceKm: distKm,
    PaymentMode: paymentMode || "UPI"
  };

  return {
    order: orderObj,
    delivery: deliveryObj,
    driver: chosenDriver,
    distanceKm: distKm,
    fare: fare,
    breakdown: breakdown,
    passengerName: finalPassengerName,
    passengerPhone: finalPassengerPhone
  };
}
