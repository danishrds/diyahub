import os
import sys
import importlib.util
from flask import send_from_directory, jsonify, request, redirect

# Ensure UTF-8 output on Windows console
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def find_dir(*candidates):
    for c in candidates:
        p = os.path.join(BASE_DIR, c)
        if os.path.exists(p):
            return p
    return os.path.join(BASE_DIR, candidates[0])

DASHBOARD_DIR = find_dir('Dashboard', 'dashboard')
DIYAMART_DIR = find_dir('Diya mart', 'diyamart')
DIYAMART_PUBLIC = os.path.join(DIYAMART_DIR, 'public')
DIYATAXI_DIR = find_dir('Diya Taxi', 'diyataxi')
DIYATAXI_BUILD = os.path.join(DIYATAXI_DIR, 'build')
DIYACAFE_DIR = find_dir('Diya cafe', 'diyacafe')
DIYABUZZ_DIR = find_dir('Diya Buzz', 'diyabuzz')

# Safely import DiyaMart Flask app with all its SQLite models and REST APIs
mart_server_file = os.path.join(DIYAMART_DIR, 'server.py')
if os.path.exists(mart_server_file):
    spec = importlib.util.spec_from_file_location('diyamart_server', mart_server_file)
    mart_server = importlib.util.module_from_spec(spec)
    sys.modules['diyamart_server'] = mart_server
    sys.path.insert(0, DIYAMART_DIR)
    spec.loader.exec_module(mart_server)
    app = mart_server.app
else:
    from flask import Flask
    app = Flask(__name__)

# 1. Root Route -> Serves Central Hub Dashboard
@app.route('/', endpoint='hub_dashboard')
def serve_dashboard():
    return send_from_directory(DASHBOARD_DIR, 'index.html')

# 2. Central Ecosystem Health Check Endpoint
@app.route('/api/services')
def hub_services():
    return jsonify({
        "diyamart": os.path.exists(os.path.join(DIYAMART_PUBLIC, 'index.html')),
        "diyataxi": os.path.exists(os.path.join(DIYATAXI_BUILD, 'index.html')),
        "diyacafe": os.path.exists(os.path.join(DIYACAFE_DIR, 'index.html')),
        "diyabuzz": os.path.exists(os.path.join(DIYABUZZ_DIR, 'index.html')),
        "service4": os.path.exists(os.path.join(DIYABUZZ_DIR, 'index.html'))
    })

# 3. DiyaMart Service Route
@app.route('/diyamart')
def redirect_diyamart():
    return redirect('/diyamart/', code=302)

@app.route('/diyamart/')
@app.route('/diyamart/<path:path>')
def serve_diyamart(path='index.html'):
    target = os.path.join(DIYAMART_PUBLIC, path)
    if os.path.exists(target) and not os.path.isdir(target):
        return send_from_directory(DIYAMART_PUBLIC, path)
    return send_from_directory(DIYAMART_PUBLIC, 'index.html')

# 4. DiyaTaxi Service Route
@app.route('/diyataxi')
def redirect_diyataxi():
    return redirect('/diyataxi/', code=302)

@app.route('/diyataxi/')
@app.route('/diyataxi/<path:path>')
def serve_diyataxi(path='index.html'):
    target = os.path.join(DIYATAXI_BUILD, path)
    if os.path.exists(target) and not os.path.isdir(target):
        return send_from_directory(DIYATAXI_BUILD, path)
    return send_from_directory(DIYATAXI_BUILD, 'index.html')

# 5. React SPA Static Assets for DiyaTaxi
@app.route('/static/<path:path>')
def serve_react_static(path):
    return send_from_directory(os.path.join(DIYATAXI_BUILD, 'static'), path)

# 6. DiyaCafe Service Route
@app.route('/diyacafe')
def redirect_diyacafe():
    return redirect('/diyacafe/', code=302)

