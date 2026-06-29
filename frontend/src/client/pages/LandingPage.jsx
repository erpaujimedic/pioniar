import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Lock, Coffee, Hexagon as HexIcon, Users, Zap, Clock, UserCheck, CheckCircle2, ArrowRight, Wifi, Globe } from 'lucide-react';

function useCountUp(target, dur = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!target) { setV(0); return; }
    let s = null;
    const tick = (ts) => { if (!s) s = ts; const p = Math.min((ts - s) / dur, 1); setV(Math.floor(p * target)); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }, [target]);
  return v;
}

const HEX = 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)';

/* ── brand palette ── */
const SLATE  = '#4a6891';
const SLATEL = '#607b9e';
const MINT   = '#5aab87';
const MINTL  = '#7bc4a0';
const BG     = '#f5f8fc';

export default function LandingPage() {
  const [searchParams] = useSearchParams();
  const [ok, setOk]   = useState(false);
  const [vis, setVis] = useState(false);
  const [d, setD]     = useState({ active_users:0, speed_mbps:0, uptime:'00:00:00', latest_login:'Belum ada' });
  const users = useCountUp(d.active_users);

  useEffect(() => { const t = setTimeout(() => setVis(true), 80); return () => clearTimeout(t); }, []);
  useEffect(() => { if (searchParams.get('status') === 'success') { setOk(true); setTimeout(() => setOk(false), 8000); } }, [searchParams]);
  useEffect(() => {
    const run = async () => { try { const r = await fetch((import.meta.env.VITE_API_BASE_URL||'')+'/api/wifi/monitor'); const j = await r.json(); if (j.status==='Success'&&j.data) setD(j.data); } catch {} };
    run(); const id=setInterval(run,5000); return ()=>clearInterval(id);
  }, []);

  const anim = (delay=0) => ({
    opacity: vis?1:0,
    transform: vis?'translateY(0)':'translateY(16px)',
    transition: `opacity .55s ease ${delay}s, transform .55s ease ${delay}s`,
  });

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background:BG }}>

      {/* subtle hex grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage:`url("data:image/svg+xml,%3Csvg width='70' height='121' viewBox='0 0 70 121' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M35 0l30.31 17.5v35L35 70 4.69 52.5v-35z' fill='none' stroke='%234a6891' stroke-width='0.8' stroke-opacity='0.08'/%3E%3C/svg%3E")`,
        backgroundSize:'70px 121px'
      }}/>

      {/* top-left mint glow */}
      <div className="absolute -top-20 -left-20 w-[450px] h-[350px] pointer-events-none rounded-full" style={{ background:`radial-gradient(circle, ${MINTL}22 0%, transparent 70%)`, filter:'blur(50px)' }}/>
      {/* bottom-right slate glow */}
      <div className="absolute -bottom-20 -right-20 w-[400px] h-[300px] pointer-events-none rounded-full" style={{ background:`radial-gradient(circle, ${SLATEL}18 0%, transparent 70%)`, filter:'blur(60px)' }}/>

      {/* success toast */}
      {ok && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border bg-white">
          <CheckCircle2 size={18} style={{ color:MINT }}/>
          <p className="m-0 text-sm font-bold" style={{ color:SLATE }}>Akses Internet Terbuka! Selamat berselancar.</p>
        </div>
      )}

      {/* ════ BODY ════ */}
      <div className="relative z-10 h-full flex flex-col">

        {/* HERO 2-col */}
        <div className="flex-1 flex flex-col md:flex-row items-center md:items-center justify-start md:justify-center min-h-0 px-4 md:px-12 gap-8 md:gap-8 pt-8 pb-12 md:pt-0 md:pb-0 overflow-y-auto hide-scrollbar w-full">

          {/* ── LEFT ── */}
          <div className="flex-1 max-w-[480px]" style={anim(0)}>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-4 text-[10px] font-black tracking-[0.22em] uppercase border"
              style={{ background:`${MINT}18`, borderColor:`${MINT}50`, color: MINT }}>
              <span className="w-1.5 h-1.5 rounded-full animate-ping inline-block" style={{ backgroundColor:MINT }}/>
              Pioniar Ecosystem
            </div>

            <h1 className="m-0 font-black leading-[1.14] tracking-tight" style={{ fontSize:'clamp(2rem,3.2vw,2.9rem)', color: SLATE }}>
              Satu Ekosistem<br/>
              untuk{' '}
              <span style={{ background:`linear-gradient(90deg,${MINT},${MINTL})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                Segala Kemungkinan
              </span>
            </h1>

            <p className="mt-3 text-sm leading-relaxed m-0" style={{ color:`${SLATE}bb` }}>
              Akses WiFi, kelola jaringan, dan nikmati layanan digital terintegrasi dalam satu platform cerdas.
            </p>

            {/* quick stats */}
            <div className="mt-4 flex items-center gap-5 flex-wrap">
              {[
                { icon:<Users size={12}/>, val:`${users}`, lbl:'user aktif' },
                { icon:<Zap size={12}/>, val:`${d.speed_mbps} Mbps`, lbl:'avg speed' },
                { icon:<Clock size={12}/>, val:d.uptime, lbl:'uptime' },
              ].map((s,i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs font-semibold" style={{ color:SLATEL }}>
                  <span style={{ color:MINT }}>{s.icon}</span>
                  <span className="font-black" style={{ color:SLATE }}>{s.val}</span>
                  <span style={{ color:`${SLATE}70` }}>{s.lbl}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-5 flex items-center gap-3">
              <Link to="/portal"
                className="no-underline inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg group"
                style={{ background:`linear-gradient(135deg,${MINT},${SLATE})`, boxShadow:`0 6px 20px ${MINT}40` }}>
                <Wifi size={16}/>
                Buka Portal WiFi
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1"/>
              </Link>
              <span className="text-xs font-medium" style={{ color:`${SLATE}65` }}>Login / beli voucher</span>
            </div>

            {/* Ecosystem pills */}
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border"
                style={{ background:`${MINT}15`, borderColor:`${MINT}50`, color:MINT }}>
                <div className="w-4 h-4 flex items-center justify-center" style={{ clipPath:HEX, background:`linear-gradient(135deg,${MINT},${SLATE})` }}>
                  <Wifi size={8} color="#fff"/>
                </div>
                WiFi <span className="w-1.5 h-1.5 rounded-full animate-pulse ml-0.5" style={{ backgroundColor:MINT }}/>
              </div>
              {[{l:'Farm',i:<HexIcon size={8}/>},{l:'Snack',i:<Coffee size={8}/>}].map(c=>(
                <div key={c.l} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border opacity-50 cursor-not-allowed select-none"
                  style={{ borderColor:`${SLATE}25`, color:SLATEL }}>
                  <div className="w-4 h-4 flex items-center justify-center" style={{ clipPath:HEX, background:`${SLATE}20` }}>{c.i}</div>
                  {c.l} <span className="text-[8px] px-1 rounded font-black" style={{ background:`${SLATE}12`, color:`${SLATE}80` }}>SOON</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Honeycomb cluster ── */}
          <div className="flex-1 flex items-center justify-center relative w-full transform scale-75 md:scale-100 mt-4 md:mt-0" style={anim(0.1)}>

            {/*
              Honeycomb grid — 3-hex row top, then main hex center, then 3-hex row bottom
              We position each using absolute + transform
            */}
            <div className="relative" style={{ width:340, height:340 }}>

              {/* === MAIN HEX (center) — WiFi portal === */}
              <div className="absolute" style={{ top:'50%', left:'50%', transform:'translate(-50%,-50%)' }}>
                <Link to="/portal" className="no-underline group block">
                  {/* ping ring */}
                  <div className="absolute inset-0 animate-ping opacity-[0.08]"
                    style={{ clipPath:HEX, background:`linear-gradient(135deg,${MINT},${SLATE})`, animationDuration:'2.8s', borderRadius:0 }}/>
                  {/* glow */}
                  <div className="absolute -inset-6 opacity-0 group-hover:opacity-100 transition-all duration-700 rounded-full"
                    style={{ background:`radial-gradient(circle,${MINT}30,transparent 65%)`, filter:'blur(16px)' }}/>

                  <div className="relative w-36 h-36 transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-1"
                    style={{ clipPath:HEX, filter:`drop-shadow(0 12px 32px ${MINT}40)` }}>
                    <div className="absolute inset-0 p-[3.5px]" style={{ clipPath:HEX, background:`linear-gradient(145deg,${SLATE},${MINT},${MINTL})` }}>
                      <div className="w-full h-full flex items-center justify-center relative"
                        style={{ clipPath:HEX, background:`linear-gradient(145deg,#ffffff,#edf5f1)` }}>
                        <div className="absolute inset-0" style={{ clipPath:HEX, background:`radial-gradient(circle at 40% 35%,${MINT}20,transparent 55%)` }}/>
                        <Lock size={52} strokeWidth={1.3} className="relative z-10 transition-all duration-500 group-hover:scale-110"
                          style={{ color:SLATE, filter:`drop-shadow(0 4px 10px ${MINT}60)` }}/>
                      </div>
                    </div>
                  </div>

                  <div className="text-center mt-2">
                    <div className="text-sm font-black" style={{ color:SLATE }}>WiFi Portal</div>
                    <div className="text-[10px] font-black tracking-[0.25em] uppercase" style={{ color:MINT }}>Aktif</div>
                  </div>
                </Link>
              </div>

              {/* === SURROUNDING mini hexes (honeycomb positions) === */}
              {/* Top-left */}
              <div className="absolute" style={{ top:'14%', left:'10%' }}>
                <div className="w-[78px] h-[78px] flex items-center justify-center relative group cursor-default select-none"
                  style={{ clipPath:HEX, background:'white', boxShadow:`0 4px 16px ${SLATE}15` }}>
                  <div className="absolute inset-0" style={{ clipPath:HEX, border:`2px solid ${SLATE}15` }}/>
                  <div className="flex flex-col items-center gap-1">
                    <Users size={18} style={{ color:SLATEL }}/>
                    <span className="text-sm font-black leading-none" style={{ color:SLATE }}>{users}</span>
                    <span className="text-[7px] font-bold uppercase tracking-wider" style={{ color:`${SLATE}70` }}>Users</span>
                  </div>
                </div>
              </div>

              {/* Top-right */}
              <div className="absolute" style={{ top:'14%', right:'10%' }}>
                <div className="w-[78px] h-[78px] flex items-center justify-center"
                  style={{ clipPath:HEX, background:'white', boxShadow:`0 4px 16px ${SLATE}15` }}>
                  <div className="flex flex-col items-center gap-1">
                    <Zap size={18} style={{ color:MINT }}/>
                    <span className="text-sm font-black leading-none" style={{ color:MINT }}>{d.speed_mbps}</span>
                    <span className="text-[7px] font-bold uppercase tracking-wider" style={{ color:`${MINT}99` }}>Mbps</span>
                  </div>
                </div>
              </div>

              {/* Left */}
              <div className="absolute" style={{ top:'50%', left:'0%', transform:'translateY(-50%)' }}>
                <div className="w-[70px] h-[70px] flex items-center justify-center opacity-40 cursor-not-allowed select-none"
                  style={{ clipPath:HEX, background:'white', boxShadow:`0 2px 10px ${SLATE}10` }}>
                  <div className="flex flex-col items-center gap-1">
                    <HexIcon size={16} style={{ color:SLATEL }}/>
                    <span className="text-[8px] font-black uppercase" style={{ color:SLATEL }}>Farm</span>
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className="absolute" style={{ top:'50%', right:'0%', transform:'translateY(-50%)' }}>
                <div className="w-[70px] h-[70px] flex items-center justify-center opacity-40 cursor-not-allowed select-none"
                  style={{ clipPath:HEX, background:'white', boxShadow:`0 2px 10px ${SLATE}10` }}>
                  <div className="flex flex-col items-center gap-1">
                    <Coffee size={16} style={{ color:SLATEL }}/>
                    <span className="text-[8px] font-black uppercase" style={{ color:SLATEL }}>Snack</span>
                  </div>
                </div>
              </div>

              {/* Bottom-left */}
              <div className="absolute" style={{ bottom:'14%', left:'10%' }}>
                <div className="w-[78px] h-[78px] flex items-center justify-center"
                  style={{ clipPath:HEX, background:'white', boxShadow:`0 4px 16px ${SLATE}15` }}>
                  <div className="flex flex-col items-center gap-1">
                    <Clock size={18} style={{ color:MINTL }}/>
                    <span className="text-[10px] font-black leading-none font-mono" style={{ color:MINTL }}>{d.uptime.slice(0,5)}</span>
                    <span className="text-[7px] font-bold uppercase tracking-wider" style={{ color:`${MINTL}aa` }}>Uptime</span>
                  </div>
                </div>
              </div>

              {/* Bottom-right */}
              <div className="absolute" style={{ bottom:'14%', right:'10%' }}>
                <div className="w-[78px] h-[78px] flex items-center justify-center"
                  style={{ clipPath:HEX, background:'white', boxShadow:`0 4px 16px ${SLATE}15` }}>
                  <div className="flex flex-col items-center gap-1">
                    <UserCheck size={18} style={{ color:SLATEL }}/>
                    <span className="text-[9px] font-bold leading-none truncate max-w-[54px] text-center" style={{ color:SLATE }}>{d.latest_login}</span>
                    <span className="text-[7px] font-bold uppercase tracking-wider" style={{ color:`${SLATE}70` }}>Login</span>
                  </div>
                </div>
              </div>

              {/* Connecting lines (SVG overlay) */}
              <svg className="absolute inset-0 pointer-events-none" width="340" height="340" style={{ opacity:.18 }}>
                <line x1="170" y1="170" x2="83" y2="95"  stroke={SLATE} strokeWidth="1.5" strokeDasharray="4 3"/>
                <line x1="170" y1="170" x2="257" y2="95"  stroke={MINT}  strokeWidth="1.5" strokeDasharray="4 3"/>
                <line x1="170" y1="170" x2="34"  y2="170" stroke={SLATE} strokeWidth="1.5" strokeDasharray="4 3"/>
                <line x1="170" y1="170" x2="306" y2="170" stroke={SLATE} strokeWidth="1.5" strokeDasharray="4 3"/>
                <line x1="170" y1="170" x2="83"  y2="248" stroke={MINT}  strokeWidth="1.5" strokeDasharray="4 3"/>
                <line x1="170" y1="170" x2="257" y2="248" stroke={SLATE} strokeWidth="1.5" strokeDasharray="4 3"/>
              </svg>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
