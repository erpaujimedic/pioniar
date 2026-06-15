from flask import Blueprint, jsonify
from app.services.mikrotik_service import mikrotik_service

bp = Blueprint('wifi', __name__)

@bp.route("/test-connection", methods=["GET"])
def test_connection():
    identity = mikrotik_service.get_system_identity()
    if identity is not None:
        return jsonify({"status": "Connected", "identity": identity})
    return jsonify({"status": "Failed", "error": "Koneksi ke MikroTik gagal"}), 500

@bp.route("/reboot", methods=["POST"])
def reboot():
    success, msg = mikrotik_service.reboot_router()
    if success:
        return jsonify({"status": "Success", "message": msg})
    return jsonify({"status": "Failed", "error": msg}), 500

@bp.route("/vouchers", methods=["GET"])
def get_vouchers():
    users = mikrotik_service.get_hotspot_users()
    
    from app.services.supabase_service import supabase_service
    try:
        res = supabase_service.supabase.table('vouchers').select('code, is_printed, status, first_used_at, expires_at').execute()
        sb_vouchers = {row['code']: row for row in res.data}
    except:
        sb_vouchers = {}
        
    try:
        res_m = supabase_service.supabase.table('members').select('username, is_printed, status, first_used_at, expires_at').execute()
        for row in res_m.data:
            sb_vouchers[row['username']] = row
    except:
        pass
        
    vouchers = []
    for user in users:
        if user.get('name') == 'admin':
            continue
            
        username = user.get('name')
        uptime = user.get('uptime', '0s')
        
        sb_data = sb_vouchers.get(username, {})
        is_printed = sb_data.get('is_printed', False)
        status = sb_data.get('status', 'Tersedia')
        first_used_at = sb_data.get('first_used_at', None)
        expires_at = sb_data.get('expires_at', None)
        
        vouchers.append({
            "id": user.get('id'),
            "code": username,
            "plan": user.get('profile', 'default'),
            "status": status,
            "is_printed": is_printed,
            "uptime": uptime,
            "first_used_at": first_used_at,
            "expires_at": expires_at
        })
        
    return jsonify(vouchers)

@bp.route("/generate", methods=["POST"])
def generate_voucher():
    from flask import request
    from app.services.supabase_service import supabase_service
    
    data = request.json
    username = data.get('username')
    password = data.get('password')
    profile = data.get('profile', 'default')
    
    if not username:
        return jsonify({"status": "Failed", "error": "Username wajib diisi"}), 400
        
    # 1. Tulis ke MikroTik
    success, msg = mikrotik_service.generate_voucher(username, password or username, profile)
    
    if success:
        # 2. Dual-Write ke Supabase
        # Get price
        sb_profiles = supabase_service.get_profiles()
        price = next((p.get('price', 0) for p in sb_profiles if p.get('name') == profile), 0)
        
        # Logika: Jika password kosong atau sama dengan username = Voucher. Jika beda = Member.
        if not password or username == password:
            sup_success, sup_data = supabase_service.insert_voucher(username, password or username, profile, price)
        else:
            sup_success, sup_data = supabase_service.insert_member(username, password, profile, price)
            
        if not sup_success:
            print(f"[Supabase Warning] Gagal menyimpan ke Supabase: {sup_data}")
            
        return jsonify({
            "status": "Success", 
            "message": msg, 
            "supabase_synced": sup_success
        })
        
    return jsonify({"status": "Failed", "error": msg}), 500

@bp.route("/bulk-generate", methods=["POST"])
def bulk_generate_voucher():
    from flask import request
    from app.services.supabase_service import supabase_service
    import random
    import string
    
    data = request.json
    try:
        quantity = int(data.get('quantity', 1))
    except ValueError:
        return jsonify({"status": "Failed", "error": "Format quantity salah"}), 400
        
    profile = data.get('profile', 'voucher_harian')
    
    if quantity < 1 or quantity > 100:
        return jsonify({"status": "Failed", "error": "Jumlah harus antara 1 dan 100"}), 400
        
    generated = []
    
    # 1. Loop untuk generate
    for _ in range(quantity):
        # Generate random 4-digit code e.g. PION-4829
        random_str = ''.join(random.choices(string.digits, k=4))
        username = f"PION-{random_str}"
        password = username # Untuk hotspot voucher biasa, user=pass
        
        # Tulis ke MikroTik
        success, msg = mikrotik_service.generate_voucher(username, password, profile)
        
        if success:
            # Dual-Write ke Supabase
            sb_profiles = supabase_service.get_profiles()
            price = next((p.get('price', 0) for p in sb_profiles if p.get('name') == profile), 0)
            
            supabase_service.insert_voucher(username, password, profile, price)
            generated.append({
                "username": username,
                "password": password,
                "plan": profile
            })
            
    if not generated:
        return jsonify({"status": "Failed", "error": "Gagal membuat voucher di MikroTik"}), 500
        
    return jsonify({
        "status": "Success", 
        "message": f"Berhasil membuat {len(generated)} voucher", 
        "vouchers": generated
    })

