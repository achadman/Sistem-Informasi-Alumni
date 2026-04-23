import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, GraduationCap } from 'lucide-react';
import { useUIStore } from '../store/uiStore';

export default function Layout() {
  const { toggleMobileMenu, theme } = useUIStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-main overflow-hidden transition-colors duration-500">
      {/* Mobile Top Navbar with Glassmorphism */}
      <header className="lg:hidden h-16 glass-effect flex items-center justify-between px-6 z-30 shrink-0 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="bg-brand-primary p-2 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center">
            <GraduationCap size={18} className="text-white" />
          </div>
          <span className="font-bold text-primary tracking-tight">SIA Portal</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleMobileMenu}
            className="p-2 hover:bg-white/10 dark:hover:bg-white/5 rounded-xl transition-all text-secondary active:scale-95"
          >
            <Menu size={26} />
          </button>
        </div>
      </header>

      <Sidebar />
      
      <main className="flex-1 overflow-y-auto relative custom-scrollbar">


        <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
