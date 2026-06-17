from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List
from app.services.mikrotik_service import mikrotik_service
import random
import string

router = APIRouter()

class GenerateVoucherRequest(BaseModel):
    username: str
    password: Optional[str] = None
    profile: str = 'default'
    limit_uptime: Optional[str] = None

class BulkGenerateRequest(BaseModel):
    quantity: int = 1
    profile: str = 'voucher_harian'
    limit_uptime: Optional[str] = None
    char_type: str = 'numeric'
    length: int = 4
    prefix: str = 'PION-'

class MarkPrintedRequest(BaseModel):
    usernames: List[str]

class ProfileRequest(BaseModel):
    name: str
    rate_limit: str = ''
    shared_users: str = '1'
    price: int = 0
    validity: str = ''

class EditVoucherRequest(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    plan: Optional[str] = None

@router.get("/test-connection")
def test_connection():
    identity = mikrotik_service.get_system_identity()
    if identity is not None:
        return {"status": "Connected", "identity": identity}
    raise HTTPException(status_code=500, detail="Koneksi ke MikroTik gagal")

@router.post("/reboot")
def reboot():
    success, msg = mikrotik_service.reboot_router()
    if success:
        return {"status": "Success", "message": msg}
    raise HTTPException(status_code=500, detail=msg)

@router.get("/vouchers")
def get_vouchers():
    users = mikrotik_service.get_hotspot_users()
    if users is None:
        raise HTTPException(status_code=500, detail="Koneksi ke MikroTik gagal")
        
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
        
        limit_uptime = user.get('limit-uptime', None)
        
        vouchers.append({
            "id": user.get('id'),
            "code": username,
            "plan": user.get('profile', 'default'),
            "status": status,
            "is_printed": is_printed,
            "uptime": uptime,
            "limit_uptime": limit_uptime,
            "first_used_at": first_used_at,
            "expires_at": expires_at
        })
        
    return vouchers

@router.post("/generate")
def generate_voucher(data: GenerateVoucherRequest):
    from app.services.supabase_service import supabase_service
    
    username = data.username
    password = data.password
    profile = data.profile
    limit_uptime = data.limit_uptime
    
    if not username:
        raise HTTPException(status_code=400, detail="Username wajib diisi")
        
    # Fetch validity from profile
    sb_profiles = supabase_service.get_profiles()
    validity = next((p.get('validity', '') for p in sb_profiles if p.get('name') == profile), '')
    
    # 1. Tulis ke MikroTik
    success, msg = mikrotik_service.generate_voucher(username, password or username, profile, validity)
    
    if success:
        # 2. Dual-Write ke Supabase
        sb_profiles = supabase_service.get_profiles()
        price = next((p.get('price', 0) for p in sb_profiles if p.get('name') == profile), 0)
        
        if not password or username == password:
            sup_success, sup_data = supabase_service.insert_voucher(username, password or username, profile, price)
        else:
            sup_success, sup_data = supabase_service.insert_member(username, password, profile, price)
            
        if not sup_success:
            print(f"[Supabase Warning] Gagal menyimpan ke Supabase: {sup_data}")
            
        return {
            "status": "Success", 
            "message": msg, 
            "supabase_synced": sup_success
        }
        
    raise HTTPException(status_code=500, detail=msg)

@router.post("/bulk-generate")
def bulk_generate_voucher(data: BulkGenerateRequest):
    from app.services.supabase_service import supabase_service
    
    quantity = data.quantity
    profile = data.profile
    limit_uptime = data.limit_uptime
    
    if quantity < 1 or quantity > 100:
        raise HTTPException(status_code=400, detail="Jumlah harus antara 1 dan 100")
        
    generated = []
    
    # Fetch profiles once to prevent N+1 query lag
    sb_profiles = supabase_service.get_profiles()
    validity = next((p.get('validity', '') for p in sb_profiles if p.get('name') == profile), '')
    price = next((p.get('price', 0) for p in sb_profiles if p.get('name') == profile), 0)
    
    char_type = getattr(data, 'char_type', 'numeric')
    length = getattr(data, 'length', 4)
    prefix = getattr(data, 'prefix', 'PION-')
    
    for _ in range(quantity):
        if char_type == 'numeric':
            pool = string.digits
        elif char_type == 'lowercase':
            pool = string.ascii_lowercase
        elif char_type == 'uppercase':
            pool = string.ascii_uppercase
        elif char_type == 'alphanumeric':
            pool = string.ascii_letters + string.digits
        else:
            pool = string.digits
            
        random_str = ''.join(random.choices(pool, k=length))
        username = f"{prefix}{random_str}"
        password = username
        
        success, msg = mikrotik_service.generate_voucher(username, password, profile, validity)
        
        if success:
            supabase_service.insert_voucher(username, password, profile, price)
            generated.append({
                "username": username,
                "password": password,
                "plan": profile
            })
            
    if not generated:
        raise HTTPException(status_code=500, detail="Gagal membuat voucher di MikroTik")
        
    return {
        "status": "Success", 
        "message": f"Berhasil membuat {len(generated)} voucher", 
        "vouchers": generated
    }

@router.post("/sync")
def sync_mikrotik():
    return {"status": "success", "message": "Synced successfully with Mikrotik"}

@router.get("/monitor")
def get_live_monitor():
    data = mikrotik_service.get_monitor_data()
    if data is not None:
        return {"status": "Success", "data": data}
    raise HTTPException(status_code=500, detail="Gagal mengambil data live monitor dari MikroTik")

@router.delete("/{mt_id}")
def delete_voucher(mt_id: str, username: Optional[str] = None):
    success, msg = mikrotik_service.delete_voucher(mt_id)
    if success:
        if username:
            from app.services.supabase_service import supabase_service
            supabase_service.delete_record(username)
        return {"status": "Success", "message": msg}
    raise HTTPException(status_code=500, detail=msg)

@router.put("/{mt_id}")
def edit_voucher(mt_id: str, data: EditVoucherRequest):
    success, msg = mikrotik_service.edit_voucher(mt_id, data.password, data.plan)
    if success:
        if data.username and (data.password or data.plan):
            from app.services.supabase_service import supabase_service
            supabase_service.update_record(data.username, data.password, data.plan)
        return {"status": "Success", "message": msg}
    raise HTTPException(status_code=500, detail=msg)

@router.post("/mark-printed")
def mark_printed(data: MarkPrintedRequest):
    if not data.usernames:
        raise HTTPException(status_code=400, detail="No usernames provided")
        
    from app.services.supabase_service import supabase_service
    success, msg = supabase_service.mark_as_printed(data.usernames)
    if success:
        return {"status": "Success", "message": msg}
    raise HTTPException(status_code=500, detail=msg)

@router.get("/profiles")
def get_profiles():
    mt_profiles = mikrotik_service.get_profiles()
    if mt_profiles is None:
        raise HTTPException(status_code=500, detail="Koneksi ke MikroTik gagal")
        
    from app.services.supabase_service import supabase_service
    sb_profiles = supabase_service.get_profiles()
    sb_dict = {p['name']: p for p in sb_profiles}
    
    merged = []
    for p in mt_profiles:
        name = p.get('name')
        price = sb_dict.get(name, {}).get('price', 0)
        validity = sb_dict.get(name, {}).get('validity', '')
        merged.append({
            "id": p.get('id'),
            "name": name,
            "rate_limit": p.get('rate-limit', ''),
            "shared_users": p.get('shared-users', '1'),
            "price": price,
            "validity": validity
        })
    return merged

@router.post("/profiles")
def add_profile(data: ProfileRequest):
    from app.services.supabase_service import supabase_service
    
    success, msg = mikrotik_service.add_profile(data.name, data.rate_limit, data.shared_users)
    if success:
        supabase_service.upsert_profile(data.name, data.price, data.validity)
        return {"status": "Success", "message": msg}
    raise HTTPException(status_code=500, detail=msg)

@router.put("/profiles/{mt_id}")
def update_profile(mt_id: str, data: ProfileRequest):
    from app.services.supabase_service import supabase_service
    
    success, msg = mikrotik_service.edit_profile(mt_id, data.name, data.rate_limit, data.shared_users)
    if success and data.name:
        supabase_service.upsert_profile(data.name, data.price, data.validity)
        return {"status": "Success", "message": msg}
    raise HTTPException(status_code=500, detail=msg)

@router.delete("/profiles/{mt_id}")
def remove_profile(mt_id: str, name: Optional[str] = None):
    from app.services.supabase_service import supabase_service
    
    success, msg = mikrotik_service.delete_profile(mt_id)
    if success and name:
        supabase_service.delete_profile(name)
        return {"status": "Success", "message": msg}
    raise HTTPException(status_code=500, detail=msg)

@router.get("/active")
def get_active():
    data = mikrotik_service.get_active_sessions()
    if data is None:
        raise HTTPException(status_code=500, detail="Koneksi ke MikroTik gagal")
    return data

@router.delete("/active/{mt_id}")
def kick_active(mt_id: str):
    success, msg = mikrotik_service.kick_active_user(mt_id)
    if success:
        return {"status": "Success", "message": msg}
    raise HTTPException(status_code=500, detail=msg)

@router.get("/sales")
def get_sales():
    from app.services.supabase_service import supabase_service
    sales = supabase_service.get_sales()
    return sales

class AntiLagRequest(BaseModel):
    enabled: bool

@router.get("/anti-lag/status")
def get_anti_lag_status():
    status = mikrotik_service.get_anti_lag_status()
    return {"status": "Success", "enabled": status}

@router.post("/anti-lag/toggle")
def toggle_anti_lag(req: AntiLagRequest):
    if req.enabled:
        success, msg = mikrotik_service.enable_anti_lag()
    else:
        success, msg = mikrotik_service.disable_anti_lag()
        
    if success:
        return {"status": "Success", "message": msg, "enabled": req.enabled}
    raise HTTPException(status_code=500, detail=msg)
