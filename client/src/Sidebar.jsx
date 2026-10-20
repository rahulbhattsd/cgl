import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "./AuthContext.jsx";
import { useMode } from "./ModeContext.jsx";
import { MODE_CONFIG } from "./modeConfig.js";

export default function Sidebar() {
  const { logout } = useAuth();
  const { mode } = useMode();
  const links = MODE_CONFIG[mode].navigation;
  return (
    <nav className="sidebar">
      <div className="brand">Stud<span>Edu</span><small className="brand-mode">{mode === "sap" ? "SAP PREP" : "CGL PREP"}</small></div>
      {links.map(({ to, label, sapLabel, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} aria-label={mode === "sap" && sapLabel ? sapLabel : label} className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
          <Icon size={17} /> {mode === "sap" && sapLabel ? sapLabel : label}
        </NavLink>
      ))}
      <div className="nav-spacer" />
      <button className="logout-btn" onClick={logout}><LogOut size={17} /> Logout</button>
    </nav>
  );
}
