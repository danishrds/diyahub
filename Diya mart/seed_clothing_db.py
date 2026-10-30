"""
DiyaMart Clothing & Apparel SQLite Database Seeder
Builds DiyaMart_Updated.db according to the TopDataWorks specification with complete fashion/apparel dataset.
"""

import sqlite3
import random
import datetime
import os

DB_NAME = "DiyaMart_Updated.db"

conn = sqlite3.connect(DB_NAME)
cursor = conn.cursor()

# Disable foreign keys temporarily to drop tables cleanly
cursor.execute("PRAGMA foreign_keys = OFF;")

# Drop views and tables if they exist
cursor.executescript("""
DROP VIEW IF EXISTS vw_customer_360;
DROP VIEW IF EXISTS vw_delivery_performance;
DROP VIEW IF EXISTS vw_product_performance;

DROP TABLE IF EXISTS returns;
DROP TABLE IF EXISTS customer_events;
DROP TABLE IF EXISTS deliveries;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS product_vendors;
DROP TABLE IF EXISTS stores;
DROP TABLE IF EXISTS vendors;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS customers;
""")

# Re-enable foreign keys
cursor.execute("PRAGMA foreign_keys = ON;")

# 1. Create Tables
cursor.executescript("""
CREATE TABLE customers (
    customer_id INTEGER PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    gender TEXT,
    dob DATE,
    email TEXT UNIQUE,
    phone TEXT,
    city TEXT,
    state TEXT,
    signup_date DATE,
    customer_segment TEXT,
    loyalty_points INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Active'
);

CREATE TABLE products (
    product_id INTEGER PRIMARY KEY,
    sku TEXT UNIQUE NOT NULL,
    product_name TEXT NOT NULL,
    category TEXT,
    subcategory TEXT,
    brand TEXT,
    unit_price REAL NOT NULL,
    cost_price REAL NOT NULL,
    tax_pct REAL DEFAULT 0,
    active_flag INTEGER DEFAULT 1,
    image_url TEXT
);


CREATE TABLE vendors (
    vendor_id INTEGER PRIMARY KEY,
    vendor_name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    city TEXT,
    state TEXT,
    rating REAL,
    active_flag INTEGER DEFAULT 1
);

CREATE TABLE product_vendors (
    product_id INTEGER NOT NULL,
    vendor_id INTEGER NOT NULL,
    vendor_sku TEXT,
    purchase_price REAL,
    lead_time_days INTEGER,
    preferred_flag INTEGER DEFAULT 0,
    PRIMARY KEY (product_id, vendor_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id)
);

CREATE TABLE stores (
    store_id INTEGER PRIMARY KEY,
    store_name TEXT NOT NULL,
    city TEXT,
    state TEXT,
    store_type TEXT,
    opening_date DATE,
    manager_name TEXT,
    active_flag INTEGER DEFAULT 1
);

CREATE TABLE inventory (
    inventory_id INTEGER PRIMARY KEY,
    store_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    stock_date DATE NOT NULL,
    opening_qty INTEGER DEFAULT 0,
    received_qty INTEGER DEFAULT 0,
    sold_qty INTEGER DEFAULT 0,
    damaged_qty INTEGER DEFAULT 0,
    closing_qty INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 0,
    FOREIGN KEY (store_id) REFERENCES stores(store_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE orders (
    order_id INTEGER PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    store_id INTEGER,
    order_date DATETIME NOT NULL,
    channel TEXT NOT NULL,
    order_status TEXT NOT NULL,
    gross_amount REAL DEFAULT 0,
    discount_amount REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    net_amount REAL DEFAULT 0,
    payment_status TEXT,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (store_id) REFERENCES stores(store_id)
);

CREATE TABLE order_items (
    order_item_id INTEGER PRIMARY KEY,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    discount_amount REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    line_amount REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE payments (
    payment_id INTEGER PRIMARY KEY,
    order_id INTEGER NOT NULL,
    payment_date DATETIME NOT NULL,
    payment_method TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_status TEXT NOT NULL,
    transaction_ref TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

CREATE TABLE deliveries (
    delivery_id INTEGER PRIMARY KEY,
    order_id INTEGER NOT NULL,
    delivery_partner TEXT,
    promised_at DATETIME,
    dispatched_at DATETIME,
    delivered_at DATETIME,
    delivery_status TEXT,
    delivery_fee REAL DEFAULT 0,
    delivery_rating INTEGER,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

CREATE TABLE returns (
    return_id INTEGER PRIMARY KEY,
    order_item_id INTEGER NOT NULL,
    request_date DATETIME NOT NULL,
    return_reason TEXT,
    return_status TEXT,
    refund_amount REAL DEFAULT 0,
    refund_date DATETIME,
    FOREIGN KEY (order_item_id) REFERENCES order_items(order_item_id)
);

CREATE TABLE customer_events (
    event_id INTEGER PRIMARY KEY,
    customer_id INTEGER,
    product_id INTEGER,
    order_id INTEGER,
    event_time DATETIME NOT NULL,
    event_type TEXT NOT NULL,
    channel TEXT,
    session_id TEXT,
    event_value REAL,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);
""")

