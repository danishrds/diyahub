# 👗 DiyaMart — Fashion & Apparel Retail Web Platform

An omnichannel Fashion, Clothing, Footwear & Accessories e-commerce and retail platform connected directly to the TopDataWorks SQLite database (`DiyaMart_Updated.db`).

---

## 🌟 Key Features

1. **✨ Curated Fashion Collections & Catalog**:
   - 48 curated styles across **Men's Fashion**, **Women's Fashion**, **Kids & Teens**, **Footwear**, and **Outerwear & Accessories**.
   - Real-time search, category filters, subcategory filtering, and price/alphabetical sorting.
   - Sizing chips (S, M, L, XL, XXL, UK shoe sizes) and fabric/brand specifications.
   - Live stock indicator pills (In Stock / Low Stock) synchronized with SQLite database.
   - Product Quick View modal with multi-store boutique availability and textile mill supplier information.

2. **🛍️ Shopping Bag & Live SQLite Order Placement**:
   - Slide-out shopping bag drawer with quantity adjustments, multi-buy discounts, and GST calculation.
   - Checkout modal allowing store selection, channel (Web / Mobile / Boutique POS), payment method (UPI / Card / Wallet / Cash), and customer context.
   - Directly records new rows in `orders`, `order_items`, `payments`, `deliveries`, and `customer_events` inside SQLite.

3. **📦 Live Order Status & Tracking (Timeline)**:
   - Search by Order ID, Phone number, or Customer Email.
   - Interactive multi-step timeline: **Order Placed ➔ Payment Confirmed ➔ Dispatched ➔ Delivered**.
   - Complete itemized breakdown, courier details (DiyaExpress / QuickShip), delivery address, and transaction references.

4. **🏬 Fashion Hubs & Stock Management**:
   - Branch details for Chennai Flagship Boutique, Bengaluru Trends Megastore, and Mumbai Style Studio.
   - Real-time stock snapshot table with search, reorder level alerts, and stock health status.

5. **👥 Fashion Club & Customer 360**:
   - 100 customer profiles with VIP Elite, Gold Trendsetter, and Silver Chic tiers with live loyalty points balances.
   - Powered by the analytical view `vw_customer_360`.
   - "Shop as Customer" quick-switch capability.

6. **🔄 Garment Returns & Exchanges**:
   - Size exchange & fabric complaint submission workflow.
   - Linked directly to `order_items` and `returns` table in SQLite.

7. **📊 Executive Analytics & Intelligence Dashboard**:
   - Live KPI cards: Total Revenue, Orders Placed, Average Order Value, Active Members.
   - Category revenue distribution bars, high gross margin styles from `vw_product_performance`, and recent transaction feeds.

---

## How to Run

### Start the Unified Web Application (Flask Backend + Storefront & Store Admin)
```bash
python server.py
```
Open your web browser and visit: **`http://127.0.0.1:5000`**

- **Customer Login**: Enter your name to access profile & unlock Store Admin.
- **Store Admin Portal**: Click Store Admin, solve the math security challenge, and access Store Inventory, Billing & Invoices (with PDF printing), and Return & Exchange.

---

## 🗄️ Database Architecture (`DiyaMart_Updated.db`)

### 12 Core Tables:
- `customers` (100 members with loyalty points & demographics)
- `products` (48 fashion garments & accessories)
- `vendors` (10 textile mills & apparel manufacturers)
- `product_vendors` (74 bridge relationships with sourcing prices & lead times)
- `stores` (3 fashion retail boutique hubs)
- `inventory` (144 store stock snapshots & reorder levels)
- `orders` (450 transaction headers)
- `order_items` (1,350 reconciled garment line items)
- `payments` (450 payment records with transaction references)
- `deliveries` (293 fulfillment and courier logs)
- `returns` (15 garment size exchange and return records)
- `customer_events` (1,350 clickstream & purchase event logs)

### 3 Analytical Views:
- **`vw_customer_360`**: Customer lifetime value, total orders, last order date, and AOV.
- **`vw_delivery_performance`**: Delivery partner ratings, promised vs actual delivery hours.
- **`vw_product_performance`**: Units sold, total sales revenue, and gross margin per fashion style.
