import routeros_api

try:
    print("Mencoba koneksi ke 192.168.100.1...")
    connection = routeros_api.RouterOsApiPool(
        "192.168.100.1",
        username="admin",
        password="Liveforever27*",
        plaintext_login=True
    )
    api = connection.get_api()
    list_identity = api.get_resource('/system/identity')
    print("BERHASIL! Identity:", list_identity.get()[0]['name'])
    connection.disconnect()
except Exception as e:
    print(f"GAGAL: {e}")
