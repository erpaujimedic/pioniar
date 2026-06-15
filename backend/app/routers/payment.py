from flask import Blueprint, request, jsonify
from app.services.tripay_service import tripay_service
from app.services.mikrotik_service import mikrotik_service
from app.services.supabase_service import supabase_service
import random
import string
import json
import os
import hmac

bp = Blueprint('payment', __name__)

DB_FILE = os.path.join(os.path.dirname(__file__), '..', '..', 'transactions.json')

def load_transactions():
    if os.path.exists(DB_FILE):
        with open(DB_FILE, 'r') as f:
            try:
                return json.load(f)
            except:
                return {}
    return {}

def save_transactions(data):
    with open(DB_FILE, 'w') as f:
        json.dump(data, f, indent=4)

@bp.route('/create', methods=['POST'])
def create_transaction():
    data = request.json
    plan_name = data.get('plan_name')
    price = data.get('price')
    
    if not plan_name or not price:
        return jsonify({"status": "Failed", "error": "Invalid plan data"}), 400
        
    # Generate random username for the voucher
    random_str = ''.join(random.choices(string.digits, k=4))
    username = f"PION-{random_str}"
    
    # Merchant Ref format: PION-HOTSPOT-PlanName-Username
    safe_plan = plan_name.replace(' ', '_')
    merchant_ref = f"PION-HOTSPOT-{safe_plan}-{username}"
    
    # Order items for Tripay
    order_items = [
        {
            'sku': safe_plan,
            'name': f"Voucher WiFi: {plan_name}",
            'price': price,
            'quantity': 1,
        }
    ]
    
    # Request to Tripay (Using QRIS by default)
    success, res = tripay_service.request_transaction(
        method='QRIS',
        merchant_ref=merchant_ref,
        amount=price,
        customer_name='Pelanggan Pioniar',
        customer_email='pelanggan@pioniar.net',
        customer_phone='081234567890',
        order_items=order_items,
        return_url=f'https://pioniar.com/portal/checkout?ref={merchant_ref}'
    )
    
    if success:
        # Save to local db
        tx_data = res.get('data', {})
        transactions = load_transactions()
        transactions[merchant_ref] = {
            "status": "UNPAID",
            "username": username,
            "plan": plan_name,
            "checkout_url": tx_data.get('checkout_url'),
            "qr_url": tx_data.get('qr_url'),
            "amount": price
        }
        save_transactions(transactions)
        
        return jsonify({
            "status": "Success",
            "merchant_ref": merchant_ref,
            "checkout_url": tx_data.get('checkout_url'),
            "qr_url": tx_data.get('qr_url'),
            "tripay_data": tx_data
        })
    else:
        return jsonify({"status": "Failed", "error": res}), 500

@bp.route('/callback', methods=['POST'])
def callback():
    json_data = request.json
    callback_signature = request.headers.get('x-callback-signature')
    
    if not callback_signature:
        return jsonify({"success": False, "message": "No signature"}), 400
        
    # Verify signature
    # Since Flask request.get_data() gets raw body
    raw_body = request.get_data(as_text=True)
    if not tripay_service.verify_callback_signature(raw_body, callback_signature):
        return jsonify({"success": False, "message": "Invalid signature"}), 400
        
    if json_data.get('status') == 'PAID':
        merchant_ref = json_data.get('merchant_ref')
        transactions = load_transactions()
        
        if merchant_ref in transactions and transactions[merchant_ref]['status'] != 'PAID':
            tx = transactions[merchant_ref]
            username = tx['username']
            plan_name = tx['plan']
            price = tx['amount']
            
            # Generate di MikroTik
            success, msg = mikrotik_service.generate_voucher(username, username, plan_name)
            if success:
                # Insert ke Supabase
                supabase_service.insert_voucher(username, username, plan_name, price)
                # Tambah ke Sales
                import datetime
                sold_at = datetime.datetime.now().isoformat()
                supabase_service.insert_sale(username, plan_name, price, sold_at)
                
            # Update status transaksi lokal
            tx['status'] = 'PAID'
            save_transactions(transactions)
            
    return jsonify({"success": True})

@bp.route('/status', methods=['GET'])
def get_status():
    merchant_ref = request.args.get('ref')
    if not merchant_ref:
        return jsonify({"status": "Failed"}), 400
        
    transactions = load_transactions()
    tx = transactions.get(merchant_ref)
    
    if tx:
        return jsonify({
            "status": "Success",
            "payment_status": tx.get('status'),
            "username": tx.get('username') if tx.get('status') == 'PAID' else None
        })
    return jsonify({"status": "Failed", "error": "Not found"}), 404
