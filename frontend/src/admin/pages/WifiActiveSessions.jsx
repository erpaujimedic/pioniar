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
      <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.5rem', overflow: 'hidden' }}>
        {/* Top Control Bar Card */}
        <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--pioniar-border)', padding: '0.75rem 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff' }}>
          
          {/* Left: Refresh, Switcher & KPI Cards */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', maxWidth: '100%', flex: '1 1 auto', overflow: 'hidden' }}>
            <button 
              onClick={fetchSessions} 
              disabled={loading}
              title="Refresh Data"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', backgroundColor: '#ffffff', border: '1px solid var(--pioniar-border)', color: '#64748b', borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', flexShrink: 0 }} 
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} 
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            </button>
            
            <div className="hide-scrollbar" style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', flex: 1, paddingBottom: '0.1rem', WebkitOverflowScrolling: 'touch' }}>
              <div 
                onClick={() => { setActiveTab('Sedang Online'); setCurrentPage(1); }}
                style={{ cursor: 'pointer', backgroundColor: activeTab === 'Sedang Online' ? '#ffffff' : '#f8fafc', border: '1px solid', borderColor: activeTab === 'Sedang Online' ? 'var(--pioniar-primary)' : 'var(--pioniar-border)', padding: '0.35rem 0.75rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: activeTab === 'Sedang Online' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', whiteSpace: 'nowrap' }}
              >
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: activeTab === 'Sedang Online' ? 'var(--pioniar-primary)' : '#64748b', letterSpacing: '0.02em' }}>SEDANG ONLINE</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginLeft: '0.25rem' }}>{sessions.length}</span>
              </div>
              <div 
                onClick={() => { setActiveTab('Voucher Berjalan'); setCurrentPage(1); }}
                style={{ cursor: 'pointer', backgroundColor: activeTab === 'Voucher Berjalan' ? '#ffffff' : '#f8fafc', border: '1px solid', borderColor: activeTab === 'Voucher Berjalan' ? '#f59e0b' : 'var(--pioniar-border)', padding: '0.35rem 0.75rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: activeTab === 'Voucher Berjalan' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', whiteSpace: 'nowrap' }}
              >
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: activeTab === 'Voucher Berjalan' ? '#f59e0b' : '#64748b', letterSpacing: '0.02em' }}>VOUCHER BERJALAN</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginLeft: '0.25rem' }}>{runningVouchers.length}</span>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', flex: '1 1 300px', justifyContent: 'flex-end' }}>
            <div style={{ position: 'relative', flex: '1 1 150px' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Cari username, IP, MAC..." 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                style={{ padding: '0.45rem 1rem 0.45rem 2.5rem', borderRadius: '0.5rem', border: '1px solid var(--pioniar-border)', backgroundColor: '#f8fafc', color: 'var(--pioniar-text)', width: '100%', fontSize: '0.85rem', outline: 'none', transition: 'all 0.2s' }}
              />
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="glass-panel table-responsive" style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--pioniar-border)', display: 'flex', flexDirection: 'column', flex: 1, overflowX: 'auto', overflowY: 'hidden', backgroundColor: '#ffffff' }}>
          {loading && sessions.length === 0 && runningVouchers.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '3rem', color: 'var(--pioniar-text-muted)' }}>
              <HexLoader size={48} color="var(--pioniar-primary)" />
              <p style={{ marginTop: '1rem' }}>Memuat data...</p>
            </div>
          ) : activeTab === 'Sedang Online' ? (
            filteredSessions.length === 0 ? (
              <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--pioniar-text-muted)' }}>
                <div style={{ background: '#f8fafc', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', border: '1px solid #e2e8f0' }}>
                  <Activity size={24} color="#94a3b8" />
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--pioniar-primary)' }}>Data kosong.</div>
                <div style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>{searchTerm ? 'Tidak ada kecocokan pencarian.' : 'Tidak ada pengguna aktif saat ini.'}</div>
              </div>
            ) : (
              <div style={{ minWidth: '800px', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <div style={{ padding: '0.8rem 1.5rem', display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1.5fr 1fr 100px', fontWeight: 600, fontSize: '0.75rem', color: '#94a3b8', letterSpacing: '0.05em', borderBottom: '1px solid var(--pioniar-border)', backgroundColor: '#f8fafc', textTransform: 'uppercase' }}>
                  <div>USERNAME</div>
                  <div>IP ADDRESS</div>
                  <div>MAC ADDRESS</div>
                  <div>UPTIME</div>
                  <div style={{ textAlign: 'center' }}>AKSI</div>
                </div>
                
                <div style={{ backgroundColor: '#ffffff', flex: 1, overflowY: 'auto' }}>
                  {activeTab === 'Sedang Online' && currentItems.map(s => (
                    <div key={s['.id']} style={{ padding: '0.6rem 1.5rem', display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1.5fr 1fr 100px', alignItems: 'center', borderBottom: '1px solid var(--pioniar-border)', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--pioniar-text)' }}>{s.user}</span>
                      <span style={{ color: 'var(--pioniar-text-muted)', fontSize: '0.85rem', fontFamily: 'monospace' }}>{s.address}</span>
                      <span style={{ color: 'var(--pioniar-text-muted)', fontSize: '0.85rem', fontFamily: 'monospace' }}>{s['mac-address']}</span>
                      <span style={{ color: '#f59e0b', fontWeight: 500, fontSize: '0.85rem' }}>{s.uptime}</span>
                      
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                        <button 
                          onClick={() => {
                            setKickData({ id: s['.id'], username: s.user });
                            setShowKickModal(true);
                          }}
                          title="Kick / Putuskan Koneksi"
                          style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.4rem 0.6rem', borderRadius: '0.25rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 600 }} 
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ef4444'; e.currentTarget.style.color = '#fff' }} 
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444' }}
                        >
                          <ShieldAlert size={14} /> Kick
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : (
            filteredRunning.length === 0 ? (
              <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--pioniar-text-muted)' }}>
                <div style={{ background: '#f8fafc', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', border: '1px solid #e2e8f0' }}>
                  <Activity size={24} color="#94a3b8" />
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--pioniar-primary)' }}>Data kosong.</div>
                <div style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>{searchTerm ? 'Tidak ada kecocokan pencarian.' : 'Tidak ada voucher yang sedang berjalan.'}</div>
              </div>
            ) : (
              <div style={{ minWidth: '800px', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <div style={{ padding: '0.8rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', fontWeight: 600, fontSize: '0.75rem', color: '#94a3b8', letterSpacing: '0.05em', borderBottom: '1px solid var(--pioniar-border)', backgroundColor: '#f8fafc', textTransform: 'uppercase' }}>
                  <div>USERNAME</div>
                  <div>PAKET</div>
                  <div>LOGIN PERTAMA</div>
                  <div>EXPIRES AT</div>
                  <div>UPTIME (TOTAL)</div>
                </div>
                
                <div style={{ backgroundColor: '#ffffff', flex: 1, overflowY: 'auto' }}>
                  {activeTab === 'Voucher Berjalan' && currentItems.map(v => (
                    <div key={v.code} style={{ padding: '0.6rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', alignItems: 'center', borderBottom: '1px solid var(--pioniar-border)', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--pioniar-text)' }}>{v.code}</span>
                      <span style={{ color: 'var(--pioniar-text-muted)', fontSize: '0.85rem' }}>{v.plan}</span>
                      <span style={{ color: 'var(--pioniar-text-muted)', fontSize: '0.85rem' }}>{formatTime(v.first_used_at)}</span>
                      <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.85rem' }}>{formatTime(v.expires_at)}</span>
                      <span style={{ color: '#f59e0b', fontWeight: 500, fontSize: '0.85rem' }}>{v.uptime}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          {/* Pagination Footer */}
          {!loading && currentFilteredData.length > 0 && (
            <div style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--pioniar-border)', backgroundColor: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--pioniar-text-muted)' }}>
                  <span>Tampilkan</span>
                  <select 
                    value={itemsPerPage} 
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    style={{ padding: '0.2rem', borderRadius: '0.25rem', border: '1px solid var(--pioniar-border)', backgroundColor: 'var(--pioniar-bg)', color: 'var(--pioniar-text)', fontSize: '0.8rem', outline: 'none' }}
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={150}>150</option>
                  </select>
                  <span>data</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--pioniar-text-muted)', borderLeft: '1px solid var(--pioniar-border)', paddingLeft: '0.75rem' }}>
                  Menampilkan {currentFilteredData.length === 0 ? 0 : indexOfFirstItem + 1} - {Math.min(indexOfLastItem, currentFilteredData.length)} dari {currentFilteredData.length}
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', borderRadius: '0.25rem', border: '1px solid var(--pioniar-border)', backgroundColor: currentPage === 1 ? 'transparent' : '#ffffff', color: currentPage === 1 ? '#cbd5e1' : 'var(--pioniar-text)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  Prev
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', borderRadius: '0.25rem', border: '1px solid var(--pioniar-border)', backgroundColor: currentPage === totalPages || totalPages === 0 ? 'transparent' : '#ffffff', color: currentPage === totalPages || totalPages === 0 ? '#cbd5e1' : 'var(--pioniar-text)', cursor: currentPage === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Kick Modal */}
      {showKickModal && kickData && createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', borderRadius: 'var(--radius-xl)', padding: '2rem', backgroundColor: 'var(--pioniar-bg)', position: 'relative', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '50%' }}><ShieldAlert size={40} color="#ef4444" /></div>
            </div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Kick {kickData.username}?</h2>
            <p style={{ color: 'var(--pioniar-text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Pengguna akan langsung terputus dari jaringan WiFi dan harus login kembali.</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" className="btn" onClick={() => { setShowKickModal(false); setKickData(null); }} style={{ flex: 1 }}>Batal</button>
              <button type="button" className="btn" onClick={confirmKick} disabled={isKicking} style={{ flex: 1, backgroundColor: '#ef4444', color: '#fff', border: 'none', display: 'flex', justifyContent: 'center' }}>
                {isKicking ? <Loader2 size={18} className="animate-spin" /> : 'Ya, Kick User'}
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
