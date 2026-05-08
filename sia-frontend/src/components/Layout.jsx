import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, GraduationCap, Sun, Moon } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { pb } from '../lib/pb';

export default function Layout() {
  const { toggleMobileMenu, toggleSidebar, theme, toggleTheme } = useUIStore();
  const location = useLocation();

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
    <div className="flex flex-col h-screen bg-main overflow-hidden transition-colors duration-500">
      {/* Global Top Navbar (Google Forms Style) */}
      <header className="h-16 glass-effect flex items-center justify-between px-6 z-[50] shrink-0 border-b border-border-subtle sticky top-0">
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

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all text-secondary hover:text-primary active:scale-90"
            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto relative custom-scrollbar bg-main">
          <div className="p-4 md:p-8 lg:p-10 max-w-[1600px] mx-auto min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
