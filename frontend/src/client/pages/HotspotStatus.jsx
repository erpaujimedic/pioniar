import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Clock } from 'lucide-react';

function SisaWaktuRenderer({ username }) {
  const [sisa, setSisa] = useState('Mengambil data...');

  useEffect(() => {
    let mounted = true;
    const fetchSisa = async () => {
      try {
        const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/wifi/vouchers');
        const vouchers = await res.json();
        const myVoucher = vouchers.find(v => v.code === username);
        if (myVoucher && mounted) {
          if (!myVoucher.limit_uptime) {
             setSisa('Unlimited (Tanpa Batas)');
          } else {
             setSisa(`Max. ${myVoucher.limit_uptime}`);
          }
        }
      } catch (e) {
        if (mounted) setSisa('Gagal cek batas waktu');
      }
    };
    fetchSisa();
    return () => { mounted = false; };
  }, [username]);

  return <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={16} /> {sisa}</span>;
}

export default function HotspotStatus() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedSession = localStorage.getItem('hotspot_session');
    if (savedSession) {
      setSession(JSON.parse(savedSession));
    }
    setLoading(false);
  }, []);

  if (loading) return null;

  if (!session) {
    return <Navigate to="/portal" replace />;
  }

  return (
    <div className="bg-hex-pattern" style={{ width: '100%', height: 'calc(100vh - 80px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', overflow: 'hidden', position: 'relative' }}>
       <div className="glass-panel animate-slide-up" style={{ width: '100%', maxWidth: '380px', padding: '2.5rem', borderRadius: '0.75rem', position: 'relative', zIndex: 1, backgroundColor: 'rgba(255, 255, 255, 0.98)', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '2rem' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              STATUS <span style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>KONEKSI</span>
            </span>
          </div>

          <div style={{ backgroundColor: '#f1f5f9', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
             <div style={{ width: '64px', height: '64px', backgroundColor: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
             </div>
             <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.2rem', fontWeight: 700 }}>{session.username}</h3>
             <p style={{ margin: 0, color: '#16a34a', fontSize: '0.9rem', fontWeight: 600 }}>Terkoneksi ke Internet</p>
             
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '1.5rem', textAlign: 'left' }}>
                <div style={{ backgroundColor: '#fff', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Uptime</div>
                  <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 700 }}>{session.uptime}</div>
                </div>
                <div style={{ backgroundColor: '#fff', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Download</div>
                  <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 700 }}>{session.bytes_out}</div>
                </div>
             </div>

             <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem', borderRadius: '0.375rem', marginTop: '0.5rem', textAlign: 'left' }}>
                <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase' }}>Batas Waktu Akun</div>
                <div style={{ fontSize: '1rem', color: '#b91c1c', fontWeight: 800 }}>
                  <SisaWaktuRenderer username={session.username} />
                </div>
             </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <a href="http://192.168.100.1/status" className="btn btn-secondary" style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', fontWeight: 600, borderRadius: '0.375rem', backgroundColor: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', textAlign: 'center', textDecoration: 'none', display: 'block', boxSizing: 'border-box' }}>
              🔄 Refresh Status
            </a>
            <a href="http://192.168.100.1/logout" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', fontWeight: 600, borderRadius: '0.375rem', backgroundColor: '#ef4444', border: 'none', textAlign: 'center', textDecoration: 'none', display: 'block', color: 'white', boxSizing: 'border-box' }}>
              Disconnect / Logout
            </a>
          </div>
       </div>
    </div>
  );
}
