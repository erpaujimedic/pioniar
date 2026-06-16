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
    
    # 1. Print Interfaces
    print("--- Interfaces ---")
    ifs = api.get_resource('/interface').get()
    for i in ifs:
        print(f"{i.get('name')} - type: {i.get('type')}, running: {i.get('running')}")
        
    # 2. Print IP Addresses
    print("\n--- IP Addresses ---")
    ips = api.get_resource('/ip/address').get()
    for ip in ips:
        print(f"{ip.get('address')} on {ip.get('interface')}")

    # 3. Print Mangles
    print("\n--- Mangles ---")
    mangles = api.get_resource('/ip/firewall/mangle').get()
    for i, m in enumerate(mangles):
        print(f"Rule {i}: id={m.get('.id')} chain={m.get('chain')} action={m.get('action')} in-int={m.get('in-interface', '')} out-int={m.get('out-interface', '')} src={m.get('src-address', '')} dst={m.get('dst-address', '')} comment={m.get('comment', '')}")
        
    # Remove the bad rules I added
    for m in mangles:
        if 'comment' in m and '[AUTO] Bypass' in m['comment']:
            api.get_resource('/ip/firewall/mangle').remove(id=m.get('.id'))
            print(f"Removed rule {m.get('.id')}")

    connection.disconnect()
except Exception as e:
    print("Error:", e)
