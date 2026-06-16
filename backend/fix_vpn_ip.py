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
    
    # 1. Clean up old [AUTO] rules
    try:
        all_rules = mangles.get()
        for r in all_rules:
            if 'comment' in r and '[AUTO] Bypass' in r['comment']:
                mangles.remove(id=r['id'])
    except Exception as e:
        print("Error cleaning up old rules:", e)

    print("Cleaned old rules. Adding new rules via API command directly...")
    
    # We use 157.66.54.158 (id-36.tunnel.web.id)
    commands = [
        {'chain': 'prerouting', 'dst-address': '157.66.54.158', 'action': 'accept', 'comment': '[AUTO] Bypass id-36 VPN Server Prerouting', 'place-before': '0'},
        {'chain': 'output', 'dst-address': '157.66.54.158', 'action': 'accept', 'comment': '[AUTO] Bypass id-36 VPN Server Output', 'place-before': '0'},
        {'chain': 'prerouting', 'src-address': '172.41.0.0/16', 'action': 'accept', 'comment': '[AUTO] Bypass VPN Client Source', 'place-before': '0'},
        {'chain': 'prerouting', 'dst-address': '172.41.0.0/16', 'action': 'accept', 'comment': '[AUTO] Bypass VPN Client Dest', 'place-before': '0'},
        {'chain': 'output', 'dst-address': '172.41.0.0/16', 'action': 'accept', 'comment': '[AUTO] Bypass VPN Client Output', 'place-before': '0'}
    ]
    
    for c in reversed(commands):
        try:
            api.get_binary_resource('/').call('ip/firewall/mangle/add', c)
            print("Added:", c['comment'])
        except Exception as ex:
            print("Failed to add", c['comment'], "Exception:", ex)

    print("Done applying ID-36 Bypass Rules!")
    connection.disconnect()
except Exception as e:
    print("Error:", e)
