import os
import routeros_api
from dotenv import load_dotenv

load_dotenv()

host = os.getenv('MIKROTIK_LOCAL_IP')
port = int(os.getenv('MIKROTIK_LOCAL_PORT'))
user = os.getenv('MIKROTIK_USER')
password = os.getenv('MIKROTIK_PASSWORD')

try:
    connection = routeros_api.RouterOsApiPool(host, username=user, password=password, port=port, plaintext_login=True)
    api = connection.get_api()
    scripts = api.get_resource('/system/script')
    
    scripts_refreshed = scripts.get()
    for s in scripts_refreshed:
        if s.get('name') == 'auto_fix_vpn':
            # Use string representation
            api.get_binary_resource('/').call('system/script/run', {'number': s.get('id')})
            print("Script executed!")
            break
            
    connection.disconnect()
except Exception as e:
    print("Error:", e)
