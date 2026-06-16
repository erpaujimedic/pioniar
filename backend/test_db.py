import os
import sys

# add current dir to path to import app
sys.path.insert(0, os.path.abspath('.'))

from app.services.supabase_service import supabase_service

print("Testing Supabase...")
try:
    if not supabase_service.supabase:
        print("Supabase client is not initialized!")
    else:
        # test fetch
        profiles = supabase_service.get_profiles()
        print("Profiles:", profiles)
        print("Supabase is working!")
except Exception as e:
    print("Supabase error:", str(e))

from app.db import get_db_connection
print("\nTesting SQLite...")
try:
    conn = get_db_connection()
    res = conn.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()
    print("Tables:", [r['name'] for r in res])
    conn.close()
    print("SQLite is working!")
except Exception as e:
    print("SQLite error:", str(e))

from app.services.mikrotik_service import mikrotik_service
print("\nTesting Mikrotik...")
try:
    if not mikrotik_service.connect():
        print("Mikrotik connection failed!")
    else:
        print("Mikrotik is working!")
except Exception as e:
    print("Mikrotik error:", str(e))
