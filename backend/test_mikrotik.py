import os
from dotenv import load_dotenv
import routeros_api

load_dotenv(override=True)

local_host = os.getenv("MIKROTIK_LOCAL_IP", "192.168.100.1")
local_port = int(os.getenv("MIKROTIK_LOCAL_PORT", 8728))
public_host = os.getenv("MIKROTIK_PUBLIC_IP", "")
public_port = int(os.getenv("MIKROTIK_PUBLIC_PORT", 8728))
username = os.getenv("MIKROTIK_USER", "admin")
password = os.getenv("MIKROTIK_PASSWORD", "")

print(f"Connecting with user: {username}")
print(f"Public Host: {public_host}:{public_port}")
print(f"Local Host: {local_host}:{local_port}")

targets = []
if public_host:
    targets.append((public_host, public_port))
targets.append((local_host, local_port))

success = False
for host, port in targets:
    if not host:
        continue
    print(f"Trying to connect to {host}:{port}...")
    try:
        pool = routeros_api.RouterOsApiPool(
            host,
            username=username,
            password=password,
            port=port,
            plaintext_login=True
        )
        api = pool.get_api()
        ident = api.get_resource('/system/identity').get()
        print(f"SUCCESS connected to {host}:{port}. Identity: {ident}")
        
        # Test traffic
        traffic = api.get_resource('/interface')
        res = traffic.call('monitor-traffic', {'interface': 'ether3', 'once': ''})
        print(f"Traffic on ether3: {res}")
        
        pool.disconnect()
        success = True
        break
    except Exception as e:
        print(f"FAILED on {host}:{port} -> {e}")

if not success:
    print("ALL CONNECTION ATTEMPTS FAILED.")
