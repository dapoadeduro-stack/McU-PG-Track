import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  LogOut, 
  Plus, 
  Search, 
  Filter, 
  ChevronRight, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  Info,
  MoreVertical, 
  Download, 
  Upload, 
  UserPlus, 
  GraduationCap, 
  BookOpen, 
  Award, 
  FileCheck, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  ArrowRight, 
  Printer, 
  Mail, 
  ExternalLink 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { 
  auth, 
  db, 
  signInWithPopup, 
  googleProvider, 
  onAuthStateChanged, 
  signOut,
  FirebaseUser
} from './firebase';
import { 
  collection, 
  collectionGroup,
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  orderBy, 
  limit, 
  Timestamp 
} from 'firebase/firestore';
import { 
  Student, 
  Presentation, 
  UserProfile, 
  UserRole, 
  Program, 
  PROGRAM_STAGES 
} from './types';
import { cn, formatDate, calculateDuration } from './lib/utils';

// --- Error Handling ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- UI Components ---

const Button = ({ className, variant = 'primary', size = 'md', children, ...props }: any) => {
  const variants: any = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
    secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
    outline: 'bg-transparent text-indigo-600 border border-indigo-200 hover:bg-indigo-50',
    ghost: 'bg-transparent text-gray-500 hover:bg-gray-100',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
  };
  
  const sizes: any = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button 
      className={cn('inline-flex items-center justify-center rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none', variants[variant], sizes[size], className)} 
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ className, children }: any) => (
  <div className={cn('bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden', className)}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'neutral' }: any) => {
  const variants: any = {
    neutral: 'bg-gray-100 text-gray-600',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    error: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    indigo: 'bg-indigo-100 text-indigo-700',
  };
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider', variants[variant])}>
      {children}
    </span>
  );
};

const Toast = ({ message, type = 'success', onClose }: any) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const variants: any = {
    success: 'bg-emerald-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-indigo-500 text-white',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className={cn('fixed bottom-8 right-8 px-6 py-3 rounded-xl shadow-2xl z-[200] flex items-center gap-3', variants[type])}
    >
      {type === 'success' && <CheckCircle2 className="w-5 h-5" />}
      {type === 'error' && <AlertCircle className="w-5 h-5" />}
      {type === 'info' && <Info className="w-5 h-5" />}
      <span className="font-medium">{message}</span>
    </motion.div>
  );
};

const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

// --- Context ---

const AuthContext = createContext<any>(null);
const useAuth = () => useContext(AuthContext);

// --- Main App ---

export default function App() {
  console.log("App component initialized");
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    console.log("App useEffect running");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser?.email);
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'User',
              role: firebaseUser.email === 'dapoadeduro@gmail.com' ? UserRole.ADMIN : UserRole.COORDINATOR,
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto">
            <GraduationCap className="w-10 h-10 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">McU Postgrad Track</h1>
            <p className="text-gray-500 mt-2">McPherson University Postgraduate Portal</p>
          </div>
          <Button onClick={login} className="w-full" size="lg">
            Sign in with Google
          </Button>
          <p className="text-xs text-gray-400">
            Authorized access only for PG Coordinators and Admin staff.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, setActiveTab, activeTab, setToast }}>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 left-0 z-50">
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">McU PG Track</span>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'students', label: 'Students', icon: Users },
              { id: 'reports', label: 'Reports', icon: FileText },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeTab === item.id 
                    ? 'bg-indigo-50 text-indigo-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                {user.displayName?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.displayName}</p>
                <p className="text-xs text-gray-500 truncate">{profile?.role}</p>
              </div>
              <button onClick={logout} className="text-gray-400 hover:text-red-500 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && <Dashboard key="dashboard" />}
            {activeTab === 'students' && <Students key="students" />}
            {activeTab === 'reports' && <Reports key="reports" />}
            {activeTab === 'settings' && <SettingsView key="settings" />}
          </AnimatePresence>
        </main>

        <AnimatePresence>
          {toast && (
            <Toast 
              message={toast.message} 
              type={toast.type} 
              onClose={() => setToast(null)} 
            />
          )}
        </AnimatePresence>
      </div>
    </AuthContext.Provider>
  );
}

// --- Sub-Views ---

