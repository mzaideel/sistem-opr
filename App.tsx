import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  ListTodo, 
  Search, 
  Printer, 
  Trash2, 
  Calendar, 
  MapPin, 
  Users, 
  Sparkles,
  Camera,
  X,
  FileText,
  Award,
  Edit3,
  Clock,
  Menu,
  Download,
  Loader2,
  Filter,
  ChevronLeft,
  Lock,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Plus,
  Quote,
  Shield,
  Zap,
  Eye,
  CheckCircle2,
  Verified,
  Cloud,
  CloudOff,
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { ActivityRecord, ViewState, ActivityCategory } from './types';
import { enhanceReport } from './geminiService';

const STORAGE_KEY = 'opr_system_v2_data';
const SCHOOL_LOGO_URL = 'https://i.postimg.cc/DZ8qMpcH/SKLB2021-2-01.png';
// URL Web App Google Script untuk storan online
const SYNC_URL = 'https://script.google.com/macros/s/AKfycbxte10RParn_trjP0Xy0nR91JqfuFtFd6DTpfKevQUz6JOB0UWXJHtp3bg3wPBTTSZy/exec'; 

const resizeImage = (base64Str: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
  });
};

const formatDateMalay = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const months = [
    'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
    'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<ActivityRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<ActivityCategory | 'Semua'>('Semua');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPopup, setShowAdminPopup] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  // Muat data dari LocalStorage dan Cuba Sync
  useEffect(() => {
    const loadData = async () => {
      // 1. Muat dari Lokal dahulu (Pantas)
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setActivities(JSON.parse(saved));
        }
      } catch (e) { console.error(e); }

      // 2. Jika ada SYNC_URL, muat dari Cloud (Online)
      if (SYNC_URL) {
        setSyncStatus('syncing');
        try {
          const res = await fetch(SYNC_URL);
          const cloudData = await res.json();
          if (Array.isArray(cloudData)) {
            setActivities(cloudData);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData));
            setSyncStatus('success');
          } else {
            setSyncStatus('error');
          }
        } catch (e) {
          console.error("Gagal sync online:", e);
          setSyncStatus('error');
        }
      }
    };
    loadData();
  }, []);

  // Simpan data ke Lokal dan Cloud
  const saveActivity = async (activity: ActivityRecord) => {
    const sanitizedActivity = {
      ...activity,
      reporterName: (activity.reporterName || '').toUpperCase(),
    };
    
    const newActivities = activities.some(a => a.id === activity.id)
      ? activities.map(a => a.id === activity.id ? sanitizedActivity : a)
      : [sanitizedActivity, ...activities];

    setActivities(newActivities);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newActivities));

    // Push ke Cloud jika ada SYNC_URL
    if (SYNC_URL) {
      setSyncStatus('syncing');
      try {
        await fetch(SYNC_URL, {
          method: 'POST',
          body: JSON.stringify(sanitizedActivity),
          mode: 'no-cors' // Penting untuk Google Apps Script
        });
        setSyncStatus('success');
      } catch (e) {
        console.error("Gagal save ke cloud:", e);
        setSyncStatus('error');
      }
    }

    setSelectedActivity(sanitizedActivity);
    setView('details');
  };

  const deleteActivity = async (id: string) => {
    if (confirm('Padam laporan ini secara kekal?')) {
      const updated = activities.filter(a => a.id !== id);
      setActivities(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      if (SYNC_URL) {
        setSyncStatus('syncing');
        try {
          // Biasanya GAS handle delete via parameter GET atau payload POST khusus
          await fetch(`${SYNC_URL}?deleteId=${id}`, { method: 'GET', mode: 'no-cors' });
          setSyncStatus('success');
        } catch (e) { 
          console.error("Gagal delete dari cloud:", e);
          setSyncStatus('error');
        }
      }
      
      if (selectedActivity?.id === id) setSelectedActivity(null);
    }
  };

  const handleAdminAuth = () => {
    if (adminPassword === '5003') {
      setIsAdmin(true);
      setShowAdminModal(false);
      setAdminPassword('');
    } else {
      alert('Kata laluan salah!');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setShowAdminPopup(false);
  };

  const filteredActivities = useMemo(() => {
    return (activities || []).filter(a => {
      const title = a.title || '';
      const venue = a.venue || '';
      const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'Semua' || a.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [activities, searchQuery, filterCategory]);

  const stats = useMemo(() => {
    const categories: Record<ActivityCategory, number> = {
      'Kurikulum': 0, 'Kokurikulum': 0, 'HEM': 0, 'Pentadbiran': 0, 'Lain-lain': 0
    };
    activities.forEach(a => {
      if (categories[a.category] !== undefined) categories[a.category]++;
    });
    const chartData = Object.entries(categories).map(([name, value]) => ({ name, value }));
    return { chartData, totalReports: activities.length };
  }, [activities]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const NavContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-900/20 flex-shrink-0">
            <Award className="text-white" size={22} />
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <h1 className="text-lg font-black text-white tracking-tight uppercase leading-none">SISTEM OPR</h1>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter leading-none">SK LAKSIAN BANGGI</span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 px-4 space-y-2 flex-1">
        <NavItem active={view === 'dashboard'} onClick={() => { setView('dashboard'); setIsSidebarOpen(false); }} icon={<LayoutDashboard size={20} />} label="Dashboard" />
        <NavItem active={view === 'list'} onClick={() => { setView('list'); setIsSidebarOpen(false); }} icon={<ListTodo size={20} />} label="Senarai Laporan" />
        <NavItem active={view === 'add'} onClick={() => { setSelectedActivity(null); setView('add'); setIsSidebarOpen(false); }} icon={<PlusCircle size={20} />} label="Daftar Baru" />
      </div>

      <div className="p-6 mt-auto space-y-4">
        {/* Sync Status Indicator */}
        <div className={`p-4 rounded-2xl border flex items-center gap-3 transition-all duration-500 ${
          syncStatus === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
          syncStatus === 'syncing' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' :
          syncStatus === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
          'bg-slate-800/50 border-slate-700/50 text-slate-500'
        }`}>
          {syncStatus === 'syncing' ? <RefreshCw className="animate-spin" size={18} /> : 
           syncStatus === 'success' ? <Cloud size={18} /> : 
           syncStatus === 'error' ? <CloudOff size={18} /> : <CloudOff size={18} />}
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest leading-none">Status Cloud</p>
            <p className="text-[8px] font-bold uppercase mt-1 opacity-70 truncate">
              {syncStatus === 'syncing' ? 'Menyelaras...' : 
               syncStatus === 'success' ? 'Berhubung Online' : 
               /* Fix: Use truthiness check to avoid comparison error with literal string constant */
               !SYNC_URL ? 'Lokal (Mod Offline)' : 'Gagal Menyambung'}
            </p>
          </div>
        </div>

        <div className="relative">
          {isAdmin && showAdminPopup && (
            <div className="absolute bottom-full left-0 w-full mb-3 p-2 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-2 duration-200 z-50">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest"
              >
                <LogOut size={16} />
                LOG KELUAR ADMIN
              </button>
            </div>
          )}
          <button 
            onClick={() => isAdmin ? setShowAdminPopup(!showAdminPopup) : setShowAdminModal(true)}
            className={`w-full flex items-center justify-between gap-3.5 px-5 py-4 rounded-2xl transition-all duration-300 group ${
              isAdmin 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-950/20' 
              : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              {isAdmin ? <ShieldCheck size={20} className="text-emerald-500" /> : <Lock size={20} />}
              <span className="font-black text-sm uppercase tracking-widest leading-none">ADMIN</span>
            </div>
            {isAdmin && <ChevronDown size={16} className={`opacity-40 group-hover:opacity-100 transition-transform ${showAdminPopup ? 'rotate-180' : ''}`} />}
          </button>
        </div>

        <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-1.5 overflow-hidden shadow-sm">
            <img src={SCHOOL_LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[11px] font-black text-white truncate uppercase tracking-tight">SK LAKSIAN BANGGI</p>
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">UNIT PENTADBIRAN</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <header className="no-print md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <img src={SCHOOL_LOGO_URL} alt="Logo" className="h-8 w-auto" />
          <div className="flex items-baseline gap-2">
            <span className="font-black tracking-tight text-lg">SISTEM OPR</span>
          </div>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-800 rounded-xl transition-all">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      <nav className="no-print hidden md:block w-72 flex-shrink-0 sticky top-0 h-screen overflow-y-auto border-r border-slate-200 shadow-sm">
        {NavContent}
      </nav>

      {isSidebarOpen && (
        <div className="no-print fixed inset-0 z-40 md:hidden animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 border-r border-slate-800 animate-in slide-in-from-left duration-300 shadow-2xl">
            {NavContent}
          </div>
        </div>
      )}

      {showAdminModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-sm:w-full max-w-sm rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-white/20 animate-in zoom-in-95">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 border border-indigo-100 shadow-inner">
                <Lock size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Akses Pentadbir</h3>
            </div>
            
            <div className="space-y-4">
              <input 
                autoFocus
                type="password" 
                placeholder="Kata Laluan"
                className="w-full px-6 py-4.5 bg-slate-100 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-black text-center text-xl tracking-[0.5em]"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdminAuth()}
              />
              <div className="flex gap-3">
                <button onClick={handleAdminAuth} className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg text-xs uppercase tracking-widest">Log Masuk</button>
                <button onClick={() => setShowAdminModal(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl transition-all text-xs uppercase tracking-widest">Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-x-hidden min-h-screen flex flex-col pb-24 md:pb-0">
        <header className="no-print hidden md:flex bg-white border-b border-slate-200 px-8 py-4 items-center justify-between sticky top-0 z-30 h-20">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              {view === 'dashboard' ? 'Analisis Data OPR' : 
               view === 'list' ? 'Senarai Laporan' : 
               view === 'add' ? 'Daftar Laporan OPR' : 
               view === 'details' ? 'Lihat OPR' : 'Kemaskini Laporan'}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            {view === 'list' && (
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Cari laporan..." 
                  className="pl-11 pr-5 py-2.5 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white w-80 transition-all outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}

            {view === 'list' && (
              <div className="relative group">
                <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500 transition-colors pointer-events-none" size={16} />
                <select 
                  className="pl-10 pr-10 py-2.5 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-tight focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white w-48 transition-all outline-none appearance-none cursor-pointer"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as any)}
                >
                  {['Semua', 'Kurikulum', 'Kokurikulum', 'HEM', 'Pentadbiran', 'Lain-lain'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              </div>
            )}
          </div>
        </header>

        <div className="p-4 md:p-10 flex-1 max-w-[1400px] mx-auto w-full">
          {view === 'dashboard' && <Dashboard stats={stats} COLORS={COLORS} />}
          
          {view === 'list' && (
            <ActivityList 
              activities={filteredActivities} 
              onView={(a) => { setSelectedActivity(a); setView('details'); }} 
              onEdit={(a) => { setSelectedActivity(a); setView('edit'); }}
              onDelete={deleteActivity}
              isAdmin={isAdmin}
            />
          )}

          {(view === 'add' || view === 'edit') && (
            <ActivityForm 
              onSave={saveActivity} 
              initialData={selectedActivity || undefined} 
              onCancel={() => setView(selectedActivity ? 'details' : 'list')}
            />
          )}

          {view === 'details' && selectedActivity && (
            <OPRDetail 
              activity={selectedActivity} 
              allActivities={activities}
              onBack={() => setView('list')} 
              onEdit={() => setView('edit')}
              onEnhance={async () => {
                if (!selectedActivity) return;
                setIsEnhancing(true);
                const result = await enhanceReport(selectedActivity.title, (selectedActivity.objective || []).join('\n'), selectedActivity.impact || '');
                if (result && result.enhancedObjective && result.enhancedImpact) {
                  const updated: ActivityRecord = { 
                    ...selectedActivity, 
                    objective: [result.enhancedObjective], 
                    impact: result.enhancedImpact 
                  };
                  saveActivity(updated);
                }
                setIsEnhancing(false);
              }}
              isEnhancing={isEnhancing}
            />
          )}
        </div>
      </main>

      <nav className="no-print md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 flex justify-around p-3 z-50 shadow-2xl">
        <MobileNavItem active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<LayoutDashboard size={22} />} label="Utama" />
        <MobileNavItem active={view === 'list'} onClick={() => setView('list')} icon={<ListTodo size={22} />} label="Senarai" />
        <button 
          onClick={() => { setSelectedActivity(null); setView('add'); }}
          className="relative -top-8 w-14 h-14 bg-indigo-600 rounded-2xl border-4 border-white flex items-center justify-center text-white active:scale-90 transition-transform shadow-xl shadow-indigo-200"
        >
          <PlusCircle size={28} />
        </button>
        <MobileNavItem active={view === 'add'} onClick={() => { setSelectedActivity(null); setView('add'); }} icon={<PlusCircle size={22} className="opacity-0" />} label="Daftar" />
        <button 
          onClick={() => isAdmin ? handleLogout() : setShowAdminModal(true)} 
          className={`flex flex-col items-center justify-center min-w-[64px] gap-1 transition-all ${isAdmin ? 'text-red-600' : 'text-slate-400'}`}
        >
          {isAdmin ? <LogOut size={22} /> : <Lock size={22} />}
          <span className="text-[10px] font-black uppercase tracking-tighter">{isAdmin ? 'Keluar' : 'Staf'}</span>
        </button>
      </nav>
    </div>
  );
};

// --- Reusable Component Definitions ---

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3.5 px-5 py-4 rounded-2xl transition-all duration-300 ${
      active ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'
    }`}
  >
    {icon}
    <span className="font-bold text-sm uppercase tracking-tight">{label}</span>
  </button>
);

const MobileNavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center min-w-[64px] gap-1 transition-all ${active ? 'text-indigo-600' : 'text-slate-400'}`}>
    {icon}
    <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
  </button>
);

const Dashboard: React.FC<{ stats: any; COLORS: string[] }> = ({ stats, COLORS }) => (
  <div className="space-y-8 animate-in fade-in duration-700">
    <div className="grid grid-cols-1 gap-6">
      <StatCard label="Jumlah Laporan" value={stats.totalReports} icon={<FileText className="text-indigo-500" />} />
    </div>
    <div className="grid grid-cols-1 gap-8">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-8">Prestasi Kategori</h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" fontSize={11} fontWeight={700} stroke="#94a3b8" axisLine={false} tickLine={false} />
              <YAxis fontSize={11} fontWeight={700} stroke="#94a3b8" axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={60}>
                {stats.chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  </div>
);

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 hover:border-indigo-300 transition-all group overflow-hidden shadow-sm">
    <div className="flex items-center justify-between relative z-10">
      <div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">{label}</span>
        <div className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{value}</div>
      </div>
      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl group-hover:bg-indigo-50 transition-all">
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 32 }) : icon}
      </div>
    </div>
  </div>
);

const ActivityList: React.FC<{ activities: ActivityRecord[]; onView: (a: ActivityRecord) => void; onEdit: (a: ActivityRecord) => void; onDelete: (id: string) => void; isAdmin: boolean }> = ({ activities, onView, onEdit, onDelete, isAdmin }) => {
  if (!activities || activities.length === 0) return <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest">Tiada rekod dikesan.</div>;
  return (
    <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500 px-1 pb-10">
      {activities.map(a => (
        <div key={a.id} className="bg-white rounded-[2rem] border border-slate-200 hover:border-indigo-500 transition-all group p-4 md:p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
          <div className="w-full md:w-40 h-32 md:h-28 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex-shrink-0">
            {a.photos && a.photos.length > 0 ? (
              <img src={a.photos[0].url} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-200"><FileText size={32} /></div>
            )}
          </div>
          <div className="flex-1 w-full text-center md:text-left">
            <span className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100 mb-2 inline-block">{a.category}</span>
            <h4 className="font-black text-slate-900 text-lg md:text-xl uppercase tracking-tight mb-2 leading-tight">{a.title}</h4>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 text-[11px] font-bold text-slate-500 uppercase tracking-tight">
              <div className="flex items-center gap-2"><Calendar size={13} className="text-indigo-500" /> {formatDateMalay(a.date)}</div>
              <div className="flex items-center gap-2"><MapPin size={13} className="text-indigo-500" /> {a.venue || 'SK LAKSIAN BANGGI'}</div>
              <div className="flex items-center gap-2"><Users size={13} className="text-indigo-500" /> {a.reporterName || '-'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => onView(a)} className="p-3.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all"><Eye size={22} /></button>
            <button onClick={() => onEdit(a)} className="p-3.5 bg-orange-50 text-orange-500 hover:bg-orange-500 hover:text-white rounded-2xl transition-all"><Edit3 size={22} /></button>
            {isAdmin && <button onClick={() => onDelete(a.id)} className="p-3.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all"><Trash2 size={22} /></button>}
          </div>
        </div>
      ))}
    </div>
  );
};

const ActivityForm: React.FC<{ onSave: (a: ActivityRecord) => void; initialData?: ActivityRecord; onCancel: () => void }> = ({ onSave, initialData, onCancel }) => {
  const [formData, setFormData] = useState<Partial<ActivityRecord>>(initialData || {
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    venue: '',
    organizer: '',
    category: 'Kurikulum',
    objective: [''],
    participantsCount: '',
    impact: '',
    status: 'Completed',
    photos: [],
    reporterName: '',
    reporterPosition: ''
  });
  const [isUploading, setIsUploading] = useState(false);

  const addObjective = () => {
    setFormData(prev => ({ ...prev, objective: [...(prev.objective || []), ''] }));
  };

  const updateObjective = (index: number, val: string) => {
    const next = [...(formData.objective || [])];
    next[index] = val;
    setFormData({ ...formData, objective: next });
  };

  const removeObjective = (index: number) => {
    if ((formData.objective?.length || 0) <= 1) return;
    setFormData(prev => ({ ...prev, objective: prev.objective?.filter((_, i) => i !== index) }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setIsUploading(true);
      for (const file of Array.from(files)) {
        if ((formData.photos?.length || 0) >= 4) break;
        const reader = new FileReader();
        const raw = await new Promise<string>((res) => {
          reader.onloadend = () => res(reader.result as string);
          reader.readAsDataURL(file);
        });
        const compressed = await resizeImage(raw);
        setFormData(prev => ({ ...prev, photos: [...(prev.photos || []), { id: Math.random().toString(36).substr(2, 9), url: compressed, caption: 'Foto' }].slice(0, 4) }));
      }
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ 
      ...formData as ActivityRecord, 
      id: initialData?.id || Date.now().toString(), 
      createdAt: initialData?.createdAt || Date.now(),
      objective: formData.objective || ['']
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white p-8 md:p-14 rounded-[3rem] border border-slate-200 shadow-sm animate-in slide-in-from-bottom-8">
      <div className="flex items-center justify-between mb-10 border-b border-slate-100 pb-8">
        <div>
          <h3 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter leading-tight">
            {initialData ? 'KEMASKINI LAPORAN' : 'DAFTAR OPR BARU'}
          </h3>
          <p className="text-xs text-slate-500 font-bold uppercase mt-1 tracking-tight leading-none">Sila isi maklumat program di bawah.</p>
        </div>
        <button type="button" onClick={onCancel} className="p-2.5 bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-600 rounded-2xl transition-all"><X size={24} /></button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-8">
          <FormGroup label="Nama Program / Aktiviti">
            <input required type="text" className="w-full px-6 py-4.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white outline-none font-bold" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </FormGroup>
          <div className="grid grid-cols-2 gap-6">
            <FormGroup label="Tarikh">
              <input required type="date" className="w-full px-6 py-4.5 rounded-2xl bg-slate-50 border border-slate-200 font-bold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </FormGroup>
            <FormGroup label="Masa">
              <input type="text" className="w-full px-6 py-4.5 rounded-2xl bg-slate-50 border border-slate-200 font-bold" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} placeholder="8:00 AM" />
            </FormGroup>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <FormGroup label="Kategori">
              <select className="w-full px-6 py-4.5 rounded-2xl bg-slate-50 border border-slate-200 font-bold appearance-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})}>
                {['Kurikulum', 'Kokurikulum', 'HEM', 'Pentadbiran', 'Lain-lain'].map(c => <option key={c}>{c}</option>)}
              </select>
            </FormGroup>
            <FormGroup label="Tempat">
              <input type="text" className="w-full px-6 py-4.5 rounded-2xl bg-slate-50 border border-slate-200 font-bold" value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} />
            </FormGroup>
          </div>
          <FormGroup label="Sasaran / Penglibatan">
            <input type="text" className="w-full px-6 py-4.5 rounded-2xl bg-slate-50 border border-slate-200 font-bold" value={formData.participantsCount} onChange={e => setFormData({...formData, participantsCount: e.target.value})} />
          </FormGroup>
          
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <FormGroup label="Nama Pelapor">
              <input required type="text" className="w-full px-6 py-4.5 rounded-2xl bg-slate-50 border border-slate-200 font-black uppercase text-indigo-600 focus:bg-white transition-all" value={formData.reporterName} onChange={e => setFormData({...formData, reporterName: e.target.value.toUpperCase()})} placeholder="NAMA PENUH" />
            </FormGroup>
            <FormGroup label="Jawatan Pelapor">
              <input required type="text" className="w-full px-6 py-4.5 rounded-2xl bg-slate-50 border border-slate-200 font-bold focus:bg-white transition-all" value={formData.reporterPosition} onChange={e => setFormData({...formData, reporterPosition: e.target.value})} placeholder="JAWATAN (CTH: Guru Penyelaras)" />
            </FormGroup>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Objektif Program</label>
              <button type="button" onClick={addObjective} className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center">
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-3">
              {formData.objective?.map((obj, i) => (
                <div key={i} className="flex gap-2 group">
                  <div className="flex-1 relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">{String(i+1).padStart(2, '0')}.</span>
                    <input className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-indigo-500 outline-none transition-all" value={obj} onChange={e => updateObjective(i, e.target.value)} placeholder={`Objektif ${i+1}`} />
                  </div>
                  {formData.objective!.length > 1 && (
                    <button type="button" onClick={() => removeObjective(i)} className="p-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"><X size={18} /></button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <FormGroup label="Impak & Refleksi">
            <textarea className="w-full px-6 py-4.5 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 outline-none min-h-[140px] font-medium" value={formData.impact} onChange={e => setFormData({...formData, impact: e.target.value})} />
          </FormGroup>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Foto (Maks 4)</label>
            <div className="grid grid-cols-4 gap-3">
              {formData.photos?.map(p => (
                <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden group">
                  <img src={p.url} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setFormData({...formData, photos: formData.photos?.filter(ph => ph.id !== p.id)})} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"><X size={12} /></button>
                </div>
              ))}
              {(formData.photos?.length || 0) < 4 && (
                <label className={`aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer ${isUploading ? 'bg-slate-100' : 'border-slate-200 hover:bg-slate-50'}`}>
                  {isUploading ? <Loader2 className="animate-spin" /> : <Camera size={24} className="text-slate-300" />}
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-12 flex flex-col sm:flex-row gap-4">
        <button type="submit" disabled={isUploading} className="flex-[2] bg-indigo-600 text-white font-black py-5 rounded-2xl text-lg uppercase tracking-widest shadow-lg shadow-indigo-100">SIMPAN LAPORAN</button>
        <button type="button" onClick={onCancel} className="flex-1 bg-slate-100 text-slate-600 font-bold py-5 rounded-2xl uppercase tracking-widest">BATAL</button>
      </div>
    </form>
  );
};

const FormGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{label}</label>
    {children}
  </div>
);

const OPRDetail: React.FC<{ activity: ActivityRecord; allActivities: ActivityRecord[]; onBack: () => void; onEdit: () => void; onEnhance: () => void; isEnhancing: boolean }> = ({ activity, allActivities, onBack, onEdit, onEnhance, isEnhancing }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (wrapperRef.current) {
        const wrapperWidth = wrapperRef.current.offsetWidth;
        const targetWidth = 210 * 3.7795275591; 
        setScale(Math.min(1, (wrapperWidth - 40) / targetWidth));
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setIsDownloading(true);
    const element = reportRef.current;
    
    const opt = {
      margin: 0,
      filename: `OPR_${(activity.title || '').replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { scale: 3, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    try {
      // @ts-ignore
      if (typeof html2pdf !== 'undefined') {
        // @ts-ignore
        await html2pdf().from(element).set(opt).save();
      } else {
        console.warn("html2pdf library not found. Falling back to print.");
        window.print();
      }
    } catch (err) {
      console.error("PDF generation error:", err);
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.scrollTo(0, 0);
    window.print();
  };

  const getCategoryColor = (cat: ActivityCategory) => {
    switch(cat) {
      case 'Kurikulum': return 'bg-indigo-600';
      case 'Kokurikulum': return 'bg-emerald-600';
      case 'HEM': return 'bg-amber-600';
      case 'Pentadbiran': return 'bg-rose-600';
      default: return 'bg-slate-600';
    }
  };

  const getObjectiveFontSize = (objectives: string[]) => {
    const totalChars = (objectives || []).reduce((acc, obj) => acc + (obj || '').length, 0);
    const count = (objectives || []).length;
    if (totalChars > 450 || count > 8) return 'text-[8px]';
    if (totalChars > 250 || count > 5) return 'text-[9px]';
    return 'text-[10px]';
  };

  const getReportNumber = () => {
    const currentYear = new Date(activity.date).getFullYear();
    const sameYearActivities = allActivities
      .filter(a => new Date(a.date).getFullYear() === currentYear)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.createdAt - b.createdAt);
    
    const index = sameYearActivities.findIndex(a => a.id === activity.id) + 1;
    return `${String(index).padStart(2, '0')}/${currentYear}`;
  };

  const photos = activity.photos || [];

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="no-print flex flex-wrap items-center justify-between gap-6 px-1">
        <button onClick={onBack} className="text-slate-500 hover:text-indigo-600 font-black flex items-center gap-2 group transition-colors">
          <div className="p-2.5 bg-white rounded-xl border border-slate-200 group-hover:bg-indigo-50 shadow-sm"><ChevronLeft size={20} /></div>
          Senarai Laporan
        </button>
        <div className="flex flex-wrap items-center gap-3">
          <button disabled={isEnhancing} onClick={onEnhance} className="px-6 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black flex items-center gap-2 uppercase tracking-tight shadow-md">
            {isEnhancing ? <Loader2 className="animate-spin" size={18} /> : <><Sparkles size={18} /> AI FIX</>}
          </button>
          <button onClick={onEdit} className="px-6 py-4 bg-white text-orange-600 border border-orange-200 rounded-2xl text-xs font-black flex items-center gap-2 uppercase tracking-tight">
            <Edit3 size={18} /> EDIT
          </button>
          <button disabled={isDownloading} onClick={handleDownloadPDF} className="px-6 py-4 bg-emerald-600 text-white rounded-2xl text-xs font-black flex items-center gap-2 uppercase tracking-tight shadow-md">
            {isDownloading ? <Loader2 className="animate-spin" size={18} /> : <><Download size={18} /> PDF</>}
          </button>
          <button onClick={handlePrint} className="px-6 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black flex items-center gap-2 uppercase tracking-tight shadow-md">
            <Printer size={18} /> CETAK
          </button>
        </div>
      </div>

      <div ref={wrapperRef} className="pdf-wrapper bg-slate-100/50 rounded-[3rem] border border-slate-200 overflow-hidden relative shadow-inner">
        <div 
          ref={reportRef} 
          className="pdf-container print-a4 flex flex-col p-12 relative report-grid-pattern overflow-hidden"
          style={{ transform: `scale(${scale})`, height: scale < 1 ? 'auto' : '297mm', marginBottom: scale < 1 ? `-${(1 - scale) * 297 * 3.7795}px` : '0' }}
        >
          {/* Header Laporan */}
          <div className="relative mb-6 shrink-0 group">
            <div className={`absolute top-0 right-0 w-48 h-1 ${getCategoryColor(activity.category)} opacity-30 rounded-full`} />
            <div className={`absolute top-0 left-0 w-2 h-full ${getCategoryColor(activity.category)} rounded-full shadow-[2px_0_10px_rgba(0,0,0,0.05)]`} />
            
            <div className="flex items-center gap-8 pl-10 pt-2 pb-4 border-b-2 border-slate-900/10">
              <div className="relative">
                <div className="flex-shrink-0 relative z-10 w-24 h-24 flex items-center justify-center">
                  <img src={SCHOOL_LOGO_URL} alt="Logo" className="h-24 w-auto object-contain" />
                </div>
                <div className={`absolute inset-0 ${getCategoryColor(activity.category)} blur-2xl opacity-10 rounded-full -z-10`} />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-1.5">
                  <div className={`px-2 py-0.5 bg-slate-900 text-white font-black text-[7px] tracking-[0.3em] rounded uppercase`}>DOKUMEN RASMI</div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">ONE PAGE REPORT</span>
                  <div className="h-0.5 bg-slate-100 flex-grow rounded-full" />
                </div>
                
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none uppercase mb-1 drop-shadow-sm">LAPORAN OPR</h1>
                
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <Verified size={14} className="text-indigo-600" />
                    <p className="text-lg font-bold text-slate-800 tracking-tight leading-none uppercase">SEKOLAH KEBANGSAAN LAKSIAN BANGGI</p>
                  </div>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none pl-5">Kod Sekolah : XBA5003</p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 pr-2">
                <div className={`px-5 py-2.5 ${getCategoryColor(activity.category)} text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-900/10 flex items-center gap-2 group-hover:scale-105 transition-transform duration-300 mb-1`}>
                  <Zap size={14} fill="white" />
                  {activity.category}
                </div>
                <div className="text-[9px] font-black text-slate-900 uppercase text-right leading-none bg-slate-100 px-2 py-1 rounded border border-slate-200">
                  No. Laporan: {getReportNumber()}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-8 flex-1 min-h-0 overflow-hidden px-2">
            <div className="col-span-6 flex flex-col gap-5 border-r border-slate-100 pr-6 overflow-hidden h-full">
              <section className="bg-indigo-50/80 p-5 rounded-[1.5rem] border border-indigo-100/50 shrink-0 shadow-inner">
                <h2 className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getCategoryColor(activity.category)} shadow-sm`} /> TAJUK PROGRAM
                </h2>
                <p className="text-xl font-black text-slate-900 leading-[1.2] uppercase tracking-tight line-clamp-2">{activity.title}</p>
              </section>

              <div className="grid grid-cols-2 gap-3 shrink-0">
                <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/30 shadow-sm flex items-center gap-2.5 group/card hover:bg-white transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 group-hover/card:scale-110 transition-transform"><Calendar size={16} /></div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[7px] font-black text-slate-400 uppercase tracking-widest">TARIKH</span>
                    <span className="text-[10px] font-bold text-slate-800 block truncate">{formatDateMalay(activity.date)}</span>
                  </div>
                </div>
                <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/30 shadow-sm flex items-center gap-2.5 group/card hover:bg-white transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 group-hover/card:scale-110 transition-transform"><Clock size={16} /></div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[7px] font-black text-slate-400 uppercase tracking-widest">MASA</span>
                    <span className="text-[10px] font-bold text-slate-800 block truncate">{activity.time || '-'}</span>
                  </div>
                </div>
                <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/30 shadow-sm flex items-center gap-2.5 group/card hover:bg-white transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 group-hover/card:scale-110 transition-transform"><Users size={16} /></div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[7px] font-black text-slate-400 uppercase tracking-widest">SASARAN</span>
                    <span className="text-[10px] font-bold text-slate-800 block truncate">{activity.participantsCount || '-'}</span>
                  </div>
                </div>
                <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/30 shadow-sm flex items-center gap-2.5 group/card hover:bg-white transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 group-hover/card:scale-110 transition-transform"><MapPin size={16} /></div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[7px] font-black text-slate-400 uppercase tracking-widest">TEMPAT</span>
                    <span className="text-[10px] font-bold text-slate-800 block truncate">{activity.venue || '-'}</span>
                  </div>
                </div>
              </div>

              <section className="flex-1 bg-indigo-50/50 p-5 rounded-[2rem] border border-indigo-100/30 relative overflow-hidden shadow-sm flex flex-col min-h-0">
                <div className="absolute top-0 right-0 -mr-10 -mt-10 w-24 h-24 bg-white/40 rounded-full" />
                <h2 className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-2 shrink-0">
                   <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" /> OBJEKTIF
                </h2>
                <div className={`space-y-2.5 overflow-hidden flex-1 ${getObjectiveFontSize(activity.objective)}`}>
                  {(activity.objective || []).map((obj, i) => (
                    <div key={i} className="flex gap-3 font-semibold text-slate-700 leading-normal group/obj">
                      <span className={`flex-shrink-0 w-6 h-6 bg-white text-indigo-600 rounded-md flex items-center justify-center font-black border border-indigo-100 group-hover/obj:bg-indigo-600 group-hover/obj:text-white transition-all scale-90 shadow-sm`}>{i+1}</span>
                      <p className="pt-0.5">{obj || '-'}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-slate-900 text-white p-5 rounded-[2rem] border-l-[4px] border-indigo-500 relative overflow-hidden shadow-xl shrink-0">
                <Quote className="absolute top-4 right-4 text-white/5" size={48} />
                <h2 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2 relative z-10">IMPAK & REFLEKSI</h2>
                <p className="text-[11px] font-bold italic leading-relaxed text-slate-100 font-serif relative z-10 clamp-impact">
                  "{activity.impact || 'Maklumat refleksi program belum diisi.'}"
                </p>
              </section>

              <div className="mt-auto pt-4 flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 shadow-sm">
                  <ShieldCheck size={24} />
                </div>
                <div className="min-w-0">
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">DISEDIAKAN OLEH,</span>
                  <p className="font-black text-[14px] text-slate-900 uppercase leading-none tracking-tight truncate">{activity.reporterName}</p>
                  <p className="text-[9px] text-slate-500 font-black uppercase mt-1 tracking-tighter leading-none truncate">{activity.reporterPosition}</p>
                </div>
              </div>
            </div>

            <div className="col-span-6 flex flex-col h-full min-h-0 overflow-hidden">
              <div className="flex items-center justify-between mb-3 pb-1.5 border-b-2 border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                   <div className="w-1 h-5 bg-slate-900 rounded-full" />
                   <h2 className="text-[9px] font-black text-slate-900 uppercase tracking-widest">EVIDENS VISUAL</h2>
                </div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">LAMPIRAN</span>
              </div>
              
              <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-hidden w-full h-full">
                {photos.length > 0 ? (
                  photos.map((photo, idx) => (
                    <div key={photo.id} className="relative bg-slate-50 rounded-[1.2rem] overflow-hidden border border-slate-200 group shadow-sm w-full flex-1 min-h-0">
                      <img 
                        src={photo.url} 
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                        alt={`Evidens ${idx + 1}`} 
                      />
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="text-[8px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                           <Camera size={12} /> FOTO {idx + 1}
                        </span>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                    </div>
                  ))
                ) : (
                  [0, 1, 2, 3].map((idx) => (
                    <div key={idx} className="w-full h-full border-2 border-dashed border-slate-200 rounded-[1.2rem] bg-slate-50 flex flex-col items-center justify-center text-slate-200 flex-1 min-h-0">
                      <Camera size={28} strokeWidth={1} />
                      <span className="text-[7px] font-black mt-2 uppercase tracking-[0.2em] opacity-50">SLOT {idx + 1}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 relative border-t-2 border-slate-100 px-2 shrink-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-5">
               <div className="flex items-center gap-2">
                 <div className="w-1 h-1 bg-indigo-600 rounded-full" />
                 <div className="w-2 h-2 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                 <div className="w-1 h-1 bg-indigo-600 rounded-full" />
               </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="p-2 bg-slate-900 rounded-xl shadow-xl shadow-slate-900/10">
                   <Award size={16} className="text-white" />
                </div>
                <div className="leading-tight">
                  <p className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">SK LAKSIAN BANGGI</p>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">UNIT KUALITI & PENTADBIRAN</p>
                </div>
              </div>
              
              <div className="text-center group cursor-default">
                 <p className="text-[10px] font-black text-indigo-600 tracking-[0.3em] uppercase transition-all duration-700 group-hover:tracking-[0.5em]">#SKLaksianTERBAIK</p>
                 <div className="h-0.5 bg-indigo-50 w-full mt-1.5 rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-indigo-600 rounded-full mx-auto" />
                 </div>
              </div>

              <div className="text-right flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  <CheckCircle2 size={10} className="text-emerald-500" />
                  SISTEM OPR V2.0
                </div>
                <p className="text-[7px] text-slate-300 font-bold leading-none italic uppercase tracking-tighter">
                  Kemaskini: {new Date().toLocaleDateString('ms-MY', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;