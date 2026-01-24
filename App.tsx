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
  Camera,
  X,
  FileText,
  Award,
  Edit3,
  Clock,
  Menu,
  Download,
  Loader2,
  ChevronLeft,
  Lock,
  ShieldCheck,
  Quote,
  Eye,
  CheckCircle2,
  Verified,
  Cloud,
  RefreshCw,
  Zap,
  Save
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

declare const html2pdf: any;

const STORAGE_KEY = 'opr_system_v2_data';
const SCHOOL_LOGO_URL = 'https://i.postimg.cc/DZ8qMpcH/SKLB2021-2-01.png';
const SYNC_URL = 'https://script.google.com/macros/s/AKfycbxQVq31gNdQQEAAgIF_8-OzLO58WEALB0Bqe0qXZLhbynCrAgfdleFSTBhEr4b1-N5f/exec'; 

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

const formatDateShort = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<ActivityRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<ActivityCategory | 'Semua'>('Semua');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  useEffect(() => {
    const loadData = async () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setActivities(JSON.parse(saved));
      } catch (e) { console.error(e); }

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

  const saveActivity = async (activity: ActivityRecord) => {
    const sanitizedActivity = {
      ...activity,
      id: activity.id || Date.now().toString(),
      createdAt: activity.createdAt || Date.now(),
      reporterName: (activity.reporterName || '').toUpperCase(),
    };
    
    const newActivities = activities.some(a => a.id === sanitizedActivity.id)
      ? activities.map(a => a.id === sanitizedActivity.id ? sanitizedActivity : a)
      : [sanitizedActivity, ...activities];

    setActivities(newActivities);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newActivities));

    if (SYNC_URL) {
      setSyncStatus('syncing');
      try {
        await fetch(SYNC_URL, {
          method: 'POST',
          body: JSON.stringify(sanitizedActivity),
          mode: 'no-cors'
        });
        setSyncStatus('success');
      } catch (e) {
        console.error("Gagal simpan ke cloud:", e);
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
        try {
          await fetch(`${SYNC_URL}?deleteId=${id}`, { method: 'GET', mode: 'no-cors' });
        } catch (e) {}
      }
      if (selectedActivity?.id === id) setSelectedActivity(null);
    }
  };

  const filteredActivities = useMemo(() => {
    return (activities || []).filter(a => {
      const title = a.title || '';
      const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.venue || '').toLowerCase().includes(searchQuery.toLowerCase());
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
    return { 
      chartData: Object.entries(categories).map(([name, value]) => ({ name, value })),
      totalReports: activities.length 
    };
  }, [activities]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const NavContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl shadow-lg flex-shrink-0">
            <Award className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-lg font-black text-white uppercase leading-none tracking-tight">SISTEM OPR</h1>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter block mt-1">SK LAKSIAN BANGGI</span>
          </div>
        </div>
      </div>
      <div className="mt-4 px-4 space-y-2 flex-1">
        <NavItem active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<LayoutDashboard size={20} />} label="Dashboard" />
        <NavItem active={view === 'list'} onClick={() => setView('list')} icon={<ListTodo size={20} />} label="Senarai Laporan" />
        <NavItem active={view === 'add'} onClick={() => { setSelectedActivity(null); setView('add'); }} icon={<PlusCircle size={20} />} label="Daftar Baru" />
      </div>
      <div className="p-6 mt-auto space-y-4">
        <div className={`p-4 rounded-2xl border flex items-center gap-3 transition-all duration-500 ${
          syncStatus === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
          syncStatus === 'syncing' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' :
          'bg-slate-800 border-slate-700 text-slate-500'
        }`}>
          {syncStatus === 'syncing' ? <RefreshCw className="animate-spin" size={18} /> : <Cloud size={18} />}
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest leading-none">Cloud Status</p>
            <p className="text-[8px] font-bold uppercase opacity-70 truncate mt-1">
              {syncStatus === 'syncing' ? 'Menyelaras...' : syncStatus === 'success' ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
        <button 
          onClick={() => isAdmin ? setIsAdmin(false) : setShowAdminModal(true)}
          className={`w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl transition-all ${
            isAdmin ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-500 hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {isAdmin ? <ShieldCheck size={20} /> : <Lock size={20} />}
            <span className="font-black text-sm uppercase tracking-widest leading-none">ADMIN</span>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <header className="no-print md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <img src={SCHOOL_LOGO_URL} alt="Logo" className="h-8 w-auto" />
          <span className="font-black tracking-tight text-lg">SISTEM OPR</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-800 rounded-xl">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      <nav className="no-print hidden md:block w-72 flex-shrink-0 sticky top-0 h-screen overflow-y-auto border-r border-slate-200">
        {NavContent}
      </nav>

      {isSidebarOpen && (
        <div className="no-print fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72">{NavContent}</div>
        </div>
      )}

      {showAdminModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl text-center">
            <h3 className="text-xl font-black text-slate-900 uppercase mb-8">Akses Pentadbir</h3>
            <input 
              autoFocus
              type="password" 
              className="w-full px-6 py-4 bg-slate-100 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-black text-center text-xl tracking-[0.5em] mb-6"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (adminPassword === '5003' ? (setIsAdmin(true), setShowAdminModal(false), setAdminPassword('')) : alert('Kunci Salah!'))}
            />
            <div className="flex gap-3">
              <button onClick={() => adminPassword === '5003' ? (setIsAdmin(true), setShowAdminModal(false), setAdminPassword('')) : alert('Kunci Salah!')} className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest">Masuk</button>
              <button onClick={() => setShowAdminModal(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl text-xs uppercase tracking-widest">Batal</button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-x-hidden min-h-screen flex flex-col">
        <header className="no-print hidden md:flex bg-white border-b border-slate-200 px-8 py-4 items-center justify-between sticky top-0 z-30 h-20">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
            {view === 'dashboard' ? 'Analisis Data' : view === 'list' ? 'Senarai OPR' : view === 'add' ? 'Daftar Baru' : 'Lihat Laporan'}
          </h2>
          {view === 'list' && (
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Cari..." 
                  className="pl-11 pr-5 py-2.5 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-medium w-80 outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select 
                className="pl-4 pr-10 py-2.5 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as any)}
              >
                {['Semua', 'Kurikulum', 'Kokurikulum', 'HEM', 'Pentadbiran', 'Lain-lain'].map(cat => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}
        </header>

        <div className="p-4 md:p-10 flex-1 max-w-[1400px] mx-auto w-full">
          {view === 'dashboard' && <Dashboard stats={stats} COLORS={COLORS} />}
          {view === 'list' && <ActivityList activities={filteredActivities} onView={(a) => { setSelectedActivity(a); setView('details'); }} onEdit={(a) => { setSelectedActivity(a); setView('edit'); }} onDelete={deleteActivity} isAdmin={isAdmin} />}
          {(view === 'add' || view === 'edit') && <ActivityForm onSave={saveActivity} initialData={selectedActivity || undefined} onCancel={() => setView('list')} />}
          {view === 'details' && selectedActivity && <OPRDetail activity={selectedActivity} allActivities={activities} onBack={() => setView('list')} onEdit={() => setView('edit')} />}
        </div>
      </main>
    </div>
  );
};

// --- Sub Components ---

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3.5 px-5 py-4 rounded-2xl transition-all ${
      active ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'
    }`}
  >
    {icon}
    <span className="font-bold text-sm uppercase tracking-tight">{label}</span>
  </button>
);

const Dashboard: React.FC<{ stats: any; COLORS: string[] }> = ({ stats, COLORS }) => (
  <div className="space-y-8">
    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 flex items-center justify-between">
      <div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Jumlah Laporan</span>
        <div className="text-5xl font-black text-slate-900 leading-none">{stats.totalReports}</div>
      </div>
      <div className="p-5 bg-indigo-50 text-indigo-600 rounded-3xl"><FileText size={44} /></div>
    </div>
    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 h-[450px]">
      <h3 className="text-lg font-black text-slate-800 uppercase mb-8">Status Prestasi Kategori</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={stats.chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" fontSize={11} fontWeight={700} stroke="#94a3b8" axisLine={false} tickLine={false} />
          <YAxis fontSize={11} fontWeight={700} stroke="#94a3b8" axisLine={false} tickLine={false} />
          <Tooltip cursor={{fill: '#f8fafc'}} />
          <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={60}>
            {stats.chartData.map((_: any, index: number) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const ActivityList: React.FC<{ activities: ActivityRecord[]; onView: (a: ActivityRecord) => void; onEdit: (a: ActivityRecord) => void; onDelete: (id: string) => void; isAdmin: boolean }> = ({ activities, onView, onEdit, onDelete, isAdmin }) => (
  <div className="space-y-4">
    {activities.length === 0 ? (
      <div className="text-center py-20 text-slate-400 font-bold uppercase">Tiada rekod laporan ditemui.</div>
    ) : (
      activities.map(a => (
        <div key={a.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 hover:border-indigo-500 transition-all flex flex-col md:flex-row items-center gap-6 shadow-sm">
          <div className="w-full md:w-32 h-24 bg-slate-50 rounded-2xl overflow-hidden flex-shrink-0">
            {a.photos?.[0] ? <img src={a.photos[0].url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><Camera size={24} /></div>}
          </div>
          <div className="flex-1 text-center md:text-left">
            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-lg mb-1.5 inline-block">{a.category}</span>
            <h4 className="font-black text-slate-900 text-xl uppercase tracking-tight leading-tight">{a.title}</h4>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs font-bold text-slate-400 mt-2">
              <span className="flex items-center gap-1.5 uppercase"><Calendar size={14} /> {formatDateShort(a.date)}</span>
              <span className="flex items-center gap-1.5 uppercase"><MapPin size={14} /> {a.venue || '-'}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onView(a)} className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all"><Eye size={22} /></button>
            <button onClick={() => onEdit(a)} className="p-3.5 bg-orange-50 text-orange-500 rounded-2xl hover:bg-orange-500 hover:text-white transition-all"><Edit3 size={22} /></button>
            {isAdmin && <button onClick={() => onDelete(a.id)} className="p-3.5 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={22} /></button>}
          </div>
        </div>
      ))
    )}
  </div>
);

const ActivityForm: React.FC<{ onSave: (a: ActivityRecord) => void; initialData?: ActivityRecord; onCancel: () => void }> = ({ onSave, initialData, onCancel }) => {
  const [formData, setFormData] = useState<Partial<ActivityRecord>>(initialData || { 
    title: '', date: new Date().toISOString().split('T')[0], time: '', venue: '', category: 'Kurikulum', objective: [''], impact: '', photos: [], reporterName: '', reporterPosition: '' 
  });
  const [isUploading, setIsUploading] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setIsUploading(true);
      const newPhotos = [...(formData.photos || [])];
      for (const file of Array.from(e.target.files)) {
        if (newPhotos.length >= 4) break;
        const raw = await new Promise<string>(res => {
          const reader = new FileReader();
          reader.onloadend = () => res(reader.result as string);
          reader.readAsDataURL(file);
        });
        const compressed = await resizeImage(raw);
        newPhotos.push({ id: Date.now().toString(), url: compressed, caption: 'Foto' });
      }
      setFormData({...formData, photos: newPhotos});
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(formData as ActivityRecord); }} className="max-w-4xl mx-auto bg-white p-10 md:p-14 rounded-[3rem] border border-slate-200 shadow-xl space-y-10 relative">
      <div className="flex justify-between items-start">
        <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Daftar Laporan OPR</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <FormGroup label="Nama Program / Aktiviti"><input required className="w-full px-6 py-4 bg-slate-50 border rounded-2xl font-bold outline-none" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></FormGroup>
        <FormGroup label="Kategori"><select className="w-full px-6 py-4 bg-slate-50 border rounded-2xl font-bold outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})}>{['Kurikulum', 'Kokurikulum', 'HEM', 'Pentadbiran', 'Lain-lain'].map(c => <option key={c}>{c}</option>)}</select></FormGroup>
        <FormGroup label="Tarikh"><input type="date" className="w-full px-6 py-4 bg-slate-50 border rounded-2xl font-bold outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></FormGroup>
        <FormGroup label="Masa (cth: 8:00 AM)"><input className="w-full px-6 py-4 bg-slate-50 border rounded-2xl font-bold outline-none" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} /></FormGroup>
        <FormGroup label="Tempat"><input className="w-full px-6 py-4 bg-slate-50 border rounded-2xl font-bold outline-none" value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} /></FormGroup>
        <FormGroup label="Sasaran / Bil. Peserta"><input className="w-full px-6 py-4 bg-slate-50 border rounded-2xl font-bold outline-none" value={formData.participantsCount} onChange={e => setFormData({...formData, participantsCount: e.target.value})} /></FormGroup>
        <FormGroup label="Nama Pelapor (Huruf Besar)"><input required className="w-full px-6 py-4 bg-slate-50 border rounded-2xl font-black uppercase outline-none text-indigo-600" value={formData.reporterName} onChange={e => setFormData({...formData, reporterName: e.target.value.toUpperCase()})} /></FormGroup>
        <FormGroup label="Jawatan Pelapor"><input required className="w-full px-6 py-4 bg-slate-50 border rounded-2xl font-bold outline-none" value={formData.reporterPosition} onChange={e => setFormData({...formData, reporterPosition: e.target.value})} placeholder="cth: Guru Penyelaras ICT" /></FormGroup>
      </div>
      <FormGroup label="Objektif (Satu baris satu objektif)"><textarea className="w-full px-6 py-4 bg-slate-50 border rounded-2xl font-medium h-32 outline-none" value={formData.objective?.join('\n')} onChange={e => setFormData({...formData, objective: e.target.value.split('\n')})} /></FormGroup>
      <FormGroup label="Impak & Refleksi"><textarea className="w-full px-6 py-4 bg-slate-900 text-white rounded-2xl font-medium h-40 outline-none" value={formData.impact} onChange={e => setFormData({...formData, impact: e.target.value})} /></FormGroup>
      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Foto Evidens (Maks 4)</label>
        <div className="grid grid-cols-4 gap-4">
          {formData.photos?.map(p => (
            <div key={p.id} className="aspect-square bg-slate-50 rounded-2xl overflow-hidden relative shadow-sm border">
              <img src={p.url} className="w-full h-full object-cover" />
              <button type="button" onClick={() => setFormData({...formData, photos: formData.photos?.filter(ph => ph.id !== p.id)})} className="absolute top-1.5 right-1.5 p-1.5 bg-red-500 text-white rounded-xl"><X size={12} /></button>
            </div>
          ))}
          {(formData.photos?.length || 0) < 4 && (
            <label className="aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all">
              {isUploading ? <Loader2 className="animate-spin text-slate-300" /> : <Camera className="text-slate-300" size={32} />}
              <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          )}
        </div>
      </div>
      
      <div className="flex justify-end gap-4 pt-6">
        <button type="button" onClick={onCancel} className="p-5 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-all shadow-md flex items-center justify-center" title="Batal"><X size={28} /></button>
        <button type="submit" className="p-5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center" title="Simpan Laporan"><Save size={28} /></button>
      </div>
    </form>
  );
};

const FormGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">{label}</label>{children}</div>
);

const OPRDetail: React.FC<{ activity: ActivityRecord; allActivities: ActivityRecord[]; onBack: () => void; onEdit: () => void; }> = ({ activity, allActivities, onBack, onEdit }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (wrapperRef.current) {
        const availableWidth = wrapperRef.current.offsetWidth - 32; 
        const targetWidth = 210 * 3.7795275591; // 210mm in px @ 96dpi
        setScale(Math.min(1, availableWidth / targetWidth));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setIsDownloading(true);

    // CRITICAL: Temporarily reset transformation and scaling for high-fidelity capture
    const originalTransform = reportRef.current.style.transform;
    const originalMarginBottom = reportRef.current.style.marginBottom;
    
    reportRef.current.style.transform = 'scale(1)';
    reportRef.current.style.marginBottom = '0';

    const opt = { 
      margin: 0, 
      filename: `OPR_${activity.title.replace(/\s+/g, '_')}_${formatDateShort(activity.date).replace(/\//g, '-')}.pdf`, 
      image: { type: 'jpeg', quality: 1.0 }, 
      html2canvas: { 
        scale: 4, // High Resolution DPI 300 equivalent
        useCORS: true, 
        backgroundColor: '#ffffff',
        letterRendering: true,
        logging: false
      }, 
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true } 
    };

    try {
      if (typeof html2pdf !== 'undefined') {
        await html2pdf().from(reportRef.current).set(opt).save();
      } else {
        window.print();
      }
    } catch (err) { 
      console.error(err);
      window.print(); 
    } finally { 
      // RESTORE display scaling
      reportRef.current.style.transform = originalTransform;
      reportRef.current.style.marginBottom = originalMarginBottom;
      setIsDownloading(false); 
    }
  };

  const getReportNumber = () => {
    const year = new Date(activity.date).getFullYear();
    const sorted = [...allActivities]
      .filter(a => new Date(a.date).getFullYear() === year)
      .sort((a, b) => {
        const dateComparison = a.date.localeCompare(b.date);
        if (dateComparison !== 0) return dateComparison;
        return (a.createdAt || 0) - (b.createdAt || 0);
      });
    const index = sorted.findIndex(a => a.id === activity.id) + 1;
    return `${String(index).padStart(2, '0')}/${year}`;
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

  // Heuristic Font Scaling for Single Page Integrity
  const getTitleFontSize = (text: string) => {
    const len = text.length;
    if (len > 180) return '0.75rem';
    if (len > 120) return '0.875rem';
    if (len > 80) return '1.125rem';
    return '1.25rem';
  };

  const getObjectiveFontSize = (items: string[]) => {
    const totalChars = items.join('').length;
    const count = items.length;
    if (count > 15 || totalChars > 800) return '6.5px';
    if (count > 10 || totalChars > 500) return '8px';
    if (count > 6 || totalChars > 300) return '9.5px';
    return '11px';
  };

  const getImpactFontSize = (text: string) => {
    const len = text.length;
    if (len > 1200) return '7.5px';
    if (len > 800) return '8.5px';
    if (len > 500) return '10px';
    return '11.5px';
  };

  const a4HeightPx = 297 * 3.7795275591;
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-8 pb-20 max-w-full">
      <div className="no-print flex flex-wrap items-center justify-between gap-4">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 font-black hover:text-indigo-600 group transition-colors">
          <div className="p-2 bg-white rounded-xl border group-hover:bg-indigo-50 shadow-sm"><ChevronLeft size={20} /></div>
          KEMBALI
        </button>
        <div className="flex gap-4">
          <button onClick={onEdit} className="p-4 bg-white text-orange-600 border border-orange-200 rounded-2xl hover:bg-orange-50 transition-all shadow-sm flex items-center justify-center" title="Edit Laporan"><Edit3 size={22} /></button>
          <button disabled={isDownloading} onClick={handleDownloadPDF} className="p-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-lg flex items-center justify-center" title="Muat Turun PDF">
            {isDownloading ? <Loader2 className="animate-spin" size={22} /> : <Download size={22} />}
          </button>
          <button onClick={() => window.print()} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center" title="Cetak Laporan"><Printer size={22} /></button>
        </div>
      </div>

      <div ref={wrapperRef} className="pdf-wrapper" style={{ minHeight: `${a4HeightPx * scale}px` }}>
        <div 
          ref={reportRef} 
          className="pdf-container report-grid-pattern p-12 bg-white"
          style={{ transform: `scale(${scale})`, marginBottom: `-${(1 - scale) * a4HeightPx}px` }}
        >
          {/* Header Section */}
          <div className="relative mb-8 pb-6 border-b-2 border-slate-900/10 flex items-center gap-8 shrink-0">
            <img src={SCHOOL_LOGO_URL} alt="Logo" className="h-24 w-auto object-contain shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="bg-slate-900 text-white text-[7px] font-black px-2 py-0.5 rounded tracking-widest uppercase">DOKUMEN RASMI</span>
                <span className="text-[9px] font-black text-slate-400 tracking-[0.3em] uppercase">ONE PAGE REPORT</span>
              </div>
              <h1 className="text-4xl font-black text-slate-900 leading-none uppercase tracking-tighter mb-1">LAPORAN OPR</h1>
              <div className="flex flex-col gap-1">
                <p className="text-lg font-bold text-slate-800 uppercase flex items-center gap-2"><Verified size={16} className="text-indigo-600" /> SEKOLAH KEBANGSAAN LAKSIAN BANGGI</p>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest pl-6 leading-none">KOD SEKOLAH: XBA5003</p>
              </div>
            </div>
            <div className="text-right flex flex-col items-end gap-2 shrink-0">
              <div className={`px-5 py-2.5 ${getCategoryColor(activity.category)} text-white font-black rounded-2xl text-[10px] tracking-widest shadow-lg flex items-center gap-2`}>
                <Zap size={14} fill="white" /> {activity.category}
              </div>
              <div className="text-[9px] font-black text-slate-900 uppercase bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                NO: {getReportNumber()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-8 flex-1 overflow-hidden min-h-0">
            {/* Left Column */}
            <div className="col-span-6 border-r border-slate-100 pr-8 space-y-6 flex flex-col min-h-0">
              <section className="bg-indigo-50/80 p-5 rounded-[1.5rem] border border-indigo-100/50 shrink-0">
                <h2 className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getCategoryColor(activity.category)}`} /> TAJUK PROGRAM
                </h2>
                <p className="font-black text-slate-900 leading-[1.2] uppercase tracking-tight auto-font" style={{ fontSize: getTitleFontSize(activity.title) }}>{activity.title}</p>
              </section>

              <div className="flex flex-col gap-3 shrink-0">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0"><Calendar size={16} /></div>
                    <div className="min-w-0">
                      <span className="block text-[7px] font-black text-slate-400 tracking-widest uppercase">TARIKH</span>
                      <span className="text-[10px] font-bold text-slate-800 block truncate">{formatDateShort(activity.date)}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0"><Clock size={16} /></div>
                    <div className="min-w-0">
                      <span className="block text-[7px] font-black text-slate-400 tracking-widest uppercase">MASA</span>
                      <span className="text-[10px] font-bold text-slate-800 block truncate">{activity.time || '-'}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0"><Users size={16} /></div>
                  <div className="min-w-0">
                    <span className="block text-[7px] font-black text-slate-400 tracking-widest uppercase">SASARAN / PESERTA</span>
                    <span className="text-[10px] font-bold text-slate-800 block truncate">{activity.participantsCount || '-'}</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0"><MapPin size={16} /></div>
                  <div className="min-w-0">
                    <span className="block text-[7px] font-black text-slate-400 tracking-widest uppercase">TEMPAT</span>
                    <span className="text-[10px] font-bold text-slate-800 block truncate">{activity.venue || '-'}</span>
                  </div>
                </div>
              </div>

              <section className="flex-1 bg-indigo-50/30 p-5 rounded-[2rem] border border-indigo-100/50 relative overflow-hidden flex flex-col min-h-0">
                <h2 className="text-[9px] font-black text-indigo-600 tracking-widest uppercase mb-4 flex items-center gap-2 shrink-0">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" /> OBJEKTIF PROGRAM
                </h2>
                <div className="space-y-2 flex-1 overflow-hidden">
                  {(activity.objective || []).map((obj, i) => (
                    <div key={i} className="flex gap-3 text-slate-700 font-semibold leading-tight">
                      <span className="w-4 h-4 bg-white text-indigo-600 rounded flex items-center justify-center font-black border border-indigo-100 shrink-0 shadow-sm text-[8px]">{i+1}</span>
                      <p className="auto-font" style={{ fontSize: getObjectiveFontSize(activity.objective), paddingTop: '1px' }}>{obj}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-slate-900 text-white p-6 rounded-[2rem] border-l-[4px] border-indigo-500 relative overflow-hidden shadow-xl shrink-0">
                <Quote className="absolute top-4 right-4 text-white/5" size={48} />
                <h2 className="text-[9px] font-black text-indigo-400 tracking-widest uppercase mb-2">IMPAK & REFLEKSI</h2>
                <p className="font-bold italic leading-relaxed text-slate-100 font-sans auto-font" style={{ fontSize: getImpactFontSize(activity.impact) }}>"{activity.impact || 'Tiada refleksi yang dinyatakan.'}"</p>
              </section>

              <div className="mt-auto pt-6 flex items-center gap-4 shrink-0">
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm"><ShieldCheck size={28} /></div>
                <div>
                  <span className="text-[7px] font-black text-slate-400 tracking-widest block mb-0.5 uppercase">DISEDIAKAN OLEH,</span>
                  <p className="font-black text-base text-slate-900 uppercase leading-none tracking-tight">{activity.reporterName}</p>
                  <p className="text-[9px] text-slate-500 font-black uppercase mt-1 tracking-tighter">{activity.reporterPosition}</p>
                </div>
              </div>
            </div>

            {/* Right Column (Visual Evidence) */}
            <div className="col-span-6 flex flex-col h-full min-h-0 overflow-hidden">
              <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-slate-100 shrink-0">
                <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><div className="w-1 h-5 bg-slate-900 rounded-full" /> EVIDENS VISUAL PROGRAM</h2>
                <span className="text-[8px] font-black text-slate-400 tracking-tighter uppercase">LAMPIRAN AKTIVITI</span>
              </div>
              <div className="grid grid-rows-4 gap-3 flex-1 h-full min-h-0">
                {[0, 1, 2, 3].map(idx => (
                  <div key={idx} className="bg-slate-50 rounded-[1.5rem] overflow-hidden border border-slate-200 relative group flex-1 min-h-0 shadow-sm">
                    {activity.photos?.[idx] ? (
                      <img src={activity.photos[idx].url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-200 opacity-50">
                        <Camera size={32} strokeWidth={1} />
                        <span className="text-[8px] font-black mt-2 tracking-widest uppercase">FOTO {idx+1}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Section */}
          <div className="mt-8 pt-6 border-t-2 border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-slate-900 rounded-xl shadow-lg"><Award size={18} className="text-white" /></div>
              <div className="leading-tight">
                <p className="text-sm font-black text-slate-900 uppercase tracking-tighter leading-none">SK LAKSIAN BANGGI</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">TAHUN {currentYear}</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs font-black text-indigo-600 tracking-[0.4em] uppercase">#SKLaksianTERBAIK</p>
              <div className="h-0.5 bg-indigo-50 w-full mt-2 rounded-full overflow-hidden"><div className="h-full w-2/3 bg-indigo-600 rounded-full mx-auto" /></div>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 tracking-widest uppercase leading-none"><CheckCircle2 size={12} className="text-emerald-500" /> SISTEM OPR V2.5</div>
              <p className="text-[8px] text-slate-300 font-bold italic uppercase tracking-tighter">DIJANA: {new Date().toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;