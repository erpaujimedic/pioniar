import React from 'react';
import { Compass, User, Shield, Zap, ExternalLink, Hexagon } from 'lucide-react';

/* ── brand palette ── */
const SLATE  = '#4a6891';
const SLATEL = '#607b9e';
const MINT   = '#5aab87';
const MINTL  = '#7bc4a0';
const BG     = '#f5f8fc';
const HEX = 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)';

export default function AboutPage() {
  return (
    <div className="animate-fade-in w-full min-h-[calc(100vh-65px)] flex flex-col items-center py-16 px-8 relative overflow-hidden max-md:py-8 max-md:px-4" style={{ background: BG }}>
      
      {/* subtle hex grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage:`url("data:image/svg+xml,%3Csvg width='70' height='121' viewBox='0 0 70 121' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M35 0l30.31 17.5v35L35 70 4.69 52.5v-35z' fill='none' stroke='%234a6891' stroke-width='0.8' stroke-opacity='0.08'/%3E%3C/svg%3E")`,
        backgroundSize:'70px 121px'
      }}/>
      
      {/* soft glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] pointer-events-none rounded-full" style={{ background:`radial-gradient(circle, ${MINTL}12 0%, transparent 70%)`, filter:'blur(60px)' }}/>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] pointer-events-none rounded-full" style={{ background:`radial-gradient(circle, ${SLATEL}10 0%, transparent 70%)`, filter:'blur(50px)' }}/>

      <div className="animate-slide-up text-center max-w-[1000px] w-full z-10">
        
        {/* Header */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-8 tracking-wider border"
             style={{ background: `${MINT}12`, borderColor: `${MINT}30`, color: MINT }}>
          <Compass size={16} /> TENTANG SAYA
        </div>
        
        {/* Middle Section: Story & Founder */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-8 text-left mb-8 max-md:gap-6">
          
          {/* Main Story Card */}
          <div className="animate-slide-up delay-100 p-12 rounded-3xl flex flex-col gap-6 bg-white/80 border relative overflow-hidden max-md:p-8"
               style={{ borderColor: `${SLATE}15`, backdropFilter: 'blur(20px)', boxShadow: `0 12px 40px ${SLATE}08` }}>
            
            <div className="absolute -top-12 -right-12 w-32 h-32 opacity-[0.03]" style={{ clipPath:HEX, background: SLATE }} />
            
            <div className="inline-block px-4 py-1.5 rounded-full text-xs font-extrabold tracking-widest w-fit text-white"
                 style={{ background: `linear-gradient(135deg, ${SLATEL}, ${SLATE})` }}>
              15 JUNI 2026
            </div>
            
            <p className="text-lg leading-relaxed m-0 font-medium max-md:text-base" style={{ color: `${SLATE}e0` }}>
              Semuanya dimulai tepat pada tanggal <strong>15 Juni 2026</strong>. Dengan semangat yang tinggi dan visi yang melampaui batas, <strong style={{ color: MINT }}>Pioniar Ecosystem</strong> lahir bukan sekadar sebagai platform biasa, melainkan sebagai sebuah mahakarya integrasi teknologi mutakhir.
            </p>
            <p className="text-lg leading-relaxed m-0 font-medium max-md:text-base" style={{ color: `${SLATE}e0` }}>
              Tujuan kami sangat jelas: menyederhanakan kompleksitas dunia nyata melalui sentuhan digital yang elegan. Kami menyediakan infrastruktur jaringan teknologi canggih tanpa batas yang seluruhnya terpusat dalam satu ruang kendali yang intuitif dan tak tertandingi.
            </p>
          </div>

          {/* Founder Card with Socials */}
          <div className="animate-slide-up delay-200 p-12 rounded-3xl flex flex-col items-center text-center gap-6 bg-white/80 border max-md:p-8"
               style={{ borderColor: `${SLATE}15`, backdropFilter: 'blur(20px)', boxShadow: `0 12px 40px ${SLATE}08` }}>
            
            <div className="w-24 h-24 p-[3px] relative" style={{ clipPath:HEX, background: `linear-gradient(135deg, ${MINT}, ${SLATE})`, filter:`drop-shadow(0 8px 20px ${MINT}40)` }}>
              <div className="w-full h-full bg-white flex items-center justify-center" style={{ clipPath:HEX }}>
                <User size={40} style={{ color: SLATEL }} />
              </div>
            </div>
            
            <div>
              <div className="text-[1.8rem] font-black tracking-tight mb-1 max-md:text-2xl" style={{ color: SLATE }}>Eep Ridwan Pauji</div>
              <div className="text-xs font-extrabold tracking-[0.2em] uppercase" style={{ color: MINT }}>Pendiri & Perancang Utama</div>
            </div>

            <div className="w-full h-px my-2" style={{ background: `linear-gradient(90deg, transparent, ${SLATE}20, transparent)` }}></div>

            {/* Social Links */}
            <div className="flex flex-col gap-3 w-full">
              <a href="https://instagram.com/eepridwanpauji" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-5 py-4 bg-white rounded-2xl no-underline transition-all duration-300 border hover:-translate-y-0.5 hover:shadow-md group"
                 style={{ borderColor: `${SLATE}15`, color: SLATE }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: `${SLATE}0f`, color: SLATEL }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </div>
                  <span className="font-bold text-[0.95rem]">@eepridwanpauji</span>
                </div>
                <ExternalLink size={16} style={{ color: `${SLATE}60` }} className="transition-colors group-hover:text-current" />
              </a>

              <a href="https://linkedin.com/in/eepridwanpauji" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-5 py-4 bg-white rounded-2xl no-underline transition-all duration-300 border hover:-translate-y-0.5 hover:shadow-md group"
                 style={{ borderColor: `${SLATE}15`, color: SLATE }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: `${SLATE}0f`, color: SLATEL }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                      <rect x="2" y="9" width="4" height="12"></rect>
                      <circle cx="4" cy="4" r="2"></circle>
                    </svg>
                  </div>
                  <span className="font-bold text-[0.95rem]">eepridwanpauji</span>
                </div>
                <ExternalLink size={16} style={{ color: `${SLATE}60` }} className="transition-colors group-hover:text-current" />
              </a>
            </div>

          </div>

        </div>

        {/* Bottom Section: Core Values Grid */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-8 max-md:gap-6">
           <div className="animate-slide-up delay-300 p-6 sm:px-8 sm:py-6 rounded-3xl flex items-center gap-6 text-left bg-white/70 border"
                style={{ borderColor: `${SLATE}15`, boxShadow: `0 4px 20px ${SLATE}05` }}>
              <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ clipPath:HEX, background: `${MINT}15`, color: MINT }}>
                <Zap size={22} />
              </div>
              <div>
                <div className="font-black text-[1.1rem] mb-1" style={{ color: SLATE }}>Kinerja Tinggi</div>
                <div className="text-sm font-semibold" style={{ color: SLATEL }}>Infrastruktur super cepat tanpa kompromi.</div>
              </div>
           </div>
           
           <div className="animate-slide-up delay-400 p-6 sm:px-8 sm:py-6 rounded-3xl flex items-center gap-6 text-left bg-white/70 border"
                style={{ borderColor: `${SLATE}15`, boxShadow: `0 4px 20px ${SLATE}05` }}>
              <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ clipPath:HEX, background: `${SLATE}10`, color: SLATE }}>
                <Shield size={22} />
              </div>
              <div>
                <div className="font-black text-[1.1rem] mb-1" style={{ color: SLATE }}>Keamanan Ekstra</div>
                <div className="text-sm font-semibold" style={{ color: SLATEL }}>Perlindungan privasi data tak tertembus.</div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
