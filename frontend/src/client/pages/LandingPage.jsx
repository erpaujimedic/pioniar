import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Wifi, Hexagon, Coffee, Activity, Users, Zap, Clock, UserCheck } from 'lucide-react';

export default function LandingPage() {
  const [monitorData, setMonitorData] = useState({
    active_users: 0,
    speed_mbps: 0.0,
    uptime: "00:00:00",
    latest_login: "Belum ada"
  });

  useEffect(() => {
    const fetchMonitorData = async () => {
      try {
        const response = await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/wifi/monitor');
        const result = await response.json();
        if (result.status === 'Success' && result.data) {
          setMonitorData(result.data);
        }
      } catch (error) {
        console.error("Gagal nyedot data monitor MikroTik:", error);
      }
    };

    // Panggil sekali pas halaman baru dibuka
    fetchMonitorData();
    // Set timer otomatis (polling) tiap 5 detik
    const interval = setInterval(fetchMonitorData, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="animate-fade-in bg-hex-pattern landing-page-container" style={{ 
      width: '100%', 
      minHeight: 'calc(100vh - 65px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '4rem 2rem 2rem 2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Top Header */}
      <div className="animate-slide-up landing-title" style={{ textAlign: 'center', marginTop: '1rem' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', color: '#0f172a', lineHeight: 1.1, margin: 0, letterSpacing: '-0.02em', fontWeight: 800 }}>
          Satu Ekosistem untuk <br/>
          <span style={{ 
            background: 'linear-gradient(135deg, #2563eb, #60a5fa)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent' 
          }}>
            Segala Kemungkinan
          </span>
        </h1>
      </div>

      {/* Center Interactive Hexagons */}
      <div className="hex-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4rem', flexWrap: 'wrap', margin: '3rem 0' }}>
        
        {/* Farm (Subtle) */}
        <div className="animate-slide-up delay-200" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', opacity: 0.6, transition: 'opacity 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}>
          <div className="hex-shape elegant-glass" style={{ width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <Hexagon size={32} color="#64748b" />
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>FARM (SOON)</span>
        </div>

        {/* Main Wifi Portal (Glowing) */}
        <Link to="/portal" className="animate-slide-up delay-100" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', position: 'relative' }}>
          {/* Outer Glow Effect */}
          <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', width: '160px', height: '160px', background: '#3b82f6', filter: 'blur(40px)', opacity: 0.5, zIndex: 0, animation: 'pulse 3s infinite' }}></div>
          
          <div style={{ position: 'relative', zIndex: 1, width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            {/* Outer Hexagon (Border Gradient) */}
            <div className="hex-shape" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #93c5fd, #1d4ed8)', padding: '4px' }}>
              {/* Inner Hexagon (Solid Gradient + Shadow) */}
              <div className="hex-shape" style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 30px rgba(255,255,255,0.3)' }}>
                <Lock size={64} color="#ffffff" strokeWidth={1.5} />
              </div>
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Buka Portal WiFi</div>
            <div style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 700, marginTop: '0.4rem', letterSpacing: '0.05em' }}>PIONIAR NETWORK</div>
          </div>
        </Link>

        {/* Snack (Subtle) */}
        <div className="animate-slide-up delay-300" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', opacity: 0.6, transition: 'opacity 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}>
          <div className="hex-shape elegant-glass" style={{ width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <Coffee size={32} color="#64748b" />
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>SNACK (SOON)</span>
        </div>

      </div>

      {/* Bottom Live Monitor Strip */}
      <div className="elegant-glass animate-slide-up delay-400 monitor-strip" style={{ width: '100%', maxWidth: '1000px', borderRadius: '1rem', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', marginTop: 'auto' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#10b981', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.05em' }}>
          <Activity size={20} className="animate-pulse" /> LIVE MONITOR
        </div>

        <div className="monitor-stats" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', flex: 1, justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
             <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '50%' }}><Users size={18} color="#64748b" /></div>
             <div>
               <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{monitorData.active_users}</div>
               <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em', marginTop: '0.2rem' }}>USER AKTIF</div>
             </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
             <div style={{ background: '#eff6ff', padding: '0.5rem', borderRadius: '50%' }}><Zap size={18} color="#2563eb" /></div>
             <div>
               <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb', lineHeight: 1 }}>{monitorData.speed_mbps} <span style={{fontSize:'0.8rem'}}>Mbps</span></div>
               <div style={{ fontSize: '0.65rem', color: '#2563eb', fontWeight: 700, letterSpacing: '0.05em', marginTop: '0.2rem' }}>AVG SPEED</div>
             </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
             <div style={{ background: '#ecfdf5', padding: '0.5rem', borderRadius: '50%' }}><Clock size={18} color="#10b981" /></div>
             <div>
               <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981', lineHeight: 1 }}>{monitorData.uptime}</div>
               <div style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700, letterSpacing: '0.05em', marginTop: '0.2rem' }}>UPTIME</div>
             </div>
          </div>
        </div>

        {/* Minimal Recent Activity log */}
        <div className="recent-activity" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '1px solid rgba(0,0,0,0.1)', paddingLeft: '1.5rem' }}>
           <div style={{ background: '#dcfce7', padding: '0.5rem', borderRadius: '50%' }}><UserCheck size={16} color="#166534" /></div>
           <div>
             <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{monitorData.latest_login}</div>
             <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500, marginTop: '0.2rem' }}>Baru saja terhubung</div>
           </div>
        </div>

      </div>

    </div>
  );
}
