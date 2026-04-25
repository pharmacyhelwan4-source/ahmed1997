import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where,
  orderBy,
  addDoc,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { 
  ClipboardList, 
  Users, 
  LayoutDashboard, 
  LogOut, 
  Plus, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  MoreVertical,
  Filter,
  Search,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'react-hot-toast';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { 
  Employee, 
  Notebook, 
  NotebookStage, 
  STAGES_ORDER, 
  STAGE_LABELS, 
  UserRole 
} from './types';
import { cn, formatMonthYear, formatDate } from './lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// --- Authentication Component ---
const Login = () => {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success('تم تسجيل الدخول بنجاح');
    } catch (error) {
      console.error(error);
      toast.error('فشل تسجيل الدخول');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4" dir="rtl">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl text-center">
        <div>
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg">
            <ClipboardList size={32} />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">صيدلية نفقة الدولة</h2>
          <p className="text-gray-500 mb-8">نظام إدارة ومتابعة دفاتر الكمبيوتر والفواتير</p>
        </div>
        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
        >
          <img src="https://www.gstatic.com/firebaseui/images/auth/google.svg" className="w-5 h-5 ml-3" alt="Google" />
          تسجيل الدخول باستخدام جوجل
        </button>
      </div>
    </div>
  );
};

// --- Layout & Navigation ---
export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'notebooks' | 'employees' | 'my-tasks'>('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Sync user to employees collection
        const empRef = doc(db, 'employees', u.uid);
        const empSnap = await getDoc(empRef);
        
        if (!empSnap.exists()) {
          // Check if this is the first user or a specific admin email
          const newEmp: Employee = {
            uid: u.uid,
            name: u.displayName || 'موظف جديد',
            email: u.email || '',
            role: u.email === 'pharmacyhelwan4@gmail.com' ? 'admin' : 'staff',
            isActive: true
          };
          await setDoc(empRef, newEmp);
          setEmployee(newEmp);
        } else {
          setEmployee(empSnap.data() as Employee);
        }
      } else {
        setEmployee(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!user) return <Login />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row" dir="rtl">
      <Toaster position="top-center" />
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-l border-gray-200 flex flex-col shadow-sm">
        <div className="p-6 flex items-center space-x-3 space-x-reverse border-b border-gray-100">
          <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md">
            <ClipboardList size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">إدارة الصيدلية</h1>
            <p className="text-xs text-gray-500">متابعة الأداء</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {employee?.role === 'admin' && (
            <>
              <NavItem active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<LayoutDashboard size={20} />} label="لوحة التحكم" />
              <NavItem active={view === 'notebooks'} onClick={() => setView('notebooks')} icon={<BookOpen size={20} />} label="جميع الدفاتر" />
              <NavItem active={view === 'employees'} onClick={() => setView('employees')} icon={<Users size={20} />} label="الموظفين" />
            </>
          )}
          <NavItem active={view === 'my-tasks'} onClick={() => setView('my-tasks')} icon={<ClipboardList size={20} />} label="مهامي الحالية" />
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              {user.displayName?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.displayName}</p>
              <p className="text-xs text-gray-500 truncate">{employee?.role === 'admin' ? 'مدير النظام' : 'موظف'}</p>
            </div>
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="w-full flex items-center justify-center space-x-2 space-x-reverse p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {view === 'dashboard' && <DashboardView />}
            {view === 'notebooks' && <NotebooksView isAdmin={true} />}
            {view === 'employees' && <EmployeesView />}
            {view === 'my-tasks' && <NotebooksView userId={user.uid} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center space-x-3 space-x-reverse p-3 rounded-xl transition-all duration-200 group text-sm font-medium",
        active 
          ? "bg-blue-50 text-blue-700 shadow-sm" 
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      <span className={cn(active ? "text-blue-600 font-bold" : "text-gray-400 group-hover:text-gray-600")}>
        {icon}
      </span>
      <span>{label}</span>
      {active && <motion.div layoutId="nav-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
    </button>
  );
}

// --- Views Components ---

