import { useEffect, useState } from "react";
import { X } from "lucide-react";
import Heatmap from "./Heatmap.jsx";
import { calendarApi, studyApi, taskApi } from "./api.js";

const SUBJECTS = ["Mathematics", "English", "Reasoning", "General Awareness"];

export default function CalendarPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [dataByDate, setDataByDate] = useState({});
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);

  const load = () => calendarApi.get(year).then((res) => {
    const map = {};
    res.days.forEach((d) => (map[d.date] = d));
    setDataByDate(map);
  });

  useEffect(() => { load(); }, [year]);

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
