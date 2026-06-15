import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export default function HotspotLogin() {
  const [searchParams] = useSearchParams();
  const [loginMode, setLoginMode] = useState('voucher'); // 'voucher' atau 'member'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      setErrorMsg(error);
    }
  }, [searchParams]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!username) return;
    
    const passValue = loginMode === 'voucher' ? username : password;
    
    // Redirect to submit.html (hosted on Mikrotik) to perform native POST
    const dstUrl = encodeURIComponent('https://pioniar.web.app/?status=success');
    
    // Ambil alamat asli Hotspot dari URL, kalau gak ada baru pakai 192.168.100.1
    let loginUrl = searchParams.get('loginUrl');
    let target = loginUrl ? loginUrl.replace('/login', '/submit.html') : 'http://192.168.100.1/submit.html';
    
    // Pastikan kalau pakai HTTPS, ubah ke HTTP (karena hotspot lokal biasanya HTTP)
    if (target.startsWith('https://')) {
        target = target.replace('https://', 'http://');
    }
    
    window.location.href = `${target}?username=${username}&password=${passValue}&dst=${dstUrl}`;
  };

  return (
    <div className="bg-hex-pattern" style={{ 
      width: '100%', 
      height: 'calc(100vh - 80px)', 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      overflow: 'hidden',
      position: 'relative'
    }}>
      
      {/* Watermark Background Logo */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', maxWidth: '800px', height: '100%', zIndex: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
         <img src="/logo-icon.png" alt="" style={{ height: '400px', width: 'auto', opacity: 0.03, transform: 'rotate(-15deg)', filter: 'grayscale(100%)' }} />
      </div>

      <div className="glass-panel animate-slide-up" style={{ 
        width: '100%', 
        maxWidth: '380px', 
        padding: '2.5rem', 
        borderRadius: '0.75rem', 
        position: 'relative', 
        zIndex: 1, 
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)'
      }}>
        
        {/* Centered Wide Logo (Icon + Text) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '2rem' }}>
          <img src="/logo-icon.png" alt="Pioniar" style={{ height: '36px', width: 'auto', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))' }} onError={(e) => e.target.style.display = 'none'} />
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            PIONIAR <span style={{ background: 'linear-gradient(135deg, #2563eb, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>NETWORK</span>
          </span>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div style={{ backgroundColor: '#fee2e2', borderLeft: '4px solid #ef4444', padding: '0.75rem 1rem', marginBottom: '1.5rem', borderRadius: '0.375rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <AlertCircle color="#ef4444" size={18} style={{ marginTop: '0.1rem' }} />
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#b91c1c', fontWeight: 500 }}>{errorMsg}</p>
          </div>
        )}

        {/* Toggle Mode */}
        <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '0.5rem', padding: '0.3rem', marginBottom: '1.5rem' }}>
          <button 
            type="button"
            onClick={() => setLoginMode('voucher')}
            style={{ 
              flex: 1, padding: '0.6rem', borderRadius: '0.375rem', fontSize: '0.85rem', fontWeight: 600, border: 'none', 
              backgroundColor: loginMode === 'voucher' ? '#ffffff' : 'transparent', 
              color: loginMode === 'voucher' ? '#2563eb' : '#64748b', 
              boxShadow: loginMode === 'voucher' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', 
              cursor: 'pointer', transition: 'all 0.2s' 
            }}
          >
            Voucher
          </button>
          <button 
            type="button"
            onClick={() => setLoginMode('member')}
            style={{ 
              flex: 1, padding: '0.6rem', borderRadius: '0.375rem', fontSize: '0.85rem', fontWeight: 600, border: 'none', 
              backgroundColor: loginMode === 'member' ? '#ffffff' : 'transparent', 
              color: loginMode === 'member' ? '#2563eb' : '#64748b', 
              boxShadow: loginMode === 'member' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', 
              cursor: 'pointer', transition: 'all 0.2s' 
            }}
          >
            Member / Bulanan
          </button>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {loginMode === 'voucher' ? (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.4rem', color: '#475569' }}>Kode Voucher <span style={{color: '#ef4444'}}>*</span></label>
              <input 
                type="text" 
                className="input-base" 
                placeholder="Contoh: PION-1234" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{ padding: '0.7rem 0.8rem', fontSize: '0.95rem', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '0.375rem', width: '100%', textAlign: 'center', letterSpacing: '1px', fontWeight: 600 }} 
              />
            </div>
          ) : (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.4rem', color: '#475569' }}>Username <span style={{color: '#ef4444'}}>*</span></label>
                <input 
                  type="text" 
                  className="input-base" 
                  placeholder="Masukkan username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  style={{ padding: '0.6rem 0.8rem', fontSize: '0.9rem', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '0.375rem', width: '100%' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.4rem', color: '#475569' }}>Password <span style={{color: '#ef4444'}}>*</span></label>
                <input 
                  type="password" 
                  className="input-base" 
                  placeholder="Masukkan password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ padding: '0.6rem 0.8rem', fontSize: '0.9rem', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '0.375rem', width: '100%' }} 
                />
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', fontWeight: 600, marginTop: '0.5rem', borderRadius: '0.375rem', backgroundColor: '#1e40af', border: 'none' }}>
            Mulai Internetan
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link to="/portal/buy" style={{ fontSize: '0.8rem', color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>
            Belum punya voucher? Beli Online
          </Link>
        </div>
      </div>
    </div>
  );
}
