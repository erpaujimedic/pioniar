import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import ClientLayout from './client/ClientLayout';
import LandingPage from './client/pages/LandingPage';
import HotspotLogin from './client/pages/HotspotLogin';
import HotspotStatus from './client/pages/HotspotStatus';
import VoucherShop from './client/pages/VoucherShop';
import Checkout from './client/pages/Checkout';
import AboutPage from './client/pages/AboutPage';

import AdminLayout from './admin/AdminLayout';
import DashboardOverview from './admin/pages/DashboardOverview';
import WifiManager from './admin/pages/WifiManager';
import WifiProfileManager from './admin/pages/WifiProfileManager';
import WifiActiveSessions from './admin/pages/WifiActiveSessions';
import WifiReporting from './admin/pages/WifiReporting';

// Placeholder components for other routes
const Placeholder = ({ title }) => (
  <div className="animate-fade-in glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
    <h2>{title}</h2>
    <p style={{ color: 'var(--pioniar-text-muted)', marginTop: '0.5rem' }}>Sedang dalam tahap pengembangan...</p>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* Client Routes (Pioniar Network) */}
        <Route path="/" element={<ClientLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="portal" element={<HotspotLogin />} />
          <Route path="portalinformation" element={<HotspotStatus />} />
          <Route path="portal/buy" element={<VoucherShop />} />
          <Route path="portal/checkout" element={<Checkout />} />
          <Route path="about-me" element={<AboutPage />} />
        </Route>

        {/* Admin Routes (PIONIAR Super Admin - MDI Window Manager) */}
        <Route path="/admin/*" element={<AdminLayout />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
