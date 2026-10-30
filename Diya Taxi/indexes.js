// Run after importing:  mongosh "mongodb://localhost:27017" indexes.js
db = db.getSiblingDB("divataxi");

db.customers.createIndex({ CID: 1 }, { unique: true });
db.customers.createIndex({ Phone: 1 }, { unique: true });
db.customers.createIndex({ City: 1 });

db.providers.createIndex({ PID: 1 }, { unique: true });
db.providers.createIndex({ Phone: 1 }, { unique: true });
db.providers.createIndex({ VehicleNumber: 1 }, { unique: true });
db.providers.createIndex({ City: 1, VehicleType: 1 });

db.orders.createIndex({ OrderID: 1 }, { unique: true });
db.orders.createIndex({ CID: 1 });
db.orders.createIndex({ BookingTime: 1 });
db.orders.createIndex({ City: 1, VehicleType: 1 });
db.orders.createIndex({ "PickupLocation.Location": "2dsphere" });
db.orders.createIndex({ "DropLocation.Location": "2dsphere" });

db.deliveries.createIndex({ DeliveryID: 1 }, { unique: true });
db.deliveries.createIndex({ OrderID: 1 }, { unique: true });
db.deliveries.createIndex({ PID: 1 });
db.deliveries.createIndex({ DeliveryStatus: 1 });

print("DivaTaxi indexes created.");
