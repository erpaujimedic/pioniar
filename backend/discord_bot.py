import discord
from discord.ext import tasks
import sqlite3
import os

from dotenv import load_dotenv

load_dotenv()
TOKEN = os.getenv("DISCORD_TOKEN")
GUILD_ID = 1515984781148426290
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app', '..', 'chat.db')

intents = discord.Intents.default()
intents.message_content = True
client = discord.Client(intents=intents)

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@client.event
async def on_ready():
    print(f'Discord Bot Logged in as {client.user}')
    
    # Initialize DB just in case
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            sender TEXT NOT NULL,
            text TEXT NOT NULL,
            is_admin BOOLEAN NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'sent',
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

    check_pending_messages.start()

async def get_live_chat_channel():
    guild = client.get_guild(GUILD_ID)
    if not guild:
        print("Guild not found. Is bot invited to 1515984781148426290?")
        return None
        
    for channel in guild.text_channels:
        if channel.name == "live-chat":
            return channel
            
    # Create it if it doesn't exist
    try:
        channel = await guild.create_text_channel("live-chat")
        return channel
    except Exception as e:
        print(f"Error creating channel: {e}")
        return None

async def get_or_create_thread(channel, session_id):
    # Check active threads
    for thread in channel.threads:
        if thread.name == session_id:
            return thread
            
    # Create new thread
    try:
        thread = await channel.create_thread(name=session_id, type=discord.ChannelType.public_thread)
        return thread
    except Exception as e:
        print(f"Error creating thread: {e}")
        return None

@tasks.loop(seconds=2)
async def check_pending_messages():
    try:
        conn = get_db_connection()
        pending = conn.execute("SELECT * FROM messages WHERE status = 'pending' AND is_admin = 0").fetchall()
        
        if pending:
            channel = await get_live_chat_channel()
            if channel:
                for row in pending:
                    msg_id = row['id']
                    session_id = row['session_id']
                    text = row['text']
                    
                    thread = await get_or_create_thread(channel, session_id)
                    if thread:
                        await thread.send(text)
                        conn.execute("UPDATE messages SET status = 'sent' WHERE id = ?", (msg_id,))
                        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error checking pending messages: {e}")

@client.event
async def on_message(message):
    if message.author == client.user:
        return
        
    # If message is in a thread
    if isinstance(message.channel, discord.Thread):
        # Check if parent channel is live-chat
        if message.channel.parent and message.channel.parent.name == "live-chat":
            session_id = message.channel.name
            text = message.content
            sender = message.author.display_name
            
            # Save to DB so Web client can pull it
            conn = get_db_connection()
            conn.execute(
                "INSERT INTO messages (session_id, sender, text, is_admin, status) VALUES (?, ?, ?, ?, ?)",
                (session_id, sender, text, True, 'sent')
            )
            conn.commit()
            conn.close()

if __name__ == "__main__":
    client.run(TOKEN)
