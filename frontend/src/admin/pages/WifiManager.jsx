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
  const [filterPlan, setFilterPlan] = useState('All');
  const [filterPrinted, setFilterPrinted] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

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
    
    // Check if quick action triggered
    if (window.location.search.includes('quick=1')) {
       setShowModal(true);
       // Remove the parameter so it doesn't keep opening on refresh
       window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    const handleRefresh = () => fetchVouchers();
    window.addEventListener('app:refresh', handleRefresh);
    return () => window.removeEventListener('app:refresh', handleRefresh);
  }, []);

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Trigger print dialog when printData is ready
  useEffect(() => {
    if (printData && printData.length > 0) {
      const timer = setTimeout(() => {
        window.print();
        // Optional: clear print data after print dialog is closed?
        // Actually, we can keep it so if they want to print again they can.
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [printData]);

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
  const uniquePlans = React.useMemo(() => Array.from(new Set(vouchers.map(v => v.plan).filter(Boolean))), [vouchers]);

  const filteredVouchers = vouchers.filter(v => {
    // Terapkan filter Tab
    if (activeTab === 'Tersedia') {
      if (v.uptime && v.uptime !== '0s') return false;
      if (v.first_used_at) return false;
      if (v.status === 'Kadaluarsa' || v.status === 'Berjalan') return false;
    } else {
      // Tab Berjalan
      if (!(v.status === 'Berjalan' || (v.uptime && v.uptime !== '0s' && v.status !== 'Kadaluarsa'))) return false;
    }

    // Terapkan filter Paket Layanan
    if (filterPlan !== 'All' && v.plan !== filterPlan) return false;

    // Terapkan filter Dicetak
    if (filterPrinted === 'Printed' && !v.is_printed) return false;
    if (filterPrinted === 'NotPrinted' && v.is_printed) return false;

    // Terapkan filter Search
    if (searchTerm && !(v.code || '').toLowerCase().includes(searchTerm.toLowerCase())) return false;

    return true;
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
  
  const sortedVouchers = React.useMemo(() => {
    let sortableItems = [...filteredVouchers];
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
  }, [filteredVouchers, sortConfig]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentVouchers = sortedVouchers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredVouchers.length / itemsPerPage);

  return (
    <div className="animate-fade-in relative flex flex-col h-full overflow-hidden">
      
      {/* Notifications */}
      {notification && createPortal(
        <div className={`animate-slide-up fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-full flex items-center justify-center gap-2 shadow-lg min-w-[300px] border ${notification.type === 'success' ? 'bg-white border-emerald-500 text-slate-900' : 'bg-red-50 border-red-400 text-red-800'}`}>
          {notification.type === 'success' ? <CheckCircle size={16} className="text-emerald-500" /> : <AlertCircle size={16} className="text-red-500" />}
          <span className="font-semibold text-[13px] flex-1 text-center">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="bg-transparent border-none text-slate-400 cursor-pointer flex items-center justify-center p-1 rounded-full transition-colors hover:bg-slate-100 hover:text-slate-600">
            <X size={14} />
          </button>
        </div>,
        document.body
      )}

      {/* Voucher Table Section (Premium SaaS Style) */}
      <div className="flex flex-col flex-1 bg-white overflow-hidden">
        {/* Action Bar */}
        <div className="flex flex-col xl:flex-row justify-between gap-1.5 px-2 py-1.5 border-b border-slate-100 items-start xl:items-center bg-white/50">
          
          {/* Left Actions */}
          <div className="flex items-center flex-wrap gap-1">
            <button title="Generate Baru" onClick={() => setShowModal(true)} className="bg-emerald-600 text-white border-none w-6 h-6 rounded cursor-pointer flex items-center justify-center transition-all shadow-sm hover:bg-emerald-700">
              <Plus size={13} strokeWidth={3} />
            </button>
            
            <button title={`Hapus (${selectedVouchers.length})`} onClick={() => setShowBulkDeleteModal(true)} disabled={selectedVouchers.length === 0} className={`bg-transparent border w-6 h-6 rounded flex items-center justify-center transition-all ${selectedVouchers.length === 0 ? 'text-red-300 border-red-100 cursor-not-allowed' : 'text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300 cursor-pointer'}`}>
              <Trash2 size={12} strokeWidth={2.5} />
            </button>
            
            <div className="hidden sm:block w-px h-3 bg-slate-200 mx-0.5"></div>
            
            <button 
              title="Print Voucher"
              onClick={() => {
                const toPrint = vouchers.filter(v => selectedVouchers.includes(v.code)).map(v => ({ username: v.code, password: v.code, plan: v.plan }));
                setPrintData(toPrint);
                setSelectedVouchers([]);
              }}
              disabled={selectedVouchers.length === 0} 
              className={`bg-white border w-6 h-6 rounded flex items-center justify-center transition-all ${selectedVouchers.length === 0 ? 'text-slate-300 border-slate-200 cursor-not-allowed' : 'text-slate-600 border-slate-300 hover:bg-slate-50 cursor-pointer shadow-sm'}`}
            >
              <Printer size={12} />
            </button>
            
            <button 
              title="Edit Voucher"
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
              className={`bg-white border w-6 h-6 rounded flex items-center justify-center transition-all ${selectedVouchers.length !== 1 ? 'text-slate-300 border-slate-200 cursor-not-allowed' : 'text-slate-600 border-slate-300 hover:bg-slate-50 cursor-pointer shadow-sm'}`}
            >
              <Edit2 size={12} />
            </button>
          </div>

          {/* Right Filters */}
          <div className="flex items-center gap-1.5 w-full xl:w-auto flex-wrap sm:flex-nowrap">
            {/* Segmented Control Tabs */}
            <div className="flex p-0.5 bg-slate-100 rounded border border-slate-200/60 w-full sm:w-auto shadow-inner">
              <button 
                onClick={() => { setActiveTab('Tersedia'); setCurrentPage(1); }} 
                className={`flex-1 sm:flex-none px-1.5 py-0.5 rounded-sm border-none text-[10px] cursor-pointer transition-all flex items-center justify-center gap-1 ${activeTab === 'Tersedia' ? 'bg-white text-slate-900 font-bold shadow-sm' : 'bg-transparent text-slate-500 font-semibold hover:text-slate-700'}`}
              >
                Tersedia 
                <span className={`px-1 py-0 rounded-sm text-[8px] font-bold ${activeTab === 'Tersedia' ? 'bg-slate-100 text-slate-700' : 'bg-slate-200/80 text-slate-500'}`}>
                  {totalTersedia}
                </span>
              </button>
              <button 
                onClick={() => { setActiveTab('Berjalan'); setCurrentPage(1); }} 
                className={`flex-1 sm:flex-none px-1.5 py-0.5 rounded-sm border-none text-[10px] cursor-pointer transition-all flex items-center justify-center gap-1 ${activeTab === 'Berjalan' ? 'bg-white text-slate-900 font-bold shadow-sm' : 'bg-transparent text-slate-500 font-semibold hover:text-slate-700'}`}
              >
                Berjalan 
                <span className={`px-1 py-0 rounded-sm text-[8px] font-bold ${activeTab === 'Berjalan' ? 'bg-slate-100 text-slate-700' : 'bg-slate-200/80 text-slate-500'}`}>
                  {totalBerjalan}
                </span>
              </button>
            </div>

            {/* Filter Paket */}
            <select 
              value={filterPlan} 
              onChange={(e) => { setFilterPlan(e.target.value); setCurrentPage(1); }} 
              className="border border-slate-200 bg-white px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-600 outline-none shadow-sm cursor-pointer h-6"
            >
              <option value="All">Semua Paket</option>
              {uniquePlans.map(plan => (
                <option key={plan} value={plan}>{plan}</option>
              ))}
            </select>

            {/* Filter Dicetak */}
            <select 
              value={filterPrinted} 
              onChange={(e) => { setFilterPrinted(e.target.value); setCurrentPage(1); }} 
              className="border border-slate-200 bg-white px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-600 outline-none shadow-sm cursor-pointer h-6"
            >
              <option value="All">Status Print</option>
              <option value="Printed">Sudah Print</option>
              <option value="NotPrinted">Belum Print</option>
            </select>

            <div className="flex-1 sm:flex-none flex items-center border border-slate-200 bg-white px-1.5 py-0.5 rounded transition-all focus-within:border-emerald-500 shadow-sm h-6">
              <Search size={12} className="text-slate-400 shrink-0" />
              <input type="text" placeholder="Cari..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="border-none outline-none px-1.5 text-[10px] font-medium w-full sm:w-[80px] bg-transparent text-slate-900 placeholder:text-slate-400" />
            </div>
          </div>
        </div>

        {/* Premium Table */}
        <div className="flex-1 overflow-auto bg-white">
          <table className="w-full min-w-[700px] border-collapse text-[11px] mt-0">
            <thead className="bg-white sticky top-0 z-10">
              <tr>
                <th className="w-8 py-1.5 px-2 text-center border border-slate-200">
                  <input type="checkbox" checked={currentVouchers.length > 0 && selectedVouchers.length === currentVouchers.length} onChange={(e) => { if (e.target.checked) setSelectedVouchers(currentVouchers.map(v => v.code)); else setSelectedVouchers([]); }} className="cursor-pointer w-3.5 h-3.5 accent-emerald-600 rounded-sm" />
                </th>
                <th className="py-1.5 px-2 text-center font-bold text-slate-400 uppercase tracking-wider text-[9px] border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('code')}>Nama Voucher {sortConfig.key === 'code' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th className="py-1.5 px-2 text-center font-bold text-slate-400 uppercase tracking-wider text-[9px] border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('plan')}>Paket Layanan {sortConfig.key === 'plan' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th className="py-1.5 px-2 text-center font-bold text-slate-400 uppercase tracking-wider text-[9px] border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('uptime')}>Uptime {sortConfig.key === 'uptime' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th className="py-1.5 px-2 text-center font-bold text-slate-400 uppercase tracking-wider text-[9px] border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('limit_uptime')}>Limit {sortConfig.key === 'limit_uptime' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th className="py-1.5 px-2 text-center font-bold text-slate-400 uppercase tracking-wider text-[9px] border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('is_printed')}>Dicetak {sortConfig.key === 'is_printed' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th className="py-1.5 px-2 text-center font-bold text-slate-400 uppercase tracking-wider text-[9px] border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('status')}>Status {sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center p-6 text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 size={20} className="animate-spin text-emerald-500" />
                      <span className="font-medium">Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : currentVouchers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center p-6 text-slate-500 font-medium">Belum ada data voucher.</td>
                </tr>
              ) : (
                currentVouchers.map(v => (
                  <tr key={v.id || v.code} onClick={() => { if (selectedVouchers.includes(v.code)) setSelectedVouchers(selectedVouchers.filter(c => c !== v.code)); else setSelectedVouchers([...selectedVouchers, v.code]); }} className={`cursor-pointer transition-all ${selectedVouchers.includes(v.code) ? 'bg-emerald-50/40' : (v.is_printed ? 'bg-emerald-50/40 hover:bg-emerald-100/50' : 'hover:bg-slate-50/80')}`}>
                    <td className="py-1.5 px-2 text-center border border-slate-200">
                      <input type="checkbox" checked={selectedVouchers.includes(v.code)} onChange={(e) => { e.stopPropagation(); if (e.target.checked) setSelectedVouchers([...selectedVouchers, v.code]); else setSelectedVouchers(selectedVouchers.filter(c => c !== v.code)); }} className="cursor-pointer w-3.5 h-3.5 accent-emerald-600 rounded-sm" />
                    </td>
                    <td className="py-1.5 px-2 text-center font-bold text-slate-800 border border-slate-200">{v.code}</td>
                    <td className="py-1.5 px-2 text-center text-slate-600 border border-slate-200">
                      <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold text-[9px]">{v.plan}</span>
                    </td>
                    <td className="py-1.5 px-2 text-center font-medium text-slate-600 border border-slate-200">{v.uptime || '0s'}</td>
                    <td className="py-1.5 px-2 text-center text-slate-400 font-medium border border-slate-200">{v.limit_uptime || '-'}</td>
                    <td className="py-1.5 px-2 text-center border border-slate-200">
                      {v.is_printed ? (
                        <CheckCircle size={14} className="inline text-emerald-500 drop-shadow-sm" title="Sudah Dicetak" />
                      ) : (
                        <span className="text-[10px] text-slate-300 font-medium">-</span>
                      )}
                    </td>
                    <td className="py-1.5 px-2 text-center border border-slate-200">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${v.status === 'Aktif' || v.status === 'Berjalan' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        <div className={`w-1 h-1 rounded-full ${v.status === 'Aktif' || v.status === 'Berjalan' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'}`}></div>
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
        <div className="mt-auto flex flex-col sm:flex-row sm:items-center justify-between px-3 py-1.5 border-t border-slate-100 bg-white text-[10px] font-medium text-slate-500 shrink-0 gap-2">
          <div className="flex items-center gap-1">
            <span>Menampilkan {currentVouchers.length > 0 ? `${indexOfFirstItem + 1} - ${Math.min(indexOfLastItem, filteredVouchers.length)} dari ` : ''}<strong className="text-slate-800">{filteredVouchers.length}</strong></span>
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
      {/* Generate Voucher Modal (Premium Style) */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5 font-bold text-base text-slate-900">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                  <Plus size={18} />
                </div>
                Generate Voucher
              </div>
              <button onClick={() => setShowModal(false)} className="bg-transparent border-none cursor-pointer text-slate-500 p-1 rounded-md transition-colors hover:bg-slate-200">
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6">
              {/* Tabs */}
              <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
                <button 
                  type="button"
                  onClick={() => setGenerateMode('voucher')}
                  className={`flex-1 py-2 px-4 rounded-lg border-none text-sm cursor-pointer transition-all ${generateMode === 'voucher' ? 'bg-white text-slate-900 font-bold shadow-sm' : 'bg-transparent text-slate-500 font-medium hover:bg-slate-200/50'}`}
                >Voucher</button>
                <button 
                  type="button"
                  onClick={() => setGenerateMode('member')}
                  className={`flex-1 py-2 px-4 rounded-lg border-none text-sm cursor-pointer transition-all ${generateMode === 'member' ? 'bg-white text-slate-900 font-bold shadow-sm' : 'bg-transparent text-slate-500 font-medium hover:bg-slate-200/50'}`}
                >Member</button>
                <button 
                  type="button"
                  onClick={() => setGenerateMode('bulk')}
                  className={`flex-1 py-2 px-4 rounded-lg border-none text-sm cursor-pointer transition-all ${generateMode === 'bulk' ? 'bg-white text-slate-900 font-bold shadow-sm' : 'bg-transparent text-slate-500 font-medium hover:bg-slate-200/50'}`}
                >Bulk</button>
              </div>
              
              <form onSubmit={handleGenerate} className="flex flex-col gap-4">
                {generateMode === 'voucher' ? (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kode Voucher</label>
                    <input 
                      type="text" 
                      required={generateMode === 'voucher'}
                      placeholder="Contoh: PION123"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value.replace(/\s+/g, '')})}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                    <p className="text-xs text-slate-500 mt-1.5">*Tanpa spasi. Kode ini berlaku sebagai username & password.</p>
                  </div>
                ) : generateMode === 'member' ? (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username</label>
                      <input 
                        type="text" 
                        required={generateMode === 'member'}
                        placeholder="Contoh: eepridwan"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value.replace(/\s+/g, '')})}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                      <input 
                        type="text" 
                        required={generateMode === 'member'}
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value.replace(/\s+/g, '')})}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Jumlah</label>
                        <input type="number" min="1" max="500" required value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || ''})} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Panjang Kode</label>
                        <input type="number" min="3" max="12" value={formData.length} onChange={(e) => setFormData({...formData, length: parseInt(e.target.value) || 4})} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Awalan (Prefix)</label>
                        <input type="text" placeholder="Opsional" value={formData.prefix} onChange={(e) => setFormData({...formData, prefix: e.target.value.replace(/\s+/g, '')})} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Karakter</label>
                        <select value={formData.char_type} onChange={(e) => setFormData({...formData, char_type: e.target.value})} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white">
                          <option value="numeric">Angka (0-9)</option>
                          <option value="lowercase">Huruf Kecil (a-z)</option>
                          <option value="uppercase">Huruf Besar (A-Z)</option>
                          <option value="alphanumeric">Campur Angka & Huruf</option>
                        </select>
                      </div>
                    </div>

                    <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                      <span className="text-[13px] text-slate-500 font-semibold">Preview Format:</span>
                      <span className="text-sm font-bold text-slate-900 tracking-wide">
                        {formData.prefix}{formData.char_type === 'numeric' ? '123' : formData.char_type === 'uppercase' ? 'ABC' : formData.char_type === 'lowercase' ? 'abc' : 'A1B'}{'x'.repeat(Math.max(0, formData.length - 3))}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Package Selection - Available for ALL modes (Voucher, Member, Bulk) */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Pilih Paket Layanan</label>
                  <select 
                    value={formData.plan}
                    onChange={(e) => setFormData({...formData, plan: e.target.value})}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
                  >
                    {profiles.map(p => (
                      <option key={p.id} value={p.name}>
                        {p.name === 'default' ? 'Default Plan' : p.name} 
                        {p.rate_limit ? ` (Limit ${p.rate_limit})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mt-6 flex gap-3 justify-end">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 border border-slate-200 bg-white text-slate-600 cursor-pointer rounded-lg text-sm font-semibold transition-colors hover:bg-slate-50">Batal</button>
                  <button type="submit" disabled={isGenerating} className={`px-6 py-2.5 border-none bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-all shadow-[0_4px_6px_rgba(59,130,246,0.2)] ${isGenerating ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:bg-emerald-600'}`}>
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
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5 font-bold text-base text-slate-900">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Edit2 size={18} />
                </div>
                Edit {editData.username}
              </div>
              <button onClick={() => setShowEditModal(false)} className="bg-transparent border-none cursor-pointer text-slate-500 p-1 rounded-md transition-colors hover:bg-slate-200">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password Baru</label>
                  <input 
                    type="text" 
                    placeholder="Kosongkan jika tidak diubah"
                    value={editData.password}
                    onChange={(e) => setEditData({...editData, password: e.target.value})}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm outline-none transition-colors focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ganti Paket</label>
                  <select 
                    value={editData.plan}
                    onChange={(e) => setEditData({...editData, plan: e.target.value})}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm outline-none transition-colors focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white"
                  >
                    {profiles.map(p => (
                      <option key={p.id} value={p.name}>
                        {p.name === 'default' ? 'Default Plan' : p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-6 flex gap-3 justify-end">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-5 py-2.5 border border-slate-200 bg-white text-slate-600 cursor-pointer rounded-lg text-sm font-semibold transition-colors hover:bg-slate-50">Batal</button>
                  <button type="submit" disabled={isEditing} className={`px-6 py-2.5 border-none bg-amber-500 text-white rounded-lg text-sm font-semibold transition-all shadow-[0_4px_6px_rgba(217,119,6,0.2)] ${isEditing ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:bg-amber-600'}`}>
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
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-[360px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            
            <div className="pt-6 px-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-500 flex items-center justify-center mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 m-0 mb-2">Hapus Pengguna</h3>
              <p className="text-sm text-slate-500 m-0 leading-relaxed">
                Apakah Anda yakin ingin menghapus <strong className="text-slate-700">{deleteData.username}</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            
            <div className="p-6 flex gap-3 justify-center mt-2">
              <button type="button" onClick={() => { setShowDeleteModal(false); setDeleteData(null); }} className="flex-1 py-2.5 border border-slate-200 bg-white text-slate-600 cursor-pointer rounded-lg text-sm font-semibold transition-colors hover:bg-slate-50">Batal</button>
              <button type="button" onClick={confirmDelete} disabled={isDeleting} className={`flex-1 py-2.5 border-none bg-red-500 text-white rounded-lg text-sm font-semibold transition-all shadow-[0_4px_6px_rgba(239,68,68,0.2)] ${isDeleting ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:bg-red-600'}`}>
                {isDeleting ? 'Memproses...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Bulk Delete Modal (Premium Style) */}
      {showBulkDeleteModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-[360px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            
            <div className="pt-6 px-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-500 flex items-center justify-center mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 m-0 mb-2">Hapus Masal</h3>
              <p className="text-sm text-slate-500 m-0 leading-relaxed">
                Hapus <strong className="text-slate-700">{selectedVouchers.length}</strong> voucher terpilih secara permanen?
              </p>
            </div>
            
            <div className="p-6 flex gap-3 justify-center mt-2">
              <button type="button" onClick={() => setShowBulkDeleteModal(false)} className="flex-1 py-2.5 border border-slate-200 bg-white text-slate-600 cursor-pointer rounded-lg text-sm font-semibold transition-colors hover:bg-slate-50">Batal</button>
              <button type="button" onClick={handleBulkDelete} disabled={isDeleting} className={`flex-1 py-2.5 border-none bg-red-500 text-white rounded-lg text-sm font-semibold transition-all shadow-[0_4px_6px_rgba(239,68,68,0.2)] ${isDeleting ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:bg-red-600'}`}>
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
