import os
import sqlite3
import datetime
from flask import Flask, jsonify, request, send_from_directory

app = Flask(__name__, static_folder='public', static_url_path='')

DB_PATH = os.path.join(os.path.dirname(__file__), 'DiyaMart_Updated.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.row_factory = sqlite3.Row
    return conn


# Health & Info Endpoint
@app.route('/api/health')
def health():
    return jsonify({
        "status": "online",
        "app": "DiyaMart Fashion & Apparel Retail Platform",
        "domain": "Fashion, Clothing & Apparel",
        "db": os.path.basename(DB_PATH),
        "timestamp": datetime.datetime.now().isoformat()
    })

# Products Catalog API (Supports dynamic store_id filtering)
@app.route('/api/products')
def get_products():
    category = request.args.get('category')
    subcategory = request.args.get('subcategory')
    search = request.args.get('search', '').strip()
    sort_by = request.args.get('sort', 'id_asc')
    store_id = request.args.get('store_id')
    
    if store_id and str(store_id).lower() != 'all':
        query = """
            SELECT p.*, 
                   COALESCE(inv.closing_qty, 0) as total_stock,
                   COALESCE(inv.reorder_level, 20) as avg_reorder_level,
                   s.store_id, s.store_name, s.city as store_city
            FROM products p
            LEFT JOIN inventory inv ON p.product_id = inv.product_id AND inv.store_id = ?
            LEFT JOIN stores s ON s.store_id = ?
            WHERE p.active_flag = 1
        """
        params = [int(store_id), int(store_id)]
    else:
        query = """
            SELECT p.*, 
                   COALESCE(SUM(inv.closing_qty), 100) as total_stock,
                   COALESCE(AVG(inv.reorder_level), 20) as avg_reorder_level,
                   'All Fashion Hubs' as store_name, 'All Cities' as store_city
            FROM products p
            LEFT JOIN inventory inv ON p.product_id = inv.product_id
            WHERE p.active_flag = 1
        """
        params = []
        
    if category and category.lower() != 'all':
        query += " AND LOWER(p.category) = LOWER(?)"
        params.append(category)
        
    if subcategory:
        query += " AND LOWER(p.subcategory) = LOWER(?)"
        params.append(subcategory)
        
    if search:
        query += " AND (LOWER(p.product_name) LIKE LOWER(?) OR LOWER(p.brand) LIKE LOWER(?) OR LOWER(p.sku) LIKE LOWER(?))"
        params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])
        
    if not store_id or str(store_id).lower() == 'all':
        query += " GROUP BY p.product_id"
    
    if sort_by == 'price_asc':
        query += " ORDER BY p.unit_price ASC"
    elif sort_by == 'price_desc':
        query += " ORDER BY p.unit_price DESC"
    elif sort_by == 'name_asc':
        query += " ORDER BY p.product_name ASC"
    else:
        query += " ORDER BY p.product_id ASC"
        
    conn = get_db_connection()
    products = conn.execute(query, params).fetchall()
    conn.close()
    
    return jsonify([dict(row) for row in products])

# Single Product Detail API
@app.route('/api/products/<int:product_id>')
def get_product(product_id):
    conn = get_db_connection()
    product = conn.execute("SELECT * FROM products WHERE product_id = ?", (product_id,)).fetchone()
    if not product:
        conn.close()
        return jsonify({"error": "Product not found"}), 404
        
    # Get inventory per store
    inventory = conn.execute("""
        SELECT inv.*, s.store_name, s.city 
        FROM inventory inv
        JOIN stores s ON inv.store_id = s.store_id
        WHERE inv.product_id = ?
    """, (product_id,)).fetchall()
    
    # Get vendor info
    vendors = conn.execute("""
        SELECT pv.*, v.vendor_name, v.city as vendor_city, v.rating
        FROM product_vendors pv
        JOIN vendors v ON pv.vendor_id = v.vendor_id
        WHERE pv.product_id = ?
    """, (product_id,)).fetchall()
    
    conn.close()
    return jsonify({
        "product": dict(product),
        "inventory": [dict(row) for row in inventory],
        "vendors": [dict(row) for row in vendors]
    })

# Categories & Subcategories API
@app.route('/api/categories')
def get_categories():
    conn = get_db_connection()
    categories_rows = conn.execute("""
        SELECT category, subcategory, COUNT(*) as count 
        FROM products 
        WHERE active_flag = 1 
        GROUP BY category, subcategory 
        ORDER BY category, subcategory
    """).fetchall()
    conn.close()
    
    cat_tree = {}
    for r in categories_rows:
        cat = r['category']
        sub = r['subcategory']
        if cat not in cat_tree:
            cat_tree[cat] = []
        cat_tree[cat].append({"name": sub, "count": r['count']})
        
    return jsonify(cat_tree)

