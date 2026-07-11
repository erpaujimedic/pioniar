import sys
import os
# Fix sys.path for Vercel so absolute imports like 'from app.core...' work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.db import create_db_and_tables
from app.scheduler import start_scheduler, stop_scheduler

from app.routers import wifi, livestock, snack, payment, chat

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    create_db_and_tables()
    start_scheduler()
    yield
    # Shutdown
    stop_scheduler()

app = FastAPI(
    title="PIONIAR API Ecosystem",
    description="Modernized API for Pioniar using FastAPI",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173", 
        "https://pioniar.com", 
        "https://www.pioniar.com",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.responses import RedirectResponse

@app.get("/")
def read_root():
    # Redirect root to frontend website so Tripay reviewers can see the actual site
    return RedirectResponse(url="https://pioniar.com")

from app.scheduler import run_scheduler_job

@app.get("/api/cron/sync")
def run_cron_sync():
    """Endpoint to be triggered by Vercel Cron every minute"""
    try:
        run_scheduler_job()
        return {"status": "success", "message": "Cron job executed"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# Register Routers
app.include_router(wifi.router, prefix="/api/wifi", tags=["Wifi"])
app.include_router(livestock.router, prefix="/api/livestock", tags=["Livestock"])
app.include_router(snack.router, prefix="/api/snack", tags=["Snack"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(payment.router, prefix="/api/payment", tags=["Payment"])
