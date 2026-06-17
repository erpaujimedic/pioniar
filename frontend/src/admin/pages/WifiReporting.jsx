import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LineChart, DollarSign, Calendar, RefreshCw, Loader2, Search, TrendingUp, Users } from 'lucide-react';
import HexLoader from '../../components/HexLoader';

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
    <div className="animate-fade-in" style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Main Container */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, backgroundColor: '#ffffff', overflow: 'hidden' }}>
        
        {/* Sleek KPI Row (Premium) */}
        <div style={{ display: 'flex', gap: '16px', padding: '20px 20px 0 20px' }}>
          <div style={{ flex: 1, borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'transform 0.2s, box-shadow 0.2s' }} onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 4px 6px rgba(0,0,0,0.05)'}} onMouseLeave={e=>{e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 2px 4px rgba(0,0,0,0.02)'}}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={20} />
            </div>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Total Penjualan ({filter})</p>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>{formatRupiah(totalRevenue)}</h2>
            </div>
          </div>
          
          <div style={{ flex: 1, borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'transform 0.2s, box-shadow 0.2s' }} onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 4px 6px rgba(0,0,0,0.05)'}} onMouseLeave={e=>{e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 2px 4px rgba(0,0,0,0.02)'}}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} />
            </div>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Voucher Terjual ({filter})</p>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>{totalVouchers} <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>user</span></h2>
            </div>
          </div>
        </div>

        {/* Action Bar (Premium) */}
        <div style={{ display: 'flex', gap: '12px', padding: '16px 20px', backgroundColor: '#ffffff', borderBottom: '1px solid #f1f5f9', alignItems: 'center', marginTop: '8px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '4px', padding: '4px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', overflowX: 'auto' }} className="hide-scrollbar">
              {['Hari Ini', 'Minggu Ini', 'Bulan Ini', 'Tahun Ini', 'Semua'].map(f => (
                <button 
                  key={f}
                  onClick={() => setFilter(f)} 
                  style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', backgroundColor: filter === f ? '#ffffff' : 'transparent', color: filter === f ? '#0f172a' : '#64748b', fontWeight: filter === f ? '600' : '500', fontSize: '13px', cursor: 'pointer', boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                >
                  {f}
                </button>
              ))}
            </div>
            
            <button 
              onClick={fetchSales} 
              disabled={loading}
              title="Refresh Data"
              style={{ backgroundColor: '#ffffff', color: '#64748b', border: '1px solid #e2e8f0', padding: '8px', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseOver={e=>e.currentTarget.style.backgroundColor='#f8fafc'} onMouseOut={e=>e.currentTarget.style.backgroundColor='#ffffff'}
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          
          <div style={{ flex: 1 }}></div>

          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', padding: '6px 12px', borderRadius: '8px', transition: 'border-color 0.2s' }}>
            <Search size={16} color="#64748b" />
            <input 
              type="text" 
              placeholder="Cari username, paket..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', outline: 'none', padding: '2px 8px', fontSize: '14px', width: '200px', backgroundColor: 'transparent', color: '#0f172a' }}
            />
          </div>
        </div>

        {/* Premium Table */}
        <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#ffffff', padding: '0 20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', marginTop: '8px' }}>
            <thead style={{ backgroundColor: '#ffffff', position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                <th style={{ padding: '16px 12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Tanggal Login</th>
                <th style={{ padding: '16px 12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Username</th>
                <th style={{ padding: '16px 12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Paket Terjual</th>
                <th style={{ padding: '16px 12px', borderBottom: '2px solid #e2e8f0', textAlign: 'right', fontWeight: '600', color: '#475569' }}>Pendapatan (Harga)</th>
              </tr>
            </thead>
            <tbody>
              {loading && sales.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Loader2 size={24} className="animate-spin" color="#3b82f6" />
                      <span>Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : searchedSales.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>Data penjualan kosong.</td>
                </tr>
              ) : (
                searchedSales.map(s => (
                  <tr key={s.id} style={{ cursor: 'pointer', transition: 'background-color 0.2s', borderBottom: '1px solid #f1f5f9' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '16px 12px', color: '#64748b' }}>{formatDate(s.sold_at)}</td>
                    <td style={{ padding: '16px 12px', fontWeight: '600', color: '#0f172a' }}>{s.username}</td>
                    <td style={{ padding: '16px 12px', color: '#475569' }}>
                      <span style={{ backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '13px' }}>{s.plan}</span>
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'right', color: '#10b981', fontWeight: '600' }}>{formatRupiah(s.price)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Status Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff', fontSize: '14px', color: '#475569' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Menampilkan <strong>{searchedSales.length}</strong> transaksi</span>
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