# 2. Insert Stores (3 physical apparel hubs)
stores_data = [
    (1, "DiyaMart Fashion Hub Chennai", "Chennai", "Tamil Nadu", "Flagship Boutique", "2024-01-15", "Karthik Raja", 1),
    (2, "DiyaMart Trends Megastore", "Bengaluru", "Karnataka", "Apparel Mall", "2024-03-10", "Pooja Hegde", 1),
    (3, "DiyaMart Style Studio Mumbai", "Mumbai", "Maharashtra", "Luxury Studio", "2024-05-20", "Amitabh Deshmukh", 1)
]
cursor.executemany("INSERT INTO stores VALUES (?, ?, ?, ?, ?, ?, ?, ?)", stores_data)

# 3. Insert Vendors (10 textile & apparel suppliers)
vendors_data = [
    (1, "Tirupur Knitwear & Cotton Mills", "Ramesh Kumar", "9845012340", "sales@tirupurtextiles.in", "Tirupur", "Tamil Nadu", 4.9, 1),
    (2, "Surat Silk & Ethnic Weavers Ltd", "Suresh Patel", "9845012341", "orders@suratsilk.in", "Surat", "Gujarat", 4.8, 1),
    (3, "Arvind Denim & Fabric Mills", "Vikram Shah", "9845012342", "supply@arvindtextiles.in", "Ahmedabad", "Gujarat", 4.9, 1),
    (4, "Raymond Apparel Logistics Hub", "Manoj Singhania", "9845012343", "contact@raymondlogistics.in", "Mumbai", "Maharashtra", 4.9, 1),
    (5, "Jaipur Handlooms & Block Prints", "Preeti Sharma", "9845012344", "info@jaipurhandlooms.in", "Jaipur", "Rajasthan", 4.7, 1),
    (6, "Bengaluru Garment Crafts Ltd", "Ananya Iyer", "9845012345", "reach@bengalurugarments.in", "Bengaluru", "Karnataka", 4.6, 1),
    (7, "Kanchipuram Silk Weavers Society", "Bala Subramanian", "9845012346", "sales@kanchisilks.in", "Kanchipuram", "Tamil Nadu", 5.0, 1),
    (8, "Ludhiana Woollen Mills Ltd", "Deepak Verma", "9845012347", "orders@ludhianawoollen.in", "Ludhiana", "Punjab", 4.7, 1),
    (9, "Kolkata Fine Footwear & Leather", "Rajesh Mukherjee", "9845012348", "support@kolkatafootwear.in", "Kolkata", "West Bengal", 4.6, 1),
    (10, "Delhi Fashion Trims & Accessories", "Neha Gupta", "9845012349", "care@delhifashions.in", "New Delhi", "Delhi", 4.5, 1)
]
cursor.executemany("INSERT INTO vendors VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", vendors_data)

