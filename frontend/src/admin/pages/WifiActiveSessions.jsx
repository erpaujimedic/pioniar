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
  
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

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
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
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

  const filteredSessions = sessions.filter(s => 
    (s.user || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.address || '').includes(searchTerm) ||
    (s['mac-address'] || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredRunning = runningVouchers.filter(v => 
    (v.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.plan || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const formatTime = (isoString) => {
    if (!isoString) return '-';
    try {
        const date = new Date(isoString);
        return date.toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' });
    } catch { return isoString; }
  };

  // Calculate Pagination Data
  const currentFilteredData = activeTab === 'Sedang Online' ? filteredSessions : filteredRunning;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = currentFilteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(currentFilteredData.length / itemsPerPage);

  return (
    <div className="animate-fade-in" style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Main Container */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, backgroundColor: '#ffffff', overflow: 'hidden' }}>
        
        {/* Action Bar */}
        <div style={{ display: 'flex', gap: '12px', padding: '16px 20px', backgroundColor: '#ffffff', borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
          
          {/* Tabs Filter */}
          <div style={{ display: 'flex', gap: '8px', padding: '4px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <button 
              onClick={() => { setActiveTab('Sedang Online'); setCurrentPage(1); }}
              style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: activeTab === 'Sedang Online' ? '#ffffff' : 'transparent', color: activeTab === 'Sedang Online' ? '#0f172a' : '#64748b', fontWeight: activeTab === 'Sedang Online' ? '600' : '500', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeTab === 'Sedang Online' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
            >
              Sedang Online ({sessions.length})
            </button>
            <button 
              onClick={() => { setActiveTab('Voucher Berjalan'); setCurrentPage(1); }}
              style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: activeTab === 'Voucher Berjalan' ? '#ffffff' : 'transparent', color: activeTab === 'Voucher Berjalan' ? '#0f172a' : '#64748b', fontWeight: activeTab === 'Voucher Berjalan' ? '600' : '500', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeTab === 'Voucher Berjalan' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
            >
              Voucher Berjalan ({runningVouchers.length})
            </button>
          </div>
          
          <div style={{ flex: 1 }}></div>

          {/* Search & Refresh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', padding: '6px 12px', borderRadius: '8px', transition: 'border-color 0.2s' }}>
              <Search size={16} color="#64748b" />
              <input 
                type="text" 
                placeholder="Cari username, IP, MAC..." 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                style={{ border: 'none', outline: 'none', padding: '2px 8px', fontSize: '14px', width: '200px', backgroundColor: 'transparent', color: '#0f172a' }}
              />
            </div>
            
            <button 
              onClick={fetchSessions} 
              disabled={loading}
              title="Refresh Data"
              style={{ backgroundColor: '#ffffff', color: '#64748b', border: '1px solid #e2e8f0', padding: '8px', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseOver={e=>e.currentTarget.style.backgroundColor='#f8fafc'} onMouseOut={e=>e.currentTarget.style.backgroundColor='#ffffff'}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            </button>
          </div>
        </div>

        {/* Premium Table */}
        <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#ffffff', padding: '0 20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', marginTop: '8px' }}>
            <thead style={{ backgroundColor: '#ffffff', position: 'sticky', top: 0, zIndex: 1 }}>
              {activeTab === 'Sedang Online' ? (
                <tr>
                  <th style={{ padding: '16px 12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Username</th>
                  <th style={{ padding: '16px 12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontWeight: '600', color: '#475569' }}>IP Address</th>
                  <th style={{ padding: '16px 12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontWeight: '600', color: '#475569' }}>MAC Address</th>
                  <th style={{ padding: '16px 12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Uptime</th>
                  <th style={{ padding: '16px 12px', borderBottom: '2px solid #e2e8f0', textAlign: 'center', fontWeight: '600', color: '#475569' }}>Aksi</th>
                </tr>
              ) : (
                <tr>
                  <th style={{ padding: '16px 12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Username</th>
                  <th style={{ padding: '16px 12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Paket</th>
                  <th style={{ padding: '16px 12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Login Pertama</th>
                  <th style={{ padding: '16px 12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Selesai Pada</th>
                  <th style={{ padding: '16px 12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Total Uptime</th>
                </tr>
              )}
            </thead>
            <tbody>
              {loading && sessions.length === 0 && runningVouchers.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Loader2 size={24} className="animate-spin" color="#3b82f6" />
                      <span>Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>Tidak ada sesi aktif ditemukan.</td>
                </tr>
              ) : activeTab === 'Sedang Online' ? (
                currentItems.map(s => (
                  <tr key={s['.id']} style={{ cursor: 'pointer', transition: 'background-color 0.2s', borderBottom: '1px solid #f1f5f9' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '16px 12px', fontWeight: '600', color: '#0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                        {s.user}
                      </div>
                    </td>
                    <td style={{ padding: '16px 12px', color: '#475569', fontFamily: 'monospace' }}>{s.address}</td>
                    <td style={{ padding: '16px 12px', color: '#475569', fontFamily: 'monospace' }}>{s['mac-address']}</td>
                    <td style={{ padding: '16px 12px', color: '#10b981', fontWeight: '500' }}>{s.uptime}</td>
                    <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                      <button onClick={() => { setKickData({ id: s['.id'], username: s.user }); setShowKickModal(true); }} title="Kick User" style={{ background: '#fef2f2', border: '1px solid #fee2e2', cursor: 'pointer', padding: '6px', borderRadius: '6px', transition: 'all 0.2s', display: 'inline-flex' }} onMouseOver={e=>e.currentTarget.style.backgroundColor='#fee2e2'} onMouseOut={e=>e.currentTarget.style.backgroundColor='#fef2f2'}>
                        <ShieldAlert size={16} color="#ef4444" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                currentItems.map(v => (
                  <tr key={v.code} style={{ cursor: 'pointer', transition: 'background-color 0.2s', borderBottom: '1px solid #f1f5f9' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '16px 12px', fontWeight: '500', color: '#0f172a' }}>{v.code}</td>
                    <td style={{ padding: '16px 12px', color: '#475569' }}><span style={{ backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '13px' }}>{v.plan}</span></td>
                    <td style={{ padding: '16px 12px', color: '#475569' }}>{formatTime(v.first_used_at)}</td>
                    <td style={{ padding: '16px 12px', color: '#ef4444', fontWeight: '500' }}>{formatTime(v.expires_at)}</td>
                    <td style={{ padding: '16px 12px', color: '#f59e0b', fontWeight: '500' }}>{v.uptime}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Status Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff', fontSize: '14px', color: '#475569' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Menampilkan {currentFilteredData.length > 0 ? `${indexOfFirstItem + 1} - ${Math.min(indexOfLastItem, currentFilteredData.length)} dari ` : ''}<strong>{currentFilteredData.length}</strong> total item</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               <span>Per Halaman:</span>
               <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} style={{ padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', outline: 'none', backgroundColor: '#f8fafc' }}>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={150}>150</option>
               </select>
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} style={{ padding: '4px 8px', border: '1px solid #e2e8f0', backgroundColor: currentPage === 1 ? '#f8fafc' : '#ffffff', color: currentPage === 1 ? '#cbd5e1' : '#475569', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', borderRadius: '6px', transition: 'all 0.2s' }}>Sebelumnya</button>
               <span style={{ fontWeight: '500', color: '#0f172a' }}>{currentPage} / {totalPages || 1}</span>
               <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} style={{ padding: '4px 8px', border: '1px solid #e2e8f0', backgroundColor: currentPage === totalPages || totalPages === 0 ? '#f8fafc' : '#ffffff', color: currentPage === totalPages || totalPages === 0 ? '#cbd5e1' : '#475569', cursor: currentPage === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer', borderRadius: '6px', transition: 'all 0.2s' }}>Selanjutnya</button>
             </div>
          </div>
        </div>
      </div>

      {/* Kick Modal (Premium Style) */}
      {showKickModal && kickData && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '100%', maxWidth: '360px', backgroundColor: '#ffffff', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ padding: '24px 24px 0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <ShieldAlert size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0' }}>Kick Pengguna</h3>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                Putuskan koneksi <strong>{kickData.username}</strong> dari jaringan WiFi? Pengguna harus login ulang.
              </p>
            </div>
            
            <div style={{ padding: '24px', display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '8px' }}>
              <button type="button" onClick={() => { setShowKickModal(false); setKickData(null); }} style={{ flex: 1, padding: '10px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#475569', cursor: 'pointer', borderRadius: '10px', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s' }}>Batal</button>
              <button type="button" onClick={confirmKick} disabled={isKicking} style={{ flex: 1, padding: '10px', border: 'none', backgroundColor: '#ef4444', color: '#ffffff', cursor: isKicking ? 'not-allowed' : 'pointer', borderRadius: '10px', fontSize: '14px', fontWeight: '600', opacity: isKicking ? 0.7 : 1, transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(239, 68, 68, 0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {isKicking ? <Loader2 size={16} className="animate-spin" /> : 'Ya, Kick User'}
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
