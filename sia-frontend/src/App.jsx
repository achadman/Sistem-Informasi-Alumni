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
import AdminSettings from './pages/AdminSettings';
import AlumniProfile from './pages/AlumniProfile';
import AlumniJobs from './pages/AlumniJobs';
import IndustryDashboard from './pages/IndustryDashboard';
import IndustryRegister from './pages/IndustryRegister';
import IndustryAlumniSearch from './pages/IndustryAlumniSearch';
import IndustryCompanyProfile from './pages/IndustryCompanyProfile';
import IndustryJobPostings from './pages/IndustryJobPostings';
import IndustryCreateJob from './pages/IndustryCreateJob';
import IndustryApplicants from './pages/IndustryApplicants';
import AdminCompanyVerification from './pages/AdminCompanyVerification';
import MasterAddress from './pages/MasterAddress';
import Layout from './components/Layout';
import Settings from './pages/Settings';
import AdminKuesionerList from './pages/AdminKuesionerList';
import AdminKuesionerBuilder from './pages/AdminKuesionerBuilder';
import AdminKuesionerResults from './pages/AdminKuesionerResults';

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

// Industry Route Guard — hanya untuk role industri
const IndustryRoute = ({ children }) => {
  const { user } = useAuthStore();
  if (user?.role !== 'industri') {
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
        {/* Registrasi Industri — public, tidak perlu login */}
        <Route path="/industri/register" element={<IndustryRegister />} />
        
        {/* Protected Routes encapsulated in Layout */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<Home />} />
          <Route path="/tracer" element={<TracerStudy />} />
          <Route path="/profile" element={<AlumniProfile />} />
          <Route path="/lowongan" element={<AlumniJobs />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/alumni-directory" element={<AlumniList />} />
          <Route path="/alumni/:id" element={<AlumniDetail />} />
          <Route path="/map" element={<AdminMap />} />
          
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/alumni" element={<AdminRoute><AlumniList /></AdminRoute>} />
          <Route path="/admin/alumni/:id" element={<AdminRoute><AlumniDetail /></AdminRoute>} />
          <Route path="/admin/master" element={<AdminRoute><MasterNIM /></AdminRoute>} />
          <Route path="/admin/map" element={<AdminRoute><AdminMap /></AdminRoute>} />
          <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
          <Route path="/admin/kuesioner" element={<AdminRoute><AdminKuesionerList /></AdminRoute>} />
          <Route path="/admin/kuesioner/:id/edit" element={<AdminRoute><AdminKuesionerBuilder /></AdminRoute>} />
          <Route path="/admin/kuesioner/:id/results" element={<AdminRoute><AdminKuesionerResults /></AdminRoute>} />
          {/* Aliasing older route for compatibility */}
          <Route path="/admin/profile-institusi" element={<AdminRoute><AdminSettings /></AdminRoute>} />
          <Route path="/admin/perusahaan" element={<AdminRoute><AdminCompanyVerification /></AdminRoute>} />
          <Route path="/admin/alamat" element={<AdminRoute><MasterAddress /></AdminRoute>} />

          {/* Industry Routes */}
          <Route path="/industri" element={<IndustryRoute><IndustryDashboard /></IndustryRoute>} />
          <Route path="/industri/alumni" element={<IndustryRoute><IndustryAlumniSearch /></IndustryRoute>} />
          <Route path="/industri/profil" element={<IndustryRoute><IndustryCompanyProfile /></IndustryRoute>} />
          <Route path="/industri/lowongan" element={<IndustryRoute><IndustryJobPostings /></IndustryRoute>} />
          <Route path="/industri/lowongan/buat" element={<IndustryRoute><IndustryCreateJob /></IndustryRoute>} />
          <Route path="/industri/lowongan/edit/:id" element={<IndustryRoute><IndustryCreateJob /></IndustryRoute>} />
           <Route path="/industri/lowongan/:jobId/pelamar" element={<IndustryRoute><IndustryApplicants /></IndustryRoute>} />
          <Route path="/industri/alumni/:id" element={<IndustryRoute><AlumniDetail /></IndustryRoute>} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
