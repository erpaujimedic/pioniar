import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Wifi, Hexagon, Lock, LogOut, X, ChevronDown, ChevronRight, Search, Box, Minus, LayoutGrid, RefreshCw, Menu } from 'lucide-react';
import WinBoxWindow from './components/WinBoxWindow';

// Import Page Components
import DashboardOverview from './pages/DashboardOverview';
import WifiManager from './pages/WifiManager';
import WifiProfileManager from './pages/WifiProfileManager';
import WifiActiveSessions from './pages/WifiActiveSessions';
import WifiReporting from './pages/WifiReporting';

const Placeholder = ({ title }) => (
  <div className="p-5 flex justify-center items-center h-full bg-white">
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
      <div className="w-full min-h-[100dvh] flex flex-col items-center justify-start md:justify-center p-4 overflow-y-auto hide-scrollbar font-sans relative max-md:pt-12" style={{ background: '#f5f8fc' }}>
        
        {/* subtle hex grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage:`url("data:image/svg+xml,%3Csvg width='70' height='121' viewBox='0 0 70 121' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M35 0l30.31 17.5v35L35 70 4.69 52.5v-35z' fill='none' stroke='%234a6891' stroke-width='0.8' stroke-opacity='0.08'/%3E%3C/svg%3E")`,
          backgroundSize:'70px 121px'
        }}/>

        {/* Decorative Background Glows */}
        <div className="absolute top-[10%] left-[15%] w-[400px] h-[400px] rounded-full pointer-events-none" style={{ background:`radial-gradient(circle, #7bc4a015 0%, transparent 70%)`, filter:'blur(40px)' }}></div>
        <div className="absolute bottom-[10%] right-[15%] w-[350px] h-[350px] rounded-full pointer-events-none" style={{ background:`radial-gradient(circle, #607b9e12 0%, transparent 70%)`, filter:'blur(50px)' }}></div>
        
        {/* Modal Card - Sized consistently at 360px */}
        <div className="w-full max-w-[360px] p-8 rounded-3xl bg-white/95 backdrop-blur-md border shadow-[0_12px_40px_rgba(74,104,145,0.12)] z-10 flex flex-col" style={{ borderColor: '#4a689115' }}>
          
          <div className="flex flex-col items-center mb-6 text-center">
            {/* Hexagon icon styled like the brand */}
            <div className="mx-auto w-14 h-14 mb-4 flex items-center justify-center p-[3px] relative shrink-0" style={{ clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)', background:`linear-gradient(135deg, #4a6891, #5aab87)`, filter:`drop-shadow(0 4px 10px #5aab8730)` }}>
               <div className="w-full h-full flex items-center justify-center bg-white" style={{ clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)' }}>
                  <Hexagon size={22} style={{ color: '#5aab87' }} />
               </div>
            </div>
            
            <h1 className="text-xl font-black m-0 tracking-tight" style={{ color: '#4a6891' }}>
              Pioniar <span style={{ color: '#5aab87' }}>Admin</span>
            </h1>
            <p className="text-[10px] font-bold mt-1 uppercase tracking-widest" style={{ color: '#607b9e' }}>Sistem Manajemen Jaringan Pintar</p>
          </div>
          
          {error && (
            <div className="px-4 py-3 bg-red-50 text-red-600 rounded-xl mb-5 text-[13px] font-bold flex items-center gap-2 shadow-sm">
              <div className="w-1 h-4 bg-red-600 rounded"></div>
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: '#607b9e' }}>Alamat Email / Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin@pioniar.com" 
                className="w-full px-4 py-3 border rounded-xl text-sm font-semibold transition-all outline-none bg-white" 
                style={{ borderColor: '#4a689120', color: '#4a6891' }}
                onFocus={(e) => { e.target.style.borderColor = '#5aab87'; e.target.style.boxShadow = `0 0 0 3px #5aab8720`; }}
                onBlur={(e) => { e.target.style.borderColor = '#4a689120'; e.target.style.boxShadow = 'none'; }}
                required />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: '#607b9e' }}>Kata Sandi</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" 
                className="w-full px-4 py-3 border rounded-xl text-sm font-semibold transition-all outline-none bg-white" 
                style={{ borderColor: '#4a689120', color: '#4a6891' }}
                onFocus={(e) => { e.target.style.borderColor = '#5aab87'; e.target.style.boxShadow = `0 0 0 3px #5aab8720`; }}
                onBlur={(e) => { e.target.style.borderColor = '#4a689120'; e.target.style.boxShadow = 'none'; }}
                required />
            </div>
            <button type="submit" className="mt-2 w-full py-3 rounded-xl font-bold text-sm cursor-pointer border-none flex items-center justify-center transition-all hover:-translate-y-0.5"
              style={{ background: `linear-gradient(135deg, #5aab87, #4a6891)`, color: 'white', boxShadow: `0 6px 16px #5aab8730` }}>
              Masuk ke Workspace
            </button>
            
            <div className="mt-3 text-center">
              <button type="button" onClick={() => navigate('/')} className="bg-transparent border-none text-[12px] font-bold cursor-pointer transition-colors"
                style={{ color: '#607b9e' }}
                onMouseEnter={e => e.target.style.color = '#5aab87'}
                onMouseLeave={e => e.target.style.color = '#607b9e'}
              >
                &larr; Kembali ke Halaman Publik
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-slate-100 font-sans text-sm text-slate-900 relative">
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-[99998] md:hidden backdrop-blur-sm" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR - Premium Light Theme */}
      <aside className={`w-[260px] md:w-[240px] bg-white/95 backdrop-blur-md border-r border-slate-200/80 flex flex-col overflow-y-auto overflow-x-hidden z-[99999] shadow-[1px_0_15px_rgba(0,0,0,0.02)] fixed md:static inset-y-0 left-0 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        {/* Logo Area */}
        <div className="p-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 flex items-center justify-center">
               <img src="/logo-icon.png" alt="Pioniar" className="w-full h-full object-contain drop-shadow-sm" />
             </div>
             <span className="font-extrabold text-lg tracking-tight text-slate-900">Pioniar</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-500 hover:text-slate-800">
            <X size={20} />
          </button>
        </div>

        <nav className="px-3 py-2 flex flex-col gap-1">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 pl-2">Menu Navigasi</div>
          {navItems.map((item) => {
            if (item.subItems) {
              const isExpanded = openDropdowns[item.label];
              return (
                <div key={item.label}>
                  <div 
                    onClick={() => toggleDropdown(item.label)}
                    className="flex items-center px-3 py-2 cursor-pointer rounded-lg text-slate-600 transition-colors font-semibold hover:bg-slate-100 hover:text-slate-900 text-[11px]"
                  >
                    <div className="mr-2 flex items-center">{item.icon}</div>
                    <span className="flex-1 select-none">{item.label}</span>
                    <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                      <ChevronDown size={14} />
                    </div>
                  </div>
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="mt-0.5 flex flex-col gap-0.5">
                      {item.subItems.map(sub => {
                        const isActive = openWindows.some(w => w.id === sub.path && w.zIndex === highestZIndex);
                        return (
                          <div 
                            key={sub.path} 
                            onClick={() => { openWindow(sub.path); setIsMobileMenuOpen(false); }}
                            className={`pl-8 pr-3 py-1.5 cursor-pointer rounded-lg text-[11px] md:text-[11px] text-[13px] font-semibold transition-all flex items-center relative ${isActive ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                          >
                            {isActive && <div className="absolute left-2 w-1.5 h-1.5 rounded-full bg-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>}
                            <span className="select-none flex-1">{sub.label}</span>
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
                onClick={() => { openWindow(item.path); setIsMobileMenuOpen(false); }}
                className={`flex items-center px-3 py-3 md:py-2 cursor-pointer rounded-lg text-[13px] md:text-[11px] font-semibold transition-colors relative ${isActive ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
              >
                {isActive && <div className="absolute left-0 top-[20%] bottom-[20%] w-1 rounded-r bg-emerald-500"></div>}
                <div className={`mr-2 flex items-center ${isActive ? 'text-emerald-500' : 'inherit'}`}>{item.icon}</div>
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>
        
        {/* User Profile Area */}
        <div className="mt-auto p-4 border-t border-slate-200/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-[10px]">
              AD
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="font-bold text-[11px] text-slate-900 whitespace-nowrap text-ellipsis overflow-hidden">Administrator</div>
              <div className="text-[9px] text-slate-500 font-semibold">Online</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Sleek Top Bar */}
        <header className="h-[56px] md:h-[52px] bg-white flex items-center justify-between px-3 md:px-5 border-b border-slate-200/60 z-[9998] shrink-0">
          <div className="flex items-center gap-2 md:gap-3 text-[13px] md:text-[13px] text-[14px] font-bold text-slate-700">
             <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-1.5 -ml-1 text-slate-600 hover:bg-slate-100 rounded-lg">
               <Menu size={22} />
             </button>
             
             <div className="flex items-center gap-1.5 md:gap-2 text-slate-500">
                <LayoutGrid size={15} className="hidden md:block" />
                <span className="hidden sm:inline">Pioniar OS</span>
             </div>
             {openWindows.length > 0 && (
                <>
                  <span className="text-slate-300 hidden sm:inline">/</span>
                  <span className="text-emerald-600 bg-emerald-50 px-2 md:px-2.5 py-0.5 rounded text-[10px] md:text-[11px] font-black tracking-wide border border-emerald-100 whitespace-nowrap">{openWindows.length} Aktif</span>
                </>
             )}
          </div>
          
          <div className="flex items-center gap-1 md:gap-2 pr-0 md:pr-1">
             <button onClick={() => window.dispatchEvent(new Event('app:refresh'))} title="Muat Ulang Data" className="group bg-white border border-slate-200 rounded text-slate-500 cursor-pointer flex items-center justify-center p-1.5 transition-all duration-200 shadow-sm hover:shadow hover:border-emerald-300 hover:text-emerald-600 hover:-translate-y-0.5 active:scale-95 outline-none">
               <RefreshCw size={14} className="group-active:-rotate-180 transition-transform duration-500" />
             </button>
             
             <button onClick={autoTileWindows} title="Susun Semua Jendela" className="hidden md:flex group bg-white border border-slate-200 rounded text-slate-600 cursor-pointer items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold transition-all duration-200 shadow-sm hover:shadow hover:border-emerald-300 hover:-translate-y-0.5 active:scale-95 outline-none">
               <LayoutGrid size={14} className="text-emerald-500 transition-transform duration-300 group-hover:scale-110" /> Susun Layar
             </button>
             
             <div className="w-px h-5 bg-slate-200 mx-1"></div>
             
             <button onClick={handleLogout} className="group bg-white border border-slate-200 rounded text-rose-500 cursor-pointer flex items-center gap-1.5 px-2 md:px-3 py-1.5 text-[11px] font-bold transition-all duration-200 hover:bg-rose-50 hover:border-rose-300 hover:shadow-sm hover:-translate-y-0.5 active:scale-95 outline-none">
               <LogOut size={14} className="transition-transform duration-300 group-hover:-translate-x-0.5" /> <span className="hidden sm:inline">Keluar</span>
             </button>
          </div>
        </header>

        {/* DESKTOP LAYER */}
        <div ref={desktopRef} className="flex-1 overflow-hidden relative">
          {/* Subtle Abstract Background Decoration */}
          <div className="absolute -top-[10%] -left-[10%] w-1/2 h-1/2 bg-[radial-gradient(circle,rgba(59,130,246,0.05)_0%,rgba(255,255,255,0)_70%)] pointer-events-none"></div>
          <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-[radial-gradient(circle,rgba(16,185,129,0.03)_0%,rgba(255,255,255,0)_70%)] pointer-events-none"></div>
          
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
                <div className="flex-1 overflow-hidden bg-white text-slate-900 flex flex-col">
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