# 4. Insert 48 Fashion & Clothing Products
products_data = [
    # Men's Fashion (12)
    (1, "SKU0001", "Raymond Pure Cotton Slim Fit White Shirt", "Men's Fashion", "Formal Shirts", "Raymond", 1499.0, 850.0, 5.0, 1, "/images/products/product_1.jpg"),
    (2, "SKU0002", "Peter England Classic Royal Blue Oxford Shirt", "Men's Fashion", "Formal Shirts", "Peter England", 1199.0, 680.0, 5.0, 1, "/images/products/product_2.jpg"),
    (3, "SKU0003", "Allen Solly Windowpane Check Casual Shirt", "Men's Fashion", "Formal Shirts", "Allen Solly", 1349.0, 760.0, 5.0, 1, "/images/products/product_3.jpg"),
    (4, "SKU0004", "US Polo Assn Classic Pique Cotton Polo Tee", "Men's Fashion", "T-Shirts & Polos", "US Polo", 999.0, 520.0, 5.0, 1, "/images/products/product_4.jpg"),
    (5, "SKU0005", "Levi's Vintage Batwing Graphic Crew Neck Tee", "Men's Fashion", "T-Shirts & Polos", "Levi's", 899.0, 480.0, 5.0, 1, "/images/products/product_5.jpg"),
    (6, "SKU0006", "Puma Performance Dry-Fit Training T-Shirt", "Men's Fashion", "T-Shirts & Polos", "Puma", 799.0, 420.0, 5.0, 1, "/images/products/product_6.jpg"),
    (7, "SKU0007", "Levi's 511 Slim Fit Stretch Denim Jeans", "Men's Fashion", "Jeans & Trousers", "Levi's", 2499.0, 1400.0, 12.0, 1, "/images/products/product_7.jpg"),
    (8, "SKU0008", "Pepe Jeans Indigo Regular Straight Jeans", "Men's Fashion", "Jeans & Trousers", "Pepe Jeans", 2199.0, 1250.0, 12.0, 1, "/images/products/product_8.jpg"),
    (9, "SKU0009", "Park Avenue Formal Charcoal Flat-Front Trousers", "Men's Fashion", "Jeans & Trousers", "Park Avenue", 1799.0, 980.0, 5.0, 1, "/images/products/product_9.jpg"),
    (10, "SKU0010", "Manyavar Royal Embroidered Art Silk Kurta Set", "Men's Fashion", "Ethnic & Traditional", "Manyavar", 3499.0, 1950.0, 12.0, 1, "/images/products/product_10.jpg"),
    (11, "SKU0011", "FabIndia Khadi Cotton Mandarin Collar Kurta", "Men's Fashion", "Ethnic & Traditional", "FabIndia", 1690.0, 920.0, 5.0, 1, "/images/products/product_11.jpg"),
    (12, "SKU0012", "Raymond Luxury Midnight Navy Blazer", "Men's Fashion", "Ethnic & Traditional", "Raymond", 4999.0, 2800.0, 12.0, 1, "/images/products/product_12.jpg"),

    # Women's Fashion (12)
    (13, "SKU0013", "Kanchipuram Pure Zari Silk Wedding Saree", "Women's Fashion", "Sarees", "Kanchipuram Silk", 4899.0, 2700.0, 12.0, 1, "/images/products/product_13.jpg"),
    (14, "SKU0014", "Banarasi Floral Motif Soft Georgette Saree", "Women's Fashion", "Sarees", "FabIndia", 2999.0, 1650.0, 12.0, 1, "/images/products/product_14.jpg"),
    (15, "SKU0015", "Chanderi Handloom Festive Cotton Saree", "Women's Fashion", "Sarees", "Jaipur Handlooms", 1899.0, 1020.0, 5.0, 1, "/images/products/product_15.jpg"),
    (16, "SKU0016", "Biba Anarkali Embroidered Kurta with Dupatta", "Women's Fashion", "Kurtis & Suits", "Biba", 2799.0, 1500.0, 12.0, 1, "/images/products/product_16.jpg"),
    (17, "SKU0017", "W for Woman Emerald Straight Cut Festive Kurti", "Women's Fashion", "Kurtis & Suits", "W for Woman", 1499.0, 820.0, 5.0, 1, "/images/products/product_17.jpg"),
    (18, "SKU0018", "Aurelia Gold Printed Rayon Festive Kurti", "Women's Fashion", "Kurtis & Suits", "Aurelia", 1199.0, 640.0, 5.0, 1, "/images/products/product_18.jpg"),
    (19, "SKU0019", "Zara Floral Print Tiered Midi Summer Dress", "Women's Fashion", "Dresses & Tops", "Zara", 2590.0, 1420.0, 12.0, 1, "/images/products/product_19.jpg"),
    (20, "SKU0020", "Forever 21 Elegant V-Neck Wrap Cocktail Dress", "Women's Fashion", "Dresses & Tops", "Forever 21", 1899.0, 1050.0, 12.0, 1, "/images/products/product_20.jpg"),
    (21, "SKU0021", "Only Classic Washed Cropped Denim Jacket", "Women's Fashion", "Dresses & Tops", "Only", 1999.0, 1100.0, 12.0, 1, "/images/products/product_21.jpg"),
    (22, "SKU0022", "Global Desi Printed Flared Ethnic Palazzos", "Women's Fashion", "Jeans & Bottoms", "Global Desi", 1299.0, 710.0, 5.0, 1, "/images/products/product_22.jpg"),
    (23, "SKU0023", "Levi's Mile High Super Skinny Stretch Jeans", "Women's Fashion", "Jeans & Bottoms", "Levi's", 2699.0, 1490.0, 12.0, 1, "/images/products/product_23.jpg"),
    (24, "SKU0024", "FabIndia Pure Linen Ankle-Length Trousers", "Women's Fashion", "Jeans & Bottoms", "FabIndia", 1590.0, 880.0, 5.0, 1, "/images/products/product_24.jpg"),

    # Kids & Teens (8)
    (25, "SKU0025", "US Polo Kids Striped Pique Cotton Polo", "Kids & Teens", "Boys Fashion", "US Polo", 799.0, 420.0, 5.0, 1, "/images/products/product_25.jpg"),
    (26, "SKU0026", "Allen Solly Junior Chino Shorts with Belt", "Kids & Teens", "Boys Fashion", "Allen Solly", 899.0, 480.0, 5.0, 1, "/images/products/product_26.jpg"),
    (27, "SKU0027", "Manyavar Kids Traditional Silk Dhoti Kurta Set", "Kids & Teens", "Boys Fashion", "Manyavar", 1899.0, 1020.0, 12.0, 1, "/images/products/product_27.jpg"),
    (28, "SKU0028", "Mothercare Floral Ruffled Party Frock", "Kids & Teens", "Girls Fashion", "Mothercare", 1299.0, 690.0, 5.0, 1, "/images/products/product_28.jpg"),
    (29, "SKU0029", "Biba Girls Embroidered Net Lehenga Choli", "Kids & Teens", "Girls Fashion", "Biba", 2299.0, 1240.0, 12.0, 1, "/images/products/product_29.jpg"),
    (30, "SKU0030", "Gini & Jony Washed Denim Overalls Dungaree", "Kids & Teens", "Girls Fashion", "Gini & Jony", 1499.0, 810.0, 12.0, 1, "/images/products/product_30.jpg"),
    (31, "SKU0031", "Mini Klub Pure Organic Cotton Romper 3-Pack", "Kids & Teens", "Infant Wear", "Mini Klub", 999.0, 510.0, 5.0, 1, "/images/products/product_31.jpg"),
    (32, "SKU0032", "FirstCry Soft Velvet Infant Warm Bodysuit", "Kids & Teens", "Infant Wear", "FirstCry", 749.0, 390.0, 5.0, 1, "/images/products/product_32.jpg"),

    # Footwear (8)
    (33, "SKU0033", "Clarks Handcrafted Leather Formal Oxford Shoes", "Footwear", "Men's Shoes", "Clarks", 3999.0, 2200.0, 12.0, 1, "/images/products/product_33.jpg"),
    (34, "SKU0034", "Nike Air Max Comfort Lightweight Running Shoes", "Footwear", "Men's Shoes", "Nike", 4495.0, 2500.0, 12.0, 1, "/images/products/product_34.jpg"),
    (35, "SKU0035", "Puma Smash V2 Classic Leather Casual Sneakers", "Footwear", "Men's Shoes", "Puma", 2499.0, 1350.0, 12.0, 1, "/images/products/product_35.jpg"),
    (36, "SKU0036", "Woodland Rugged Oiled Leather Trekking Boots", "Footwear", "Men's Shoes", "Woodland", 3795.0, 2100.0, 12.0, 1, "/images/products/product_36.jpg"),
    (37, "SKU0037", "Bata Elegant Suede Block Heel Sandal", "Footwear", "Women's Shoes", "Bata", 1299.0, 700.0, 12.0, 1, "/images/products/product_37.jpg"),
    (38, "SKU0038", "Catwalk Handcrafted Embellished Ethnic Mojari", "Footwear", "Women's Shoes", "Catwalk", 1699.0, 920.0, 12.0, 1, "/images/products/product_38.jpg"),
    (39, "SKU0039", "Skechers GoWalk Flex Slip-On Walking Shoes", "Footwear", "Women's Shoes", "Skechers", 2999.0, 1650.0, 12.0, 1, "/images/products/product_39.jpg"),
    (40, "SKU0040", "Metro Glossy Classic Stiletto Pumps", "Footwear", "Women's Shoes", "Metro", 2190.0, 1200.0, 12.0, 1, "/images/products/product_40.jpg"),

    # Outerwear & Accessories (8)
    (41, "SKU0041", "Monte Carlo Pure Merino Wool V-Neck Sweater", "Outerwear & Accessories", "Winterwear", "Monte Carlo", 2299.0, 1250.0, 12.0, 1, "/images/products/product_41.jpg"),
    (42, "SKU0042", "Wildcraft All-Weather Insulated Puffer Jacket", "Outerwear & Accessories", "Winterwear", "Wildcraft", 3299.0, 1800.0, 12.0, 1, "/images/products/product_42.jpg"),
    (43, "SKU0043", "H&M Relaxed Fit Heavyweight Fleece Hoodie", "Outerwear & Accessories", "Winterwear", "H&M", 1799.0, 980.0, 12.0, 1, "/images/products/product_43.jpg"),
    (44, "SKU0044", "Titan Reversible Pure Leather Formal Belt", "Outerwear & Accessories", "Accessories", "Titan", 899.0, 460.0, 12.0, 1, "/images/products/product_44.jpg"),
    (45, "SKU0045", "Tommy Hilfiger Bi-Fold RFID Leather Wallet", "Outerwear & Accessories", "Accessories", "Tommy Hilfiger", 1599.0, 850.0, 12.0, 1, "/images/products/product_45.jpg"),
    (46, "SKU0046", "FabIndia Luxury Cashmere Pashmina Shawl", "Outerwear & Accessories", "Accessories", "FabIndia", 2890.0, 1550.0, 12.0, 1, "/images/products/product_46.jpg"),
    (47, "SKU0047", "Fastrack Polarized UV-Protected Sunglasses", "Outerwear & Accessories", "Accessories", "Fastrack", 999.0, 500.0, 12.0, 1, "/images/products/product_47.jpg"),
    (48, "SKU0048", "Caprese Structured Faux Leather Tote Handbag", "Outerwear & Accessories", "Accessories", "Caprese", 2499.0, 1350.0, 12.0, 1, "/images/products/product_48.jpg"),
]
cursor.executemany("INSERT INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", products_data)

