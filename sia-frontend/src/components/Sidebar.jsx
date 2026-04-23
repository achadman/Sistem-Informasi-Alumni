import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { 
  LayoutDashboard, 
  UserCircle, 
  FileText, 
  LogOut, 
  GraduationCap, 
  Map, 
  MapPin,
  Users,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Building,
  Building2,
  User as UserIcon,
  ShieldAlert,
  Search,
  Briefcase,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { pb } from '../lib/pb';

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar, mobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const isAdmin = user?.role === 'admin';
  const isIndustry = user?.role === 'industri';
  const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);
  const [institution, setInstitution] = React.useState({ nama: '', logo: '' });

  React.useEffect(() => {
    // Close mobile menu on larger screens
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setMobileMenuOpen]);

  React.useEffect(() => {
    const fetchInstitution = async () => {
      try {
        const record = await pb.collection('institution_profile').getFirstListItem('');
        if (record) {
          setInstitution({
            nama: record.nama,
            logo: record.logo ? pb.files.getUrl(record, record.logo) : ''
          });
        }
      } catch (err) {
        // Fallback to default if no profile exists yet
        console.log("No institution profile found, using defaults");
      }
    };
    fetchInstitution();
  }, []);

  const menuItems = isAdmin ? [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'Daftar Alumni', path: '/admin/alumni', icon: <Users size={20} /> },
    { name: 'Verifikasi Perusahaan', path: '/admin/perusahaan', icon: <Building size={20} /> },
    { name: 'Peta Sebaran', path: '/admin/map', icon: <Map size={20} /> },
    { name: 'Master NIM', path: '/admin/master', icon: <GraduationCap size={20} /> },
    { name: 'Master Alamat', path: '/admin/alamat', icon: <MapPin size={20} /> },
  ] : isIndustry ? [
    { name: 'Dashboard', path: '/industri', icon: <LayoutDashboard size={20} /> },
    { name: 'Cari Alumni', path: '/industri/alumni', icon: <Search size={20} /> },
    { name: 'Lowongan Kerja', path: '/industri/lowongan', icon: <Briefcase size={20} /> },
    { name: 'Profil Perusahaan', path: '/industri/profil', icon: <Building2 size={20} /> },
  ] : [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Bursa Karir', path: '/lowongan', icon: <Briefcase size={20} /> },
    { name: 'Profil Saya', path: '/profile', icon: <UserCircle size={20} /> },
    { name: 'Tracer Study', path: '/tracer', icon: <FileText size={20} /> }
  ];

  const handleNavItemClick = () => {
    if (window.innerWidth < 1024) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[25] lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.div 
        initial={false}
        animate={{ 
          width: (window.innerWidth < 1024) ? '100%' : (sidebarCollapsed ? 90 : 280),
          x: (window.innerWidth < 1024 && !mobileMenuOpen) ? '-100%' : 0
        }}
        transition={window.innerWidth < 1024 
          ? { type: 'tween', duration: 0.35, ease: [0.4, 0, 0.2, 1] } 
          : { type: 'spring', damping: 25, stiffness: 120 }
        }
        className={cn(
          "sidebar-bg flex flex-col h-full relative z-[40] transition-colors duration-500",
          "fixed inset-y-0 left-0 lg:relative lg:translate-x-0 transition-transform lg:transition-none",
          "lg:border-r border-border-subtle"
        )}
      >
      {/* Brand Header */}
      <div className="p-6 h-24 flex items-center justify-between">
        <AnimatePresence mode="wait">
          {(!sidebarCollapsed || (window.innerWidth < 1024)) ? (
            <motion.h2 
              key="full"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-2xl font-black text-primary tracking-tighter flex items-center justify-center lg:justify-start gap-4 overflow-hidden"
            >
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center overflow-hidden">
                 {institution.logo ? (
                   <img src={institution.logo} alt="Logo" className="w-full h-full object-contain" />
                 ) : (
                   <div className="bg-brand-primary p-2 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center">
                    <GraduationCap size={24} className="text-white" />
                   </div>
                 )}
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[15px] font-bold text-primary truncate max-w-[150px] leading-tight mb-0.5">{institution.nama || 'SIA Portal'}</span>
                <span className="text-[10px] text-brand-primary uppercase tracking-widest font-black opacity-80">Alumni Portal</span>
              </div>
            </motion.h2>
          ) : (
            <motion.div 
              key="mini"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="mx-auto flex-shrink-0 w-11 h-11 flex items-center justify-center overflow-hidden"
            >
               {institution.logo ? (
                 <img src={institution.logo} alt="Logo" className="w-full h-full object-contain" />
               ) : (
                 <div className="bg-brand-primary p-2 rounded-xl shadow-lg shadow-blue-500/20">
                  <GraduationCap size={24} className="text-white" />
                 </div>
               )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto overflow-x-hidden pt-4 custom-scrollbar">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin' || item.path === '/'}
            onClick={handleNavItemClick}
            className={({ isActive }) =>
              cn(
                "flex items-center lg:justify-start justify-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 relative group text-sm",
                isActive
                  ? "sidebar-item-active"
                  : "text-secondary hover:bg-black/5 hover:text-primary"
              )
            }
          >
            <div className="flex-shrink-0">{item.icon}</div>
            <AnimatePresence>
              {(!sidebarCollapsed || (window.innerWidth < 1024)) && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="text-sm font-semibold whitespace-nowrap"
                >
                  {item.name}
                </motion.span>
              )}
            </AnimatePresence>
            {sidebarCollapsed && (
              <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#1C1917] text-[#E8E4DE] text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 font-medium z-50 whitespace-nowrap" style={{boxShadow: '0 2px 8px rgba(0,0,0,0.15)'}}>
                {item.name}
              </div>
            )}
          </NavLink>
        ))}

        {/* System section removed to minimize layout as requested */}
      </nav>

      {/* Footer Section: Collapse Button & User Popover */}
      <div className="p-4 border-t border-border-subtle relative">
        {/* Toggle Arrow ALWAYS on top of profile in footer */}
        <button
          onClick={toggleSidebar}
          className={cn(
            "flex items-center justify-center w-full py-2 rounded-lg transition-all duration-200 text-secondary hover:bg-black/5 hover:text-primary mb-2 lg:flex hidden text-xs",
            sidebarCollapsed ? "px-0" : "px-4"
          )}
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <div className="flex items-center gap-2"><ChevronLeft size={18} /><span className="text-xs font-bold">Shrink Sidebar</span></div>}
        </button>

        {/* Profile Popover Menu */}
        <AnimatePresence>
          {isProfileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={cn(
                "absolute bottom-24 left-4 right-4 elevated-modal p-2 z-[60] overflow-hidden",
                (sidebarCollapsed && window.innerWidth >= 1024) && "left-4 right-[-160px] w-48"
              )}
            >
              <div className="px-3 py-2 border-b border-border-subtle mb-1">
                <p className="text-[10px] font-black text-secondary uppercase tracking-widest">{isAdmin ? 'Administrator Menu' : 'User Menu'}</p>
              </div>
              
              {isAdmin && (
                <NavLink 
                  to="/admin/settings" 
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-secondary hover:bg-brand-primary/10 hover:text-brand-primary transition-all text-sm font-bold"
                >
                  <Building size={16} /> 
                  <span>Pengaturan Institusi</span>
                </NavLink>
              )}

              <NavLink 
                to="/settings" 
                onClick={() => setIsProfileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-secondary hover:bg-white/5 hover:text-primary transition-all text-sm font-medium"
              >
                <Settings size={16} /> 
                <span>Pengaturan</span>
              </NavLink>

              <NavLink 
                to="/help" 
                onClick={() => setIsProfileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-secondary hover:bg-white/5 hover:text-primary transition-all text-sm font-medium"
              >
                <HelpCircle size={16} /> 
                <span>Help Center</span>
              </NavLink>

              <button 
                onClick={() => { logout(); setIsProfileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-500/10 transition-all text-sm font-bold mt-1"
              >
                <LogOut size={16} /> 
                <span>Keluar</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User Profile Block */}
        <button
          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          className={cn(
            "w-full flex items-center lg:justify-start justify-center gap-3 p-3 rounded-2xl transition-all duration-300 border border-transparent",
            isProfileMenuOpen ? "bg-black/5 border-black/10" : "hover:bg-black/5 border-border-subtle"
          )}
        >
          <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-brand-primary font-bold border border-border-subtle shadow-sm overflow-hidden flex-shrink-0">
            {user?.avatar ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" /> : user?.name?.charAt(0) || 'A'}
          </div>
          {(!sidebarCollapsed || (window.innerWidth < 1024)) && (
            <div className="flex-1 overflow-hidden text-left">
              <p className="text-sm text-primary font-black truncate leading-tight">{user?.name || 'Administrator'}</p>
              <p className="text-[10px] text-secondary truncate mt-0.5">{user?.email}</p>
            </div>
          )}
        </button>

        {/* Mobile Close Button */}
        {window.innerWidth < 1024 && (
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="w-full mt-6 py-4 flex items-center justify-center gap-3 bg-primary text-main rounded-2xl shadow-xl active:scale-95 transition-all font-bold"
          >
            <X size={20} />
            <span>Tutup Menu</span>
          </button>
        )}
      </div>
    </motion.div>
    </>
  );
}

