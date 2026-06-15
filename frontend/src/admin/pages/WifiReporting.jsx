import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LineChart, DollarSign, Calendar, RefreshCw, Loader2, Search, TrendingUp, Users } from 'lucide-react';

export default function WifiReporting() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Bulan Ini'); // 'Hari Ini', 'Minggu Ini', 'Bulan Ini', 'Tahun Ini', 'Semua'
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/wifi/sales');
      if (res.ok) {
        const data = await res.json();
        setSales(data);
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Koneksi ke server gagal' });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSales();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const filterDataByDate = (data) => {
    if (filter === 'Semua') return data;
    
    const now = new Date();
    return data.filter(item => {
      const date = new Date(item.sold_at);
      if (filter === 'Hari Ini') {
        return date.toDateString() === now.toDateString();
      } else if (filter === 'Minggu Ini') {
        const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
        return date >= firstDay;
      } else if (filter === 'Bulan Ini') {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      } else if (filter === 'Tahun Ini') {
        return date.getFullYear() === now.getFullYear();
      }
      return true;
    });
  };

  const filteredSalesByDate = filterDataByDate(sales);
  const searchedSales = filteredSalesByDate.filter(s => 
    (s.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.plan || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = filteredSalesByDate.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  const totalVouchers = filteredSalesByDate.length;

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    try {
        const date = new Date(isoString);
        return date.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' });
    } catch { return isoString; }
  };

  return (
    <div className="animate-fade-in" style={{ position: 'relative' }}>

      {/* Main Container */}
      <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 105px)', gap: '0.5rem' }}>
        
        {/* Sleek KPI Row */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div className="glass-panel" style={{ flex: 1, borderRadius: '0.75rem', border: '1px solid var(--pioniar-border)', padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#ffffff' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={16} />
            </div>
            <div>
              <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--pioniar-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Penjualan ({filter})</p>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--pioniar-text)', marginTop: '0.1rem' }}>{formatRupiah(totalRevenue)}</h2>
            </div>
          </div>
          
          <div className="glass-panel" style={{ flex: 1, borderRadius: '0.75rem', border: '1px solid var(--pioniar-border)', padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#ffffff' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} />
            </div>
            <div>
              <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--pioniar-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Voucher Terjual ({filter})</p>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--pioniar-text)', marginTop: '0.1rem' }}>{totalVouchers} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--pioniar-text-muted)' }}>user</span></h2>
            </div>
          </div>
        </div>

        {/* Top Control Bar Card */}
        <div className="glass-panel" style={{ borderRadius: '0.75rem', border: '1px solid var(--pioniar-border)', padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button className="btn btn-outline" onClick={fetchSales} disabled={loading} title="Refresh Data" style={{ padding: '0.6rem' }}>
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} color="#64748b" />
            </button>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '0.5rem', gap: '0.25rem' }}>
              {['Hari Ini', 'Minggu Ini', 'Bulan Ini', 'Tahun Ini', 'Semua'].map(f => (
                <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{ padding: '0.35rem 0.75rem', borderRadius: '0.35rem', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s', backgroundColor: filter === f ? '#ffffff' : 'transparent', color: filter === f ? 'var(--pioniar-primary)' : '#64748b', boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Cari username, paket..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '0.5rem 1rem 0.5rem 2.5rem', borderRadius: '2rem', border: '1px solid var(--pioniar-border)', outline: 'none', width: '250px', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {/* Table Card */}
        <div className="glass-panel" style={{ borderRadius: '0.75rem', border: '1px solid var(--pioniar-border)', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', backgroundColor: '#ffffff' }}>
          
          {/* Table Header Row (Always Visible) */}
          <div style={{ padding: '0.8rem 1.5rem', display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1.5fr 1.5fr', fontWeight: 600, fontSize: '0.75rem', color: '#94a3b8', letterSpacing: '0.05em', borderBottom: '1px solid var(--pioniar-border)', backgroundColor: '#ffffff', textTransform: 'uppercase' }}>
            <div>TANGGAL LOGIN</div>
            <div>USERNAME</div>
            <div>PAKET TERJUAL</div>
            <div style={{ textAlign: 'right' }}>PENDAPATAN (HARGA)</div>
          </div>
          
          {/* Table Body Area */}
          <div style={{ backgroundColor: '#ffffff', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {loading && sales.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--pioniar-text-muted)' }}>
                <Loader2 size={32} className="animate-spin" style={{ marginBottom: '1rem', color: 'var(--pioniar-primary)' }} />
                <p>Memuat laporan penjualan...</p>
              </div>
            ) : searchedSales.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--pioniar-text-muted)', padding: '3rem' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '1px solid var(--pioniar-border)', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <Calendar size={24} color="#94a3b8" />
                </div>
                <h4 style={{ color: 'var(--pioniar-primary)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>Data kosong.</h4>
                <p style={{ fontSize: '0.85rem' }}>Tidak ada data penjualan untuk periode ini.</p>
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {searchedSales.map(s => (
                  <div key={s.id} style={{ padding: '0.8rem 1.5rem', display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1.5fr 1.5fr', alignItems: 'center', borderBottom: '1px solid var(--pioniar-border)', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={14} color="#94a3b8" />
                      <span style={{ color: 'var(--pioniar-text-muted)', fontSize: '0.85rem' }}>{formatDate(s.sold_at)}</span>
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--pioniar-text)' }}>{s.username}</span>
                    <span style={{ display: 'inline-block', backgroundColor: 'rgba(40, 96, 134, 0.1)', color: 'var(--pioniar-primary)', padding: '0.2rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600, justifySelf: 'start' }}>{s.plan}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#10b981', textAlign: 'right' }}>{formatRupiah(s.price)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notification && createPortal(
        <div className="animate-slide-up" style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', backgroundColor: notification.type === 'error' ? '#ef4444' : '#10b981', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '2rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
          {notification.message}
        </div>,
        document.body
      )}
    </div>
  );
}
