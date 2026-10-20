import { useEffect, useMemo, useState } from "react";
import { Download, Upload } from "lucide-react";
import { exportSapData, importSapData, readSapData, sapStats, SAP_KEY, SAP_STATUSES, syllabus, updateTopic, writeSapData } from "./sapStore.js";

export function useSapData() {
  const [data, setData] = useState(readSapData);
  useEffect(() => {
    const refresh = () => setData(readSapData());
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);
  const save = (next) => { setData(next); writeSapData(next); };
  return [data, save];
}

export function SapDashboard() {
  const [data, save] = useSapData(); const stats = sapStats(data); const [draft, setDraft] = useState(data.planStart);
  const days = Math.max(0, Math.ceil((Date.parse(`${syllabus.joiningDate}T00:00:00`) - new Date().setHours(0,0,0,0)) / 86400000));
  const phaseWeeks = [[1,"Phase 1 · Week 1"],[2,"Phase 2 · Weeks 2–3"],[3,"Phase 3 · Weeks 4–5"],[4,"Phase 4 · Weeks 6–8"]];
  return <div className="stack">
    <div className="grid kpi-grid"><Kpi label="SAP topics mastered" value={`${stats.overall}%`} /><Kpi label="Study time" value={`${Math.floor(stats.minutes/60)}h ${stats.minutes%60}m`} /><Kpi label="Current streak" value={`${stats.streak}d`} /><Kpi label="Joining in" value={`${days} days`} /></div>
    <div className="grid two-col">
      <section className="card"><h3>Progress by section</h3><div className="stack">{stats.sections.map((s)=><div key={s.name}><div className="row"><span>{s.name}</span><span className="muted">{s.progress}%</span></div><div className="progress-track"><div className="progress-fill" style={{width:`${s.progress}%`}} /></div></div>)}</div></section>
      <section className="card"><h3>What to study next</h3>{stats.next?<><p>{stats.next.name}</p><p className="muted">{stats.next.section} · Phase {stats.next.phase}</p><a className="btn btn-primary" href="/syllabus">Open syllabus</a></>:<p>All topics mastered. Review your notes and milestones.</p>}</section>
    </div>
    <section className="card"><h3>Phase / Week plan</h3><div className="grid two-col">{phaseWeeks.map(([p,label])=><div key={p} className="phase-card"><strong>{label}</strong><ul>{syllabus.sections.filter(s=>s.phase===p).map(s=><li key={s.id}>{s.name}</li>)}</ul></div>)}</div></section>
    <div className="grid two-col">
      <section className="card"><h3>Practice milestones</h3>{syllabus.milestones.map((m,i)=><label className="check-item sap-check" key={m}><input type="checkbox" checked={!!data.milestones[i]?.done} onChange={e=>save({...data,milestones:{...data.milestones,[i]:{...data.milestones[i],done:e.target.checked}}})}/><span>{m}<textarea placeholder="Milestone notes" value={data.milestones[i]?.notes||""} onChange={e=>save({...data,milestones:{...data.milestones,[i]:{...data.milestones[i],notes:e.target.value}}})}/></span></label>)}</section>
      <section className="card"><h3>Official SAP Learning resources</h3>{syllabus.resources.map((r,i)=><label key={r.url} className="resource-row"><input type="checkbox" checked={!!data.resources[i]} onChange={e=>save({...data,resources:{...data.resources,[i]:e.target.checked}})}/><a href={r.url} target="_blank" rel="noreferrer">{r.title}</a></label>)}</section>
    </div>
    <section className="card"><h3>Ask my trainer</h3><p className="muted">These answers determine which advanced topics to prioritize.</p>{["Which SAP release?","Which functional module?","Which ABAP environment (ECC / S/4HANA on-prem / ABAP Cloud)?","Which project technologies will I use?"].map(k=><div className="field" key={k}><label>{k}</label><input value={data.trainer[k]||""} onChange={e=>save({...data,trainer:{...data.trainer,[k]:e.target.value}})}/></div>)}<label>Notes</label><textarea rows="3" value={data.trainer.notes||""} onChange={e=>save({...data,trainer:{...data.trainer,notes:e.target.value}})}/></section>
    <section className="card"><h3>Plan settings</h3><div className="field"><label>Study plan start date</label><input type="date" value={draft} onChange={e=>setDraft(e.target.value)}/></div><button className="btn btn-primary" onClick={()=>save({...data,planStart:draft})}>Save start date</button></section>
    <section className="card"><h3>SAP progress backup</h3><div className="row"><button className="btn" onClick={()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([exportSapData(data)],{type:"application/json"}));a.download="sap-progress.json";a.click();URL.revokeObjectURL(a.href)}}><Download size={16}/> Export JSON</button><label className="btn"><Upload size={16}/> Import JSON<input className="file-input" type="file" accept="application/json,.json" onChange={async e=>{try{save(importSapData(await e.target.files[0].text()));e.target.value="";}catch{window.alert("Could not import this SAP progress file.")}}}/></label><span className="muted">Stored at {SAP_KEY}</span></div></section>
  </div>;
}
function Kpi({label,value}) { return <div className="card kpi-card"><div className="kpi-label">{label}</div><div className="kpi-value accent">{value}</div></div>; }

