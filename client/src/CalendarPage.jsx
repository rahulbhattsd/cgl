import { useEffect, useState } from "react";
import { X } from "lucide-react";
import Heatmap from "./Heatmap.jsx";
import { calendarApi, studyApi, taskApi } from "./api.js";
import { useMode } from "./ModeContext.jsx";
import { useSapData } from "./SapPages.jsx";
import { SAP_SECTIONS } from "./modeConfig.js";

const SUBJECTS = ["Mathematics", "English", "Reasoning", "General Awareness"];

export default function CalendarPage() {
  const { mode } = useMode();
  const [sapData, saveSap] = useSapData();
  const [year, setYear] = useState(new Date().getFullYear());
  const [dataByDate, setDataByDate] = useState({});
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);

  const load = () => calendarApi.get(year).then((res) => {
    const map = {};
    res.days.forEach((d) => (map[d.date] = d));
    setDataByDate(map);
  });

  useEffect(() => { if (mode === "cgl") load(); }, [year, mode]);

  if (mode === "sap") return <SapCalendar year={year} setYear={setYear} data={sapData} save={saveSap} />;

  const openDay = (date) => {
    setSelected(date);
    calendarApi.getDay(date).then(setDetail);
  };

  const closeModal = () => { setSelected(null); setDetail(null); };

  const refreshDay = () => { openDay(selected); load(); };

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="card">
        <div className="row" style={{ marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>Contribution Calendar</h3>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-sm" onClick={() => setYear((y) => y - 1)}>&larr;</button>
            <span style={{ fontFamily: "var(--font-mono)", padding: "5px 8px" }}>{year}</span>
            <button className="btn btn-sm" onClick={() => setYear((y) => y + 1)}>&rarr;</button>
          </div>
        </div>
        <Heatmap year={year} dataByDate={dataByDate} onSelect={openDay} />
      </div>

      {selected && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selected}</h3>
              <button className="icon-btn" onClick={closeModal}><X size={18} /></button>
            </div>
            {!detail ? (
              <div className="loading">Loading...</div>
            ) : (
              <DayDetail detail={detail} onChange={refreshDay} date={selected} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SapCalendar({ year, setYear, data, save }) {
  const [selected, setSelected] = useState(null);
  const sessionsByDate = Object.groupBy ? Object.groupBy(data.studySessions, (s) => s.date) : data.studySessions.reduce((map, s) => ((map[s.date] ||= []).push(s), map), {});
  const byDate = {};
  Object.entries(sessionsByDate).forEach(([date, sessions]) => { const mins=sessions.reduce((n,s)=>n+(Number(s.minutes)||0),0); byDate[date]={totalStudyMinutes:mins,level:mins===0?0:mins<30?1:mins<60?2:mins<120?3:4}; });
  data.tasks.forEach((task) => { if (!task.completed && task.date?.startsWith(`${year}-`)) byDate[task.date] ||= { totalStudyMinutes: 0, level: 0 }; });
  if ("2026-11-02".startsWith(`${year}-`)) byDate["2026-11-02"] ||= { totalStudyMinutes: 0, level: 0, joining: true };
  const daySessions=data.studySessions.filter((s)=>s.date===selected);
  const dayTasks=data.tasks.filter((t)=>t.date===selected);
  const addSession=(e)=>{e.preventDefault();const form=new FormData(e.currentTarget);save({...data,studySessions:[...data.studySessions,{id:globalThis.crypto?.randomUUID?.()||String(Date.now()),date:selected,section:String(form.get("section")),topic:String(form.get("topic")),minutes:Number(form.get("minutes")),confidence:"",notes:""}]});e.currentTarget.reset();};
  const addTask=(e)=>{e.preventDefault();const title=new FormData(e.currentTarget).get("title");save({...data,tasks:[...data.tasks,{id:globalThis.crypto?.randomUUID?.()||String(Date.now()),title:String(title),date:selected,priority:"Medium",completed:false}]});e.currentTarget.reset();};
  return <div className="stack" style={{gap:18}}><section className="card"><div className="row" style={{marginBottom:10}}><h3 style={{margin:0}}>Contribution Calendar</h3><div className="row calendar-year"><button className="btn btn-sm" onClick={()=>setYear(y=>y-1)} aria-label="Previous year">←</button><span className="year-label">{year}</span><button className="btn btn-sm" onClick={()=>setYear(y=>y+1)} aria-label="Next year">→</button></div></div><Heatmap year={year} dataByDate={byDate} onSelect={setSelected}/><p className="muted">SAP study sessions and tasks · Joining date: 2 Nov 2026</p></section>{selected&&<section className="card"><div className="row"><h3>{selected}</h3><button className="btn btn-sm" onClick={()=>setSelected(null)}>Close</button></div>{selected==="2026-11-02"&&<p className="accent-text">SAP joining date</p>}<h4>Study sessions</h4>{daySessions.length?daySessions.map(s=><div className="row sap-session" key={s.id}><span>{s.section} · {s.topic}</span><span className="muted">{s.minutes} min</span></div>):<div className="empty-state">No sessions logged.</div>}<form className="field-row sap-calendar-form" onSubmit={addSession}><input name="topic" required placeholder="Study topic"/><select name="section">{SAP_SECTIONS.map(s=><option key={s}>{s}</option>)}</select><input name="minutes" type="number" min="1" required placeholder="Minutes"/><button className="btn btn-primary">Add session</button></form><h4>Tasks</h4>{dayTasks.length?dayTasks.map(t=><label className="check-item" key={t.id}><input type="checkbox" checked={!!t.completed} onChange={()=>save({...data,tasks:data.tasks.map(x=>x.id===t.id?{...x,completed:!x.completed}:x)})}/>{t.title}</label>):<div className="empty-state">No tasks scheduled.</div>}<form className="row sap-calendar-form" onSubmit={addTask}><input name="title" required placeholder="New task title"/><button className="btn btn-primary">Add task</button></form></section>}</div>;
}

function DayDetail({ detail, onChange, date }) {
  const [showSession, setShowSession] = useState(false);
  const [showTask, setShowTask] = useState(false);

  return (
    <div className="stack">
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Stat label="Study Time" value={`${Math.floor(detail.totalStudyMinutes / 60)}h ${detail.totalStudyMinutes % 60}m`} />
        <Stat label="Tasks" value={`${detail.tasksCompleted}/${detail.tasksTotal}`} />
        <Stat label="Questions" value={detail.questionsSolved} />
        <Stat label="Accuracy" value={`${detail.accuracy}%`} />
        <Stat label="Mocks" value={detail.mocksCompleted} />
      </div>

      <div>
        <h3 style={{ fontSize: 13, marginBottom: 8 }}>Sessions</h3>
        {detail.sessions.length === 0 ? <div className="muted">No sessions logged.</div> : (
          <div className="stack">
            {detail.sessions.map((s) => (
              <div key={s._id} className="row" style={{ fontSize: 13 }}>
                <span>{s.subject} · {s.topic}</span>
                <span className="muted">{Math.floor(s.duration / 60)}h {s.duration % 60}m</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-sm" onClick={() => setShowSession(true)}>+ Add Study Session</button>
        <button className="btn btn-sm" onClick={() => setShowTask(true)}>+ Add Task</button>
      </div>

      {showSession && <QuickSessionForm date={date} onDone={() => { setShowSession(false); onChange(); }} onCancel={() => setShowSession(false)} />}
      {showTask && <QuickTaskForm date={date} onDone={() => { setShowTask(false); onChange(); }} onCancel={() => setShowTask(false)} />}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="muted" style={{ fontSize: 11, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function QuickSessionForm({ date, onDone, onCancel }) {
  const [form, setForm] = useState({ subject: SUBJECTS[0], topic: "", duration: "" });
  const submit = async (e) => {
    e.preventDefault();
    await studyApi.create({ ...form, date, duration: Number(form.duration) });
    onDone();
  };
  return (
    <form onSubmit={submit} className="stack" style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
      <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
        {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
      </select>
      <input placeholder="Topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
      <input placeholder="Duration (minutes)" type="number" required value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-primary btn-sm" type="submit">Save</button>
        <button className="btn btn-sm" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function QuickTaskForm({ date, onDone, onCancel }) {
  const [title, setTitle] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    await taskApi.create({ title, date, priority: "Medium" });
    onDone();
  };
  return (
    <form onSubmit={submit} className="stack" style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
      <input placeholder="Task title" required value={title} onChange={(e) => setTitle(e.target.value)} />
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-primary btn-sm" type="submit">Save</button>
        <button className="btn btn-sm" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
