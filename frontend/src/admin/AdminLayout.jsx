import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Wifi, Hexagon, Coffee, LayoutDashboard, Lock, LogOut, X, ChevronDown } from 'lucide-react';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [openDropdowns, setOpenDropdowns] = useState({'Wifi': false});

  const toggleDropdown = (label) => {
    setOpenDropdowns(prev => ({...prev, [label]: !prev[label]}));
  };

  useEffect(() => {
    // Cek apakah admin sudah pernah login sebelumnya di browser ini
    const authStatus = localStorage.getItem('pioniar_admin_auth');
    if (authStatus === 'eepridwan' || authStatus === 'erpauji.medic@gmail.com') {
      setIsAuthenticated(true);
    }
    
    // Apply admin dark theme globally
    document.body.classList.add('admin-mode');
    return () => {
      document.body.classList.remove('admin-mode');
    };
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    // Super Admin Credentials
    if ((username === 'eepridwan' || username === 'erpauji.medic@gmail.com') && password === 'Liveforever27*') {
      setIsAuthenticated(true);
      localStorage.setItem('pioniar_admin_auth', username);
      setError('');
    } else {
      setError('Akses Ditolak! Kredensial tidak dikenali.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('pioniar_admin_auth');
    setUsername('');
    setPassword('');
    navigate('/');
  };

  const navItems = [
    { path: '/admin', label: 'Overview', icon: <LayoutDashboard size={16} /> },
    { 
      label: 'Wifi', icon: <Wifi size={16} />,
      subItems: [
        { path: '/admin/wifi', label: 'Manajemen Voucher' },
        { path: '/admin/wifi/packages', label: 'Setup Paket' },
        { path: '/admin/wifi/active', label: 'Sesi Aktif' },
        { path: '/admin/wifi/reporting', label: 'Laporan Pendapatan' }
      ]
    },
    { path: '/admin/livestock', label: 'Ternak', icon: <Lock size={16} />, locked: true },
    { path: '/admin/snack', label: 'Snack', icon: <Lock size={16} />, locked: true },
  ];

  // ==========================================
  // RENDER ADMIN LAYOUT (SELALU TAMPIL)
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="bg-hex-pattern" style={{ 
        width: '100%', 
        height: '100vh', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#f8fafc'
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
              PIONIAR <span style={{ background: 'linear-gradient(135deg, #ef4444, #f87171)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ADMIN</span>
            </span>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                type="text" 
                placeholder="Admin Email / Username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                style={{ 
                  width: '100%', padding: '1rem 1.25rem', 
                  backgroundColor: '#f8fafc', color: '#0f172a', 
                  border: error ? '1px solid #ef4444' : '1px solid #e2e8f0', 
                  borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => { e.target.style.border = '1px solid #ef4444'; e.target.style.backgroundColor = '#ffffff'; }}
                onBlur={(e) => { e.target.style.border = error ? '1px solid #ef4444' : '1px solid #e2e8f0'; e.target.style.backgroundColor = '#f8fafc'; }}
              />
              
              <input 
                type="password" 
                placeholder="Secret Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ 
                  width: '100%', padding: '1rem 1.25rem', 
                  backgroundColor: '#f8fafc', color: '#0f172a', 
                  border: error ? '1px solid #ef4444' : '1px solid #e2e8f0', 
                  borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none',
                  letterSpacing: password ? '4px' : 'normal',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => { e.target.style.border = '1px solid #ef4444'; e.target.style.backgroundColor = '#ffffff'; }}
                onBlur={(e) => { e.target.style.border = error ? '1px solid #ef4444' : '1px solid #e2e8f0'; e.target.style.backgroundColor = '#f8fafc'; }}
              />
              
              {error && (
                <div className="animate-slide-up" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.2rem', fontWeight: 500, textAlign: 'center' }}>
                  {error}
                </div>
              )}
            </div>
            
            <button type="submit" style={{ 
              marginTop: '0.5rem', width: '100%', padding: '1rem', borderRadius: '0.5rem', 
              fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
              backgroundColor: '#ef4444', color: 'white', border: 'none',
              transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
            >
              Secure Login
            </button>
            <button 
              type="button"
              onClick={() => navigate('/')}
              style={{ 
                width: '100%', padding: '0.75rem', borderRadius: '0.5rem', 
                fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                backgroundColor: 'transparent', color: '#64748b', border: 'none',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
            >
              Kembali ke Portal Publik
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--pioniar-bg)', position: 'relative' }}>

      {/* 1. SIDEBAR EAM STYLE CLONE */}
      <aside style={{ 
        width: isSidebarOpen ? '200px' : '64px', 
        background: 'linear-gradient(to bottom, #ffffff, rgba(241, 245, 249, 0.8))', 
        borderRight: '1px solid var(--pioniar-border)', 
        display: 'flex', 
        flexDirection: 'column', 
        position: 'relative',
        transition: 'width 0.3s ease-in-out'
      }}>
        <div 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          style={{ 
          height: '56px', 
          minHeight: '56px', 
          display: 'flex', 
          alignItems: 'center', 
          padding: '0 1rem', 
          borderBottom: '1px solid rgba(241, 245, 249, 0.5)', 
          gap: '0.5rem',
          cursor: 'pointer'
        }}>
          <div style={{ position: 'relative', width: '32px', height: '32px', minWidth: '32px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Hexagon acting as Logo */}
            <Hexagon size={24} fill="var(--pioniar-primary)" color="white" />
          </div>
          {isSidebarOpen && (
            <span style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--pioniar-text)', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
              PIONIAR
            </span>
          )}
        </div>
        
        <nav style={{ flex: 1, padding: '1rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: isSidebarOpen ? 'auto' : 'visible', overflowX: isSidebarOpen ? 'hidden' : 'visible' }}>
          <div style={{ padding: '0.5rem 0.75rem 0.25rem 0.75rem', display: 'flex', alignItems: 'center', height: '28px' }}>
            {isSidebarOpen ? (
              <span style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', width: '100%' }}>
                CORE SYSTEM
              </span>
            ) : (
              <div style={{ width: '24px', height: '2px', backgroundColor: 'rgba(226, 232, 240, 0.6)', borderRadius: '9999px', margin: '0 auto' }}></div>
            )}
          </div>
          {navItems.map((item) => {
            if (item.subItems) {
              const isActive = item.subItems.some(sub => location.pathname === sub.path || location.pathname.startsWith(sub.path + '/'));
              const isOpen = openDropdowns[item.label];
              
              return (
                <div 
                  key={item.label} 
                  style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', position: 'relative' }}
                >
                  <div 
                    onClick={() => toggleDropdown(item.label)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: isSidebarOpen ? 'space-between' : 'center', 
                      padding: '0.6rem 0.875rem', borderRadius: '0.5rem', cursor: 'pointer',
                      color: isActive ? 'var(--pioniar-primary)' : '#64748b',
                      backgroundColor: isActive ? 'rgba(40, 96, 134, 0.05)' : 'transparent',
                      fontWeight: isActive ? 600 : 500,
                      fontSize: '12px',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      if (!isActive) { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.color = 'var(--pioniar-primary)'; }
                    }}
                    onMouseOut={(e) => {
                      if (!isActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b'; }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        {item.icon}
                        {!isSidebarOpen && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                            <div style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: isActive ? 'var(--pioniar-primary)' : '#94a3b8' }}></div>
                            <div style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: isActive ? 'var(--pioniar-primary)' : '#94a3b8' }}></div>
                            <div style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: isActive ? 'var(--pioniar-primary)' : '#94a3b8' }}></div>
                          </div>
                        )}
                      </div>
                      {isSidebarOpen && <span>{item.label}</span>}
                    </div>
                    {isSidebarOpen && (
                      <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                    )}
                  </div>
                  
                  {isSidebarOpen && isOpen && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', paddingLeft: '2.5rem', marginTop: '0.1rem' }}>
                      {item.subItems.map(sub => {
                        const isSubActive = location.pathname === sub.path;
                        return (
                          <Link 
                            key={sub.path} 
                            to={sub.path}
                            style={{
                              padding: '0.4rem 0.75rem', borderRadius: '0.35rem', textDecoration: 'none',
                              color: isSubActive ? 'var(--pioniar-primary)' : '#94a3b8',
                              backgroundColor: isSubActive ? 'rgba(40, 96, 134, 0.08)' : 'transparent',
                              fontWeight: isSubActive ? 600 : 500, fontSize: '11.5px',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                              if (!isSubActive) { e.currentTarget.style.color = 'var(--pioniar-primary)'; }
                            }}
                            onMouseOut={(e) => {
                              if (!isSubActive) { e.currentTarget.style.color = '#94a3b8'; }
                            }}
                          >
                            {sub.label}
                          </Link>
                        )
                      })}
                    </div>
                  )}

                  {!isSidebarOpen && isOpen && (
                    <div style={{
                      position: 'absolute',
                      left: '100%',
                      top: 0,
                      marginLeft: '0.5rem',
                      backgroundColor: '#ffffff',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                      borderRadius: '0.5rem',
                      padding: '0.5rem',
                      zIndex: 50,
                      minWidth: '180px',
                      border: '1px solid var(--pioniar-border)'
                    }}>
                      <div style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                        {item.label}
                      </div>
                      {item.subItems.map(sub => {
                        const isSubActive = location.pathname === sub.path;
                        return (
                          <Link 
                            key={sub.path} 
                            to={sub.path}
                            style={{
                              display: 'block', padding: '0.5rem 0.75rem', borderRadius: '0.35rem', textDecoration: 'none',
                              color: isSubActive ? 'var(--pioniar-primary)' : '#64748b',
                              backgroundColor: isSubActive ? 'rgba(40, 96, 134, 0.08)' : 'transparent',
                              fontWeight: isSubActive ? 600 : 500, fontSize: '0.85rem',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                              if (!isSubActive) { e.currentTarget.style.color = 'var(--pioniar-primary)'; e.currentTarget.style.backgroundColor = '#f8fafc'; }
                            }}
                            onMouseOut={(e) => {
                              if (!isSubActive) { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.backgroundColor = 'transparent'; }
                            }}
                          >
                            {sub.label}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              );
            }
            
            const isActive = location.pathname === item.path;
            
            if (item.locked) {
              return (
                <div 
                  key={item.path}
                  title={`${item.label} (Segera Hadir)`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.875rem',
                    borderRadius: '0.5rem', textDecoration: 'none',
                    color: '#94a3b8',
                    backgroundColor: 'transparent',
                    border: '1px solid transparent',
                    fontWeight: 500,
                    fontSize: '12px',
                    justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                    cursor: 'not-allowed',
                    opacity: 0.6
                  }}
                >
                  {item.icon}
                  {isSidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
                </div>
              );
            }

            return (
              <Link 
                key={item.path} 
                to={item.path}
                title={item.label}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.875rem',
                  borderRadius: '0.5rem', textDecoration: 'none',
                  color: isActive ? '#ffffff' : '#64748b',
                  backgroundColor: isActive ? 'var(--pioniar-primary)' : 'transparent',
                  border: isActive ? '1px solid var(--pioniar-primary)' : '1px solid transparent',
                  boxShadow: isActive ? '0 4px 6px -1px rgba(40, 96, 134, 0.2), 0 2px 4px -1px rgba(40, 96, 134, 0.1)' : 'none',
                  transition: 'all 0.2s',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '12px',
                  justifyContent: isSidebarOpen ? 'flex-start' : 'center'
                }}
                onMouseOver={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.5)';
                    e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                    e.currentTarget.style.color = 'var(--pioniar-primary)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.color = '#64748b';
                  }
                }}
              >
                {item.icon}
                {isSidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div style={{ marginTop: 'auto', padding: '1rem 0.5rem' }}>
            <div style={{ padding: '0 0.75rem 0.25rem 0.75rem', display: 'flex', alignItems: 'center', height: '28px' }}>
              {isSidebarOpen ? (
                <span style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', width: '100%' }}>
                  SETTINGS
                </span>
              ) : (
                <div style={{ width: '20px', height: '2px', backgroundColor: 'rgba(226, 232, 240, 0.6)', borderRadius: '9999px', margin: '0 auto' }}></div>
              )}
            </div>
            <button 
              onClick={handleLogout}
              title="Kembali ke Beranda"
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.875rem', width: '100%', backgroundColor: 'transparent', border: '1px solid transparent', color: '#64748b', cursor: 'pointer', borderRadius: '0.5rem', transition: 'all 0.2s', fontWeight: 600, fontSize: '12px', justifyContent: isSidebarOpen ? 'flex-start' : 'center' }}
              onMouseOver={(e) => { 
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; 
                e.currentTarget.style.color = '#ef4444'; 
              }}
              onMouseOut={(e) => { 
                e.currentTarget.style.backgroundColor = 'transparent'; 
                e.currentTarget.style.color = '#64748b'; 
              }}
            >
              <LogOut size={16} />
              {isSidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>Kembali ke Beranda</span>}
            </button>
        </div>
      </aside>

      {/* 2. WORKSPACE CONTROLLER EAM STYLE */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Top Header */}
        <header style={{ 
          height: '56px', minHeight: '56px', backgroundColor: 'var(--pioniar-bg-secondary)', 
          borderBottom: '1px solid var(--pioniar-border)', display: 'flex', 
          alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem',
          position: 'sticky', top: 0, zIndex: 100
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--pioniar-text)', textTransform: 'capitalize' }}>
              {location.pathname === '/admin' ? 'Dashboard' : location.pathname.split('/').pop()}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
             {/* Profile Dropdown Simulation EAM */}
             <button style={{ 
                display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.25rem 0.75rem 0.25rem 0.35rem', 
                borderRadius: '0.5rem', border: '1px solid var(--pioniar-border)', backgroundColor: '#ffffff',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', cursor: 'pointer', transition: 'all 0.2s'
             }}
             onMouseOver={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.backgroundColor = '#f8fafc'; }}
             onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--pioniar-border)'; e.currentTarget.style.backgroundColor = '#ffffff'; }}>
                
                {/* Avatar Initials */}
                <div style={{ 
                  width: '28px', height: '28px', borderRadius: '0.375rem', 
                  background: 'linear-gradient(to bottom right, #f1f5f9, #e2e8f0)', 
                  border: '1px solid var(--pioniar-border)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  color: '#475569', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase',
                  boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)' 
                }}>
                  EP
                </div>

                {/* Profile Text */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--pioniar-text)', lineHeight: 1.25 }}>Eep Ridwan</span>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', marginTop: '1px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ADMIN SYSTEM</span>
                </div>
                
                {/* Arrow Down */}
                <span style={{ fontSize: '9px', color: '#94a3b8', marginLeft: '0.25rem' }}>▼</span>
             </button>
          </div>
        </header>

        {/* 3. CONTENT OUTLET */}
        <main style={{ flex: 1, backgroundColor: 'var(--pioniar-bg)', padding: '1rem', overflowY: 'auto' }}>
          <Outlet />
        </main>

      </div>
    </div>
  );
}
