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
    mangles = api.get_resource('/ip/firewall/mangle')
    
    # Check if we already added it
    existing = mangles.get()
    for e in existing:
        if 'comment' in e and '[AUTO] Router VIP' in e['comment']:
            mangles.remove(id=e['id'])
            
    mangles.add(
        chain='output',
        action='mark-packet',
        **{'new-packet-mark': 'pkt_vip'},
        passthrough='no',
        comment='[AUTO] Router VIP'
    )
    
    print("Successfully added output VIP rule!")
    connection.disconnect()
except Exception as e:
    print("Error:", e)