@bp.route("/sync", methods=["POST"])
def sync_mikrotik():
    # Placeholder for mikrotik synchronization logic
    return jsonify({"status": "success", "message": "Synced successfully with Mikrotik"})

@bp.route("/monitor", methods=["GET"])
def get_live_monitor():
    data = mikrotik_service.get_monitor_data()
    if data is not None:
        return jsonify({"status": "Success", "data": data})
    return jsonify({"status": "Failed", "error": "Gagal mengambil data live monitor dari MikroTik"}), 500

@bp.route("/<mt_id>", methods=["DELETE"])
def delete_voucher(mt_id):
    from flask import request
    username = request.args.get('username')
    
    success, msg = mikrotik_service.delete_voucher(mt_id)
    if success:
        if username:
            from app.services.supabase_service import supabase_service
            supabase_service.delete_record(username)
        return jsonify({"status": "Success", "message": msg})
    return jsonify({"status": "Failed", "error": msg}), 500

@bp.route("/<mt_id>", methods=["PUT"])
def edit_voucher(mt_id):
    from flask import request
    data = request.json
    username = data.get('username')
    password = data.get('password')
    plan = data.get('plan')
    
    success, msg = mikrotik_service.edit_voucher(mt_id, password, plan)
    if success:
        if username and (password or plan):
            from app.services.supabase_service import supabase_service
            supabase_service.update_record(username, password, plan)
        return jsonify({"status": "Success", "message": msg})
    return jsonify({"status": "Failed", "error": msg}), 500

@bp.route("/mark-printed", methods=["POST"])
def mark_printed():
    from flask import request
    data = request.json
    usernames = data.get('usernames', [])
    if not usernames:
        return jsonify({"status": "Failed", "error": "No usernames provided"}), 400
        
    from app.services.supabase_service import supabase_service
    success, msg = supabase_service.mark_as_printed(usernames)
    if success:
        return jsonify({"status": "Success", "message": msg})
    return jsonify({"status": "Failed", "error": msg}), 500

@bp.route("/profiles", methods=["GET"])
def get_profiles():
    mt_profiles = mikrotik_service.get_profiles()
    from app.services.supabase_service import supabase_service
    sb_profiles = supabase_service.get_profiles()
    sb_dict = {p['name']: p for p in sb_profiles}
    
    merged = []
    for p in mt_profiles:
        name = p.get('name')
        price = sb_dict.get(name, {}).get('price', 0)
        merged.append({
            "id": p.get('id'),
            "name": name,
            "rate_limit": p.get('rate-limit', ''),
            "shared_users": p.get('shared-users', '1'),
            "price": price
        })
    return jsonify(merged)

@bp.route("/profiles", methods=["POST"])
def add_profile():
    from flask import request
    from app.services.supabase_service import supabase_service
    data = request.json
    name = data.get('name')
    rate_limit = data.get('rate_limit', '')
    shared_users = data.get('shared_users', '1')
    price = int(data.get('price', 0))
    
    success, msg = mikrotik_service.add_profile(name, rate_limit, shared_users)
    if success:
        supabase_service.upsert_profile(name, price)
        return jsonify({"status": "Success", "message": msg})
    return jsonify({"status": "Failed", "error": msg}), 500

@bp.route("/profiles/<mt_id>", methods=["PUT"])
def update_profile(mt_id):
    from flask import request
    from app.services.supabase_service import supabase_service
    data = request.json
    name = data.get('name')
    rate_limit = data.get('rate_limit')
    shared_users = data.get('shared_users')
    price = int(data.get('price', 0))
    
    success, msg = mikrotik_service.edit_profile(mt_id, name, rate_limit, shared_users)
    if success and name:
        supabase_service.upsert_profile(name, price)
        return jsonify({"status": "Success", "message": msg})
    return jsonify({"status": "Failed", "error": msg}), 500

@bp.route("/profiles/<mt_id>", methods=["DELETE"])
def remove_profile(mt_id):
    from flask import request
    from app.services.supabase_service import supabase_service
    name = request.args.get('name')
    
    success, msg = mikrotik_service.delete_profile(mt_id)
    if success and name:
        supabase_service.delete_profile(name)
        return jsonify({"status": "Success", "message": msg})
    return jsonify({"status": "Failed", "error": msg}), 500

@bp.route("/active", methods=["GET"])
def get_active():
    data = mikrotik_service.get_active_sessions()
    return jsonify(data)

@bp.route("/active/<mt_id>", methods=["DELETE"])
def kick_active(mt_id):
    success, msg = mikrotik_service.kick_active_user(mt_id)
    if success:
        return jsonify({"status": "Success", "message": msg})
    return jsonify({"status": "Failed", "error": msg}), 500

@bp.route("/sales", methods=["GET"])
def get_sales():
    from app.services.supabase_service import supabase_service
    sales = supabase_service.get_sales()
    return jsonify(sales)
