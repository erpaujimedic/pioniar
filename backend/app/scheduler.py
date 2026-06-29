import re
from datetime import datetime, timedelta
from app.services.mikrotik_service import mikrotik_service
from app.services.supabase_service import supabase_service

def parse_validity_to_timedelta(validity_str):
    if not validity_str: return timedelta(days=1)
    match = re.match(r"(\d+)([hdw])", validity_str.lower())
    if match:
        val = int(match.group(1))
        unit = match.group(2)
        if unit == 'h': return timedelta(hours=val)
        if unit == 'd': return timedelta(days=val)
        if unit == 'w': return timedelta(weeks=val)
    return timedelta(days=1)

def run_scheduler_job():
    try:
        # print("[Scheduler] Menjalankan pengecekan validity & reporting...")
        if not getattr(supabase_service, 'supabase', None):
            return
            
        mt_users = mikrotik_service.get_hotspot_users()
        if mt_users is None: return
        mt_active = mikrotik_service.get_active_users()
        if mt_active is None: return
        
        mt_user_dict = {u['name']: u for u in mt_users if 'name' in u}
        mt_active_dict = {u['user']: u for u in mt_active if 'user' in u}
        
        try:
            # Optimasi: Hanya tarik voucher yang belum Kadaluarsa untuk mengurangi beban (Full Table Scan prevention)
            res = supabase_service.supabase.table('vouchers').select('code, plan, first_used_at, expires_at, price, status').neq('status', 'Kadaluarsa').execute()
            sb_vouchers = res.data if res.data is not None else []
        except Exception as e:
            print(f"[Scheduler] Gagal fetch vouchers: {e}")
            sb_vouchers = []
            
        profiles = supabase_service.get_profiles()
        if profiles is None: profiles = []
        profile_dict = {p['name']: p for p in profiles}
        
        now = datetime.now()
        
        for v in sb_vouchers:
            uname = v.get('code')
            plan = v.get('plan')
            first_used_at = v.get('first_used_at')
            expires_at = v.get('expires_at')
            price = v.get('price', 0)
            status = v.get('status', 'Tersedia')
            
            # Cek Kadaluarsa
            if expires_at and status != 'Kadaluarsa':
                try:
                    exp_time = datetime.fromisoformat(expires_at.replace('Z', '+00:00')).replace(tzinfo=None)
                    if now >= exp_time:
                        print(f"[Scheduler] Voucher {uname} Kadaluarsa! Menghapus dari Mikrotik...")
                        
                        mt_user = mt_user_dict.get(uname)
                        if mt_user and '.id' in mt_user:
                            mikrotik_service.delete_voucher(mt_user['.id'])
                            
                        mt_act = mt_active_dict.get(uname)
                        if mt_act and '.id' in mt_act:
                            mikrotik_service.kick_active_user(mt_act['.id'])
                            
                        supabase_service.update_voucher_session(uname, "Kadaluarsa")
                        continue
                except Exception as e:
                    print(f"[Scheduler] Error parsing expires_at for {uname}: {e}")
            
            # Cek First Login (Penjualan)
            if not first_used_at and status != 'Kadaluarsa':
                mt_user = mt_user_dict.get(uname)
                if mt_user and mt_user.get('uptime', '0s') != '0s':
                    print(f"[Scheduler] Voucher {uname} FIRST LOGIN terdeteksi! Mencatat penjualan...")
                    
                    validity_str = "1d"
                    if plan in profile_dict:
                        validity_str = profile_dict[plan].get('validity', '1d')
                        if price == 0: 
                            price = profile_dict[plan].get('price', 0)
                    
                    td = parse_validity_to_timedelta(validity_str)
                    exp_time = now + td
                    
                    first_used_iso = now.isoformat()
                    exp_iso = exp_time.isoformat()
                    
                    supabase_service.update_voucher_session(uname, "Berjalan", first_used_iso, exp_iso)
                    supabase_service.insert_sale(uname, plan, price, first_used_iso)

    except Exception as e:
        print(f"[Scheduler] Error global: {e}")

# Note: APScheduler has been removed.
# On Vercel, this function should be triggered via a Cron Job hitting a specific API endpoint.
def start_scheduler():
    pass

def stop_scheduler():
    pass
