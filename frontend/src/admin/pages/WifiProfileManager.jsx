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
    
    const url = isEditMode ? `/api/wifi/profiles/${formData.id}` : '/api/wifi/profiles';
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
      <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.5rem', overflow: 'hidden' }}>
        
        {/* Top Control Bar Card */}
        <div className="hide-scrollbar glass-panel" style={{ borderRadius: '0.75rem', border: '1px solid var(--pioniar-border)', padding: '0.75rem 1rem', display: 'flex', flexWrap: 'nowrap', gap: '0.5rem', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '0 0 auto' }}>
            <button 
              onClick={fetchProfiles} 
              disabled={loading}
              title="Refresh Data"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', backgroundColor: '#ffffff', border: '1px solid var(--pioniar-border)', color: '#64748b', borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', flexShrink: 0 }} 
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} 
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} color="#64748b" />
            </button>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '0.5rem', alignItems: 'center', flex: '1 1 auto', justifyContent: 'flex-end', minWidth: 0 }}>
            <div style={{ position: 'relative', flex: '1 1 auto', minWidth: 0, maxWidth: '300px' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Cari paket..." 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                style={{ padding: '0.45rem 1rem 0.45rem 2.25rem', borderRadius: '0.5rem', border: '1px solid var(--pioniar-border)', backgroundColor: '#f8fafc', color: 'var(--pioniar-text)', fontSize: '0.85rem', width: '100%', outline: 'none', transition: 'all 0.2s' }}
              />
            </div>
            <button 
              onClick={() => {
                setFormData({ id: '', name: '', rate_limit: '', shared_users: '1', price: '', validity: '' });
                setIsEditMode(false);
                setShowModal(true);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.875rem', backgroundColor: 'var(--pioniar-primary)', border: '1px solid var(--pioniar-primary)', color: '#ffffff', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px 0 rgba(40, 96, 134, 0.2)', flexShrink: 0, whiteSpace: 'nowrap' }} 
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1e4a68'} 
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--pioniar-primary)'}
            >
              <Plus size={14} strokeWidth={3} /> Tambah Paket
            </button>
          </div>
        </div>

        {/* Table Card */}
        <div className="glass-panel" style={{ borderRadius: '0.75rem', border: '1px solid var(--pioniar-border)', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', backgroundColor: '#ffffff' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '3rem', color: 'var(--pioniar-text-muted)' }}>
              <HexLoader size={48} color="var(--pioniar-primary)" />
              <p style={{ marginTop: '1rem' }}>Memuat data paket...</p>
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--pioniar-text-muted)' }}>
              <div style={{ background: '#f8fafc', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', border: '1px solid #e2e8f0' }}>
                <Package size={24} color="#94a3b8" />
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--pioniar-primary)' }}>Data kosong.</div>
              <div style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>{searchTerm ? 'Tidak ada kecocokan pencarian paket.' : 'Tidak ada paket yang terdaftar.'}</div>
            </div>
          ) : (
            <div style={{ minWidth: '800px', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '0.8rem 1.5rem', display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 100px', fontWeight: 600, fontSize: '0.75rem', color: '#94a3b8', letterSpacing: '0.05em', borderBottom: '1px solid var(--pioniar-border)', backgroundColor: '#f8fafc', textTransform: 'uppercase' }}>
                <div>NAMA PAKET</div>
                <div>LIMIT KECEPATAN</div>
                <div>MAKS. PERANGKAT</div>
                <div>MASA AKTIF</div>
                <div>HARGA (RP)</div>
                <div style={{ textAlign: 'center' }}>AKSI</div>
              </div>
              
              <div style={{ backgroundColor: '#ffffff', flex: 1, overflowY: 'auto' }}>
                {currentProfiles.map(p => (
                  <div key={p.id} style={{ padding: '0.6rem 1.5rem', display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 100px', alignItems: 'center', borderBottom: '1px solid var(--pioniar-border)', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--pioniar-text)' }}>{p.name}</span>
                    <span style={{ color: 'var(--pioniar-text-muted)', fontSize: '0.85rem' }}>{p.rate_limit || 'Tidak dibatasi'}</span>
                    <span style={{ color: 'var(--pioniar-text-muted)', fontSize: '0.85rem' }}>{p.shared_users}</span>
                    <span style={{ color: 'var(--pioniar-text-muted)', fontSize: '0.85rem' }}>{p.validity || 'Tanpa Batas'}</span>
                    <span style={{ color: 'var(--pioniar-success)', fontWeight: 600, fontSize: '0.9rem' }}>Rp {p.price?.toLocaleString('id-ID') || 0}</span>
                    
                    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                      <button 
                        onClick={() => {
                          setFormData({ id: p.id, name: p.name, rate_limit: p.rate_limit, shared_users: p.shared_users, price: p.price, validity: p.validity || '' });
                          setIsEditMode(true);
                          setShowModal(true);
                        }}
                        title="Edit Paket"
                        style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.4rem', borderRadius: '0.25rem', transition: 'all 0.2s' }} 
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.1)'; e.currentTarget.style.color = 'var(--pioniar-warning)' }} 
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b' }}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button 
                        onClick={() => {
                          setDeleteData({ id: p.id, name: p.name });
                          setShowDeleteModal(true);
                        }}
                        title="Hapus Paket"
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
            </div>
          )}

          {/* Pagination Footer */}
          {!loading && filteredProfiles.length > 0 && (
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
                  Menampilkan {filteredProfiles.length === 0 ? 0 : indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredProfiles.length)} dari {filteredProfiles.length}
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

      {/* Form Modal */}
      {showModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', borderRadius: 'var(--radius-xl)', padding: '2rem', backgroundColor: 'var(--pioniar-bg)', position: 'relative' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--pioniar-text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{isEditMode ? 'Edit Paket' : 'Tambah Paket Baru'}</h2>
            <p style={{ color: 'var(--pioniar-text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Atur detail teknis paket hotspot.</p>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--pioniar-text-muted)', marginBottom: '0.5rem' }}>Nama Paket *</label>
                <input required type="text" className="input-base" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} disabled={isEditMode && formData.name === 'default'} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--pioniar-text-muted)', marginBottom: '0.5rem' }}>Limit Kecepatan (Rate Limit)</label>
                <input type="text" className="input-base" placeholder="Contoh: 2M/2M" value={formData.rate_limit} onChange={(e) => setFormData({...formData, rate_limit: e.target.value})} />
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Format: RX/TX (Contoh: 2M/2M untuk 2 Mbps)</span>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--pioniar-text-muted)', marginBottom: '0.5rem' }}>Maks. Perangkat (Shared Users) *</label>
                <input required type="number" min="1" className="input-base" value={formData.shared_users} onChange={(e) => setFormData({...formData, shared_users: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--pioniar-text-muted)', marginBottom: '0.5rem' }}>Batas Masa Aktif (Session Uptime)</label>
                <select 
                  className="input-base"
                  value={formData.validity}
                  onChange={(e) => setFormData({...formData, validity: e.target.value})}
                  style={{ width: '100%' }}
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
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--pioniar-text-muted)', marginBottom: '0.5rem' }}>Harga Jual (Rp) *</label>
                <input required type="number" min="0" className="input-base" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Modal */}
      {showDeleteModal && deleteData && createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', borderRadius: 'var(--radius-xl)', padding: '2rem', backgroundColor: 'var(--pioniar-bg)', position: 'relative', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '50%' }}><Trash2 size={40} color="#ef4444" /></div>
            </div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Hapus {deleteData.name}?</h2>
            <p style={{ color: 'var(--pioniar-text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Tindakan ini tidak dapat dibatalkan.</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" className="btn" onClick={() => { setShowDeleteModal(false); setDeleteData(null); }} style={{ flex: 1 }}>Batal</button>
              <button type="button" className="btn" onClick={confirmDelete} disabled={isSubmitting} style={{ flex: 1, backgroundColor: '#ef4444', color: '#fff', border: 'none', display: 'flex', justifyContent: 'center' }}>
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Ya, Hapus'}
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