# Orders API (List & Filter)
@app.route('/api/orders')
def get_orders():
    limit = int(request.args.get('limit', 1000))
    status = request.args.get('status')
    
    query = """
        SELECT o.*, 
               c.first_name, c.last_name, c.email as customer_email, c.phone as customer_phone, c.customer_segment, c.city as customer_city,
               s.store_name, s.city as store_city,
               p.payment_method, p.payment_status as payment_proc_status, p.transaction_ref,
               d.delivery_status, d.delivery_partner, d.promised_at, d.delivered_at, d.dispatched_at, d.delivery_fee
        FROM orders o
        JOIN customers c ON o.customer_id = c.customer_id
        LEFT JOIN stores s ON o.store_id = s.store_id
        LEFT JOIN payments p ON o.order_id = p.order_id
        LEFT JOIN deliveries d ON o.order_id = d.order_id
    """
    params = []
    if status and status.lower() != 'all':
        query += " WHERE LOWER(o.order_status) = LOWER(?)"
        params.append(status)
        
    query += " ORDER BY o.order_id DESC LIMIT ?"
    params.append(limit)
    
    conn = get_db_connection()
    orders = conn.execute(query, params).fetchall()
    conn.close()
    return jsonify([dict(row) for row in orders])

# Single Order Details API
@app.route('/api/orders/<int:order_id>')
def get_order_details(order_id):
    conn = get_db_connection()
    order = conn.execute("""
        SELECT o.*, 
               c.first_name, c.last_name, c.email as customer_email, c.phone as customer_phone, c.city as customer_city, c.customer_segment,
               s.store_name, s.city as store_city,
               p.payment_method, p.payment_status as payment_proc_status, p.transaction_ref,
               d.delivery_partner, d.promised_at, d.dispatched_at, d.delivered_at, d.delivery_status, d.delivery_fee, d.delivery_rating
        FROM orders o
        JOIN customers c ON o.customer_id = c.customer_id
        LEFT JOIN stores s ON o.store_id = s.store_id
        LEFT JOIN payments p ON o.order_id = p.order_id
        LEFT JOIN deliveries d ON o.order_id = d.order_id
        WHERE o.order_id = ?
    """, (order_id,)).fetchone()
    
    if not order:
        conn.close()
        return jsonify({"error": "Order not found"}), 404
        
    items = conn.execute("""
        SELECT oi.*, p.product_name, p.sku, p.category, p.subcategory, p.brand, p.image_url
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        WHERE oi.order_id = ?
    """, (order_id,)).fetchall()
    
    events = conn.execute("""
        SELECT * FROM customer_events WHERE order_id = ? ORDER BY event_time ASC
    """, (order_id,)).fetchall()
    
    returns_list = conn.execute("""
        SELECT r.*, oi.product_id, p.product_name, p.image_url
        FROM returns r
        JOIN order_items oi ON r.order_item_id = oi.order_item_id
        JOIN products p ON oi.product_id = p.product_id
        WHERE oi.order_id = ?
    """, (order_id,)).fetchall()
    
    conn.close()
    return jsonify({
        "order": dict(order),
        "items": [dict(i) for i in items],
        "events": [dict(e) for e in events],
        "returns": [dict(r) for r in returns_list]
    })

