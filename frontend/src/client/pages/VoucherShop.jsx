import React, { useState, useEffect } from 'react';
import { ArrowLeft, Wallet, Wifi } from 'lucide-react';
import { Link } from 'react-router-dom';

/* ── brand palette ── */
const SLATE  = '#4a6891';
const SLATEL = '#607b9e';
const MINT   = '#5aab87';
const MINTL  = '#7bc4a0';
const BG     = '#f5f8fc';
const HEX = 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)';

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
    <div className="w-full min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4 relative overflow-hidden max-md:py-8" style={{ background: BG }}>
      
      {/* subtle hex grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage:`url("data:image/svg+xml,%3Csvg width='70' height='121' viewBox='0 0 70 121' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M35 0l30.31 17.5v35L35 70 4.69 52.5v-35z' fill='none' stroke='%234a6891' stroke-width='0.8' stroke-opacity='0.08'/%3E%3C/svg%3E")`,
        backgroundSize:'70px 121px'
      }}/>

      {/* soft glows */}
      <div className="absolute top-10 left-10 w-[300px] h-[300px] pointer-events-none rounded-full" style={{ background:`radial-gradient(circle, ${MINTL}12 0%, transparent 70%)`, filter:'blur(40px)' }}/>
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] pointer-events-none rounded-full" style={{ background:`radial-gradient(circle, ${SLATEL}10 0%, transparent 70%)`, filter:'blur(40px)' }}/>

      <div className="animate-slide-up w-full max-w-[360px] p-6 md:p-8 rounded-3xl relative z-10 bg-white/95 shadow-[0_12px_40px_rgba(74,104,145,0.12)] border flex flex-col" style={{ borderColor: `${SLATE}15`, backdropFilter: 'blur(20px)' }}>
        
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 mb-3 flex items-center justify-center p-[2px]" style={{ clipPath:HEX, background:`linear-gradient(135deg, ${SLATE}, ${MINT})`, filter:`drop-shadow(0 4px 8px ${MINT}30)` }}>
             <div className="w-full h-full flex items-center justify-center bg-white" style={{ clipPath:HEX }}>
                <Wallet size={20} style={{ color: MINT }} />
             </div>
          </div>
          <h2 className="text-[1.35rem] mb-1 font-black tracking-tight" style={{ color: SLATE }}>Beli Voucher <span style={{ color: MINT }}>Pioniar</span></h2>
          <p className="text-[11px] font-bold m-0 uppercase tracking-widest" style={{ color: SLATEL }}>Pilih Paket Internet</p>
        </div>

        <div className="flex flex-col gap-3">
          {loading ? (
            <div className="text-center p-8 font-bold text-sm" style={{ color: SLATEL }}>
              Memuat daftar paket...
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center p-8 rounded-xl font-bold text-sm border" style={{ background: `${SLATE}05`, borderColor: `${SLATE}15`, color: SLATEL }}>
              Belum ada paket tersedia.
            </div>
          ) : (
            plans.map(plan => {
              const isSelected = selectedPlanId === plan.id;
              return (
              <div 
                key={plan.id} 
                onClick={() => handleSelect(plan.id)} 
                className={`p-4 rounded-2xl border-2 relative cursor-pointer transition-all duration-300 group ${
                  isSelected ? '-translate-y-0.5' : 'bg-white hover:-translate-y-px'
                }`}
                style={{
                  borderColor: isSelected ? MINT : `${SLATE}15`,
                  background: isSelected ? `${MINT}08` : 'white',
                  boxShadow: isSelected ? `0 4px 16px ${MINT}20` : 'none'
                }}
                onMouseEnter={(e) => {
                  if(!isSelected) e.currentTarget.style.borderColor = MINTL;
                }}
                onMouseLeave={(e) => {
                  if(!isSelected) e.currentTarget.style.borderColor = `${SLATE}15`;
                }}
              >
                {plan.popular && (
                  <span className="absolute top-0 right-0 text-[9px] px-3 py-1 rounded-bl-xl rounded-tr-xl font-black uppercase tracking-wider text-white"
                    style={{ background: isSelected ? `linear-gradient(135deg, ${MINT}, ${SLATE})` : SLATEL }}>
                    Paling Laris
                  </span>
                )}
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-[1.1rem] font-black m-0" style={{ color: SLATE }}>{plan.name}</h3>
                  <span className="text-[1.1rem] font-black" style={{ color: MINT }}>{plan.price}</span>
                </div>
                <p className="text-[0.8rem] font-bold m-0" style={{ color: SLATEL }}>
                  Aktif {plan.duration} &bull; {plan.speed}
                </p>
              </div>
            )})
          )}
        </div>

        <div className="mt-6 pt-5 border-t" style={{ borderColor: `${SLATE}15` }}>
          <button 
            onClick={handlePayment} 
            type="button" 
            disabled={loading || plans.length === 0 || !selectedPlanId} 
            className={`w-full py-3.5 text-sm flex gap-2 justify-center font-bold rounded-xl transition-all border-none ${
              loading || plans.length === 0 || !selectedPlanId 
                ? 'cursor-not-allowed shadow-none' 
                : 'hover:-translate-y-0.5 cursor-pointer group'
            }`}
            style={
              loading || plans.length === 0 || !selectedPlanId
              ? { background: `${SLATE}15`, color: `${SLATE}50` }
              : { background: `linear-gradient(135deg, ${MINT}, ${SLATE})`, color: 'white', boxShadow: `0 8px 20px ${MINT}35` }
            }
          >
            <Wallet size={18} className={!(loading || plans.length === 0 || !selectedPlanId) ? "group-hover:scale-110 transition-transform" : ""} /> 
            Lanjutkan Pembayaran
          </button>
        </div>
      </div>
    </div>
  );
}
