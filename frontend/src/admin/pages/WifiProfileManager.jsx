import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, RefreshCw, Trash2, Edit2, Loader2, Package, X } from 'lucide-react';
import HexLoader from '../../components/HexLoader';

export default function WifiProfileManager() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({ id: '', name: '', rate_limit: '', shared_users: '1', price: '', validity: '' });
  const [deleteData, setDeleteData] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/wifi/profiles');
      if (res.ok) {
        const data = await res.json();
        setProfiles(data);
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Koneksi ke server gagal' });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const url = (import.meta.env.VITE_API_BASE_URL || '') + (isEditMode ? `/api/wifi/profiles/${formData.id}` : '/api/wifi/profiles');
    const method = isEditMode ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await res.json();
      
      if (res.ok) {
        setNotification({ type: 'success', message: result.message });
        setShowModal(false);
        fetchProfiles();
      } else {
        setNotification({ type: 'error', message: result.error || 'Gagal menyimpan paket' });
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Koneksi ke server terputus' });
    }
    setIsSubmitting(false);
  };

  const confirmDelete = async () => {
    if (!deleteData) return;
    setIsSubmitting(true);
    
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + `/api/wifi/profiles/${deleteData.id}?name=${deleteData.name}`, { method: 'DELETE' });
      const result = await res.json();
      if (res.ok) {
        setNotification({ type: 'success', message: `Paket ${deleteData.name} berhasil dihapus` });
        setShowDeleteModal(false);
        setDeleteData(null);
        fetchProfiles();
      } else {
        setNotification({ type: 'error', message: result.error || 'Gagal menghapus paket' });
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Koneksi ke server terputus' });
    }
    setIsSubmitting(false);
  };

  const filteredProfiles = profiles.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate Pagination Data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProfiles = filteredProfiles.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage);

  return (
    <div className="animate-fade-in" style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Main Container */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, backgroundColor: '#ffffff', overflow: 'hidden' }}>
        
        {/* Action Bar */}
        <div style={{ display: 'flex', gap: '12px', padding: '16px 20px', backgroundColor: '#ffffff', borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
          <button 
            onClick={() => {
              setFormData({ id: '', name: '', rate_limit: '', shared_users: '1', price: '', validity: '' });
              setIsEditMode(false);
              setShowModal(true);
            }}
            style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)' }} onMouseOver={e=>e.currentTarget.style.backgroundColor='#2563eb'} onMouseOut={e=>e.currentTarget.style.backgroundColor='#3b82f6'}
          >
            <Plus size={16} /> Tambah Paket
          </button>
          
          <div style={{ flex: 1 }}></div>

          {/* Filter & Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', padding: '6px 12px', borderRadius: '8px', transition: 'border-color 0.2s' }}>
              <Search size={16} color="#64748b" />
              <input 
                type="text" 
                placeholder="Cari paket..." 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                style={{ border: 'none', outline: 'none', padding: '2px 8px', fontSize: '14px', width: '180px', backgroundColor: 'transparent', color: '#0f172a' }}
              />
            </div>
            
            <button 
              onClick={fetchProfiles} 
              disabled={loading}
              title="Refresh Data"
              style={{ backgroundColor: '#ffffff', color: '#64748b', border: '1px solid #e2e8f0', padding: '8px', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseOver={e=>e.currentTarget.style.backgroundColor='#f8fafc'} onMouseOut={e=>e.currentTarget.style.backgroundColor='#ffffff'}
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Premium Table */}
        <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#ffffff', padding: '0 20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', marginTop: '8px' }}>
            <thead style={{ backgroundColor: '#ffffff', position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                <th style={{ padding: '16px 12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Nama Paket</th>
                <th style={{ padding: '16px 12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Limit Kecepatan</th>
                <th style={{ padding: '16px 12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Maks. Perangkat</th>
                <th style={{ padding: '16px 12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Masa Aktif</th>
                <th style={{ padding: '16px 12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Harga Jual</th>
                <th style={{ padding: '16px 12px', borderBottom: '2px solid #e2e8f0', textAlign: 'center', fontWeight: '600', color: '#475569' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>Memuat data...</td>
                </tr>
              ) : currentProfiles.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>Data kosong.</td>
                </tr>
              ) : (
                currentProfiles.map(p => (
                  <tr key={p.id} style={{ cursor: 'pointer', transition: 'background-color 0.2s', borderBottom: '1px solid #f1f5f9' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '16px 12px', fontWeight: '500', color: '#0f172a' }}>{p.name}</td>
                    <td style={{ padding: '16px 12px', color: '#475569' }}>
                      <span style={{ backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '13px' }}>{p.rate_limit || 'Tidak dibatasi'}</span>
                    </td>
                    <td style={{ padding: '16px 12px', color: '#475569' }}>{p.shared_users} Device</td>
                    <td style={{ padding: '16px 12px', color: '#475569' }}>{p.validity || 'Tanpa Batas'}</td>
                    <td style={{ padding: '16px 12px', color: '#10b981', fontWeight: '600' }}>Rp {p.price?.toLocaleString('id-ID') || 0}</td>
                    <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button onClick={() => { setFormData({ id: p.id, name: p.name, rate_limit: p.rate_limit, shared_users: p.shared_users, price: p.price, validity: p.validity || '' }); setIsEditMode(true); setShowModal(true); }} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer', padding: '6px', borderRadius: '6px', transition: 'all 0.2s' }} onMouseOver={e=>e.currentTarget.style.backgroundColor='#e2e8f0'} onMouseOut={e=>e.currentTarget.style.backgroundColor='#f8fafc'}><Edit2 size={16} color="#475569" /></button>
                        <button onClick={() => { setDeleteData({ id: p.id, name: p.name }); setShowDeleteModal(true); }} style={{ background: '#fef2f2', border: '1px solid #fee2e2', cursor: 'pointer', padding: '6px', borderRadius: '6px', transition: 'all 0.2s' }} onMouseOver={e=>e.currentTarget.style.backgroundColor='#fee2e2'} onMouseOut={e=>e.currentTarget.style.backgroundColor='#fef2f2'}><Trash2 size={16} color="#ef4444" /></button>
                      </div>
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
            <span>Menampilkan {filteredProfiles.length > 0 ? `${indexOfFirstItem + 1} - ${Math.min(indexOfLastItem, filteredProfiles.length)} dari ` : ''}<strong>{filteredProfiles.length}</strong> total item</span>
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

      {/* Form Modal (Premium Style) */}
      {showModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '100%', maxWidth: '480px', backgroundColor: '#ffffff', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: isEditMode ? '#fef3c7' : '#e0f2fe', color: isEditMode ? '#d97706' : '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={18} />
                </div>
                {isEditMode ? 'Edit Paket' : 'Tambah Paket Baru'}
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px', borderRadius: '6px', transition: 'all 0.2s' }} onMouseOver={e=>e.currentTarget.style.backgroundColor='#e2e8f0'} onMouseOut={e=>e.currentTarget.style.backgroundColor='transparent'}>
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Nama Paket *</label>
                  <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} disabled={isEditMode && formData.name === 'default'} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Limit Kecepatan (Rate Limit)</label>
                  <input type="text" placeholder="Contoh: 2M/2M" value={formData.rate_limit} onChange={(e) => setFormData({...formData, rate_limit: e.target.value})} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', outline: 'none' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', display: 'block' }}>Format: RX/TX (Contoh: 2M/2M untuk 2 Mbps)</span>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Maks. Perangkat *</label>
                    <input required type="number" min="1" value={formData.shared_users} onChange={(e) => setFormData({...formData, shared_users: e.target.value})} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', outline: 'none' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Harga Jual (Rp) *</label>
                    <input required type="number" min="0" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', outline: 'none' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Batas Masa Aktif (Uptime)</label>
                  <select 
                    value={formData.validity}
                    onChange={(e) => setFormData({...formData, validity: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', outline: 'none', backgroundColor: '#fff' }}
                  >
                    <option value="">Tanpa Batas Waktu</option>
                    <option value="1m">1 Menit (Untuk Testing)</option>
                    <option value="1h">1 Jam</option>
                    <option value="3h">3 Jam</option>
                    <option value="8h">8 Jam</option>
                    <option value="1d">1 Hari (24 Jam)</option>
                    <option value="3d">3 Hari</option>
                    <option value="7d">1 Minggu</option>
                    <option value="30d">1 Bulan (30 Hari)</option>
                  </select>
                </div>

                <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#475569', cursor: 'pointer', borderRadius: '10px', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s' }}>Batal</button>
                  <button type="submit" disabled={isSubmitting} style={{ padding: '10px 24px', border: 'none', backgroundColor: isEditMode ? '#d97706' : '#3b82f6', color: '#ffffff', cursor: isSubmitting ? 'not-allowed' : 'pointer', borderRadius: '10px', fontSize: '14px', fontWeight: '600', opacity: isSubmitting ? 0.7 : 1, transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    {isSubmitting ? 'Memproses...' : (isEditMode ? 'Simpan Perubahan' : 'Tambah Paket')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Modal (Premium Style) */}
      {showDeleteModal && deleteData && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '100%', maxWidth: '360px', backgroundColor: '#ffffff', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ padding: '24px 24px 0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Trash2 size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0' }}>Hapus Paket</h3>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                Hapus paket <strong>{deleteData.name}</strong> secara permanen?
              </p>
            </div>
            
            <div style={{ padding: '24px', display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '8px' }}>
              <button type="button" onClick={() => { setShowDeleteModal(false); setDeleteData(null); }} style={{ flex: 1, padding: '10px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#475569', cursor: 'pointer', borderRadius: '10px', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s' }}>Batal</button>
              <button type="button" onClick={confirmDelete} disabled={isSubmitting} style={{ flex: 1, padding: '10px', border: 'none', backgroundColor: '#ef4444', color: '#ffffff', cursor: isSubmitting ? 'not-allowed' : 'pointer', borderRadius: '10px', fontSize: '14px', fontWeight: '600', opacity: isSubmitting ? 0.7 : 1, transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(239, 68, 68, 0.2)' }}>
                {isSubmitting ? 'Memproses...' : 'Ya, Hapus'}
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
