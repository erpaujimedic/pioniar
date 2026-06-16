import os
import routeros_api

host = "id-36.tunnel.web.id"
port = 6663
username = "admin"
password = "Liveforever27*"

print(f"Connecting to {host}:{port}...")

try:
    pool = routeros_api.RouterOsApiPool(
        host,
        username=username,
        password=password,
        port=port,
        plaintext_login=True
    )
    api = pool.get_api()
    print("Connected!")
    
    identity = api.get_resource('/system/identity')
    print("Identity:", identity.get())
    
    pool.disconnect()
except Exception as e:
    print(f"Error: {e}")
