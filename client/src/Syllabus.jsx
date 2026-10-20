import { useEffect, useState } from "react";
import { syllabusApi } from "./api.js";
import { useMode } from "./ModeContext.jsx";
import { SapSyllabus } from "./SapPages.jsx";

const STAGES = [
  ["lecture", "Lecture"], ["notes", "Notes"], ["practice", "Practice"],
  ["test", "Test"], ["revision1", "Revision 1"], ["revision2", "Revision 2"],
];
const SUBJECTS = ["Mathematics", "English", "Reasoning", "General Awareness"];
const FILTERS = ["All", "Revision Pending", "Revision 1 Done", "Revision 2 Done"];

export default function Syllabus() {
  const { mode } = useMode();
  const [data, setData] = useState(null);
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [filter, setFilter] = useState("All");

  const load = () => syllabusApi.get().then(setData);
  useEffect(() => { if (mode === "cgl") load(); }, [mode]);

  if (mode === "sap") return <SapSyllabus />;

  const toggle = async (topicId, stage) => {
    await syllabusApi.toggleStage(topicId, stage);
    load();
  };

  if (!data) return <div className="loading">Loading syllabus...</div>;

  let topics = data.subjects[subject] || [];
  if (filter === "Revision Pending") topics = topics.filter((t) => !t.stages.revision1 || !t.stages.revision2);
  if (filter === "Revision 1 Done") topics = topics.filter((t) => t.stages.revision1);
  if (filter === "Revision 2 Done") topics = topics.filter((t) => t.stages.revision2);

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="card">
        <div className="row">
          <div>
            <h3 style={{ marginBottom: 2 }}>SSC CGL Syllabus</h3>
            <div className="kpi-value accent" style={{ fontSize: 22 }}>{data.overallProgress}% Complete</div>
          </div>
        </div>
        <div className="grid" style={{ gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginTop: 14 }}>
          {Object.entries(data.stageCompletion).map(([stage, pct]) => (
            <div key={stage}>
              <div className="muted" style={{ fontSize: 11 }}>{STAGES.find(([k]) => k === stage)[1]}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{pct}%</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid kpi-grid">
        {data.subjectSummary.map((s) => (
          <div key={s.subject} className="card kpi-card">
            <div className="kpi-label">{s.subject}</div>
            <div className="kpi-value">{s.progress}%</div>
            <div className="progress-track" style={{ marginTop: 8 }}><div className="progress-fill" style={{ width: `${s.progress}%` }} /></div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="chip-row">
          {SUBJECTS.map((s) => (
            <button key={s} className={`chip ${subject === s ? "active" : ""}`} onClick={() => setSubject(s)}>{s}</button>
          ))}
        </div>
        <div className="chip-row">
          {FILTERS.map((f) => (
            <button key={f} className={`chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>

        {topics.length === 0 ? (
          <div className="empty-state">No topics match this filter.</div>
        ) : (
          <div className="stack">
            {topics.map((t) => (
              <div key={t.id} style={{ borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
                <div className="row" style={{ marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</span>
                  <span className="muted">{t.progress}%</span>
                </div>
                <div className="progress-track" style={{ marginBottom: 8 }}><div className="progress-fill" style={{ width: `${t.progress}%` }} /></div>
                <div className="checklist">
                  {STAGES.map(([key, label]) => (
                    <label key={key} className="check-item">
                      <input type="checkbox" checked={t.stages[key]} onChange={() => toggle(t.id, key)} /> {label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
