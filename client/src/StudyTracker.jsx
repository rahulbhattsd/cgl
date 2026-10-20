import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { studyApi } from "./api.js";
import { useMode } from "./ModeContext.jsx";
import { useSapData } from "./SapPages.jsx";

const SUBJECTS = ["Mathematics", "English", "Reasoning", "General Awareness"];
const EMPTY = { date: new Date().toISOString().slice(0, 10), subject: SUBJECTS[0], topic: "", duration: "", questionsAttempted: "", questionsCorrect: "", notes: "" };
const todayStr = () => new Date().toISOString().slice(0, 10);

export default function StudyTracker() {
  const { mode } = useMode();
  const [sapData, saveSap] = useSapData();
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [q, setQ] = useState("");

  const load = () => studyApi.list({ subject: subjectFilter || undefined, q: q || undefined }).then(setSessions);
  useEffect(() => { load(); }, [subjectFilter, q]);

  const submit = async (e) => {
    e.preventDefault();
    await studyApi.create({
      ...form,
      duration: Number(form.duration),
      questionsAttempted: Number(form.questionsAttempted) || 0,
      questionsCorrect: Number(form.questionsCorrect) || 0,
    });
    setForm(EMPTY);
    load();
  };

  const remove = async (id) => { await studyApi.remove(id); load(); };

  const totals = useMemo(() => {
    const t = todayStr();
    const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
    const monthAgo = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
    const sum = (arr) => arr.reduce((s, x) => s + x.duration, 0);
    return {
      today: sum(sessions.filter((s) => s.date === t)),
      week: sum(sessions.filter((s) => s.date >= weekAgo)),
      month: sum(sessions.filter((s) => s.date >= monthAgo)),
      all: sum(sessions),
    };
  }, [sessions]);

  const label = (m) => `${Math.floor(m / 60)}h ${m % 60}m`;

  if (mode === "sap") return <SapStudyTracker data={sapData} save={saveSap} label={label}/>;

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="grid kpi-grid">
        <div className="card kpi-card"><div className="kpi-label">Today</div><div className="kpi-value">{label(totals.today)}</div></div>
        <div className="card kpi-card"><div className="kpi-label">This Week</div><div className="kpi-value">{label(totals.week)}</div></div>
        <div className="card kpi-card"><div className="kpi-label">This Month</div><div className="kpi-value">{label(totals.month)}</div></div>
        <div className="card kpi-card"><div className="kpi-label">All Time</div><div className="kpi-value accent">{label(totals.all)}</div></div>
      </div>

      <div className="grid two-col" style={{ alignItems: "start" }}>
        <form className="card" onSubmit={submit}>
          <h3>Log a Study Session</h3>
          <div className="field-row">
            <div className="field"><label>Date</label><input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div className="field"><label>Subject</label><select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>{SUBJECTS.map((s) => <option key={s}>{s}</option>)}</select></div>
          </div>
          <div className="field"><label>Topic</label><input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} /></div>
          <div className="field-row">
            <div className="field"><label>Duration (minutes)</label><input type="number" required min="1" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></div>
            <div className="field"><label>Questions Attempted</label><input type="number" min="0" value={form.questionsAttempted} onChange={(e) => setForm({ ...form, questionsAttempted: e.target.value })} /></div>
          </div>
          <div className="field"><label>Questions Correct</label><input type="number" min="0" value={form.questionsCorrect} onChange={(e) => setForm({ ...form, questionsCorrect: e.target.value })} /></div>
          <div className="field"><label>Notes</label><textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <button className="btn btn-primary" type="submit">Save Session</button>
        </form>

        <div className="card">
          <h3>Session History</h3>
          <div className="field-row" style={{ marginBottom: 12 }}>
            <input placeholder="Search topic/notes..." value={q} onChange={(e) => setQ(e.target.value)} />
            <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
              <option value="">All subjects</option>
              {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          {sessions.length === 0 ? <div className="empty-state">No sessions logged yet.</div> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Date</th><th>Subject</th><th>Topic</th><th>Duration</th><th>Accuracy</th><th></th></tr></thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s._id}>
                      <td>{s.date}</td><td>{s.subject}</td><td>{s.topic || "—"}</td>
                      <td>{label(s.duration)}</td>
                      <td>{s.questionsAttempted ? Math.round((s.questionsCorrect / s.questionsAttempted) * 1000) / 10 + "%" : "—"}</td>
                      <td><button className="icon-btn" onClick={() => remove(s._id)}><Trash2 size={15} color="var(--danger)" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SapStudyTracker({data,save,label}) {
  const [form,setForm]=useState({date:todayStr(),topic:"",duration:"",notes:""});
  const sessions=data.studySessions;
  const submit=(e)=>{e.preventDefault();save({...data,studySessions:[{...form,minutes:Number(form.duration),date:form.date,id:crypto.randomUUID()},...sessions]});setForm({date:todayStr(),topic:"",duration:"",notes:""});};
  const remove=(id)=>save({...data,studySessions:sessions.filter(x=>x.id!==id)});
  return <div className="grid two-col"><form className="card" onSubmit={submit}><h3>Log a SAP study session</h3><div className="field"><label>Date</label><input type="date" required value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div><div className="field"><label>Topic</label><input required value={form.topic} onChange={e=>setForm({...form,topic:e.target.value})}/></div><div className="field"><label>Duration (minutes)</label><input type="number" required min="1" value={form.duration} onChange={e=>setForm({...form,duration:e.target.value})}/></div><div className="field"><label>Notes</label><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></div><button className="btn btn-primary">Save session</button></form><section className="card"><h3>SAP session history</h3>{sessions.length===0?<div className="empty-state">No SAP sessions logged yet.</div>:sessions.map(s=><div className="row sap-session" key={s.id}><div><strong>{s.topic}</strong><div className="muted">{s.date} · {label(s.minutes)}</div>{s.notes&&<div className="muted">{s.notes}</div>}</div><button className="btn btn-sm" onClick={()=>remove(s.id)} aria-label={`Delete ${s.topic} session`}>Delete</button></div>)}</section></div>;
}
