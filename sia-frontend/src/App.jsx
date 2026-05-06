import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import PageLoader from './components/PageLoader';
import { Toaster } from 'sonner';

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Activate = lazy(() => import('./pages/Activate'));
const TracerStudy = lazy(() => import('./pages/TracerStudy'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminMap = lazy(() => import('./pages/AdminMap'));
const AlumniList = lazy(() => import('./pages/AlumniList'));
const AlumniDetail = lazy(() => import('./pages/AlumniDetail'));
const MasterNIM = lazy(() => import('./pages/MasterNIM'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const AlumniProfile = lazy(() => import('./pages/AlumniProfile'));
const AlumniJobs = lazy(() => import('./pages/AlumniJobs'));
const IndustryDashboard = lazy(() => import('./pages/IndustryDashboard'));
const IndustryRegister = lazy(() => import('./pages/IndustryRegister'));
const IndustryAlumniSearch = lazy(() => import('./pages/IndustryAlumniSearch'));
const IndustryCompanyProfile = lazy(() => import('./pages/IndustryCompanyProfile'));
const IndustryJobPostings = lazy(() => import('./pages/IndustryJobPostings'));
const IndustryCreateJob = lazy(() => import('./pages/IndustryCreateJob'));
const IndustryApplicants = lazy(() => import('./pages/IndustryApplicants'));
const AdminCompanyVerification = lazy(() => import('./pages/AdminCompanyVerification'));
const MasterAddress = lazy(() => import('./pages/MasterAddress'));
const Settings = lazy(() => import('./pages/Settings'));
const AdminKuesionerList = lazy(() => import('./pages/AdminKuesionerList'));
const AdminKuesionerBuilder = lazy(() => import('./pages/AdminKuesionerBuilder'));
const AdminKuesionerResults = lazy(() => import('./pages/AdminKuesionerResults'));
const CompanyDetail = lazy(() => import('./pages/CompanyDetail'));

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
      <Toaster position="top-center" expand={false} richColors />
      <Suspense fallback={<PageLoader />}>
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
          <Route path="/perusahaan/:id" element={<CompanyDetail />} />
          
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
          <Route path="/admin/perusahaan/:id" element={<AdminRoute><CompanyDetail /></AdminRoute>} />
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
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
