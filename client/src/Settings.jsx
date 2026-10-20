import { useAuth } from "./AuthContext.jsx";
import { useMode } from "./ModeContext.jsx";
import { useSapData } from "./SapPages.jsx";
import { Download, Upload } from "lucide-react";
import { exportSapData, importSapData, SAP_KEY } from "./sapStore.js";
import { useState } from "react";

export default function Settings() {
  const { user, logout } = useAuth();
  const { mode } = useMode();
  const [data, save] = useSapData();
  const [planStart, setPlanStart] = useState(data.planStart);
  return (
    <div className="card" style={{ maxWidth: 420 }}>
      <h3>Account</h3>
      <div className="stack">
        <div><label>Name</label><div>{user?.name}</div></div>
        <div><label>Email</label><div>{user?.email}</div></div>
      </div>
      <button className="btn btn-danger" style={{ marginTop: 18 }} onClick={logout}>Log out</button>
      {mode === "sap" && <div className="stack sap-settings"><section><h3>SAP study plan</h3><div className="field"><label>Plan start date</label><input type="date" value={planStart} onChange={e=>setPlanStart(e.target.value)}/></div><button className="btn btn-primary" onClick={()=>save({...data,planStart})}>Save start date</button></section><section><h3>SAP progress backup</h3><div className="row settings-actions"><button className="btn" onClick={()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([exportSapData(data)],{type:"application/json"}));a.download="sap-progress.json";a.click();URL.revokeObjectURL(a.href)}}><Download size={16}/> Export JSON</button><label className="btn"><Upload size={16}/> Import JSON<input className="file-input" type="file" accept="application/json,.json" onChange={async e=>{try{save(importSapData(await e.target.files[0].text()));e.target.value="";}catch{window.alert("Could not import this SAP progress file.")}}}/></label><span className="muted">Stored at {SAP_KEY}</span></div></section></div>}
    </div>
  );
}
