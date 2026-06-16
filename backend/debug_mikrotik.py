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
    
    print("=== MANGLE RULES ===")
    mangles = api.get_resource('/ip/firewall/mangle').get()
    for i, m in enumerate(mangles):
        print(f"Rule {i}: chain={m.get('chain')} action={m.get('action')} "
              f"in={m.get('in-interface','')} out={m.get('out-interface','')} "
              f"conn-mark={m.get('connection-mark','')} new-conn-mark={m.get('new-connection-mark','')} "
              f"new-routing-mark={m.get('new-routing-mark','')} "
              f"disabled={m.get('disabled')} comment={m.get('comment','')}")
              
    print("\n=== QUEUE TREES ===")
    try:
        queues = api.get_resource('/queue/tree').get()
        for q in queues:
            print(f"Queue {q.get('name')}: parent={q.get('parent')} packet-mark={q.get('packet-mark','')} "
                  f"limit-at={q.get('limit-at','')} max-limit={q.get('max-limit','')} disabled={q.get('disabled')}")
    except Exception as e:
        print("Queue Tree error:", e)

    connection.disconnect()
except Exception as e:
    print("Error:", e)
