import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./AuthContext.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import Sidebar from "./Sidebar.jsx";
import Header from "./Header.jsx";
import Login from "./Login.jsx";
import Register from "./Register.jsx";
import Dashboard from "./Dashboard.jsx";
import CalendarPage from "./CalendarPage.jsx";
import Syllabus from "./Syllabus.jsx";
import Tasks from "./Tasks.jsx";
import StudyTracker from "./StudyTracker.jsx";
import MockTests from "./MockTests.jsx";
import Analytics from "./Analytics.jsx";
import Settings from "./Settings.jsx";
import { ModeProvider, useMode } from "./ModeContext.jsx";
import { SapDashboard, SapQuickReference, SapSyllabus } from "./SapPages.jsx";

function Shell({ title, children }) {
  const { mode } = useMode();
  return (
    <div className="app-shell" data-mode={mode}>
      <Sidebar />
      <div className="main-area">
        <Header title={title} />
        <div className="content">{children}</div>
      </div>
    </div>
  );
}

const protect = (title, El) => (
  <ProtectedRoute>
    <Shell title={title}><El /></Shell>
  </ProtectedRoute>
);

export default function App() {
  return (
    <ModeProvider><AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><ModeHome /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><ModeCalendar /></ProtectedRoute>} />
        <Route path="/syllabus" element={<ProtectedRoute><ModeSyllabus /></ProtectedRoute>} />
        <Route path="/quick-reference" element={<ProtectedRoute><ModeReference /></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><ModeTasks /></ProtectedRoute>} />
        <Route path="/study-tracker" element={protect("Study Tracker", StudyTracker)} />
        <Route path="/mock-tests" element={<ProtectedRoute><ModeMocks /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><ModeAnalytics /></ProtectedRoute>} />
        <Route path="/settings" element={protect("Settings", Settings)} />
      </Routes>
    </AuthProvider></ModeProvider>
  );
}

function ModeHome() { const { mode } = useMode(); return <Shell title="Dashboard">{mode === "sap" ? <SapDashboard /> : <Dashboard />}</Shell>; }
function ModeSyllabus() { const { mode } = useMode(); return <Shell title="Syllabus">{mode === "sap" ? <SapSyllabus /> : <Syllabus />}</Shell>; }
function ModeCalendar() { const { mode }=useMode(); return mode === "sap" ? <Navigate to="/" replace/> : <Shell title="Calendar"><CalendarPage/></Shell>; }
function ModeReference() { const { mode }=useMode(); return mode === "sap" ? <Shell title="T-code Quick Reference"><SapQuickReference/></Shell> : <Navigate to="/" replace/>; }
function ModeTasks() { const { mode }=useMode(); return mode === "sap" ? <Navigate to="/" replace/> : <Shell title="Tasks"><Tasks/></Shell>; }
function ModeMocks() { const { mode }=useMode(); return mode === "sap" ? <Navigate to="/" replace/> : <Shell title="Mock Tests"><MockTests/></Shell>; }
function ModeAnalytics() { const { mode }=useMode(); return mode === "sap" ? <Navigate to="/" replace/> : <Shell title="Analytics"><Analytics/></Shell>; }
