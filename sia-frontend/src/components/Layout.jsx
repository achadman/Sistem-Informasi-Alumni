import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, GraduationCap, Sun, Moon } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { pb } from '../lib/pb';

export default function Layout() {
  const { toggleMobileMenu, toggleSidebar, theme, toggleTheme } = useUIStore();
  const [institution, setInstitution] = useState({ nama: 'SIA Portal', logoUrl: null });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const fetchInstitution = async () => {
      try {
        const data = await pb.collection('institution_profile').getFirstListItem('').catch(() => null);
        if (data) {
          const logoUrl = data.logo ? pb.files.getURL(data, data.logo) : null;
          setInstitution({
            nama: data.nama || 'SIA Portal',
            logoUrl
          });
        }
      } catch (err) {
        console.error("Gagal memuat institusi di header:", err);
      }
    };
    fetchInstitution();
  }, []);

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
          
          <div className="flex items-center gap-3">
            {institution.logoUrl ? (
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-blue-500/20 flex items-center justify-center bg-white border border-border-subtle p-0.5">
                <img src={institution.logoUrl} alt="Logo Institusi" className="w-full h-full object-contain rounded-lg" />
              </div>
            ) : (
              <div className="bg-brand-primary p-2 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center">
                <GraduationCap size={18} className="text-white" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-display font-black text-primary tracking-tighter leading-none text-lg line-clamp-1 max-w-[150px] sm:max-w-[300px]">
                {institution.nama}
              </span>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-primary opacity-80 mt-0.5">Alumni System</span>
            </div>
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
