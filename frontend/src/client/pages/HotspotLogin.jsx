import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, Navigate, useNavigate } from 'react-router-dom';
import { AlertCircle, Wifi, Lock } from 'lucide-react';

/* ── brand palette ── */
const SLATE  = '#4a6891';
const SLATEL = '#607b9e';
const MINT   = '#5aab87';
const MINTL  = '#7bc4a0';
const BG     = '#f5f8fc';
const HEX = 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)';

export default function HotspotLogin() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loginMode, setLoginMode] = useState('voucher'); // 'voucher' atau 'member'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [session, setSession] = useState(null);

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      setErrorMsg(error);
    }

    const status = searchParams.get('status');
    const user = searchParams.get('username');
    
    if (status === 'logged_out') {
      localStorage.removeItem('hotspot_session');
      setSession(null);
      setSearchParams({});
    } else if (status === 'success' && user) {
      const newSession = {
        username: user,
        uptime: searchParams.get('uptime') || '0s',
        bytes_in: searchParams.get('bytes_in') || '0B',
        bytes_out: searchParams.get('bytes_out') || '0B',
      };
      localStorage.setItem('hotspot_session', JSON.stringify(newSession));
      setSession(newSession);
      navigate('/portalinformation', { replace: true });
    } else {
      const savedSession = localStorage.getItem('hotspot_session');
      if (savedSession) {
        setSession(JSON.parse(savedSession));
      } else {
        // Redirect Bounce Method:
        // Jika tidak ada parameter (artinya user buka manual di browser)
        // Kita redirect ke status mikroTik untuk cek apakah mereka sbnarnya sudah login
        const mac = searchParams.get('mac');
        if (!mac && !error && !status) {
            window.location.href = 'http://pioniar.wifi/status';
        }
      }
    }
  }, [searchParams, setSearchParams, navigate]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!username) return;
    
    const passValue = loginMode === 'voucher' ? username : password;
    
    const dstUrl = encodeURIComponent('https://pioniar.com/portalinformation?status=success');
    
    let loginUrl = searchParams.get('loginUrl');
    let target = loginUrl ? loginUrl.replace('/login', '/submit.html') : 'http://pioniar.wifi/submit.html';
    
    if (target.startsWith('https://')) {
        target = target.replace('https://', 'http://');
    }
    
    window.location.href = `${target}?username=${username}&password=${passValue}&dst=${dstUrl}`;
  };

  if (session) {
    return <Navigate to="/portalinformation" replace />;
  }

  return (
    <div className="w-full min-h-[calc(100dvh-65px)] flex items-center justify-start md:justify-center flex-col p-4 overflow-y-auto hide-scrollbar relative max-md:pt-8 max-md:pb-24" style={{ background: BG }}>
      
      {/* subtle hex grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage:`url("data:image/svg+xml,%3Csvg width='70' height='121' viewBox='0 0 70 121' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M35 0l30.31 17.5v35L35 70 4.69 52.5v-35z' fill='none' stroke='%234a6891' stroke-width='0.8' stroke-opacity='0.08'/%3E%3C/svg%3E")`,
        backgroundSize:'70px 121px'
      }}/>

      {/* soft glows */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] pointer-events-none rounded-full" style={{ background:`radial-gradient(circle, ${MINTL}15 0%, transparent 70%)`, filter:'blur(40px)' }}/>
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] pointer-events-none rounded-full" style={{ background:`radial-gradient(circle, ${SLATEL}12 0%, transparent 70%)`, filter:'blur(50px)' }}/>

      <div className="animate-slide-up w-full max-w-[360px] p-6 md:p-8 rounded-3xl relative z-10 bg-white/95 shadow-[0_12px_40px_rgba(74,104,145,0.12)] border flex flex-col" style={{ borderColor: `${SLATE}15`, backdropFilter: 'blur(20px)' }}>
        
        {/* Decorative top logo */}
        <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center relative shrink-0">
           <img src="/logo-icon.png" alt="Pioniar" className="w-full h-full object-contain drop-shadow-[0_4px_10px_rgba(90,171,135,0.3)]" />
        </div>

        <div className="text-center mb-6">
          <h2 className="font-black text-xl tracking-tight m-0" style={{ color: SLATE }}>
            PIONIAR <span style={{ color: MINT }}>NETWORK</span>
          </h2>
          <p className="text-[10px] font-bold mt-1 uppercase tracking-widest" style={{ color: SLATEL }}>Portal Akses Internet</p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-500 py-3 px-4 mb-6 rounded-lg flex items-start gap-2 shadow-sm">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <p className="m-0 text-sm text-red-700 font-medium">{errorMsg}</p>
          </div>
        )}

        {/* Toggle Mode */}
        <div className="flex rounded-xl p-1 mb-5" style={{ background: `${SLATE}0d`, border: `1px solid ${SLATE}15` }}>
          <button 
            type="button"
            onClick={() => setLoginMode('voucher')}
            className={`flex-1 py-2 px-2 rounded-lg text-[13px] font-bold transition-all duration-300 cursor-pointer ${
              loginMode === 'voucher' ? 'bg-white shadow-sm' : 'bg-transparent'
            }`}
            style={{ color: loginMode === 'voucher' ? MINT : SLATEL }}
          >
            Voucher
          </button>
          <button 
            type="button"
            onClick={() => setLoginMode('member')}
            className={`flex-1 py-2 px-2 rounded-lg text-[13px] font-bold transition-all duration-300 cursor-pointer ${
              loginMode === 'member' ? 'bg-white shadow-sm' : 'bg-transparent'
            }`}
            style={{ color: loginMode === 'member' ? MINT : SLATEL }}
          >
            Member
          </button>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          
          {loginMode === 'voucher' ? (
            <div>
              <label className="block text-[11px] font-bold mb-1.5 uppercase tracking-wide" style={{ color: SLATEL }}>Kode Voucher</label>
              <input 
                type="text" 
                placeholder="Contoh: PION-1234" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full py-2.5 px-3 text-sm bg-white border rounded-xl text-center tracking-widest font-bold focus:outline-none transition-all placeholder:font-normal"
                style={{ borderColor: `${SLATE}20`, color: SLATE }}
                onFocus={(e) => { e.target.style.borderColor = MINT; e.target.style.boxShadow = `0 0 0 3px ${MINT}20`; }}
                onBlur={(e) => { e.target.style.borderColor = `${SLATE}20`; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-[11px] font-bold mb-1.5 uppercase tracking-wide" style={{ color: SLATEL }}>Username</label>
                <input 
                  type="text" 
                  placeholder="Masukkan username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full py-2.5 px-3 text-sm bg-white border rounded-xl font-semibold focus:outline-none transition-all"
                  style={{ borderColor: `${SLATE}20`, color: SLATE }}
                  onFocus={(e) => { e.target.style.borderColor = MINT; e.target.style.boxShadow = `0 0 0 3px ${MINT}20`; }}
                  onBlur={(e) => { e.target.style.borderColor = `${SLATE}20`; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1.5 uppercase tracking-wide" style={{ color: SLATEL }}>Password</label>
                <input 
                  type="password" 
                  placeholder="Masukkan password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full py-2.5 px-3 text-sm bg-white border rounded-xl font-semibold focus:outline-none transition-all"
                  style={{ borderColor: `${SLATE}20`, color: SLATE }}
                  onFocus={(e) => { e.target.style.borderColor = MINT; e.target.style.boxShadow = `0 0 0 3px ${MINT}20`; }}
                  onBlur={(e) => { e.target.style.borderColor = `${SLATE}20`; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </>
          )}

          <button type="submit" className="w-full py-3 text-sm font-bold mt-1 rounded-xl text-white transition-all cursor-pointer border-none flex items-center justify-center gap-2 hover:-translate-y-0.5 group"
            style={{ background: `linear-gradient(135deg, ${MINT}, ${SLATE})`, boxShadow: `0 6px 16px ${MINT}30` }}>
            <Lock size={16} className="group-hover:scale-110 transition-transform" />
            Mulai Internetan
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/portal/buy" className="text-[13px] no-underline font-bold transition-colors inline-block"
             style={{ color: SLATEL }}
             onMouseEnter={(e) => e.target.style.color = MINT}
             onMouseLeave={(e) => e.target.style.color = SLATEL}>
            Belum punya voucher? Beli Online
          </Link>
        </div>
      </div>
    </div>
  );
}
