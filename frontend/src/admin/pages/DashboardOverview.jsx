import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users, WifiHigh, Activity, Clock, Server, Beef, Coffee, DollarSign, Lock, Cpu, HardDrive, Power } from 'lucide-react';

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
    memory_usage: '0 MB'
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
    { label: `Pendapatan (${filter})`, value: formatRupiah(totalRevenue), icon: <DollarSign size={24} />, color: '#10b981' },
    { label: `Voucher Terjual (${filter})`, value: totalVouchers, icon: <Users size={24} />, color: '#3b82f6' },
    { label: 'Total User Aktif', value: liveData.active_users, icon: <Activity size={24} />, color: 'var(--pioniar-primary)' },
    { label: 'Network Speed', value: `${liveData.speed_mbps} Mbps`, icon: <Activity size={24} />, color: 'var(--pioniar-accent)' },
    { label: 'CPU Load', value: `${liveData.cpu_load}%`, icon: <Cpu size={24} />, color: '#f59e0b' },
    { label: 'Memory Usage', value: liveData.memory_usage, icon: <HardDrive size={24} />, color: '#8b5cf6' },
    { 
      label: 'Status Router', 
      value: status, 
      icon: <WifiHigh size={24} />, 
      color: status === 'Online' ? 'var(--pioniar-accent)' : '#ef4444',
      action: <button onClick={handleRebootClick} disabled={isRebooting || status === 'Offline'} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.35rem 0.6rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '0.5rem', fontSize: '0.7rem', fontWeight: 600, cursor: (isRebooting || status === 'Offline') ? 'not-allowed' : 'pointer', opacity: (isRebooting || status === 'Offline') ? 0.5 : 1 }}><Power size={12}/> Reboot</button>
    },
    { label: 'Uptime Router', value: liveData.uptime, icon: <Clock size={24} />, color: 'var(--pioniar-warning)' }
  ];

  const renderStatsGrid = (statsArray) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
      {statsArray.map((stat, i) => (
        <div key={i} className="glass-panel" style={{ padding: '1rem 1.25rem', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ color: 'var(--pioniar-text-muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{stat.label}</p>
            <div style={{ color: stat.color }}>
              {React.cloneElement(stat.icon, { size: 18 })}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: stat.color === '#ef4444' ? '#ef4444' : 'inherit' }}>{stat.value}</h3>
            {stat.action && stat.action}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="animate-fade-in hide-scrollbar" style={{ height: '100%', overflowY: 'auto', paddingRight: '0.25rem' }}>
      {/* Top Header Actions */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '1rem',
        position: 'sticky',
        top: '-1rem',
        zIndex: 50,
        backgroundColor: 'var(--pioniar-bg)',
        paddingTop: '1rem',
        paddingBottom: '1rem',
        marginTop: '-1rem',
        marginBottom: '1rem',
        borderBottom: '1px solid var(--pioniar-border)'
      }}>
        
        {/* Tab Switcher */}
        <div style={{ 
          display: 'inline-flex', 
          backgroundColor: '#f1f5f9', 
          padding: '0.35rem', 
          borderRadius: '1rem', 
          border: '1px solid var(--pioniar-border)' 
        }}>
          {['Network', 'Farm', 'Snack'].map(tab => {
            const isLocked = tab === 'Farm' || tab === 'Snack';
            return (
              <button
                key={tab}
                onClick={() => !isLocked && setActiveTab(tab)}
                disabled={isLocked}
                title={isLocked ? "Fitur Belum Tersedia" : ""}
                style={{
                  padding: '0.5rem 1.5rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  fontWeight: activeTab === tab ? 700 : 600,
                  fontSize: '0.85rem',
                  backgroundColor: activeTab === tab ? '#ffffff' : 'transparent',
                  color: activeTab === tab ? 'var(--pioniar-primary)' : (isLocked ? '#cbd5e1' : '#64748b'),
                  boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: isLocked ? 0.7 : 1
                }}
              >
                {tab === 'Network' && <Server size={16} />}
                {tab === 'Farm' && <Beef size={16} />}
                {tab === 'Snack' && <Coffee size={16} />}
                {tab}
                {isLocked && <Lock size={12} color="#cbd5e1" />}
              </button>
            )
          })}
        </div>

        {/* Filter Selection */}
        <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '0.35rem', borderRadius: '0.75rem', border: '1px solid var(--pioniar-border)' }}>
          {['Hari Ini', 'Minggu Ini', 'Bulan Ini', 'Tahun Ini', 'Semua'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              style={{ 
                padding: '0.4rem 0.8rem', borderRadius: '0.5rem', border: 'none', 
                cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.2s', 
                backgroundColor: filter === f ? '#ffffff' : 'transparent', 
                color: filter === f ? 'var(--pioniar-primary)' : '#64748b', 
                boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' 
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Network View */}
      {activeTab === 'Network' && (
        <div className="animate-slide-up">
          {renderStatsGrid(networkStats)}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Aktivitas Network Terkini</h3>
            <p style={{ color: 'var(--pioniar-text-muted)', fontSize: '0.875rem' }}>Sistem MikroTik terhubung dan termonitor secara real-time. Terakhir login: <strong>{liveData.latest_login}</strong></p>
          </div>
          
          {/* Anti-Lag Control */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={18} color={antiLagEnabled ? 'var(--pioniar-accent)' : 'var(--pioniar-text-muted)'} /> 
                QoS Anti-Lag Gaming
              </h3>
              <p style={{ color: 'var(--pioniar-text-muted)', fontSize: '0.85rem', maxWidth: '600px', margin: 0, lineHeight: 1.5 }}>
                Memprioritaskan ICMP (Ping) dan lalu lintas Game Online (seperti Mobile Legends, PUBG, FF) agar pemain tidak mengalami *lag* atau *ping merah* saat pengguna lain sedang mengunduh file besar.
              </p>
            </div>
            <div>
              <button 
                onClick={handleToggleAntiLag} 
                disabled={isTogglingLag || status === 'Offline'}
                style={{ 
                  backgroundColor: antiLagEnabled ? 'var(--pioniar-accent)' : '#e2e8f0', 
                  color: antiLagEnabled ? '#fff' : '#64748b',
                  border: 'none', 
                  padding: '0.7rem 1.5rem', 
                  borderRadius: '2rem', 
                  fontWeight: 700, 
                  fontSize: '0.85rem',
                  cursor: (isTogglingLag || status === 'Offline') ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: antiLagEnabled ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
                  opacity: (isTogglingLag || status === 'Offline') ? 0.6 : 1
                }}
              >
                {isTogglingLag ? 'Memproses...' : (antiLagEnabled ? 'ON - Aktif' : 'OFF - Mati')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Farm View Placeholder */}
      {activeTab === 'Farm' && (
        <div className="animate-slide-up">
          {renderStatsGrid([
            { label: 'Total Populasi', value: '45 Ekor', icon: <Beef size={24} />, color: 'var(--pioniar-primary)' },
            { label: 'Sapi Sakit', value: '2 Ekor', icon: <Activity size={24} />, color: '#ef4444' },
            { label: 'Susu Hari Ini', value: '120 Liter', icon: <Coffee size={24} />, color: 'var(--pioniar-accent)' }
          ])}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Log Peternakan</h3>
            <p style={{ color: 'var(--pioniar-text-muted)', fontSize: '0.875rem' }}>Pemberian pakan pagi selesai. Menunggu jadwal pakan sore.</p>
          </div>
        </div>
      )}

      {/* Snack View Placeholder */}
      {activeTab === 'Snack' && (
        <div className="animate-slide-up">
          {renderStatsGrid([
            { label: 'Penjualan Hari Ini', value: 'Rp 450K', icon: <Activity size={24} />, color: 'var(--pioniar-accent)' },
            { label: 'Pesanan Aktif', value: '5 Pesanan', icon: <Clock size={24} />, color: 'var(--pioniar-warning)' },
            { label: 'Stok Kritis', value: '2 Item', icon: <Coffee size={24} />, color: '#ef4444' }
          ])}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Aktivitas Kafe</h3>
            <p style={{ color: 'var(--pioniar-text-muted)', fontSize: '0.875rem' }}>Kopi Susu Gula Aren menjadi item terlaris hari ini.</p>
          </div>
        </div>
      )}

      {/* Reboot Modal */}
      {showRebootModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', borderRadius: 'var(--radius-xl)', padding: '2rem', backgroundColor: 'var(--pioniar-bg)', position: 'relative', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '50%' }}><Power size={40} color="#ef4444" /></div>
            </div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Restart Router?</h2>
            <p style={{ color: 'var(--pioniar-text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Koneksi internet klien akan terputus sementara hingga router menyala kembali (sekitar 1-2 menit).</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" className="btn" onClick={() => setShowRebootModal(false)} style={{ flex: 1 }}>Batal</button>
              <button type="button" className="btn" onClick={confirmReboot} disabled={isRebooting} style={{ flex: 1, backgroundColor: '#ef4444', color: '#fff', border: 'none', display: 'flex', justifyContent: 'center' }}>
                {isRebooting ? 'Memproses...' : 'Ya, Restart'}
              </button>
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
