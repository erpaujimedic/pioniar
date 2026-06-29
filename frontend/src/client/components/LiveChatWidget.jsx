import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Maximize2, Image as ImageIcon } from 'lucide-react';

/* ── brand palette ── */
const SLATE  = '#4a6891';
const SLATEL = '#607b9e';
const MINT   = '#5aab87';
const MINTL  = '#7bc4a0';

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
            setMessages([{ id: 'init', sender: 'Admin Pioniar', text: 'Halo! Ada yang bisa kami bantu hari ini?', time: 'Baru saja', isMe: false }]);
          }
        }
      } catch (e) {
        console.error("LiveChat polling error:", e);
      }
    };

    fetchMessages();
    const intervalId = setInterval(fetchMessages, 2000);
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

    const optimisticMessage = { id: Date.now(), sender: username, text: newText, time: 'Mengirim...', isMe: true };
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: username, sender: username, text: newText })
      });
    } catch (e) {
      console.error("Failed to send message", e);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-[9999] max-md:bottom-[85px] max-md:right-4">
          <button
            onClick={() => setIsOpen(true)}
            className="relative flex items-center gap-2.5 bg-white border shadow-[0_8px_32px_rgba(90,171,135,0.15)] rounded-full px-5 py-3 cursor-pointer transition-all duration-300 hover:shadow-[0_12px_40px_rgba(90,171,135,0.25)] hover:-translate-y-0.5 active:translate-y-0 group"
            style={{ borderColor: `${MINT}30`, color: SLATE }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:scale-110" style={{ color: MINT }}>
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
            <span className="font-bold text-sm">Pesan</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white shadow-sm animate-bounce"
                style={{ background: `linear-gradient(135deg, ${MINTL}, ${MINT})` }}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[10000] w-[360px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100dvh-6rem)] max-md:max-h-[calc(100dvh-100px)] flex flex-col rounded-2xl bg-white border shadow-[0_24px_80px_rgba(74,104,145,0.18)] overflow-hidden max-md:bottom-[85px] max-md:right-4"
          style={{ borderColor: `${SLATE}20` }}>
          
          {/* Header */}
          <div className="shrink-0 bg-white border-b px-5 pt-5 pb-4" style={{ borderColor: `${SLATE}10` }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Avatar with brand gradient ring */}
                <div className="relative w-9 h-9 rounded-full p-[2px]" style={{ background: `linear-gradient(135deg, ${MINTL}, ${SLATEL})` }}>
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                    <img
                      src={`https://ui-avatars.com/api/?name=Admin&background=f0f7f4&color=5aab87&bold=true`}
                      alt="Admin"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Online indicator */}
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ background: MINT }} />
                </div>
                <div>
                  <h3 className="m-0 text-sm font-bold flex items-center gap-1 leading-none" style={{ color: SLATE }}>
                    Admin Pioniar
                    <svg width="13" height="13" viewBox="0 0 24 24" className="inline ml-0.5" style={{ color: MINT }}>
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.4-1.4 2.7 2.7 6.6-6.6 1.4 1.4-8 8z" fill="currentColor"/>
                    </svg>
                  </h3>
                  <p className="m-0 text-[11px] font-semibold mt-0.5" style={{ color: MINTL }}>Online</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-transparent border-none cursor-pointer flex items-center justify-center transition-colors"
                  style={{ color: `${SLATE}80` }}
                  onMouseEnter={e => e.currentTarget.style.background = `${SLATE}10`}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Maximize2 size={16} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-transparent border-none cursor-pointer flex items-center justify-center transition-colors"
                  style={{ color: `${SLATE}80` }}
                  onMouseEnter={e => e.currentTarget.style.background = `${SLATE}10`}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-3" style={{ background: '#fcfdfd' }}>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                <div
                  className={`px-4 py-2.5 rounded-2xl max-w-[78%] text-sm leading-relaxed break-words ${
                    msg.isMe
                      ? 'text-white rounded-br-md shadow-md'
                      : 'bg-white border rounded-bl-md shadow-sm'
                  }`}
                  style={
                    msg.isMe 
                      ? { background: `linear-gradient(135deg, ${MINT}, ${SLATEL})`, boxShadow: `0 4px 12px ${MINT}30` } 
                      : { borderColor: `${SLATE}15`, color: SLATE }
                  }
                >
                  {msg.text}
                </div>
                {msg.time && (
                  <span className="text-[9px] mt-1 px-1 font-medium" style={{ color: `${SLATE}70` }}>{msg.time}</span>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSend} className="shrink-0 bg-white border-t px-4 py-3 flex items-center gap-2" style={{ borderColor: `${SLATE}10` }}>
            <div className="relative flex-1 flex items-center">
              <button
                type="button"
                className="absolute left-2 w-8 h-8 rounded-full border-none cursor-pointer flex items-center justify-center shrink-0 transition-transform hover:scale-105"
                style={{ background: `${MINT}15` }}
              >
                <ImageIcon size={15} style={{ color: MINT }} />
              </button>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Kirim pesan..."
                className="w-full pl-12 pr-14 py-2.5 rounded-full border outline-none transition-all text-sm"
                style={{ 
                  background: '#fcfdfd', 
                  borderColor: `${SLATE}20`, 
                  color: SLATE 
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = MINTL;
                  e.target.style.boxShadow = `0 0 0 2px ${MINT}20`;
                  e.target.style.background = '#ffffff';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = `${SLATE}20`;
                  e.target.style.boxShadow = 'none';
                  e.target.style.background = '#fcfdfd';
                }}
              />
              {inputValue.trim() && (
                <button
                  type="submit"
                  className="absolute right-3 bg-transparent border-none font-bold text-sm cursor-pointer transition-colors"
                  style={{ color: MINT }}
                  onMouseEnter={e => e.currentTarget.style.color = MINTL}
                  onMouseLeave={e => e.currentTarget.style.color = MINT}
                >
                  Kirim
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </>
  );
}
