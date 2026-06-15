from flask import Flask, jsonify
from flask_cors import CORS
from app.routers import wifi, livestock, snack, payment

app = Flask(__name__)
# Enable CORS for the React frontend
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

@app.route("/")
def read_root():
    return jsonify({"message": "Welcome to PIONIAR API Ecosystem"})

# Register Blueprints
app.register_blueprint(wifi.bp, url_prefix="/api/wifi")
app.register_blueprint(livestock.bp, url_prefix="/api/livestock")
app.register_blueprint(snack.bp, url_prefix="/api/snack")
from app.routers import chat
app.register_blueprint(chat.bp, url_prefix="/api/chat")
app.register_blueprint(payment.bp, url_prefix="/api/payment")

from app.scheduler import start_scheduler

# Mulai background engine untuk cek masa aktif voucher & pendapatan
start_scheduler()

# App is exported for run.py
