import os
from dotenv import load_dotenv
import routeros_api

load_dotenv()

ip = os.getenv("MIKROTIK_LOCAL_IP", "192.168.100.1")
user = os.getenv("MIKROTIK_USER", "admin")
pwd = os.getenv("MIKROTIK_PASSWORD", "")
port = int(os.getenv("MIKROTIK_LOCAL_PORT", 8728))

print(f"Menyambung ke {ip}...")

try:
    pool = routeros_api.RouterOsApiPool(ip, username=user, password=pwd, port=port, plaintext_login=True)
    api = pool.get_api()
    
    print("\n=== IP ADDRESSES ===")
    ips = api.get_resource('/ip/address').get()
    for i in ips:
        print(f"Address: {i.get('address')}, Interface: {i.get('interface')}")
        
    print("\n=== IP ROUTE ===")
    routes = api.get_resource('/ip/route').get()
    for r in routes:
        if r.get('dst-address') == '0.0.0.0/0':
            print(f"Default Route: {r.get('gateway')}, Active: {r.get('active')}")


        
    pool.disconnect()
except Exception as e:
    print(f"Error: {e}")
