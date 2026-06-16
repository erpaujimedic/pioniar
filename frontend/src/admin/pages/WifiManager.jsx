import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, MoreVertical, Server, X, Loader2, RefreshCw, CheckCircle, AlertCircle, ChevronDown, Printer, Trash2, Edit2 } from 'lucide-react';
import HexLoader from '../../components/HexLoader';

export default function WifiManager() {
  const [vouchers, setVouchers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editData, setEditData] = useState({ id: '', username: '', password: '', plan: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [generateMode, setGenerateMode] = useState('voucher'); // voucher, member, bulk
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', plan: 'voucher_harian', quantity: 10 });
  const [activeTab, setActiveTab] = useState('Tersedia'); // Tab filter
  const [isPlanDropdownOpen, setIsPlanDropdownOpen] = useState(false);
  const [printData, setPrintData] = useState([]);
  const [selectedVouchers, setSelectedVouchers] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [notification, setNotification] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchVouchers = () => {
    setLoading(true);
    
    // Fetch profiles first
    fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/wifi/profiles')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProfiles(data);
          if (data.length > 0 && formData.plan === 'voucher_harian') {
             // Keep default or set to first available if needed
             setFormData(prev => ({...prev, plan: data[0].name}));
          }
        }
      })
      .catch(err => console.error("Failed to fetch profiles", err));

    fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/wifi/vouchers')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setVouchers(data);
        } else {
          setNotification({ type: 'error', message: data.error || 'Gagal mengambil data' });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch vouchers", err);
        setNotification({ type: 'error', message: 'Koneksi ke server terputus' });
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    
    try {
      const endpoint = generateMode === 'bulk' ? '/api/wifi/bulk-generate' : '/api/wifi/generate';
      const body = generateMode === 'bulk' 
        ? { quantity: formData.quantity, profile: formData.plan }
        : generateMode === 'member'
          ? { username: formData.username, password: formData.password, profile: formData.plan }
          : { username: formData.username, password: formData.username, profile: formData.plan };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const result = await res.json();
      
      if (res.ok) {
        if (generateMode === 'bulk') {
            setNotification({ type: 'success', message: result.message });
            setPrintData(result.vouchers); // Tampilkan UI print
            setShowModal(false);
        } else {
            setNotification({ type: 'success', message: `Voucher ${formData.username} berhasil dibuat!` });
            setShowModal(false);
            setFormData({ username: '', password: '', plan: 'voucher_harian', quantity: 10 });
        }
        fetchVouchers();
      } else {
        setNotification({ type: 'error', message: result.error || 'Gagal generate' });
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Koneksi ke server terputus' });
    }
    
    setIsGenerating(false);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/wifi/sync', { method: 'POST' });
      if (res.ok) {
        setNotification({ type: 'success', message: 'Sinkronisasi MikroTik berhasil' });
        fetchVouchers();
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Gagal sinkronisasi' });
    }
    setIsSyncing(false);
  };

  const confirmDelete = async () => {
    if (!deleteData) return;
    setIsDeleting(true);
    
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + `/api/wifi/vouchers/${deleteData.id}?username=${deleteData.username}`, { method: 'DELETE' });
      const result = await res.json();
      if (res.ok) {
        setNotification({ type: 'success', message: `Voucher ${deleteData.username} berhasil dihapus` });
        setShowDeleteModal(false);
        setDeleteData(null);
        fetchVouchers();
      } else {
        setNotification({ type: 'error', message: result.error || 'Gagal menghapus' });
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Koneksi ke server terputus' });
    }
    setIsDeleting(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsEditing(true);
    
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + `/api/wifi/vouchers/${editData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: editData.username,
          password: editData.password,
          plan: editData.plan
        })
      });
      
      const result = await res.json();
      if (res.ok) {
        setNotification({ type: 'success', message: `Voucher ${editData.username} berhasil diupdate` });
        setShowEditModal(false);
        fetchVouchers();
      } else {
        setNotification({ type: 'error', message: result.error || 'Gagal mengupdate' });
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Koneksi ke server terputus' });
    }
    setIsEditing(false);
  };

  const handleMarkPrinted = async (usernames) => {
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/wifi/mark-printed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames })
      });
      if (res.ok) {
        fetchVouchers();
      }
    } catch (err) {
      console.error('Failed to mark printed', err);
    }
  };

  // Pagination & Filtering Logic
  const filteredVouchers = vouchers.filter(v => {
    // Terapkan filter Tab
    if (activeTab === 'Tersedia') {
      if (v.uptime && v.uptime !== '0s') return false;
      if (v.first_used_at) return false;
      if (v.status === 'Kadaluarsa' || v.status === 'Berjalan') return false;
      return true;
    } else {
      // Tab Berjalan
      return v.status === 'Berjalan' || (v.uptime && v.uptime !== '0s' && v.status !== 'Kadaluarsa');
    }
  }).filter(v => {
    // Terapkan filter Search
    return (v.code || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  // KPI Stats
  const totalTersedia = vouchers.filter(v => {
    if (v.uptime && v.uptime !== '0s') return false;
    if (v.first_used_at) return false;
    if (v.status === 'Kadaluarsa' || v.status === 'Berjalan') return false;
    return true;
  }).length;
  
  const totalBerjalan = vouchers.filter(v => v.status === 'Berjalan' || (v.uptime && v.uptime !== '0s' && v.status !== 'Kadaluarsa')).length;
  
  const totalDicetak = vouchers.filter(v => v.is_printed).length;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentVouchers = filteredVouchers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredVouchers.length / itemsPerPage);

  return (
    <div className="animate-fade-in" style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* Notifications */}
      {notification && createPortal(
        <div className="animate-slide-up" style={{
          position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
          background: notification.type === 'success' ? '#ffffff' : '#fef2f2',
          border: `1px solid ${notification.type === 'success' ? '#10b981' : '#f87171'}`,
          padding: '0.6rem 1rem', borderRadius: '2rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)', 
          color: notification.type === 'success' ? '#0f172a' : '#991b1b',
          minWidth: '300px', justifyContent: 'center'
        }}>
          {notification.type === 'success' ? <CheckCircle size={16} color="#10b981" /> : <AlertCircle size={16} color="#ef4444" />}
          <span style={{ fontWeight: 600, fontSize: '0.85rem', flex: 1, textAlign: 'center' }}>{notification.message}</span>
          <button onClick={() => setNotification(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.2rem', borderRadius: '50%', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
            <X size={14} />
          </button>
        </div>,
        document.body
      )}

      {/* Voucher Table Section (EAM Style) */}
      <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.5rem', overflow: 'hidden' }}>
        {/* Top Control Bar Card */}
        <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--pioniar-border)', padding: '0.75rem 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff' }}>
          
          {/* Left: Refresh, Switcher & KPI Cards */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', maxWidth: '100%', flex: '1 1 auto', overflow: 'hidden' }}>
            <button onClick={handleSync} title="Sync MikroTik" disabled={isSyncing} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', backgroundColor: '#ffffff', border: '1px solid var(--pioniar-border)', color: '#64748b', borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', flexShrink: 0 }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}>
              {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            </button>
            
            {/* KPI Cards / Tabs */}
            <div className="hide-scrollbar" style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', flex: 1, paddingBottom: '0.1rem', WebkitOverflowScrolling: 'touch' }}>
              <div 
                onClick={() => { setActiveTab('Tersedia'); setCurrentPage(1); }}
                style={{ cursor: 'pointer', backgroundColor: activeTab === 'Tersedia' ? '#ffffff' : '#f8fafc', border: '1px solid', borderColor: activeTab === 'Tersedia' ? '#10b981' : 'var(--pioniar-border)', padding: '0.35rem 0.75rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: activeTab === 'Tersedia' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
              >
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: activeTab === 'Tersedia' ? '#10b981' : '#64748b', letterSpacing: '0.02em' }}>TERSEDIA</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginLeft: '0.25rem' }}>{totalTersedia}</span>
              </div>
              <div 
                onClick={() => { setActiveTab('Berjalan'); setCurrentPage(1); }}
                style={{ cursor: 'pointer', backgroundColor: activeTab === 'Berjalan' ? '#ffffff' : '#f8fafc', border: '1px solid', borderColor: activeTab === 'Berjalan' ? '#f59e0b' : 'var(--pioniar-border)', padding: '0.35rem 0.75rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: activeTab === 'Berjalan' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
              >
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: activeTab === 'Berjalan' ? '#f59e0b' : '#64748b', letterSpacing: '0.02em' }}>BERJALAN</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginLeft: '0.25rem' }}>{totalBerjalan}</span>
              </div>
            </div>
          </div>
            
          {/* Right: Search & Generate */}
          <div style={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'center', gap: '0.5rem', flex: '1 1 300px', justifyContent: 'flex-end', maxWidth: '100%' }}>
            {selectedVouchers.length > 0 && (
              <button 
                onClick={() => {
                  const toPrint = vouchers.filter(v => selectedVouchers.includes(v.code)).map(v => ({ username: v.code, password: v.code, plan: v.plan }));
                  setPrintData(toPrint);
                  setSelectedVouchers([]);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.875rem', backgroundColor: '#fff', border: '1px solid var(--pioniar-border)', color: 'var(--pioniar-text)', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', flexShrink: 0, whiteSpace: 'nowrap' }} 
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} 
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fff'}
              >
                <Printer size={14} /> Cetak ({selectedVouchers.length})
              </button>
            )}

            <div style={{ position: 'relative', flex: '1 1 auto', minWidth: 0, maxWidth: '300px' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Cari voucher..." 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                style={{ padding: '0.45rem 1rem 0.45rem 2.25rem', borderRadius: '0.5rem', border: '1px solid var(--pioniar-border)', backgroundColor: '#f8fafc', color: 'var(--pioniar-text)', fontSize: '0.85rem', width: '100%', outline: 'none', transition: 'all 0.2s' }}
              />
            </div>
            
            <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.875rem', backgroundColor: 'var(--pioniar-primary)', border: '1px solid var(--pioniar-primary)', color: '#ffffff', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px 0 rgba(40, 96, 134, 0.2)', flexShrink: 0, whiteSpace: 'nowrap' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1e4a68'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--pioniar-primary)'}>
              <Plus size={14} strokeWidth={3} /> Generate
            </button>
          </div>
        </div>

        {/* Table Card */}
        <div className="glass-panel table-responsive" style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--pioniar-border)', display: 'flex', flexDirection: 'column', flex: 1, overflowX: 'auto', overflowY: 'hidden', backgroundColor: '#ffffff' }}>
          <div style={{ minWidth: '600px', display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>
          {/* EAM Standalone Table Header Row */}
          <div style={{ padding: '0.75rem 1.5rem', display: 'grid', gridTemplateColumns: '40px 2fr 2fr 1fr 100px', borderBottom: '1px solid var(--pioniar-border)', backgroundColor: '#ffffff', alignItems: 'center' }}>
          <input 
            type="checkbox" 
            checked={currentVouchers.length > 0 && selectedVouchers.length === currentVouchers.length}
            onChange={(e) => {
              if (e.target.checked) setSelectedVouchers(currentVouchers.map(v => v.code));
              else setSelectedVouchers([]);
            }}
            style={{ cursor: 'pointer' }}
          />
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kode Voucher</span>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paket (Plan)</span>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</span>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Aksi</span>
        </div>
        
        <div style={{ backgroundColor: '#ffffff', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--pioniar-text-muted)', padding: '3rem' }}>
              <HexLoader size={48} color="var(--pioniar-primary)" />
              <p style={{ marginTop: '1rem' }}>Memuat data dari MikroTik...</p>
            </div>
          ) : activeTab === 'Voucher Tersedia' && filteredVouchers.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--pioniar-text-muted)' }}>
              <div style={{ background: '#f8fafc', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', border: '1px solid #e2e8f0' }}>
                <Server size={24} color="#94a3b8" />
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--pioniar-primary)' }}>Data kosong.</div>
              <div style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>{searchTerm ? 'Tidak ada kecocokan pencarian voucher.' : 'Belum ada voucher tersedia. Silakan buat voucher baru.'}</div>
            </div>
          ) : activeTab === 'Voucher Aktif' && filteredVouchers.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--pioniar-text-muted)' }}>
              <div style={{ background: '#f8fafc', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', border: '1px solid #e2e8f0' }}>
                <Server size={24} color="#94a3b8" />
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--pioniar-primary)' }}>Data kosong.</div>
              <div style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>{searchTerm ? 'Tidak ada kecocokan pencarian.' : 'Belum ada user yang terhubung ke jaringan saat ini.'}</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {currentVouchers.map(v => (
                  <div key={v.id || v.code} style={{ padding: '0.4rem 1.5rem', display: 'grid', gridTemplateColumns: '40px 2fr 2fr 1fr 100px', alignItems: 'center', borderBottom: '1px solid var(--pioniar-border)', transition: 'background-color 0.2s', cursor: 'pointer', backgroundColor: v.is_printed === false ? 'rgba(250, 204, 21, 0.08)' : 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = v.is_printed === false ? 'rgba(250, 204, 21, 0.08)' : 'transparent'}>
                    <input 
                      type="checkbox" 
                      checked={selectedVouchers.includes(v.code)}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (e.target.checked) setSelectedVouchers([...selectedVouchers, v.code]);
                        else setSelectedVouchers(selectedVouchers.filter(code => code !== v.code));
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--pioniar-text)' }}>{v.code}</span>
                    <span style={{ color: 'var(--pioniar-text-muted)', fontSize: '0.85rem' }}>{v.plan}</span>
                    <span>
                      <span style={{ 
                        padding: '0.25rem 0.6rem', 
                        borderRadius: '1rem', 
                        fontSize: '0.7rem', 
                        fontWeight: 700,
                        backgroundColor: v.status === 'Aktif' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        color: v.status === 'Aktif' ? 'var(--pioniar-accent)' : 'var(--pioniar-warning)'
                      }}>
                        {v.status}
                      </span>
                    </span>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.25rem' }}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setPrintData([{ username: v.code, password: v.code, plan: v.plan }]);
                        }}
                        title="Cetak Karcis"
                        style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.4rem', borderRadius: '0.25rem', transition: 'all 0.2s' }} 
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.1)'; e.currentTarget.style.color = 'var(--pioniar-accent)' }} 
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b' }}
                      >
                        <Printer size={15} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditData({ id: v.id, username: v.code, password: '', plan: v.plan });
                          setShowEditModal(true);
                        }}
                        title="Edit Voucher"
                        style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.4rem', borderRadius: '0.25rem', transition: 'all 0.2s' }} 
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.1)'; e.currentTarget.style.color = 'var(--pioniar-warning)' }} 
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b' }}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteData({ id: v.id, username: v.code });
                          setShowDeleteModal(true);
                        }}
                        title="Hapus Voucher"
                        style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.4rem', borderRadius: '0.25rem', transition: 'all 0.2s' }} 
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444' }} 
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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
                    Menampilkan {filteredVouchers.length === 0 ? 0 : indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredVouchers.length)} dari {filteredVouchers.length}
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
            </div>
          )}
        </div>
        </div>
      </div>
      </div>

      {/* Generate Voucher Modal */}
      {showModal && createPortal(
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="glass-panel animate-fade-in" style={{
            width: '100%', maxWidth: '450px', borderRadius: 'var(--radius-xl)', 
            padding: '2rem', backgroundColor: 'var(--pioniar-bg)', position: 'relative'
          }}>
            <button 
              onClick={() => setShowModal(false)}
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--pioniar-text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Generate Voucher</h2>
            <p style={{ color: 'var(--pioniar-text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Buat akses internet baru untuk pelanggan.</p>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.25rem', borderRadius: '0.5rem' }}>
              <button 
                type="button"
                onClick={() => setGenerateMode('voucher')}
                style={{ flex: 1, padding: '0.5rem', borderRadius: '0.25rem', border: 'none', background: generateMode === 'voucher' ? 'var(--pioniar-primary)' : 'transparent', color: generateMode === 'voucher' ? '#fff' : 'var(--pioniar-text-muted)', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500, fontSize: '0.875rem' }}
              >Voucher</button>
              <button 
                type="button"
                onClick={() => setGenerateMode('member')}
                style={{ flex: 1, padding: '0.5rem', borderRadius: '0.25rem', border: 'none', background: generateMode === 'member' ? 'var(--pioniar-primary)' : 'transparent', color: generateMode === 'member' ? '#fff' : 'var(--pioniar-text-muted)', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500, fontSize: '0.875rem' }}
              >Member</button>
              <button 
                type="button"
                onClick={() => setGenerateMode('bulk')}
                style={{ flex: 1, padding: '0.5rem', borderRadius: '0.25rem', border: 'none', background: generateMode === 'bulk' ? 'var(--pioniar-primary)' : 'transparent', color: generateMode === 'bulk' ? '#fff' : 'var(--pioniar-text-muted)', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500, fontSize: '0.875rem' }}
              >Bulk</button>
            </div>
            
            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {generateMode === 'voucher' ? (
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--pioniar-text-muted)', marginBottom: '0.5rem' }}>
                    Kode Voucher
                  </label>
                  <input 
                    type="text" 
                    className="input-base" 
                    required={generateMode === 'voucher'}
                    placeholder="Contoh: PION-1234"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--pioniar-text-muted)', marginTop: '0.5rem' }}>*Kode ini berlaku sebagai username sekaligus password.</p>
                </div>
              ) : generateMode === 'member' ? (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--pioniar-text-muted)', marginBottom: '0.5rem' }}>
                      Username Member
                    </label>
                    <input 
                      type="text" 
                      className="input-base" 
                      required={generateMode === 'member'}
                      placeholder="Contoh: eepridwan"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--pioniar-text-muted)', marginBottom: '0.5rem' }}>
                      Password
                    </label>
                    <input 
                      type="text" 
                      className="input-base" 
                      required={generateMode === 'member'}
                      placeholder="Password untuk koneksi"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--pioniar-text-muted)', marginBottom: '0.5rem' }}>
                    Jumlah Voucher (Maks: 100)
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    max="100"
                    className="input-base" 
                    required={generateMode === 'bulk'}
                    placeholder="Contoh: 10"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || ''})}
                    style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--pioniar-text-muted)', marginTop: '0.5rem' }}>*Username dan password akan di-generate otomatis secara acak.</p>
                </div>
              )}
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--pioniar-text-muted)', marginBottom: '0.5rem' }}>
                  Pilih Paket (Plan)
                </label>
                <div style={{ position: 'relative' }}>
                  <select 
                    className="input-base"
                    value={formData.plan}
                    onChange={(e) => setFormData({...formData, plan: e.target.value})}
                    style={{ width: '100%', appearance: 'none', cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.02)' }}
                  >
                    {profiles.map(p => (
                      <option key={p.id} value={p.name}>
                        {p.name === 'default' ? 'Default Plan' : p.name} 
                        {p.rate_limit ? ` (Limit ${p.rate_limit})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} color="#94a3b8" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
              </div>
              
              <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.375rem', border: '1px dashed #cbd5e1' }}>
                 <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>*Catatan: Masa aktif dan Limit Kecepatan mengikuti pengaturan profil/paket.</p>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn" onClick={() => setShowModal(false)} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--pioniar-text)' }}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={isGenerating} style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                  {isGenerating ? <Loader2 size={18} className="animate-spin" /> : 'Generate Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Print Success Modal */}
      {printData.length > 0 && createPortal(
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="glass-panel animate-fade-in" style={{
            width: '100%', maxWidth: '400px', borderRadius: 'var(--radius-xl)', 
            padding: '2.5rem 2rem', backgroundColor: 'var(--pioniar-bg)', position: 'relative',
            textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '50%' }}>
                <CheckCircle size={40} color="#10b981" />
              </div>
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--pioniar-text)' }}>{printData.length} Voucher Siap!</h2>
            <p style={{ color: 'var(--pioniar-text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
              Silakan cetak menggunakan kertas A4.
            </p>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn" onClick={() => setPrintData([])} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.05)', color: 'var(--pioniar-text)' }}>
                Tutup
              </button>
              <button className="btn btn-primary" onClick={() => {
                handleMarkPrinted(printData.map(v => v.username));
                window.print();
              }} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                <Printer size={18} /> Cetak (A4)
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Modal */}
      {showEditModal && createPortal(
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="glass-panel animate-fade-in" style={{
            width: '100%', maxWidth: '400px', borderRadius: 'var(--radius-xl)', 
            padding: '2rem', backgroundColor: 'var(--pioniar-bg)', position: 'relative'
          }}>
            <button 
              onClick={() => setShowEditModal(false)}
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--pioniar-text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Edit {editData.username}</h2>
            <p style={{ color: 'var(--pioniar-text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Ubah password atau paket untuk pengguna ini.</p>
            
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--pioniar-text-muted)', marginBottom: '0.5rem' }}>
                  Password Baru (Kosongkan jika tidak diubah)
                </label>
                <input 
                  type="text" 
                  className="input-base" 
                  placeholder="Password baru"
                  value={editData.password}
                  onChange={(e) => setEditData({...editData, password: e.target.value})}
                  style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--pioniar-text-muted)', marginBottom: '0.5rem' }}>
                  Pilih Paket (Plan)
                </label>
                <div style={{ position: 'relative' }}>
                  <div 
                    onClick={() => setIsPlanDropdownOpen(!isPlanDropdownOpen)}
                    className="input-base"
                    style={{ backgroundColor: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                  >
                    <span style={{ color: editData.plan ? 'var(--pioniar-text)' : '#94a3b8' }}>
                      {editData.plan === 'voucher_harian' ? 'Voucher Harian (Limit 2Mbps)' : 
                       editData.plan === 'member_vip' ? 'Member VIP (Limit 5Mbps)' : editData.plan}
                    </span>
                    <ChevronDown size={16} color="#94a3b8" />
                  </div>
                  {isPlanDropdownOpen && (
                    <div className="animate-slide-up" style={{
                      position: 'absolute', top: 'calc(100% + 0.5rem)', left: 0, right: 0,
                      backgroundColor: 'var(--pioniar-bg)', border: '1px solid var(--pioniar-border)',
                      borderRadius: '0.5rem', overflow: 'hidden', zIndex: 100, boxShadow: '0 10px 25px rgba(0,0,0,0.4)'
                    }}>
                      {[
                        { id: 'voucher_harian', label: 'Voucher Harian (Limit 2Mbps)' },
                        { id: 'member_vip', label: 'Member VIP (Limit 5Mbps)' }
                      ].map(plan => (
                        <div 
                          key={plan.id}
                          onClick={() => {
                            setEditData({...editData, plan: plan.id});
                            setIsPlanDropdownOpen(false);
                          }}
                          style={{
                            padding: '0.75rem 1rem', cursor: 'pointer', fontSize: '0.9rem',
                            backgroundColor: editData.plan === plan.id ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                            color: editData.plan === plan.id ? 'var(--pioniar-accent)' : 'var(--pioniar-text)'
                          }}
                          onMouseOver={(e) => { if(editData.plan !== plan.id) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)' }}
                          onMouseOut={(e) => { if(editData.plan !== plan.id) e.currentTarget.style.backgroundColor = 'transparent' }}
                        >
                          {plan.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn" onClick={() => setShowEditModal(false)} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--pioniar-text)' }}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={isEditing} style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                  {isEditing ? <Loader2 size={18} className="animate-spin" /> : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Modal */}
      {showDeleteModal && deleteData && createPortal(
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="glass-panel animate-fade-in" style={{
            width: '100%', maxWidth: '400px', borderRadius: 'var(--radius-xl)', 
            padding: '2rem', backgroundColor: 'var(--pioniar-bg)', position: 'relative',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '50%' }}>
                <Trash2 size={40} color="#ef4444" />
              </div>
            </div>
            
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Hapus {deleteData.username}?</h2>
            <p style={{ color: 'var(--pioniar-text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Voucher ini akan dihapus permanen dari MikroTik dan database. Tindakan ini tidak dapat dibatalkan.
            </p>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" className="btn" onClick={() => { setShowDeleteModal(false); setDeleteData(null); }} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--pioniar-text)' }}>
                Batal
              </button>
              <button type="button" className="btn" onClick={confirmDelete} disabled={isDeleting} style={{ flex: 1, backgroundColor: '#ef4444', color: '#fff', border: 'none', display: 'flex', justifyContent: 'center' }}>
                {isDeleting ? <Loader2 size={18} className="animate-spin" /> : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Printable Area (Hidden normally, shown on print) */}
      <div id="printable-voucher-area">
        <style>
          {`
            @media screen {
              #printable-voucher-area { display: none; }
            }
            @media print {
              body * { visibility: hidden !important; }
              #printable-voucher-area, #printable-voucher-area * { visibility: visible !important; }
              #printable-voucher-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                grid-auto-rows: minmax(40mm, auto);
                gap: 5mm;
                padding: 10mm;
                background: white;
              }
              .voucher-card {
                border: 1.5px dashed #333;
                padding: 4mm;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                page-break-inside: avoid;
                font-family: 'Courier New', monospace;
                background: white;
                color: black;
                border-radius: 4mm;
              }
              @page { size: A4 portrait; margin: 0; }
            }
          `}
        </style>
        {printData.map((v, i) => (
          <div key={i} className="voucher-card">
            <div style={{ fontWeight: '900', fontSize: '13pt', marginBottom: '2mm', letterSpacing: '1px' }}>PIONIAR</div>
            <div style={{ fontSize: '11pt', marginBottom: '1mm' }}>{v.username}</div>
            <div style={{ fontSize: '8pt', color: '#666', borderTop: '1px solid #eee', paddingTop: '2mm', marginTop: '1mm', width: '100%', textAlign: 'center' }}>
              {v.plan === 'voucher_harian' ? 'Limit 2Mbps' : v.plan === 'member_vip' ? 'Limit 5Mbps' : v.plan}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
