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
        "bg-[#0A66C2] text-white flex-col h-full relative z-[40] border-r border-[#0A66C2] overflow-hidden hidden lg:flex shadow-2xl"
      )}
    >
      {/* Sidebar Header: Institution Name & Logo horizontally aligned */}
      <div className="pt-8 px-6 pb-6 border-b border-white/10 flex items-center justify-start gap-3 shrink-0">
        {institution.logoUrl && (
          <div className="w-10 h-10 bg-white rounded-lg p-1 shrink-0 flex items-center justify-center shadow-md">
             <img src={institution.logoUrl} alt="Logo" className="w-full h-full object-contain" />
          </div>
        )}
        <div className="flex flex-col items-start overflow-hidden">
           <span className="font-display font-black text-white text-xl tracking-wider leading-none">
             UNIBI
           </span>
           <span className="text-white/60 text-[10px] tracking-widest uppercase mt-1 font-bold">
             Alumni Portal
           </span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto overflow-x-hidden pt-4 custom-scrollbar">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin' || item.path === '/' || item.path === '/industri'}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 relative group text-sm font-medium",
                isActive
                  ? "bg-white/15 text-white font-bold shadow-sm"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
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

      <div className="p-4 border-t border-white/10">
         {/* Footer area if needed, User Profile moved to Navbar */}
         <div className="flex flex-col items-center justify-center opacity-40 hover:opacity-100 transition-opacity">
            <span className="text-[10px] font-medium text-white">Versi 1.0.0</span>
         </div>
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
            className="fixed inset-y-0 left-0 w-[80vw] max-w-[300px] bg-[#0A66C2] text-white z-[101] flex flex-col shadow-2xl lg:hidden"
          >
            {/* Header / Brand */}
            <div className="flex items-center justify-between px-6 h-20 shrink-0 border-b border-white/10 gap-2">
              <div className="flex items-center gap-3 flex-1">
                 {institution.logoUrl && (
                   <div className="w-8 h-8 bg-white rounded-md p-0.5 shrink-0 flex items-center justify-center">
                     <img src={institution.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                   </div>
                 )}
                 <div className="flex flex-col items-start overflow-hidden">
                    <span className="font-display font-black text-white text-lg tracking-wider leading-none">
                      UNIBI
                    </span>
                 </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-white/70 hover:text-white transition-colors shrink-0"
              >
                <X size={20} />
              </button>
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
                        ? "bg-white/15 text-white font-bold"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
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
            <div className="p-4 border-t border-white/10 pb-safe">
               <button 
                  onClick={() => { logout(); setMobileMenuOpen(false); }} 
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-300 hover:bg-red-500/20 transition-colors text-sm font-bold"
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

