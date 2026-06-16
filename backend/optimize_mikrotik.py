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
    
    rules = mangles.get()
    
    # 1. Delete change-ttl rules
    deleted_count = 0
    for r in rules:
        if r.get('action') == 'change-ttl':
            mangles.remove(id=r.get('id'))
            deleted_count += 1
    print(f"Deleted {deleted_count} change-ttl rules.")

    # 2. Add Output VIP rule to protect router traffic (VPN tunnel, DNS, Winbox replies)
    # Check if already exists
    rules = mangles.get()
    exists = any('comment' in r and '[AUTO] Router VIP' in r['comment'] for r in rules)
    
    if not exists:
        mangles.add(
            chain='output',
            action='mark-packet',
            **{'new-packet-mark': 'pkt_vip'},
            passthrough='no',
            comment='[AUTO] Router VIP'
        )
        print("Added [AUTO] Router VIP rule to output chain.")
    else:
        print("[AUTO] Router VIP rule already exists.")

    connection.disconnect()
except Exception as e:
    print("Error:", e)