# 5. Insert Product-Vendors (74 bridge rows connecting products to 10 textile mills)
random.seed(42)
product_vendors_data = []
for pid in range(1, 49):
    if pid in [1, 2, 3, 4, 5, 6, 25, 26]:
        v_primary = 1
    elif pid in [13, 14, 15]:
        v_primary = 7 if pid == 13 else 2
    elif pid in [7, 8, 21, 23, 30]:
        v_primary = 3
    elif pid in [10, 12]:
        v_primary = 4
    elif pid in [11, 16, 17, 18, 22, 27, 29]:
        v_primary = 5
    elif pid in [9, 19, 20, 24, 28, 31, 32]:
        v_primary = 6
    elif pid in [41, 42, 43]:
        v_primary = 8
    elif pid in [33, 34, 35, 36, 37, 38, 39, 40]:
        v_primary = 9
    else:
        v_primary = 10
    
    prod_row = products_data[pid-1]
    cost = prod_row[7]
    sku = prod_row[1]
    
    product_vendors_data.append((pid, v_primary, f"V{v_primary}-{sku}", round(cost * 0.95, 2), random.randint(3, 7), 1))

extra_pids = random.sample(range(1, 49), 26)
for pid in extra_pids:
    existing_v = [row[1] for row in product_vendors_data if row[0] == pid]
    avail_v = [v for v in range(1, 11) if v not in existing_v]
    v_sec = random.choice(avail_v)
    prod_row = products_data[pid-1]
    cost = prod_row[7]
    sku = prod_row[1]
    product_vendors_data.append((pid, v_sec, f"V{v_sec}-{sku}", round(cost * 1.02, 2), random.randint(5, 12), 0))