@app.route('/diyacafe/')
@app.route('/diyacafe/<path:path>')
def serve_diyacafe(path='index.html'):
    target = os.path.join(DIYACAFE_DIR, path)
    if os.path.exists(target) and not os.path.isdir(target):
        return send_from_directory(DIYACAFE_DIR, path)
    return send_from_directory(DIYACAFE_DIR, 'index.html')

# 7. DiyaBuzz Social Media Service Route
@app.route('/diyabuzz')
def redirect_diyabuzz():
    return redirect('/diyabuzz/', code=302)

@app.route('/diyabuzz/')
@app.route('/diyabuzz/<path:path>')
def serve_diyabuzz(path='index.html'):
    target = os.path.join(DIYABUZZ_DIR, path)
    if os.path.exists(target) and not os.path.isdir(target):
        return send_from_directory(DIYABUZZ_DIR, path)
    return send_from_directory(DIYABUZZ_DIR, 'index.html')

# Backward compatibility: Redirect /service4 to /diyabuzz
@app.route('/service4')
@app.route('/service4/')
@app.route('/service4/<path:path>')
def redirect_legacy_service4(path=None):
    return redirect('/diyabuzz/', code=302)

# 8. Asset Resolvers (CSS, JS, Images)
@app.route('/css/<path:path>')
def resolve_css(path):
    dashboard_css = os.path.join(DASHBOARD_DIR, 'css', path)
    if os.path.exists(dashboard_css):
        return send_from_directory(os.path.join(DASHBOARD_DIR, 'css'), path)
    mart_css = os.path.join(DIYAMART_PUBLIC, 'css', path)
    if os.path.exists(mart_css):
        return send_from_directory(os.path.join(DIYAMART_PUBLIC, 'css'), path)
    cafe_css = os.path.join(DIYACAFE_DIR, 'css', path)
    if os.path.exists(cafe_css):
        return send_from_directory(os.path.join(DIYACAFE_DIR, 'css'), path)
    return ('', 404)

@app.route('/js/<path:path>')
def resolve_js(path):
    dashboard_js = os.path.join(DASHBOARD_DIR, 'js', path)
    if os.path.exists(dashboard_js):
        return send_from_directory(os.path.join(DASHBOARD_DIR, 'js'), path)
    mart_js = os.path.join(DIYAMART_PUBLIC, 'js', path)
    if os.path.exists(mart_js):
        return send_from_directory(os.path.join(DIYAMART_PUBLIC, 'js'), path)
    cafe_js = os.path.join(DIYACAFE_DIR, 'js', path)
    if os.path.exists(cafe_js):
        return send_from_directory(os.path.join(DIYACAFE_DIR, 'js'), path)
    return ('', 404)

@app.route('/images/<path:path>')
def resolve_images(path):
    mart_img = os.path.join(DIYAMART_PUBLIC, 'images', path)
    if os.path.exists(mart_img):
        return send_from_directory(os.path.join(DIYAMART_PUBLIC, 'images'), path)
    cafe_img = os.path.join(DIYACAFE_DIR, 'images', path)
    if os.path.exists(cafe_img):
        return send_from_directory(os.path.join(DIYACAFE_DIR, 'images'), path)
    return ('', 404)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print("=" * 60)
    print("  [*] DIYAHUB UNIFIED MASTER SERVER RUNNING (SINGLE PORT)")
    print("=" * 60)
    print(f"  Central Gateway: http://127.0.0.1:{port}")
    print(f"  DiyaMart Store:  http://127.0.0.1:{port}/diyamart/")
    print(f"  DiyaTaxi App:    http://127.0.0.1:{port}/diyataxi/")
    print(f"  DiyaCafe Bistro: http://127.0.0.1:{port}/diyacafe/")
    print(f"  DiyaBuzz Social: http://127.0.0.1:{port}/diyabuzz/")
    print("=" * 60)
    app.run(host='0.0.0.0', port=port, debug=True)
