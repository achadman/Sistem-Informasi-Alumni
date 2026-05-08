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
  FileQuestion,
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
  const [pendingCount, setPendingCount] = React.useState(0);

  // Fetch Pending Companies Count for Admin
  React.useEffect(() => {
    if (!isAdmin) return;
    
    const fetchPendingCount = async () => {
      try {
        const result = await pb.collection('companies').getList(1, 1, {
          filter: 'verified = false',
          fields: 'id',
          requestKey: null
        });
        setPendingCount(result.totalItems);
      } catch (err) {
        console.error("Gagal mengambil jumlah verifikasi:", err);
      }
    };

    fetchPendingCount();
    
    pb.collection('companies').subscribe('*', () => fetchPendingCount());
    return () => pb.collection('companies').unsubscribe('*');
  }, [isAdmin]);

  // Fetch Institution
  React.useEffect(() => {
    const fetchInstitution = async () => {
      try {
        const data = await pb.collection('institution_profile').getFirstListItem('').catch(() => null);
        if (data) {
          const logoUrl = data.logo ? pb.files.getURL(data, data.logo) : null;
          setInstitution({ 
            nama: data.nama || 'SIA Portal',
            logoUrl: logoUrl
          });
        }
      } catch (err) {
        console.error("Gagal memuat institusi:", err);
      }
    };
    fetchInstitution();
  }, []);

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setMobileMenuOpen]);

  // Sidebar width configuration
  const desktopWidth = sidebarCollapsed ? 0 : 280;
  const mobileWidth = 280; // Fixed width for mobile (about half screen)

  const menuItems = isAdmin ? [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'Kuesioner', path: '/admin/kuesioner', icon: <FileQuestion size={20} /> },
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
    { name: 'Peta Distribusi', path: '/map', icon: <Map size={20} /> },
    { name: 'Bursa Karir', path: '/lowongan', icon: <Briefcase size={20} /> },
    { name: 'Profil Saya', path: '/profile', icon: <UserCircle size={20} /> },
    { name: 'Tracer Study', path: '/tracer', icon: <FileText size={20} /> }
  ];

  const handleNavItemClick = () => {
    if (window.innerWidth < 1024) {
      setMobileMenuOpen(false);
    } else {
      if (!sidebarCollapsed) toggleSidebar();
    }
  };

  const DesktopSidebar = () => (
    <motion.div 
      initial={false}
      animate={{ 
        width: desktopWidth,
        opacity: sidebarCollapsed ? 0 : 1
      }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={cn(
        "sidebar-bg flex-col h-full relative z-[40] border-r border-border-subtle overflow-hidden hidden lg:flex"
      )}
    >
      {/* Sidebar Header: Institution Name & Logo */}
      <div className="pt-6 px-4 pb-2 border-b border-border-subtle/50 flex flex-col items-center justify-center shrink-0 min-h-[60px]">
        {institution.logoUrl && (
          <img src={institution.logoUrl} alt="Logo" className="w-10 h-10 object-contain mb-2 drop-shadow-sm" />
        )}
        <span className="font-display font-bold text-slate-800 dark:text-slate-200 text-xs text-center leading-tight break-words whitespace-normal px-2">
          {institution.nama || 'SIA Portal'}
        </span>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto overflow-x-hidden pt-4 custom-scrollbar">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin' || item.path === '/' || item.path === '/industri'}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 relative group text-sm",
                isActive
                  ? "sidebar-item-active"
                  : "text-secondary hover:bg-black/5 hover:text-primary dark:hover:bg-white/5"
              )
            }
          >
            <div className="flex-shrink-0">{item.icon}</div>
            <span className="text-sm font-bold whitespace-nowrap flex-1">
              {item.name}
            </span>
            {item.name === 'Verifikasi Perusahaan' && pendingCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-in zoom-in duration-300">
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Section: User Popover */}
      <div className="p-4 border-t border-border-subtle relative bg-main/50 backdrop-blur-md">
        <button
          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          className={cn(
            "w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 border border-transparent",
            isProfileMenuOpen ? "bg-black/5 border-black/10 dark:bg-white/5 dark:border-white/10" : "hover:bg-black/5 dark:hover:bg-white/5 border-border-subtle"
          )}
        >
          <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-brand-primary font-bold border border-border-subtle shadow-sm overflow-hidden flex-shrink-0">
            {user?.avatar ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" /> : user?.name?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 overflow-hidden text-left">
            <p className="text-sm text-primary font-black truncate leading-tight">{user?.name || 'User'}</p>
            <p className="text-[10px] text-secondary truncate mt-0.5">{user?.email}</p>
          </div>
        </button>

        <AnimatePresence>
          {isProfileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-24 left-4 right-4 elevated-modal p-2 z-[70] overflow-hidden bg-elevated shadow-2xl border border-border-subtle rounded-2xl"
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
    </motion.div>
  );

  const MobileSidebar = () => (
    <AnimatePresence>
      {mobileMenuOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] lg:hidden"
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
            className="fixed inset-y-0 left-0 w-[80vw] max-w-[300px] bg-white dark:bg-[#1C1917] z-[101] flex flex-col shadow-2xl lg:hidden"
          >
            {/* Header / Brand */}
            <div className="flex items-center justify-between px-6 h-20 shrink-0 border-b border-slate-100 dark:border-white/5 gap-2">
              <div className="flex items-center gap-3 flex-1">
                 {institution.logoUrl && (
                   <img src={institution.logoUrl} alt="Logo" className="w-8 h-8 object-contain drop-shadow-sm" />
                 )}
                 <span className="font-display font-bold text-slate-800 dark:text-slate-200 text-xs text-left leading-tight break-words whitespace-normal line-clamp-2">
                   {institution.nama || 'SIA Portal'}
                 </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* User Info Minimal */}
            <div className="px-6 py-5 flex items-center gap-3 border-b border-slate-100 dark:border-white/5">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold overflow-hidden shrink-0">
                {user?.avatar ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" /> : user?.name?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">{user?.name || 'Pengguna'}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4 py-4 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/admin' || item.path === '/' || item.path === '/industri'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-4 px-4 py-3 rounded-xl transition-colors text-sm font-medium",
                      isActive
                        ? "text-blue-600 bg-blue-50/50 dark:bg-blue-500/10 dark:text-blue-400"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200"
                    )
                  }
                >
                  <div className="shrink-0">
                    {React.cloneElement(item.icon, { size: 18 })}
                  </div>
                  <span className="flex-1">{item.name}</span>
                  {item.name === 'Verifikasi Perusahaan' && pendingCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Footer / Logout */}
            <div className="p-4 border-t border-slate-100 dark:border-white/5 pb-safe">
               <button 
                  onClick={() => { logout(); setMobileMenuOpen(false); }} 
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-sm font-medium"
               >
                  <LogOut size={18} /> Keluar
               </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <DesktopSidebar />
      <MobileSidebar />
    </>
  );
}

