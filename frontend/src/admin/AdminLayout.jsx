import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Wifi, Hexagon, Lock, LogOut, X, ChevronDown, ChevronRight, Search, Box, Minus, LayoutGrid } from 'lucide-react';
import WinBoxWindow from './components/WinBoxWindow';

// Import Page Components
import DashboardOverview from './pages/DashboardOverview';
import WifiManager from './pages/WifiManager';
import WifiProfileManager from './pages/WifiProfileManager';
import WifiActiveSessions from './pages/WifiActiveSessions';
import WifiReporting from './pages/WifiReporting';

const Placeholder = ({ title }) => (
  <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', backgroundColor: '#fff' }}>
    <h2>{title} (Under Construction)</h2>
  </div>
);

const windowRegistry = {
  '/admin': { component: DashboardOverview, icon: <Box size={14}/>, title: 'Dashboard', defaultSize: { w: 800, h: 500 }, initialMaximized: true },
  '/admin/wifi': { component: WifiManager, icon: <Wifi size={14}/>, title: 'Manajemen Voucher', defaultSize: { w: 900, h: 600 }, initialMaximized: true },
  '/admin/wifi/packages': { component: WifiProfileManager, icon: <Wifi size={14}/>, title: 'Setup Paket', defaultSize: { w: 800, h: 500 }, initialMaximized: true },
  '/admin/wifi/active': { component: WifiActiveSessions, icon: <Wifi size={14}/>, title: 'Sesi Aktif', defaultSize: { w: 800, h: 500 }, initialMaximized: true },
  '/admin/wifi/reporting': { component: WifiReporting, icon: <Wifi size={14}/>, title: 'Laporan Pendapatan', defaultSize: { w: 800, h: 500 }, initialMaximized: true },
  '/admin/livestock': { component: () => <Placeholder title="Ternak" />, icon: <Lock size={14}/>, title: 'Ternak', defaultSize: { w: 600, h: 400 }, initialMaximized: true },
  '/admin/snack': { component: () => <Placeholder title="Snack" />, icon: <Lock size={14}/>, title: 'Snack', defaultSize: { w: 600, h: 400 }, initialMaximized: true }
};