# Track Order API (by Order ID, Phone, or Email)
@app.route('/api/track/<query>')
def track_order(query):
    query = query.strip()
    conn = get_db_connection()
    
    order = None
    if query.isdigit():
        order = conn.execute("""
            SELECT o.*, 
                   c.first_name, c.last_name, c.email as customer_email, c.phone as customer_phone, c.city as customer_city,
                   s.store_name, s.city as store_city,
                   p.payment_method, p.payment_status as payment_proc_status, p.transaction_ref,
                   d.delivery_partner, d.promised_at, d.dispatched_at, d.delivered_at, d.delivery_status, d.delivery_fee, d.delivery_rating
            FROM orders o
            JOIN customers c ON o.customer_id = c.customer_id
            LEFT JOIN stores s ON o.store_id = s.store_id
            LEFT JOIN payments p ON o.order_id = p.order_id
            LEFT JOIN deliveries d ON o.order_id = d.order_id
            WHERE o.order_id = ?
        """, (int(query),)).fetchone()
    
    if not order:
        order = conn.execute("""
            SELECT o.*, 
                   c.first_name, c.last_name, c.email as customer_email, c.phone as customer_phone, c.city as customer_city,
                   s.store_name, s.city as store_city,
                   p.payment_method, p.payment_status as payment_proc_status, p.transaction_ref,
                   d.delivery_partner, d.promised_at, d.dispatched_at, d.delivered_at, d.delivery_status, d.delivery_fee, d.delivery_rating
            FROM orders o
            JOIN customers c ON o.customer_id = c.customer_id
            LEFT JOIN stores s ON o.store_id = s.store_id
            LEFT JOIN payments p ON o.order_id = p.order_id
            LEFT JOIN deliveries d ON o.order_id = d.order_id
            WHERE c.phone = ? OR LOWER(c.email) = LOWER(?)
            ORDER BY o.order_id DESC LIMIT 1
        """, (query, query)).fetchone()
        
    if not order:
        conn.close()
        return jsonify({"error": f"No order found matching '{query}'"}), 404
        
    order_id = order['order_id']
    items = conn.execute("""
        SELECT oi.*, p.product_name, p.sku, p.category, p.subcategory, p.brand, p.image_url
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        WHERE oi.order_id = ?
    """, (order_id,)).fetchall()
    
    conn.close()
    return jsonify({
        "order": dict(order),
        "items": [dict(i) for i in items]
    })