function Dashboard() {
  const { setActiveTab } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qStudents = query(collection(db, 'students'), where('status', '==', 'Active'));
    const unsubStudents = onSnapshot(qStudents, (snap) => {
      setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
      setLoading(false);
    });

    const qPresentations = query(collectionGroup(db, 'presentations'), orderBy('date', 'desc'), limit(10));
    const unsubPresentations = onSnapshot(qPresentations, (snap) => {
      setPresentations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Presentation)));
    });

    return () => {
      unsubStudents();
      unsubPresentations();
    };
  }, []);

  const programStats = [
    { name: 'PGD', count: students.filter(s => s.program === Program.PGD).length },
    { name: 'MSc', count: students.filter(s => s.program === Program.MSC).length },
    { name: 'PhD', count: students.filter(s => s.program === Program.PHD).length },
  ];

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500">Welcome back to the McU Postgraduate Portal.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Active Students</p>
            <p className="text-2xl font-bold text-gray-900">{students.length}</p>
          </div>
        </Card>
        <Card className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Presentations (Total)</p>
            <p className="text-2xl font-bold text-gray-900">{presentations.length}</p>
          </div>
        </Card>
        <Card className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Upcoming Events</p>
            <p className="text-2xl font-bold text-gray-900">
              {presentations.filter(p => p.date && new Date(p.date) > new Date()).length}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-bold text-gray-900 mb-6">Program Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={programStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold text-gray-900 mb-6">Student Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={programStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {programStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Recent Presentations</h3>
          <Button variant="ghost" size="sm" onClick={() => setActiveTab('students')}>View All</Button>
        </div>
        <div className="divide-y divide-gray-100">
          {presentations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No presentations recorded yet.</div>
          ) : (
            presentations.map((p) => (
              <div key={p.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.title}</p>
                    <p className="text-xs text-gray-500">{formatDate(p.date || '')}</p>
                  </div>
                </div>
                <Badge variant={p.status === 'Completed' ? 'success' : 'warning'}>
                  {p.status}
                </Badge>
              </div>
            ))
          )}
        </div>
      </Card>
    </motion.div>
  );
}

