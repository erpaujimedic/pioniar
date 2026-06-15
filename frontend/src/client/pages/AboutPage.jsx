import React from 'react';
import { Compass, User, Shield, Zap, ExternalLink } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="animate-fade-in bg-hex-pattern" style={{ 
      width: '100%', 
      minHeight: 'calc(100vh - 65px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '4rem 2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      <div className="animate-slide-up" style={{ textAlign: 'center', maxWidth: '1000px', width: '100%', zIndex: 1 }}>
        
        {/* Header */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', backgroundColor: 'rgba(37,99,235,0.1)', color: 'var(--client-primary)', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: 700, marginBottom: '1.5rem', letterSpacing: '0.05em' }}>
          <Compass size={16} /> TENTANG SAYA
        </div>
        

        
        {/* Middle Section: Story & Founder */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', textAlign: 'left', marginBottom: '2rem' }}>
          
          {/* Main Story Card */}
          <div className="elegant-glass animate-slide-up delay-100" style={{ padding: '3rem', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'inline-block', background: 'var(--client-primary)', color: 'white', padding: '0.4rem 1rem', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.1em', width: 'fit-content' }}>
              15 JUNI 2026
            </div>
            <p style={{ fontSize: '1.15rem', color: '#475569', lineHeight: 1.8, margin: 0, fontWeight: 500 }}>
              Semuanya dimulai tepat pada tanggal <strong>15 Juni 2026</strong>. Dengan semangat yang tinggi dan visi yang melampaui batas, <strong>Pioniar Ecosystem</strong> lahir bukan sekadar sebagai platform biasa, melainkan sebagai sebuah mahakarya integrasi teknologi mutakhir.
            </p>
            <p style={{ fontSize: '1.15rem', color: '#475569', lineHeight: 1.8, margin: 0, fontWeight: 500 }}>
              Tujuan kami sangat jelas: menyederhanakan kompleksitas dunia nyata melalui sentuhan digital yang elegan. Kami menyediakan infrastruktur jaringan teknologi canggih tanpa batas yang seluruhnya terpusat dalam satu ruang kendali yang intuitif dan tak tertandingi.
            </p>
          </div>

          {/* Founder Card with Socials */}
          <div className="elegant-glass animate-slide-up delay-200" style={{ padding: '3rem', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.5rem', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
            
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 10px 25px rgba(37,99,235,0.4)', position: 'relative' }}>
              <User size={48} />
              <div style={{ position: 'absolute', bottom: 0, right: 0, background: '#10b981', width: '20px', height: '20px', borderRadius: '50%', border: '3px solid white' }}></div>
            </div>
            
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>Eep Ridwan Pauji</div>
              <div style={{ fontSize: '0.9rem', color: '#2563eb', fontWeight: 800, letterSpacing: '0.05em' }}>PENDIRI & PERANCANG UTAMA</div>
            </div>

            <div style={{ width: '100%', height: '1px', background: 'rgba(0,0,0,0.05)', margin: '0.5rem 0' }}></div>

            {/* Social Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
              <a href="https://instagram.com/eepridwanpauji" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: '#f8fafc', borderRadius: '1rem', textDecoration: 'none', color: '#0f172a', transition: 'all 0.2s', border: '1px solid #f1f5f9' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.transform = 'translateY(-2px)' }} onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.transform = 'translateY(0)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ color: '#e1306c', display: 'flex' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>@eepridwanpauji</span>
                </div>
                <ExternalLink size={16} color="#94a3b8" />
              </a>

              <a href="https://linkedin.com/in/eepridwanpauji" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: '#f8fafc', borderRadius: '1rem', textDecoration: 'none', color: '#0f172a', transition: 'all 0.2s', border: '1px solid #f1f5f9' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.transform = 'translateY(-2px)' }} onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.transform = 'translateY(0)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ color: '#0a66c2', display: 'flex' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                      <rect x="2" y="9" width="4" height="12"></rect>
                      <circle cx="4" cy="4" r="2"></circle>
                    </svg>
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>eepridwanpauji</span>
                </div>
                <ExternalLink size={16} color="#94a3b8" />
              </a>
            </div>

          </div>

        </div>

        {/* Bottom Section: Core Values Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
           <div className="elegant-glass animate-slide-up delay-300" style={{ padding: '1.5rem 2rem', borderRadius: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', textAlign: 'left', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ background: '#eff6ff', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
                <Zap size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem', marginBottom: '0.25rem' }}>Kinerja Tinggi</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Infrastruktur super cepat tanpa kompromi.</div>
              </div>
           </div>
           
           <div className="elegant-glass animate-slide-up delay-400" style={{ padding: '1.5rem 2rem', borderRadius: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', textAlign: 'left', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ background: '#ecfdf5', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
                <Shield size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem', marginBottom: '0.25rem' }}>Keamanan Ekstra</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Perlindungan privasi data tak tertembus.</div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