# Create New Order API (Full Transaction into SQLite)
@app.route('/api/orders', methods=['POST'])
def create_order():
    data = request.get_json()
    if not data or 'items' not in data or not data['items']:
        return jsonify({"error": "Cart items are required"}), 400
        
    customer_id = data.get('customer_id', 1)
    store_id = data.get('store_id', 1)
    channel = data.get('channel', 'Web')
    payment_method = data.get('payment_method', 'UPI')
    delivery_partner = data.get('delivery_partner', 'DiyaExpress')
    
    items = data['items'] # list of {product_id, quantity, unit_price}
    
    now = datetime.datetime.now()
    now_str = now.strftime('%Y-%m-%d %H:%M:%S')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        gross_amount = 0.0
        tax_amount = 0.0
        discount_amount = 0.0
        
        cust = cursor.execute("SELECT * FROM customers WHERE customer_id = ?", (customer_id,)).fetchone()
        if not cust:
            customer_id = 1
            
        processed_items = []
        for itm in items:
            pid = itm['product_id']
            qty = int(itm.get('quantity', 1))
            prod = cursor.execute("SELECT * FROM products WHERE product_id = ?", (pid,)).fetchone()
            if not prod:
                continue
            u_price = float(prod['unit_price'])
            tax_pct = float(prod['tax_pct'] or 0)
            item_gross = u_price * qty
            item_disc = round(item_gross * 0.05, 2) if qty > 1 else 0.0
            item_tax = round((item_gross - item_disc) * (tax_pct / 100.0), 2)
            item_line = round(item_gross - item_disc + item_tax, 2)
            
            gross_amount += item_gross
            tax_amount += item_tax
            discount_amount += item_disc
            
            processed_items.append({
                "product_id": pid,
                "quantity": qty,
                "unit_price": u_price,
                "discount_amount": item_disc,
                "tax_amount": item_tax,
                "line_amount": item_line
            })
            
        net_amount = round(gross_amount - discount_amount + tax_amount, 2)
        
        # Insert Order
        cursor.execute("""
            INSERT INTO orders (customer_id, store_id, order_date, channel, order_status, gross_amount, discount_amount, tax_amount, net_amount, payment_status)
            VALUES (?, ?, ?, ?, 'Delivered', ?, ?, ?, ?, 'Paid')
        """, (customer_id, store_id, now_str, channel, round(gross_amount, 2), round(discount_amount, 2), round(tax_amount, 2), net_amount))
        order_id = cursor.lastrowid
        
        # Insert Order Items
        for itm in processed_items:
            cursor.execute("""
                INSERT INTO order_items (order_id, product_id, quantity, unit_price, discount_amount, tax_amount, line_amount)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (order_id, itm['product_id'], itm['quantity'], itm['unit_price'], itm['discount_amount'], itm['tax_amount'], itm['line_amount']))
            
            # Decrement inventory if exists
            cursor.execute("""
                UPDATE inventory 
                SET sold_qty = sold_qty + ?, closing_qty = MAX(0, closing_qty - ?)
                WHERE store_id = ? AND product_id = ?
            """, (itm['quantity'], itm['quantity'], store_id, itm['product_id']))
            
        # Insert Payment
        txn_ref = f"TXN{order_id:07d}"
        cursor.execute("""
            INSERT INTO payments (order_id, payment_date, payment_method, amount, payment_status, transaction_ref)
            VALUES (?, ?, ?, ?, 'Paid', ?)
        """, (order_id, now_str, payment_method, net_amount, txn_ref))
        
        # Insert Delivery
        promised_time = (now + datetime.timedelta(days=2)).strftime('%Y-%m-%d %H:%M:%S')
        dispatched_time = (now + datetime.timedelta(hours=4)).strftime('%Y-%m-%d %H:%M:%S')
        cursor.execute("""
            INSERT INTO deliveries (order_id, delivery_partner, promised_at, dispatched_at, delivered_at, delivery_status, delivery_fee, delivery_rating)
            VALUES (?, ?, ?, ?, ?, 'Delivered', 0.0, 5)
        """, (order_id, delivery_partner, promised_time, dispatched_time, now_str))
        
        # Insert Customer Event
        cursor.execute("""
            INSERT INTO customer_events (customer_id, product_id, order_id, event_time, event_type, channel, session_id, event_value)
            VALUES (?, ?, ?, ?, 'purchase', ?, ?, ?)
        """, (customer_id, processed_items[0]['product_id'] if processed_items else None, order_id, now_str, channel, f"S{customer_id}-{order_id}", net_amount))
        
        # Update customer loyalty points (1 point per 100 rupees)
        earned_pts = int(net_amount // 100)
        cursor.execute("UPDATE customers SET loyalty_points = loyalty_points + ? WHERE customer_id = ?", (earned_pts, customer_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True,
            "order_id": order_id,
            "net_amount": net_amount,
            "transaction_ref": txn_ref,
            "message": f"Order #{order_id} placed successfully!"
        }), 201
        
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500

# Customers API
@app.route('/api/customers')
def get_customers():
    conn = get_db_connection()
    customers = conn.execute("""
        SELECT c.*, 
               COUNT(o.order_id) as total_orders,
               COALESCE(SUM(o.net_amount), 0) as total_spent
        FROM customers c
        LEFT JOIN orders o ON c.customer_id = o.customer_id
        GROUP BY c.customer_id
        ORDER BY c.customer_id ASC
    """).fetchall()
    conn.close()
    return jsonify([dict(c) for c in customers])

# Stores API
@app.route('/api/stores')
def get_stores():
    conn = get_db_connection()
    stores = conn.execute("SELECT * FROM stores ORDER BY store_id ASC").fetchall()
    conn.close()
    return jsonify([dict(s) for s in stores])

# Vendors API
@app.route('/api/vendors')
def get_vendors():
    conn = get_db_connection()
    vendors = conn.execute("SELECT * FROM vendors ORDER BY vendor_id ASC").fetchall()
    conn.close()
    return jsonify([dict(v) for v in vendors])

# Store Inventory API (GET & PUT)
@app.route('/api/inventory', methods=['GET'])
def get_inventory():
    store_id = request.args.get('store_id')
    query = """
        SELECT inv.*, s.store_name, s.city, p.product_name, p.sku, p.category, p.subcategory, p.brand, p.unit_price, p.image_url
        FROM inventory inv
        JOIN stores s ON inv.store_id = s.store_id
        JOIN products p ON inv.product_id = p.product_id
    """
    params = []
    if store_id and store_id != 'all':
        query += " WHERE inv.store_id = ?"
        params.append(int(store_id))
        
    query += " ORDER BY inv.closing_qty ASC"
    
    conn = get_db_connection()
    inventory = conn.execute(query, params).fetchall()
    conn.close()
    return jsonify([dict(i) for i in inventory])

# Update Inventory Stock API
@app.route('/api/inventory/<int:inventory_id>', methods=['PUT', 'PATCH'])
def update_inventory(inventory_id):
    data = request.get_json() or {}
    conn = get_db_connection()
    cursor = conn.cursor()
    
    inv = cursor.execute("SELECT * FROM inventory WHERE inventory_id = ?", (inventory_id,)).fetchone()
    if not inv:
        conn.close()
        return jsonify({"error": "Inventory record not found"}), 404
        
    closing_qty = data.get('closing_qty', inv['closing_qty'])
    reorder_level = data.get('reorder_level', inv['reorder_level'])
    received_qty = data.get('received_qty', inv['received_qty'])
    damaged_qty = data.get('damaged_qty', inv['damaged_qty'])
    
    cursor.execute("""
        UPDATE inventory 
        SET closing_qty = ?, reorder_level = ?, received_qty = ?, damaged_qty = ?
        WHERE inventory_id = ?
    """, (closing_qty, reorder_level, received_qty, damaged_qty, inventory_id))
    
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Inventory stock updated successfully", "inventory_id": inventory_id})

# Returns API (GET, POST & PUT)
@app.route('/api/returns', methods=['GET', 'POST'])
def handle_returns():
    conn = get_db_connection()
    if request.method == 'POST':
        data = request.get_json() or {}
        order_item_id = data.get('order_item_id')
        reason = data.get('reason', 'Size exchange / Fit issue')
        if not order_item_id:
            conn.close()
            return jsonify({"error": "order_item_id is required"}), 400
            
        now_str = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        item = conn.execute("SELECT line_amount FROM order_items WHERE order_item_id = ?", (order_item_id,)).fetchone()
        refund_amount = item['line_amount'] if item else 0.0
        
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO returns (order_item_id, request_date, return_reason, return_status, refund_amount, refund_date)
            VALUES (?, ?, ?, 'Pending Approval', ?, NULL)
        """, (order_item_id, now_str, reason, refund_amount))
        ret_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return jsonify({"success": True, "return_id": ret_id, "refund_amount": refund_amount}), 201
        
    returns = conn.execute("""
        SELECT r.*, oi.order_id, oi.unit_price, oi.quantity, p.product_name, p.sku, p.category, p.brand,
               c.first_name || ' ' || c.last_name as customer_name, c.phone as customer_phone, c.email as customer_email
        FROM returns r
        JOIN order_items oi ON r.order_item_id = oi.order_item_id
        JOIN products p ON oi.product_id = p.product_id
        JOIN orders o ON oi.order_id = o.order_id
        JOIN customers c ON o.customer_id = c.customer_id
        ORDER BY r.return_id DESC
    """).fetchall()
    conn.close()
    return jsonify([dict(r) for r in returns])

