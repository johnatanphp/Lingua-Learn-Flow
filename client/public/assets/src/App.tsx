import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import { 
  BookOpen, 
  Trophy, 
  Video, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  LogOut, 
  ChevronRight, 
  ChevronLeft,
  Star, 
  Zap,
  User as UserIcon,
  LayoutDashboard,
  GraduationCap,
  PlayCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Github,
  Mail,
  Chrome,
  Facebook,
  Apple,
  Users,
  Plus,
  Wand2,
  Trash2,
  Edit3,
  Search,
  MoreVertical,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ShieldCheck,
  Globe,
  Sun,
  Moon,
  Code2,
  Briefcase,
  Terminal,
  Cpu,
  Layers,
  Calendar,
  FileText,
  Lock,
  Mic,
  Volume2,
  Headphones,
  PenTool,
  Download,
  Sparkles,
  UserPlus,
  FilePlus,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Level, Lesson, UserProgress, Tutor, Plan, UserSettings } from './types';
import { geminiService } from './services/geminiService';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick, color = "currentColor" }: { icon: any, label: string, active?: boolean, onClick: () => void, color?: string }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${
      active 
        ? 'bg-brand-600 text-white shadow-[0_0_20px_rgba(124,58,237,0.4)]' 
        : 'text-slate-500 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-brand-600 dark:hover:text-white'
    }`}
  >
    <div className={`p-2 rounded-xl transition-colors ${active ? 'bg-white/20' : 'bg-slate-50 dark:bg-white/5 group-hover:bg-brand-50 dark:group-hover:bg-white/10'}`}>
      <Icon size={18} color={active ? 'white' : color} />
    </div>
    <span className="font-sans font-bold text-sm tracking-tight">{label}</span>
  </button>
);

const StatCard = ({ icon: Icon, label, value, color, neonBorder }: { icon: any, label: string, value: string | number, color: string, neonBorder?: string }) => (
  <div className={`glass p-6 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 ${neonBorder}`}>
    <div className="flex items-center gap-5">
      <div className={`w-14 h-14 rounded-2xl ${color} shadow-lg flex items-center justify-center text-white`}>
        <Icon size={28} />
      </div>
      <div>
        <p className="text-xs text-slate-500 dark:text-white/60 font-sans font-black uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-sans font-black text-slate-900 dark:text-white tracking-tighter">{value}</p>
      </div>
    </div>
  </div>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [levels, setLevels] = useState<Level[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [adminPayments, setAdminPayments] = useState<any[]>([]);
  const [profStudents, setProfStudents] = useState<any[]>([]);
  const [profClasses, setProfClasses] = useState<any[]>([]);
  const [devLogs, setDevLogs] = useState<any[]>([]);
  const [devStatus, setDevStatus] = useState<any>(null);
  const [devDbStats, setDevDbStats] = useState<any[]>([]);
  const [userSkills, setUserSkills] = useState<any>(null);
  const [userAchievements, setUserAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('fundacionstudy@gmail.com');
  const [loginPass, setLoginPass] = useState('Marzo2026.');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(true);
  const [selectedRoleForLogin, setSelectedRoleForLogin] = useState<User['role'] | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: '¡Hola! Soy tu tutor de IA. ¿Sobre qué te gustaría practicar hoy? Podemos hablar de viajes, comida, trabajo o cualquier tema que prefieras.' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [internalMessages, setInternalMessages] = useState<any[]>([]);
  const [chatTarget, setChatTarget] = useState<number | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [driveFiles, setDriveFiles] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      const socket = new WebSocket(`ws://${window.location.host}`);
      socket.onopen = () => {
        socket.send(JSON.stringify({ type: 'AUTH', userId: user.id }));
      };
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_MESSAGE') {
          setInternalMessages(prev => [...prev, data]);
        }
      };
      setWs(socket);
      fetchDriveFiles();
      return () => socket.close();
    }
  }, [user]);

  const fetchDriveFiles = async () => {
    try {
      const res = await fetch('/api/drive/files');
      setDriveFiles(await res.json());
    } catch (e) { console.error(e); }
  };

  const sendInternalMessage = () => {
    if (!ws || !chatInput.trim() || !chatTarget || !user) return;
    const msg = {
      type: 'CHAT_MESSAGE',
      senderId: user.id,
      receiverId: chatTarget,
      text: chatInput
    };
    ws.send(JSON.stringify(msg));
    setInternalMessages(prev => [...prev, { ...msg, timestamp: new Date().toISOString() }]);
    setChatInput('');
  };

  const handleWompiCheckout = async (plan: Plan) => {
    if (!user) return;
    try {
      const res = await fetch('/api/payments/wompi/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: plan.price, planId: plan.id, userId: user.id })
      });
      const { checkoutUrl } = await res.json();
      window.open(checkoutUrl, '_blank');
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    // PWA Install Prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    // Service Worker Registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('SW Registered', reg);
      });
    }
  }, []);

  const installPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim() || !user) return;
    
    const newMessage = { role: 'user' as const, text: userInput };
    setChatMessages(prev => [...prev, newMessage]);
    setUserInput('');
    setIsTyping(true);

    try {
      const evaluation = await geminiService.evaluateResponse(userInput, "Conversación general de práctica de idiomas");
      const aiResponse = { 
        role: 'ai' as const, 
        text: evaluation.suggestion || "¡Muy bien! Sigamos practicando. ¿Qué más me puedes contar?" 
      };
      setChatMessages(prev => [...prev, aiResponse]);
      
      // Award some XP for chatting
      await fetch(`/api/user/${user.id}/complete-lesson`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: 0, score: 100, xpGained: 5 })
      });
      setUser(prev => prev ? { ...prev, xp: prev.xp + 5 } : null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const completeLesson = async (lessonId: number) => {
    if (!user) return;
    const res = await fetch(`/api/user/${user.id}/complete-lesson`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId, score: 100, xpGained: 50 })
    });
    if (res.ok) {
      fetchProgress();
      setUser(prev => prev ? { ...prev, xp: prev.xp + 50 } : null);
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (user) {
      fetchLevels();
      fetchProgress();
      fetchUserStats();
      fetchTutors();
      fetchPlans();
      fetchSettings();
      if (user.role === 'admin') {
        fetchAdminData();
        setActiveTab('admin-dashboard');
      }
      if (user.role === 'professor') {
        fetchProfData();
        setActiveTab('prof-dashboard');
      }
      if (user.role === 'developer') {
        fetchDevData();
        setActiveTab('dev-dashboard');
      }
    }
  }, [user]);

  const fetchUserStats = async () => {
    if (!user) return;
    try {
      const [skillsRes, achRes] = await Promise.all([
        fetch(`/api/user/${user.id}/skills`),
        fetch(`/api/user/${user.id}/achievements`)
      ]);
      setUserSkills(await skillsRes.json());
      setUserAchievements(await achRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdminData = async () => {
    try {
      const [usersRes, statsRes, paymentsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/stats'),
        fetch('/api/admin/payments')
      ]);
      setAdminUsers(await usersRes.json());
      setAdminStats(await statsRes.json());
      setAdminPayments(await paymentsRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProfData = async () => {
    if (!user) return;
    try {
      const [studentsRes, classesRes] = await Promise.all([
        fetch('/api/professor/students'),
        fetch(`/api/professor/classes/${user.id}`)
      ]);
      setProfStudents(await studentsRes.json());
      setProfClasses(await classesRes.json());
    } catch (error) {
      console.error('Error fetching professor data:', error);
    }
  };

  const fetchDevData = async () => {
    try {
      const [logsRes, statusRes, dbRes] = await Promise.all([
        fetch('/api/dev/logs'),
        fetch('/api/dev/status'),
        fetch('/api/dev/db-stats')
      ]);
      setDevLogs(await logsRes.json());
      setDevStatus(await statusRes.json());
      setDevDbStats(await dbRes.json());
    } catch (error) {
      console.error('Error fetching dev data:', error);
    }
  };

  const fetchLevels = async () => {
    const res = await fetch('/api/levels');
    const data = await res.json();
    setLevels(data);
  };

  const fetchTutors = async () => {
    try {
      const res = await fetch('/api/tutors');
      const data = await res.json();
      setTutors(data);
    } catch (e) { console.error(e); }
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/plans');
      const data = await res.json();
      setPlans(data);
    } catch (e) { console.error(e); }
  };

  const fetchSettings = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/user/${user.id}/settings`);
      const data = await res.json();
      setSettings(data);
      setDarkMode(data.theme === 'dark');
    } catch (e) { console.error(e); }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user || !settings) return;
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    if (newSettings.theme) setDarkMode(newSettings.theme === 'dark');
    try {
      await fetch(`/api/user/${user.id}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (e) { console.error(e); }
  };

  const fetchProgress = async () => {
    if (!user) return;
    const res = await fetch(`/api/user/${user.id}/progress`);
    const data = await res.json();
    setProgress(data);
  };

  const fetchLessons = async (levelId: number) => {
    const res = await fetch(`/api/lessons/${levelId}`);
    const data = await res.json();
    setLessons(data);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass })
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        alert('Credenciales inválidas');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail, password: regPass, name: regName })
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        const data = await res.json();
        alert(data.error || 'Error al registrar');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (showRoleSelector && !user) {
    const roles = [
      { id: 'student', title: 'Estudiante', desc: 'Aprende idiomas con IA', icon: GraduationCap, color: 'bg-blue-500', email: 'student@example.com', pass: 'student123' },
      { id: 'professor', title: 'Profesor', desc: 'Gestiona clases y alumnos', icon: Briefcase, color: 'bg-emerald-500', email: 'professor@example.com', pass: 'prof123' },
      { id: 'admin', title: 'Administrador', desc: 'Control total de la plataforma', icon: ShieldCheck, color: 'bg-indigo-600', email: 'fundacionstudy@gmail.com', pass: 'Marzo2026.' },
      { id: 'developer', title: 'Desarrollador', desc: 'Acceso a API y logs', icon: Code2, color: 'bg-slate-800', email: 'dev@example.com', pass: 'dev123' },
    ];

    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-500 ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className="absolute top-8 right-8">
          <button onClick={() => setDarkMode(!darkMode)} className="p-3 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800">
            {darkMode ? <Sun className="text-amber-400" /> : <Moon className="text-slate-600" />}
          </button>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <div className="w-28 h-28 bg-gradient-to-tr from-brand-600 to-violet-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-brand-500/30 rotate-6 hover:rotate-0 transition-transform duration-500">
            <Sparkles size={56} className="text-white animate-pulse" />
          </div>
          <h1 className="text-6xl font-serif italic font-black tracking-tighter mb-3 bg-gradient-to-r from-brand-600 to-violet-600 bg-clip-text text-transparent">Speak Fluently</h1>
          <p className="text-slate-500 dark:text-slate-400 font-sans font-bold uppercase tracking-[0.2em] text-xs">Academia de Idiomas Inteligente</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl w-full">
          {roles.map((role, idx) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, type: 'spring', stiffness: 100 }}
              whileHover={{ y: -12, scale: 1.02 }}
              onClick={() => {
                setSelectedRoleForLogin(role.id as any);
                setLoginEmail(role.email);
                setLoginPass(role.pass);
                setShowRoleSelector(false);
              }}
              className="group cursor-pointer glass p-10 rounded-[3rem] shadow-2xl shadow-slate-200/50 dark:shadow-none hover:border-brand-500 dark:hover:border-brand-500 transition-all duration-500 relative overflow-hidden"
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand-500/5 rounded-full blur-2xl group-hover:bg-brand-500/10 transition-colors"></div>
              <div className={`w-16 h-16 ${role.color} rounded-[1.5rem] flex items-center justify-center text-white mb-8 shadow-xl shadow-current/30 group-hover:scale-110 transition-transform duration-500`}>
                <role.icon size={32} />
              </div>
              <h3 className="text-2xl font-sans font-black mb-3 tracking-tight">{role.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-serif italic">{role.desc}</p>
              <div className="mt-10 flex items-center text-brand-600 dark:text-brand-400 font-sans font-black text-xs uppercase tracking-widest group-hover:translate-x-3 transition-transform">
                Comenzar Sesión <ChevronRight size={16} className="ml-1" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="absolute top-8 right-8 flex gap-4">
          <button onClick={() => setShowRoleSelector(true)} className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold text-sm shadow-md border border-slate-100 dark:border-slate-800">
            Volver
          </button>
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-xl bg-white dark:bg-slate-900 shadow-md border border-slate-100 dark:border-slate-800">
            {darkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-slate-600" />}
          </button>
        </div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass w-full max-w-md p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden"
        >
          <div className="absolute -left-10 -top-10 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl"></div>
          <div className="text-center mb-12 relative z-10">
            <div className="w-24 h-24 bg-gradient-to-tr from-brand-600 to-violet-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-brand-500/30 rotate-6">
              <Sparkles size={48} className="text-white" />
            </div>
            <h1 className="text-4xl font-serif italic font-black text-slate-900 dark:text-white tracking-tighter">Speak Fluently</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-3 font-sans font-bold uppercase tracking-widest text-[10px]">
              {isRegistering ? 'Crea tu cuenta gratuita' : `Acceso ${selectedRoleForLogin || ''}`}
            </p>
          </div>

          {isRegistering ? (
            <form onSubmit={handleRegister} className="flex flex-col gap-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nombre Completo</label>
                <input 
                  type="text" 
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all font-sans font-bold text-sm"
                  placeholder="Juan Pérez"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all font-sans font-bold text-sm"
                  placeholder="tu@correo.com"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Contraseña</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={regPass}
                    onChange={(e) => setRegPass(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all font-sans font-bold text-sm"
                    placeholder="••••••••"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 text-white font-sans font-black py-4 rounded-2xl hover:bg-brand-700 transition-all shadow-xl shadow-brand-500/20 disabled:opacity-50 mt-4 uppercase tracking-widest text-xs"
              >
                {loading ? 'Registrando...' : 'Crear Cuenta'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all font-sans font-bold text-sm"
                  placeholder="tu@correo.com"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Contraseña</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all font-sans font-bold text-sm"
                    placeholder="••••••••"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 text-white font-sans font-black py-4 rounded-2xl hover:bg-brand-700 transition-all shadow-xl shadow-brand-500/20 disabled:opacity-50 mt-4 uppercase tracking-widest text-xs"
              >
                {loading ? 'Iniciando...' : 'Iniciar Sesión'}
              </button>
            </form>
          )}

          <div className="mt-10">
            <div className="relative flex items-center justify-center mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
              </div>
              <span className="relative px-4 bg-white dark:bg-slate-900 text-[10px] text-slate-400 uppercase font-black tracking-widest">O continúa con</span>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {[
                { icon: Chrome, color: 'text-slate-600', label: 'Google' },
                { icon: Facebook, color: 'text-blue-600', label: 'Facebook' },
                { icon: Mail, color: 'text-blue-500', label: 'Outlook' },
                { icon: Apple, color: 'text-slate-900 dark:text-white', label: 'Apple' }
              ].map((social, i) => (
                <button key={i} className="flex items-center justify-center p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:-translate-y-1" title={social.label}>
                  <social.icon size={20} className={social.color} />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 font-serif italic">
              {isRegistering ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'} {' '}
              <button 
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-brand-600 font-sans font-black hover:underline ml-1"
              >
                {isRegistering ? 'Inicia Sesión' : 'Regístrate'}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex transition-colors duration-500 ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Sidebar */}
      <aside className={`w-80 flex flex-col p-8 fixed h-full border-r transition-all duration-500 z-20 ${darkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-100 shadow-2xl shadow-slate-200/50'} backdrop-blur-xl`}>
        <div className="flex items-center justify-between px-2 py-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-tr from-brand-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Sparkles size={24} className="text-white" />
            </div>
            <div>
              <span className={`font-sans font-black text-xl tracking-tighter block leading-none ${darkMode ? 'text-white' : 'text-slate-900'}`}>Speak <span className="text-brand-600">Fluently</span></span>
              <span className="font-sans font-bold text-[8px] text-slate-400 uppercase tracking-[0.3em] mt-1 block">Academia IA • 🇨🇴</span>
            </div>
          </div>
          <button 
            onClick={() => updateSettings({ theme: darkMode ? 'light' : 'dark' })}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* User Profile Card */}
        <div className="glass p-4 rounded-[2rem] mb-8 border border-slate-200/50 dark:border-slate-700/50 relative group">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-brand-500/20">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-sm truncate">{user.name}</h3>
              <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
              <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-500 text-[8px] font-black uppercase tracking-wider">
                <Star size={8} fill="currentColor" />
                {user.role === 'student' ? 'Estudiante' : user.role}
              </div>
            </div>
            <button className="p-2 text-slate-300 hover:text-slate-600 dark:hover:text-white transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
          {user.role === 'student' && (
            <>
              <SidebarItem icon={MessageSquare} label="Conversación IA" active={activeTab === 'ai-tutor'} onClick={() => setActiveTab('ai-tutor')} color="#99ff00" />
              <SidebarItem icon={Mic} label="Pronunciación" active={activeTab === 'pronunciation'} onClick={() => setActiveTab('pronunciation')} color="#00ffff" />
              <SidebarItem icon={Video} label="Clases en Vivo" active={activeTab === 'live'} onClick={() => setActiveTab('live')} color="#ff0055" />
              
              <div className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Mi Cuenta</div>
              <SidebarItem icon={BarChart3} label="Mi Progreso" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} color="#9d00ff" />
              <SidebarItem icon={Trophy} label="Logros & XP" active={activeTab === 'progress'} onClick={() => setActiveTab('progress')} color="#ffd700" />
              <SidebarItem icon={FileText} label="Drive & Notas" active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} color="#00ffff" />
              <SidebarItem icon={Users} label="Tutores" active={activeTab === 'tutors'} onClick={() => setActiveTab('tutors')} color="#99ff00" />
              <SidebarItem icon={CreditCard} label="Planes & Pagos" active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} color="#ff0055" />
              <SidebarItem icon={MessageSquare} label="Chat Interno" active={activeTab === 'internal-chat'} onClick={() => setActiveTab('internal-chat')} color="#9d00ff" />
              <SidebarItem icon={Settings} label="Configuración" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} color="#ffd700" />
            </>
          )}
          
          {user.role === 'admin' && (
            <>
              <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Administración</div>
              <SidebarItem icon={LayoutDashboard} label="Panel General" active={activeTab === 'admin-dashboard'} onClick={() => setActiveTab('admin-dashboard')} color="#99ff00" />
              <SidebarItem icon={Users} label="Estudiantes" active={activeTab === 'admin-users'} onClick={() => setActiveTab('admin-users')} color="#00ffff" />
              <SidebarItem icon={Calendar} label="Sesiones" active={activeTab === 'admin-sessions'} onClick={() => setActiveTab('admin-sessions')} color="#ff0055" />
              <SidebarItem icon={BookOpen} label="Academia" active={activeTab === 'admin-courses'} onClick={() => setActiveTab('admin-courses')} color="#9d00ff" />
              <SidebarItem icon={Wallet} label="Pagos Wompi" active={activeTab === 'admin-payments'} onClick={() => setActiveTab('admin-payments')} color="#ffd700" />
              <SidebarItem icon={Wand2} label="Generador IA" active={activeTab === 'admin-ai'} onClick={() => setActiveTab('admin-ai')} color="#99ff00" />
              <SidebarItem icon={MessageSquare} label="Soporte Chat" active={activeTab === 'internal-chat'} onClick={() => setActiveTab('internal-chat')} color="#ff0055" />
            </>
          )}
          
          {user.role === 'professor' && (
            <>
              <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Profesorado</div>
              <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'prof-dashboard'} onClick={() => setActiveTab('prof-dashboard')} />
              <SidebarItem icon={Users} label="Mis Alumnos" active={activeTab === 'prof-students'} onClick={() => setActiveTab('prof-students')} />
              <SidebarItem icon={Calendar} label="Mi Agenda" active={activeTab === 'prof-calendar'} onClick={() => setActiveTab('prof-calendar')} />
              <SidebarItem icon={FileText} label="Exámenes" active={activeTab === 'prof-exams'} onClick={() => setActiveTab('prof-exams')} />
            </>
          )}
        </nav>

        <div className="mt-auto pt-8 space-y-3">
          <div className="flex items-center justify-between px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <span>Idiomas 🇨🇴</span>
            <button onClick={() => setUser(null)} className="flex items-center gap-1 hover:text-red-500 transition-colors">
              <LogOut size={12} />
              Salir
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-80 p-10">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h2 className={`text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {user.role === 'admin' ? 'Centro de Control' : 
               user.role === 'professor' ? 'Panel de Docente' :
               user.role === 'developer' ? 'Entorno de Desarrollo' :
               `Hola, ${user.name.split(' ')[0]} 👋`}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
              {user.role === 'admin' ? 'Gestiona tu academia Speak Fluently' : 
               user.role === 'professor' ? 'Gestiona tus clases y estudiantes' :
               user.role === 'developer' ? 'Monitorización y herramientas técnicas' :
               '¡Es un gran día para aprender algo nuevo!'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`p-3 rounded-2xl transition-all ${darkMode ? 'bg-slate-800 text-amber-400 hover:bg-slate-700' : 'bg-white text-slate-500 hover:bg-slate-100 shadow-sm border border-slate-100'}`}
              title={darkMode ? 'Modo Claro' : 'Modo Oscuro'}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {user.role === 'student' && (
              <>
                <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-full font-bold border border-amber-100 dark:border-amber-500/20">
                  <Zap size={18} className="fill-amber-500" />
                  <span>{user.streak} días</span>
                </div>
                <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-4 py-2 rounded-full font-bold border border-indigo-100 dark:border-indigo-500/20">
                  <Star size={18} className="fill-indigo-500" />
                  <span>{user.xp} XP</span>
                </div>
              </>
            )}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-2 shadow-sm ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-200 border-white'}`}>
              <UserIcon size={20} className="text-slate-500" />
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {/* Professor Dashboard */}
          {activeTab === 'prof-dashboard' && user.role === 'professor' && (
            <motion.div key="prof-dash" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={Users} label="Total Alumnos" value={profStudents.length} color="bg-brand-600" />
                <StatCard icon={Calendar} label="Clases Programadas" value={profClasses.length} color="bg-emerald-600" />
                <StatCard icon={FileText} label="Evaluaciones Activas" value="4" color="bg-amber-600" />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass p-10 rounded-[3.5rem] shadow-2xl shadow-slate-200/50">
                  <div className="flex items-center justify-between mb-10">
                    <div>
                      <h3 className="text-2xl font-sans font-black tracking-tight">Próximas Clases</h3>
                      <p className="text-xs text-slate-500 font-serif italic mt-1">Tu agenda para los próximos días</p>
                    </div>
                    <button onClick={() => setActiveTab('prof-calendar')} className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl text-brand-600 hover:scale-110 transition-transform">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                  <div className="space-y-4">
                    {profClasses.length > 0 ? profClasses.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-6 rounded-[2rem] bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 group hover:border-brand-500/30 transition-all">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Video size={28} />
                          </div>
                          <div>
                            <p className="font-sans font-black text-slate-900 dark:text-white">{c.title}</p>
                            <p className="text-[10px] text-slate-500 font-serif italic">{new Date(c.scheduled_at).toLocaleString()} • {c.duration_minutes} min</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-5 py-2.5 rounded-xl font-sans font-black text-[10px] uppercase tracking-widest border border-slate-100">Editar</button>
                          <button className="bg-brand-600 text-white px-6 py-2.5 rounded-xl font-sans font-black text-[10px] uppercase tracking-widest shadow-xl shadow-brand-500/20">Iniciar</button>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-16 text-slate-400 font-serif italic">No hay clases programadas para hoy.</div>
                    )}
                  </div>
                </div>

                <div className="glass p-10 rounded-[3.5rem] shadow-2xl shadow-slate-200/50 relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-brand-500/5 rounded-full blur-3xl"></div>
                  <h3 className="text-xl font-sans font-black mb-8">Acciones Rápidas</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { icon: UserPlus, label: 'Nuevo Alumno', color: 'bg-blue-500' },
                      { icon: FilePlus, label: 'Crear Examen', color: 'bg-amber-500' },
                      { icon: MessageSquare, label: 'Mensaje Grupal', color: 'bg-emerald-500' },
                      { icon: Settings, label: 'Configuración', color: 'bg-slate-500' }
                    ].map((action, i) => (
                      <button key={i} className="flex items-center gap-4 p-5 rounded-[1.5rem] bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all group">
                        <div className={`w-12 h-12 ${action.color} text-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                          <action.icon size={24} />
                        </div>
                        <span className="font-sans font-black text-xs uppercase tracking-widest text-slate-700 dark:text-slate-300">{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'prof-students' && user.role === 'professor' && (
            <motion.div key="prof-students" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black">Mis Estudiantes</h3>
                <button className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-500/20">
                  Añadir Estudiante
                </button>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                    <tr className="text-slate-400 text-xs uppercase tracking-widest">
                      <th className="px-8 py-6 font-black">Nombre</th>
                      <th className="px-8 py-6 font-black">Progreso</th>
                      <th className="px-8 py-6 font-black">XP Total</th>
                      <th className="px-8 py-6 font-black">Racha</th>
                      <th className="px-8 py-6 font-black text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {profStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold">
                              {s.name[0]}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{s.name}</p>
                              <p className="text-xs text-slate-500">{s.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="w-32 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full" style={{ width: '65%' }}></div>
                          </div>
                        </td>
                        <td className="px-8 py-6 font-bold text-indigo-600">{s.xp} XP</td>
                        <td className="px-8 py-6">
                          <span className="flex items-center gap-1 text-amber-600 font-bold">
                            <Zap size={14} className="fill-amber-600" />
                            {s.streak}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button className="text-indigo-600 font-bold text-sm hover:underline">Ver Perfil</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'prof-calendar' && user.role === 'professor' && (
            <motion.div key="prof-calendar" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black">Agenda de Clases</h3>
                <div className="flex gap-2">
                  <button className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <ChevronLeft size={20} />
                  </button>
                  <button className="px-6 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm font-bold">
                    Marzo 2026
                  </button>
                  <button className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-4">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                  <div key={day} className="text-center text-xs font-black text-slate-400 uppercase tracking-widest py-2">
                    {day}
                  </div>
                ))}
                {Array.from({ length: 31 }).map((_, i) => (
                  <div key={i} className={`aspect-square p-4 rounded-3xl border transition-all ${i + 1 === 6 ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-500/50'}`}>
                    <span className="font-bold text-sm">{i + 1}</span>
                    {i + 1 === 6 && (
                      <div className="mt-2 space-y-1">
                        <div className="w-full h-1 bg-white/30 rounded-full"></div>
                        <div className="w-full h-1 bg-white/30 rounded-full"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'prof-exams' && user.role === 'professor' && (
            <motion.div key="prof-exams" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black">Evaluaciones y Exámenes</h3>
                <button className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-500/20">
                  Crear Examen
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-lg">Nivel B1</span>
                      <span className="text-xs text-slate-400">Creado hace 2 días</span>
                    </div>
                    <h4 className="font-bold text-lg mb-2">Examen de Gramática: Tiempos Pasados</h4>
                    <p className="text-sm text-slate-500 mb-6">Evaluación de 20 preguntas sobre el uso de Past Simple y Past Continuous.</p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map(j => (
                          <div key={j} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                            U{j}
                          </div>
                        ))}
                        <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                          +15
                        </div>
                      </div>
                      <button className="text-indigo-600 font-bold text-sm hover:underline">Ver Resultados</button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Developer Dashboard */}
          {activeTab === 'dev-dashboard' && user.role === 'developer' && (
            <motion.div key="dev-dash" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={Terminal} label="Uptime API" value={devStatus ? `${Math.floor(devStatus.uptime / 3600)}h ${Math.floor((devStatus.uptime % 3600) / 60)}m` : '...'} color="bg-slate-800" />
                <StatCard icon={Cpu} label="Estado Gemini" value={devStatus?.gemini || '...'} color="bg-indigo-600" />
                <StatCard icon={Layers} label="Tablas DB" value={devDbStats.length} color="bg-emerald-600" />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl font-mono text-xs text-emerald-400 overflow-hidden">
                  <div className="flex items-center justify-between mb-6 text-slate-400 font-sans">
                    <h3 className="text-sm font-bold">Logs del Sistema</h3>
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span>LIVE</span>
                    </div>
                  </div>
                  <div className="space-y-2 h-64 overflow-y-auto custom-scrollbar">
                    {devLogs.map((log) => (
                      <p key={log.id}>
                        <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                        <span className={log.level === 'WARN' ? 'text-amber-400' : log.level === 'ERROR' ? 'text-rose-400' : 'text-emerald-400'}>
                          {log.level}:
                        </span>{' '}
                        {log.message} <span className="text-slate-600">({log.details})</span>
                      </p>
                    ))}
                    <p className="animate-pulse">_</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                  <h3 className="text-xl font-black mb-6">Estadísticas de Base de Datos</h3>
                  <div className="space-y-4">
                    {devDbStats.map((stat) => (
                      <div key={stat.table} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                            <Layers size={20} />
                          </div>
                          <span className="font-bold capitalize">{stat.table}</span>
                        </div>
                        <span className="font-black text-indigo-600">{stat.count} filas</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'dev-api' && user.role === 'developer' && (
            <motion.div key="dev-api" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <h3 className="text-2xl font-black">Monitorización de APIs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                      <Globe size={28} />
                    </div>
                    <div>
                      <h4 className="text-lg font-black">Google Gemini AI</h4>
                      <p className="text-sm text-emerald-500 font-bold">Servicio Operativo</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Modelo</span>
                      <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">gemini-3-flash-preview</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Latencia Media</span>
                      <span className="font-bold">420ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Tokens/min</span>
                      <span className="font-bold">12.4k</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                      <Wallet size={28} />
                    </div>
                    <div>
                      <h4 className="text-lg font-black">Wompi Gateway</h4>
                      <p className="text-sm text-amber-500 font-bold">Modo Sandbox</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Estado Webhook</span>
                      <span className="text-emerald-500 font-bold">Conectado</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Tasa de Éxito</span>
                      <span className="font-bold">98.2%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Última Transacción</span>
                      <span className="font-bold">Hace 5 min</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Admin Dashboard */}
          {activeTab === 'admin-dashboard' && user.role === 'admin' && (
            <motion.div 
              key="admin-dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard icon={Users} label="Estudiantes" value={adminStats?.users || 0} color="bg-brand-600" />
                <StatCard icon={BookOpen} label="Lecciones" value={adminStats?.lessons || 0} color="bg-violet-600" />
                <StatCard icon={Wallet} label="Ingresos (COP)" value={`$${(adminStats?.revenue || 0).toLocaleString()}`} color="bg-emerald-600" />
                <StatCard icon={Zap} label="Actividad" value="94%" color="bg-amber-600" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass p-10 rounded-[3.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden">
                  <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl"></div>
                  <div className="flex items-center justify-between mb-10 relative z-10">
                    <div>
                      <h3 className="text-2xl font-sans font-black text-slate-900 dark:text-white tracking-tight">Ingresos Recientes</h3>
                      <p className="text-xs text-slate-500 font-serif italic mt-1">Transacciones procesadas vía Wompi</p>
                    </div>
                    <button onClick={() => setActiveTab('admin-payments')} className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl text-brand-600 hover:scale-110 transition-transform">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                  <div className="space-y-4 relative z-10">
                    {adminPayments.slice(0, 4).map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-6 rounded-[2rem] bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-brand-500/30 transition-all group">
                        <div className="flex items-center gap-5">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${p.status === 'APPROVED' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'}`}>
                            <CreditCard size={24} />
                          </div>
                          <div>
                            <p className="font-sans font-black text-slate-900 dark:text-white">{p.user}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-serif italic">{p.date} • {p.method}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-sans font-black text-slate-900 dark:text-white text-lg">${p.amount.toLocaleString()}</p>
                          <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${p.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>{p.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 to-violet-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center mb-8 backdrop-blur-xl border border-white/10 rotate-3 group-hover:rotate-0 transition-transform">
                      <ShieldCheck size={32} className="text-brand-400" />
                    </div>
                    <h3 className="text-3xl font-serif italic font-black mb-3">Estado Wompi</h3>
                    <p className="text-slate-400 text-sm mb-10 leading-relaxed font-serif italic">Pasarela de pagos sincronizada y operando en tiempo real.</p>
                    
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">API Key</span>
                        <span className="text-[10px] font-mono text-brand-400">pub_test_...</span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Entorno</span>
                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Sandbox</span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Webhook</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Activo</span>
                        </div>
                      </div>
                    </div>

                    <button className="w-full mt-12 bg-brand-600 text-white font-sans font-black py-5 rounded-2xl hover:bg-brand-700 transition-all shadow-2xl shadow-brand-500/40 uppercase tracking-widest text-xs">
                      Configurar Pasarela
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Admin Sessions */}
          {activeTab === 'admin-sessions' && user.role === 'admin' && (
            <motion.div key="admin-sessions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-4xl font-black text-uva-neon">Gestión de Sesiones</h3>
                  <p className="text-slate-500 font-cursive mt-1">Sincronización de clases y tutorías en vivo</p>
                </div>
                <button className="btn-neon-uva px-8 py-4">
                  Programar Sesión
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass p-10 rounded-[3.5rem] border-uva-neon">
                  <h4 className="text-xl font-black mb-8 flex items-center gap-3 text-uva-neon">
                    <Video size={24} />
                    Sesiones Activas
                  </h4>
                  <div className="space-y-4">
                    {[1, 2].map(i => (
                      <div key={i} className="p-6 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-uva-neon/10 text-uva-neon rounded-2xl flex items-center justify-center animate-pulse">
                            <Video size={24} />
                          </div>
                          <div>
                            <p className="font-black text-slate-300">Inglés Avanzado - C1</p>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Prof. Carlos Ruiz • 12 Estudiantes</p>
                          </div>
                        </div>
                        <button className="glass border-white/10 text-uva-neon px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest">Monitorear</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass p-10 rounded-[3.5rem] border-kiwi-neon">
                  <h4 className="text-xl font-black mb-8 flex items-center gap-3 text-kiwi-neon">
                    <Clock size={24} />
                    Próximas 24 Horas
                  </h4>
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="p-6 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-between group hover:border-kiwi-neon/30 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white/5 text-slate-500 rounded-2xl flex items-center justify-center group-hover:bg-kiwi-neon/10 group-hover:text-kiwi-neon transition-colors">
                            <Clock size={24} />
                          </div>
                          <div>
                            <p className="font-black text-slate-300">Taller de Pronunciación</p>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Mañana, 10:00 AM • Prof. Elena M.</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black text-kiwi-neon uppercase tracking-widest bg-kiwi-neon/10 px-3 py-1 rounded-full">Pendiente</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'admin-payments' && user.role === 'admin' && (
            <motion.div key="admin-payments" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-gold-neon">Transacciones Wompi</h3>
                <div className="flex gap-3">
                  <button className="glass border-white/10 text-slate-400 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2">
                    <Clock size={18} /> Historial
                  </button>
                  <button className="btn-neon-gold px-5 py-2.5">
                    Exportar CSV
                  </button>
                </div>
              </div>

              <div className="glass rounded-[2.5rem] border-gold-neon overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-white/5">
                    <tr className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                      <th className="px-8 py-6">Referencia</th>
                      <th className="px-8 py-6">Estudiante</th>
                      <th className="px-8 py-6">Monto</th>
                      <th className="px-8 py-6">Método</th>
                      <th className="px-8 py-6">Estado</th>
                      <th className="px-8 py-6 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {adminPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-8 py-6 font-mono text-xs text-gold-neon">{p.id}</td>
                        <td className="px-8 py-6">
                          <p className="font-black text-slate-300 text-sm">{p.user}</p>
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{p.date}</p>
                        </td>
                        <td className="px-8 py-6 font-black text-gold-neon">${p.amount.toLocaleString()}</td>
                        <td className="px-8 py-6">
                          <span className="text-[10px] font-black text-slate-400 bg-white/5 px-2 py-1 rounded-lg uppercase tracking-widest border border-white/10">
                            {p.method}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${
                            p.status === 'APPROVED' ? 'bg-kiwi-neon/10 text-kiwi-neon' : 
                            p.status === 'PENDING' ? 'bg-gold-neon/10 text-gold-neon' : 'bg-vino-neon/10 text-vino-neon'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button className="p-2 text-slate-500 hover:text-gold-neon transition-colors">
                            <ArrowUpRight size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'admin-users' && user.role === 'admin' && (
            <motion.div key="admin-users" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-cyan-neon">Gestión de Usuarios</h3>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Buscar usuario..." className="pl-10 pr-4 py-2 rounded-xl glass border-white/10 outline-none focus:border-cyan-neon text-sm" />
                  </div>
                  <button className="btn-neon-kiwi px-4 py-2 flex items-center gap-2">
                    <Plus size={18} /> Nuevo Usuario
                  </button>
                </div>
              </div>

              <div className="glass rounded-3xl border-white/10 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-white/5">
                    <tr className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                      <th className="px-6 py-4 font-black">ID</th>
                      <th className="px-6 py-4 font-black">Usuario</th>
                      <th className="px-6 py-4 font-black">Rol</th>
                      <th className="px-6 py-4 font-black">XP</th>
                      <th className="px-6 py-4 font-black">Racha</th>
                      <th className="px-6 py-4 font-black text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {adminUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono text-cyan-neon">#{u.id}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-cyan-neon/10 rounded-full flex items-center justify-center text-cyan-neon font-black text-xs">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-black text-sm">{u.name}</p>
                              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${u.role === 'admin' ? 'bg-uva-neon/10 text-uva-neon' : 'bg-cyan-neon/10 text-cyan-neon'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-black text-gold-neon">{u.xp}</td>
                        <td className="px-6 py-4 text-sm font-black text-kiwi-neon">{u.streak}d</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button className="p-2 text-slate-500 hover:text-cyan-neon transition-colors">
                              <Edit3 size={16} />
                            </button>
                            <button className="p-2 text-slate-500 hover:text-vino-neon transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'admin-courses' && user.role === 'admin' && (
            <motion.div 
              key="admin-courses"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Gestión de Contenido</h3>
                <button className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100">
                  <Plus size={20} />
                  Crear Nuevo Nivel
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {levels.map((level) => (
                  <div key={level.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                          <GraduationCap size={24} />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-slate-900">{level.name}</h4>
                          <p className="text-sm text-slate-500">{level.description}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                          <Edit3 size={20} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50/50 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="text-sm font-bold text-slate-700">Lecciones en este nivel</h5>
                        <button className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
                          <Plus size={14} /> Añadir Lección
                        </button>
                      </div>
                      <div className="space-y-2">
                        {/* Placeholder for lessons in this level */}
                        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 text-sm">
                          <span className="font-medium text-slate-700">1. Introducción y Saludos</span>
                          <div className="flex gap-2">
                            <Edit3 size={14} className="text-slate-300 cursor-pointer hover:text-indigo-600" />
                            <Trash2 size={14} className="text-slate-300 cursor-pointer hover:text-rose-600" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 text-sm">
                          <span className="font-medium text-slate-700">2. Los Números del 1 al 100</span>
                          <div className="flex gap-2">
                            <Edit3 size={14} className="text-slate-300 cursor-pointer hover:text-indigo-600" />
                            <Trash2 size={14} className="text-slate-300 cursor-pointer hover:text-rose-600" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'admin-ai' && user.role === 'admin' && (
            <motion.div 
              key="admin-ai"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-10 rounded-3xl text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10 max-w-2xl">
                  <h3 className="text-3xl font-bold mb-4">Generador de Contenido IA</h3>
                  <p className="text-indigo-100 mb-8 text-lg">
                    Crea lecciones completas, ejercicios y actividades en segundos utilizando el poder de Gemini AI.
                  </p>
                  
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-indigo-200 uppercase tracking-wider mb-2">Nivel</label>
                      <select className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 outline-none focus:bg-white/20 transition-all text-white">
                        <option value="A1">A1 Beginner</option>
                        <option value="A2">A2 Elementary</option>
                        <option value="B1">B1 Intermediate</option>
                      </select>
                    </div>
                    <div className="flex-[2]">
                      <label className="block text-xs font-bold text-indigo-200 uppercase tracking-wider mb-2">Tema o Tópico</label>
                      <input 
                        type="text" 
                        placeholder="Ej: Viajes al espacio, Entrevista de trabajo..."
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 outline-none focus:bg-white/20 transition-all text-white placeholder:text-white/40"
                      />
                    </div>
                    <div className="flex items-end">
                      <button className="bg-white text-indigo-600 font-bold px-8 py-3 rounded-xl hover:bg-indigo-50 transition-colors flex items-center gap-2">
                        <Wand2 size={20} />
                        Generar
                      </button>
                    </div>
                  </div>
                </div>
                <Wand2 size={200} className="absolute -right-10 -bottom-10 text-white/5 -rotate-12" />
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h4 className="font-bold text-slate-900 mb-6">Historial de Generaciones</h4>
                <div className="text-center py-12">
                  <Wand2 size={48} className="text-slate-100 mx-auto mb-4" />
                  <p className="text-slate-400">Aún no has generado contenido con IA.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Student Dashboard */}
          {activeTab === 'dashboard' && user.role === 'student' && (
            <motion.div key="student-dash" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={Star} label="XP Total" value={user.xp} color="bg-uva-neon" neonBorder="border-uva-neon" />
                <StatCard icon={Zap} label="Racha Actual" value={`${user.streak} días`} color="bg-kiwi-neon" neonBorder="border-kiwi-neon" />
                <StatCard icon={BookOpen} label="Lecciones" value={progress.length} color="bg-vino-neon" neonBorder="border-vino-neon" />
              </div>

              <div className="glass-card p-10 relative overflow-hidden border-cyan-neon">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-cyan-neon/10 rounded-full blur-3xl"></div>
                <h3 className="text-xl font-black mb-8 relative z-10 text-cyan-neon">Ruta de Aprendizaje</h3>
                <div className="flex items-center justify-between relative z-10 mb-12">
                  {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl, i) => (
                    <div key={lvl} className="flex flex-col items-center gap-3 relative">
                      {i > 0 && <div className={`absolute right-full top-6 w-full h-1 -translate-y-1/2 -mr-6 ${i <= 1 ? 'bg-cyan-neon' : 'bg-slate-100 dark:bg-white/10'}`}></div>}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm transition-all shadow-lg ${i === 0 ? 'bg-cyan-neon text-black shadow-[0_0_15px_rgba(0,255,255,0.6)] ring-4 ring-cyan-neon/20' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                        {lvl}
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${i === 0 ? 'text-cyan-neon' : 'text-slate-400'}`}>
                        {i === 0 ? 'Principiante' : i === 1 ? 'Elemental' : i === 2 ? 'Intermedio' : 'Maestría'}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="bg-slate-50 dark:bg-white/5 p-8 rounded-3xl relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-black text-lg">Nivel A1 — Principiante</h4>
                    <span className="text-sm font-bold text-slate-400">0 / 500 XP</span>
                  </div>
                  <div className="w-full h-4 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-neon rounded-full" style={{ width: '15%' }}></div>
                  </div>
                  <p className="text-xs text-slate-400 mt-4 text-center font-bold">500 XP para nivel A2</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Internal Chat View */}
          {activeTab === 'internal-chat' && (
            <motion.div key="internal-chat" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="h-[calc(100vh-220px)] flex gap-6">
              <div className="w-80 glass rounded-[3rem] p-6 flex flex-col border-uva-neon">
                <h3 className="text-xl font-black mb-6 text-uva-neon">Contactos</h3>
                <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
                  {adminUsers.filter(u => u.id !== user.id).map(contact => (
                    <button 
                      key={contact.id} 
                      onClick={() => setChatTarget(contact.id)}
                      className={`w-full p-4 rounded-2xl flex items-center gap-3 transition-all ${chatTarget === contact.id ? 'bg-uva-neon text-black shadow-lg' : 'hover:bg-white/5 text-slate-400'}`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-black">
                        {contact.name.charAt(0)}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black truncate">{contact.name}</p>
                        <p className="text-[10px] uppercase tracking-widest opacity-60">{contact.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 glass rounded-[3.5rem] flex flex-col border-cyan-neon overflow-hidden">
                {chatTarget ? (
                  <>
                    <div className="p-8 border-b border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-cyan-neon rounded-2xl flex items-center justify-center text-black font-black">
                          {adminUsers.find(u => u.id === chatTarget)?.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-black text-xl text-cyan-neon">{adminUsers.find(u => u.id === chatTarget)?.name}</h3>
                          <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">En línea</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 p-8 overflow-y-auto space-y-4 custom-scrollbar">
                      {internalMessages.filter(m => (m.senderId === user.id && m.receiverId === chatTarget) || (m.senderId === chatTarget && m.receiverId === user.id)).map((msg, i) => (
                        <div key={i} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] p-4 rounded-2xl ${msg.senderId === user.id ? 'bg-cyan-neon text-black rounded-tr-none' : 'bg-white/5 text-white rounded-tl-none border border-white/10'}`}>
                            <p className="text-sm font-bold">{msg.text}</p>
                            <p className="text-[8px] mt-1 opacity-60">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-8 border-t border-white/10 flex gap-4">
                      <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendInternalMessage()}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 outline-none focus:border-cyan-neon transition-all text-white"
                      />
                      <button onClick={sendInternalMessage} className="btn-neon-kiwi p-4">
                        <Send size={24} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                    <MessageSquare size={64} className="mb-4 opacity-20" />
                    <p className="font-black uppercase tracking-widest">Selecciona un contacto para chatear</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Drive & Notes View */}
          {activeTab === 'notes' && (
            <motion.div key="notes" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
              <div className="flex items-center justify-between">
                <h2 className="text-4xl font-black text-cyan-neon">Drive & Recursos</h2>
                <button className="btn-neon-kiwi flex items-center gap-2">
                  <Plus size={20} /> Subir Archivo
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {driveFiles.map(file => (
                  <div key={file.id} className="glass-card p-6 border-gold-neon group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-gold-neon/10 text-gold-neon rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText size={24} />
                      </div>
                      <button className="text-slate-500 hover:text-white transition-colors">
                        <MoreVertical size={20} />
                      </button>
                    </div>
                    <h4 className="font-black text-lg mb-1 truncate">{file.name}</h4>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-6">{file.type} • {file.size}</p>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 rounded-xl bg-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Ver</button>
                      <button className="flex-1 py-2 rounded-xl bg-gold-neon text-black text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all">Descargar</button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Admin Payments View */}
          {activeTab === 'admin-payments' && (
            <motion.div key="admin-payments" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard icon={Wallet} label="Ingresos Totales" value={`$ ${(adminStats?.revenue || 0).toLocaleString()}`} color="bg-kiwi-neon" neonBorder="border-kiwi-neon" />
                <StatCard icon={CreditCard} label="Transacciones Hoy" value="24" color="bg-cyan-neon" neonBorder="border-cyan-neon" />
                <StatCard icon={ShieldCheck} label="Tasa Aprobación" value="98.5%" color="bg-uva-neon" neonBorder="border-uva-neon" />
                <StatCard icon={ArrowUpRight} label="Crecimiento" value="+12%" color="bg-vino-neon" neonBorder="border-vino-neon" />
              </div>

              <div className="glass-card p-10 border-gold-neon">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-2xl font-black text-gold-neon">Transacciones Wompi Recientes</h3>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 rounded-xl bg-white/5 text-xs font-black uppercase tracking-widest border border-white/10">Exportar CSV</button>
                    <button className="px-4 py-2 rounded-xl bg-gold-neon text-black text-xs font-black uppercase tracking-widest">Sincronizar</button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/10">
                        <th className="pb-4">ID Transacción</th>
                        <th className="pb-4">Usuario</th>
                        <th className="pb-4">Monto</th>
                        <th className="pb-4">Estado</th>
                        <th className="pb-4">Fecha</th>
                        <th className="pb-4">Método</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {adminPayments.map(p => (
                        <tr key={p.id} className="group hover:bg-white/5 transition-colors">
                          <td className="py-6 font-mono text-xs text-cyan-neon">{p.id}</td>
                          <td className="py-6 font-black text-sm">{p.user}</td>
                          <td className="py-6 font-black text-sm">$ {p.amount.toLocaleString()}</td>
                          <td className="py-6">
                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                              p.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' : 
                              p.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-6 text-xs text-slate-400">{p.date}</td>
                          <td className="py-6 text-xs font-black text-gold-neon">{p.method}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'pronunciation' && (
            <motion.div key="pronunciation" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto space-y-8">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-black mb-2">Pronunciación</h2>
                <p className="text-slate-500 font-cursive text-lg">Habla en voz alta y recibe análisis fonético instantáneo con IA</p>
              </div>

              <div className="glass-card p-12 text-center relative overflow-hidden">
                <div className="absolute right-6 top-6">
                  <button className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-brand-600">
                    <Sparkles size={20} />
                  </button>
                </div>
                <span className="text-[10px] font-black text-brand-500 uppercase tracking-[0.3em] mb-6 block">Frase a pronunciar</span>
                <h3 className="text-5xl font-black mb-12 tracking-tight text-brand-600">I am from Colombia.</h3>
                <p className="text-sm text-slate-400 mb-12 font-bold">Nivel A1 • Inglés</p>
                
                <div className="flex flex-col items-center gap-6">
                  <button className="w-24 h-24 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-2xl shadow-brand-500/40 hover:scale-110 transition-transform active:scale-95">
                    <Mic size={40} />
                  </button>
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Presiona para hablar</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass p-8 rounded-[2.5rem]">
                  <h4 className="font-black mb-6">Historial reciente</h4>
                  <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                    <Trophy size={48} className="mb-4 opacity-20" />
                    <p className="text-sm font-bold">¡Practica tu primera frase!</p>
                  </div>
                </div>
                <div className="glass p-8 rounded-[2.5rem] bg-brand-600 text-white">
                  <h4 className="font-black mb-2">Tu promedio</h4>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black">0</span>
                    <span className="text-sm font-bold opacity-80">puntos de pronunciación</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'courses' && (
            <motion.div 
              key="courses"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-4 custom-scrollbar">
                {levels.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => {
                      setSelectedLevel(level);
                      fetchLessons(level.id);
                    }}
                    className={`px-8 py-3 rounded-2xl font-sans font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
                      selectedLevel?.id === level.id 
                        ? 'bg-brand-600 text-white shadow-xl shadow-brand-500/30 -translate-y-1' 
                        : 'glass text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {level.name}
                  </button>
                ))}
              </div>

              {selectedLevel ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {lessons.map((lesson) => {
                    const isCompleted = progress.some(p => p.lesson_id === lesson.id);
                    return (
                      <div key={lesson.id} className="glass p-8 rounded-[3rem] shadow-2xl shadow-slate-200/50 dark:shadow-none hover:border-brand-500/30 transition-all group">
                        <div className="flex items-start justify-between mb-6">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${isCompleted ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                            {isCompleted ? <CheckCircle2 size={28} /> : <BookOpen size={28} />}
                          </div>
                          {isCompleted && <span className="text-[10px] font-black text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full uppercase tracking-widest">Completado</span>}
                        </div>
                        <h4 className="font-sans font-black text-slate-900 dark:text-white text-xl mb-3 tracking-tight">{lesson.title}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 line-clamp-2 font-serif italic leading-relaxed">{lesson.content}</p>
                        <button 
                          onClick={() => completeLesson(lesson.id)}
                          className={`w-full py-4 rounded-2xl font-sans font-black text-xs uppercase tracking-widest transition-all ${
                          isCompleted 
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700' 
                            : 'bg-brand-600 text-white hover:bg-brand-700 shadow-xl shadow-brand-500/20'
                        }`}>
                          {isCompleted ? 'Repasar Lección' : 'Comenzar Ahora'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-32 glass rounded-[4rem] border-dashed border-2 border-slate-200 dark:border-slate-800">
                  <BookOpen size={64} className="text-slate-200 dark:text-slate-800 mx-auto mb-6" />
                  <h3 className="text-2xl font-sans font-black text-slate-900 dark:text-white tracking-tight">Selecciona un nivel</h3>
                  <p className="text-slate-500 font-serif italic mt-2">Elige un nivel arriba para explorar las lecciones disponibles.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'ai-tutor' && (
            <motion.div 
              key="ai-tutor"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-[calc(100vh-220px)] flex flex-col"
            >
              <div className="flex-1 glass rounded-[3.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden flex flex-col relative">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl"></div>
                
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand-500/30 rotate-3">
                      <Sparkles size={28} />
                    </div>
                    <div>
                      <h3 className="font-sans font-black text-xl text-slate-900 dark:text-white tracking-tight">Tutor IA Personal</h3>
                      <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        Sincronizado y Activo
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-3 text-slate-400 hover:text-brand-600 transition-colors bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <Settings size={20} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 p-8 overflow-y-auto space-y-6 relative z-10 custom-scrollbar">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                      <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg ${msg.role === 'user' ? 'bg-brand-600 text-white' : 'bg-white dark:bg-slate-800 text-brand-600 border border-slate-100 dark:border-slate-700'}`}>
                        {msg.role === 'user' ? <UserIcon size={20} /> : <Sparkles size={20} />}
                      </div>
                      <div className={`p-6 rounded-[2rem] text-sm leading-relaxed font-serif italic ${
                        msg.role === 'user' 
                          ? 'bg-brand-600 text-white rounded-tr-none shadow-xl shadow-brand-500/20' 
                          : 'glass text-slate-700 dark:text-slate-200 rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex gap-4 max-w-[85%]">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 text-brand-600 border border-slate-100 dark:border-slate-700 flex items-center justify-center animate-bounce">
                        <Sparkles size={20} />
                      </div>
                      <div className="glass p-6 rounded-[2rem] rounded-tl-none">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-brand-600 rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-brand-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                          <div className="w-1.5 h-1.5 bg-brand-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 relative z-10">
                  <div className="flex gap-4">
                    <input 
                      type="text" 
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Escribe tu mensaje en inglés..."
                      className="flex-1 px-8 py-5 rounded-[2rem] bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:ring-2 focus:ring-brand-500 outline-none transition-all font-serif italic text-sm"
                    />
                    <button 
                      onClick={sendMessage}
                      disabled={isTyping || !userInput.trim()}
                      className="bg-brand-600 text-white p-5 rounded-2xl hover:bg-brand-700 transition-all shadow-xl shadow-brand-500/30 disabled:opacity-50 hover:scale-105 active:scale-95"
                    >
                      <Send size={24} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'live' && user.role === 'student' && (
            <motion.div key="live" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="bg-gradient-to-br from-vino-neon to-uva-neon p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border-vino-neon">
                <div className="relative z-10 max-w-lg">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block backdrop-blur-md border border-white/20">En Vivo Ahora</span>
                  <h3 className="text-4xl font-black mb-4 leading-tight">Club de Conversación: Viajes y Cultura</h3>
                  <p className="text-white/80 mb-8 text-lg font-cursive">Únete a otros 15 estudiantes y al Prof. Carlos para practicar tu speaking en tiempo real.</p>
                  <button className="bg-white text-vino-neon font-black px-8 py-4 rounded-2xl hover:bg-white/90 transition-all shadow-xl flex items-center gap-3">
                    <Video size={24} />
                    Entrar a la Sala
                  </button>
                </div>
                <Video size={300} className="absolute -right-20 -bottom-20 text-white/5 -rotate-12" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass p-8 rounded-[2.5rem] border-cyan-neon">
                  <h4 className="font-black text-xl mb-6 text-cyan-neon">Próximas Sesiones</h4>
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-cyan-neon/10 text-cyan-neon rounded-xl flex items-center justify-center">
                            <Calendar size={20} />
                          </div>
                          <div>
                            <p className="font-black text-sm">Gramática A2</p>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Hoy, 4:00 PM</p>
                          </div>
                        </div>
                        <button className="text-cyan-neon font-black text-xs uppercase tracking-widest">Recordar</button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="glass p-8 rounded-[2.5rem] border-kiwi-neon">
                  <h4 className="font-black text-xl mb-6 text-kiwi-neon">Tus Profesores</h4>
                  <div className="flex -space-x-4">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="w-14 h-14 rounded-full border-4 border-slate-900 bg-slate-800 flex items-center justify-center font-black text-slate-400 shadow-md">
                        P{i}
                      </div>
                    ))}
                  </div>
                  <p className="mt-6 text-slate-500 text-sm font-cursive">Nuestros profesores nativos están disponibles 24/7 para ayudarte a mejorar.</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'tutors' && (
            <motion.div key="tutors" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-4xl font-black mb-2 text-kiwi-neon">Tutores & Profesores</h2>
                  <p className="text-slate-500 font-cursive text-lg">Clases 1 a 1 personalizadas con expertos certificados</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {tutors.map((tutor) => (
                  <div key={tutor.id} className="glass-card p-8 flex flex-col md:flex-row gap-8 border-kiwi-neon">
                    <div className="w-24 h-24 rounded-[2rem] bg-slate-800 overflow-hidden flex-shrink-0 shadow-lg border border-white/10">
                      <img src={tutor.avatar} alt={tutor.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-black flex items-center gap-2 text-kiwi-neon">
                            {tutor.name}
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest">Disponible</span>
                          </h3>
                          <p className="text-xs text-slate-400 font-black uppercase tracking-widest flex items-center gap-1 mt-1">
                            <Globe size={12} /> {tutor.location}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-kiwi-neon">$ {tutor.price_per_hour.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">por hora</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-1 text-gold-neon">
                          <Star size={14} fill="currentColor" />
                          <span className="text-sm font-black">{tutor.rating}</span>
                        </div>
                        <span className="text-xs text-slate-400 font-black uppercase tracking-widest">({tutor.classes_count} clases)</span>
                      </div>

                      <p className="text-sm text-slate-400 font-cursive leading-relaxed mb-6 line-clamp-2">{tutor.bio}</p>

                      <div className="flex flex-wrap gap-2 mb-8">
                        {JSON.parse(tutor.languages).map((l: string) => (
                          <span key={l} className="px-3 py-1 rounded-lg bg-kiwi-neon/10 text-kiwi-neon text-[10px] font-black uppercase tracking-widest flex items-center gap-1 border border-kiwi-neon/20">
                            <Globe size={10} /> {l}
                          </span>
                        ))}
                      </div>

                      <button className="w-full btn-neon-kiwi py-3 text-[10px]">Reservar clase</button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'billing' && (
            <motion.div key="billing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
              <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-4xl font-black mb-4 text-vino-neon">Planes & Suscripciones</h2>
                <p className="text-slate-500 font-cursive text-lg mb-10">Elige el plan que mejor se adapte a tus objetivos de aprendizaje</p>
                
                <div className="inline-flex items-center p-1 bg-white/5 rounded-2xl mb-12 border border-white/10">
                  <button className="px-8 py-3 rounded-xl bg-white text-black shadow-lg text-xs font-black uppercase tracking-widest">Mensual</button>
                  <button className="px-8 py-3 rounded-xl text-slate-400 text-xs font-black uppercase tracking-widest">Anual <span className="text-kiwi-neon ml-1">-30%</span></button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {plans.map((plan) => (
                  <div key={plan.id} className={`glass-card p-10 flex flex-col relative border-vino-neon ${plan.is_popular ? 'ring-2 ring-vino-neon scale-105 z-10 shadow-[0_0_30px_rgba(255,0,85,0.2)]' : ''}`}>
                    {plan.tag && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-vino-neon text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                        {plan.tag}
                      </div>
                    )}
                    <h3 className="text-xl font-black mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mb-8">
                      <span className="text-4xl font-black text-vino-neon">$ {plan.price.toLocaleString()}</span>
                      <span className="text-xs text-slate-400 font-bold">/mes</span>
                    </div>
                    
                    <ul className="space-y-4 mb-12 flex-1">
                      {JSON.parse(plan.features).map((f: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-sm font-bold text-slate-400">
                          <CheckCircle2 size={18} className="text-kiwi-neon flex-shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <button 
                      onClick={() => handleWompiCheckout(plan)}
                      disabled={plan.price === 0}
                      className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${plan.price === 0 ? 'bg-white/5 text-slate-500 cursor-not-allowed' : 'btn-neon-vino'}`}
                    >
                      {plan.price === 0 ? 'Plan gratuito' : 'Suscribirme'}
                    </button>
                  </div>
                ))}
              </div>

              <div className="glass p-10 rounded-[3rem] text-center border-gold-neon">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Métodos de pago aceptados vía Wompi</p>
                <div className="flex flex-wrap justify-center gap-8 opacity-80">
                  {['PSE', 'Nequi', 'Bancolombia', 'Visa', 'Mastercard', 'Efecty'].map(m => (
                    <div key={m} className="flex items-center gap-2 font-black text-xs text-gold-neon">
                      <div className="w-8 h-8 rounded-lg bg-gold-neon/10 border border-gold-neon/20"></div>
                      {m}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-10">
              <h2 className="text-4xl font-black mb-2">Configuración</h2>
              <p className="text-slate-500 font-cursive text-lg mb-12">Personaliza tu experiencia de aprendizaje</p>

              <div className="glass-card p-10">
                <div className="flex items-center gap-6 mb-12">
                  <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-brand-500/20">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black">{user.name}</h3>
                    <p className="text-slate-400 font-bold">{user.email}</p>
                    <button className="mt-4 text-brand-600 font-black text-xs uppercase tracking-widest hover:underline">Cambiar foto de perfil</button>
                  </div>
                </div>

                <div className="space-y-12">
                  <section>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                      <Sun size={14} /> Apariencia
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => updateSettings({ theme: 'light' })}
                        className={`p-6 rounded-3xl border-2 transition-all flex items-center justify-center gap-3 font-black text-sm ${!darkMode ? 'border-brand-600 bg-brand-50/50 text-brand-600' : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                      >
                        <Sun size={20} /> Claro
                      </button>
                      <button 
                        onClick={() => updateSettings({ theme: 'dark' })}
                        className={`p-6 rounded-3xl border-2 transition-all flex items-center justify-center gap-3 font-black text-sm ${darkMode ? 'border-brand-600 bg-brand-900/20 text-brand-600' : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                      >
                        <Moon size={20} /> Oscuro
                      </button>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                      <Globe size={14} /> Idioma que estoy aprendiendo
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {['Inglés', 'Francés', 'Alemán', 'Portugués', 'Italiano', 'Japonés', 'Mandarín'].map(lang => (
                        <button 
                          key={lang}
                          onClick={() => updateSettings({ learning_language: lang })}
                          className={`p-4 rounded-2xl border-2 transition-all font-bold text-sm ${settings?.learning_language === lang ? 'border-brand-600 bg-brand-50/50 text-brand-600' : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'progress' && user.role === 'student' && (
            <motion.div key="progress" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                  <h3 className="text-2xl font-black mb-8">Tus Habilidades</h3>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                        { subject: 'Lectura', A: userSkills?.reading || 0, fullMark: 100 },
                        { subject: 'Escritura', A: userSkills?.writing || 0, fullMark: 100 },
                        { subject: 'Escucha', A: userSkills?.listening || 0, fullMark: 100 },
                        { subject: 'Habla', A: userSkills?.speaking || 0, fullMark: 100 },
                      ]}>
                        <PolarGrid stroke={darkMode ? '#334155' : '#e2e8f0'} />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12, fontWeight: 700 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Habilidades" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.6} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                  <h3 className="text-2xl font-black mb-8">Logros</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {userAchievements.map((ach) => {
                      const isUnlocked = !!ach.unlocked_at;
                      return (
                        <div key={ach.id} className={`p-6 rounded-3xl border transition-all ${isUnlocked ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 opacity-50'}`}>
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${isUnlocked ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`}>
                            {ach.icon === 'Star' && <Star size={24} />}
                            {ach.icon === 'Zap' && <Zap size={24} />}
                            {ach.icon === 'MessageSquare' && <MessageSquare size={24} />}
                            {ach.icon === 'Trophy' && <Trophy size={24} />}
                          </div>
                          <h4 className="font-bold text-slate-900 dark:text-white mb-1">{ach.name}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{ach.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
