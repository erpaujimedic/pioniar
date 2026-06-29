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
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

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
    
    const handleRefresh = () => fetchProfiles();
    window.addEventListener('app:refresh', handleRefresh);
    return () => window.removeEventListener('app:refresh', handleRefresh);
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

  const sortedProfiles = React.useMemo(() => {
    let sortableItems = [...filteredProfiles];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        if (aVal == null) aVal = '';
        if (bVal == null) bVal = '';
        
        if (sortConfig.key === 'price') {
            aVal = Number(String(aVal).replace(/[^0-9]/g, ''));
            bVal = Number(String(bVal).replace(/[^0-9]/g, ''));
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredProfiles, sortConfig]);

  // Calculate Pagination Data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProfiles = sortedProfiles.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage);

  return (
    <div className="animate-fade-in relative flex flex-col h-full overflow-hidden bg-white">

      <div className="flex flex-col flex-1 overflow-hidden">
        
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-2 p-2 sm:px-3 bg-white border-b border-slate-100 items-start sm:items-center">
          <button 
            onClick={() => {
              setFormData({ id: '', name: '', rate_limit: '', shared_users: '1', price: '', validity: '' });
              setIsEditMode(false);
              setShowModal(true);
            }}
            title="Tambah Paket"
            className="bg-emerald-600 text-white border-none w-6 h-6 rounded flex items-center justify-center cursor-pointer transition-all shadow-sm hover:bg-emerald-700 shrink-0"
          >
            <Plus size={14} strokeWidth={3} />
          </button>
          
          <div className="flex-1 hidden sm:block"></div>

          {/* Filter & Search */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none flex items-center border border-slate-200 bg-white px-1.5 py-0.5 rounded transition-colors focus-within:border-emerald-500 shadow-sm h-6">
              <Search size={12} className="text-slate-400 shrink-0" />
              <input 
                type="text" 
                placeholder="Cari..." 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="border-none outline-none px-1.5 py-0.5 text-[10px] bg-transparent text-slate-900 w-full sm:w-[120px]"
              />
            </div>
          </div>
        </div>

        {/* Premium Table */}
        <div className="flex-1 overflow-auto bg-white px-2">
          <table className="w-full min-w-[700px] border-collapse text-[11px] mt-1">
            <thead className="bg-white sticky top-0 z-10">
              <tr>
                <th className="py-1.5 px-2 border border-slate-200 text-center font-bold text-slate-400 uppercase tracking-wider text-[9px] bg-white cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('name')}>Nama Paket {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th className="py-1.5 px-2 border border-slate-200 text-center font-bold text-slate-400 uppercase tracking-wider text-[9px] bg-white cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('rate_limit')}>Limit Kecepatan {sortConfig.key === 'rate_limit' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th className="py-1.5 px-2 border border-slate-200 text-center font-bold text-slate-400 uppercase tracking-wider text-[9px] bg-white cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('shared_users')}>Maks. Perangkat {sortConfig.key === 'shared_users' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th className="py-1.5 px-2 border border-slate-200 text-center font-bold text-slate-400 uppercase tracking-wider text-[9px] bg-white cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('validity')}>Masa Aktif {sortConfig.key === 'validity' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th className="py-1.5 px-2 border border-slate-200 text-center font-bold text-slate-400 uppercase tracking-wider text-[9px] bg-white cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('price')}>Harga Jual {sortConfig.key === 'price' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th className="py-1.5 px-2 border border-slate-200 text-center font-bold text-slate-400 uppercase tracking-wider text-[9px] bg-white">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center p-8 text-slate-500">Memuat data...</td>
                </tr>
              ) : currentProfiles.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center p-8 text-slate-500">Data kosong.</td>
                </tr>
              ) : (
                currentProfiles.map(p => (
                  <tr key={p.id} className="cursor-pointer transition-colors hover:bg-slate-50">
                    <td className="py-1.5 px-2 text-center font-bold text-slate-800 border border-slate-200">{p.name}</td>
                    <td className="py-1.5 px-2 text-center text-slate-600 border border-slate-200">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded font-semibold text-[9px]">{p.rate_limit || 'Tidak dibatasi'}</span>
                    </td>
                    <td className="py-1.5 px-2 text-center text-slate-600 border border-slate-200 font-medium">{p.shared_users} Device</td>
                    <td className="py-1.5 px-2 text-center text-slate-600 border border-slate-200 font-medium">{p.validity || 'Tanpa Batas'}</td>
                    <td className="py-1.5 px-2 text-center text-emerald-600 font-bold border border-slate-200">Rp {p.price?.toLocaleString('id-ID') || 0}</td>
                    <td className="py-1.5 px-2 text-center border border-slate-200">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => { setFormData({ id: p.id, name: p.name, rate_limit: p.rate_limit, shared_users: p.shared_users, price: p.price, validity: p.validity || '' }); setIsEditMode(true); setShowModal(true); }} className="bg-white border border-slate-200 w-5 h-5 rounded inline-flex items-center justify-center cursor-pointer transition-colors hover:bg-slate-50 text-slate-600 shadow-sm"><Edit2 size={11} /></button>
                        <button onClick={() => { setDeleteData({ id: p.id, name: p.name }); setShowDeleteModal(true); }} className="bg-white border border-red-200 w-5 h-5 rounded inline-flex items-center justify-center cursor-pointer transition-colors hover:bg-red-50 text-red-500 shadow-sm"><Trash2 size={11} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Status Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 py-1.5 border-t border-slate-100 bg-white text-[10px] font-medium text-slate-500 shrink-0 gap-2">
          <div className="flex items-center gap-1">
            <span>Menampilkan {filteredProfiles.length > 0 ? `${indexOfFirstItem + 1} - ${Math.min(indexOfLastItem, filteredProfiles.length)} dari ` : ''}<strong className="text-slate-800">{filteredProfiles.length}</strong></span>
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

      {/* Form Modal (Premium Style) */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col m-auto">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3 font-bold text-lg text-slate-900">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isEditMode ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>
                  <Package size={20} />
                </div>
                {isEditMode ? 'Edit Paket' : 'Tambah Paket Baru'}
              </div>
              <button onClick={() => setShowModal(false)} className="bg-transparent border-none cursor-pointer text-slate-400 p-2 rounded-xl transition-colors hover:bg-slate-100 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Paket *</label>
                  <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} disabled={isEditMode && formData.name === 'default'} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-100 disabled:text-slate-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Limit Kecepatan (Rate Limit)</label>
                  <input type="text" placeholder="Contoh: 2M/2M" value={formData.rate_limit} onChange={(e) => setFormData({...formData, rate_limit: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20" />
                  <span className="text-[13px] text-slate-500 mt-1.5 block">Format: RX/TX (Contoh: 2M/2M untuk 2 Mbps)</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Maks. Perangkat *</label>
                    <input required type="number" min="1" value={formData.shared_users} onChange={(e) => setFormData({...formData, shared_users: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Harga Jual (Rp) *</label>
                    <input required type="number" min="0" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Batas Masa Aktif (Uptime)</label>
                  <select 
                    value={formData.validity}
                    onChange={(e) => setFormData({...formData, validity: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none bg-white transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer appearance-none"
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

                <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end shrink-0">
                  <button type="button" onClick={() => setShowModal(false)} className="w-full sm:w-auto px-6 py-2.5 border border-slate-200 bg-white text-slate-600 cursor-pointer rounded-xl text-sm font-semibold transition-colors hover:bg-slate-50">Batal</button>
                  <button type="submit" disabled={isSubmitting} className={`w-full sm:w-auto px-6 py-2.5 border-none text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'} ${isEditMode ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
                    {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Memproses...</> : (isEditMode ? 'Simpan Perubahan' : 'Tambah Paket')}
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
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-[360px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            
            <div className="pt-6 px-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 m-0 mb-2">Hapus Paket</h3>
              <p className="text-sm text-slate-600 m-0 leading-relaxed">
                Hapus paket <strong className="text-slate-900">{deleteData.name}</strong> secara permanen?
              </p>
            </div>
            
            <div className="p-6 flex gap-3 justify-center">
              <button type="button" onClick={() => { setShowDeleteModal(false); setDeleteData(null); }} className="flex-1 py-2.5 px-4 border border-slate-200 bg-white text-slate-600 cursor-pointer rounded-xl text-sm font-semibold transition-colors hover:bg-slate-50">Batal</button>
              <button type="button" onClick={confirmDelete} disabled={isSubmitting} className={`flex-1 py-2.5 px-4 border-none bg-red-500 text-white rounded-xl text-sm font-semibold transition-all flex justify-center items-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:bg-red-600 hover:shadow-[0_4px_6px_rgba(239,68,68,0.2)]'}`}>
                {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Memproses...</> : 'Ya, Hapus'}
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