cursor.executemany("INSERT INTO product_vendors VALUES (?, ?, ?, ?, ?, ?)", product_vendors_data)

# 6. Insert Store Inventory (144 rows: 48 products x 3 stores)
inventory_data = []
inv_id = 1
stock_date = "2026-09-01"
for sid in [1, 2, 3]:
    for pid in range(1, 49):
        opening = random.randint(40, 120)
        received = random.randint(20, 60)
        sold = random.randint(15, opening + received - 10)
        damaged = random.randint(0, 3)
        closing = opening + received - sold - damaged
        reorder = random.randint(15, 30)
        inventory_data.append((inv_id, sid, pid, stock_date, opening, received, sold, damaged, closing, reorder))
        inv_id += 1

cursor.executemany("INSERT INTO inventory VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", inventory_data)

# 7. Insert Customers (100 customers)
first_names = ["Aarav", "Aditi", "Rohan", "Ananya", "Vikram", "Pooja", "Arjun", "Kavya", "Rahul", "Priya",
               "Siddharth", "Deepika", "Karthik", "Sneha", "Manish", "Meera", "Abhishek", "Shweta", "Gautam", "Divya",
               "Suresh", "Lakshmi", "Rajesh", "Nandini", "Harish", "Aishwarya", "Vishal", "Sunita", "Tarun", "Tanvi",
               "Varun", "Ritu", "Naveen", "Swati", "Ashwin", "Anita", "Pranav", "Radhika", "Ajay", "Sandhya",
               "Manoj", "Kiran", "Vijay", "Aparna", "Alok", "Pallavi", "Nitin", "Bhavna", "Sachin", "Archana"]
