import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Sun, Moon, Settings, LogOut, HelpCircle, UserCircle } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { pb } from '../lib/pb';
import { motion, AnimatePresence } from 'framer-motion';

export default function Layout() {
  const { toggleMobileMenu, toggleSidebar, theme, toggleTheme } = useUIStore();
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const isAdmin = user?.role === 'admin';
  const isIndustry = user?.role === 'industri';

  const getPageTitle = (pathname) => {
    if (pathname === '/admin' || pathname === '/' || pathname === '/industri') return 'Dashboard';
    if (pathname.includes('/kuesioner')) return 'Kuesioner';
    if (pathname.includes('/alumni')) return 'Daftar Alumni';
    if (pathname.includes('/perusahaan')) return 'Verifikasi Perusahaan';
    if (pathname.includes('/map')) return 'Peta Sebaran';
    if (pathname.includes('/master')) return 'Master Data';
    if (pathname.includes('/alamat')) return 'Master Alamat';
    if (pathname.includes('/lowongan')) return 'Bursa Karir';
    if (pathname.includes('/profile') || pathname.includes('/profil')) return 'Profil';
    if (pathname.includes('/tracer')) return 'Tracer Study';
    if (pathname.includes('/settings')) return 'Pengaturan';
    return 'SIA Portal';
  };
  const pageTitle = getPageTitle(location.pathname);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);



  return (
    <div className="flex h-screen bg-main overflow-hidden transition-colors duration-500">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden relative">
        {/* Global Top Navbar */}
        <header className="min-h-[4.5rem] py-2 glass-effect flex items-center justify-between px-6 z-[50] shrink-0 border-b border-border-subtle sticky top-0 gap-4 bg-white/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                if (window.innerWidth < 1024) {
                  toggleMobileMenu();
                } else {
                  toggleSidebar();
                }
              }}
              className="p-2.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all text-secondary active:scale-90"
              title="Menu Utama"
            >
              <Menu size={22} />
            </button>
            
            <div className="flex items-center ml-2">
              <h1 className="font-display font-bold text-slate-800 dark:text-slate-200 text-lg sm:text-xl tracking-tight">
                {pageTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 justify-end">
            <div id="navbar-actions-portal" className="flex items-center justify-end" />
            
            <button
              onClick={toggleTheme}
              className="p-2.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all text-secondary hover:text-primary active:scale-90"
              title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* User Profile Dropdown */}
            <div className="relative ml-2">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-3 p-1.5 pr-3 rounded-full border border-border-subtle hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold shadow-sm overflow-hidden flex-shrink-0">
                  {user?.avatar ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" /> : user?.name?.charAt(0) || 'A'}
                </div>
                <div className="hidden sm:block text-left max-w-[120px]">
                  <p className="text-xs text-primary font-black truncate leading-tight">{user?.name || 'User'}</p>
                  <p className="text-[10px] text-secondary truncate mt-0.5 capitalize">{user?.role || 'User'}</p>
                </div>
              </button>

              <AnimatePresence>
                {isProfileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-12 right-0 w-64 p-2 z-[70] overflow-hidden bg-elevated shadow-2xl border border-border-subtle rounded-2xl"
                  >
                    {isAdmin && (
                      <NavLink to="/admin/settings" onClick={() => setIsProfileMenuOpen(false)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-secondary hover:bg-main hover:text-primary transition-all text-sm font-bold mb-1">
                        <Settings size={16} /> <span>Pengaturan Institusi</span>
                      </NavLink>
                    )}
                    {!isAdmin && (
                      <NavLink to={isIndustry ? "/industri/profil" : "/settings"} onClick={() => setIsProfileMenuOpen(false)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-secondary hover:bg-main hover:text-primary transition-all text-sm font-bold mb-1">
                        <Settings size={16} /> <span>Pengaturan Akun</span>
                      </NavLink>
                    )}
                    <button onClick={() => setIsProfileMenuOpen(false)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-secondary hover:bg-main hover:text-primary transition-all text-sm font-bold mb-2">
                      <HelpCircle size={16} /> <span>Pusat Bantuan</span>
                    </button>
                    <div className="h-px bg-border-subtle w-full mb-2"></div>
                    <button onClick={() => { logout(); setIsProfileMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-500/10 transition-all text-sm font-bold">
                      <LogOut size={16} /> <span>Keluar</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto relative custom-scrollbar bg-main">
          <div className="p-4 md:p-8 lg:p-10 max-w-[1600px] mx-auto min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
