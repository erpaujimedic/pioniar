import React, { useState, useEffect } from 'react';
import { ArrowLeft, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function VoucherShop() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const response = await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/wifi/profiles');
        if (response.ok) {
          const data = await response.json();
          // Filter default dan rapikan data
          const formattedPlans = data
            .filter(p => p.name !== 'default')
            .map((p, index) => {
              // Parse speed dari rate_limit (contoh 5M/5M jadi 5 Mbps)
              let speedStr = 'Kecepatan Normal';
              if (p.rate_limit) {
                 const rx = p.rate_limit.split('/')[0];
                 speedStr = `Up to ${rx.replace('M', ' Mbps').replace('k', ' Kbps')}`;
              }
              
              // Coba tebak durasi dari nama paket
              let durationStr = 'Masa Aktif Standar';
              const nameLower = p.name.toLowerCase();
              if (nameLower.includes('jam')) durationStr = 'Sesuai Jam';
              else if (nameLower.includes('hari')) durationStr = '1 Hari';
              else if (nameLower.includes('minggu')) durationStr = '7 Hari';
              else if (nameLower.includes('bulan')) durationStr = '30 Hari';

              return {
                id: p.id || Math.random().toString(),
                name: p.name,
                duration: durationStr,
                price: p.price ? `Rp ${parseInt(p.price).toLocaleString('id-ID')}` : 'Rp 0',
                speed: speedStr,
                popular: index === 0 // Jadikan paket pertama sebagai Paling Laris
              };
            });
          setPlans(formattedPlans);
        }
      } catch (error) {
        console.error("Error fetching profiles:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, []);

  const handleSelect = (id) => {
    setSelectedPlanId(id);
  };

  const handlePayment = async () => {
    if (!selectedPlanId) return;
    const selectedPlan = plans.find(p => p.id === selectedPlanId);
    
    try {
      setLoading(true);
      const priceInt = parseInt(selectedPlan.price.replace(/[^0-9]/g, ''));
      const response = await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_name: selectedPlan.name,
          price: priceInt
        })
      });
      
      const data = await response.json();
      if (data.status === 'Success') {
        // Arahkan user ke halaman Tripay Checkout di tab baru (opsional) atau halaman checkout lokal kita
        window.open(data.checkout_url, '_blank');
        window.location.href = `/portal/checkout?ref=${data.merchant_ref}`;
      } else {
        alert("Gagal memproses pembayaran: " + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert("Error menghubungi server: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-hex-pattern" style={{ 
      width: '100%', 
      minHeight: 'calc(100vh - 80px)', 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1rem',
      position: 'relative'
    }}>
      
      {/* Watermark Background Logo */}
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', maxWidth: '800px', height: '100%', zIndex: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
         <img src="/logo-icon.png" alt="" style={{ height: '400px', width: 'auto', opacity: 0.03, transform: 'rotate(-15deg)', filter: 'grayscale(100%)' }} />
      </div>

      <div className="glass-panel animate-slide-up" style={{ 
        width: '100%', 
        maxWidth: '440px', 
        padding: '2.5rem', 
        borderRadius: '1rem', 
        position: 'relative', 
        zIndex: 1, 
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)'
      }}>
        
        <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
          <h2 style={{ fontSize: '1.35rem', marginBottom: '0.25rem', color: '#0f172a', fontWeight: 800 }}>Beli Voucher Pioniar</h2>
          <p style={{ color: '#475569', fontSize: '0.85rem', fontWeight: 500 }}>Pilih paket internet sesuai kebutuhanmu.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              Memuat daftar paket...
            </div>
          ) : plans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', backgroundColor: '#f8fafc', borderRadius: '0.5rem' }}>
              Belum ada paket tersedia.
            </div>
          ) : (
            plans.map(plan => {
              const isSelected = selectedPlanId === plan.id;
              return (
              <div key={plan.id} onClick={() => handleSelect(plan.id)} style={{ 
                padding: '1.25rem 1.5rem', 
                borderRadius: '0.75rem', 
                border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.15)' : 'none',
                transform: isSelected ? 'translateY(-2px)' : 'none'
              }}>
                {plan.popular && (
                  <span style={{ position: 'absolute', top: 0, right: 0, backgroundColor: isSelected ? '#2563eb' : '#94a3b8', color: 'white', fontSize: '0.7rem', padding: '0.3rem 0.7rem', borderRadius: '0 0.65rem 0 0.65rem', fontWeight: 700 }}>
                    Paling Laris
                  </span>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <h3 style={{ fontSize: '1.1rem', color: '#0f172a', fontWeight: 800 }}>{plan.name}</h3>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#2563eb' }}>{plan.price}</span>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>
                  Aktif selama {plan.duration} &bull; {plan.speed}
                </p>
              </div>
            )})
          )}
        </div>

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
          <button onClick={handlePayment} type="button" disabled={loading || plans.length === 0 || !selectedPlanId} className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', fontWeight: 700, borderRadius: '0.5rem', backgroundColor: loading || plans.length === 0 || !selectedPlanId ? '#94a3b8' : '#1e40af', border: 'none', boxShadow: '0 4px 10px rgba(30, 64, 175, 0.2)', cursor: loading || plans.length === 0 || !selectedPlanId ? 'not-allowed' : 'pointer' }}>
            <Wallet size={18} /> Lanjutkan Pembayaran
          </button>
        </div>
      </div>
    </div>
  );
}
