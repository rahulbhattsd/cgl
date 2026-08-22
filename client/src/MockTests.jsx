import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { mockApi } from "./api.js";

const TYPES = ["Full Mock", "Sectional"];
const TIERS = ["Tier 1", "Tier 2"];
const SUBJECTS = ["Mathematics", "English", "Reasoning", "General Awareness"];
const EMPTY = { date: new Date().toISOString().slice(0, 10), type: "Full Mock", tier: "Tier 1", subject: "", name: "", totalMarks: "", score: "", attempted: "", correct: "", wrong: "", unattempted: "", timeTaken: "", notes: "" };

export default function MockTests() {
  const [mocks, setMocks] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [typeFilter, setTypeFilter] = useState("");

  const load = () => mockApi.list({ type: typeFilter || undefined }).then(setMocks);
  useEffect(() => { load(); }, [typeFilter]);

  const submit = async (e) => {
    e.preventDefault();
    const num = (v) => (v === "" ? 0 : Number(v));
    await mockApi.create({
      ...form,
      totalMarks: num(form.totalMarks), score: num(form.score), attempted: num(form.attempted),
      correct: num(form.correct), wrong: num(form.wrong), unattempted: num(form.unattempted), timeTaken: num(form.timeTaken),
    });
    setForm(EMPTY);
    load();
  };

  const remove = async (id) => { await mockApi.remove(id); load(); };

  const pct = (m) => (m.totalMarks > 0 ? Math.round((m.score / m.totalMarks) * 1000) / 10 : 0);
  const acc = (m) => (m.attempted > 0 ? Math.round((m.correct / m.attempted) * 1000) / 10 : 0);

  return (
    <div className="grid two-col" style={{ alignItems: "start" }}>
      <div className="card">
        <div className="row" style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Mock History</h3>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ width: "auto" }}>
            <option value="">All types</option>
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        {mocks.length === 0 ? <div className="empty-state">No mock tests recorded yet.</div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Type</th><th>Tier</th><th>Subject</th><th>Score</th><th>Accuracy</th><th>Time</th><th></th></tr></thead>
              <tbody>
                {mocks.map((m) => (
                  <tr key={m._id}>
                    <td>{m.date}</td><td>{m.type}</td><td>{m.tier}</td><td>{m.subject || "—"}</td>
                    <td>{m.score}/{m.totalMarks} ({pct(m)}%)</td>
                    <td>{acc(m)}%</td><td>{m.timeTaken}m</td>
                    <td><button className="icon-btn" onClick={() => remove(m._id)}><Trash2 size={15} color="var(--danger)" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <form className="card" onSubmit={submit}>
        <h3>Add Mock Result</h3>
        <div className="field-row">
          <div className="field"><label>Date</label><input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          <div className="field"><label>Type</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, subject: e.target.value === "Sectional" ? form.subject : "" })}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
        </div>
        <div className="field-row">
          <div className="field"><label>Tier</label><select required value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })}>{TIERS.map((t) => <option key={t}>{t}</option>)}</select></div>
          {form.type === "Sectional" && (
            <div className="field"><label>Subject</label><select required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}><option value="">Select</option>{SUBJECTS.map((s) => <option key={s}>{s}</option>)}</select></div>
          )}
        </div>
        <div className="field"><label>Mock Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="field-row">
          <div className="field"><label>Total Marks</label><input type="number" required value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: e.target.value })} /></div>
          <div className="field"><label>Score</label><input type="number" required value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} /></div>
        </div>
        <div className="field-row">
          <div className="field"><label>Attempted</label><input type="number" value={form.attempted} onChange={(e) => setForm({ ...form, attempted: e.target.value })} /></div>
          <div className="field"><label>Correct</label><input type="number" value={form.correct} onChange={(e) => setForm({ ...form, correct: e.target.value })} /></div>
        </div>
        <div className="field-row">
          <div className="field"><label>Wrong</label><input type="number" value={form.wrong} onChange={(e) => setForm({ ...form, wrong: e.target.value })} /></div>
          <div className="field"><label>Unattempted</label><input type="number" value={form.unattempted} onChange={(e) => setForm({ ...form, unattempted: e.target.value })} /></div>
        </div>
        <div className="field"><label>Time Taken (minutes)</label><input type="number" value={form.timeTaken} onChange={(e) => setForm({ ...form, timeTaken: e.target.value })} /></div>
        <div className="field"><label>Notes</label><textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        <button className="btn btn-primary" type="submit">Save Mock</button>
      </form>
    </div>
  );
}
