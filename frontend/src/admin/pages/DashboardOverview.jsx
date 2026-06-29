import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Users, WifiHigh, Activity, Clock, Server, Beef, Coffee, DollarSign, Lock, Cpu, HardDrive, Power, Database, ChevronDown, BarChart2, X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardOverview() {
  const [activeTab, setActiveTab] = useState('Network');
  const [sales, setSales] = useState([]);
  const [availableVouchers, setAvailableVouchers] = useState(0);
  const [filter, setFilter] = useState('Bulan Ini');
  const [isRebooting, setIsRebooting] = useState(false);
  const [showRebootModal, setShowRebootModal] = useState(false);
  
  const [antiLagEnabled, setAntiLagEnabled] = useState(false);
  const [isTogglingLag, setIsTogglingLag] = useState(false);
  
  const [isTabDropdownOpen, setIsTabDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsTabDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    const fetchDashboardData = () => {
      fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/wifi/sales')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setSales(data);
        })
        .catch(err => console.error(err));
        
      fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/wifi/vouchers')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const count = data.filter(v => {
              if (v.uptime && v.uptime !== '0s') return false;
              if (v.first_used_at) return false;
              if (v.status === 'Kadaluarsa' || v.status === 'Berjalan') return false;
              return true;
            }).length;
            setAvailableVouchers(count);
          }
        })
        .catch(err => console.error(err));

      fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/wifi/anti-lag/status')
        .then(res => res.json())
        .then(data => {
          if (data.status === 'Success') setAntiLagEnabled(data.enabled);
        })
        .catch(err => console.error(err));
    };

    fetchDashboardData();
    
    const handleRefresh = () => fetchDashboardData();
    window.addEventListener('app:refresh', handleRefresh);
    return () => window.removeEventListener('app:refresh', handleRefresh);
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
  const chartData = React.useMemo(() => {
    if (!filteredSales || filteredSales.length === 0) return [];
    
    const isToday = filter === 'Hari Ini';
    const sortedSales = [...filteredSales].sort((a, b) => new Date(a.sold_at) - new Date(b.sold_at));
    
    const grouped = sortedSales.reduce((acc, sale) => {
      let key;
      if (isToday) {
         const date = new Date(sale.sold_at);
         key = `${String(date.getHours()).padStart(2, '0')}:00`;
      } else {
         key = new Date(sale.sold_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
      }
      
      if (!acc[key]) acc[key] = { date: key, revenue: 0 };
      acc[key].revenue += Number(sale.price) || 0;
      return acc;
    }, {});
    
    return Object.values(grouped);
  }, [filteredSales, filter]);

  const networkStats = [
    { label: `Pendapatan (${filter})`, value: formatRupiah(totalRevenue), icon: <DollarSign size={20} />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: `Voucher Terjual (${filter})`, value: totalVouchers, icon: <Users size={20} />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Total User Aktif', value: liveData.active_users, icon: <Activity size={20} />, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Voucher Tersedia', value: availableVouchers, icon: <Lock size={20} />, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Network Speed', value: `${liveData.speed_mbps} Mbps`, icon: <Activity size={20} />, color: 'text-cyan-500', bg: 'bg-cyan-50' },
    { label: 'CPU Load', value: `${liveData.cpu_load}%`, icon: <Cpu size={20} />, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Memory Usage', value: liveData.memory_usage, icon: <HardDrive size={20} />, color: 'text-pink-500', bg: 'bg-pink-50' },
    { label: 'Penyimpanan (HDD)', value: liveData.hdd_usage, icon: <Database size={20} />, color: 'text-teal-500', bg: 'bg-teal-50' },
    { 
      label: 'Status Router', 
      value: status, 
      icon: <WifiHigh size={20} />, 
      color: status === 'Online' ? 'text-emerald-500' : 'text-red-500',
      bg: status === 'Online' ? 'bg-emerald-50' : 'bg-red-50',
      action: <button onClick={handleRebootClick} disabled={isRebooting || status === 'Offline'} className={`flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-500 border border-slate-200 rounded-lg text-[13px] font-medium transition-all ${isRebooting || status === 'Offline' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50'}`}><Power size={14}/> Reboot</button>
    },
    { label: 'Uptime Router', value: liveData.uptime, icon: <Clock size={20} />, color: 'text-orange-500', bg: 'bg-orange-50' }
  ];

  const renderStatsGrid = (statsArray) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
      {statsArray.map((stat, i) => (
        <div key={i} className="p-3 border border-slate-200 rounded-xl flex flex-col bg-white shadow-sm transition-all hover:shadow-md group relative overflow-hidden">
          {/* Subtle gradient background effect on hover */}
          <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${stat.bg}`}></div>
          
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${stat.bg} ${stat.color}`}>
              {React.cloneElement(stat.icon, { size: 14 })}
            </div>
            {stat.action && <div className="scale-90 origin-right">{stat.action}</div>}
          </div>
          <div className="relative z-10 mt-auto">
            <h3 className={`text-base font-black leading-tight tracking-tight mb-0.5 ${stat.color === 'text-red-500' ? 'text-red-500' : 'text-slate-800'}`}>{stat.value}</h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider m-0 truncate" title={stat.label}>{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="hide-scrollbar h-full overflow-y-auto flex flex-col bg-white">
      
      {/* Compact Action Bar */}
      <div className="flex flex-wrap gap-3 px-4 py-3 bg-white border-b border-slate-100 items-center shrink-0 sticky top-0 z-20">
        
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsTabDropdownOpen(!isTabDropdownOpen)}
            className="flex items-center gap-2 py-1.5 pl-3 pr-2 border border-slate-200 bg-white rounded-lg text-slate-800 font-bold text-[12px] cursor-pointer shadow-sm hover:border-slate-300 transition-all select-none"
          >
            {activeTab === 'Network' ? 'Network Server' : activeTab}
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${isTabDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isTabDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden flex flex-col py-1 animate-slide-up origin-top">
              <button 
                onClick={() => { setActiveTab('Network'); setIsTabDropdownOpen(false); }}
                className={`text-left px-3 py-2 text-[12px] font-bold transition-colors ${activeTab === 'Network' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                Network Server
              </button>
              <button disabled className="text-left px-3 py-2 text-[12px] font-bold text-slate-400 bg-slate-50 cursor-not-allowed">
                Farm (Locked)
              </button>
              <button disabled className="text-left px-3 py-2 text-[12px] font-bold text-slate-400 bg-slate-50 cursor-not-allowed">
                Snack (Locked)
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-slate-200 hidden sm:block"></div>
        
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-lg border border-slate-200 overflow-x-auto hide-scrollbar flex-nowrap">
          {['Hari Ini', 'Minggu Ini', 'Bulan Ini', 'Tahun Ini', 'Semua'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)} 
              className={`px-3 py-1 rounded-md border-none text-[11px] font-bold cursor-pointer transition-all whitespace-nowrap ${filter === f ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200' : 'bg-transparent text-slate-500 hover:text-slate-700'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">

      {/* Network View */}
      {activeTab === 'Network' && (
        <>
          {renderStatsGrid(networkStats)}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Advanced Chart */}
            <div className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col h-[220px] md:h-[280px]">
              <h3 className="text-[13px] font-black m-0 mb-4 text-slate-800 uppercase tracking-wide">Tren Penjualan ({filter})</h3>
              <div className="flex-1 w-full h-full min-h-0 flex items-center justify-center relative">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{fontSize: 10, fill: '#64748b'}} tickLine={false} axisLine={false} dy={10} />
                      <YAxis tickFormatter={(val) => `Rp ${val.toLocaleString('id-ID')}`} tick={{fontSize: 10, fill: '#64748b'}} tickLine={false} axisLine={false} dx={-10} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                        itemStyle={{ color: '#10b981', fontWeight: '600' }}
                        formatter={(val) => [`Rp ${val.toLocaleString('id-ID')}`, 'Pendapatan']}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 absolute inset-0">
                    <BarChart2 size={48} className="mb-3 text-slate-300 stroke-1" />
                    <p className="text-[13px] font-bold m-0 text-slate-400">Belum ada data penjualan</p>
                    <p className="text-[11px] font-medium m-0 mt-1 text-slate-400 text-center px-8">Data grafik akan muncul ketika ada transaksi berhasil hari ini.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-[13px] font-black m-0 mb-1.5 text-slate-800 uppercase tracking-wide">Aktivitas Network</h3>
                <p className="text-slate-500 text-[12px] m-0 leading-relaxed">Sistem MikroTik terhubung dan termonitor secara real-time. Terakhir login: <strong className="text-slate-800 font-bold">{liveData.latest_login}</strong></p>
              </div>
              
              {/* Anti-Lag Control */}
              <div className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm flex justify-between items-center gap-4 hover:shadow-md transition-shadow">
              <div>
                <h3 className="text-[13px] font-black m-0 mb-1.5 flex items-center gap-1.5 text-slate-800 uppercase tracking-wide">
                  <div className={`w-1.5 h-1.5 rounded-full ${antiLagEnabled ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-slate-300'}`}></div>
                  QoS Anti-Lag
                </h3>
                <p className="text-slate-500 text-[11px] font-medium m-0 leading-tight">
                  Prioritaskan Ping & Game Online.
                </p>
              </div>
              <div>
                <button 
                  onClick={handleToggleAntiLag} 
                  disabled={isTogglingLag || status === 'Offline'}
                  className={`px-4 py-1.5 rounded-lg font-bold text-[12px] flex items-center gap-1.5 transition-all outline-none ${antiLagEnabled ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'} ${(isTogglingLag || status === 'Offline') ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {isTogglingLag ? <div className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full"></div> : <Power size={14} />}
                  {antiLagEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Farm View Placeholder */}
      {activeTab === 'Farm' && (
        <div>
          {renderStatsGrid([
            { label: 'Total Populasi', value: '45 Ekor', icon: <Beef size={24} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Sapi Sakit', value: '2 Ekor', icon: <Activity size={24} />, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Susu Hari Ini', value: '120 Liter', icon: <Coffee size={24} />, color: 'text-green-600', bg: 'bg-green-50' }
          ])}
          <div className="p-2 border border-slate-200 bg-white rounded-sm">
            <h3 className="text-xs font-bold m-0 mb-1 text-black">Log Peternakan</h3>
            <p className="text-slate-800 text-[13px] m-0">Pemberian pakan pagi selesai. Menunggu jadwal pakan sore.</p>
          </div>
        </div>
      )}

      {/* Snack View Placeholder */}
      {activeTab === 'Snack' && (
        <div>
          {renderStatsGrid([
            { label: 'Penjualan Hari Ini', value: 'Rp 450K', icon: <Activity size={24} />, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Pesanan Aktif', value: '5 Pesanan', icon: <Clock size={24} />, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Stok Kritis', value: '2 Item', icon: <Coffee size={24} />, color: 'text-red-600', bg: 'bg-red-50' }
          ])}
          <div className="p-2 border border-slate-200 bg-white rounded-sm">
            <h3 className="text-xs font-bold m-0 mb-1 text-black">Aktivitas Kafe</h3>
            <p className="text-slate-800 text-[13px] m-0">Kopi Susu Gula Aren menjadi item terlaris hari ini.</p>
          </div>
        </div>
      )}
      
      </div>

      {/* Reboot Modal (WinBox Style) */}
      {showRebootModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-[400px] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-[13px]">
                <Power size={14} className="text-red-500" /> Restart Router
              </div>
              <button onClick={() => setShowRebootModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                <X size={14} />
              </button>
            </div>
            <div className="p-6 text-center bg-white">
              <div className="mb-6">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Power size={24} className="text-red-500" />
                </div>
                <h3 className="text-[15px] font-bold text-slate-800 mb-1">Restart Pioniar Server?</h3>
                <p className="text-slate-500 text-[13px] leading-relaxed">Koneksi internet klien akan terputus sementara hingga router menyala kembali (sekitar 1-2 menit).</p>
              </div>
              <div className="flex gap-2 justify-center">
                <button type="button" onClick={() => setShowRebootModal(false)} className="flex-1 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold cursor-pointer rounded-lg text-[13px] transition-colors">Batal</button>
                <button type="button" onClick={confirmReboot} disabled={isRebooting} className={`flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[13px] font-bold transition-all shadow-md shadow-red-500/20 ${isRebooting ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}>
                  {isRebooting ? 'Memproses...' : 'Ya, Restart'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Notifications */}
      {notification && createPortal(
        <div className="animate-slide-up fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg z-[9999] flex items-center gap-2 font-medium text-sm text-white" style={{ backgroundColor: notification.type === 'error' ? '#ef4444' : '#10b981' }}>
          {notification.message}
        </div>,
        document.body
      )}

    </div>
  );
}