function Students() {
  const { user, setToast } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [isPresentationModalOpen, setIsPresentationModalOpen] = useState(false);
  const [studentPresentations, setStudentPresentations] = useState<Presentation[]>([]);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (viewingStudent) {
      const q = query(collection(db, 'students', viewingStudent.id, 'presentations'), orderBy('date', 'desc'));
      const unsub = onSnapshot(q, (snap) => {
        setStudentPresentations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Presentation)));
      });
      return () => unsub();
    }
  }, [viewingStudent]);

  useEffect(() => {
    const q = query(collection(db, 'students'), orderBy('name', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
    });
    return () => unsub();
  }, []);

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                         s.regNumber.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || s.program === filter;
    return matchesSearch && matchesFilter;
  });

  const handleAddStudent = async (e: any) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData(e.target);
    const newStudent = {
      name: formData.get('name'),
      regNumber: formData.get('regNumber'),
      program: formData.get('program'),
      email: formData.get('email'),
      supervisor: formData.get('supervisor'),
      joinedDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      status: 'Active',
      createdBy: user.uid,
      // Extra fields allowed by rules (not explicitly forbidden)
      department: formData.get('department'),
      currentStage: 'Proposal',
      presentations: []
    };

    const path = 'students';
    try {
      await addDoc(collection(db, path), newStudent);
      setIsAddModalOpen(false);
      setToast({ message: 'Student registered successfully!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to register student.', type: 'error' });
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleDeleteStudent = async () => {
    if (!deletingStudentId) return;
    const path = `students/${deletingStudentId}`;
    try {
      await deleteDoc(doc(db, 'students', deletingStudentId));
      setDeletingStudentId(null);
      setToast({ message: 'Student deleted successfully!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to delete student.', type: 'error' });
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleAddPresentation = async (e: any) => {
    e.preventDefault();
    if (!selectedStudent || !user) return;

    const formData = new FormData(e.target);
    const presentation = {
      studentId: selectedStudent.id,
      title: formData.get('title'),
      stage: formData.get('type'), // stage in rules, type in form
      status: formData.get('status'),
      date: formData.get('date'),
      time: formData.get('time') || '',
      venue: formData.get('venue') || '',
      remarks: formData.get('comments') || '',
      updatedBy: user.uid,
      createdAt: new Date().toISOString()
    };

    const path = `students/${selectedStudent.id}/presentations`;
    try {
      const presRef = await addDoc(collection(db, 'students', selectedStudent.id, 'presentations'), presentation);
      
      // Update student's presentations list and current stage
      const updatedPresentations = [...(selectedStudent.presentations || []), presRef.id];
      await updateDoc(doc(db, 'students', selectedStudent.id), {
        presentations: updatedPresentations,
        currentStage: presentation.stage
      });

      setIsPresentationModalOpen(false);
      setToast({ message: 'Presentation added successfully!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to add presentation.', type: 'error' });
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
          <p className="text-gray-500">Manage postgraduate students and their progress.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
          <UserPlus className="w-4 h-4" />
          Add Student
        </Button>
      </header>

      <Card className="p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name or matric number..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {[Program.PGD, Program.MSC, Program.PHD, 'All'].map((p) => (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                filter === p 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredStudents.map((student) => (
          <Card key={student.id} className="p-6 hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-bold text-xl">
                  {student.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{student.name}</h3>
                  <p className="text-sm text-gray-500 font-mono">{student.regNumber}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-400 hover:text-indigo-600"
                  onClick={() => {
                    setSelectedStudent(student);
                    setIsPresentationModalOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-400 hover:text-red-600"
                  onClick={() => setDeletingStudentId(student.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Program</p>
                <Badge variant="indigo">{student.program}</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Current Stage</p>
                <Badge variant="warning">{student.currentStage}</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Department</p>
                <p className="text-sm font-medium text-gray-700 truncate">{student.department}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Duration</p>
                <p className="text-sm font-medium text-gray-700">{calculateDuration(student.joinedDate)} Years</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <FileCheck className="w-4 h-4 text-emerald-500" />
                <span>{student.presentations?.length || 0} Presentations</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-indigo-600 group-hover:translate-x-1 transition-transform"
                onClick={() => setViewingStudent(student)}
              >
                View Details <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingStudentId}
        onClose={() => setDeletingStudentId(null)}
        title="Confirm Deletion"
      >
        <div className="space-y-6">
          <div className="p-4 bg-red-50 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-red-600 shadow-sm">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Are you absolutely sure?</p>
              <p className="text-xs text-gray-500">This action cannot be undone. All student records will be permanently removed.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setDeletingStudentId(null)}>Cancel</Button>
            <Button variant="danger" className="flex-1" onClick={handleDeleteStudent}>Delete Student</Button>
          </div>
        </div>
      </Modal>

      {/* Student Details Modal */}
      <Modal
        isOpen={!!viewingStudent}
        onClose={() => setViewingStudent(null)}
        title="Student Details"
      >
        {viewingStudent && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-xl">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 font-bold text-2xl shadow-sm">
                {viewingStudent.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-xl">{viewingStudent.name}</h3>
                <p className="text-sm text-gray-500 font-mono">{viewingStudent.regNumber}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Email</p>
                <p className="text-sm font-medium text-gray-900">{viewingStudent.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Program</p>
                <Badge variant="indigo">{viewingStudent.program}</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Department</p>
                <p className="text-sm font-medium text-gray-900">{viewingStudent.department}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Supervisor</p>
                <p className="text-sm font-medium text-gray-900">{viewingStudent.supervisor}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Joined Date</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(viewingStudent.joinedDate)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Current Stage</p>
                <Badge variant="warning">{viewingStudent.currentStage}</Badge>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Presentation History</h4>
              {studentPresentations.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No presentations recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {studentPresentations.map((p) => (
                    <div key={p.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold text-gray-900">{p.title}</p>
                        <Badge variant={p.status === 'Completed' ? 'success' : 'warning'}>{p.status}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {formatDate(p.date || '')}
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> {p.stage}
                        </div>
                      </div>
                      {p.remarks && (
                        <p className="mt-2 text-xs text-gray-600 bg-white p-2 rounded border border-gray-50 italic">
                          "{p.remarks}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Add Student Modal */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Student"
      >
        <form onSubmit={handleAddStudent} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Full Name</label>
            <input name="name" required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Reg Number / Matric No</label>
              <input name="regNumber" required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Program</label>
              <select name="program" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none">
                <option value={Program.PGD}>PGD</option>
                <option value={Program.MSC}>MSc</option>
                <option value={Program.PHD}>PhD</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Student Email</label>
            <input type="email" name="email" required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Department</label>
            <input name="department" required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Supervisor</label>
            <input name="supervisor" required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
          </div>
          <div className="pt-4">
            <Button type="submit" className="w-full">Register Student</Button>
          </div>
        </form>
      </Modal>

      {/* Add Presentation Modal */}
      <Modal 
        isOpen={isPresentationModalOpen} 
        onClose={() => setIsPresentationModalOpen(false)}
        title={`Add Presentation for ${selectedStudent?.name}`}
      >
        <form onSubmit={handleAddPresentation} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Presentation Title</label>
            <input name="title" required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Type</label>
              <select name="type" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none">
                {selectedStudent && PROGRAM_STAGES[selectedStudent.program].map(stage => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Date</label>
              <input type="date" name="date" required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <select name="status" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none">
              <option value="Completed">Completed</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Comments</label>
            <textarea name="comments" rows={3} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
          </div>
          <div className="pt-4">
            <Button type="submit" className="w-full">Save Presentation</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}

function Reports() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'students'), (snap) => {
      setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 print:p-0"
    >
      <header className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Progress Reports</h1>
          <p className="text-gray-500">Generate and export student progress summaries.</p>
        </div>
        <Button onClick={handlePrint} variant="secondary" className="gap-2">
          <Printer className="w-4 h-4" />
          Print Report
        </Button>
      </header>

      <Card className="overflow-hidden" id="report-table">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Student</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Program</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Current Stage</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Completion</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((student) => {
                const completedCount = student.presentations?.length || 0;
                const totalStages = PROGRAM_STAGES[student.program].length;
                const percentage = Math.round((completedCount / totalStages) * 100);

                return (
                  <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-500">{student.regNumber}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="neutral">{student.program}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">{student.currentStage}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden min-w-[100px]">
                          <div 
                            className="h-full bg-indigo-600 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-600">{percentage}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={student.status === 'Active' ? 'success' : 'neutral'}>
                        {student.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}

function SettingsView() {
  const { user, profile, logout, setToast } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'students'));
    const unsub = onSnapshot(q, (snap) => {
      setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
    });
    return () => unsub();
  }, []);

  const handleExport = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(students));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "mcu_students_export.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      setToast({ message: 'Database exported successfully!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Export failed.', type: 'error' });
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event: any) => {
        try {
          const importedData = JSON.parse(event.target.result);
          if (Array.isArray(importedData)) {
            for (const student of importedData) {
              const { id, ...studentData } = student;
              await addDoc(collection(db, 'students'), {
                ...studentData,
                createdBy: user?.uid,
                joinedDate: studentData.joinedDate || new Date().toISOString().split('T')[0]
              });
            }
            setToast({ message: 'Data imported successfully!', type: 'success' });
          }
        } catch (error) {
          console.error('Import failed:', error);
          setToast({ message: 'Import failed. Check file format.', type: 'error' });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your account and portal preferences.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <h3 className="font-bold text-gray-900 mb-2">Profile Information</h3>
          <p className="text-sm text-gray-500">Your personal details and portal role.</p>
        </div>
        <Card className="md:col-span-2 p-6 space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-bold">
              {user?.displayName?.charAt(0)}
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-lg">{user?.displayName}</h4>
              <p className="text-gray-500">{user?.email}</p>
              <div className="mt-2">
                <Badge variant="indigo">{profile?.role}</Badge>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Account Created</p>
              <p className="text-sm font-medium text-gray-700">{formatDate(profile?.createdAt || new Date())}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Portal Access</p>
              <p className="text-sm font-medium text-gray-700">Full Access</p>
            </div>
          </div>
        </Card>

        <div className="md:col-span-1">
          <h3 className="font-bold text-gray-900 mb-2">Data Management</h3>
          <p className="text-sm text-gray-500">Export or import portal data.</p>
        </div>
        <Card className="md:col-span-2 p-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Download className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Export Database</p>
                <p className="text-xs text-gray-500">Download all student records as JSON.</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={handleExport}>Export</Button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Upload className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Import Data</p>
                <p className="text-xs text-gray-500">Bulk upload students via CSV file.</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={handleImport}>Import</Button>
          </div>
        </Card>

        <div className="md:col-span-1">
          <h3 className="font-bold text-gray-900 mb-2">Account Actions</h3>
          <p className="text-sm text-gray-500">Logout or manage security.</p>
        </div>
        <Card className="md:col-span-2 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">Sign Out</p>
              <p className="text-xs text-gray-500">End your current session safely.</p>
            </div>
            <Button variant="danger" onClick={logout} className="gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
