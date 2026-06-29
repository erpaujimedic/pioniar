import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LineChart, DollarSign, Calendar, RefreshCw, Loader2, Search, TrendingUp, Users } from 'lucide-react';
import HexLoader from '../../components/HexLoader';

export default function WifiReporting() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Bulan Ini'); // 'Hari Ini', 'Minggu Ini', 'Bulan Ini', 'Tahun Ini', 'Semua'
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/wifi/sales');
      if (res.ok) {
        const data = await res.json();
        setSales(data);
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Koneksi ke server gagal' });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSales();
    
    const handleRefresh = () => fetchSales();
    window.addEventListener('app:refresh', handleRefresh);
    return () => window.removeEventListener('app:refresh', handleRefresh);
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

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

  const filteredSalesByDate = filterDataByDate(sales);
  
  const searchedSales = React.useMemo(() => {
    const filtered = filteredSalesByDate.filter(s => 
      (s.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.plan || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    let sortableItems = [...filtered];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        if (sortConfig.key === 'price') {
            aVal = Number(aVal) || 0;
            bVal = Number(bVal) || 0;
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
  }, [filteredSalesByDate, searchTerm, sortConfig]);

  // Calculate Pagination Data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = searchedSales.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(searchedSales.length / itemsPerPage);

  const totalRevenue = filteredSalesByDate.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  const totalVouchers = filteredSalesByDate.length;

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    try {
        const date = new Date(isoString);
        return date.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' });
    } catch { return isoString; }
  };

  return (
    <div className="animate-fade-in relative flex flex-col h-full overflow-hidden bg-white">

      <div className="flex flex-col flex-1 overflow-hidden">
        
        {/* Sleek KPI Row (Premium) */}
        <div className="flex gap-2 p-2 pb-0 flex-wrap sm:flex-nowrap">
          <div className="flex-1 rounded border border-slate-200 p-2 flex items-center gap-2 bg-white shadow-sm transition-all hover:shadow-md">
            <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
              <DollarSign size={16} />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest m-0 mb-0.5">Total Penjualan ({filter})</p>
              <h2 className="text-base font-extrabold text-slate-900 m-0">{formatRupiah(totalRevenue)}</h2>
            </div>
          </div>
          
          <div className="flex-1 rounded border border-slate-200 p-2 flex items-center gap-2 bg-white shadow-sm transition-all hover:shadow-md">
            <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
              <Users size={16} />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest m-0 mb-0.5">Voucher Terjual ({filter})</p>
              <h2 className="text-base font-extrabold text-slate-900 m-0">{totalVouchers} <span className="text-[11px] font-medium text-slate-500">user</span></h2>
            </div>
          </div>
        </div>

        {/* Action Bar (Premium) */}
        <div className="flex flex-col sm:flex-row gap-2 p-2 sm:px-3 bg-white border-b border-slate-100 items-start sm:items-center mt-1">
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex gap-1 p-0.5 bg-slate-50 rounded border border-slate-200 overflow-x-auto hide-scrollbar flex-1 sm:flex-none shadow-inner">
              {['Hari Ini', 'Minggu Ini', 'Bulan Ini', 'Tahun Ini', 'Semua'].map(f => (
                <button 
                  key={f}
                  onClick={() => setFilter(f)} 
                  className={`px-2 py-0.5 rounded-sm border-none text-[10px] cursor-pointer transition-all whitespace-nowrap ${filter === f ? 'bg-white text-slate-900 font-bold shadow-sm' : 'bg-transparent text-slate-500 font-semibold hover:bg-slate-100'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 hidden sm:block"></div>

          <div className="flex items-center border border-slate-200 bg-white px-1.5 py-0.5 rounded transition-colors focus-within:border-emerald-500 shadow-sm w-full sm:w-auto h-6">
            <Search size={12} className="text-slate-400 shrink-0" />
            <input 
              type="text" 
              placeholder="Cari username, paket..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-none outline-none px-1.5 py-0.5 text-[10px] bg-transparent text-slate-900 w-full sm:w-[150px]"
            />
          </div>
        </div>

        {/* Premium Table */}
        <div className="flex-1 overflow-auto bg-white px-2">
          <table className="w-full min-w-[700px] border-collapse text-[11px] mt-1">
            <thead className="bg-white sticky top-0 z-10">
              <tr>
                <th className="py-1.5 px-2 border border-slate-200 text-center font-bold text-slate-400 uppercase tracking-wider text-[9px] bg-white cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('sold_at')}>Tanggal Login {sortConfig.key === 'sold_at' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th className="py-1.5 px-2 border border-slate-200 text-center font-bold text-slate-400 uppercase tracking-wider text-[9px] bg-white cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('username')}>Username {sortConfig.key === 'username' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th className="py-1.5 px-2 border border-slate-200 text-center font-bold text-slate-400 uppercase tracking-wider text-[9px] bg-white cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('plan')}>Paket Terjual {sortConfig.key === 'plan' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th className="py-1.5 px-2 border border-slate-200 text-center font-bold text-slate-400 uppercase tracking-wider text-[9px] bg-white cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('price')}>Pendapatan (Harga) {sortConfig.key === 'price' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
              </tr>
            </thead>
            <tbody>
              {loading && sales.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center p-8 text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 size={16} className="animate-spin text-emerald-500" />
                      <span>Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : searchedSales.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center p-8 text-slate-500">Data penjualan kosong.</td>
                </tr>
              ) : (
                currentItems.map(s => (
                  <tr key={s.id} className="cursor-pointer transition-colors hover:bg-slate-50">
                    <td className="py-1.5 px-2 text-center text-slate-500 whitespace-nowrap border border-slate-200">{formatDate(s.sold_at)}</td>
                    <td className="py-1.5 px-2 text-center font-bold text-slate-900 border border-slate-200">{s.username}</td>
                    <td className="py-1.5 px-2 text-center text-slate-600 border border-slate-200">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded font-semibold text-[9px]">{s.plan}</span>
                    </td>
                    <td className="py-1.5 px-2 text-center text-emerald-600 font-bold border border-slate-200">{formatRupiah(s.price)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Status Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 py-1.5 border-t border-slate-100 bg-white text-[10px] font-medium text-slate-500 shrink-0 gap-2">
          <div className="flex items-center gap-1">
            <span>Menampilkan {searchedSales.length > 0 ? `${indexOfFirstItem + 1} - ${Math.min(indexOfLastItem, searchedSales.length)} dari ` : ''}<strong className="text-slate-800">{searchedSales.length}</strong> transaksi</span>
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
