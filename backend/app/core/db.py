import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize Supabase client
url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_KEY", "")

# We only create the client if the URL and KEY are provided
if url and key:
    supabase: Client = create_client(url, key)
else:
    # Fallback/Dummy for local development without credentials
    supabase = None
    print("WARNING: SUPABASE_URL or SUPABASE_KEY is missing. Supabase client is not initialized.")
