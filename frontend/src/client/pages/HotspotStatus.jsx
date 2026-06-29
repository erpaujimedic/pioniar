import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Clock } from 'lucide-react';

function SisaWaktuRenderer({ username }) {
  const [sisa, setSisa] = useState('Mengambil data...');

  useEffect(() => {
    let mounted = true;
    const fetchSisa = async () => {
      try {
        const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/wifi/vouchers');
        const vouchers = await res.json();
        const myVoucher = vouchers.find(v => v.code === username);
        if (myVoucher && mounted) {
          if (!myVoucher.limit_uptime) {
             setSisa('Unlimited (Tanpa Batas)');
          } else {
             setSisa(`Max. ${myVoucher.limit_uptime}`);
          }
        }
      } catch (e) {
        if (mounted) setSisa('Gagal cek batas waktu');
      }
    };
    fetchSisa();
    return () => { mounted = false; };
  }, [username]);

  return <span className="flex items-center gap-1.5"><Clock size={16} /> {sisa}</span>;
}

export default function HotspotStatus() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedSession = localStorage.getItem('hotspot_session');
    if (savedSession) {
      setSession(JSON.parse(savedSession));
    }
    setLoading(false);
  }, []);

  if (loading) return null;

  if (!session) {
    return <Navigate to="/portal" replace />;
  }

  return (
    <div className="bg-hex-pattern w-full min-h-[calc(100vh-80px)] flex items-center justify-center p-4 overflow-hidden relative max-md:py-12">
       <div className="glass-panel animate-slide-up w-full max-w-[380px] p-10 rounded-2xl relative z-10 bg-white/98 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] max-md:p-8">
          
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <span className="font-heading text-2xl font-extrabold text-slate-900 tracking-tight">
              STATUS <span className="bg-gradient-to-br from-green-500 to-green-600 bg-clip-text text-transparent">KONEKSI</span>
            </span>
          </div>

          <div className="bg-slate-100 p-6 rounded-xl mb-6 text-center shadow-inner">
             <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
             </div>
             <h3 className="m-0 mb-1.5 text-slate-900 text-xl font-bold">{session.username}</h3>
             <p className="m-0 text-green-600 text-sm font-semibold">Terkoneksi ke Internet</p>
             
             <div className="grid grid-cols-2 gap-2.5 mt-6 text-left">
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                  <div className="text-xs text-slate-500 font-semibold mb-0.5">Uptime</div>
                  <div className="text-sm text-slate-900 font-bold">{session.uptime}</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                  <div className="text-xs text-slate-500 font-semibold mb-0.5">Download</div>
                  <div className="text-sm text-slate-900 font-bold">{session.bytes_out}</div>
                </div>
             </div>

             <div className="bg-red-500/5 border border-red-500/20 p-3 rounded-lg mt-2.5 text-left">
                <div className="text-[10px] text-red-500 font-bold uppercase tracking-wider mb-1">Batas Waktu Akun</div>
                <div className="text-base text-red-700 font-extrabold">
                  <SisaWaktuRenderer username={session.username} />
                </div>
             </div>
          </div>

          <div className="flex flex-col gap-3">
            <a href="http://pioniar.wifi/status" className="w-full py-3 text-base font-semibold rounded-lg bg-slate-50 text-slate-700 border border-slate-300 text-center no-underline hover:bg-slate-100 hover:shadow-sm transition-all cursor-pointer box-border">
              🔄 Refresh Status
            </a>
            <a href="http://pioniar.wifi/logout" className="w-full py-3 text-base font-semibold rounded-lg bg-red-500 text-white border-none text-center no-underline hover:bg-red-600 hover:shadow-[0_4px_12px_rgba(239,68,68,0.2)] hover:-translate-y-px transition-all cursor-pointer box-border">
              Disconnect / Logout
            </a>
          </div>
       </div>
    </div>
  );
}