# Update Return Request Status API
@app.route('/api/returns/<int:return_id>', methods=['PUT', 'PATCH'])
def update_return_status(return_id):
    data = request.get_json() or {}
    status = data.get('return_status')
    if not status:
        return jsonify({"error": "return_status is required"}), 400
        
    now_str = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    conn = get_db_connection()
    cursor = conn.cursor()
    
    ret = cursor.execute("SELECT * FROM returns WHERE return_id = ?", (return_id,)).fetchone()
    if not ret:
        conn.close()
        return jsonify({"error": "Return record not found"}), 404
        
    refund_date = now_str if 'refund' in status.lower() or 'approved' in status.lower() else ret['refund_date']
    
    cursor.execute("""
        UPDATE returns 
        SET return_status = ?, refund_date = ?
        WHERE return_id = ?
    """, (status, refund_date, return_id))
    
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": f"Return #{return_id} status updated to '{status}'"})

# Customer Login / Registration API
@app.route('/api/customers/login', methods=['POST'])
def customer_login():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    phone = data.get('phone', '').strip()
    email = data.get('email', '').strip()
    city = data.get('city', 'Chennai').strip()
    
    if not name:
        return jsonify({"error": "Customer name is required"}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Try finding customer by phone, email, or exact name
    customer = None
    if phone:
        customer = cursor.execute("SELECT * FROM customers WHERE phone = ?", (phone,)).fetchone()
    if not customer and email:
        customer = cursor.execute("SELECT * FROM customers WHERE LOWER(email) = LOWER(?)", (email,)).fetchone()
    if not customer:
        customer = cursor.execute("SELECT * FROM customers WHERE LOWER(first_name || ' ' || last_name) = LOWER(?) OR LOWER(first_name) = LOWER(?)", (name, name)).fetchone()
        
    if customer:
        cust_dict = dict(customer)
        conn.close()
        return jsonify({"success": True, "customer": cust_dict, "is_new": False, "message": f"Welcome back, {cust_dict['first_name']}!"})
        
    # Split name into first and last
    parts = name.split(None, 1)
    first_name = parts[0].capitalize()
    last_name = parts[1].capitalize() if len(parts) > 1 else "Kumar"
    if not email:
        email = f"{first_name.lower()}.{last_name.lower()}@gmail.com"
    if not phone:
        import random
        phone = f"98{random.randint(10000000, 99999999)}"
        
    now_date = datetime.date.today().isoformat()
    cursor.execute("""
        INSERT INTO customers (first_name, last_name, gender, dob, email, phone, city, state, signup_date, customer_segment, loyalty_points, status)
        VALUES (?, ?, 'Prefer not to say', '1995-01-01', ?, ?, ?, 'Tamil Nadu', ?, 'Silver Member', 100, 'Active')
    """, (first_name, last_name, email, phone, city, now_date))
    
    new_id = cursor.lastrowid
    conn.commit()
    new_cust = cursor.execute("SELECT * FROM customers WHERE customer_id = ?", (new_id,)).fetchone()
    cust_dict = dict(new_cust)
    conn.close()
    
    return jsonify({"success": True, "customer": cust_dict, "is_new": True, "message": f"Welcome to DiyaMart, {first_name}!"}), 201

# Analytical View 1: Customer 360 API
@app.route('/api/analytics/customer360')
def get_customer_360():
    limit = int(request.args.get('limit', 20))
    conn = get_db_connection()
    c360 = conn.execute("""
        SELECT * FROM vw_customer_360 
        ORDER BY lifetime_value DESC 
        LIMIT ?
    """, (limit,)).fetchall()
    conn.close()
    return jsonify([dict(r) for r in c360])

# Analytical View 2: Delivery Performance API
@app.route('/api/analytics/delivery-performance')
def get_delivery_perf():
    conn = get_db_connection()
    perf = conn.execute("""
        SELECT * FROM vw_delivery_performance 
        WHERE hours_vs_promise IS NOT NULL 
        ORDER BY delivery_id DESC 
        LIMIT 50
    """).fetchall()
    conn.close()
    return jsonify([dict(r) for r in perf])

# Analytical View 3: Product Performance API
@app.route('/api/analytics/product-performance')
def get_product_perf():
    conn = get_db_connection()
    prod_perf = conn.execute("""
        SELECT * FROM vw_product_performance 
        ORDER BY sales_amount DESC
    """).fetchall()
    conn.close()
    return jsonify([dict(r) for r in prod_perf])

# Dashboard & Business Stats API
@app.route('/api/dashboard/stats')
def get_dashboard_stats():
    conn = get_db_connection()
    
    total_sales = conn.execute("SELECT COALESCE(SUM(net_amount), 0) FROM orders").fetchone()[0]
    total_orders = conn.execute("SELECT COUNT(*) FROM orders").fetchone()[0]
    active_customers = conn.execute("SELECT COUNT(*) FROM customers WHERE status = 'Active'").fetchone()[0]
    total_products = conn.execute("SELECT COUNT(*) FROM products WHERE active_flag = 1").fetchone()[0]
    
    orders_by_status = conn.execute("""
        SELECT order_status, COUNT(*) as count, SUM(net_amount) as total 
        FROM orders 
        GROUP BY order_status
    """).fetchall()
    
    sales_by_category = conn.execute("""
        SELECT p.category, SUM(oi.line_amount) as revenue, SUM(oi.quantity) as units_sold
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        GROUP BY p.category
        ORDER BY revenue DESC
    """).fetchall()
    
    recent_orders = conn.execute("""
        SELECT o.order_id, o.order_date, o.net_amount, o.order_status, o.channel,
               c.first_name || ' ' || c.last_name as customer_name
        FROM orders o
        JOIN customers c ON o.customer_id = c.customer_id
        ORDER BY o.order_id DESC
        LIMIT 8
    """).fetchall()
    
    conn.close()
    return jsonify({
        "total_sales": round(total_sales, 2),
        "total_orders": total_orders,
        "active_customers": active_customers,
        "total_products": total_products,
        "avg_order_value": round(total_sales / max(1, total_orders), 2),
        "orders_by_status": [dict(r) for r in orders_by_status],
        "sales_by_category": [dict(r) for r in sales_by_category],
        "recent_orders": [dict(r) for r in recent_orders]
    })

if __name__ == '__main__':
    @app.route('/')
    def index():
        return send_from_directory(app.static_folder, 'index.html')

    @app.route('/<path:path>')
    def static_files(path):
        return send_from_directory(app.static_folder, path)

    port = int(os.environ.get('PORT', 5001))
    print(f"Starting DiyaMart Fashion Server on http://127.0.0.1:{port} ...")
    app.run(host='0.0.0.0', port=port, debug=False)


