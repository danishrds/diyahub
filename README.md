# ⚡ DiyaHub — Multi-Service Unified Ecosystem

DiyaHub is a unified ecosystem where each service lives in its own dedicated workspace folder and is served through a central gateway on port **5000**.

---

## 📁 Workspace Architecture

```
Diyahub/
├── Dashboard/                  # Central Gateway & Portal (Port 5000)
│   ├── index.html              # Multi-Service Dashboard & In-Page Viewport
│   ├── css/style.css           # Glassmorphic Design System
│   └── js/app.js               # Service Navigation & Health Monitor
│
├── Diya mart/                  # Service 1: Fashion & Apparel Store (/diyamart/)
│   ├── public/                 # Storefront & Collections
│   ├── server.py               # Flask REST Backend
│   └── DiyaMart_Updated.db     # SQLite Database
│
├── Diya Taxi/                  # Service 2: Urban Mobility & Cab Simulation (/diyataxi/)
│   ├── build/                  # Production Web Build
│   └── src/                    # Source Components
│
├── Diya cafe/                  # DiyaCafe: Artisanal Indian Cafe & Bistro (/diyacafe/)
│   ├── index.html              # 15 Outlets, Menu & Curbside Drive-In
│   ├── css/                    # Cafe Styles
│   ├── js/                     # Catalog & Order Engine
│   └── images/                 # Food & Outlets Photography
│
├── Diya Buzz/                  # Service 4: Social Media & Community Feed (/diyabuzz/)
│   ├── index.html              # Modern Social Application
│   ├── styles.css              # Curated Theme & Responsive Layout
│   ├── app.js                  # Feed, Reactions, Comments & Stories Engine
│   └── divabuzz_data.js        # Rich Media Profiles & Seed Posts
│
├── server.py                   # Master Unified Gateway Server (Port 5000)
└── run_hub.bat                 # 1-Click Windows Batch Launcher
```

---

## 🚀 How to Run

### Option 1: One-Click Windows Launcher
Double click **`run_hub.bat`** in File Explorer.

### Option 2: Command Line
```bash
python server.py
```
This will start the unified master server on **`http://localhost:5000`** with all services accessible seamlessly!

---

## 🌐 Route Mapping (Unified Port 5000)

| Service | Dedicated Directory | URL Path | Description |
| :--- | :--- | :--- | :--- |
| **DiyaHub Dashboard** | `Dashboard/` | `/` | Central launcher & status monitor |
| **DiyaMart** | `Diya mart/` | `/diyamart/` | Silk sarees & couture retail storefront |
| **DiyaTaxi** | `Diya Taxi/` | `/diyataxi/` | Cab hailing simulator & fleet operations |
| **DiyaCafe** | `Diya cafe/` | `/diyacafe/` | Artisanal coffee, dosas & curbside drive-in |
| **DiyaBuzz** | `Diya Buzz/` | `/diyabuzz/` | Social media feeds, reactions & community posts |