last_names = ["Sharma", "Verma", "Iyer", "Patel", "Reddy", "Menon", "Gupta", "Deshmukh", "Nair", "Rao",
              "Kumar", "Joshi", "Singhania", "Mukherjee", "Agarwal", "Bhatt", "Subramanian", "Kulkarni", "Pillai", "Chopra"]
cities_states = [
    ("Chennai", "Tamil Nadu"), ("Bengaluru", "Karnataka"), ("Mumbai", "Maharashtra"),
    ("Hyderabad", "Telangana"), ("Pune", "Maharashtra"), ("Coimbatore", "Tamil Nadu"),
    ("Kochi", "Kerala"), ("Ahmedabad", "Gujarat"), ("Delhi", "Delhi"), ("Kolkata", "West Bengal")
]
segments = ["VIP Elite", "Gold Trendsetter", "Silver Chic", "Regular Stylist"]

customers_data = []
for cid in range(1, 101):
    fname = first_names[(cid - 1) % len(first_names)]
    lname = last_names[(cid - 1) % len(last_names)]
    gender = "F" if cid % 2 == 0 else "M"
    dob_year = 1975 + (cid % 25)
    dob = f"{dob_year}-{((cid * 3) % 12) + 1:02d}-{((cid * 7) % 28) + 1:02d}"
    email = f"{fname.lower()}.{lname.lower()}{cid}@fashionmail.in"
    phone = f"98{cid:02d}{random.randint(100000, 999999)}"
    city, state = cities_states[cid % len(cities_states)]
    signup_day = ((cid * 5) % 28) + 1
    signup_month = ((cid * 2) % 12) + 1
    signup_date = f"2024-{signup_month:02d}-{signup_day:02d}"
    segment = segments[cid % len(segments)]
    points = random.randint(100, 1800)
    customers_data.append((cid, fname, lname, gender, dob, email, phone, city, state, signup_date, segment, points, "Active"))

cursor.executemany("INSERT INTO customers VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", customers_data)

