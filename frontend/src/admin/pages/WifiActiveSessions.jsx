import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, RefreshCw, Loader2, Activity, ShieldAlert, X } from 'lucide-react';
import HexLoader from '../../components/HexLoader';

export default function WifiActiveSessions() {
  const [sessions, setSessions] = useState([]);
  const [runningVouchers, setRunningVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Sedang Online');
  
  const [showKickModal, setShowKickModal] = useState(false);
  const [kickData, setKickData] = useState(null);
  const [isKicking, setIsKicking] = useState(false);
  
  const [notification, setNotification] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/wifi/active');
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
      
      const resV = await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/wifi/vouchers');
      if (resV.ok) {
        const dataV = await resV.json();
        const running = dataV.filter(v => v.status === 'Berjalan' || (v.uptime && v.uptime !== '0s' && v.status !== 'Kadaluarsa'));
        setRunningVouchers(running);
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Koneksi ke server gagal' });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 60000); // auto refresh every minute
    
    const handleRefresh = () => fetchSessions();
    window.addEventListener('app:refresh', handleRefresh);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('app:refresh', handleRefresh);
    };
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const confirmKick = async () => {
    if (!kickData) return;
    setIsKicking(true);
    
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + `/api/wifi/active/${kickData.id}`, { method: 'DELETE' });
      const result = await res.json();
      if (res.ok) {
        setNotification({ type: 'success', message: `User ${kickData.username} berhasil di-kick` });
        setShowKickModal(false);
        setKickData(null);
        fetchSessions();
      } else {
        setNotification({ type: 'error', message: result.error || 'Gagal melakukan kick' });
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Koneksi ke server terputus' });
    }
    setIsKicking(false);
  };
  
  const filteredData = activeTab === 'Sedang Online' ? sessions : runningVouchers;
  
  const currentFilteredData = filteredData.filter(item => {
    if (activeTab === 'Sedang Online') {
      return (
        (item.user && item.user.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.address && item.address.includes(searchTerm)) ||
        (item['mac-address'] && item['mac-address'].toLowerCase().includes(searchTerm.toLowerCase()))
      );
    } else {
      return (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase()));
    }
  });

  const parseUptime = (str) => {
    if (!str || str === '0s') return 0;
    let total = 0;
    const parts = str.match(/(\d+)([dhms])/g);
    if (parts) {
      parts.forEach(p => {
        const val = parseInt(p);
        if (p.includes('d')) total += val * 86400;
        if (p.includes('h')) total += val * 3600;
        if (p.includes('m')) total += val * 60;
        if (p.includes('s')) total += val;
      });
    }
    return total;
  };

  const sortedData = React.useMemo(() => {
    let sortableItems = [...currentFilteredData];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        if (sortConfig.key === 'uptime' || sortConfig.key === 'limit_uptime') {
          aVal = parseUptime(aVal);
          bVal = parseUptime(bVal);
        } else {
          if (aVal == null) aVal = '';
          if (bVal == null) bVal = '';
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [currentFilteredData, sortConfig]);

  const formatTime = (isoString) => {
    if (!isoString) return '-';
    try {
        const date = new Date(isoString);
        return date.toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' });
    } catch { return isoString; }
  };

  // Calculate Pagination Data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(currentFilteredData.length / itemsPerPage);

  return (
    <div className="animate-fade-in relative flex flex-col h-full overflow-hidden bg-white">

      <div className="flex flex-col flex-1 overflow-hidden">
        
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-2 p-2 sm:px-3 bg-white border-b border-slate-100 items-start sm:items-center">
          
          {/* Tabs Filter */}
          <div className="flex gap-1 p-0.5 bg-slate-50 rounded border border-slate-200 w-full sm:w-auto shadow-inner">
            <button 
              onClick={() => { setActiveTab('Sedang Online'); setCurrentPage(1); }}
              className={`flex-1 sm:flex-none px-2 py-0.5 rounded-sm border-none text-[11px] cursor-pointer transition-all whitespace-nowrap ${activeTab === 'Sedang Online' ? 'bg-white text-slate-900 font-bold shadow-sm' : 'bg-transparent text-slate-500 font-semibold hover:bg-slate-100'}`}
            >
              Sedang Online ({sessions.length})
            </button>
            <button 
              onClick={() => { setActiveTab('Voucher Berjalan'); setCurrentPage(1); }}
              className={`flex-1 sm:flex-none px-2 py-0.5 rounded-sm border-none text-[11px] cursor-pointer transition-all whitespace-nowrap ${activeTab === 'Voucher Berjalan' ? 'bg-white text-slate-900 font-bold shadow-sm' : 'bg-transparent text-slate-500 font-semibold hover:bg-slate-100'}`}
            >
              Voucher Berjalan ({runningVouchers.length})
            </button>
          </div>
          
          <div className="flex-1 hidden sm:block"></div>

          {/* Search & Refresh */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none flex items-center border border-slate-200 bg-white px-1.5 py-0.5 rounded transition-colors focus-within:border-emerald-500 shadow-sm h-6">
              <Search size={12} className="text-slate-400 shrink-0" />
              <input 
                type="text" 
                placeholder="Cari username, IP, MAC..." 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="border-none outline-none px-1.5 py-0.5 text-[10px] bg-transparent text-slate-900 w-full sm:w-[150px]"
              />
            </div>
          </div>
        </div>

        {/* Premium Table */}
        <div className="flex-1 overflow-auto bg-white px-2">
          <table className="w-full min-w-[700px] border-collapse text-[11px] mt-1">
            <thead className="bg-white sticky top-0 z-10">
              {activeTab === 'Sedang Online' ? (
                <tr>
                  <th className="py-1.5 px-2 border border-slate-200 text-center font-bold text-slate-400 uppercase tracking-wider text-[9px] bg-white cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('user')}>Username {sortConfig.key === 'user' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                  <th className="py-1.5 px-2 border border-slate-200 text-center font-bold text-slate-400 uppercase tracking-wider text-[9px] bg-white cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('address')}>IP Address {sortConfig.key === 'address' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                  <th className="py-1.5 px-2 border border-slate-200 text-center font-bold text-slate-400 uppercase tracking-wider text-[9px] bg-white cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('mac-address')}>MAC Address {sortConfig.key === 'mac-address' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                  <th className="py-1.5 px-2 border border-slate-200 text-center font-bold text-slate-400 uppercase tracking-wider text-[9px] bg-white cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('uptime')}>Uptime {sortConfig.key === 'uptime' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                  <th className="py-1.5 px-2 border border-slate-200 text-center font-bold text-slate-400 uppercase tracking-wider text-[9px] bg-white">Aksi</th>
                </tr>
              ) : (
                <tr>
                  <th className="py-1.5 px-2 border border-slate-200 text-center font-bold text-slate-400 uppercase tracking-wider text-[9px] bg-white cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('code')}>Username {sortConfig.key === 'code' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                  <th className="py-1.5 px-2 border border-slate-200 text-center font-bold text-slate-400 uppercase tracking-wider text-[9px] bg-white cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('plan')}>Paket {sortConfig.key === 'plan' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                  <th className="py-1.5 px-2 border border-slate-200 text-center font-bold text-slate-400 uppercase tracking-wider text-[9px] bg-white cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('first_used_at')}>Login Pertama {sortConfig.key === 'first_used_at' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                  <th className="py-1.5 px-2 border border-slate-200 text-center font-bold text-slate-400 uppercase tracking-wider text-[9px] bg-white cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('expires_at')}>Selesai Pada {sortConfig.key === 'expires_at' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                  <th className="py-1.5 px-2 border border-slate-200 text-center font-bold text-slate-400 uppercase tracking-wider text-[9px] bg-white cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('uptime')}>Total Uptime {sortConfig.key === 'uptime' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                </tr>
              )}
            </thead>
            <tbody>
              {loading && sessions.length === 0 && runningVouchers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center p-8 text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 size={16} className="animate-spin text-emerald-500" />
                      <span>Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center p-8 text-slate-500">Tidak ada sesi aktif ditemukan.</td>
                </tr>
              ) : activeTab === 'Sedang Online' ? (
                currentItems.map(s => (
                  <tr key={s['.id']} className="cursor-pointer transition-colors hover:bg-slate-50">
                    <td className="py-1.5 px-2 font-bold text-slate-900 border border-slate-200 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        {s.user}
                      </div>
                    </td>
                    <td className="py-1.5 px-2 text-slate-600 font-mono border border-slate-200 text-[10px] text-center">{s.address}</td>
                    <td className="py-1.5 px-2 text-slate-600 font-mono border border-slate-200 text-[10px] text-center">{s['mac-address']}</td>
                    <td className="py-1.5 px-2 text-emerald-600 font-bold border border-slate-200 text-center">{s.uptime}</td>
                    <td className="py-1.5 px-2 text-center border border-slate-200">
                      <button onClick={() => { setKickData({ id: s['.id'], username: s.user }); setShowKickModal(true); }} title="Kick User" className="bg-white border border-red-200 w-5 h-5 rounded inline-flex items-center justify-center cursor-pointer transition-colors hover:bg-red-50 text-red-500 shadow-sm">
                        <ShieldAlert size={11} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                currentItems.map(v => (
                  <tr key={v.code} className="cursor-pointer transition-colors hover:bg-slate-50">
                    <td className="py-1.5 px-2 font-bold text-slate-900 border border-slate-200 text-center">{v.code}</td>
                    <td className="py-1.5 px-2 text-slate-600 border border-slate-200 text-center"><span className="bg-slate-100 px-1.5 py-0.5 rounded font-semibold text-[9px]">{v.plan}</span></td>
                    <td className="py-1.5 px-2 text-slate-600 border border-slate-200 font-medium text-[10px] text-center">{formatTime(v.first_used_at)}</td>
                    <td className="py-1.5 px-2 text-red-500 font-bold border border-slate-200 text-[10px] text-center">{formatTime(v.expires_at)}</td>
                    <td className="py-1.5 px-2 text-amber-600 font-bold border border-slate-200 text-center">{v.uptime}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Status Bar */}
        <div className="mt-auto flex flex-col sm:flex-row sm:items-center justify-between px-3 py-1.5 border-t border-slate-100 bg-white text-[10px] font-medium text-slate-500 shrink-0 gap-2">
          <div className="flex items-center gap-1">
            <span>Menampilkan {currentFilteredData.length > 0 ? `${indexOfFirstItem + 1} - ${Math.min(indexOfLastItem, currentFilteredData.length)} dari ` : ''}<strong className="text-slate-800">{currentFilteredData.length}</strong></span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
             <div className="flex items-center gap-1.5">
               <span>Per Hal:</span>
               <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="py-0.5 px-1.5 border border-slate-200 rounded text-[10px] font-bold outline-none bg-white text-slate-700 cursor-pointer shadow-sm hover:border-slate-300 transition-colors">
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={500}>500</option>
               </select>
             </div>
             <div className="flex items-center gap-1">
               <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className={`w-6 h-6 flex items-center justify-center border border-slate-200 rounded transition-colors font-bold ${currentPage === 1 ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-white text-slate-600 cursor-pointer hover:bg-slate-100 hover:text-slate-900 shadow-sm'}`}>&lt;</button>
               <span className="font-bold text-slate-800 px-2">{currentPage} / {totalPages || 1}</span>
               <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className={`w-6 h-6 flex items-center justify-center border border-slate-200 rounded transition-colors font-bold ${currentPage === totalPages || totalPages === 0 ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-white text-slate-600 cursor-pointer hover:bg-slate-100 hover:text-slate-900 shadow-sm'}`}>&gt;</button>
             </div>
          </div>
        </div>
      </div>

      {/* Kick Modal (Premium Style) */}
      {showKickModal && kickData && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-[360px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            
            <div className="pt-6 px-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center mb-4">
                <ShieldAlert size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 m-0 mb-2">Kick Pengguna</h3>
              <p className="text-sm text-slate-600 m-0 leading-relaxed">
                Putuskan koneksi <strong className="text-slate-900">{kickData.username}</strong> dari jaringan WiFi? Pengguna harus login ulang.
              </p>
            </div>
            
            <div className="p-6 flex gap-3 justify-center">
              <button type="button" onClick={() => { setShowKickModal(false); setKickData(null); }} className="flex-1 py-2.5 px-4 border border-slate-200 bg-white text-slate-600 cursor-pointer rounded-xl text-sm font-semibold transition-colors hover:bg-slate-50">Batal</button>
              <button type="button" onClick={confirmKick} disabled={isKicking} className={`flex-1 py-2.5 px-4 border-none bg-red-500 text-white rounded-xl text-sm font-semibold transition-all flex justify-center items-center ${isKicking ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:bg-red-600 hover:shadow-[0_4px_6px_rgba(239,68,68,0.2)]'}`}>
                {isKicking ? <Loader2 size={16} className="animate-spin" /> : 'Ya, Kick User'}
              </button>
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
