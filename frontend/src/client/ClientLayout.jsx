import React, { useEffect, useState } from 'react';
import { Outlet, Link, NavLink, useLocation } from 'react-router-dom';
import LiveChatWidget from './components/LiveChatWidget';
import { Home, Wifi, User } from 'lucide-react';

export default function ClientLayout() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.body.classList.remove('admin-mode');
  }, []);

  const SLATE = '#607b9e';
  const MINT  = '#7bc4a0';

  return (
    <div className="h-screen overflow-hidden flex flex-col max-md:pb-[65px]" style={{ background:'#f7f9fb' }}>

      {/* ── Top Header ── */}
      <header className="shrink-0 w-full border-b relative z-50" style={{ background:'rgba(255,255,255,0.85)', backdropFilter:'blur(16px)', borderColor:`${SLATE}18` }}>
        <div className="max-w-6xl mx-auto w-full px-4 md:px-6 h-[56px] md:h-[58px] flex items-center justify-between">

          {/* Logo (Centered on mobile, left on desktop) */}
          <Link to="/admin" className="flex items-center gap-2 no-underline shrink-0 group mx-auto md:mx-0" title="Pioniar Admin">
            <img
              src="/logo-icon.png"
              alt="PIONIAR"
              className="h-8 md:h-9 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity"
              onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
            />
            <span className="flex items-center font-black text-xl tracking-tight" style={{ color: SLATE }}>PIONIAR</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1.5 rounded-full p-1" style={{ background:`${SLATE}10`, border:`1px solid ${SLATE}18` }}>
            <NavLink to="/" end className={({ isActive }) => [
              'no-underline px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200',
              isActive ? 'bg-white shadow-sm' : 'hover:bg-white/60',
            ].join(' ')} style={({ isActive }) => ({ color: isActive ? SLATE : `${SLATE}80` })}>
              Beranda
            </NavLink>

            <NavLink to="/portal" className={({ isActive }) => [
              'no-underline px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200',
              isActive ? 'bg-white shadow-sm' : 'hover:bg-white/60',
            ].join(' ')} style={({ isActive }) => ({ color: isActive ? SLATE : `${SLATE}80` })}>
              Portal Wifi
            </NavLink>

            <NavLink to="/about-me" className={({ isActive }) => [
              'no-underline px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200',
              isActive ? 'bg-white shadow-sm' : 'hover:bg-white/60',
            ].join(' ')} style={({ isActive }) => ({ color: isActive ? SLATE : `${SLATE}80` })}>
              About Me
            </NavLink>
          </nav>

          {/* Network status */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border shrink-0"
            style={{ background:`${MINT}18`, borderColor:`${MINT}40`, color:'#5aab87' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: MINT }}/>
            Network Online
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <Outlet />
      </main>

      <footer className="shrink-0 py-3 text-center border-t text-xs font-medium hidden md:block" style={{ borderColor:`${SLATE}14`, color:`${SLATE}70`, background:'rgba(255,255,255,0.5)' }}>
        © {new Date().getFullYear()} Pioniar Ecosystem. Dikelola oleh{' '}
        <span className="font-bold" style={{ color: SLATE }}>Eep Ridwan Pauji</span>
      </footer>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t z-[60] flex items-center justify-around pb-2 pt-2 px-2 shadow-[0_-8px_30px_rgba(74,104,145,0.08)]" style={{ borderColor:`${SLATE}15`, paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)' }}>
        <NavLink to="/" end className={({ isActive }) => `flex flex-col items-center gap-1 p-2 min-w-[64px] rounded-xl transition-all duration-200 ${isActive ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}>
          <Home size={22} className={location.pathname === '/' ? 'stroke-[2.5px]' : 'stroke-2'} />
          <span className="text-[10px] font-bold">Beranda</span>
        </NavLink>
        <NavLink to="/portal" className={({ isActive }) => `flex flex-col items-center gap-1 p-2 min-w-[64px] rounded-xl transition-all duration-200 ${isActive ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}>
          <Wifi size={22} className={location.pathname === '/portal' ? 'stroke-[2.5px]' : 'stroke-2'} />
          <span className="text-[10px] font-bold">Portal Wifi</span>
        </NavLink>
        <NavLink to="/about-me" className={({ isActive }) => `flex flex-col items-center gap-1 p-2 min-w-[64px] rounded-xl transition-all duration-200 ${isActive ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}>
          <User size={22} className={location.pathname === '/about-me' ? 'stroke-[2.5px]' : 'stroke-2'} />
          <span className="text-[10px] font-bold">Profil</span>
        </NavLink>
      </nav>

      <LiveChatWidget />
    </div>
  );
}
