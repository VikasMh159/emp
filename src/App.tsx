import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  LayoutDashboard, 
  CheckSquare, 
  BarChart3, 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  ChevronRight, 
  Star, 
  Calendar,
  Mail,
  Phone,
  ArrowLeft,
  MoreVertical,
  TrendingUp,
  Award,
  Clock,
  Settings,
  LogOut,
  UserCheck,
  Bell,
  Download,
  ShieldCheck,
  ChevronLeft,
  AlertCircle,
  Briefcase,
  Zap,
  Target,
  MessageSquare,
  Lightbulb,
  Trash2,
  ChevronDown,
  ChevronUp,
  Moon,
  Sun,
  Edit
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  DUMMY_EMPLOYEES, 
  DUMMY_TASKS, 
  DUMMY_PERFORMANCE, 
  DUMMY_ATTENDANCE,
  type Employee, 
  type Task, 
  type Performance,
  type Attendance
} from './data';

type Screen = 'splash' | 'login' | 'dashboard' | 'employees' | 'teams' | 'employee-detail' | 'edit-employee' | 'tasks' | 'performance' | 'attendance' | 'analytics' | 'reports' | 'settings';

const TECH_ROLES = [
  'CEO', 'CTO', 'COO', 'CFO',
  'Senior Developer', 'Junior Developer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer',
  'Mobile App Developer', 'DevOps Engineer', 'Cloud Architect', 'Security Engineer',
  'Product Manager', 'Project Manager', 'Product Designer', 'UX Researcher', 'UI Designer',
  'Data Scientist', 'Data Analyst', 'Machine Learning Engineer',
  'QA Engineer', 'Automation Tester',
  'Marketing Manager', 'Content Writer', 'SEO Specialist',
  'Sales Executive', 'Account Manager', 'Customer Success',
  'HR Manager', 'Recruiter', 'Office Admin'
];

