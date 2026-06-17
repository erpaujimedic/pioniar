import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users, WifiHigh, Activity, Clock, Server, Beef, Coffee, DollarSign, Lock, Cpu, HardDrive, Power, Database } from 'lucide-react';

export default function DashboardOverview() {
  const [activeTab, setActiveTab] = useState('Network');
  const [sales, setSales] = useState([]);
  const [filter, setFilter] = useState('Bulan Ini');
  const [isRebooting, setIsRebooting] = useState(false);
  const [showRebootModal, setShowRebootModal] = useState(false);
  
  const [antiLagEnabled, setAntiLagEnabled] = useState(false);
  const [isTogglingLag, setIsTogglingLag] = useState(false);
  
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);
  
  // -- Network State --
  const [liveData, setLiveData] = useState({
    active_users: 0,
    latest_login: '-',
    uptime: '00:00:00',
    speed_mbps: 0,
    cpu_load: '0',
    memory_usage: '0 MB',
    board_name: 'Checking...',
    hdd_usage: '0 MB'
  });
  const [status, setStatus] = useState('Checking...');

  useEffect(() => {
    const fetchLiveMonitor = () => {
      if (activeTab !== 'Network') return; // Only poll if Network tab is active
      fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/wifi/monitor')
        .then(res => res.json())
        .then(data => {
          if (data.status === 'Success' && data.data) {
            setLiveData(data.data);
            setStatus('Online');
          } else {
            setStatus('Offline');
          }
        })
        .catch(err => {
          console.error("Failed to fetch monitor data", err);
          setStatus('Offline');
        });
    };

    fetchLiveMonitor();
    const interval = setInterval(fetchLiveMonitor, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [activeTab]);

  useEffect(() => {
    fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/wifi/sales')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSales(data);
      })
      .catch(err => console.error(err));
      
    fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/wifi/anti-lag/status')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'Success') setAntiLagEnabled(data.enabled);
      })
      .catch(err => console.error(err));
  }, []);

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

  const filteredSales = filterDataByDate(sales);
  const totalRevenue = filteredSales.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  const totalVouchers = filteredSales.length;
  const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

  const handleRebootClick = () => {
    setShowRebootModal(true);
  };

  const confirmReboot = async () => {
    setShowRebootModal(false);
    setIsRebooting(true);
    setStatus('Rebooting...');
    try {
      await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/wifi/reboot', { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
    setTimeout(() => setIsRebooting(false), 30000); // 30s cooldown before allow click again
  };

  const handleToggleAntiLag = async () => {
    setIsTogglingLag(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/wifi/anti-lag/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !antiLagEnabled })
      });
      const data = await res.json();
      if (data.status === 'Success') {
        setAntiLagEnabled(data.enabled);
        setNotification({ type: 'success', message: data.message });
      } else {
        setNotification({ type: 'error', message: data.detail || 'Gagal mengubah status Anti-Lag' });
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Terjadi kesalahan jaringan' });
    }
    setIsTogglingLag(false);
  };

  const networkStats = [
    { label: `Pendapatan (${filter})`, value: formatRupiah(totalRevenue), icon: <DollarSign size={20} />, color: '#10b981', bg: '#ecfdf5' },
    { label: `Voucher Terjual (${filter})`, value: totalVouchers, icon: <Users size={20} />, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Total User Aktif', value: liveData.active_users, icon: <Activity size={20} />, color: '#8b5cf6', bg: '#f3e8ff' },
    { label: 'Network Speed', value: `${liveData.speed_mbps} Mbps`, icon: <Activity size={20} />, color: '#06b6d4', bg: '#cffafe' },
    { label: 'CPU Load', value: `${liveData.cpu_load}%`, icon: <Cpu size={20} />, color: '#f59e0b', bg: '#fef3c7' },
    { label: 'Memory Usage', value: liveData.memory_usage, icon: <HardDrive size={20} />, color: '#ec4899', bg: '#fce7f3' },
    { label: 'Model Router', value: liveData.board_name, icon: <Server size={20} />, color: '#6366f1', bg: '#e0e7ff' },
    { label: 'Penyimpanan (HDD)', value: liveData.hdd_usage, icon: <Database size={20} />, color: '#14b8a6', bg: '#ccfbf1' },
    { 
      label: 'Status Router', 
      value: status, 
      icon: <WifiHigh size={20} />, 
      color: status === 'Online' ? '#10b981' : '#ef4444',
      bg: status === 'Online' ? '#ecfdf5' : '#fee2e2',
      action: <button onClick={handleRebootClick} disabled={isRebooting || status === 'Offline'} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#ffffff', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', cursor: (isRebooting || status === 'Offline') ? 'not-allowed' : 'pointer', opacity: (isRebooting || status === 'Offline') ? 0.5 : 1, transition: 'all 0.2s', fontWeight: '500' }} onMouseOver={e=>e.currentTarget.style.backgroundColor='#f8fafc'} onMouseOut={e=>e.currentTarget.style.backgroundColor='#ffffff'}><Power size={14}/> Reboot</button>
    },
    { label: 'Uptime Router', value: liveData.uptime, icon: <Clock size={20} />, color: '#f97316', bg: '#ffedd5' }
  ];

  const renderStatsGrid = (statsArray) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
      {statsArray.map((stat, i) => (
        <div key={i} style={{ padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', transition: 'transform 0.2s, box-shadow 0.2s' }} onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 4px 6px rgba(0,0,0,0.05)'}} onMouseLeave={e=>{e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,0.02)'}}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {React.cloneElement(stat.icon, { size: 16 })}
            </div>
            {stat.action && stat.action}
          </div>
          <div>
            <p style={{ color: '#64748b', fontSize: '11px', fontWeight: '600', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</p>
            <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: stat.color === '#ef4444' ? '#ef4444' : '#0f172a' }}>{stat.value}</h3>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="hide-scrollbar" style={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
      
      {/* Premium Action Bar */}
      <div style={{ display: 'flex', gap: '16px', padding: '20px 24px', backgroundColor: '#ffffff', borderBottom: '1px solid #f1f5f9', alignItems: 'center', flexShrink: 0 }}>
        
        <div style={{ position: 'relative' }}>
          <select value={activeTab} onChange={(e) => setActiveTab(e.target.value)} style={{ padding: '10px 16px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', backgroundColor: '#f8fafc', borderRadius: '8px', color: '#0f172a', fontWeight: '600', cursor: 'pointer', appearance: 'none', paddingRight: '40px' }}>
            <option value="Network">Network Server</option>
            <option value="Farm" disabled>Farm (Locked)</option>
            <option value="Snack" disabled>Snack (Locked)</option>
          </select>
          <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
        </div>

        <div style={{ width: '1px', height: '24px', backgroundColor: '#e2e8f0', margin: '0 4px' }}></div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
        </div>
        
        <div style={{ flex: 1 }}></div>
      </div>

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>

      {/* Network View */}
      {activeTab === 'Network' && (
        <div>
          {renderStatsGrid(networkStats)}
          
          <div style={{ padding: '24px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', borderRadius: '16px', marginBottom: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 8px 0', color: '#0f172a' }}>Aktivitas Network Terkini</h3>
            <p style={{ color: '#475569', fontSize: '14px', margin: 0 }}>Sistem MikroTik terhubung dan termonitor secara real-time. Terakhir login: <strong style={{ color: '#0f172a' }}>{liveData.latest_login}</strong></p>
          </div>
          
          {/* Anti-Lag Control */}
          <div style={{ padding: '24px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: antiLagEnabled ? '#10b981' : '#94a3b8' }}></div>
                QoS Anti-Lag Gaming
              </h3>
              <p style={{ color: '#475569', fontSize: '14px', maxWidth: '600px', margin: 0, lineHeight: 1.5 }}>
                Memprioritaskan ICMP (Ping) dan lalu lintas Game Online agar pemain tidak mengalami lag saat unduhan besar.
              </p>
            </div>
            <div>
              <button 
                onClick={handleToggleAntiLag} 
                disabled={isTogglingLag || status === 'Offline'}
                style={{ 
                  backgroundColor: antiLagEnabled ? '#10b981' : '#ffffff', 
                  color: antiLagEnabled ? '#ffffff' : '#475569',
                  border: `1px solid ${antiLagEnabled ? '#10b981' : '#e2e8f0'}`, 
                  padding: '10px 20px', 
                  borderRadius: '10px', 
                  fontWeight: '600', 
                  fontSize: '14px',
                  cursor: (isTogglingLag || status === 'Offline') ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: (isTogglingLag || status === 'Offline') ? 0.6 : 1,
                  boxShadow: antiLagEnabled ? '0 4px 6px rgba(16, 185, 129, 0.2)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {isTogglingLag ? <div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid', borderTopColor: 'transparent', borderRadius: '50%' }}></div> : <Power size={16} />}
                {antiLagEnabled ? 'Aktif' : 'Mati'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Farm View Placeholder */}
      {activeTab === 'Farm' && (
        <div>
          {renderStatsGrid([
            { label: 'Total Populasi', value: '45 Ekor', icon: <Beef size={24} />, color: '#2563eb' },
            { label: 'Sapi Sakit', value: '2 Ekor', icon: <Activity size={24} />, color: '#cc0000' },
            { label: 'Susu Hari Ini', value: '120 Liter', icon: <Coffee size={24} />, color: '#008800' }
          ])}
          <div style={{ padding: '8px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', borderRadius: '2px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 'bold', margin: '0 0 4px 0', color: '#000' }}>Log Peternakan</h3>
            <p style={{ color: '#333', fontSize: '13px', margin: 0 }}>Pemberian pakan pagi selesai. Menunggu jadwal pakan sore.</p>
          </div>
        </div>
      )}

      {/* Snack View Placeholder */}
      {activeTab === 'Snack' && (
        <div>
          {renderStatsGrid([
            { label: 'Penjualan Hari Ini', value: 'Rp 450K', icon: <Activity size={24} />, color: '#008800' },
            { label: 'Pesanan Aktif', value: '5 Pesanan', icon: <Clock size={24} />, color: '#cc6600' },
            { label: 'Stok Kritis', value: '2 Item', icon: <Coffee size={24} />, color: '#cc0000' }
          ])}
          <div style={{ padding: '8px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', borderRadius: '2px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 'bold', margin: '0 0 4px 0', color: '#000' }}>Aktivitas Kafe</h3>
            <p style={{ color: '#333', fontSize: '13px', margin: 0 }}>Kopi Susu Gula Aren menjadi item terlaris hari ini.</p>
          </div>
        </div>
      )}
      
      </div>

      {/* Reboot Modal (WinBox Style) */}
      {showRebootModal && createPortal(
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="os-title-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Power size={12} /> Restart Router
              </div>
              <div className="os-title-icons">
                <button onClick={() => setShowRebootModal(false)}><X size={12} /></button>
              </div>
            </div>
            <div className="os-body" style={{ textAlign: 'center' }}>
              <div style={{ padding: '8px 0' }}>
                <p style={{ color: '#000', marginBottom: '16px', fontSize: '13px' }}>Koneksi internet klien akan terputus sementara hingga router menyala kembali (sekitar 1-2 menit).</p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button type="button" onClick={() => setShowRebootModal(false)} style={{ padding: '4px 16px', border: '1px solid #e2e8f0', backgroundColor: '#f1f5f9', cursor: 'pointer', borderRadius: '2px', fontSize: '13px' }}>Batal</button>
                  <button type="button" onClick={confirmReboot} disabled={isRebooting} style={{ padding: '4px 16px', border: '1px solid #e2e8f0', backgroundColor: '#f1f5f9', cursor: (isRebooting ? 'not-allowed' : 'pointer'), borderRadius: '2px', fontSize: '13px', fontWeight: 'bold' }}>
                    {isRebooting ? 'Memproses...' : 'Ya, Restart'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

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
