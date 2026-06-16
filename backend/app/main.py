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
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"], # Added * temporarily for local testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to PIONIAR API Ecosystem"}

# Register Routers
app.include_router(wifi.router, prefix="/api/wifi", tags=["Wifi"])
app.include_router(livestock.router, prefix="/api/livestock", tags=["Livestock"])
app.include_router(snack.router, prefix="/api/snack", tags=["Snack"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(payment.router, prefix="/api/payment", tags=["Payment"])
