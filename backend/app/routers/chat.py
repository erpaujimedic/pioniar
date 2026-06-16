from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.core.db import get_session, Message
from sqlmodel import Session, select
import datetime

router = APIRouter()

class SendMessageRequest(BaseModel):
    session_id: str
    sender: str
    text: str

@router.post("/send", status_code=201)
def send_message(data: SendMessageRequest, db: Session = Depends(get_session)):
    new_message = Message(
        session_id=data.session_id,
        sender=data.sender,
        text=data.text,
        is_admin=False,
        status="pending"
    )
    db.add(new_message)
    db.commit()
    return {"success": True, "message": "Message queued for Discord"}

@router.get("/messages")
def get_messages(session_id: str, db: Session = Depends(get_session)):
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session_id")
        
    messages = db.exec(select(Message).where(Message.session_id == session_id).order_by(Message.timestamp)).all()
    
    result = []
    for msg in messages:
        try:
            time_str = msg.timestamp.strftime("%H:%M")
        except:
            time_str = str(msg.timestamp)
            
        result.append({
            "id": msg.id,
            "sender": msg.sender,
            "text": msg.text,
            "isMe": not msg.is_admin,
            "time": time_str
        })
        
    return {"messages": result}