# 8. Generate 450 Orders and Order Items (~1378 items)
channels = ["Web", "Mobile", "Store"]
order_statuses = ["Delivered", "Delivered", "Delivered", "Delivered", "Shipped", "Processing", "Cancelled"]
pay_methods = ["UPI", "Card", "Wallet", "Cash"]
delivery_partners = ["DiyaExpress", "QuickShip Logistics", "StorePickup"]

orders_data = []
order_items_data = []
payments_data = []
deliveries_data = []
customer_events_data = []
returns_data = []

item_id_counter = 1
delivery_id_counter = 1
event_id_counter = 1
return_id_counter = 1

base_date = datetime.datetime(2025, 1, 1, 9, 0, 0)

for oid in range(1, 451):
    cid = ((oid * 7) % 100) + 1
    sid = ((oid % 3) + 1)
    
    day_offset = (oid * 1.3)
    order_dt = base_date + datetime.timedelta(days=day_offset, hours=(oid % 14), minutes=(oid % 60))
    order_date_str = order_dt.strftime('%Y-%m-%d %H:%M:%S')
    
    channel = channels[oid % len(channels)]
    status = order_statuses[oid % len(order_statuses)] if oid < 445 else "Processing"
    
    num_items = 1 + ((oid * 3) % 5)
    chosen_pids = random.sample(range(1, 49), num_items)
    
    gross_sum = 0.0
    tax_sum = 0.0
    disc_sum = 0.0
    
    for pid in chosen_pids:
        prod = products_data[pid - 1]
        u_price = prod[6]
        tax_pct = prod[8]
        qty = 1 if num_items > 2 else random.choice([1, 2, 3])
        
        line_gross = u_price * qty
        line_disc = round(line_gross * 0.05, 2) if qty > 1 else 0.0
        line_tax = round((line_gross - line_disc) * (tax_pct / 100.0), 2)
        line_amount = round(line_gross - line_disc + line_tax, 2)
        
        gross_sum += line_gross
        disc_sum += line_disc
        tax_sum += line_tax
        
        order_items_data.append((item_id_counter, oid, pid, qty, u_price, line_disc, line_tax, line_amount))
        
        if event_id_counter <= 1350:
            view_dt = order_dt - datetime.timedelta(minutes=random.randint(5, 30))
            customer_events_data.append((event_id_counter, cid, pid, oid, view_dt.strftime('%Y-%m-%d %H:%M:%S'), 'product_view', channel, f"SESS-{cid}-{oid}", u_price))
            event_id_counter += 1
            
        item_id_counter += 1

    net_sum = round(gross_sum - disc_sum + tax_sum, 2)
    pay_status = "Paid" if status != "Cancelled" else "Refunded"
    
    orders_data.append((oid, cid, sid, order_date_str, channel, status, round(gross_sum, 2), round(disc_sum, 2), round(tax_sum, 2), net_sum, pay_status))
    
    txn_ref = f"TXN{oid:07d}"
    pay_dt = order_dt.strftime('%Y-%m-%d %H:%M:%S')
    pay_method = pay_methods[oid % len(pay_methods)]
    payments_data.append((oid, oid, pay_dt, pay_method, net_sum, pay_status, txn_ref))
    
    if channel in ["Web", "Mobile"] and delivery_id_counter <= 293:
        partner = delivery_partners[delivery_id_counter % 2]
        prom_dt = order_dt + datetime.timedelta(days=2)
        disp_dt = order_dt + datetime.timedelta(hours=6)
        if status == "Delivered":
            del_dt = order_dt + datetime.timedelta(days=random.choice([1, 2, 3]), hours=random.randint(1, 10))
            del_status = "Delivered"
            del_rating = random.choice([4, 5, 5, 4, 3, 5])
        elif status == "Shipped":
            del_dt = None
            del_status = "In Transit"
            del_rating = None
        else:
            del_dt = None
            disp_dt = None
            del_status = "Order Placed"
            del_rating = None
            
        prom_str = prom_dt.strftime('%Y-%m-%d %H:%M:%S')
        disp_str = disp_dt.strftime('%Y-%m-%d %H:%M:%S') if disp_dt else None
        del_str = del_dt.strftime('%Y-%m-%d %H:%M:%S') if del_dt else None
        fee = 0.0 if net_sum > 999 else 49.0
        
        deliveries_data.append((delivery_id_counter, oid, partner, prom_str, disp_str, del_str, del_status, fee, del_rating))
        delivery_id_counter += 1

    if event_id_counter <= 1350:
        customer_events_data.append((event_id_counter, cid, chosen_pids[0], oid, order_date_str, 'purchase', channel, f"SESS-{cid}-{oid}", net_sum))
        event_id_counter += 1

