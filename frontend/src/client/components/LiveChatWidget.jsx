import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Maximize2, Edit, ChevronLeft, Image as ImageIcon } from 'lucide-react';

export default function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [username, setUsername] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadMessageId, setLastReadMessageId] = useState(null);
  const messagesEndRef = useRef(null);

  // Unread badge logic
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      if (messages.length > 0) {
        setLastReadMessageId(messages[messages.length - 1].id);
      }
    } else {
      const lastReadIndex = messages.findIndex(m => m.id === lastReadMessageId);
      const unreadMsgs = messages.slice(lastReadIndex + 1).filter(m => !m.isMe);
      setUnreadCount(unreadMsgs.length);
    }
  }, [messages, isOpen, lastReadMessageId]);

  useEffect(() => {
    let currentSession = localStorage.getItem('pioniar_chat_session');
    if (!currentSession) {
      currentSession = `Guest_${Math.floor(Math.random() * 9000) + 1000}`;
      localStorage.setItem('pioniar_chat_session', currentSession);
    }
    setUsername(currentSession);

    const fetchMessages = async () => {
      try {
        const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + `/api/chat/messages?session_id=${currentSession}`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages);
          } else {
            // Initial Greeting
            setMessages([{ id: 'init', sender: 'Admin Pioniar', text: 'Halo! Ada yang bisa kami bantu hari ini?', time: 'Baru saja', isMe: false }]);
          }
        }
      } catch (e) {
        console.error("LiveChat polling error:", e);
      }
    };

    fetchMessages();
    const intervalId = setInterval(fetchMessages, 2000); // Poll every 2 seconds
    return () => clearInterval(intervalId);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newText = inputValue.trim();
    setInputValue('');

    // Optimistic UI update
    const optimisticMessage = {
      id: Date.now(),
      sender: username,
      text: newText,
      time: 'Mengirim...',
      isMe: true
    };
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: username,
          sender: username,
          text: newText
        })
      });
    } catch (e) {
      console.error("Failed to send message", e);
    }
  };


  // Instagram DM Style Chat Room
  const renderChatRoom = () => (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', overflow: 'hidden' }}>
      <div className="mac-scrollbar" style={{ flex: 1, minHeight: 0, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.isMe ? 'flex-end' : 'flex-start' }}>
            <div style={{ 
              backgroundColor: msg.isMe ? '#3b82f6' : '#f1f5f9', 
              color: msg.isMe ? 'white' : '#0f172a',
              padding: '0.75rem 1rem', borderRadius: '1.25rem',
              maxWidth: '75%', fontSize: '0.95rem', lineHeight: 1.4
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} style={{ padding: '1rem', backgroundColor: 'white', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'absolute', left: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3b82f6', borderRadius: '50%', width: '32px', height: '32px' }}>
            <ImageIcon size={18} color="white" />
          </div>
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Kirim pesan..." 
            style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', borderRadius: '2rem', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#ffffff', fontSize: '0.95rem' }}
          />
          {inputValue.trim() && (
            <button type="submit" style={{ position: 'absolute', right: '16px', background: 'none', border: 'none', color: '#3b82f6', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' }}>Kirim</button>
          )}
        </div>
      </form>
    </div>
  );

  return (
    <>
      <div 
        className="animate-slide-up"
        style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999, display: isOpen ? 'none' : 'block' }}
      >
        <button 
          onClick={() => setIsOpen(true)}
          style={{
            padding: '0.75rem 1.25rem', borderRadius: '3rem', backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid rgba(0,0,0,0.05)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', position: 'relative' }}>
            {/* Outline Chat Icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            {unreadCount > 0 && (
              <div style={{ position: 'absolute', top: '-4px', left: '12px', backgroundColor: '#ef4444', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, border: '2px solid white' }}>{unreadCount}</div>
            )}
            <span style={{ fontWeight: 600, fontSize: '1.05rem', marginLeft: '0.5rem' }}>Pesan</span>
          </div>
        </button>
      </div>

      {/* IG DM Style Modal */}
      {isOpen && (
        <div 
          className="animate-fade-in"
          style={{
            position: 'fixed', bottom: '2rem', right: '2rem', width: '380px', height: '600px', maxHeight: 'calc(100vh - 8rem)', 
            zIndex: 10000, borderRadius: '1.25rem', display: 'flex', flexDirection: 'column',
            overflow: 'hidden', backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.05)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}
        >
          {/* Header */}
          <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid rgba(0,0,0,0.05)', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px', paddingBottom: '16px', paddingLeft: '24px', paddingRight: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ position: 'relative', width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <img src="https://ui-avatars.com/api/?name=Admin&background=ffffff&color=0f172a" alt="Admin" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                </div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px', lineHeight: 1 }}>
                  Admin Pioniar
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#3b82f6" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: '2px' }}><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.4-1.4 2.7 2.7 6.6-6.6 1.4 1.4-8 8z" fill="#3b82f6"/></svg>
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#0f172a', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center' }}><Maximize2 size={18} /></button>
                <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#0f172a', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center' }}><X size={20} /></button>
              </div>
            </div>
          </div>

          {/* Body */}
          {renderChatRoom()}
        </div>
      )}
    </>
  );
}