const DEPARTMENTS = [
  'Engineering', 'Product', 'Design', 'Data Science', 'QA', 
  'Marketing', 'Sales', 'Customer Success', 'HR', 'Operations', 'Finance'
];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [previousScreen, setPreviousScreen] = useState<Screen>('employees');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<'super_admin' | 'admin' | 'employee' | null>(null);
  const [userDepartment, setUserDepartment] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isLoadingRole, setIsLoadingRole] = useState(false);
  
  // Workable States
  const [employees, setEmployees] = useState<Employee[]>(DUMMY_EMPLOYEES);
  const [tasks, setTasks] = useState<Task[]>(DUMMY_TASKS);
  const [attendance, setAttendance] = useState<Attendance[]>(DUMMY_ATTENDANCE);
  const [performance, setPerformance] = useState<Performance[]>(DUMMY_PERFORMANCE);
  const [settings, setSettings] = useState({
    security: true,
    alerts: true,
    sync: false
  });
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo(0, 0);
    }
  }, [currentScreen]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (currentScreen === 'splash') {
      const timer = setTimeout(() => setCurrentScreen('login'), 2500);
      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

  const selectedEmployee = useMemo(() => 
    employees.find(e => e.id === selectedEmployeeId),
    [selectedEmployeeId, employees]
  );

  const rbacFilteredEmployees = useMemo(() => {
    if (userRole === 'super_admin') return employees;
    if (userRole === 'admin' && userDepartment) {
      return employees.filter(e => e.department === userDepartment);
    }
    if (userRole === 'employee' && user) {
      return employees.filter(e => e.id === user.uid);
    }
    return [];
  }, [employees, userRole, userDepartment, user]);

  const rbacFilteredTasks = useMemo(() => {
    if (userRole === 'super_admin') return tasks;
    if (userRole === 'admin' && userDepartment) {
      const deptEmployeeIds = employees.filter(e => e.department === userDepartment).map(e => e.id);
      return tasks.filter(t => deptEmployeeIds.includes(t.employeeId));
    }
    if (userRole === 'employee' && user) {
      return tasks.filter(t => t.employeeId === user.uid);
    }
    return [];
  }, [tasks, employees, userRole, userDepartment, user]);

  const searchFilteredEmployees = useMemo(() => 
    employees.filter(e => 
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.department.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [searchQuery, employees]
  );

  const filteredEmployees = useMemo(() => 
    rbacFilteredEmployees.filter(e => 
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.department.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [searchQuery, rbacFilteredEmployees]
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setIsDemoMode(false);
        setIsLoadingRole(true);
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserRole(data.role);
            setUserDepartment(data.department || null);
            setIsLoggedIn(true);
            setCurrentScreen('dashboard');
          } else {
            setUserRole('employee');
            setIsLoggedIn(true);
            setCurrentScreen('dashboard');
          }
        } catch (error) {
          console.error("Error fetching role:", error);
          showToast("Failed to fetch user role", "info");
        } finally {
          setIsLoadingRole(false);
        }
      } else if (!isDemoMode) {
        setUserRole(null);
        setIsLoggedIn(false);
        if (currentScreen !== 'splash') {
          setCurrentScreen('login');
        }
      }
    });
    return () => unsubscribe();
  }, [isDemoMode]);

  const handleDemoLogin = (role: 'super_admin' | 'admin' | 'employee' = 'employee') => {
    setIsDemoMode(true);
    setUserRole(role);
    if (role === 'admin') {
      setUserDepartment('Engineering'); // Default demo department
    } else {
      setUserDepartment(null);
    }
    setIsLoggedIn(true);
    setCurrentScreen('dashboard');
    showToast(`Logged in as ${role.replace('_', ' ')} (Demo)`);
  };

  const handleFirebaseLogin = async (email: string, pass: string) => {
    try {
      setIsDemoMode(false);
      await signInWithEmailAndPassword(auth, email, pass);
      showToast("Authenticating...");
    } catch (error: any) {
      console.error("Login error:", error);
      showToast(error.message || "Login failed", "info");
    }
  };

  const handleLogout = async () => {
    try {
      setIsDemoMode(false);
      await signOut(auth);
      setUserRole(null);
      setIsLoggedIn(false);
      setCurrentScreen('login');
      showToast("Logged out successfully");
    } catch (error) {
      showToast("Logout failed", "info");
    }
  };

  const navigateTo = (screen: Screen, id: string | null = null) => {
    // Role-based access control for navigation
    if (userRole === 'employee') {
      const restricted = ['analytics', 'reports', 'attendance', 'employees', 'edit-employee'];
      if (restricted.includes(screen)) {
        showToast("Access Denied: Admin only", "info");
        return;
      }
    }

    if (userRole === 'admin') {
      // Admins can't access super admin features (e.g. creating/deleting admins)
      // For now, we'll just restrict specific screens if any
    }

    // Only update previousScreen if we're moving to detail from a non-employee-subscreen
    if (screen === 'employee-detail' && !['edit-employee', 'performance', 'tasks'].includes(currentScreen)) {
      setPreviousScreen(currentScreen);
    }
    setSelectedEmployeeId(id);
    setCurrentScreen(screen);
  };

  const handleToggleAttendance = (employeeId: string, date: string, status: 'Present' | 'Absent') => {
    setAttendance(prev => {
      const existing = prev.find(a => a.employeeId === employeeId && a.date === date);
      if (existing) {
        return prev.map(a => (a.employeeId === employeeId && a.date === date) ? { ...a, status } : a);
      }
      return [...prev, { id: `a${Date.now()}`, employeeId, date, status }];
    });
    showToast(`Attendance updated for ${employees.find(e => e.id === employeeId)?.name}`);
  };

  const handleAddTask = (task: Partial<Task>) => {
    const newTask: Task = {
      id: `t${Date.now()}`,
      employeeId: task.employeeId || '1',
      description: task.description || 'New Task',
      details: task.details || '',
      targetRole: task.targetRole || 'All',
      deadline: task.deadline || new Date().toISOString().split('T')[0],
      priority: task.priority || 'Medium',
      assignedDate: task.assignedDate || new Date().toISOString().split('T')[0],
      status: 'Pending',
    };
    setTasks(prev => [newTask, ...prev]);
    showToast("New task uploaded successfully");
  };

  const handleSavePerformance = (perf: Partial<Performance>) => {
    const newPerf: Performance = {
      id: `p${Date.now()}`,
      employeeId: perf.employeeId || '',
      date: new Date().toISOString().split('T')[0],
      qualityScore: perf.qualityScore || 0,
      timelinessScore: perf.timelinessScore || 0,
      attendanceScore: perf.attendanceScore || 0,
      communicationScore: perf.communicationScore || 0,
      innovationScore: perf.innovationScore || 0,
      overallRating: perf.overallRating || 0,
      remarks: perf.remarks || '',
    };
    setPerformance(prev => [newPerf, ...prev]);
    showToast("Performance evaluation saved");
    navigateTo('employee-detail', perf.employeeId);
  };

  const handleAddEmployee = (emp: Partial<Employee>) => {
    // Enforce Hiring Flow: 
    // Super Admin hires Admins
    // Admin hires Employees
    const targetRbacRole = userRole === 'super_admin' ? 'admin' : 'employee';
    
    const newEmp: Employee = {
      id: `${Date.now()}`,
      name: emp.name || 'New Employee',
      role: emp.role || 'Staff',
      department: userRole === 'admin' ? (userDepartment || emp.department || 'Engineering') : (emp.department || 'Engineering'),
      joiningDate: new Date().toISOString().split('T')[0],
      email: emp.email || '',
      contact: emp.contact || '',
      gender: emp.gender || 'Other',
      avatar: `https://i.picsum.photos/seed/${(emp.name || 'user').split(' ')[0]}/200/200.jpg`,
      rbacRole: targetRbacRole,
      isTeamLeader: emp.isTeamLeader || targetRbacRole === 'admin',
      leaderId: emp.leaderId || (userRole === 'admin' ? user?.uid : '')
    };
    
    setEmployees(prev => [...prev, newEmp]);
    showToast(`${newEmp.name} hired as ${targetRbacRole.toUpperCase()}`);
  };

  const handleDeleteEmployee = (id: string) => {
    const emp = employees.find(e => e.id === id);
    setEmployees(prev => prev.filter(e => e.id !== id));
    showToast(`${emp?.name} removed from directory`, 'info');
  };

  const handleUpdateEmployee = (id: string, updatedData: Partial<Employee>) => {
    setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, ...updatedData } : emp));
    showToast(`${updatedData.name || 'Employee'} updated successfully`);
    navigateTo('employee-detail', id);
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: 'Pending' | 'In Progress' | 'Completed') => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    showToast(`Task status updated to ${newStatus}`, "success");
  };

  const renderScreen = () => {
    if (isLoadingRole) {
      return (
        <div className="h-full flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          >
            <Zap size={40} className="text-indigo-500" />
          </motion.div>
        </div>
      );
    }

    switch (currentScreen) {
      case 'splash':
        return <SplashScreen theme={theme} />;
      case 'login':
        return <LoginScreen theme={theme} onLogin={handleFirebaseLogin} onDemoLogin={handleDemoLogin} />;
      case 'dashboard':
        return <DashboardScreen theme={theme} onNavigate={navigateTo} employees={rbacFilteredEmployees} tasks={rbacFilteredTasks} performance={performance} userRole={userRole} />;
      case 'employees':
        return (
          <EmployeeListScreen 
            theme={theme}
            employees={searchFilteredEmployees} 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSelect={(id) => navigateTo('employee-detail', id)}
            onBack={() => setCurrentScreen('dashboard')}
            onAdd={handleAddEmployee}
            onDelete={handleDeleteEmployee}
            userRole={userRole}
            userDepartment={userDepartment}
            viewMode="flat"
          />
        );
      case 'teams':
        return (
          <EmployeeListScreen 
            theme={theme}
            employees={searchFilteredEmployees} 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSelect={(id) => navigateTo('employee-detail', id)}
            onBack={() => setCurrentScreen('dashboard')}
            onAdd={handleAddEmployee}
            onDelete={handleDeleteEmployee}
            userRole={userRole}
            userDepartment={userDepartment}
            viewMode="hierarchy"
          />
        );
      case 'employee-detail':
        return selectedEmployee ? (
          <EmployeeDetailScreen 
            theme={theme}
            employee={selectedEmployee} 
            onBack={() => setCurrentScreen(previousScreen)}
            onNavigate={navigateTo}
            userRole={userRole}
            employees={employees}
          />
        ) : null;
      case 'edit-employee':
        return selectedEmployee ? (
          <EditEmployeeScreen 
            theme={theme}
            employee={selectedEmployee}
            onBack={() => navigateTo('employee-detail', selectedEmployeeId)}
            onSave={(updatedData) => handleUpdateEmployee(selectedEmployeeId!, updatedData)}
          />
        ) : null;
      case 'tasks':
        return <TaskScreen theme={theme} onBack={() => selectedEmployeeId ? navigateTo('employee-detail', selectedEmployeeId) : setCurrentScreen('dashboard')} tasks={rbacFilteredTasks} onAddTask={handleAddTask} onUpdateStatus={handleUpdateTaskStatus} initialFilter={selectedEmployeeId} userRole={userRole} userId={user?.uid} />;
      case 'performance':
        const targetEmployee = userRole === 'employee' ? employees.find(e => e.id === user?.uid) : selectedEmployee;
        return <PerformanceScreen theme={theme} employee={targetEmployee} onBack={() => userRole === 'employee' ? setCurrentScreen('dashboard') : navigateTo('employee-detail', selectedEmployeeId)} onSave={handleSavePerformance} userRole={userRole} />;
      case 'attendance':
        return <AttendanceScreen theme={theme} onBack={() => setCurrentScreen('dashboard')} employees={rbacFilteredEmployees} attendance={attendance} onToggle={handleToggleAttendance} />;
      case 'analytics':
        return <AnalyticsScreen theme={theme} onBack={() => setCurrentScreen('dashboard')} employees={rbacFilteredEmployees} performance={performance} onNavigate={navigateTo} userRole={userRole} userDepartment={userDepartment} />;
      case 'reports':
        return <ReportScreen theme={theme} onBack={() => setCurrentScreen('dashboard')} onExport={(type) => showToast(`Exporting ${type} report...`, "info")} userRole={userRole} userDepartment={userDepartment} />;
      case 'settings':
        return (
          <SettingsScreen 
            onBack={() => setCurrentScreen('dashboard')} 
            onLogout={handleLogout} 
            settings={settings}
            onUpdateSettings={(key, val) => {
              setSettings(prev => ({ ...prev, [key]: val }));
              showToast("Settings updated");
            }}
            onAction={(label) => showToast(`${label} is currently in development`, "info")}
            theme={theme}
            onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            userRole={userRole}
          />
        );
      default:
        return <DashboardScreen theme={theme} onNavigate={navigateTo} employees={rbacFilteredEmployees} tasks={rbacFilteredTasks} performance={performance} userRole={userRole} />;
    }
  };

  const showNav = isLoggedIn && !['splash', 'login'].includes(currentScreen);

  return (
    <div className={`h-[100dvh] mesh-bg selection:bg-indigo-500/30 overflow-hidden transition-colors duration-500 ${theme === 'light' ? 'light text-slate-900' : 'text-slate-50'}`}>
      <div className={`max-w-md mx-auto h-full relative flex flex-col border-x transition-all duration-500 ${theme === 'light' ? 'bg-white/40 border-slate-200 shadow-xl' : 'bg-slate-950/20 border-white/5 shadow-[0_0_100px_-12px_rgba(0,0,0,0.5)]'}`}>
        <div 
          ref={scrollContainerRef}
          className={`flex-1 ${currentScreen === 'splash' ? 'overflow-hidden' : 'overflow-y-auto'} relative custom-scrollbar`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScreen + (selectedEmployeeId || '')}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="min-h-full"
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
        </div>

        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-0 right-0 max-w-md mx-auto px-8 z-[100]"
          >
            <div className={`p-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 ${toast.type === 'success' ? 'bg-emerald-600/90 text-white border-emerald-400/20' : 'bg-indigo-600/90 text-white border-indigo-400/20'}`}>
              {toast.type === 'success' ? <ShieldCheck size={20} /> : <AlertCircle size={20} />}
              <p className="text-sm font-bold">{toast.message}</p>
            </div>
          </motion.div>
        )}

        {showNav && (
          <div className="glass-nav px-8 py-4 flex justify-between items-center z-50 shrink-0">
            <NavButton 
              active={currentScreen === 'dashboard'} 
              icon={<LayoutDashboard size={22} />} 
              label="Home" 
              onClick={() => setCurrentScreen('dashboard')} 
              theme={theme}
              currentScreen={currentScreen}
            />
            {userRole !== 'employee' && (
              <NavButton 
                active={currentScreen === 'employees'} 
                icon={<Users size={22} />} 
                label="Staff" 
                onClick={() => setCurrentScreen('employees')} 
                theme={theme}
                currentScreen={currentScreen}
              />
            )}
            {userRole !== 'employee' && (
              <NavButton 
                active={currentScreen === 'analytics'} 
                icon={<BarChart3 size={22} />} 
                label="Stats" 
                onClick={() => setCurrentScreen('analytics')} 
                theme={theme}
                currentScreen={currentScreen}
              />
            )}
            <NavButton 
              active={currentScreen === 'settings'} 
              icon={<Settings size={22} />} 
              label="More" 
              onClick={() => setCurrentScreen('settings')} 
              theme={theme}
              currentScreen={currentScreen}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function NavButton({ active, icon, label, onClick, theme, currentScreen }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void, theme: 'dark' | 'light', currentScreen: string }) {
  return (
    <motion.button 
      whileTap={{ scale: 0.85 }}
      whileHover={{ y: -3 }}
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 transition-all duration-300 relative ${active ? 'text-indigo-400' : theme === 'light' ? 'text-slate-400 hover:text-slate-600' : 'text-slate-500 hover:text-slate-300'}`}
    >
      <motion.div 
        animate={active ? { 
          scale: [1, 1.3, 1],
          rotate: [0, -10, 10, 0],
        } : { scale: 1, rotate: 0 }}
        transition={active ? { 
          duration: 0.5,
          ease: "easeInOut"
        } : { 
          type: "spring",
          stiffness: 300,
          damping: 15
        }}
        className={`p-2.5 rounded-2xl transition-all duration-500 relative ${active ? 'bg-indigo-500/15 shadow-[0_0_25px_rgba(99,102,241,0.3)]' : 'bg-transparent'}`}
      >
        {icon}
        {active && (
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 rounded-2xl bg-indigo-500/20 z-[-1]"
          />
        )}
      </motion.div>
      <span className={`text-[9px] font-bold uppercase tracking-[0.15em] transition-all duration-500 ${active ? 'opacity-100 scale-100 translate-y-0' : 'opacity-40 scale-90 translate-y-0.5'}`}>
        {label}
      </span>
      {active && (
        <motion.div 
          key={currentScreen}
          layoutId="nav-indicator"
          initial={{ width: 4, opacity: 0 }}
          animate={{ width: 24, opacity: 1 }}
          whileTap={{ width: 8 }}
          transition={{ 
            type: "spring", 
            stiffness: 500, 
            damping: 30,
            mass: 1
          }}
          className="absolute -bottom-1.5 h-1 bg-indigo-400 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.8)]"
        />
      )}
    </motion.button>
  );
}

// --- Screens ---

function SplashScreen({ theme }: { theme: 'dark' | 'light' }) {
  return (
    <div className={`h-full flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-500 ${theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-white'}`}>
      {/* Decorative elements */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className={`absolute top-[-10%] right-[-10%] w-80 h-80 rounded-full blur-[100px] ${theme === 'light' ? 'bg-indigo-600/10' : 'bg-indigo-600/20'}`} 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.3, 1],
          rotate: [0, -90, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className={`absolute bottom-[-10%] left-[-10%] w-80 h-80 rounded-full blur-[100px] ${theme === 'light' ? 'bg-emerald-600/5' : 'bg-emerald-600/10'}`} 
      />
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
        className="flex flex-col items-center z-10"
      >
        <div className={`w-32 h-32 backdrop-blur-3xl rounded-[3rem] flex items-center justify-center mb-10 border shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]'}`}>
          <motion.div
            animate={{ 
              y: [0, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 3,
              ease: "easeInOut"
            }}
          >
            <TrendingUp size={64} className="text-indigo-500" strokeWidth={2.5} />
          </motion.div>
        </div>
        <h1 className={`text-5xl font-display font-bold tracking-tight text-glow transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>MindMatrix</h1>
        <p className="text-indigo-500 mt-4 font-bold tracking-[0.3em] uppercase text-[10px] opacity-80">Workforce Intelligence</p>
      </motion.div>
      
      <div className="absolute bottom-16">
        <div className="flex gap-3">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
              className="w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function LoginScreen({ onLogin, theme, onDemoLogin }: { onLogin: (email: string, pass: string) => void, theme: 'dark' | 'light', onDemoLogin: (role: 'super_admin' | 'admin' | 'employee') => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) return;
    setIsLoggingIn(true);
    await onLogin(email, password);
    setIsLoggingIn(false);
  };

  return (
    <div className={`min-h-full flex flex-col justify-center p-8 py-12 overflow-y-auto transition-colors duration-500 ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-950'}`}>
      <div className="mb-8 px-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mb-2 px-3 py-1 rounded-lg font-bold text-[9px] uppercase tracking-wider">Secure Portal</Badge>
          <h1 className={`text-2xl font-display font-bold leading-tight text-glow transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Welcome Back.</h1>
          <p className="text-slate-500 mt-1 text-sm">Sign in with your role-based credentials.</p>
        </motion.div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card-premium p-8 space-y-6"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Email Address</label>
            <Input 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@mindmatrix.io" 
              className={`h-14 rounded-xl border transition-all text-sm px-6 placeholder:text-slate-400 ${theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-900' : 'bg-white/5 border-white/5 text-white'}`} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Password</label>
            <Input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className={`h-14 rounded-xl border transition-all text-sm px-6 placeholder:text-slate-400 ${theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-900' : 'bg-white/5 border-white/5 text-white'}`} 
            />
          </div>
          
          <div className="flex justify-end">
            <motion.button 
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.95 }}
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
            >
              Forgot Access?
            </motion.button>
          </div>
 
          <Button 
            onClick={handleSignIn} 
            disabled={isLoggingIn}
            className="w-full h-14 rounded-xl btn-primary text-base font-bold mt-1"
          >
            {isLoggingIn ? "Authenticating..." : "Sign In"}
          </Button>
        </div>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <Separator className={theme === 'light' ? 'bg-slate-200' : 'bg-white/5'} />
          </div>
          <div className="relative flex justify-center text-[8px] uppercase tracking-widest">
            <span className={`px-3 font-bold ${theme === 'light' ? 'bg-slate-50 text-slate-400' : 'bg-[#0f172a] text-slate-600'}`}>Secure Access</span>
          </div>
        </div>

        <Button variant="outline" onClick={() => onDemoLogin('employee')} className={`w-full h-12 rounded-xl text-sm font-bold ${theme === 'light' ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' : 'btn-secondary'}`}>
          Continue as Guest
        </Button>

        <div className="mt-6 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Quick Login (Demo Mode)</p>
          <p className="text-[8px] text-slate-400 text-center italic px-4">Use these buttons to instantly test the different role-based views without setting up Firebase accounts.</p>
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => onDemoLogin('super_admin')}
              className={`py-2 px-1 rounded-lg text-[9px] font-bold uppercase tracking-tighter transition-all border ${theme === 'light' ? 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20'}`}
            >
              Super Admin
            </button>
            <button 
              onClick={() => onDemoLogin('admin')}
              className={`py-2 px-1 rounded-lg text-[9px] font-bold uppercase tracking-tighter transition-all border ${theme === 'light' ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'}`}
            >
              Admin/Mgr
            </button>
            <button 
              onClick={() => onDemoLogin('employee')}
              className={`py-2 px-1 rounded-lg text-[9px] font-bold uppercase tracking-tighter transition-all border ${theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
            >
              Employee
            </button>
          </div>
        </div>
      </motion.div>
      
      <p className={`text-center text-[9px] font-bold uppercase tracking-[0.2em] mt-8 ${theme === 'light' ? 'text-slate-400' : 'text-slate-700'}`}>MindMatrix v2.4.0</p>
    </div>
  );
}

function DashboardScreen({ onNavigate, employees, tasks, performance, theme, userRole }: { onNavigate: (screen: Screen, id: string | null) => void, employees: Employee[], tasks: Task[], performance: Performance[], theme: 'dark' | 'light', userRole: string | null }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isRinging, setIsRinging] = useState(false);
  
  const handleBellClick = () => {
    setIsRinging(true);
    setTimeout(() => setIsRinging(false), 1000);
    // Optional: delay navigation slightly to see animation, or just navigate
    onNavigate('reports', null);
  };
  
  const topPerformers = useMemo(() => {
    return employees.map(emp => {
      const perf = performance.filter(p => p.employeeId === emp.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      return {
        ...emp,
        rating: perf ? perf.overallRating : 0
      };
    }).sort((a, b) => b.rating - a.rating).slice(0, 10);
  }, [employees, performance]);

  const scroll = (direction: 'up' | 'down') => {
    if (scrollRef.current) {
      const { scrollTop } = scrollRef.current;
      const scrollAmount = 240; // Approximate height of 3-4 rows
      scrollRef.current.scrollTo({
        top: direction === 'up' ? scrollTop - scrollAmount : scrollTop + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const pendingTasks = tasks.filter(t => t.status !== 'Completed');
  const completedTasks = tasks.filter(t => t.status === 'Completed');

  const welcomeMessage = userRole === 'super_admin' ? 'Welcome back, Chief' : userRole === 'admin' ? 'Welcome back, Manager' : 'Welcome back, Team Member';
  
  return (
    <div className="min-h-full flex flex-col">
      <header className={`p-6 sm:p-8 pt-12 sm:pt-16 rounded-b-[3rem] shadow-2xl relative overflow-hidden border-b transition-colors duration-500 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-950 border-white/5'}`}>
        {/* Decorative background */}
        <div className={`absolute top-[-20%] right-[-10%] w-64 h-64 rounded-full blur-[80px] animate-pulse ${theme === 'light' ? 'bg-indigo-600/5' : 'bg-indigo-600/20'}`} />
        
        <div className="flex justify-between items-center mb-8 relative z-10">
          <div className="min-w-0">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`text-2xl font-display font-bold text-glow truncate transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}
            >
              Dashboard
            </motion.h1>
            <p className="text-slate-500 text-[11px] font-medium mt-0.5 truncate">{welcomeMessage}</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9, rotate: -15 }}
            onClick={handleBellClick}
            className={`p-2.5 backdrop-blur-xl rounded-2xl relative border shadow-xl flex-shrink-0 transition-all duration-500 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}
          >
            <motion.div
              animate={isRinging ? { 
                rotate: [0, -20, 20, -20, 20, -10, 10, 0],
                scale: [1, 1.2, 1.2, 1.2, 1.2, 1.1, 1.1, 1]
              } : { rotate: [0, -10, 10, -10, 0] }}
              transition={isRinging ? { 
                duration: 0.5,
                ease: "easeInOut"
              } : { repeat: Infinity, duration: 2, delay: 1 }}
            >
              <Bell size={20} className={theme === 'light' ? 'text-slate-600' : 'text-slate-300'} />
            </motion.div>
            <span className={`absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 ${theme === 'light' ? 'border-white' : 'border-slate-950'}`}></span>
          </motion.button>
        </div>
        
        <div className="grid grid-cols-2 gap-3 sm:gap-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => userRole === 'employee' ? onNavigate('performance', null) : onNavigate('teams', null)}
            className={`backdrop-blur-xl rounded-[1.5rem] p-5 sm:p-6 border shadow-lg cursor-pointer active:scale-95 transition-all duration-500 overflow-hidden ${theme === 'light' ? 'bg-white border-slate-300' : 'bg-white/5 border-white/10'}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-500/20 rounded-xl flex-shrink-0">
                {userRole === 'employee' ? <Target size={16} className="text-indigo-500 dark:text-indigo-400" /> : <Users size={16} className="text-indigo-500 dark:text-indigo-400" />}
              </div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest truncate">
                {userRole === 'employee' ? 'Performance' : 'Team'}
              </p>
            </div>
            <p className={`text-3xl font-display font-bold transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              {userRole === 'employee' ? 'View' : employees.length}
            </p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => onNavigate('tasks', null)}
            className={`backdrop-blur-xl rounded-[1.5rem] p-5 sm:p-6 border shadow-lg cursor-pointer active:scale-95 transition-all duration-500 overflow-hidden ${theme === 'light' ? 'bg-white border-slate-300' : 'bg-white/5 border-white/10'}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-500/20 rounded-xl flex-shrink-0">
                <Zap size={16} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest truncate">Tasks</p>
            </div>
            <p className={`text-3xl font-display font-bold transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{tasks.length}</p>
          </motion.div>
        </div>
      </header>

      <main className="p-4 sm:p-6 space-y-6 sm:space-y-8">
        <section>
          <div className="flex justify-between items-end mb-4">
            <h2 className={`text-lg font-display font-bold flex items-center gap-2 transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              <Zap className="text-indigo-500" size={20} />
              Task Intelligence
            </h2>
            <button onClick={() => onNavigate('tasks', null)} className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline underline-offset-4">View All</button>
          </div>
          <div className="card-premium p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Operational Efficiency</p>
                <h3 className={`text-2xl font-display font-bold transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  {tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}% 
                  <span className="text-xs font-normal text-slate-500 ml-2">Completion Rate</span>
                </h3>
              </div>
              <div className={`p-3 rounded-2xl ${theme === 'light' ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-500/10 text-indigo-400'}`}>
                <TrendingUp size={24} />
              </div>
            </div>
            
            <div className={`h-4 w-full rounded-full overflow-hidden transition-colors duration-500 relative ${theme === 'light' ? 'bg-slate-100' : 'bg-white/5'}`}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0}%` }}
                transition={{ duration: 1.5, ease: "circOut" }}
                className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)]"
              />
            </div>

            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-amber-500">
                  <Clock size={12} />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Pending</span>
                </div>
                <p className={`text-xl font-display font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{tasks.filter(t => t.status === 'Pending').length}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-indigo-400">
                  <Zap size={12} />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Active</span>
                </div>
                <p className={`text-xl font-display font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{tasks.filter(t => t.status === 'In Progress').length}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-500">
                  <ShieldCheck size={12} />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Done</span>
                </div>
                <p className={`text-xl font-display font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{completedTasks.length}</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex justify-between items-end mb-4">
            <div>
              <h2 className={`text-lg font-display font-bold flex items-center gap-2 transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                <Award className="text-amber-500" size={20} />
                Top Performers
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => scroll('up')}
                  className={`p-1.5 rounded-lg border transition-all active:scale-90 ${theme === 'light' ? 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600' : 'bg-white/5 border-white/10 text-slate-500 hover:text-indigo-400'}`}
                >
                  <ChevronUp size={14} strokeWidth={3} />
                </button>
                <button 
                  onClick={() => scroll('down')}
                  className={`p-1.5 rounded-lg border transition-all active:scale-90 ${theme === 'light' ? 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600' : 'bg-white/5 border-white/10 text-slate-500 hover:text-indigo-400'}`}
                >
                  <ChevronDown size={14} strokeWidth={3} />
                </button>
              </div>
              <button onClick={() => onNavigate('analytics', null)} className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline underline-offset-4">Full List</button>
            </div>
          </div>
            <div className="card-premium p-0 overflow-hidden relative group">
            <div 
              ref={scrollRef}
              className="max-h-[240px] overflow-y-auto custom-scrollbar"
            >
              <Table>
              <TableHeader className={theme === 'light' ? 'bg-slate-200/50' : 'bg-white/5'}>
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="w-16 text-center font-bold text-[10px] uppercase tracking-widest py-4">Sr. No</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest py-4">Name</TableHead>
                  <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest pr-8 py-4">Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPerformers.map((emp, i) => (
                  <TableRow 
                    key={emp.id} 
                    onClick={() => onNavigate('employee-detail', emp.id)}
                    className={`cursor-pointer transition-colors border-none ${theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}
                  >
                    <TableCell className="text-center py-4">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${i === 0 ? 'bg-amber-400 text-slate-900' : i === 1 ? 'bg-slate-300 text-slate-900' : 'bg-orange-400 text-slate-900'}`}>
                        {i + 1}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border shadow-sm">
                          <AvatarImage src={emp.avatar} />
                          <AvatarFallback className="bg-indigo-500/10 text-indigo-500 font-bold">{emp.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className={`font-bold text-sm truncate transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{emp.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{emp.role}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8 py-4">
                      <div className="flex items-center justify-end gap-1.5 text-amber-500 font-bold">
                        <motion.div
                          whileHover={{ scale: 1.2, rotate: 15 }}
                        >
                          <Star size={14} fill="currentColor" />
                        </motion.div>
                        <span className={`text-sm transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{emp.rating.toFixed(1)}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-4">
          <motion.button 
            whileHover={{ y: -5, backgroundColor: theme === 'light' ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.08)' }}
            whileTap={{ scale: 0.92 }}
            onClick={() => onNavigate('attendance', null)}
            className="h-28 card-premium flex flex-col items-center justify-center gap-2 group"
          >
            <motion.div 
              whileHover={{ rotate: 15, scale: 1.2 }}
              whileTap={{ rotate: 45, scale: 0.8 }}
              className={`p-2.5 rounded-2xl transition-colors ${theme === 'light' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100' : 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20'}`}
            >
              <UserCheck size={24} />
            </motion.div>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Attendance</span>
          </motion.button>
          <motion.button 
            whileHover={{ y: -5, backgroundColor: theme === 'light' ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.08)' }}
            whileTap={{ scale: 0.92 }}
            onClick={() => onNavigate('reports', null)}
            className="h-28 card-premium flex flex-col items-center justify-center gap-2 group"
          >
            <motion.div 
              whileHover={{ rotate: -15, scale: 1.2 }}
              whileTap={{ rotate: -45, scale: 0.8 }}
              className={`p-2.5 rounded-2xl transition-colors ${theme === 'light' ? 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100' : 'bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20'}`}
            >
              <FileText size={24} />
            </motion.div>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Reports</span>
          </motion.button>
        </div>
      </main>
    </div>
  );
}

function EmployeeListScreen({ employees, searchQuery, setSearchQuery, onSelect, onBack, onAdd, onDelete, theme, userRole, userDepartment, viewMode = 'flat' }: { 
  employees: Employee[], 
  searchQuery: string, 
  setSearchQuery: (q: string) => void,
  onSelect: (id: string) => void,
  onBack: () => void,
  onAdd: (emp: Partial<Employee>) => void,
  onDelete: (id: string) => void,
  theme: 'dark' | 'light',
  userRole: string | null,
  userDepartment: string | null,
  viewMode?: 'flat' | 'hierarchy'
}) {
  const [selectedDept, setSelectedDept] = useState('All Staff');
  const [showAddModal, setShowAddModal] = useState(false);
  const [roleSearch, setRoleSearch] = useState('');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [newEmp, setNewEmp] = useState<{name: string, role: string, department: string, email: string, contact: string, gender: 'Male' | 'Female' | 'Other', rbacRole: 'admin' | 'employee', leaderId: string, isTeamLeader: boolean}>({ 
    name: '', 
    role: '', 
    department: userRole === 'admin' ? (userDepartment || 'Engineering') : 'Engineering', 
    email: '', 
    contact: '',
    gender: 'Male',
    rbacRole: userRole === 'super_admin' ? 'admin' : 'employee',
    leaderId: '',
    isTeamLeader: false
  });

  const filteredRoles = TECH_ROLES.filter(r => 
    r.toLowerCase().includes(roleSearch.toLowerCase())
  );

  const filteredByDept = employees.filter(emp => 
    selectedDept === 'All Staff' || emp.department === selectedDept
  );

  const handleAdd = () => {
    if (!newEmp.name || !newEmp.role) return;
    onAdd(newEmp);
    setNewEmp({ name: '', role: '', department: 'Engineering', email: '', contact: '', gender: 'Male', rbacRole: 'employee', leaderId: '', isTeamLeader: false });
    setShowAddModal(false);
  };

  const teamLeaders = filteredByDept.filter(emp => emp.isTeamLeader);
  const unassignedMembers = filteredByDept.filter(emp => !emp.isTeamLeader && !emp.leaderId);

  const renderEmployeeCard = (emp: Employee, isMember = false) => (
    <motion.div 
      key={emp.id} 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onSelect(emp.id)}
      className={`card-premium p-5 sm:p-6 flex items-center gap-5 cursor-pointer active:scale-[0.98] overflow-hidden ${isMember ? 'ml-8 border-l-2 border-indigo-500/20' : ''}`}
    >
      <Avatar className={`h-14 w-14 border-2 shadow-xl flex-shrink-0 transition-all duration-500 ${theme === 'light' ? 'border-slate-100' : 'border-white/5'}`}>
        <AvatarImage src={emp.avatar} className="object-cover" />
        <AvatarFallback className="bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 font-bold text-lg">{emp.name[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <h3 className={`font-bold text-base transition-colors duration-500 truncate ${theme === 'light' ? 'text-slate-900' : 'text-slate-200'}`}>{emp.name}</h3>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-slate-500 font-medium truncate">{emp.role}</p>
          {emp.isTeamLeader && (
            <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[8px] px-1.5 py-0 rounded-md font-bold uppercase tracking-widest">Leader</Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {((userRole === 'super_admin') || (userRole === 'admin' && emp.rbacRole !== 'admin' && emp.rbacRole !== 'super_admin')) && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Are you sure you want to delete ${emp.name}?`)) {
                onDelete(emp.id);
              }
            }}
            className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl hover:bg-rose-500/20 transition-colors"
          >
            <Trash2 size={20} />
          </button>
        )}
        <div className={`p-2.5 rounded-2xl flex-shrink-0 transition-colors duration-500 ${theme === 'light' ? 'bg-slate-100 text-slate-400' : 'bg-white/5 text-slate-500'}`}>
          <ChevronRight size={22} strokeWidth={2.5} />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className={`pb-10 min-h-full relative transition-colors duration-500 ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-950'}`}>
      <header className={`p-6 sm:p-8 pt-12 sm:pt-16 backdrop-blur-xl border-b flex items-center gap-4 sm:gap-6 sticky top-0 z-20 transition-all duration-500 ${theme === 'light' ? 'bg-white/80 border-slate-200' : 'bg-slate-950/80 border-white/5'}`}>
        <h1 className={`text-xl sm:text-2xl font-display font-bold flex-1 text-glow truncate transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
          {viewMode === 'hierarchy' ? 'Team Hierarchy' : 'Staff Directory'}
        </h1>
        {userRole !== 'employee' && viewMode === 'flat' && (
          <motion.button 
            whileHover={{ rotate: 180, scale: 1.2 }}
            whileTap={{ scale: 0.8, rotate: 360 }}
            onClick={() => setShowAddModal(true)}
            className="p-2.5 sm:p-3 btn-primary rounded-2xl transition-all flex-shrink-0"
          >
            <Plus size={24} strokeWidth={2.5} />
          </motion.button>
        )}
      </header>

      <div className="p-6 sm:p-8 space-y-6">
        <div className="relative group">
          <motion.div
            animate={{ scale: searchQuery ? 1.1 : 1 }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
          >
            <Search className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
          </motion.div>
          <Input 
            placeholder="Search name, role, or dept..." 
            className={`pl-12 h-14 sm:h-16 rounded-[1.5rem] border transition-all text-sm font-medium placeholder:text-slate-600 ${theme === 'light' ? 'bg-white border-slate-300 text-slate-900 focus:ring-indigo-500/10' : 'bg-white/5 border-white/5 text-white focus:bg-white/10 focus:ring-indigo-500/20'}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-2">
          {['All Staff', ...DEPARTMENTS].map(dept => (
            <Badge 
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-4 sm:px-5 py-2 rounded-xl cursor-pointer transition-all text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                selectedDept === dept 
                ? 'bg-indigo-600 text-white border-none shadow-lg shadow-indigo-500/20' 
                : theme === 'light' ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50 shadow-sm' : 'variant-outline border-white/5 bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              {dept}
            </Badge>
          ))}
        </div>
      </div>

      <div className="px-6 sm:px-8">
        <div className="space-y-8 pb-8">
          {viewMode === 'hierarchy' ? (
            <>
              {teamLeaders.map(leader => (
                <div key={leader.id} className="space-y-4">
                  <div className="flex items-center gap-2 ml-1">
                    <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Team: {leader.name.split(' ')[0]}</h4>
                  </div>
                  {renderEmployeeCard(leader)}
                  <div className="space-y-3">
                    {filteredByDept.filter(m => m.leaderId === leader.id).map(member => renderEmployeeCard(member, true))}
                  </div>
                </div>
              ))}

              {unassignedMembers.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 ml-1">
                    <div className="w-1 h-4 bg-slate-500 rounded-full" />
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Independent Contributors</h4>
                  </div>
                  {unassignedMembers.map(member => renderEmployeeCard(member))}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              {filteredByDept.map(emp => renderEmployeeCard(emp))}
            </div>
          )}

          {filteredByDept.length === 0 && (
            <div className="text-center py-16 sm:py-20">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border transition-all duration-500 ${theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/5'}`}>
                <Users className="text-slate-700" size={32} />
              </div>
              <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">No results found</p>
              <p className="text-slate-600 text-xs mt-2">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Employee Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className={`absolute inset-0 backdrop-blur-md ${theme === 'light' ? 'bg-slate-900/40' : 'bg-slate-950/80'}`}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`w-full max-w-sm max-h-[90vh] border rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10 transition-all duration-500 flex flex-col ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-white/10'}`}
            >
              <div className={`p-6 border-b flex justify-between items-center transition-colors duration-500 flex-shrink-0 ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'}`}>
                <h3 className={`font-display font-bold transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Add New Staff</h3>
                <motion.button 
                  whileHover={{ rotate: 135, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowAddModal(false)} 
                  className={`p-2 rounded-xl transition-colors ${theme === 'light' ? 'hover:bg-slate-200 text-slate-400' : 'hover:bg-white/5 text-slate-400'}`}
                >
                  <Plus className="rotate-45" size={20} />
                </motion.button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Full Name</label>
                  <Input 
                    value={newEmp.name}
                    onChange={(e) => setNewEmp({...newEmp, name: e.target.value})}
                    placeholder="e.g. John Doe"
                    className={`rounded-xl h-12 text-sm transition-all ${theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-900' : 'bg-white/5 border-white/10 text-white'}`}
                  />
                </div>
                <div className="space-y-1.5 relative">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Role</label>
                  <div className="relative">
                    <Input 
                      value={roleSearch}
                      onChange={(e) => {
                        setRoleSearch(e.target.value);
                        setShowRoleDropdown(true);
                      }}
                      onFocus={() => setShowRoleDropdown(true)}
                      placeholder="Search or select role..."
                      className={`rounded-xl h-12 text-sm transition-all ${theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-900' : 'bg-white/5 border-white/10 text-white'}`}
                    />
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    
                    <AnimatePresence>
                      {showRoleDropdown && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setShowRoleDropdown(false)} 
                          />
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={`absolute top-full left-0 right-0 mt-2 max-h-48 overflow-y-auto z-50 rounded-xl border shadow-2xl custom-scrollbar ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-white/10'}`}
                          >
                            {filteredRoles.length > 0 ? (
                              filteredRoles.map(role => (
                                <button
                                  key={role}
                                  onClick={() => {
                                    setNewEmp({...newEmp, role});
                                    setRoleSearch(role);
                                    setShowRoleDropdown(false);
                                  }}
                                  className={`w-full text-left px-4 py-3 text-sm transition-colors ${theme === 'light' ? 'hover:bg-slate-50 text-slate-700' : 'hover:bg-white/5 text-slate-300'}`}
                                >
                                  {role}
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-sm text-slate-500 italic">No roles found</div>
                            )}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Gender</label>
                    <div className="relative">
                      <select 
                        value={newEmp.gender}
                        onChange={(e) => setNewEmp({...newEmp, gender: e.target.value as any})}
                        className={`w-full h-12 border rounded-xl px-4 text-sm font-medium outline-none transition-all appearance-none ${theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-900' : 'bg-white/5 border-white/10 text-white'}`}
                      >
                        <option value="Male" className={theme === 'light' ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}>Male</option>
                        <option value="Female" className={theme === 'light' ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}>Female</option>
                        <option value="Other" className={theme === 'light' ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}>Other</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Department</label>
                    <div className="relative">
                      <select 
                        value={newEmp.department}
                        onChange={(e) => setNewEmp({...newEmp, department: e.target.value, leaderId: ''})}
                        className={`w-full h-12 border rounded-xl px-4 text-sm font-medium outline-none transition-all appearance-none ${theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-900' : 'bg-white/5 border-white/10 text-white'}`}
                      >
                        {DEPARTMENTS.map(dept => (
                          <option key={dept} value={dept} className={theme === 'light' ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}>{dept}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Assign to Team / Leader</label>
                  <div className="relative">
                    <select 
                      value={newEmp.leaderId}
                      disabled={newEmp.isTeamLeader}
                      onChange={(e) => setNewEmp({...newEmp, leaderId: e.target.value})}
                      className={`w-full h-12 border rounded-xl px-4 text-sm font-medium outline-none transition-all appearance-none ${newEmp.isTeamLeader ? 'opacity-50 grayscale' : ''} ${theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-900' : 'bg-white/5 border-white/10 text-white'}`}
                    >
                      <option value="" className={theme === 'light' ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}>No Leader (Independent)</option>
                      {employees
                        .filter(emp => emp.isTeamLeader && emp.department === newEmp.department)
                        .map(leader => (
                          <option key={leader.id} value={leader.id} className={theme === 'light' ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}>
                            {leader.name} (Team Leader)
                          </option>
                        ))
                      }
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl border border-dashed border-indigo-500/30 bg-indigo-500/5">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Team Leadership</p>
                    <p className="text-[9px] text-slate-500">Mark this person as a Team Leader</p>
                  </div>
                  <button 
                    onClick={() => setNewEmp(prev => ({ ...prev, isTeamLeader: !prev.isTeamLeader, leaderId: !prev.isTeamLeader ? '' : prev.leaderId }))}
                    className={`w-12 h-6 rounded-full relative transition-all duration-300 ${newEmp.isTeamLeader ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-800'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${newEmp.isTeamLeader ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Hierarchy Level (Locked)</label>
                  <div className={`px-4 h-12 rounded-xl flex items-center text-sm font-bold border ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-indigo-600' : 'bg-white/5 border-white/10 text-indigo-400'}`}>
                    {userRole === 'super_admin' ? 'LEVEL 2: ADMIN / MANAGER' : 'LEVEL 3: EMPLOYEE'}
                  </div>
                  <p className="text-[9px] text-slate-500 mt-1 ml-1 italic">
                    {userRole === 'super_admin' ? 'Super Admin hires Admins.' : 'Admins hire Employees.'}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Email</label>
                  <Input 
                    value={newEmp.email}
                    onChange={(e) => setNewEmp({...newEmp, email: e.target.value})}
                    placeholder="john@company.com"
                    className={`rounded-xl h-12 text-sm transition-all ${theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-900' : 'bg-white/5 border-white/10 text-white'}`}
                  />
                </div>
              </div>
              <div className={`p-4 flex gap-3 transition-colors duration-500 ${theme === 'light' ? 'bg-slate-50' : 'bg-white/5'}`}>
                <Button 
                  onClick={handleAdd}
                  disabled={!newEmp.name || !newEmp.role}
                  className="flex-1 h-12 rounded-xl btn-primary font-bold disabled:opacity-50"
                >
                  Add Staff Member
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmployeeDetailScreen({ employee, onBack, onNavigate, theme, userRole, employees }: { 
  employee: Employee, 
  onBack: () => void,
  onNavigate: (screen: Screen, id: string | null) => void,
  theme: 'dark' | 'light',
  userRole: string | null,
  employees: Employee[]
}) {
  const leader = employees.find(e => e.id === employee.leaderId);
  const teamMembers = employees.filter(e => e.leaderId === employee.id);

  return (
    <div className={`pb-10 min-h-full transition-colors duration-500 ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-950'}`}>
      <header className={`relative h-64 transition-colors duration-500 ${theme === 'light' ? 'bg-indigo-50' : 'bg-slate-900'}`}>
        {/* Background Container with Overflow Hidden */}
        <div className="absolute inset-0 overflow-hidden z-0">
          {/* Profile Background Image */}
          <div className="absolute inset-0">
            {employee.avatar ? (
              <img 
                src={employee.avatar} 
                alt="" 
                className="w-full h-full object-cover blur-lg opacity-80 scale-110"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={`w-full h-full ${theme === 'light' ? 'bg-indigo-100' : 'bg-indigo-900/30'}`} />
            )}
            <div className={`absolute inset-0 transition-colors duration-500 ${theme === 'light' ? 'bg-white/20' : 'bg-slate-950/40'}`} />
          </div>

          {/* Decorative background elements */}
          <div className="absolute inset-0">
            <div className={`absolute top-[-20%] right-[-10%] w-64 h-64 rounded-full blur-[80px] ${theme === 'light' ? 'bg-indigo-600/15' : 'bg-indigo-600/40'}`} />
            <div className={`absolute bottom-[-10%] left-[-10%] w-48 h-48 rounded-full blur-[60px] ${theme === 'light' ? 'bg-emerald-600/15' : 'bg-emerald-600/30'}`} />
          </div>
        </div>
        
        <div className="absolute top-16 left-8 right-8 flex justify-between items-center z-10">
          <motion.button 
            whileHover={{ x: -5, scale: 1.1 }}
            whileTap={{ scale: 0.8, x: -10 }}
            onClick={onBack} 
            className={`p-3 backdrop-blur-xl rounded-2xl transition-all border ${theme === 'light' ? 'bg-white/80 text-slate-600 border-slate-200' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}
          >
            <ChevronLeft size={24} strokeWidth={3} />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.2, rotate: 90 }}
            whileTap={{ scale: 0.8, rotate: 180 }}
            className={`p-3 backdrop-blur-xl rounded-2xl transition-all border ${theme === 'light' ? 'bg-white/80 text-slate-600 border-slate-200' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}
          >
            <MoreVertical size={24} />
          </motion.button>
        </div>
        <div className="absolute -bottom-12 left-8 z-20">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
            <Avatar className={`h-32 w-32 border-8 shadow-2xl transition-all duration-500 ${theme === 'light' ? 'border-white' : 'border-slate-950'}`}>
              <AvatarImage src={employee.avatar} className="object-cover" />
              <AvatarFallback className="bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 text-3xl font-bold">{employee.name[0]}</AvatarFallback>
            </Avatar>
          </motion.div>
        </div>
      </header>

      <div className="mt-16 px-6 sm:px-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h1 className={`text-2xl sm:text-3xl font-display font-bold text-glow truncate transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{employee.name}</h1>
          <p className="text-indigo-600 dark:text-indigo-400 font-bold text-sm sm:text-base mt-1 truncate">{employee.role}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge className={`border px-3 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all duration-500 ${theme === 'light' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>{employee.department}</Badge>
            {employee.isTeamLeader && (
              <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] px-3 py-1 rounded-lg font-bold uppercase tracking-wider">Team Leader</Badge>
            )}
            <Badge className={`border px-3 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all duration-500 ${theme === 'light' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>Active Status</Badge>
          </div>
        </motion.div>

        {/* Team Section */}
        {(leader || teamMembers.length > 0) && (
          <div className="mt-10 space-y-6">
            <h2 className={`text-xl font-display font-bold transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Team & Hierarchy</h2>
            <div className="grid grid-cols-1 gap-4">
              {leader && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => onNavigate('employee-detail', leader.id)}
                  className="card-premium p-5 flex items-center gap-4 cursor-pointer group"
                >
                  <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
                    <Users size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Reports To</p>
                    <p className={`text-sm font-bold group-hover:text-indigo-500 transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{leader.name}</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-500" />
                </motion.div>
              )}
              {teamMembers.length > 0 && (
                <div className="card-premium p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                      <Users size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Direct Reports</p>
                      <p className={`text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{teamMembers.length} Members</p>
                    </div>
                  </div>
                  <div className="flex -space-x-3 overflow-hidden">
                    {teamMembers.slice(0, 5).map(m => (
                      <Avatar key={m.id} className="h-10 w-10 border-4 border-slate-950 shadow-lg">
                        <AvatarImage src={m.avatar} />
                        <AvatarFallback className="bg-indigo-500/20 text-indigo-500 text-xs font-bold">{m.name[0]}</AvatarFallback>
                      </Avatar>
                    ))}
                    {teamMembers.length > 5 && (
                      <div className="h-10 w-10 rounded-full bg-slate-800 border-4 border-slate-950 flex items-center justify-center text-[10px] font-bold text-slate-400">
                        +{teamMembers.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-10 space-y-6">
          <h2 className={`text-xl font-display font-bold transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Contact Information</h2>
          <div className="flex flex-col gap-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card-premium p-5 sm:p-6 overflow-hidden">
              <div className="flex items-center gap-3 text-slate-500 mb-3">
                <motion.div whileHover={{ scale: 1.2, rotate: 10 }}>
                  <Mail size={18} className="flex-shrink-0" />
                </motion.div>
                <span className="text-[10px] uppercase font-bold tracking-widest truncate">Email Address</span>
              </div>
              <p className={`text-xs sm:text-sm font-bold truncate transition-colors duration-500 ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>{employee.email}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card-premium p-5 sm:p-6 overflow-hidden">
              <div className="flex items-center gap-3 text-slate-500 mb-3">
                <motion.div whileHover={{ scale: 1.2, rotate: -10 }}>
                  <Phone size={18} className="flex-shrink-0" />
                </motion.div>
                <span className="text-[10px] uppercase font-bold tracking-widest truncate">Contact Number</span>
              </div>
              <p className={`text-xs sm:text-sm font-bold truncate transition-colors duration-500 ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>{employee.contact}</p>
            </motion.div>
          </div>
        </div>

        <div className="mt-10 space-y-6">
          <h2 className={`text-xl font-display font-bold transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Workforce Actions</h2>
          <div className="grid grid-cols-3 gap-4 sm:gap-5">
            {((userRole === 'super_admin') || (userRole === 'admin' && employee.rbacRole !== 'admin' && employee.rbacRole !== 'super_admin')) && (
              <motion.button 
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => onNavigate('edit-employee', employee.id)}
                className={`flex flex-col items-center gap-4 p-6 sm:p-8 card-premium group transition-all ${theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-white/10'}`}
              >
                <motion.div 
                  whileHover={{ rotate: 15, scale: 1.2 }}
                  whileTap={{ rotate: 30, scale: 0.8 }}
                  className={`p-3 sm:p-4 rounded-[1.2rem] sm:rounded-[1.5rem] transition-transform ${theme === 'light' ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-500/10 text-indigo-400'}`}
                >
                  <Edit size={24} strokeWidth={2.5} />
                </motion.div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Edit</span>
              </motion.button>
            )}
            <motion.button 
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => onNavigate('performance', employee.id)}
              className={`flex flex-col items-center gap-4 p-6 sm:p-8 card-premium group transition-all ${theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-white/10'}`}
            >
              <motion.div 
                whileHover={{ rotate: 25, scale: 1.2 }}
                whileTap={{ rotate: 45, scale: 0.8 }}
                className={`p-3 sm:p-4 rounded-[1.2rem] sm:rounded-[1.5rem] transition-transform ${theme === 'light' ? 'bg-amber-50 text-amber-600' : 'bg-amber-500/10 text-amber-400'}`}
              >
                <Star size={24} strokeWidth={2.5} />
              </motion.div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Review</span>
            </motion.button>
            <motion.button 
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => onNavigate('tasks', employee.id)}
              className={`flex flex-col items-center gap-4 p-6 sm:p-8 card-premium group transition-all ${theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-white/10'}`}
            >
              <motion.div 
                whileHover={{ rotate: -25, scale: 1.2 }}
                whileTap={{ rotate: -45, scale: 0.8 }}
                className={`p-3 sm:p-4 rounded-[1.2rem] sm:rounded-[1.5rem] transition-transform ${theme === 'light' ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-500/10 text-indigo-400'}`}
              >
                <CheckSquare size={24} strokeWidth={2.5} />
              </motion.div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Tasks</span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PerformanceScreen({ employee, onBack, onSave, theme, userRole }: { employee?: Employee, onBack: () => void, onSave: (perf: any) => void, theme: 'dark' | 'light', userRole: string | null }) {
  const [ratings, setRatings] = useState({
    quality: 4,
    timeliness: 5,
    attendance: 4,
    communication: 4,
    innovation: 3
  });
  const [remarks, setRemarks] = useState('');

  const categories = [
    { key: 'quality', label: 'Quality of Work', icon: <Target size={18} /> },
    { key: 'timeliness', label: 'Timeliness', icon: <Clock size={18} /> },
    { key: 'attendance', label: 'Attendance', icon: <UserCheck size={18} /> },
    { key: 'communication', label: 'Communication', icon: <MessageSquare size={18} /> },
    { key: 'innovation', label: 'Innovation / Initiative', icon: <Lightbulb size={18} /> }
  ];

  const handleSave = () => {
    const values = Object.values(ratings) as number[];
    const overallRating = Number((values.reduce((a, b) => a + b, 0) / 5).toFixed(1));
    onSave({
      employeeId: employee?.id,
      ...ratings,
      overallRating,
      remarks
    });
  };

  return (
    <div className={`pb-10 min-h-full transition-colors duration-500 ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-950'}`}>
      <header className={`p-8 pt-16 backdrop-blur-xl border-b flex items-center gap-6 sticky top-0 z-20 transition-all duration-500 ${theme === 'light' ? 'bg-white/80 border-slate-200' : 'bg-slate-950/80 border-white/5'}`}>
        <motion.button 
          whileHover={{ x: -3 }}
          whileTap={{ scale: 0.9 }}
          onClick={onBack} 
          className={`p-3 rounded-2xl transition-all flex-shrink-0 ${theme === 'light' ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-white/5 text-slate-400'}`}
        >
          <ChevronLeft size={24} strokeWidth={3} />
        </motion.button>
        <h1 className={`text-2xl font-display font-bold flex-1 text-glow transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Evaluation</h1>
      </header>

      <div className="p-6 sm:p-8">
        <div className="flex items-center gap-5 sm:gap-6 mb-10 p-6 card-premium overflow-hidden">
          <Avatar className={`h-20 w-20 sm:h-24 sm:w-24 border-4 shadow-xl flex-shrink-0 transition-all duration-500 ${theme === 'light' ? 'border-white' : 'border-slate-950'}`}>
            <AvatarImage src={employee?.avatar} className="object-cover" />
            <AvatarFallback className="bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 font-bold text-3xl">{employee?.name[0]}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h2 className={`text-xl sm:text-2xl font-display font-bold transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{employee?.name}</h2>
            <p className="text-sm sm:text-base text-slate-500 font-medium truncate mt-1">{employee?.role}</p>
          </div>
        </div>

        <div className="space-y-10">
          {categories.map((cat) => (
            <div key={cat.key}>
              <div className="flex justify-between items-center mb-4">
                <div className={`flex items-center gap-2 transition-colors duration-500 ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
                  <motion.div 
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    className="text-indigo-600 dark:text-indigo-400"
                  >
                    {cat.icon}
                  </motion.div>
                  <label className="text-sm font-bold">{cat.label}</label>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-lg border transition-all duration-500 ${theme === 'light' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>{ratings[cat.key as keyof typeof ratings]}/5</span>
              </div>
              <div className="flex justify-between px-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.button 
                    key={star}
                    whileTap={{ scale: 1.4 }}
                    onClick={() => setRatings(prev => ({ ...prev, [cat.key]: star }))}
                    className={`p-1 transition-all ${ratings[cat.key as keyof typeof ratings] >= star ? 'text-amber-400' : theme === 'light' ? 'text-slate-200' : 'text-slate-800'}`}
                  >
                    <Star size={36} fill={ratings[cat.key as keyof typeof ratings] >= star ? 'currentColor' : 'none'} strokeWidth={2} />
                  </motion.button>
                ))}
              </div>
            </div>
          ))}

          <div className="space-y-4">
            <label className="text-sm font-bold text-slate-400 ml-1">Overall Remarks</label>
            <textarea 
              className={`w-full h-40 p-6 rounded-[2rem] border transition-all outline-none text-sm font-medium resize-none leading-relaxed placeholder:text-slate-600 ${theme === 'light' ? 'bg-white border-slate-200 text-slate-900 focus:bg-slate-50 focus:ring-indigo-500/10' : 'bg-white/5 border-white/5 text-white focus:bg-white/10 focus:ring-indigo-500/10'}`}
              placeholder="Provide detailed feedback for the employee..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            ></textarea>
          </div>

          {(userRole === 'admin' || userRole === 'super_admin') && (
            <Button onClick={handleSave} className="w-full h-16 rounded-[1.5rem] btn-primary text-lg font-bold">
              Complete Review
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function AttendanceScreen({ onBack, employees, attendance, onToggle, theme }: { onBack: () => void, employees: Employee[], attendance: Attendance[], onToggle: (id: string, date: string, status: 'Present' | 'Absent') => void, theme: 'dark' | 'light' }) {
  const [selectedDate, setSelectedDate] = useState('2024-05-13');
  const [showCalendar, setShowCalendar] = useState(false);
  const [shiftType, setShiftType] = useState<'General' | 'Night' | 'Morning'>('General');
  const [manualDate, setManualDate] = useState('2024-05-13');
  
  useEffect(() => {
    setManualDate(selectedDate);
  }, [selectedDate]);
  
  useEffect(() => {
    console.log('AttendanceScreen loaded for date:', selectedDate);
  }, [selectedDate]);

  // Generate last 7 days for the quick badges
  const availableDates = useMemo(() => {
    const dates = [];
    const baseDate = new Date('2024-05-13');
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, []);

  return (
    <div className={`pb-10 min-h-full relative transition-colors duration-500 ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-950'}`}>
      <header className={`p-6 sm:p-8 pt-12 sm:pt-16 backdrop-blur-xl border-b flex items-center gap-4 sm:gap-6 sticky top-0 z-20 transition-all duration-500 ${theme === 'light' ? 'bg-white border-slate-300' : 'bg-slate-950/80 border-white/5'}`}>
        <motion.button 
          whileHover={{ x: -3 }}
          whileTap={{ scale: 0.9 }}
          onClick={onBack} 
          className={`p-2.5 sm:p-3 rounded-2xl transition-all flex-shrink-0 ${theme === 'light' ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-white/5 text-slate-400'}`}
        >
          <ChevronLeft size={24} strokeWidth={3} />
        </motion.button>
        <h1 className={`text-xl sm:text-2xl font-display font-bold flex-1 text-glow truncate transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Attendance</h1>
      </header>

      <div className="p-6 sm:p-8 space-y-6 sm:space-y-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Quick Access</label>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowCalendar(true)}
              className={`h-8 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center gap-1.5 transition-colors ${theme === 'light' ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' : 'text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10'}`}
            >
              <Calendar size={12} />
              Full Calendar
            </Button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4">
            {availableDates.map(date => (
              <button 
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`px-6 py-3 rounded-2xl cursor-pointer transition-all text-[11px] font-bold uppercase tracking-wider whitespace-nowrap border flex-shrink-0 ${
                  selectedDate === date 
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20' 
                  : theme === 'light' ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50' : 'border-white/5 bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {date === '2024-05-13' ? 'Today' : date}
              </button>
            ))}
          </div>
        </div>

        <div 
          onClick={() => setShowCalendar(true)}
          className={`card-premium p-6 flex items-center justify-between overflow-hidden cursor-pointer active:scale-[0.98] transition-all border ${theme === 'light' ? 'bg-indigo-50 border-indigo-200' : 'bg-indigo-500/5 border-indigo-500/20'}`}
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className={`p-3 rounded-2xl flex-shrink-0 transition-colors ${theme === 'light' ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-500/10 text-indigo-400'}`}>
              <Calendar size={28} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest truncate mb-1">Active Intelligence Log</p>
              <span className={`font-bold text-base truncate block transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-slate-200'}`}>{selectedDate} <span className="text-indigo-400/60 ml-2">({shiftType})</span></span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={`border-none text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-xl transition-colors ${theme === 'light' ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/20 text-emerald-400'}`}>Live Sync</Badge>
            <span className="text-[9px] text-indigo-400/60 font-bold uppercase tracking-tighter">Tap to change</span>
          </div>
        </div>

        <div className="space-y-4">
          {employees.map((emp, i) => {
            const att = attendance.find(a => a.employeeId === emp.id && a.date === selectedDate);
            return (
              <motion.div 
                key={emp.id} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card-premium p-4 sm:p-5 flex items-center gap-4 sm:gap-5 overflow-hidden"
              >
                <Avatar className={`h-10 w-10 sm:h-12 sm:w-12 border-2 shadow-lg flex-shrink-0 transition-all duration-500 ${theme === 'light' ? 'border-slate-100' : 'border-white/5'}`}>
                  <AvatarImage src={emp.avatar} className="object-cover" />
                  <AvatarFallback className="bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 font-bold">{emp.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-sm truncate transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-slate-200'}`}>{emp.name}</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest truncate">{emp.department}</p>
                </div>
                <div className="flex gap-2 sm:gap-3 flex-shrink-0">
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.8, rotate: 15 }}
                    onClick={() => onToggle(emp.id, selectedDate, 'Present')}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl font-bold transition-all flex items-center justify-center ${att?.status === 'Present' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : theme === 'light' ? 'bg-slate-100 text-slate-400 hover:bg-slate-200' : 'bg-white/5 text-slate-600 hover:bg-white/10'}`}
                  >
                    P
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.8, rotate: -15 }}
                    onClick={() => onToggle(emp.id, selectedDate, 'Absent')}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl font-bold transition-all flex items-center justify-center ${att?.status === 'Absent' ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20' : theme === 'light' ? 'bg-slate-100 text-slate-400 hover:bg-slate-200' : 'bg-white/5 text-slate-600 hover:bg-white/10'}`}
                  >
                    A
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Calendar Modal */}
      <AnimatePresence>
        {showCalendar && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCalendar(false)}
              className={`absolute inset-0 backdrop-blur-md ${theme === 'light' ? 'bg-slate-900/40' : 'bg-slate-950/80'}`}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`w-full max-w-sm border rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10 transition-all duration-500 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-white/10'}`}
            >
              <div className={`p-6 border-b flex justify-between items-center transition-colors duration-500 ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'}`}>
                <h3 className={`font-display font-bold transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Select Date</h3>
                <button onClick={() => setShowCalendar(false)} className={`p-2 rounded-xl transition-colors ${theme === 'light' ? 'hover:bg-slate-200 text-slate-400' : 'hover:bg-white/5 text-slate-400'}`}>
                  <Plus className="rotate-45" size={20} />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Select Shift Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['General', 'Morning', 'Night'] as const).map(type => (
                      <button 
                        key={type}
                        onClick={() => setShiftType(type)}
                        className={`py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${shiftType === type ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Date (Type or Pick)</label>
                  <div className="space-y-2">
                    <input 
                      type="text" 
                      placeholder="YYYY-MM-DD"
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                      className={`w-full h-12 border rounded-xl px-4 font-bold outline-none transition-all text-sm ${theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-900 focus:bg-white focus:ring-indigo-500/10' : 'bg-white/5 border-white/10 text-white focus:ring-indigo-500/20'}`}
                    />
                    <input 
                      type="date" 
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                      className={`w-full h-12 border rounded-xl px-4 font-bold outline-none transition-all text-sm ${theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-900 focus:bg-white focus:ring-indigo-500/10' : 'bg-white/5 border-white/10 text-white focus:ring-indigo-500/20'}`}
                    />
                  </div>
                </div>
                
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest text-center opacity-60 italic">Format: YYYY-MM-DD</p>
              </div>
              <div className={`p-4 flex gap-3 transition-colors duration-500 ${theme === 'light' ? 'bg-slate-50' : 'bg-white/5'}`}>
                <Button 
                  onClick={() => {
                    setSelectedDate(manualDate);
                    setShowCalendar(false);
                  }} 
                  className="flex-1 h-12 rounded-xl btn-primary font-bold"
                >
                  Apply Changes
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AnalyticsScreen({ onBack, employees, performance, onNavigate, theme, userRole, userDepartment }: { onBack: () => void, employees: Employee[], performance: Performance[], onNavigate: (screen: Screen, id: string | null) => void, theme: 'dark' | 'light', userRole: string | null, userDepartment: string | null }) {
  const [isMounted, setIsMounted] = React.useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chartScrollRef = useRef<HTMLDivElement>(null);
  const roleScrollRef = useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const scroll = (direction: 'up' | 'down') => {
    if (scrollRef.current) {
      const { scrollTop } = scrollRef.current;
      const scrollAmount = 240; // Approximate height of 3-4 rows
      scrollRef.current.scrollTo({
        top: direction === 'up' ? scrollTop - scrollAmount : scrollTop + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollChart = (direction: 'left' | 'right') => {
    if (chartScrollRef.current) {
      const { scrollLeft } = chartScrollRef.current;
      const scrollAmount = 240; // Approximate width of 3 bars
      chartScrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollRoles = (direction: 'up' | 'down') => {
    if (roleScrollRef.current) {
      const { scrollTop } = roleScrollRef.current;
      const scrollAmount = 120; // Approximate height of 4 rows
      roleScrollRef.current.scrollTo({
        top: direction === 'up' ? scrollTop - scrollAmount : scrollTop + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const performanceData = employees.map(emp => {
    const perf = performance.filter(p => p.employeeId === emp.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    return {
      id: emp.id,
      name: emp.name.split(' ')[0],
      fullName: emp.name,
      rating: perf ? perf.overallRating : 0
    };
  }).sort((a, b) => b.rating - a.rating);

  const roleCounts = TECH_ROLES.reduce((acc: any, role) => {
    acc[role] = 0;
    return acc;
  }, {});

  employees.forEach(emp => {
    if (roleCounts[emp.role] !== undefined) {
      roleCounts[emp.role]++;
    } else {
      roleCounts[emp.role] = 1;
    }
  });

  const roleData = Object.keys(roleCounts).map(name => ({
    name,
    value: roleCounts[name]
  })).sort((a, b) => b.value - a.value);

  // Only show roles with members in the actual Pie chart to keep it clean
  const chartData = roleData.filter(d => d.value > 0);

  const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#8b5cf6'];

  return (
    <div className={`pb-10 min-h-full transition-colors duration-500 ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-950'}`}>
      <header className={`p-8 pt-16 backdrop-blur-xl border-b flex items-center gap-6 sticky top-0 z-20 transition-all duration-500 ${theme === 'light' ? 'bg-white border-slate-300' : 'bg-slate-950/80 border-white/5'}`}>
        <h1 className={`text-2xl font-display font-bold flex-1 text-glow transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Analytics</h1>
      </header>

      <div className="p-8">
        <div className="space-y-10">
          <Card className={`rounded-[2.5rem] shadow-2xl overflow-hidden backdrop-blur-xl p-0 transition-all duration-500 ${theme === 'light' ? 'bg-white border-slate-300' : 'bg-white/5 border-white/5'}`}>
            <CardHeader className={`border-b p-8 transition-colors duration-500 ${theme === 'light' ? 'bg-slate-200/50 border-slate-300' : 'bg-white/5 border-white/5'}`}>
              <div className="flex items-center justify-between">
                <CardTitle className={`text-base font-bold flex items-center gap-4 transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  <div className={`p-2.5 rounded-xl transition-colors ${theme === 'light' ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-500/10 text-indigo-400'}`}>
                    <TrendingUp size={20} />
                  </div>
                  Performance Metrics
                </CardTitle>
                <div className="flex items-center gap-1">
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => scrollChart('left')}
                    className={`p-1.5 rounded-lg border transition-all ${theme === 'light' ? 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600' : 'bg-white/5 border-white/10 text-slate-500 hover:text-indigo-400'}`}
                  >
                    <ChevronLeft size={14} strokeWidth={3} />
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => scrollChart('right')}
                    className={`p-1.5 rounded-lg border transition-all ${theme === 'light' ? 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600' : 'bg-white/5 border-white/10 text-slate-500 hover:text-indigo-400'}`}
                  >
                    <ChevronRight size={14} strokeWidth={3} />
                  </motion.button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div 
                ref={chartScrollRef}
                className="h-64 w-full overflow-x-auto pb-4 custom-scrollbar-interaction"
              >
                <div style={{ minWidth: Math.max(performanceData.length * 80, 300) }} className="h-full">
                  {isMounted && performanceData.length > 0 ? (
                    <ResponsiveContainer width="99%" height={256} minWidth={0} minHeight={0} debounce={50}>
                      <BarChart data={performanceData} margin={{ left: -35, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} domain={[0, 5]} />
                        <Tooltip 
                          cursor={{ fill: theme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)' }}
                          contentStyle={{ 
                            borderRadius: '16px', 
                            backgroundColor: theme === 'light' ? '#ffffff' : '#0f172a', 
                            border: theme === 'light' ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.1)', 
                            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', 
                            padding: '12px' 
                          }}
                          itemStyle={{ color: theme === 'light' ? '#0f172a' : '#ffffff' }}
                        />
                        <Bar dataKey="rating" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className={`h-full w-full flex items-center justify-center rounded-[1.5rem] border transition-all duration-500 ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'}`}>
                      <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">Insufficient Data</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl transition-colors ${theme === 'light' ? 'bg-amber-100 text-amber-600' : 'bg-amber-500/10 text-amber-400'}`}>
                  <Award size={20} />
                </div>
                <h2 className={`text-xl font-display font-bold transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Leaderboard</h2>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => scroll('up')}
                  className={`p-1.5 rounded-lg border transition-all active:scale-90 ${theme === 'light' ? 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600' : 'bg-white/5 border-white/10 text-slate-500 hover:text-indigo-400'}`}
                >
                  <ChevronUp size={14} strokeWidth={3} />
                </button>
                <button 
                  onClick={() => scroll('down')}
                  className={`p-1.5 rounded-lg border transition-all active:scale-90 ${theme === 'light' ? 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600' : 'bg-white/5 border-white/10 text-slate-500 hover:text-indigo-400'}`}
                >
                  <ChevronDown size={14} strokeWidth={3} />
                </button>
              </div>
            </div>
            <div className="card-premium p-0 overflow-hidden relative group">
              <div 
                ref={scrollRef}
                className="max-h-[240px] overflow-y-auto custom-scrollbar"
              >
                <Table>
                <TableHeader className={theme === 'light' ? 'bg-slate-200/50' : 'bg-white/5'}>
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="w-16 text-center font-bold text-[10px] uppercase tracking-widest py-4">Sr. No</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest py-4">Name</TableHead>
                    <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest pr-8 py-4">Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performanceData.sort((a, b) => b.rating - a.rating).map((item, i) => {
                    const emp = employees.find(e => e.id === item.id);
                    return (
                      <TableRow 
                        key={item.id} 
                        onClick={() => onNavigate('employee-detail', item.id)}
                        className={`cursor-pointer transition-colors border-none ${theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}
                      >
                        <TableCell className="text-center py-4">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${i === 0 ? 'bg-amber-400 text-slate-900' : i === 1 ? 'bg-slate-300 text-slate-900' : 'bg-orange-400 text-slate-900'}`}>
                            {i + 1}
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border shadow-sm">
                              <AvatarImage src={emp?.avatar} />
                              <AvatarFallback className="bg-indigo-500/10 text-indigo-500 font-bold">{item.fullName[0]}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className={`font-bold text-sm truncate transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{item.fullName}</p>
                              <p className="text-[10px] text-slate-500 truncate">{emp?.role}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8 py-4">
                          <div className="flex items-center justify-end gap-1.5 text-amber-500 font-bold">
                            <Star size={14} fill="currentColor" />
                            <span className={`text-sm transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{item.rating.toFixed(1)}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
            </div>
          </section>

          <Card className={`rounded-[2.5rem] shadow-2xl overflow-hidden backdrop-blur-xl p-0 transition-all duration-500 ${theme === 'light' ? 'bg-white border-slate-300' : 'bg-white/5 border-white/5'}`}>
            <CardHeader className={`border-b p-8 transition-colors duration-500 ${theme === 'light' ? 'bg-emerald-50/80 border-slate-300' : 'bg-emerald-500/5 border-white/5'}`}>
              <div className="flex items-center justify-between">
                <CardTitle className={`text-base font-bold flex items-center gap-4 transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  <div className={`p-2.5 rounded-xl transition-colors ${theme === 'light' ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    <Briefcase size={20} />
                  </div>
                  Role Distribution
                </CardTitle>
                <div className="flex items-center gap-1">
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => scrollRoles('up')}
                    className={`p-1.5 rounded-lg border transition-all ${theme === 'light' ? 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600' : 'bg-white/5 border-white/10 text-slate-500 hover:text-indigo-400'}`}
                  >
                    <ChevronUp size={14} strokeWidth={3} />
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => scrollRoles('down')}
                    className={`p-1.5 rounded-lg border transition-all ${theme === 'light' ? 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600' : 'bg-white/5 border-white/10 text-slate-500 hover:text-indigo-400'}`}
                  >
                    <ChevronDown size={14} strokeWidth={3} />
                  </motion.button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="h-64 w-full flex items-center justify-center">
                {isMounted ? (
                  <ResponsiveContainer width="99%" height={256} minWidth={0} minHeight={0} debounce={50}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={90}
                        paddingAngle={8}
                        dataKey="value"
                        stroke="none"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '16px', 
                          backgroundColor: theme === 'light' ? '#ffffff' : '#0f172a', 
                          border: theme === 'light' ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.1)',
                          padding: '12px' 
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className={`h-full w-full animate-pulse rounded-[1.5rem] ${theme === 'light' ? 'bg-slate-100' : 'bg-white/5'}`} />
                )}
              </div>
              <div 
                ref={roleScrollRef}
                className="max-h-48 overflow-y-auto mt-6 pr-2 custom-scrollbar"
              >
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {roleData.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.value > 0 ? COLORS[i % COLORS.length] : (theme === 'light' ? '#e2e8f0' : '#1e293b') }}></div>
                        <span className={`text-[9px] font-bold uppercase tracking-widest truncate ${d.value > 0 ? (theme === 'light' ? 'text-slate-700' : 'text-slate-300') : 'text-slate-500 opacity-50'}`}>{d.name}</span>
                      </div>
                      <span className={`text-[9px] font-mono font-bold ${d.value > 0 ? 'text-indigo-500' : 'text-slate-500 opacity-30'}`}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ReportScreen({ onBack, onExport, theme, userRole, userDepartment }: { onBack: () => void, onExport: (type: string) => void, theme: 'dark' | 'light', userRole: string | null, userDepartment: string | null }) {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const departments = [
    { name: 'Engineering', val: 92, color: 'bg-indigo-500' },
    { name: 'Product', val: 78, color: 'bg-emerald-500' },
    { name: 'Design', val: 85, color: 'bg-rose-500' },
    { name: 'Marketing', val: 72, color: 'bg-amber-500' },
    { name: 'Sales', val: 88, color: 'bg-sky-500' }
  ];

  const filteredDepartments = useMemo(() => {
    if (userRole === 'admin' && userDepartment) {
      return departments.filter(d => d.name === userDepartment);
    }
    return departments;
  }, [userRole, userDepartment]);

  if (selectedReport) {
    return (
      <div className={`min-h-full transition-colors duration-500 ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-950'}`}>
        <header className={`p-6 sm:p-8 pt-12 sm:pt-16 backdrop-blur-xl border-b flex items-center gap-4 sm:gap-6 sticky top-0 z-20 transition-all duration-500 ${theme === 'light' ? 'bg-white border-slate-300' : 'bg-slate-950/80 border-white/5'}`}>
          <button onClick={() => setSelectedReport(null)} className={`p-2.5 sm:p-3 rounded-2xl transition-all active:scale-90 flex-shrink-0 ${theme === 'light' ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-white/5 text-slate-400'}`}>
            <ChevronLeft size={24} strokeWidth={3} />
          </button>
          <h1 className={`text-xl sm:text-2xl font-display font-bold flex-1 text-glow truncate transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Report Detail</h1>
        </header>
        
        <div className="p-6 sm:p-8 space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className={`rounded-[2.5rem] backdrop-blur-xl p-8 shadow-2xl transition-all duration-500 border ${theme === 'light' ? 'bg-white border-slate-300' : 'bg-white/5 border-indigo-500/10'}`}>
              <div className="flex items-center gap-5 mb-8">
                <div className={`p-4 rounded-2xl transition-colors ${theme === 'light' ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-500/10 text-indigo-400'}`}>
                  <FileText size={28} />
                </div>
                <div>
                  <h3 className={`text-xl font-display font-bold transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{selectedReport}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1.5">Generated on May 12, 2024</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <h4 className={`text-sm font-bold uppercase tracking-wider transition-colors duration-500 ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>Executive Summary</h4>
                <p className={`text-base leading-relaxed transition-colors duration-500 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                  This intelligence audit confirms a significant upward trend in operational efficiency. 
                  MindMatrix protocols have successfully optimized cross-departmental workflows, 
                  resulting in a 14% reduction in task latency.
                </p>
              </div>
            </Card>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="card-premium p-5">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Efficiency</p>
              <p className="text-2xl font-display font-bold text-emerald-400">98.2%</p>
              <div className={`mt-2 h-1 w-full rounded-full overflow-hidden transition-colors duration-500 ${theme === 'light' ? 'bg-slate-100' : 'bg-white/5'}`}>
                <div className="h-full bg-emerald-500" style={{ width: '98%' }} />
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="card-premium p-5">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Risk Level</p>
              <p className="text-2xl font-display font-bold text-indigo-400">Low</p>
              <div className={`mt-2 h-1 w-full rounded-full overflow-hidden transition-colors duration-500 ${theme === 'light' ? 'bg-slate-100' : 'bg-white/5'}`}>
                <div className="h-full bg-indigo-500" style={{ width: '15%' }} />
              </div>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className={`rounded-[2.5rem] backdrop-blur-xl p-8 transition-all duration-500 ${theme === 'light' ? 'bg-white border-slate-300' : 'bg-white/5 border-white/5'}`}>
              <h4 className={`text-sm font-bold uppercase tracking-wider mb-8 transition-colors duration-500 ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>Departmental Impact</h4>
              <div className="space-y-6">
                {filteredDepartments.map((dept, i) => (
                  <div key={dept.name} className="space-y-2">
                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                      <span className="text-slate-400">{dept.name}</span>
                      <span className={theme === 'light' ? 'text-slate-900' : 'text-white'}>{dept.val}%</span>
                    </div>
                    <div className={`h-1.5 w-full rounded-full overflow-hidden transition-colors duration-500 ${theme === 'light' ? 'bg-slate-100' : 'bg-white/5'}`}>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${dept.val}%` }}
                        transition={{ delay: 0.5 + (i * 0.1), duration: 1 }}
                        className={`h-full ${dept.color}`} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          <Button onClick={() => onExport('PDF')} className="w-full h-16 rounded-2xl btn-primary font-bold text-base shadow-indigo-500/20">
            <Download size={20} className="mr-2" />
            Download Intelligence Report
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`pb-10 min-h-full transition-colors duration-500 ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-950'}`}>
      <header className={`p-6 sm:p-8 pt-12 sm:pt-16 backdrop-blur-xl border-b flex items-center gap-4 sm:gap-6 sticky top-0 z-20 transition-all duration-500 ${theme === 'light' ? 'bg-white border-slate-300' : 'bg-slate-950/80 border-white/5'}`}>
        <h1 className={`text-xl sm:text-2xl font-display font-bold flex-1 text-glow truncate transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Reports</h1>
      </header>
      
      <div className="p-4 sm:p-8">
        <div className="space-y-10">
          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Data Filters</label>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <Select>
                <SelectTrigger className={`w-full h-14 rounded-2xl border shadow-sm px-3 sm:px-4 text-xs sm:text-sm transition-all ${theme === 'light' ? 'bg-white border-slate-300 text-slate-700' : 'bg-white/5 border-white/5 text-slate-300 focus:ring-indigo-500/20'}`}>
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent className={`rounded-2xl border transition-all ${theme === 'light' ? 'bg-white border-slate-300 text-slate-700' : 'bg-slate-900 border-white/10 text-slate-300'}`}>
                  <SelectItem value="all">All Staff</SelectItem>
                  <SelectItem value="eng">Engineering</SelectItem>
                  <SelectItem value="prod">Product</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className={`w-full h-14 rounded-2xl border shadow-sm px-3 sm:px-4 text-xs sm:text-sm transition-all ${theme === 'light' ? 'bg-white border-slate-300 text-slate-700' : 'bg-white/5 border-white/5 text-slate-300 focus:ring-indigo-500/20'}`}>
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent className={`rounded-2xl border transition-all ${theme === 'light' ? 'bg-white border-slate-300 text-slate-700' : 'bg-slate-900 border-white/10 text-slate-300'}`}>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="quarter">Quarterly</SelectItem>
                  <SelectItem value="year">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card className={`rounded-[2.5rem] border-dashed border-2 shadow-none transition-all duration-500 ${theme === 'light' ? 'bg-white border-slate-300' : 'bg-white/5 border-white/5'}`}>
            <CardContent className="p-12 text-center">
              <motion.div 
                whileHover={{ y: -5 }}
                className={`w-20 h-20 rounded-[2rem] shadow-2xl flex items-center justify-center mx-auto mb-6 border transition-all duration-500 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-white/5'}`}
              >
                <FileText className="text-indigo-400" size={36} strokeWidth={2.5} />
              </motion.div>
              <h3 className={`text-xl font-display font-bold transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Performance Summary</h3>
              <p className="text-slate-500 text-xs font-medium mt-2">Ready for export • May 2024</p>
              <div className="flex gap-3 mt-10">
                <Button onClick={() => onExport('CSV')} className="flex-1 h-14 rounded-2xl btn-primary gap-2 font-bold">
                  <Download size={18} />
                  CSV
                </Button>
                <Button onClick={() => onExport('Text')} variant="outline" className={`flex-1 h-14 rounded-2xl font-bold transition-all ${theme === 'light' ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50' : 'border-white/5 bg-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10'}`}>
                  <FileText size={18} />
                  Text
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Upcoming Reports</h3>
            <div className="grid gap-4">
              <motion.div 
                whileHover={{ scale: 1.01 }}
                onClick={() => setSelectedReport('Monthly Payroll Summary')}
                className={`card-premium p-4 sm:p-5 flex items-center justify-between overflow-hidden cursor-pointer border transition-all duration-500 ${theme === 'light' ? 'bg-indigo-50 border-indigo-200' : 'bg-indigo-500/5 border-indigo-500/10'}`}
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className={`p-2.5 sm:p-3 rounded-2xl flex-shrink-0 transition-colors ${theme === 'light' ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-500/10 text-indigo-400'}`}>
                    <Calendar size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-bold truncate transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-slate-200'}`}>Monthly Payroll Summary</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 truncate">Scheduled for May 30</p>
                  </div>
                </div>
                <Badge className={`border-none text-[9px] flex-shrink-0 ml-2 transition-colors ${theme === 'light' ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-500/20 text-indigo-400'}`}>Scheduled</Badge>
              </motion.div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Recent Archives</h3>
            <div className="grid gap-4">
              {[1, 2].map((i) => {
                const reportName = i === 1 ? 'Q1_Performance_Audit.csv' : 'Annual_Tax_Report.pdf';
                return (
                  <motion.div 
                    key={i} 
                    whileHover={{ scale: 1.01 }}
                    onClick={() => setSelectedReport(reportName)}
                    className="card-premium p-4 sm:p-5 flex items-center justify-between overflow-hidden cursor-pointer"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className={`p-2.5 sm:p-3 rounded-2xl flex-shrink-0 transition-colors ${theme === 'light' ? 'bg-rose-100 text-rose-600' : 'bg-rose-500/10 text-rose-400'}`}>
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-bold truncate transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-slate-200'}`}>{reportName}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 truncate">Generated {i === 1 ? '2 days ago' : '1 week ago'}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className={`h-9 sm:h-10 px-3 sm:px-5 rounded-xl font-bold transition-all flex-shrink-0 ml-2 ${theme === 'light' ? 'bg-white border-slate-300 text-indigo-600 hover:bg-slate-50 shadow-sm' : 'border-white/5 bg-white/5 text-indigo-400 hover:bg-white/10'}`}>
                      View
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskScreen({ onBack, tasks, onAddTask, onUpdateStatus, initialFilter, theme, userRole, userId }: { onBack: () => void, tasks: Task[], onAddTask: (task: any) => void, onUpdateStatus: (id: string, status: 'Pending' | 'In Progress' | 'Completed') => void, initialFilter?: string | null, theme: 'dark' | 'light', userRole: string | null, userId: string | undefined }) {
  const [filter, setFilter] = useState(initialFilter || 'All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [roleSearch, setRoleSearch] = useState('All');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [newTask, setNewTask] = useState({ 
    description: '', 
    details: '',
    targetRole: 'All',
    priority: 'Medium' as 'Low' | 'Medium' | 'High',
    assignedDate: new Date().toISOString().split('T')[0],
    deadline: new Date().toISOString().split('T')[0]
  });
  const isFiltered = initialFilter === 'Pending' || initialFilter === 'Completed';
  
  const roles = ['All', ...TECH_ROLES];

  const filteredRoles = roles.filter(r => 
    r.toLowerCase().includes(roleSearch.toLowerCase())
  );

  const filteredTasks = tasks.filter(task => {
    // Role-based filtering: Employees only see their own tasks
    if (userRole === 'employee' && userId) {
      if (task.employeeId !== userId) return false;
    }
    const statusMatch = filter === 'All' ? true : (filter === 'Pending' ? task.status !== 'Completed' : (filter === 'Completed' ? task.status === 'Completed' : task.status === filter));
    const roleMatch = roleFilter === 'All' ? true : task.targetRole === roleFilter;
    return statusMatch && roleMatch;
  });

  const getTitle = () => {
    if (initialFilter === 'Pending') return 'Pending Tasks';
    if (initialFilter === 'Completed') return 'Completed Tasks';
    return 'Workforce Tasks';
  };

  const handleAddTask = () => {
    if (!newTask.description) return;
    onAddTask(newTask);
    setNewTask({ 
      description: '', 
      details: '',
      targetRole: 'All',
      priority: 'Medium',
      assignedDate: new Date().toISOString().split('T')[0],
      deadline: new Date().toISOString().split('T')[0]
    });
    setRoleSearch('');
    setShowAddModal(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-rose-500/10 text-rose-400';
      case 'Medium': return 'bg-amber-500/10 text-amber-400';
      case 'Low': return 'bg-emerald-500/10 text-emerald-400';
      default: return theme === 'light' ? 'bg-slate-100 text-slate-500' : 'bg-white/5 text-slate-500';
    }
  };

  return (
    <div className={`pb-10 min-h-full transition-colors duration-500 ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-950'}`}>
      <header className={`p-6 sm:p-8 pt-12 sm:pt-16 backdrop-blur-xl border-b flex items-center gap-4 sm:gap-6 sticky top-0 z-20 transition-all duration-500 ${theme === 'light' ? 'bg-white/80 border-slate-200' : 'bg-slate-950/80 border-white/5'}`}>
        <motion.button 
          whileHover={{ x: -3 }}
          whileTap={{ scale: 0.9 }}
          onClick={onBack} 
          className={`p-2.5 sm:p-3 rounded-2xl transition-all flex-shrink-0 ${theme === 'light' ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-white/5 text-slate-400'}`}
        >
          <ChevronLeft size={24} strokeWidth={3} />
        </motion.button>
        <h1 className={`text-xl sm:text-2xl font-display font-bold flex-1 text-glow truncate transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{getTitle()}</h1>
      </header>
      
      <div className="p-4 sm:p-8">
        <div className="space-y-8">
          {!isFiltered && (userRole === 'admin' || userRole === 'super_admin') && (
            <Button onClick={() => setShowAddModal(true)} className="w-full h-14 sm:h-16 rounded-[1.5rem] btn-primary gap-3 font-bold">
              <Plus size={24} strokeWidth={2.5} />
              New Task
            </Button>
          )}

          {!isFiltered && (
            <div className="space-y-4">
              <div className="flex gap-3 overflow-x-auto pb-2">
                {['All', 'Pending', 'In Progress', 'Completed'].map(f => (
                  <Badge 
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 sm:px-5 py-2 rounded-xl cursor-pointer transition-all text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                      filter === f 
                      ? 'bg-indigo-600 text-white border-none shadow-lg shadow-indigo-500/20' 
                      : theme === 'light' ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50 shadow-sm' : 'variant-outline border-white/5 bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {f}
                  </Badge>
                ))}
              </div>
              {userRole !== 'employee' && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center mr-2">Role:</span>
                  {roles.map(r => (
                    <Badge 
                      key={r}
                      onClick={() => setRoleFilter(r)}
                      className={`px-4 py-1.5 rounded-lg cursor-pointer transition-all text-[9px] font-bold uppercase tracking-wider whitespace-nowrap ${
                        roleFilter === r 
                        ? 'bg-emerald-600 text-white border-none shadow-lg shadow-emerald-500/20' 
                        : theme === 'light' ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {r}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-4 sm:space-y-5">
            {filteredTasks.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card 
                  onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                  className={`rounded-[2.5rem] shadow-2xl backdrop-blur-xl p-0 transition-all cursor-pointer overflow-hidden border ${theme === 'light' ? 'bg-white border-slate-300 hover:bg-slate-50' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                >
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex justify-between items-start mb-4 sm:mb-6">
                      <div className="flex flex-wrap gap-2">
                        <Badge className={`text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-xl border-none flex-shrink-0 ${getPriorityColor(task.priority)}`}>
                          {task.priority} Priority
                        </Badge>
                        {task.targetRole && task.targetRole !== 'All' && (
                          <Badge className={`text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-xl border-none flex-shrink-0 ${theme === 'light' ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-500/20 text-indigo-400'}`}>
                            {task.targetRole}
                          </Badge>
                        )}
                      </div>
                      <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-xl flex-shrink-0 ml-2 ${task.status === 'Completed' ? 'text-emerald-400 border-emerald-500/20' : task.status === 'In Progress' ? 'text-indigo-400 border-indigo-500/20' : 'text-amber-400 border-amber-500/20'}`}>
                        {task.status}
                      </Badge>
                    </div>
                    <h3 className={`font-bold text-lg mb-3 leading-relaxed transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-slate-200'} ${expandedTaskId === task.id ? '' : 'line-clamp-2'}`}>{task.description}</h3>
                    
                    <AnimatePresence>
                      {expandedTaskId === task.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mb-6 overflow-hidden"
                        >
                          {task.details && (
                            <p className={`text-sm leading-relaxed mb-6 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                              {task.details}
                            </p>
                          )}
                          
                          {userRole === 'employee' && task.status !== 'Completed' && (
                            <div className="flex gap-2 mt-4">
                              {task.status === 'Pending' && (
                                <Button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateStatus(task.id, 'In Progress');
                                  }}
                                  className="flex-1 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                                >
                                  Start Task
                                </Button>
                              )}
                              {task.status === 'In Progress' && (
                                <Button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateStatus(task.id, 'Completed');
                                  }}
                                  className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                                >
                                  Mark Completed
                                </Button>
                              )}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-2">
                      <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        <Plus size={14} className="flex-shrink-0 text-indigo-500" />
                        <span className="truncate">Assigned: {task.assignedDate}</span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        <Calendar size={14} className="flex-shrink-0 text-rose-500" />
                        <span className="truncate">Deadline: {task.deadline}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {filteredTasks.length === 0 && (
              <div className="text-center py-16 sm:py-20">
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border transition-all duration-500 ${theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/5'}`}>
                  <CheckSquare className="text-slate-700" size={32} />
                </div>
                <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">No tasks found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className={`absolute inset-0 backdrop-blur-md ${theme === 'light' ? 'bg-slate-900/40' : 'bg-slate-950/80'}`}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`w-full max-w-sm border rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10 transition-all duration-500 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-white/10'}`}
            >
              <div className={`p-6 border-b flex justify-between items-center transition-colors duration-500 ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'}`}>
                <h3 className={`font-display font-bold transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>New Task</h3>
                <motion.button 
                  whileHover={{ rotate: 135, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowAddModal(false)} 
                  className={`p-2 rounded-xl transition-colors ${theme === 'light' ? 'hover:bg-slate-200 text-slate-400' : 'hover:bg-white/5 text-slate-400'}`}
                >
                  <Plus className="rotate-45" size={20} />
                </motion.button>
              </div>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Task Title</label>
                  <Input 
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    placeholder="e.g. Complete Q3 Report"
                    className={`rounded-xl h-12 text-sm transition-all ${theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-900' : 'bg-white/5 border-white/10 text-white'}`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Task Details</label>
                  <textarea 
                    value={newTask.details}
                    onChange={(e) => setNewTask({...newTask, details: e.target.value})}
                    placeholder="Provide detailed instructions for this task..."
                    className={`w-full min-h-[120px] p-4 rounded-xl text-sm transition-all border outline-none resize-y ${theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-900 focus:border-indigo-500' : 'bg-white/5 border-white/10 text-white focus:border-indigo-500'}`}
                  />
                </div>
                <div className="space-y-1.5 relative">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Target Role</label>
                  <div className="relative">
                    <Input 
                      value={roleSearch}
                      onChange={(e) => {
                        setRoleSearch(e.target.value);
                        setShowRoleDropdown(true);
                      }}
                      onFocus={() => setShowRoleDropdown(true)}
                      placeholder="Search or select role..."
                      className={`rounded-xl h-12 text-sm transition-all ${theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-900' : 'bg-white/5 border-white/10 text-white'}`}
                    />
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    
                    <AnimatePresence>
                      {showRoleDropdown && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setShowRoleDropdown(false)} 
                          />
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={`absolute top-full left-0 right-0 mt-2 max-h-48 overflow-y-auto z-50 rounded-xl border shadow-2xl custom-scrollbar ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-white/10'}`}
                          >
                            {filteredRoles.length > 0 ? (
                              filteredRoles.map(role => (
                                <button
                                  key={role}
                                  onClick={() => {
                                    setNewTask({...newTask, targetRole: role});
                                    setRoleSearch(role);
                                    setShowRoleDropdown(false);
                                  }}
                                  className={`w-full text-left px-4 py-3 text-sm transition-colors ${theme === 'light' ? 'hover:bg-slate-50 text-slate-700' : 'hover:bg-white/5 text-slate-300'}`}
                                >
                                  {role}
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-sm text-slate-500 italic">No roles found</div>
                            )}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Priority Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Low', 'Medium', 'High'] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => setNewTask({...newTask, priority: p})}
                        className={`py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                          newTask.priority === p 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20' 
                          : theme === 'light' ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50 shadow-sm' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Assigned Date</label>
                    <Input 
                      type="text"
                      placeholder="YYYY-MM-DD"
                      value={newTask.assignedDate}
                      onChange={(e) => setNewTask({...newTask, assignedDate: e.target.value})}
                      className={`rounded-xl h-12 text-sm transition-all ${theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-900' : 'bg-white/5 border-white/10 text-white'}`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Due Date</label>
                    <Input 
                      type="text"
                      placeholder="YYYY-MM-DD"
                      value={newTask.deadline}
                      onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                      className={`rounded-xl h-12 text-sm transition-all ${theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-900' : 'bg-white/5 border-white/10 text-white'}`}
                    />
                  </div>
                </div>
              </div>
              <div className={`p-4 flex gap-3 transition-colors duration-500 ${theme === 'light' ? 'bg-slate-50' : 'bg-white/5'}`}>
                <Button 
                  onClick={handleAddTask}
                  disabled={!newTask.description}
                  className="flex-1 h-12 rounded-xl btn-primary font-bold disabled:opacity-50 gap-2"
                >
                  <Download size={18} />
                  Upload Task
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EditEmployeeScreen({ employee, onBack, onSave, theme }: { employee: Employee, onBack: () => void, onSave: (emp: Partial<Employee>) => void, theme: 'dark' | 'light' }) {
  const [formData, setFormData] = useState({
    name: employee.name,
    role: employee.role,
    department: employee.department,
    email: employee.email,
    contact: employee.contact,
    gender: employee.gender || 'Male'
  });
  const [roleSearch, setRoleSearch] = useState(employee.role);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const filteredRoles = TECH_ROLES.filter(r => 
    r.toLowerCase().includes(roleSearch.toLowerCase())
  );

  return (
    <div className={`pb-10 min-h-full transition-colors duration-500 ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-950'}`}>
      <header className={`p-8 pt-16 backdrop-blur-xl border-b flex items-center gap-6 sticky top-0 z-20 transition-all duration-500 ${theme === 'light' ? 'bg-white/80 border-slate-200' : 'bg-slate-950/80 border-white/5'}`}>
        <motion.button 
          whileHover={{ x: -5, scale: 1.1 }}
          whileTap={{ scale: 0.8, x: -10 }}
          onClick={onBack} 
          className={`p-3 rounded-2xl transition-all flex-shrink-0 ${theme === 'light' ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-white/5 text-slate-400'}`}
        >
          <ChevronLeft size={24} strokeWidth={3} />
        </motion.button>
        <h1 className={`text-2xl font-display font-bold flex-1 text-glow transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Edit Profile</h1>
      </header>

      <div className="p-6 sm:p-8">
        <div className="space-y-8">
          <div className="flex flex-col items-center mb-8">
            <Avatar className={`h-24 w-24 border-4 shadow-xl mb-4 transition-all duration-500 ${theme === 'light' ? 'border-white' : 'border-slate-900'}`}>
              <AvatarImage src={employee.avatar} className="object-cover" />
              <AvatarFallback className="bg-indigo-500/20 text-indigo-500 font-bold text-3xl">{formData.name[0]}</AvatarFallback>
            </Avatar>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Employee ID: {employee.id}</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Full Name</label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className={`rounded-xl h-14 text-sm transition-all ${theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-white/5 border-white/10 text-white'}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 relative">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Role</label>
                <div className="relative">
                  <Input 
                    value={roleSearch}
                    onChange={(e) => {
                      setRoleSearch(e.target.value);
                      setShowRoleDropdown(true);
                    }}
                    onFocus={() => setShowRoleDropdown(true)}
                    className={`rounded-xl h-14 text-sm transition-all ${theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-white/5 border-white/10 text-white'}`}
                  />
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  
                  <AnimatePresence>
                    {showRoleDropdown && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowRoleDropdown(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={`absolute top-full left-0 right-0 mt-2 max-h-48 overflow-y-auto z-50 rounded-xl border shadow-2xl custom-scrollbar ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-white/10'}`}
                        >
                          {filteredRoles.map(role => (
                            <button
                              key={role}
                              onClick={() => {
                                setFormData({...formData, role});
                                setRoleSearch(role);
                                setShowRoleDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-3 text-sm transition-colors ${theme === 'light' ? 'hover:bg-slate-50 text-slate-700' : 'hover:bg-white/5 text-slate-300'}`}
                            >
                              {role}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Gender</label>
                <div className="relative">
                  <select 
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value as any})}
                    className={`w-full h-14 border rounded-xl px-4 text-sm font-medium outline-none transition-all appearance-none ${theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-white/5 border-white/10 text-white'}`}
                  >
                    <option value="Male" className={theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Male</option>
                    <option value="Female" className={theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Female</option>
                    <option value="Other" className={theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Other</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Department</label>
              <div className="relative">
                <select 
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className={`w-full h-14 border rounded-xl px-4 text-sm font-medium outline-none transition-all appearance-none ${theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-white/5 border-white/10 text-white'}`}
                >
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept} className={theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>{dept}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Email Address</label>
              <Input 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className={`rounded-xl h-14 text-sm transition-all ${theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-white/5 border-white/10 text-white'}`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Contact Number</label>
              <Input 
                value={formData.contact}
                onChange={(e) => setFormData({...formData, contact: e.target.value})}
                className={`rounded-xl h-14 text-sm transition-all ${theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-white/5 border-white/10 text-white'}`}
              />
            </div>
          </div>

          <div className="pt-6">
            <Button 
              onClick={() => onSave(formData)}
              className="w-full h-16 rounded-[1.5rem] btn-primary text-lg font-bold shadow-xl shadow-indigo-500/20"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsScreen({ onBack, onLogout, settings, onUpdateSettings, onAction, theme, onToggleTheme, userRole }: { onBack: () => void, onLogout: () => void, settings: any, onUpdateSettings: (key: string, val: boolean) => void, onAction: (label: string) => void, theme: 'dark' | 'light', onToggleTheme: () => void, userRole: string | null }) {
  return (
    <div className={`pb-10 min-h-full transition-colors duration-500 ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-950'}`}>
      <header className={`p-8 pt-16 backdrop-blur-xl border-b flex items-center gap-6 sticky top-0 z-20 transition-all duration-500 ${theme === 'light' ? 'bg-white/80 border-slate-200' : 'bg-slate-950/80 border-white/5'}`}>
        <h1 className={`text-2xl font-display font-bold flex-1 text-glow transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Settings</h1>
      </header>

      <div className="p-8">
        <div className="space-y-10">
          <div className="relative rounded-[2.5rem] border overflow-hidden transition-all duration-500 shadow-2xl">
            {/* Profile Background */}
            <div className="absolute inset-0 z-0">
              <img 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop" 
                alt="" 
                className="w-full h-full object-cover blur-xl opacity-60 scale-110"
                referrerPolicy="no-referrer"
              />
              <div className={`absolute inset-0 transition-colors duration-500 ${theme === 'light' ? 'bg-white/40' : 'bg-slate-950/60'}`} />
            </div>

            <div className={`relative z-10 flex items-center gap-6 p-8 transition-all duration-500 ${theme === 'light' ? 'bg-indigo-50/40' : 'bg-indigo-500/5'}`}>
              <Avatar className={`h-20 w-20 border-4 shadow-lg transition-all duration-500 ${theme === 'light' ? 'border-white' : 'border-slate-950'}`}>
                <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop" />
                <AvatarFallback className="bg-indigo-600 text-white font-bold text-2xl">AD</AvatarFallback>
              </Avatar>
              <div>
                <h2 className={`text-2xl font-display font-bold transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  {userRole === 'super_admin' ? 'Super Admin' : userRole === 'admin' ? 'Admin Manager' : 'Employee'}
                </h2>
                <p className="text-sm text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest mt-1.5">
                  {userRole?.replace('_', ' ') || 'System User'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-2">Configuration</h3>
            <div className="card-premium overflow-hidden">
              <SettingsItem 
                icon={theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />} 
                label="Appearance Mode" 
                value={theme === 'dark' ? 'Dark' : 'Light'}
                onClick={onToggleTheme}
                theme={theme}
              />
              <Separator className={theme === 'light' ? 'bg-slate-100' : 'bg-white/5'} />
              <SettingsItem 
                icon={<ShieldCheck size={20} />} 
                label="Security Protocol" 
                active={settings.security}
                onClick={() => onUpdateSettings('security', !settings.security)}
                theme={theme}
              />
              <Separator className={theme === 'light' ? 'bg-slate-100' : 'bg-white/5'} />
              <SettingsItem 
                icon={<Bell size={20} />} 
                label="Alert Preferences" 
                active={settings.alerts}
                onClick={() => onUpdateSettings('alerts', !settings.alerts)}
                theme={theme}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-2">System</h3>
            <div className="card-premium overflow-hidden">
              <SettingsItem icon={<Briefcase size={20} />} label="Company Profile" onClick={() => onAction('Company Profile')} theme={theme} />
              <Separator className={theme === 'light' ? 'bg-slate-100' : 'bg-white/5'} />
              <SettingsItem icon={<Settings size={20} />} label="Advanced Tools" onClick={() => onAction('Advanced Tools')} theme={theme} />
            </div>
          </div>

          <motion.div whileTap={{ scale: 0.98 }}>
            <Button 
              onClick={onLogout}
              className={`w-full h-16 rounded-[1.5rem] gap-3 font-bold transition-all shadow-lg shadow-rose-500/20 ${theme === 'light' ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-rose-500 hover:bg-rose-600 text-white'}`}
            >
              <LogOut size={22} strokeWidth={2.5} />
              Logout Session
            </Button>
          </motion.div>
          
          <p className={`text-center text-[10px] font-bold uppercase tracking-[0.2em] pb-10 ${theme === 'light' ? 'text-slate-400' : 'text-slate-600'}`}>MindMatrix v2.4.0</p>
        </div>
      </div>
    </div>
  );
}

function SettingsItem({ icon, label, value, active, onClick, theme }: { icon: React.ReactNode, label: string, value?: string, active?: boolean, onClick?: () => void, theme: 'dark' | 'light' }) {
  return (
    <motion.button 
      whileTap={{ scale: 0.96 }}
      onClick={onClick} 
      className={`w-full p-6 flex items-center justify-between transition-all group ${theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}
    >
      <div className="flex items-center gap-4">
        <motion.div 
          whileHover={{ rotate: 15, scale: 1.2 }}
          whileTap={{ rotate: -15, scale: 0.8 }}
          className={`transition-colors ${active ? 'text-indigo-400' : theme === 'light' ? 'text-slate-400 group-hover:text-indigo-600' : 'text-slate-500 group-hover:text-indigo-400'}`}
        >
          {icon}
        </motion.div>
        <span className={`text-sm font-bold transition-colors ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {value && <span className={`text-xs font-bold ${theme === 'light' ? 'text-indigo-600' : 'text-indigo-400'}`}>{value}</span>}
        {active !== undefined ? (
          <div className={`w-12 h-6 rounded-full transition-all relative ${active ? 'bg-indigo-600' : theme === 'light' ? 'bg-slate-200' : 'bg-white/10'}`}>
            <motion.div 
              animate={{ 
                x: active ? 24 : 4,
                scale: active ? 1.1 : 1
              }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
            />
          </div>
        ) : (
          <motion.div whileHover={{ x: 3 }}>
            <ChevronRight size={18} className={`transition-all ${theme === 'light' ? 'text-slate-300 group-hover:text-indigo-600' : 'text-slate-700 group-hover:text-indigo-400'}`} strokeWidth={3} />
          </motion.div>
        )}
      </div>
    </motion.button>
  );
}
