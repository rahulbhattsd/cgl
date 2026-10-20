import { NavLink } from "react-router-dom";
import { LayoutDashboard, CalendarDays, BookOpenCheck, ListChecks, Clock, FileBarChart, LineChart, Settings as SettingsIcon, LogOut, Search } from "lucide-react";
import { useAuth } from "./AuthContext.jsx";
import { useMode } from "./ModeContext.jsx";

const LINKS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/syllabus", label: "Syllabus", icon: BookOpenCheck },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/study-tracker", label: "Study Tracker", icon: Clock },
  { to: "/mock-tests", label: "Mock Tests", icon: FileBarChart },
  { to: "/analytics", label: "Analytics", icon: LineChart },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const { mode } = useMode();
  const links = mode === "sap" ? LINKS.filter((x) => ["/", "/syllabus", "/study-tracker", "/settings"].includes(x.to)) : LINKS;
  return (
    <nav className="sidebar">
      <div className="brand">Stud<span>Edu</span></div>
      {links.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
          <Icon size={17} /> {label}
        </NavLink>
      ))}
      {mode === "sap" && <NavLink to="/quick-reference" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}><Search size={17}/> T-code Reference</NavLink>}
      <div className="nav-spacer" />
      <button className="logout-btn" onClick={logout}><LogOut size={17} /> Logout</button>
    </nav>
  );
}
