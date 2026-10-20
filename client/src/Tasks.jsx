import { useEffect, useState } from "react";
import { Trash2, Pencil } from "lucide-react";
import { taskApi } from "./api.js";
import { useMode } from "./ModeContext.jsx";
import { useSapData } from "./SapPages.jsx";
import { SAP_SECTIONS } from "./modeConfig.js";

const SUBJECTS = ["Mathematics", "English", "Reasoning", "General Awareness"];
const PRIORITIES = ["Low", "Medium", "High"];
const VIEWS = [
  { key: "today", label: "Today" },
  { key: "backlog", label: "Backlog" },
  { key: "all", label: "All" },
];
const EMPTY = { title: "", description: "", date: new Date().toISOString().slice(0, 10), subject: "", topic: "", priority: "Medium", estimatedDuration: "" };

export default function Tasks() {
  const { mode } = useMode();
  const [sapData, saveSap] = useSapData();
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [q, setQ] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [view, setView] = useState("today");


  const load = () =>
    taskApi
      .list({
        view,
        q: q || undefined,
        priority: priorityFilter || undefined,
      })
      .then(setTasks);

  useEffect(() => {
    if (mode === "cgl") load();
  }, [view, q, priorityFilter, mode]);

  if (mode === "sap") {
    return (
      <SapTasks
        data={sapData}
        save={saveSap}
        q={q}
        setQ={setQ}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        form={form}
        setForm={setForm}
        editingId={editingId}
        setEditingId={setEditingId}
      />
    );
  }


  const submit = async (e) => {
    e.preventDefault();
    const payload = { ...form, estimatedDuration: Number(form.estimatedDuration) || 0 };
    if (editingId) await taskApi.update(editingId, payload);
    else await taskApi.create(payload);
    setForm(EMPTY); setEditingId(null);
    load();
  };

  const edit = (t) => { setForm({ title: t.title, description: t.description || "", date: t.date, subject: t.subject || "", topic: t.topic || "", priority: t.priority, estimatedDuration: t.estimatedDuration || "" }); setEditingId(t._id); };
  const toggleComplete = async (t) => { await taskApi.update(t._id, { completed: !t.completed }); load(); };
  const remove = async (id) => { await taskApi.remove(id); load(); };

  const listTitle = view === "today" ? "Today's Tasks" : view === "backlog" ? "Backlog (Overdue)" : "All Tasks";
  const emptyMessage = view === "today" ? "Nothing scheduled for today." : view === "backlog" ? "No backlog — you're all caught up!" : "No tasks yet. Add your first one.";

  return (
    <div className="grid two-col" style={{ alignItems: "start" }}>
      <div className="card">
        <h3>{listTitle}</h3>
        <div className="chip-row">
          {VIEWS.map((v) => (
            <button key={v.key} className={`chip ${view === v.key ? "active" : ""}`} onClick={() => setView(v.key)}>{v.label}</button>
          ))}
        </div>
        <div className="field-row" style={{ marginBottom: 14 }}>
          <input placeholder="Search tasks..." value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">All priorities</option>
            {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        {tasks.length === 0 ? <div className="empty-state">{emptyMessage}</div> : (
          <div className="stack">
            {tasks.map((t) => (
              <div key={t._id} className="row" style={{ borderBottom: "1px solid var(--border)", paddingBottom: 10 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input type="checkbox" checked={t.completed} onChange={() => toggleComplete(t)} />
                  <div>
                    <div style={{ textDecoration: t.completed ? "line-through" : "none", fontSize: 14 }}>{t.title}</div>
                    <div className="muted">{t.date} {t.subject && `· ${t.subject}`}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className={`pill pill-${t.priority.toLowerCase()}`}>{t.priority}</span>
                  <button className="icon-btn" onClick={() => edit(t)}><Pencil size={15} /></button>
                  <button className="icon-btn" onClick={() => remove(t._id)}><Trash2 size={15} color="var(--danger)" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <form className="card" onSubmit={submit}>
        <h3>{editingId ? "Edit Task" : "Add Task"}</h3>
        <div className="field"><label>Title</label><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div className="field"><label>Description</label><textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="field-row">
          <div className="field"><label>Date</label><input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          <div className="field"><label>Priority</label><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select></div>
        </div>
        <div className="field-row">
          <div className="field"><label>Subject</label><select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}><option value="">None</option>{SUBJECTS.map((s) => <option key={s}>{s}</option>)}</select></div>
          <div className="field"><label>Est. Duration (min)</label><input type="number" value={form.estimatedDuration} onChange={(e) => setForm({ ...form, estimatedDuration: e.target.value })} /></div>
        </div>
        <div className="field"><label>Topic</label><input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} /></div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" type="submit">{editingId ? "Update" : "Add Task"}</button>
          {editingId && <button className="btn" type="button" onClick={() => { setForm(EMPTY); setEditingId(null); }}>Cancel</button>}
        </div>
      </form>
    </div>
  );
}

function SapTasks({ data, save, q, setQ, priorityFilter, setPriorityFilter, form, setForm, editingId, setEditingId }) {
  const tasks = data.tasks.filter((t) => (!priorityFilter || t.priority === priorityFilter) && `${t.title} ${t.description} ${t.topic}`.toLowerCase().includes(q.toLowerCase()));
  const clear = () => { setForm(EMPTY); setEditingId(null); };
  const submit = (e) => { e.preventDefault(); const payload = { ...form, estimatedDuration: Number(form.estimatedDuration) || 0, id: editingId || globalThis.crypto?.randomUUID?.() || String(Date.now()) }; save({ ...data, tasks: editingId ? data.tasks.map((t) => t.id === editingId ? { ...t, ...payload } : t) : [payload, ...data.tasks] }); clear(); };
  const edit = (t) => { setForm({ title: t.title, description: t.description || "", date: t.date, subject: t.subject || "", topic: t.topic || "", priority: t.priority, estimatedDuration: t.estimatedDuration || "" }); setEditingId(t.id); };
  const update = (id, changes) => save({ ...data, tasks: data.tasks.map((t) => t.id === id ? { ...t, ...changes } : t) });
  return <div className="grid two-col" style={{alignItems:"start"}}><div className="card"><h3>All SAP tasks</h3><div className="field-row" style={{marginBottom:14}}><input placeholder="Search tasks..." value={q} onChange={e=>setQ(e.target.value)}/><select value={priorityFilter} onChange={e=>setPriorityFilter(e.target.value)}><option value="">All priorities</option>{PRIORITIES.map(p=><option key={p}>{p}</option>)}</select></div>{tasks.length===0?<div className="empty-state">No tasks yet. Add your first one.</div>:<div className="stack">{tasks.map(t=><div key={t.id} className="row task-row"><div className="task-summary"><input type="checkbox" checked={!!t.completed} onChange={()=>update(t.id,{completed:!t.completed})}/><div><div className="task-title" style={{textDecoration:t.completed?"line-through":"none"}}>{t.title}</div><div className="muted">{t.date} {t.subject&&`· ${t.subject}`} {t.topic&&`· ${t.topic}`}</div></div></div><div className="task-actions"><span className={`pill pill-${t.priority.toLowerCase()}`}>{t.priority}</span><button className="icon-btn" onClick={()=>edit(t)} aria-label={`Edit ${t.title}`}><Pencil size={15}/></button><button className="icon-btn" onClick={()=>save({...data,tasks:data.tasks.filter(x=>x.id!==t.id)})} aria-label={`Delete ${t.title}`}><Trash2 size={15} color="var(--danger)"/></button></div></div>)}</div>}</div><form className="card" onSubmit={submit}><h3>{editingId?"Edit Task":"Add SAP Task"}</h3><div className="field"><label>Title</label><input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></div><div className="field"><label>Description</label><textarea rows={2} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></div><div className="field-row"><div className="field"><label>Date</label><input type="date" required value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div><div className="field"><label>Priority</label><select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>{PRIORITIES.map(p=><option key={p}>{p}</option>)}</select></div></div><div className="field-row"><div className="field"><label>Section</label><select value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}><option value="">None</option>{SAP_SECTIONS.map(s=><option key={s}>{s}</option>)}</select></div><div className="field"><label>Est. Duration (min)</label><input type="number" min="0" value={form.estimatedDuration} onChange={e=>setForm({...form,estimatedDuration:e.target.value})}/></div></div><div className="field"><label>Topic</label><input value={form.topic} onChange={e=>setForm({...form,topic:e.target.value})}/></div><div className="row" style={{justifyContent:"start"}}><button className="btn btn-primary">{editingId?"Update":"Add Task"}</button>{editingId&&<button className="btn" type="button" onClick={clear}>Cancel</button>}</div></form></div>;
}
