from app.services.mikrotik_service import mikrotik_service
from app.services.supabase_service import supabase_service

def setup_super_admin():
    username = "eepridwan"
    password = "Liveforever27*"
    profile = "default" # Profile MikroTik

    print(f"Menyiapkan akun {username}...")
    
    # 1. Masukkan ke MikroTik (agar bisa login Hotspot/Member)
    success, msg = mikrotik_service.generate_voucher(username, password, profile)
    if success:
        print(f"[MikroTik] Sukses: {msg}")
    else:
        print(f"[MikroTik] Gagal: {msg} (Mungkin user sudah ada)")
        
    # 2. Masukkan ke Supabase (Tabel Members)
    sup_success, sup_data = supabase_service.insert_member(username, password, profile)
    if sup_success:
        print(f"[Supabase] Sukses menyimpan ke tabel members.")
    else:
        print(f"[Supabase] Gagal/Sudah ada: {sup_data}")

if __name__ == "__main__":
    setup_super_admin()
