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
    <div className="bg-hex-pattern" style={{ 
      width: '100%', 
      minHeight: 'calc(100vh - 80px)', 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1rem'
    }}>
      <div className="glass-panel animate-slide-up" style={{ 
        width: '100%', 
        maxWidth: '440px', 
        padding: '2.5rem', 
        borderRadius: '1rem', 
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)'
      }}>
        
        {status !== 'PAID' ? (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', color: '#0f172a', fontWeight: 800 }}>Selesaikan Pembayaran</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Silakan lakukan pembayaran sesuai instruksi di halaman Tripay. Jangan tutup halaman ini.
            </p>
            
            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
              <HexLoader size={48} color="#2563eb" />
              <p style={{ fontWeight: 600, color: '#1e40af' }}>Menunggu Pembayaran...</p>
            </div>
            
            <button onClick={() => navigate('/portal/buy')} className="btn btn-outline" style={{ width: '100%', padding: '0.75rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', borderRadius: '0.5rem' }}>
               <ArrowLeft size={16} /> Batal / Kembali
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', marginBottom: '1.5rem' }}>
              <CheckCircle size={32} />
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#16a34a', fontWeight: 800 }}>Pembayaran Berhasil!</h2>
            <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Voucher internet kamu telah aktif. Silakan gunakan kode di bawah ini untuk login.
            </p>
            
            <div style={{ padding: '1.5rem', backgroundColor: '#eff6ff', borderRadius: '0.75rem', border: '2px dashed #93c5fd', marginBottom: '2rem' }}>
              <p style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: 600, marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kode Voucher Kamu</p>
              <h1 style={{ fontSize: '2.5rem', color: '#1e40af', fontWeight: 900, letterSpacing: '0.1em' }}>{voucherCode}</h1>
            </div>
            
            <button onClick={() => navigate('/portal')} className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', fontWeight: 700, borderRadius: '0.5rem', backgroundColor: '#1e40af' }}>
              Masuk ke Internet Sekarang
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
