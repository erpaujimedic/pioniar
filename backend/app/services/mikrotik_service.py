import os
import routeros_api
from dotenv import load_dotenv
from contextlib import contextmanager

load_dotenv(override=True)

import threading

class MikrotikService:
    def __init__(self):
        self.local_host = "192.168.100.1"
        self.local_port = 8728
        self.public_host = "id-36.tunnel.web.id"
        self.public_port = 3693
        
        self.username = "admin"
        self.password = "Liveforever27*"
        self.pool = None
        self.lock = threading.Lock()
        
        self._monitor_cache = None
        self._monitor_cache_time = 0

    def _ensure_pool(self):
        """Memastikan koneksi pool tersedia dengan fitur fallback (Local -> Public)."""
        if not self.pool:
            targets = []
            if self.public_host:
                targets.append((self.public_host, self.public_port))
            targets.append((self.local_host, self.local_port))
                
            last_err = None
            for host, port in targets:
                if not host: continue
                try:
                    pool = routeros_api.RouterOsApiPool(
                        host,
                        username=self.username,
                        password=self.password,
                        port=port,
                        plaintext_login=True
                    )
                    pool.get_api().get_resource('/system/identity').get() # test connect
                    self.pool = pool
                    print(f"[MikroTik] Terhubung ke {host}:{port}")
                    return
                except Exception as e:
                    last_err = e
                    continue
            
            if last_err:
                raise last_err

    @contextmanager
    def get_api(self):
        """
        Context manager yang cerdas untuk mengambil API session.
        Otomatis menangani error dan merekonstruksi pool jika koneksi mati.
        Thread-safe untuk menghindari error WinError 10038 / Socket tabrakan.
        """
        with self.lock:
            self._ensure_pool()
            api = None
            try:
                # Mengambil koneksi dari pool (instan jika pool sudah hidup)
                api = self.pool.get_api()
                yield api
            except Exception as e:
                # Jika ada error socket/koneksi mati di tengah jalan, hancurkan pool
                # agar request berikutnya otomatis membuat pool/koneksi baru (Auto-Healing)
                if self.pool:
                    try:
                        self.pool.disconnect()
                    except:
                        pass
                self.pool = None
                raise e

    def get_system_identity(self):
        try:
            with self.get_api() as api:
                list_identity = api.get_resource('/system/identity')
                return list_identity.get()
        except Exception as e:
            print(f"[MikroTik Error] get_system_identity: {e}")
            return None

    def get_hotspot_users(self):
        try:
            with self.get_api() as api:
                users_resource = api.get_resource('/ip/hotspot/user')
                return users_resource.get()
        except Exception as e:
            print(f"[MikroTik Error] get_hotspot_users: {e}")
            return None

    def get_active_users(self):
        try:
            with self.get_api() as api:
                active_resource = api.get_resource('/ip/hotspot/active')
                return active_resource.get()
        except Exception as e:
            print(f"[MikroTik Error] get_active_users: {e}")
            return None

    def generate_voucher(self, username, password, profile="default", limit_uptime=None):
        try:
            with self.get_api() as api:
                users_resource = api.get_resource('/ip/hotspot/user')
                kwargs = {'name': username, 'password': password, 'profile': profile}
                if limit_uptime:
                    kwargs['limit-uptime'] = limit_uptime
                users_resource.add(**kwargs)
                return True, f"Voucher {username} created successfully"
        except Exception as e:
            print(f"[MikroTik Error] generate_voucher: {e}")
            return False, str(e)

    def delete_voucher(self, mt_id):
        try:
            with self.get_api() as api:
                users_resource = api.get_resource('/ip/hotspot/user')
                users_resource.remove(id=mt_id)
                return True, "Voucher deleted successfully"
        except Exception as e:
            print(f"[MikroTik Error] delete_voucher: {e}")
            return False, str(e)

    def edit_voucher(self, mt_id, password=None, profile=None):
        try:
            with self.get_api() as api:
                users_resource = api.get_resource('/ip/hotspot/user')
                kwargs = {'id': mt_id}
                if password:
                    kwargs['password'] = password
                if profile:
                    kwargs['profile'] = profile
                
                users_resource.set(**kwargs)
                return True, "Voucher updated successfully"
        except Exception as e:
            print(f"[MikroTik Error] edit_voucher: {e}")
            return False, str(e)

    def get_monitor_data(self):
        import time
        now = time.time()
        if self._monitor_cache and (now - self._monitor_cache_time < 5):
            return self._monitor_cache

        try:
            with self.get_api() as api:
                # 1. Total Active Users & Latest Login
                active_resource = api.get_resource('/ip/hotspot/active')
                active_users = active_resource.get()
                active_count = len(active_users)
                
                latest_login = "Belum ada"
                if active_count > 0:
                    latest_login = active_users[-1].get('user', 'Guest')
                    
                # 2. Resource (Uptime, CPU, Memory, HDD, Board)
                resource = api.get_resource('/system/resource')
                sys_res = resource.get()
                uptime = '00:00:00'
                cpu_load = '0'
                memory_usage = '0 MB'
                board_name = 'Unknown'
                hdd_usage = '0 / 0 MB'
                
                if sys_res:
                    uptime = sys_res[0].get('uptime', '00:00:00')
                    cpu_load = sys_res[0].get('cpu-load', '0')
                    free_mem = int(sys_res[0].get('free-memory', 0))
                    total_mem = int(sys_res[0].get('total-memory', 1)) # hindari div by zero
                    used_mb = round((total_mem - free_mem) / 1024 / 1024, 1)
                    memory_usage = f"{used_mb} MB"
                    
                    board_name = sys_res[0].get('board-name', 'MikroTik')
                    free_hdd = int(sys_res[0].get('free-hdd-space', 0))
                    total_hdd = int(sys_res[0].get('total-hdd-space', 1))
                    used_hdd_mb = round((total_hdd - free_hdd) / 1024 / 1024, 1)
                    total_hdd_mb = round(total_hdd / 1024 / 1024, 1)
                    hdd_usage = f"{used_hdd_mb} MB"
                
                # 3. Traffic Speed (ether3-Hotspot)
                speed_mbps = 0
                try:
                    traffic = api.get_resource('/interface')
                    res = traffic.call('monitor-traffic', {'interface': 'ether3-Hotspot', 'once': ''})
                    if res:
                        tx = int(res[0].get('tx-bits-per-second', 0))
                        rx = int(res[0].get('rx-bits-per-second', 0))
                        speed_mbps = round((tx + rx) / 1000000, 1) # Convert bits to Mbps
                except Exception as e:
                    print(f"[MikroTik Error] Gagal fetch traffic: {e}")

                
                result = {
                    "active_users": active_count,
                    "latest_login": latest_login,
                    "uptime": uptime,
                    "speed_mbps": speed_mbps,
                    "cpu_load": cpu_load,
                    "memory_usage": memory_usage,
                    "board_name": board_name,
                    "hdd_usage": hdd_usage
                }
                self._monitor_cache = result
                self._monitor_cache_time = time.time()
                return result
        except Exception as e:
            print(f"[MikroTik Error] get_monitor_data: {e}")
            return self._monitor_cache

    def reboot_router(self):
        try:
            with self.get_api() as api:
                api.get_binary_resource('/').call('system/reboot')
                return True, "Router sedang reboot..."
        except Exception:
            # Karena koneksi langsung putus saat reboot, kita anggap sukses
            return True, "Router sedang reboot..."

    def get_profiles(self):
        try:
            with self.get_api() as api:
                profiles_resource = api.get_resource('/ip/hotspot/user/profile')
                return profiles_resource.get()
        except Exception as e:
            print(f"[MikroTik Error] get_profiles: {e}")
            return None

    def add_profile(self, name, rate_limit, shared_users):
        try:
            with self.get_api() as api:
                profiles_resource = api.get_resource('/ip/hotspot/user/profile')
                profiles_resource.add(name=name, **{'rate-limit': rate_limit}, **{'shared-users': str(shared_users)})
                return True, "Profile added successfully"
        except Exception as e:
            print(f"[MikroTik Error] add_profile: {e}")
            return False, str(e)

    def edit_profile(self, mt_id, name=None, rate_limit=None, shared_users=None):
        try:
            with self.get_api() as api:
                profiles_resource = api.get_resource('/ip/hotspot/user/profile')
                kwargs = {'id': mt_id}
                if name: kwargs['name'] = name
                if rate_limit: kwargs['rate-limit'] = rate_limit
                if shared_users: kwargs['shared-users'] = str(shared_users)
                profiles_resource.set(**kwargs)
                return True, "Profile updated successfully"
        except Exception as e:
            print(f"[MikroTik Error] edit_profile: {e}")
            return False, str(e)

    def delete_profile(self, mt_id):
        try:
            with self.get_api() as api:
                profiles_resource = api.get_resource('/ip/hotspot/user/profile')
                profiles_resource.remove(id=mt_id)
                return True, "Profile deleted successfully"
        except Exception as e:
            print(f"[MikroTik Error] delete_profile: {e}")
            return False, str(e)

    def get_active_sessions(self):
        try:
            with self.get_api() as api:
                active_resource = api.get_resource('/ip/hotspot/active')
                return active_resource.get()
        except Exception as e:
            print(f"[MikroTik Error] get_active_sessions: {e}")
            return None

    def kick_active_user(self, mt_id):
        try:
            with self.get_api() as api:
                active_resource = api.get_resource('/ip/hotspot/active')
                active_resource.remove(id=mt_id)
                return True, "User kicked successfully"
        except Exception as e:
            print(f"[MikroTik Error] kick_active_user: {e}")
            return False, str(e)

    def get_anti_lag_status(self):
        try:
            with self.get_api() as api:
                qt = api.get_resource('/queue/tree')
                for t in qt.get():
                    if t.get('name') == 'PIONIAR_ANTI_LAG_TOTAL':
                        return True
                return False
        except Exception as e:
            print(f"[MikroTik Error] get_anti_lag_status: {e}")
            return False

    def disable_anti_lag(self):
        try:
            with self.get_api() as api:
                qt = api.get_resource('/queue/tree')
                for t in qt.get():
                    name = t.get('name', '')
                    if 'PIONIAR_ANTI_LAG' in name or name in ['1_PIONIAR_ICMP', '2_PIONIAR_GAME', '8_PIONIAR_OTHER']:
                        try:
                            qt.remove(id=t['id'])
                        except: pass
                
                mangle = api.get_resource('/ip/firewall/mangle')
                for m in mangle.get():
                    if m.get('comment') == 'PIONIAR_ANTI_LAG':
                        mangle.remove(id=m['id'])
                return True, "Mode Anti-Lag Gaming berhasil dimatikan."
        except Exception as e:
            print(f"[MikroTik Error] disable_anti_lag: {e}")
            return False, str(e)

    def enable_anti_lag(self):
        self.disable_anti_lag() # Clean first
        try:
            with self.get_api() as api:
                mangle = api.get_resource('/ip/firewall/mangle')
                
                # 1. ICMP Mark (Ping)
                try: mangle.add(**{'chain': 'prerouting', 'protocol': 'icmp', 'action': 'mark-connection', 'new-connection-mark': 'conn_icmp', 'passthrough': 'yes', 'comment': 'PIONIAR_ANTI_LAG'})
                except: pass
                try: mangle.add(**{'chain': 'prerouting', 'connection-mark': 'conn_icmp', 'action': 'mark-packet', 'new-packet-mark': 'pkt_icmp', 'passthrough': 'no', 'comment': 'PIONIAR_ANTI_LAG'})
                except: pass
                
                # 2. Games UDP Ports
                try: mangle.add(**{'chain': 'prerouting', 'protocol': 'udp', 'dst-port': '5000-15000,30000-40000', 'action': 'mark-connection', 'new-connection-mark': 'conn_game', 'passthrough': 'yes', 'comment': 'PIONIAR_ANTI_LAG'})
                except: pass
                try: mangle.add(**{'chain': 'prerouting', 'connection-mark': 'conn_game', 'action': 'mark-packet', 'new-packet-mark': 'pkt_game', 'passthrough': 'no', 'comment': 'PIONIAR_ANTI_LAG'})
                except: pass
                
                # 3. Everything Else (Browsing / Download)
                try: mangle.add(**{'chain': 'prerouting', 'action': 'mark-connection', 'new-connection-mark': 'conn_other', 'passthrough': 'yes', 'comment': 'PIONIAR_ANTI_LAG'})
                except: pass
                try: mangle.add(**{'chain': 'prerouting', 'connection-mark': 'conn_other', 'action': 'mark-packet', 'new-packet-mark': 'pkt_other', 'passthrough': 'no', 'comment': 'PIONIAR_ANTI_LAG'})
                except: pass
                
                # Queue Tree
                qt = api.get_resource('/queue/tree')
                try: qt.add(**{'name': 'PIONIAR_ANTI_LAG_TOTAL', 'parent': 'global', 'max-limit': '100M'})
                except: pass
                try: qt.add(**{'name': '1_PIONIAR_ICMP', 'parent': 'PIONIAR_ANTI_LAG_TOTAL', 'packet-mark': 'pkt_icmp', 'priority': '1', 'limit-at': '1M', 'max-limit': '5M'})
                except: pass
                try: qt.add(**{'name': '2_PIONIAR_GAME', 'parent': 'PIONIAR_ANTI_LAG_TOTAL', 'packet-mark': 'pkt_game', 'priority': '2', 'limit-at': '5M', 'max-limit': '20M'})
                except: pass
                try: qt.add(**{'name': '8_PIONIAR_OTHER', 'parent': 'PIONIAR_ANTI_LAG_TOTAL', 'packet-mark': 'pkt_other', 'priority': '8', 'limit-at': '10M', 'max-limit': '80M'})
                except: pass
                
                return True, "Mode Anti-Lag Gaming super gahar berhasil diaktifkan!"
        except Exception as e:
            self.disable_anti_lag()
            print(f"[MikroTik Error] enable_anti_lag: {e}")
            return False, str(e)

mikrotik_service = MikrotikService()