while event_id_counter <= 1350:
    cid = random.randint(1, 100)
    pid = random.randint(1, 48)
    e_type = random.choice(['add_to_cart', 'search', 'category_browse', 'size_guide_view'])
    e_dt = (base_date + datetime.timedelta(days=random.randint(1, 600), hours=random.randint(0, 23))).strftime('%Y-%m-%d %H:%M:%S')
    chan = random.choice(channels)
    customer_events_data.append((event_id_counter, cid, pid, None, e_dt, e_type, chan, f"SESS-{cid}-{event_id_counter}", None))
    event_id_counter += 1

sample_return_reasons = ["Size too small (Exchange requested)", "Size too large (Fit issue)", "Fabric / color mismatch", "Defective stitching", "Changed mind"]
return_statuses = ["Approved & Refunded", "Completed", "Processing", "Approved"]
for r_id in range(1, 16):
    target_item = order_items_data[r_id * 15]
    oi_id = target_item[0]
    refund_amt = target_item[7]
    req_dt = (base_date + datetime.timedelta(days=r_id * 35)).strftime('%Y-%m-%d %H:%M:%S')
    ref_dt = (base_date + datetime.timedelta(days=r_id * 35 + 3)).strftime('%Y-%m-%d %H:%M:%S')
    reason = sample_return_reasons[r_id % len(sample_return_reasons)]
    status = return_statuses[r_id % len(return_statuses)]
    returns_data.append((r_id, oi_id, req_dt, reason, status, refund_amt, ref_dt))

cursor.executemany("INSERT INTO orders VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", orders_data)
cursor.executemany("INSERT INTO order_items VALUES (?, ?, ?, ?, ?, ?, ?, ?)", order_items_data)
cursor.executemany("INSERT INTO payments VALUES (?, ?, ?, ?, ?, ?, ?)", payments_data)
cursor.executemany("INSERT INTO deliveries VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", deliveries_data)
cursor.executemany("INSERT INTO customer_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", customer_events_data)
cursor.executemany("INSERT INTO returns VALUES (?, ?, ?, ?, ?, ?, ?)", returns_data)

# 9. Create the 3 Analytical Views specified in the PDF design
cursor.executescript("""
CREATE VIEW vw_customer_360 AS
SELECT
    c.customer_id,
    c.first_name || ' ' || c.last_name AS customer_name,
    c.city,
    c.state,
    c.customer_segment,
    COUNT(DISTINCT o.order_id) AS total_orders,
    ROUND(COALESCE(SUM(o.net_amount),0),2) AS lifetime_value,
    MAX(o.order_date) AS last_order_date,
    ROUND(AVG(o.net_amount),2) AS avg_order_value
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id
GROUP BY c.customer_id;

CREATE VIEW vw_delivery_performance AS
SELECT
    d.delivery_id,
    d.order_id,
    d.delivery_partner,
    d.promised_at,
    d.dispatched_at,
    d.delivered_at,
    d.delivery_status,
    CASE
        WHEN d.delivered_at IS NOT NULL AND d.promised_at IS NOT NULL
        THEN ROUND((julianday(d.delivered_at)-julianday(d.promised_at))*24,2)
        ELSE NULL
    END AS hours_vs_promise,
    d.delivery_rating
FROM deliveries d;

CREATE VIEW vw_product_performance AS
SELECT
    p.product_id,
    p.product_name,
    p.category,
    SUM(COALESCE(oi.quantity,0)) AS units_sold,
    ROUND(SUM(COALESCE(oi.line_amount,0)),2) AS sales_amount,
    ROUND(SUM(COALESCE(oi.quantity,0) * (oi.unit_price - p.cost_price)),2) AS gross_margin
FROM products p
LEFT JOIN order_items oi ON oi.product_id = p.product_id
GROUP BY p.product_id;
""")

conn.commit()
conn.close()
print("Successfully created and seeded DiyaMart Fashion SQLite Database!")
