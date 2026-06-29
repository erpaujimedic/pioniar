import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, Loader2, ArrowLeft } from 'lucide-react';
import HexLoader from '../../components/HexLoader';

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const merchantRef = searchParams.get('ref');
  const navigate = useNavigate();
  
  const [status, setStatus] = useState('PENDING'); // PENDING, PAID, FAILED
  const [voucherCode, setVoucherCode] = useState('');
  
  useEffect(() => {
    if (!merchantRef) {
      navigate('/portal/buy');
      return;
    }
    
    // Polling status pembayaran setiap 3 detik
    const checkStatus = async () => {
      try {
        const response = await fetch((import.meta.env.VITE_API_BASE_URL || '') + `/api/payment/status?ref=${merchantRef}`);
        if (response.ok) {
          const data = await response.json();
          if (data.payment_status === 'PAID') {
            setStatus('PAID');
            setVoucherCode(data.username);
          }
        }
      } catch (e) {
        console.error("Error polling status", e);
      }
    };
    
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    
    return () => clearInterval(interval);
  }, [merchantRef, navigate]);

  return (
    <div className="bg-hex-pattern w-full min-h-[calc(100vh-80px)] flex items-center justify-center p-4 max-md:py-8">
      <div className="glass-panel animate-slide-up w-full max-w-[440px] p-10 rounded-2xl bg-white/98 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] max-md:p-8">
        
        {status !== 'PAID' ? (
          <div className="text-center">
            <h2 className="text-[1.35rem] mb-2 text-slate-900 font-extrabold tracking-tight">Selesaikan Pembayaran</h2>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Silakan lakukan pembayaran sesuai instruksi di halaman Tripay. Jangan tutup halaman ini.
            </p>
            
            <div className="p-8 flex flex-col items-center gap-4 bg-slate-50 rounded-xl mb-6 border border-slate-100">
              <HexLoader size={48} color="#2563eb" />
              <p className="font-bold text-blue-700 m-0">Menunggu Pembayaran...</p>
            </div>
            
            <button onClick={() => navigate('/portal/buy')} className="w-full py-3 flex justify-center items-center gap-2 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 hover:shadow-sm transition-all cursor-pointer">
               <ArrowLeft size={16} /> Batal / Kembali
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-6 shadow-sm">
              <CheckCircle size={32} />
            </div>
            <h2 className="text-2xl mb-2 text-green-600 font-extrabold tracking-tight">Pembayaran Berhasil!</h2>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Voucher internet kamu telah aktif. Silakan gunakan kode di bawah ini untuk login.
            </p>
            
            <div className="p-6 bg-blue-50 rounded-xl border-2 border-dashed border-blue-300 mb-8">
              <p className="text-xs text-blue-600 font-bold mb-1 uppercase tracking-wider">Kode Voucher Kamu</p>
              <h1 className="text-[2.5rem] text-blue-800 font-black tracking-[0.1em] m-0">{voucherCode}</h1>
            </div>
            
            <button onClick={() => navigate('/portal')} className="w-full py-3.5 text-base font-bold rounded-lg bg-blue-700 text-white hover:bg-blue-600 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(30,64,175,0.25)] transition-all cursor-pointer border-none">
              Masuk ke Internet Sekarang
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
