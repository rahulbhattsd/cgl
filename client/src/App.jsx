import { Routes, Route } from "react-router-dom";
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

function Shell({ title, children }) {
  return (
    <div className="app-shell">
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
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={protect("Dashboard", Dashboard)} />
        <Route path="/calendar" element={protect("Calendar", CalendarPage)} />
        <Route path="/syllabus" element={protect("Syllabus", Syllabus)} />
        <Route path="/tasks" element={protect("Tasks", Tasks)} />
        <Route path="/study-tracker" element={protect("Study Tracker", StudyTracker)} />
        <Route path="/mock-tests" element={protect("Mock Tests", MockTests)} />
        <Route path="/analytics" element={protect("Analytics", Analytics)} />
        <Route path="/settings" element={protect("Settings", Settings)} />
      </Routes>
    </AuthProvider>
  );
}