export default function AdminLayout() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [openDropdowns, setOpenDropdowns] = useState({'Wifi': true});
  
  // MDI Window Manager State
  const [openWindows, setOpenWindows] = useState([]);
  const [highestZIndex, setHighestZIndex] = useState(10);
  const desktopRef = useRef(null);

  const toggleDropdown = (label) => {
    setOpenDropdowns(prev => ({...prev, [label]: !prev[label]}));
  };

  useEffect(() => {
    const authStatus = localStorage.getItem('pioniar_admin_auth');
    if (authStatus === 'eepridwan' || authStatus === 'erpauji.medic@gmail.com') {
      setIsAuthenticated(true);
    }
    document.body.classList.add('admin-mode');
    return () => {
      document.body.classList.remove('admin-mode');
    };
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
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
    { path: '/admin', label: 'Dashboard', icon: <Box size={14} /> },
    { 
      label: 'Wifi', icon: <Wifi size={14} />,
      subItems: [
        { path: '/admin/wifi', label: 'Manajemen Voucher' },
        { path: '/admin/wifi/packages', label: 'Setup Paket' },
        { path: '/admin/wifi/active', label: 'Sesi Aktif' },
        { path: '/admin/wifi/reporting', label: 'Laporan Pendapatan' }
      ]
    },
    { path: '/admin/livestock', label: 'Ternak', icon: <Lock size={14} />, locked: true },
    { path: '/admin/snack', label: 'Snack', icon: <Lock size={14} />, locked: true },
  ];

  // Window Management Functions
  const openWindow = (path) => {
    if (windowRegistry[path]?.locked) return; // Ignore locked paths

    setOpenWindows(prev => {
      const existing = prev.find(w => w.id === path);
      if (existing) {
        // Bring to front and restore if minimized
        return prev.map(w => w.id === path ? { ...w, isMinimized: false, zIndex: highestZIndex + 1 } : w);
      } else {
        // Open new window
        const offset = (prev.length % 10) * 25; // Cascade windows
        return [...prev, { 
          id: path, 
          isMinimized: false, 
          zIndex: highestZIndex + 1,
          x: 20 + offset,
          y: 20 + offset
        }];
      }
    });
    setHighestZIndex(z => z + 1);
  };

  const closeWindow = (path, e) => {
    e?.stopPropagation();
    setOpenWindows(prev => prev.filter(w => w.id !== path));
  };

  const focusWindow = (path) => {
    setOpenWindows(prev => prev.map(w => w.id === path ? { ...w, isMinimized: false, zIndex: highestZIndex + 1 } : w));
    setHighestZIndex(z => z + 1);
  };

  const toggleMinimize = (path, e) => {
    e?.stopPropagation();
    setOpenWindows(prev => prev.map(w => w.id === path ? { ...w, isMinimized: !w.isMinimized } : w));
  };

  // Auto-Tile / Split View Logic
  const autoTileWindows = () => {
    if (!desktopRef.current) return;
    const desktop = desktopRef.current.getBoundingClientRect();
    const activeWins = openWindows.filter(w => !w.isMinimized);
    const count = activeWins.length;
    if (count === 0) return;

    const margin = 8; // margin between windows
    const layoutId = Date.now();

    setOpenWindows(prev => prev.map(w => {
      if (w.isMinimized) return w;
      
      const index = activeWins.findIndex(aw => aw.id === w.id);
      let forcedX, forcedY, forcedW, forcedH;

      if (count === 1) {
        forcedX = margin;
        forcedY = margin;
        forcedW = desktop.width - margin * 2;
        forcedH = desktop.height - margin * 2;
      } else if (count === 2) {
        forcedW = (desktop.width - margin * 3) / 2;
        forcedH = desktop.height - margin * 2;
        forcedX = margin + index * (forcedW + margin);
        forcedY = margin;
      } else if (count === 3) {
        if (index === 0) {
          forcedW = (desktop.width - margin * 3) / 2;
          forcedH = desktop.height - margin * 2;
          forcedX = margin;
          forcedY = margin;
        } else {
          forcedW = (desktop.width - margin * 3) / 2;
          forcedH = (desktop.height - margin * 3) / 2;
          forcedX = margin * 2 + forcedW;
          forcedY = margin + (index - 1) * (forcedH + margin);
        }
      } else {
        // 4+ Windows (2x2 grid max, others hide or cascade)
        const row = Math.floor(index / 2);
        const col = index % 2;
        forcedW = (desktop.width - margin * 3) / 2;
        forcedH = (desktop.height - margin * 3) / 2;
        forcedX = margin + col * (forcedW + margin);
        forcedY = margin + row * (forcedH + margin);
      }

      return { ...w, layoutId, forcedX, forcedY, forcedW, forcedH };
    }));
  };

  // Open default dashboard on login
  useEffect(() => {
    if (isAuthenticated && openWindows.length === 0) {
      openWindow('/admin');
    }
  }, [isAuthenticated, openWindows.length]);

  if (!isAuthenticated) {
    return (
      <div style={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backgroundColor: '#eef2f6', fontFamily: 'Inter, sans-serif' }}>
        {/* Decorative Background */}
        <div style={{ position: 'absolute', top: '10%', left: '15%', width: '30vw', height: '30vw', background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, rgba(255,255,255,0) 70%)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', bottom: '10%', right: '15%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, rgba(255,255,255,0) 70%)', pointerEvents: 'none' }}></div>
        
        <div style={{ width: '100%', maxWidth: '400px', padding: '40px', borderRadius: '24px', backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 20px 40px rgba(0,0,0,0.06)', zIndex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
            <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(37, 99, 235, 0.25)' }}>
               <Hexagon size={32} fill="#fff" color="#fff" />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', marginTop: '20px', marginBottom: '6px', color: '#0f172a', letterSpacing: '-0.5px' }}>Pioniar Admin</h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Sistem Manajemen Jaringan Pintar</p>
          </div>
          
          {error && (
            <div style={{ padding: '12px 16px', backgroundColor: '#fff1f2', color: '#e11d48', borderRadius: '12px', marginBottom: '24px', fontSize: '13px', fontWeight: '500', border: '1px solid #ffe4e6', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '4px', height: '16px', backgroundColor: '#e11d48', borderRadius: '4px' }}></div>
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Alamat Email / Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin@pioniar.com" style={{ width: '100%', padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: '12px', fontSize: '14px', color: '#0f172a', backgroundColor: '#f8fafc', transition: 'all 0.2s ease', outline: 'none' }} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Kata Sandi</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ width: '100%', padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: '12px', fontSize: '14px', color: '#0f172a', backgroundColor: '#f8fafc', transition: 'all 0.2s ease', outline: 'none' }} required />
            </div>
            <button type="submit" style={{ marginTop: '12px', width: '100%', padding: '14px', borderRadius: '12px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#ffffff', border: 'none', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)', transition: 'all 0.2s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
              Masuk ke Workspace
            </button>
            <button type="button" onClick={() => navigate('/')} style={{ width: '100%', padding: '12px', borderRadius: '12px', cursor: 'pointer', backgroundColor: 'transparent', color: '#64748b', fontWeight: '600', fontSize: '14px', border: 'none', transition: 'all 0.2s ease' }} onMouseOver={e => e.currentTarget.style.color = '#0f172a'} onMouseOut={e => e.currentTarget.style.color = '#64748b'}>
              &larr; Kembali ke Halaman Publik
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', backgroundColor: '#eef2f6', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#0f172a' }}>
      
      {/* SIDEBAR - Premium Light Theme */}
      <aside style={{ 
        width: '260px', 
        background: 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(10px)',
        borderRight: '1px solid rgba(226, 232, 240, 0.8)', 
        display: 'flex', 
        flexDirection: 'column', 
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 9999,
        boxShadow: '1px 0 15px rgba(0,0,0,0.02)'
      }}>
        {/* Logo Area */}
        <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
           <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)' }}>
             <Hexagon size={20} fill="#fff" color="#fff" />
           </div>
           <span style={{ fontWeight: '800', fontSize: '20px', letterSpacing: '-0.5px', color: '#0f172a' }}>Pioniar.</span>
        </div>

        <nav style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '8px', paddingLeft: '8px' }}>Menu Navigasi</div>
          {navItems.map((item) => {
            if (item.subItems) {
              const isExpanded = openDropdowns[item.label];
              return (
                <div key={item.label}>
                  <div 
                    onClick={() => toggleDropdown(item.label)}
                    style={{
                      display: 'flex', alignItems: 'center', padding: '12px 16px', cursor: 'pointer',
                      borderRadius: '10px', color: '#475569', transition: 'all 0.25s ease',
                      fontWeight: '600'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#475569'; }}
                  >
                    <div style={{ marginRight: '14px', display: 'flex', alignItems: 'center' }}>{item.icon}</div>
                    <span style={{ flex: 1, userSelect: 'none' }}>{item.label}</span>
                    <div style={{ transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      <ChevronDown size={16} />
                    </div>
                  </div>
                  <div style={{ 
                    overflow: 'hidden', 
                    transition: 'all 0.3s ease-in-out', 
                    maxHeight: isExpanded ? '300px' : '0px',
                    opacity: isExpanded ? 1 : 0
                  }}>
                    <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {item.subItems.map(sub => {
                        const isSubActive = openWindows.some(w => w.id === sub.path && w.zIndex === highestZIndex);
                        return (
                          <div 
                            key={sub.path} 
                            onClick={() => openWindow(sub.path)}
                            style={{
                              display: 'block', padding: '10px 16px 10px 46px', cursor: 'pointer',
                              borderRadius: '10px', fontSize: '13px', userSelect: 'none',
                              color: isSubActive ? '#0f172a' : '#64748b',
                              backgroundColor: isSubActive ? '#e2e8f0' : 'transparent', // Premium Grey Active Tab
                              fontWeight: isSubActive ? '700' : '500',
                              transition: 'all 0.2s ease',
                              position: 'relative'
                            }}
                            onMouseOver={(e) => { if (!isSubActive) { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.color = '#334155'; } }}
                            onMouseOut={(e) => { if (!isSubActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b'; } }}
                          >
                            {isSubActive && <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></div>}
                            {sub.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            const isActive = openWindows.some(w => w.id === item.path && w.zIndex === highestZIndex);
            return (
              <div 
                key={item.path} 
                onClick={() => openWindow(item.path)}
                style={{
                  display: 'flex', alignItems: 'center', padding: '12px 16px', cursor: item.locked ? 'not-allowed' : 'pointer',
                  borderRadius: '10px', transition: 'all 0.25s ease', fontWeight: isActive ? '700' : '600', userSelect: 'none',
                  color: item.locked ? '#cbd5e1' : (isActive ? '#0f172a' : '#475569'),
                  backgroundColor: isActive ? '#e2e8f0' : 'transparent', // Premium Grey Active Tab
                  position: 'relative'
                }}
                onMouseOver={(e) => { if (!isActive && !item.locked) { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; } }}
                onMouseOut={(e) => { if (!isActive && !item.locked) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#475569'; } }}
              >
                {isActive && <div style={{ position: 'absolute', left: 0, top: '15%', bottom: '15%', width: '4px', borderTopRightRadius: '4px', borderBottomRightRadius: '4px', backgroundColor: '#3b82f6' }}></div>}
                <div style={{ marginRight: '14px', display: 'flex', alignItems: 'center', color: isActive ? '#3b82f6' : 'inherit' }}>{item.icon}</div>
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>
        
        {/* User Profile Area */}
        <div style={{ marginTop: 'auto', padding: '24px', borderTop: '1px solid rgba(226, 232, 240, 0.6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#475569' }}>
              AD
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>Administrator</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Online</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        
        {/* Sleek Top Bar */}
        <header style={{ 
          height: '72px', background: 'rgba(255, 255, 255, 0.8)', 
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.6)', 
          display: 'flex', alignItems: 'center', padding: '0 32px', gap: '20px', zIndex: 9998
        }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontWeight: '800', fontSize: '20px', color: '#0f172a', letterSpacing: '-0.3px' }}>
              {openWindows.length > 0 ? `Workspace (${openWindows.length} Aktif)` : 'Dashboard Utama'}
            </h1>
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748b' }}>Kelola jaringan Pioniar Anda dengan mudah.</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
             <button onClick={autoTileWindows} title="Susun Jendela" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }} onMouseOver={e=>{e.currentTarget.style.boxShadow='0 4px 8px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor='#cbd5e1';}} onMouseOut={e=>{e.currentTarget.style.boxShadow='0 2px 4px rgba(0,0,0,0.02)'; e.currentTarget.style.borderColor='#e2e8f0';}}>
               <LayoutGrid size={16} /> Susun Layar
             </button>
             
             <button onClick={handleLogout} style={{ background: '#fff1f2', border: '1px solid #ffe4e6', borderRadius: '10px', color: '#e11d48', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s ease' }} onMouseOver={e=>{e.currentTarget.style.background='#ffe4e6';}} onMouseOut={e=>{e.currentTarget.style.background='#fff1f2';}}>
               <LogOut size={16} /> Keluar
             </button>
          </div>
        </header>

        {/* DESKTOP LAYER */}
        <div ref={desktopRef} style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {/* Subtle Abstract Background Decoration */}
          <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, rgba(255,255,255,0) 70%)', pointerEvents: 'none' }}></div>
          <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(16,185,129,0.03) 0%, rgba(255,255,255,0) 70%)', pointerEvents: 'none' }}></div>
          
          {openWindows.map(win => {
            const config = windowRegistry[win.id];
            if (!config) return null;
            const Component = config.component;
            const isActive = win.zIndex === highestZIndex;

            return (
              <WinBoxWindow
                key={win.id}
                id={win.id}
                title={config.title}
                icon={config.icon}
                initialX={win.x}
                initialY={win.y}
                initialWidth={config.defaultSize.w}
                initialHeight={config.defaultSize.h}
                initialMaximized={config.initialMaximized}
                isActive={isActive}
                isMinimized={win.isMinimized}
                zIndex={win.zIndex}
                onFocus={() => focusWindow(win.id)}
                onClose={() => closeWindow(win.id)}
                onMinimize={() => toggleMinimize(win.id)}
                forcedX={win.forcedX}
                forcedY={win.forcedY}
                forcedW={win.forcedW}
                forcedH={win.forcedH}
                layoutId={win.layoutId}
              >
                <div style={{ height: '100%', overflow: 'auto', backgroundColor: '#ffffff', color: '#0f172a', display: 'flex', flexDirection: 'column' }}>
                  <Component />
                </div>
              </WinBoxWindow>
            )
          })}
        </div>
      </main>
    </div>
  );
}
