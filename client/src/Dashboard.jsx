import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { dashboardApi } from "./api.js";
import { useMode } from "./ModeContext.jsx";
import { SapDashboard } from "./SapPages.jsx";

const minutesToLabel = (m) => `${Math.floor(m / 60)}h ${m % 60}m`;

export default function Dashboard() {
  const { mode } = useMode();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => { if (mode === "cgl") dashboardApi.get().then(setData).catch(() => setErr("Could not load dashboard data")); }, [mode]);

  if (mode === "sap") return <SapDashboard />;

  if (err) return <div className="empty-state">{err}</div>;
  if (!data) return <div className="loading">Loading dashboard...</div>;

  const { kpis, todayTasks, todayTasksSummary, syllabusBySubject, weakAreas, mockTrend } = data;

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="grid kpi-grid">
        <Kpi label="Overall Syllabus" value={`${kpis.overallSyllabus}%`} accent />
        <Kpi label="Study Hours" value={minutesToLabel(kpis.studyMinutes)} />
        <Kpi label="Current Streak" value={`${kpis.currentStreak}d`} />
        <Kpi label="Study Days" value={kpis.studyDays} />
        <Kpi label="Tasks Completed" value={`${kpis.tasksCompleted}/${kpis.tasksTotal}`} />
        <Kpi label="Total Mocks" value={kpis.totalMocks} />
        <Kpi label="Avg Mock Score" value={`${kpis.avgMockScore}%`} />
        <Kpi label="Longest Streak" value={`${kpis.longestStreak}d`} />
      </div>

      <div className="grid two-col">
        <div className="card">
          <h3>Today's Tasks</h3>
          {todayTasks.length === 0 ? (
            <div className="empty-state">No tasks scheduled for today.</div>
          ) : (
            <>
              <div className="stack">
                {todayTasks.map((t) => (
                  <div key={t.id} className="row">
                    <span style={{ textDecoration: t.completed ? "line-through" : "none", color: t.completed ? "var(--text-secondary)" : "var(--text-primary)" }}>{t.title}</span>
                    <span className={`pill pill-${t.priority.toLowerCase()}`}>{t.priority}</span>
                  </div>
                ))}
              </div>
              <div className="muted" style={{ marginTop: 12 }}>{todayTasksSummary.completed}/{todayTasksSummary.total} completed · {todayTasksSummary.pct}%</div>
              <div className="progress-track" style={{ marginTop: 6 }}><div className="progress-fill" style={{ width: `${todayTasksSummary.pct}%` }} /></div>
            </>
          )}
        </div>

        <div className="card">
          <h3>Syllabus Progress</h3>
          <div className="stack">
            {syllabusBySubject.map((s) => (
              <div key={s.subject}>
                <div className="row" style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 13 }}>{s.subject}</span>
                  <span className="muted">{s.progress}%</span>
                </div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${s.progress}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Mock Performance (last 10)</h3>
        {mockTrend.length === 0 ? (
          <div className="empty-state">Not enough data yet. Add a mock test to see your trend.</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={mockTrend}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={11} />
              <YAxis stroke="var(--text-secondary)" fontSize={11} unit="%" />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)" }} />
              <Line type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card">
        <h3>Weak Areas</h3>
        {weakAreas.length === 0 ? (
          <div className="empty-state">Not enough data yet. Complete more study sessions and mocks.</div>
        ) : (
          <div className="stack">
            {weakAreas.map((w) => (
              <div key={w.name}>
                <div className="row" style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 13 }}>{w.name} <span className="muted">· {w.subject}</span></span>
                  <span className="muted">{w.progress}%</span>
                </div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${w.progress}%`, background: "var(--warning)" }} /></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, accent }) {
  return (
    <div className="card kpi-card">
      <div className="kpi-label">{label}</div>
      <div className={`kpi-value ${accent ? "accent" : ""}`}>{value}</div>
    </div>
  );
}