function DashboardView() {
  const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0 });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'notebooks'), (snap) => {
      const data = snap.docs.map(d => d.data() as Notebook);
      setStats({
        total: data.length,
        completed: data.filter(d => d.currentStage === 'completed').length,
        inProgress: data.filter(d => d.currentStage !== 'completed').length
      });
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'notebooks'));
    
    // Fetch logs
    const qLogs = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), where('timestamp', '!=', '')); // basic query
    const unsubLogs = onSnapshot(query(collection(db, 'logs'), orderBy('timestamp', 'desc')), (snap) => {
      setRecentLogs(snap.docs.slice(0, 5).map(d => ({ id: d.id, ...d.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'logs'));

    return () => { unsub(); unsubLogs(); };
  }, []);

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-bold text-gray-900">مرحباً بك في لوحة التحكم</h2>
        <p className="text-gray-500">نظرة عامة على أداء الصيدلية لهذا الشهر.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="إجمالي الدفاتر" value={stats.total} icon={<BookOpen className="text-blue-600" />} color="bg-blue-100" />
        <StatCard title="قيد التنفيذ" value={stats.inProgress} icon={<Clock className="text-orange-600" />} color="bg-orange-100" />
        <StatCard title="تم إنجازها" value={stats.completed} icon={<CheckCircle2 className="text-green-600" />} color="bg-green-100" />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Clock size={20} className="text-gray-400" />
          آخر التحديثات
        </h3>
        <div className="space-y-4">
          {recentLogs.length === 0 ? (
            <p className="text-sm text-gray-400 italic text-center py-4">لا توجد نشاطات مسجلة بعد.</p>
          ) : (
            recentLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors border-r-4 border-blue-500 bg-blue-50/30">
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-bold text-gray-900">{log.userName}</p>
                    <span className="text-[10px] text-gray-400 bg-white px-2 py-0.5 rounded-full shadow-sm">
                      {formatDate(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{log.details}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 space-x-reverse transition-transform hover:scale-[1.02]">
      <div className={cn("p-4 rounded-xl", color)}>{icon}</div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

// --- Notebooks View ---
function NotebooksView({ userId, isAdmin }: { userId?: string; isAdmin?: boolean }) {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    type: 'computer' as 'computer' | 'invoice',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    computerNumber: 1,
    invoiceBookNumber: 0,
    serialStart: 0,
    serialEnd: 0,
    assignedTo: ''
  });

  useEffect(() => {
    let q = query(collection(db, 'notebooks'), orderBy('createdAt', 'desc'));
    if (userId) q = query(q, where('assignedTo', '==', userId));
    
    const unsub = onSnapshot(q, (snap) => {
      setNotebooks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notebook)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'notebooks'));

    const unsubEmp = onSnapshot(collection(db, 'employees'), (snap) => {
      setEmployees(snap.docs.map(d => d.data() as Employee));
    });

    return () => { unsub(); unsubEmp(); };
  }, [userId]);

  const handleAddNotebook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.assignedTo) return toast.error('يجب اختيار موظف');

    try {
      const selectedEmp = employees.find(e => e.uid === formData.assignedTo);
      const newNotebook = {
        ...formData,
        assignedToName: selectedEmp?.name || '',
        assignedBy: auth.currentUser?.uid,
        currentStage: 'writing',
        stages: STAGES_ORDER.reduce((acc, stage) => {
          acc[stage] = { completed: false };
          return acc;
        }, {} as any),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'notebooks'), newNotebook);
      
      // Add Activity Log
      await addDoc(collection(db, 'logs'), {
        notebookId: docRef.id,
        userId: auth.currentUser?.uid || '',
        userName: auth.currentUser?.displayName || 'مدير النظام',
        action: 'إضافة دفتر',
        details: `تم إنشاء دفتر رقم ${formData.computerNumber} وتعيينه لـ ${selectedEmp?.name}`,
        timestamp: serverTimestamp()
      });

      toast.success('تمت إضافة الدفتر بنجاح');
      setIsAddOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'notebooks');
    }
  };

  const advanceStage = async (notebook: Notebook) => {
    const currentIndex = STAGES_ORDER.indexOf(notebook.currentStage);
    const nextStage = STAGES_ORDER[currentIndex + 1];
    
    const updatedStages = { ...notebook.stages };
    updatedStages[notebook.currentStage] = {
      completed: true,
      completedAt: serverTimestamp(),
      completedBy: auth.currentUser?.uid || ''
    };

    try {
      await updateDoc(doc(db, 'notebooks', notebook.id), {
        currentStage: nextStage || 'completed',
        stages: updatedStages,
        updatedAt: serverTimestamp()
      });

      // Add Activity Log
      await addDoc(collection(db, 'logs'), {
        notebookId: notebook.id,
        userId: auth.currentUser?.uid || '',
        userName: auth.currentUser?.displayName || 'موظف',
        action: 'تحديث مرحلة',
        details: `أتم الموظف مرحلة (${STAGE_LABELS[notebook.currentStage]}) للدفتر رقم ${notebook.computerNumber}`,
        timestamp: serverTimestamp()
      });

      toast.success('تم تحديث المرحلة بنجاح');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notebooks/${notebook.id}`);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{isAdmin ? 'إدارة الدفاتر' : 'مهامي'}</h2>
          <p className="text-gray-500">تتبع تقدم العمل والمراحل.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsAddOpen(true)}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center space-x-2 space-x-reverse font-medium shadow-lg hover:bg-blue-700 transition-all"
          >
            <Plus size={20} />
            <span>إضافة دفتر جديد</span>
          </button>
        )}
      </header>

      {/* List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-10 text-center text-gray-400">جاري التحميل...</div>
        ) : notebooks.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
            <ClipboardList className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500">لا يوجد دفاتر حالياً.</p>
          </div>
        ) : (
          notebooks.map((nb) => (
            <div key={nb.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-md">
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center font-bold",
                  nb.currentStage === 'completed' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                )}>
                  {nb.computerNumber}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">دفتر كمبيوتر رقم {nb.computerNumber}</h4>
                  <p className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                    <Clock size={12} />
                    {formatMonthYear(nb.month, nb.year)}
                    {isAdmin && <span className="mr-2 px-2 py-0.5 bg-gray-100 rounded-full">المسؤول: {nb.assignedToName}</span>}
                  </p>
                </div>
              </div>

              <div className="flex-1 max-w-md">
                <div className="flex justify-between text-xs mb-1 text-gray-500">
                  <span>المرحلة: {STAGE_LABELS[nb.currentStage]}</span>
                  <span>{Math.round(((STAGES_ORDER.indexOf(nb.currentStage) === -1 ? STAGES_ORDER.length : STAGES_ORDER.indexOf(nb.currentStage)) / STAGES_ORDER.length) * 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((STAGES_ORDER.indexOf(nb.currentStage) === -1 ? STAGES_ORDER.length : STAGES_ORDER.indexOf(nb.currentStage)) / STAGES_ORDER.length) * 100}%` }}
                    className={cn(
                      "h-full transition-all duration-500",
                      nb.currentStage === 'completed' ? "bg-green-500" : "bg-blue-500"
                    )}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                {nb.currentStage !== 'completed' && (
                  <button 
                    onClick={() => advanceStage(nb)}
                    disabled={userId ? nb.assignedTo !== userId : false}
                    className="flex-1 md:flex-none py-2 px-4 bg-gray-50 text-gray-700 rounded-xl hover:bg-blue-600 hover:text-white transition-all text-sm font-medium border border-gray-100 disabled:opacity-50"
                  >
                    إنهاء المرحلة
                  </button>
                )}
                {nb.currentStage === 'completed' && (
                  <span className="flex items-center text-green-600 text-sm font-bold gap-1">
                    <CheckCircle2 size={16} />
                    مكتمل
                  </span>
                )}
                <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <h3 className="text-xl font-bold mb-6">إضافة دفتر جديد للعمل</h3>
            <form onSubmit={handleAddNotebook} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">رقم دفتر الكمبيوتر</label>
                  <input 
                    type="number" 
                    required
                    value={formData.computerNumber}
                    onChange={(e) => setFormData({...formData, computerNumber: parseInt(e.target.value)})}
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">رقم دفتر الفواتير</label>
                  <input 
                    type="number" 
                    required
                    value={formData.invoiceBookNumber}
                    onChange={(e) => setFormData({...formData, invoiceBookNumber: parseInt(e.target.value)})}
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">بداية السيريال</label>
                  <input 
                    type="number" 
                    required
                    value={formData.serialStart}
                    onChange={(e) => setFormData({...formData, serialStart: parseInt(e.target.value)})}
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-300"
                    placeholder="مثال: 40751"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">نهاية السيريال</label>
                  <input 
                    type="number" 
                    required
                    value={formData.serialEnd}
                    onChange={(e) => setFormData({...formData, serialEnd: parseInt(e.target.value)})}
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-300"
                    placeholder="مثال: 40800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">الشهر</label>
                  <select 
                    value={formData.month}
                    onChange={(e) => setFormData({...formData, month: parseInt(e.target.value)})}
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i+1} value={i+1}>{formatMonthYear(i + 1, 2024).split(' ')[0]}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">السنة</label>
                  <input 
                    type="number" 
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">تعيين لموظف</label>
                <select 
                  required
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">اختر الموظف...</option>
                  {employees.map(emp => (
                    <option key={emp.uid} value={emp.uid}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                >
                  إنشاء وتعيين
                </button>
                <button 
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// --- Employees View ---
function EmployeesView() {
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'employees'), (snap) => {
      setEmployees(snap.docs.map(d => d.data() as Employee));
    });
    return unsub;
  }, []);

  const toggleRole = async (emp: Employee) => {
    try {
      await updateDoc(doc(db, 'employees', emp.uid), {
        role: emp.role === 'admin' ? 'staff' : 'admin'
      });
      toast.success('تم تحديث الصلاحيات');
    } catch (error) {
      toast.error('فشل التحديث');
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-gray-900">إدارة الموظفين</h2>
        <p className="text-gray-500">التحكم في صلاحيات الوصول للفريق.</p>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">الموظف</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">البريد الإلكتروني</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">الدور</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-left">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {employees.map((emp) => (
              <tr key={emp.uid} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="h-8 w-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold text-xs uppercase">
                      {emp.name[0]}
                    </div>
                    <span className="font-medium text-gray-900">{emp.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 font-mono">{emp.email}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold",
                    emp.role === 'admin' ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"
                  )}>
                    {emp.role === 'admin' ? 'مدير' : 'موظف'}
                  </span>
                </td>
                <td className="px-6 py-4 text-left">
                  <button 
                    onClick={() => toggleRole(emp)}
                    className="text-blue-600 hover:text-blue-800 text-xs font-bold hover:underline"
                  >
                    تغيير الدور
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
