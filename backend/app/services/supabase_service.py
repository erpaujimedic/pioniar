import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

class SupabaseService:
    def __init__(self):
        self.url: str = os.getenv("SUPABASE_URL", "")
        self.key: str = os.getenv("SUPABASE_KEY", "")
        self.supabase: Client | None = None
        
        if self.url and self.key:
            try:
                self.supabase = create_client(self.url, self.key)
            except Exception as e:
                print(f"[Supabase Error] Gagal inisialisasi client: {e}")
        else:
            print("[Supabase Warning] SUPABASE_URL atau SUPABASE_KEY tidak ditemukan di .env")

    def insert_voucher(self, code: str, password: str, plan: str, price: int = 0):
        if not self.supabase:
            return False, "Supabase client belum aktif"
            
        try:
            response = self.supabase.table('vouchers').insert({
                "code": code,
                "password": password,
                "plan": plan,
                "price": price,
                "status": "Aktif"
            }).execute()
            return True, response.data
        except Exception as e:
            print(f"[Supabase Error] insert_voucher: {e}")
            return False, str(e)

    def insert_member(self, username: str, password: str, plan: str, price: int = 0):
        if not self.supabase:
            return False, "Supabase client belum aktif"
            
        try:
            response = self.supabase.table('members').insert({
                "username": username,
                "password": password,
                "plan": plan,
                "price": price,
                "status": "Aktif"
            }).execute()
            return True, response.data
        except Exception as e:
            print(f"[Supabase Error] insert_member: {e}")
            return False, str(e)

    def delete_record(self, username: str):
        if not self.supabase: return False, "Not active"
        try:
            self.supabase.table('vouchers').delete().eq('code', username).execute()
            self.supabase.table('members').delete().eq('username', username).execute()
            return True, "Deleted from Supabase"
        except Exception as e:
            return False, str(e)

    def update_record(self, username: str, password: str = None, plan: str = None):
        if not self.supabase: return False, "Not active"
        try:
            updates = {}
            if password: updates['password'] = password
            if plan: updates['plan'] = plan
            
            if updates:
                self.supabase.table('vouchers').update(updates).eq('code', username).execute()
                self.supabase.table('members').update(updates).eq('username', username).execute()
            return True, "Updated in Supabase"
        except Exception as e:
            return False, str(e)

    def mark_as_printed(self, usernames: list):
        if not self.supabase: return False, "Not active"
        if not usernames: return True, "No usernames provided"
        try:
            try:
                self.supabase.table('vouchers').update({'is_printed': True}).in_('code', usernames).execute()
            except: pass
            try:
                self.supabase.table('members').update({'is_printed': True}).in_('username', usernames).execute()
            except: pass
            return True, "Marked as printed"
        except Exception as e:
            return False, str(e)

    def get_printed_status(self):
        if not self.supabase: return {}
        status = {}
        try:
            res_v = self.supabase.table('vouchers').select('code, is_printed').execute()
            for row in res_v.data:
                status[row['code']] = row.get('is_printed', False)
        except Exception as e: pass
        
        try:
            res_m = self.supabase.table('members').select('username, is_printed').execute()
            for row in res_m.data:
                status[row['username']] = row.get('is_printed', False)
        except Exception as e: pass
        
        return status

    def get_profiles(self):
        if not self.supabase: return []
        try:
            res = self.supabase.table('profiles').select('*').execute()
            return res.data
        except Exception:
            return []

    def upsert_profile(self, name: str, price: int, validity: str = "1d"):
        if not self.supabase: return False, "No client"
        try:
            self.supabase.table('profiles').upsert({"name": name, "price": price, "validity": validity}, on_conflict="name").execute()
            return True, "Profile saved"
        except Exception as e:
            return False, str(e)

    def delete_profile(self, name: str):
        if not self.supabase: return False, "No client"
        try:
            self.supabase.table('profiles').delete().eq('name', name).execute()
            return True, "Profile deleted"
        except Exception as e:
            return False, str(e)

    def get_vouchers_by_status(self, status: str):
        if not self.supabase: return []
        try:
            res = self.supabase.table('vouchers').select('*').eq('status', status).execute()
            return res.data
        except:
            return []

    def update_voucher_session(self, username: str, status: str, first_used_at: str = None, expires_at: str = None):
        if not self.supabase: return False
        try:
            updates = {"status": status}
            if first_used_at: updates["first_used_at"] = first_used_at
            if expires_at: updates["expires_at"] = expires_at
            self.supabase.table('vouchers').update(updates).eq('code', username).execute()
            self.supabase.table('members').update(updates).eq('username', username).execute()
            return True
        except: return False

    def insert_sale(self, username: str, plan: str, price: int, sold_at: str):
        if not self.supabase: return False
        try:
            self.supabase.table('sales').insert({
                "username": username,
                "plan": plan,
                "price": price,
                "sold_at": sold_at
            }).execute()
            return True
        except: return False

    def get_sales(self):
        if not self.supabase: return []
        try:
            res = self.supabase.table('sales').select('*').order('sold_at', desc=True).execute()
            return res.data
        except:
            return []

supabase_service = SupabaseService()
