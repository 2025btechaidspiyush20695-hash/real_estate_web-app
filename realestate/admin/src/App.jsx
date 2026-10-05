import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth';
import Login from './pages/Login';
import Forgot from './pages/Forgot';
import Reset from './pages/Reset';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import PropertyForm from './pages/PropertyForm';
import Content from './pages/Content';
import Enquiries from './pages/Enquiries';
import SiteVisits from './pages/SiteVisits';
import Analytics from './pages/Analytics';
import AuditLog from './pages/AuditLog';
import Settings from './pages/Settings';
import Layout from './components/Layout';

// Works both in dev (root) and when served under /admin in production
const basename = window.location.pathname.startsWith('/admin') ? '/admin' : '/';

function Guard({ children }) {
  const { user, ready } = useAuth();
  if (!ready) {
    return (
      <div className="a-boot">
        <div className="a-boot-ring" />
        <p>Loading…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes basename={basename}>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot" element={<Forgot />} />
      <Route path="/reset/:token" element={<Reset />} />
      <Route
        path="/"
        element={
          <Guard>
            <Layout />
          </Guard>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="properties" element={<Properties />} />
        <Route path="properties/new" element={<PropertyForm />} />
        <Route path="properties/:id/edit" element={<PropertyForm />} />
        <Route path="content" element={<Content />} />
        <Route path="enquiries" element={<Enquiries />} />
        <Route path="visits" element={<SiteVisits />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="audit" element={<AuditLog />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
