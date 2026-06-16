import os
from dotenv import load_dotenv
import routeros_api

load_dotenv()

ip = os.getenv("MIKROTIK_LOCAL_IP", "192.168.100.1")
user = os.getenv("MIKROTIK_USER", "admin")
pwd = os.getenv("MIKROTIK_PASSWORD", "")
port = int(os.getenv("MIKROTIK_LOCAL_PORT", 8728))

print("Connecting to Mikrotik...")
connection = routeros_api.RouterOsApiPool(
    ip, username=user, password=pwd, port=port, plaintext_login=True
)
api = connection.get_api()

# 1. Update On-Login Scripts
print("Updating Hotspot Profiles for Absolute Validity...")
profiles = api.get_resource('/ip/hotspot/user/profile')

login_script = """:local u $user;
:local limitUp [/ip hotspot user get $u limit-uptime];
:if ([:len $limitUp] > 0) do={
    :local schedName ("exp_" . $u);
    :if ([:len [/system scheduler find name=$schedName]] = 0) do={
        /system scheduler add name=$schedName interval=$limitUp on-event="/ip hotspot active remove [find user=$u]\r\n/ip hotspot user remove $u\r\n/system scheduler remove $schedName"
    }
}
"""

logout_script = """:local u $user;
:do {
  :local lim [/ip hotspot user get $u limit-uptime];
  :local up [/ip hotspot user get $u uptime];
  :if ([:len $lim] > 0) do={
    :if ($lim = $up) do={
       /ip hotspot user remove $u;
    }
  }
} on-error={}
"""

for p in profiles.get():
    if p['name'] in ['voucher_harian', 'member_vip', 'default']:
        profiles.set(id=p['id'], **{
            'on-login': login_script,
            'on-logout': logout_script
        })
        print(f"Updated on-login and on-logout for {p['name']}")

connection.disconnect()
print("Done")
