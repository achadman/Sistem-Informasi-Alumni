import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, GraduationCap } from 'lucide-react';
import { useUIStore } from '../store/uiStore';

export default function Layout() {
  const { toggleMobileMenu } = useUIStore();

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Top Navbar */}
      <header className="lg:hidden h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-brand-primary p-2 rounded-xl shadow-lg shadow-blue-100 flex items-center justify-center">
            <GraduationCap size={18} className="text-white" />
          </div>
          <span className="font-bold text-slate-800 tracking-tight">SIA Portal</span>
        </div>
        <button 
          onClick={toggleMobileMenu}
          className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-600 active:scale-95"
        >
          <Menu size={26} />
        </button>
      </header>

      <Sidebar />
      
      <main className="flex-1 overflow-y-auto relative">
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
