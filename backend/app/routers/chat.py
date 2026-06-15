from flask import Blueprint, request, jsonify
from app.db import get_db_connection
import datetime

bp = Blueprint("chat", __name__)

@bp.route("/send", methods=["POST"])
def send_message():
    data = request.json
    session_id = data.get("session_id")
    sender = data.get("sender")
    text = data.get("text")
    
    if not all([session_id, sender, text]):
        return jsonify({"error": "Missing fields"}), 400
        
    conn = get_db_connection()
    # Insert as pending so discord bot picks it up
    conn.execute(
        "INSERT INTO messages (session_id, sender, text, is_admin, status) VALUES (?, ?, ?, ?, ?)",
        (session_id, sender, text, False, 'pending')
    )
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "message": "Message queued for Discord"}), 201

@bp.route("/messages", methods=["GET"])
def get_messages():
    session_id = request.args.get("session_id")
    if not session_id:
        return jsonify({"error": "Missing session_id"}), 400
        
    conn = get_db_connection()
    messages = conn.execute(
        "SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC",
        (session_id,)
    ).fetchall()
    conn.close()
    
    result = []
    for msg in messages:
        # Convert sqlite timestamp string to HH:MM format
        try:
            dt = datetime.datetime.strptime(msg["timestamp"], "%Y-%m-%d %H:%M:%S")
            time_str = dt.strftime("%H:%M")
        except:
            time_str = msg["timestamp"]
            
        result.append({
            "id": msg["id"],
            "sender": msg["sender"],
            "text": msg["text"],
            "isMe": not msg["is_admin"],
            "time": time_str
        })
        
    return jsonify({"messages": result}), 200
