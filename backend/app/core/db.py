import os
from sqlmodel import SQLModel, create_engine, Field, Session
from datetime import datetime
from typing import Optional

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'database.db')
sqlite_url = f"sqlite:///{DB_PATH}"

# We use connect_args to allow multiple threads to access SQLite
engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

class Message(SQLModel, table=True):
    __tablename__ = "messages" # type: ignore
    
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: str
    sender: str
    text: str
    is_admin: bool = Field(default=False)
    status: str = Field(default="sent")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class Transaction(SQLModel, table=True):
    __tablename__ = "transactions" # type: ignore
    
    merchant_ref: str = Field(primary_key=True)
    status: str = Field(default="UNPAID")
    username: str
    plan: str
    checkout_url: Optional[str] = None
    qr_url: Optional[str] = None
    amount: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
