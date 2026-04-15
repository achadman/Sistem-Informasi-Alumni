import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Home from './pages/Home';
import Login from './pages/Login';
import Activate from './pages/Activate';
import TracerStudy from './pages/TracerStudy';
import AdminDashboard from './pages/AdminDashboard';
import AdminMap from './pages/AdminMap';
import AlumniList from './pages/AlumniList';
import AlumniDetail from './pages/AlumniDetail';
import MasterNIM from './pages/MasterNIM';
import AuditData from './pages/AuditData';
import AdminSettings from './pages/AdminSettings';
import AlumniProfile from './pages/AlumniProfile';
import Layout from './components/Layout';

const ProtectedRoute = ({ children }) => {
  const { isValid } = useAuthStore();
  if (!isValid) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const { isValid } = useAuthStore();
  if (isValid) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Simple Admin Route Guard setup
const AdminRoute = ({ children }) => {
  const { user } = useAuthStore();
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/activate" 
          element={
            <PublicRoute>
              <Activate />
            </PublicRoute>
          } 
        />
        
        {/* Protected Routes encapsulated in Layout */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<Home />} />
          <Route path="/tracer" element={<TracerStudy />} />
          <Route path="/profile" element={<AlumniProfile />} />
          
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/alumni" element={<AdminRoute><AlumniList /></AdminRoute>} />
          <Route path="/admin/alumni/:id" element={<AdminRoute><AlumniDetail /></AdminRoute>} />
          <Route path="/admin/master" element={<AdminRoute><MasterNIM /></AdminRoute>} />
          <Route path="/admin/audit" element={<AdminRoute><AuditData /></AdminRoute>} />
          <Route path="/admin/map" element={<AdminRoute><AdminMap /></AdminRoute>} />
          <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
          {/* Aliasing older route for compatibility */}
          <Route path="/admin/profile-institusi" element={<AdminRoute><AdminSettings /></AdminRoute>} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
