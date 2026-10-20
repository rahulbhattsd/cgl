import { useAuth } from "./AuthContext.jsx";
import { useMode } from "./ModeContext.jsx";

export default function Header({ title }) {
  const { user } = useAuth();
  const { mode, setMode } = useMode();
  return (
    <div className="topbar">
      <h1>{title}</h1>
      <div className="topbar-actions"><div className="mode-switch" role="group" aria-label="Preparation mode">{["cgl","sap"].map((item)=><button type="button" key={item} aria-pressed={mode===item} className={mode===item?"selected":""} onClick={()=>setMode(item)}>{item.toUpperCase()}</button>)}</div><span className="user-pill">{user?.name} · {mode === "sap" ? "SAP Prep" : "SSC CGL"}</span></div>
    </div>
  );
}
