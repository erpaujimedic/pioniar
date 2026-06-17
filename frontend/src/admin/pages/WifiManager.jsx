import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Minus, Search, MoreVertical, Server, X, Loader2, RefreshCw, CheckCircle, AlertCircle, ChevronDown, Printer, Trash2, Edit2 } from 'lucide-react';
import HexLoader from '../../components/HexLoader';

export default function WifiManager() {
  const [vouchers, setVouchers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editData, setEditData] = useState({ id: '', username: '', password: '', plan: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [generateMode, setGenerateMode] = useState('voucher'); // voucher, member, bulk
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', plan: 'voucher_harian', quantity: 10, char_type: 'numeric', length: 4, prefix: 'PION-' });
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
      const endpoint = (import.meta.env.VITE_API_BASE_URL || '') + (generateMode === 'bulk' ? '/api/wifi/bulk-generate' : '/api/wifi/generate');
      const body = generateMode === 'bulk' 
        ? { quantity: formData.quantity, profile: formData.plan, char_type: formData.char_type, length: formData.length, prefix: formData.prefix }
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
            setFormData({ username: '', password: '', plan: 'voucher_harian', quantity: 10, char_type: 'numeric', length: 4, prefix: 'PION-' });
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

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    let successCount = 0;
    
    const vouchersToDelete = vouchers.filter(v => selectedVouchers.includes(v.code));
    
    for (const v of vouchersToDelete) {
      try {
        const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + `/api/wifi/vouchers/${v.id}?username=${v.code}`, { method: 'DELETE' });
        if (res.ok) successCount++;
      } catch (err) {
        console.error("Gagal hapus", v.code);
      }
    }
    
    setNotification({ type: 'success', message: `${successCount} dari ${vouchersToDelete.length} voucher berhasil dihapus` });
    setSelectedVouchers([]);
    setIsDeleting(false);
    setShowBulkDeleteModal(false);
    fetchVouchers();
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

  // Auto-print when printData is set
  useEffect(() => {
    if (printData.length > 0) {
      handleMarkPrinted(printData.map(v => v.username));
      const timer = setTimeout(() => {
        window.print();
        setPrintData([]);
      }, 500); // 500ms delay to ensure DOM is updated and printable-voucher-area is rendered
      return () => clearTimeout(timer);
    }
  }, [printData]);

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

      {/* Voucher Table Section (Premium SaaS Style) */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, backgroundColor: '#ffffff', overflow: 'hidden' }}>
        {/* Action Bar */}
        <div style={{ display: 'flex', gap: '12px', padding: '16px 20px', backgroundColor: '#ffffff', borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
          <button onClick={() => setShowModal(true)} style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)' }} onMouseOver={e=>e.currentTarget.style.backgroundColor='#2563eb'} onMouseOut={e=>e.currentTarget.style.backgroundColor='#3b82f6'}>
            <Plus size={16} /> Generate Baru
          </button>
          
          <button onClick={() => setShowBulkDeleteModal(true)} disabled={selectedVouchers.length === 0} style={{ backgroundColor: '#ffffff', color: '#ef4444', border: '1px solid #fee2e2', padding: '8px 16px', borderRadius: '8px', cursor: selectedVouchers.length === 0 ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600', opacity: selectedVouchers.length === 0 ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }} onMouseOver={e=>{if(selectedVouchers.length>0) e.currentTarget.style.backgroundColor='#fef2f2'}} onMouseOut={e=>e.currentTarget.style.backgroundColor='#ffffff'}>
            <Minus size={16} /> Hapus ({selectedVouchers.length})
          </button>
          
          <div style={{ width: '1px', height: '20px', backgroundColor: '#e2e8f0', margin: '0 4px' }}></div>
          
          <button 
            onClick={() => {
              const toPrint = vouchers.filter(v => selectedVouchers.includes(v.code)).map(v => ({ username: v.code, password: v.code, plan: v.plan }));
              setPrintData(toPrint);
              setSelectedVouchers([]);
            }}
            disabled={selectedVouchers.length === 0} 
            style={{ backgroundColor: '#ffffff', color: '#475569', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '8px', cursor: selectedVouchers.length === 0 ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500', opacity: selectedVouchers.length === 0 ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
            onMouseOver={e=>{if(selectedVouchers.length>0) e.currentTarget.style.backgroundColor='#f8fafc'}} onMouseOut={e=>e.currentTarget.style.backgroundColor='#ffffff'}
          >
            <Printer size={16} /> Print
          </button>
          
          <button 
            onClick={() => {
              if (selectedVouchers.length === 1) {
                const v = vouchers.find(v => v.code === selectedVouchers[0]);
                if (v) {
                  setEditData({ id: v.id, username: v.code, password: '', plan: v.plan });
                  setShowEditModal(true);
                }
              }
            }}
            disabled={selectedVouchers.length !== 1} 
            style={{ backgroundColor: '#ffffff', color: '#475569', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '8px', cursor: selectedVouchers.length !== 1 ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500', opacity: selectedVouchers.length !== 1 ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
            onMouseOver={e=>{if(selectedVouchers.length===1) e.currentTarget.style.backgroundColor='#f8fafc'}} onMouseOut={e=>e.currentTarget.style.backgroundColor='#ffffff'}
          >
            <Edit2 size={16} /> Edit
          </button>

          <div style={{ flex: 1 }}></div>

          {/* Filter & Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Pill Tabs for Status */}
            <div style={{ display: 'flex', gap: '4px', padding: '4px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <button 
                onClick={() => { setActiveTab('Tersedia'); setCurrentPage(1); }} 
                style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: activeTab === 'Tersedia' ? '#ffffff' : 'transparent', color: activeTab === 'Tersedia' ? '#0f172a' : '#64748b', fontWeight: activeTab === 'Tersedia' ? '600' : '500', fontSize: '13px', cursor: 'pointer', boxShadow: activeTab === 'Tersedia' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                Tersedia 
                <span style={{ backgroundColor: activeTab === 'Tersedia' ? '#f1f5f9' : '#e2e8f0', color: activeTab === 'Tersedia' ? '#0f172a' : '#475569', padding: '2px 6px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>
                  {totalTersedia}
                </span>
              </button>
              <button 
                onClick={() => { setActiveTab('Berjalan'); setCurrentPage(1); }} 
                style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: activeTab === 'Berjalan' ? '#ffffff' : 'transparent', color: activeTab === 'Berjalan' ? '#0f172a' : '#64748b', fontWeight: activeTab === 'Berjalan' ? '600' : '500', fontSize: '13px', cursor: 'pointer', boxShadow: activeTab === 'Berjalan' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                Berjalan 
                <span style={{ backgroundColor: activeTab === 'Berjalan' ? '#f1f5f9' : '#e2e8f0', color: activeTab === 'Berjalan' ? '#0f172a' : '#475569', padding: '2px 6px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>
                  {totalBerjalan}
                </span>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', padding: '6px 12px', borderRadius: '8px', transition: 'border-color 0.2s' }}>
              <Search size={16} color="#64748b" />
              <input type="text" placeholder="Cari voucher..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} style={{ border: 'none', outline: 'none', padding: '2px 8px', fontSize: '14px', width: '160px', backgroundColor: 'transparent', color: '#0f172a' }} />
            </div>

            <button onClick={handleSync} disabled={isSyncing} title="Sync MikroTik" style={{ backgroundColor: '#ffffff', color: '#64748b', border: '1px solid #e2e8f0', padding: '8px', borderRadius: '8px', cursor: isSyncing ? 'not-allowed' : 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseOver={e=>e.currentTarget.style.backgroundColor='#f8fafc'} onMouseOut={e=>e.currentTarget.style.backgroundColor='#ffffff'}>
               {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            </button>
          </div>
        </div>

        {/* Premium Table */}
        <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#ffffff', padding: '0 20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', marginTop: '8px' }}>
            <thead style={{ backgroundColor: '#ffffff', position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                <th style={{ width: '40px', padding: '16px 12px', borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>
                  <input type="checkbox" checked={currentVouchers.length > 0 && selectedVouchers.length === currentVouchers.length} onChange={(e) => { if (e.target.checked) setSelectedVouchers(currentVouchers.map(v => v.code)); else setSelectedVouchers([]); }} style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#3b82f6' }} />
                </th>
                <th style={{ padding: '16px 12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Nama Voucher</th>
                <th style={{ padding: '16px 12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Paket Layanan</th>
                <th style={{ padding: '16px 12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Loader2 size={24} className="animate-spin" color="#3b82f6" />
                      <span>Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : currentVouchers.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>Belum ada data voucher.</td>
                </tr>
              ) : (
                currentVouchers.map(v => (
                  <tr key={v.id || v.code} onClick={() => { if (selectedVouchers.includes(v.code)) setSelectedVouchers(selectedVouchers.filter(c => c !== v.code)); else setSelectedVouchers([...selectedVouchers, v.code]); }} style={{ cursor: 'pointer', backgroundColor: selectedVouchers.includes(v.code) ? '#eff6ff' : 'transparent', borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }} onMouseEnter={e => { if (!selectedVouchers.includes(v.code)) e.currentTarget.style.backgroundColor = '#f8fafc' }} onMouseLeave={e => { if (!selectedVouchers.includes(v.code)) e.currentTarget.style.backgroundColor = 'transparent' }}>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input type="checkbox" checked={selectedVouchers.includes(v.code)} onChange={(e) => { e.stopPropagation(); if (e.target.checked) setSelectedVouchers([...selectedVouchers, v.code]); else setSelectedVouchers(selectedVouchers.filter(c => c !== v.code)); }} style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#3b82f6' }} />
                    </td>
                    <td style={{ padding: '12px', fontWeight: '500', color: '#0f172a' }}>{v.code}</td>
                    <td style={{ padding: '12px', color: '#475569' }}>
                      <span style={{ backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '13px' }}>{v.plan}</span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: v.status === 'Aktif' ? '#ecfdf5' : '#fffbeb', color: v.status === 'Aktif' ? '#10b981' : '#f59e0b', padding: '4px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: '500' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: v.status === 'Aktif' ? '#10b981' : '#f59e0b' }}></div>
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Status Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff', fontSize: '14px', color: '#475569' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Menampilkan {currentVouchers.length > 0 ? `${indexOfFirstItem + 1} - ${Math.min(indexOfLastItem, filteredVouchers.length)} dari ` : ''}<strong>{filteredVouchers.length}</strong> total item</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               <span>Per Halaman:</span>
               <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} style={{ padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', outline: 'none', backgroundColor: '#f8fafc' }}>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={500}>500</option>
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
      {/* Generate Voucher Modal (Premium Style) */}
      {showModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '100%', maxWidth: '480px', backgroundColor: '#ffffff', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={18} />
                </div>
                Generate Voucher
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px', borderRadius: '6px', transition: 'all 0.2s' }} onMouseOver={e=>e.currentTarget.style.backgroundColor='#e2e8f0'} onMouseOut={e=>e.currentTarget.style.backgroundColor='transparent'}>
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {/* Tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', padding: '4px', backgroundColor: '#f1f5f9', borderRadius: '12px' }}>
                <button 
                  type="button"
                  onClick={() => setGenerateMode('voucher')}
                  style={{ flex: 1, padding: '8px 16px', borderRadius: '8px', border: 'none', background: generateMode === 'voucher' ? '#ffffff' : 'transparent', color: generateMode === 'voucher' ? '#0f172a' : '#64748b', fontWeight: generateMode === 'voucher' ? '700' : '500', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: generateMode === 'voucher' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
                >Voucher</button>
                <button 
                  type="button"
                  onClick={() => setGenerateMode('member')}
                  style={{ flex: 1, padding: '8px 16px', borderRadius: '8px', border: 'none', background: generateMode === 'member' ? '#ffffff' : 'transparent', color: generateMode === 'member' ? '#0f172a' : '#64748b', fontWeight: generateMode === 'member' ? '700' : '500', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: generateMode === 'member' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
                >Member</button>
                <button 
                  type="button"
                  onClick={() => setGenerateMode('bulk')}
                  style={{ flex: 1, padding: '8px 16px', borderRadius: '8px', border: 'none', background: generateMode === 'bulk' ? '#ffffff' : 'transparent', color: generateMode === 'bulk' ? '#0f172a' : '#64748b', fontWeight: generateMode === 'bulk' ? '700' : '500', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: generateMode === 'bulk' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
                >Bulk</button>
              </div>
              
              <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {generateMode === 'voucher' ? (
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Kode Voucher</label>
                    <input 
                      type="text" 
                      required={generateMode === 'voucher'}
                      placeholder="Contoh: PION123"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value.replace(/\s+/g, '')})}
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s' }}
                      onFocus={e=>e.currentTarget.style.borderColor='#3b82f6'}
                      onBlur={e=>e.currentTarget.style.borderColor='#cbd5e1'}
                    />
                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', margin: '6px 0 0 0' }}>*Tanpa spasi. Kode ini berlaku sebagai username & password.</p>
                  </div>
                ) : generateMode === 'member' ? (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Username</label>
                      <input 
                        type="text" 
                        required={generateMode === 'member'}
                        placeholder="Contoh: eepridwan"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value.replace(/\s+/g, '')})}
                        style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Password</label>
                      <input 
                        type="text" 
                        required={generateMode === 'member'}
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value.replace(/\s+/g, '')})}
                        style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', outline: 'none' }}
                      />
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Jumlah</label>
                        <input type="number" min="1" max="500" required value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || ''})} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', outline: 'none' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Panjang Kode</label>
                        <input type="number" min="3" max="12" value={formData.length} onChange={(e) => setFormData({...formData, length: parseInt(e.target.value) || 4})} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', outline: 'none' }} />
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Awalan (Prefix)</label>
                        <input type="text" placeholder="Opsional" value={formData.prefix} onChange={(e) => setFormData({...formData, prefix: e.target.value.replace(/\s+/g, '')})} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', outline: 'none' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Karakter</label>
                        <select value={formData.char_type} onChange={(e) => setFormData({...formData, char_type: e.target.value})} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', outline: 'none', backgroundColor: '#fff' }}>
                          <option value="numeric">Angka (0-9)</option>
                          <option value="lowercase">Huruf Kecil (a-z)</option>
                          <option value="uppercase">Huruf Besar (A-Z)</option>
                          <option value="alphanumeric">Campur Angka & Huruf</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Preview Format:</span>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', letterSpacing: '1px' }}>
                        {formData.prefix}{formData.char_type === 'numeric' ? '123' : formData.char_type === 'uppercase' ? 'ABC' : formData.char_type === 'lowercase' ? 'abc' : 'A1B'}{'x'.repeat(Math.max(0, formData.length - 3))}
                      </span>
                    </div>
                  </div>
                )}
                
                {generateMode !== 'bulk' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Pilih Paket Layanan</label>
                    <select 
                      value={formData.plan}
                      onChange={(e) => setFormData({...formData, plan: e.target.value})}
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', outline: 'none', backgroundColor: '#fff' }}
                    >
                      {profiles.map(p => (
                        <option key={p.id} value={p.name}>
                          {p.name === 'default' ? 'Default Plan' : p.name} 
                          {p.rate_limit ? ` (Limit ${p.rate_limit})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#475569', cursor: 'pointer', borderRadius: '10px', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s' }} onMouseOver={e=>e.currentTarget.style.backgroundColor='#f8fafc'} onMouseOut={e=>e.currentTarget.style.backgroundColor='#ffffff'}>Batal</button>
                  <button type="submit" disabled={isGenerating} style={{ padding: '10px 24px', border: 'none', backgroundColor: '#3b82f6', color: '#ffffff', cursor: isGenerating ? 'not-allowed' : 'pointer', borderRadius: '10px', fontSize: '14px', fontWeight: '600', opacity: isGenerating ? 0.7 : 1, transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(59, 130, 246, 0.2)' }} onMouseOver={e=>{if(!isGenerating) e.currentTarget.style.backgroundColor='#2563eb'}} onMouseOut={e=>{if(!isGenerating) e.currentTarget.style.backgroundColor='#3b82f6'}}>
                    {isGenerating ? 'Memproses...' : 'Generate Voucher'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Modal (Premium Style) */}
      {showEditModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '100%', maxWidth: '420px', backgroundColor: '#ffffff', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Edit2 size={18} />
                </div>
                Edit {editData.username}
              </div>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px', borderRadius: '6px', transition: 'all 0.2s' }} onMouseOver={e=>e.currentTarget.style.backgroundColor='#e2e8f0'} onMouseOut={e=>e.currentTarget.style.backgroundColor='transparent'}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '24px' }}>
              <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Password Baru</label>
                  <input 
                    type="text" 
                    placeholder="Kosongkan jika tidak diubah"
                    value={editData.password}
                    onChange={(e) => setEditData({...editData, password: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', outline: 'none' }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Ganti Paket</label>
                  <select 
                    value={editData.plan}
                    onChange={(e) => setEditData({...editData, plan: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', outline: 'none', backgroundColor: '#fff' }}
                  >
                    {profiles.map(p => (
                      <option key={p.id} value={p.name}>
                        {p.name === 'default' ? 'Default Plan' : p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowEditModal(false)} style={{ padding: '10px 20px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#475569', cursor: 'pointer', borderRadius: '10px', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s' }}>Batal</button>
                  <button type="submit" disabled={isEditing} style={{ padding: '10px 24px', border: 'none', backgroundColor: '#d97706', color: '#ffffff', cursor: isEditing ? 'not-allowed' : 'pointer', borderRadius: '10px', fontSize: '14px', fontWeight: '600', opacity: isEditing ? 0.7 : 1, transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(217, 119, 6, 0.2)' }}>
                    {isEditing ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal (Premium Style) */}
      {showDeleteModal && deleteData && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '100%', maxWidth: '360px', backgroundColor: '#ffffff', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ padding: '24px 24px 0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Trash2 size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0' }}>Hapus Pengguna</h3>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                Apakah Anda yakin ingin menghapus <strong>{deleteData.username}</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            
            <div style={{ padding: '24px', display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '8px' }}>
              <button type="button" onClick={() => { setShowDeleteModal(false); setDeleteData(null); }} style={{ flex: 1, padding: '10px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#475569', cursor: 'pointer', borderRadius: '10px', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s' }}>Batal</button>
              <button type="button" onClick={confirmDelete} disabled={isDeleting} style={{ flex: 1, padding: '10px', border: 'none', backgroundColor: '#ef4444', color: '#ffffff', cursor: isDeleting ? 'not-allowed' : 'pointer', borderRadius: '10px', fontSize: '14px', fontWeight: '600', opacity: isDeleting ? 0.7 : 1, transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(239, 68, 68, 0.2)' }}>
                {isDeleting ? 'Memproses...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Bulk Delete Modal (Premium Style) */}
      {showBulkDeleteModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '100%', maxWidth: '360px', backgroundColor: '#ffffff', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ padding: '24px 24px 0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Trash2 size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0' }}>Hapus Masal</h3>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                Hapus <strong>{selectedVouchers.length}</strong> voucher terpilih secara permanen?
              </p>
            </div>
            
            <div style={{ padding: '24px', display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '8px' }}>
              <button type="button" onClick={() => setShowBulkDeleteModal(false)} style={{ flex: 1, padding: '10px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#475569', cursor: 'pointer', borderRadius: '10px', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s' }}>Batal</button>
              <button type="button" onClick={handleBulkDelete} disabled={isDeleting} style={{ flex: 1, padding: '10px', border: 'none', backgroundColor: '#ef4444', color: '#ffffff', cursor: isDeleting ? 'not-allowed' : 'pointer', borderRadius: '10px', fontSize: '14px', fontWeight: '600', opacity: isDeleting ? 0.7 : 1, transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(239, 68, 68, 0.2)' }}>
                {isDeleting ? 'Memproses...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Printable Area (Hidden normally, shown on print) */}
      {createPortal(
        <div id="printable-voucher-area">
          <style>
            {`
              @media screen {
                #printable-voucher-area { display: none !important; }
              }
              @media print {
                #root { display: none !important; }
                body { margin: 0; padding: 0; background: white; }
                #printable-voucher-area {
                  display: grid !important;
                  width: 100%;
                  grid-template-columns: repeat(5, 1fr);
                  gap: 1.5mm;
                  padding: 3mm 5mm;
                  background: white;
                  box-sizing: border-box;
                }
                .voucher-card {
                  border: 1.5px solid black;
                  border-radius: 1.5mm;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  page-break-inside: avoid;
                  font-family: 'Arial', sans-serif;
                  background: white;
                  color: black;
                  height: 12.5mm;
                  box-sizing: border-box;
                }
                .voucher-code {
                  font-size: 11pt;
                  font-weight: 900;
                  letter-spacing: 0.5px;
                  margin-bottom: 0.2mm;
                }
                .voucher-footer {
                  display: flex;
                  justify-content: space-between;
                  width: 100%;
                  padding: 0 2.5mm;
                  box-sizing: border-box;
                  font-size: 5pt;
                  font-weight: 800;
                  text-transform: uppercase;
                  border-top: 1px dashed #666;
                  padding-top: 0.8mm;
                }
                @page { size: A4 portrait; margin: 0; }
              }
            `}
          </style>
          {printData.map((v, i) => (
            <div key={i} className="voucher-card">
              <div className="voucher-code">{v.username}</div>
              <div className="voucher-footer">
                <span>PIONIAR</span>
                <span>{v.plan.replace('voucher_', '').replace('member_', '')}</span>
              </div>
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