export function SapSyllabus() {
  const [data, save] = useSapData(); const [phase, setPhase] = useState("all"); const [q, setQ] = useState(""); const stats = sapStats(data);
  const filtered = useMemo(()=>syllabus.sections.map(s=>({...s,topics:s.topics.map((name,i)=>({name,id:`${s.id}-${i}`,phase:s.phase,noteField:s.noteField,resource:s.resource})).filter(t=>(phase==="all"||String(t.phase)===phase)&&`${s.name} ${t.name}`.toLowerCase().includes(q.toLowerCase()))})).filter(s=>s.topics.length),[phase,q]);
  return <div className="stack"><section className="card"><h3>SAP syllabus · {stats.overall}% mastered</h3><div className="progress-track"><div className="progress-fill" style={{width:`${stats.overall}%`}}/></div><div className="field-row" style={{marginTop:14}}><input aria-label="Search SAP syllabus" placeholder="Search syllabus topics..." value={q} onChange={e=>setQ(e.target.value)}/><select aria-label="Filter by phase" value={phase} onChange={e=>setPhase(e.target.value)}><option value="all">All phases</option>{syllabus.phases.map((p,i)=><option value={i+1} key={p}>{p}</option>)}</select></div></section>
    {filtered.map(section=><section className="card" key={section.id}><h3>{section.name} <span className="muted">Phase {section.phase}</span></h3>{section.topics.map(t=>{const value=data.topics[t.id]||{};const resourceUrl=value.resource||"";return <article className="sap-topic" key={t.id}><div className="row"><strong>{t.name}</strong><select aria-label={`Status: ${t.name}`} value={value.status||SAP_STATUSES[0]} onChange={e=>save(updateTopic(data,t.id,{status:e.target.value}))}>{SAP_STATUSES.map(s=><option key={s}>{s}</option>)}</select></div><div className="field-row"><div><textarea aria-label={`Notes: ${t.name}`} placeholder={t.noteField?`Notes · ${t.noteField}`:"Notes"} rows="2" value={value.notes||""} onChange={e=>save(updateTopic(data,t.id,{notes:e.target.value}))}/>{t.noteField&&<span className="muted">Record {t.noteField} here for a personalized learning bridge.</span>}</div><div><input aria-label={`Resource link: ${t.name}`} type="url" placeholder="Optional resource link" value={resourceUrl} onChange={e=>save(updateTopic(data,t.id,{resource:e.target.value}))}/>{resourceUrl&&<a className="muted" href={resourceUrl} target="_blank" rel="noreferrer">Open topic resource</a>}</div></div></article>})}</section>)}
  </div>;
}

export function SapQuickReference() {
  const [q,setQ]=useState(""); const results=syllabus.tcodes.filter(x=>`${x.code} ${x.description}`.toLowerCase().includes(q.toLowerCase()));
  return <section className="card"><h3>T-code quick reference</h3><p className="muted">Availability depends on system and role.</p><input aria-label="Search T-codes" placeholder="Search code or purpose..." value={q} onChange={e=>setQ(e.target.value)}/><div className="table-wrap"><table><thead><tr><th>T-code</th><th>Purpose</th></tr></thead><tbody>{results.map(x=><tr key={x.code}><td><code>{x.code}</code></td><td>{x.description}</td></tr>)}</tbody></table></div></section>;
}
