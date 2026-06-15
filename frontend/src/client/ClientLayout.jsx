import React, { useEffect } from 'react';
import { Outlet, Link, NavLink, useLocation } from 'react-router-dom';
import LiveChatWidget from './components/LiveChatWidget';
import { ArrowLeft } from 'lucide-react';

export default function ClientLayout() {
  const location = useLocation();

  useEffect(() => {
    document.body.classList.remove('admin-mode');
  }, []);

  return (
    <div className="client-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', color: '#0f172a' }}>
      
      {/* Sleek Header - STICKY */}
      <header style={{ 
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        width: '100%'
      }}>
        <div className="client-header-container" style={{
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '0.75rem 2rem',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%'
        }}>
          {/* Logo Area (Secret Admin Portal) */}
          <Link to="/admin" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }} title="Pioniar Ecosystem">
            <img src="/logo-text.png" alt="PIONIAR" style={{ height: '40px', width: 'auto' }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block' }} />
            <span style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.05em', color: '#0f172a', display: 'none' }}>PIONIAR</span>
          </Link>

          {/* Pill-shaped Nav Links */}
          <nav className="client-nav" style={{ 
            display: 'flex', 
            alignItems: 'center',
            backgroundColor: 'rgba(241, 245, 249, 0.6)', 
            padding: '0.25rem', 
            borderRadius: '2rem',
            fontWeight: 500, 
            fontSize: '0.9rem',
            border: '1px solid rgba(0,0,0,0.02)'
          }}>
            <NavLink to="/" end style={({ isActive }) => ({ 
              textDecoration: 'none', 
              color: isActive ? '#0f172a' : '#64748b', 
              backgroundColor: isActive ? '#ffffff' : 'transparent',
              padding: '0.5rem 1.25rem',
              borderRadius: '1.5rem',
              boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            })}>Beranda</NavLink>

            {location.pathname === '/portal/buy' ? (
              <NavLink to="/portal" style={({ isActive }) => ({ 
                textDecoration: 'none', 
                color: '#2563eb',
                backgroundColor: 'transparent',
                padding: '0.5rem 1.25rem',
                borderRadius: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s'
              })}><ArrowLeft size={16} /> Kembali ke Login</NavLink>
            ) : location.pathname === '/portal' ? (
              <NavLink to="/" style={({ isActive }) => ({ 
                textDecoration: 'none', 
                color: '#2563eb',
                backgroundColor: 'transparent',
                padding: '0.5rem 1.25rem',
                borderRadius: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s'
              })}><ArrowLeft size={16} /> Kembali ke Beranda</NavLink>
            ) : (
              <NavLink to="/portal" style={({ isActive }) => ({ 
                textDecoration: 'none', 
                color: isActive ? '#0f172a' : '#64748b',
                backgroundColor: isActive ? '#ffffff' : 'transparent',
                padding: '0.5rem 1.25rem',
                borderRadius: '1.5rem',
                boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s'
              })}>Portal Wifi</NavLink>
            )}
            <NavLink to="/about-me" style={({ isActive }) => ({ 
              textDecoration: 'none', 
              color: isActive ? '#0f172a' : '#64748b',
              backgroundColor: isActive ? '#ffffff' : 'transparent',
              padding: '0.5rem 1.25rem',
              borderRadius: '1.5rem',
              boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            })}>About Me</NavLink>
          </nav>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Simple Footer */}
      <footer style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid rgba(0,0,0,0.05)', color: '#94a3b8', fontSize: '0.875rem' }}>
        &copy; {new Date().getFullYear()} Pioniar Ecosystem. Dikelola oleh sistem cerdas.
      </footer>
      
      {/* Floating Chat Widget */}
      <LiveChatWidget />
    </div>
  );
}
