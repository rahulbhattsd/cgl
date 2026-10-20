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
import { SapQuickReference } from "./SapPages.jsx";

function Shell({ title, children }) {
  const { mode } = useMode();
  return <div className="app-shell" data-mode={mode}><Sidebar /><div className="main-area"><Header title={title} /><div className="content">{children}</div></div></div>;
}

function Page({ title, children }) {
  return <ProtectedRoute><Shell title={title}>{children}</Shell></ProtectedRoute>;
}

function ModePage({ title, Component, sapTitle = title, SapComponent = Component }) {
  const { mode } = useMode();
  const Screen = mode === "sap" ? SapComponent : Component;
  return <Page title={mode === "sap" ? sapTitle : title}><Screen /></Page>;
}

export default function App() {
  return <ModeProvider><AuthProvider><Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/" element={<ModePage title="Dashboard" Component={Dashboard} />} />
    <Route path="/calendar" element={<ModePage title="Calendar" Component={CalendarPage} />} />
    <Route path="/syllabus" element={<ModePage title="Syllabus" Component={Syllabus} />} />
    <Route path="/quick-reference" element={<ProtectedRoute><ModeReference /></ProtectedRoute>} />
    <Route path="/tasks" element={<ModePage title="Tasks" Component={Tasks} />} />
    <Route path="/study-tracker" element={<ModePage title="Study Tracker" Component={StudyTracker} />} />
    <Route path="/mock-tests" element={<ModePage title="Mock Tests" sapTitle="Practice Labs" Component={MockTests} />} />
    <Route path="/analytics" element={<ModePage title="Analytics" Component={Analytics} />} />
    <Route path="/settings" element={<ModePage title="Settings" Component={Settings} />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></AuthProvider></ModeProvider>;
}

function ModeReference() {
  const { mode } = useMode();
  return mode === "sap" ? <Shell title="T-code Reference"><SapQuickReference /></Shell> : <Navigate to="/" replace />;
}
