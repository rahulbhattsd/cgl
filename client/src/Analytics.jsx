import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from "recharts";
import { analyticsApi } from "./api.js";

const SUBJECTS = ["Mathematics", "English", "Reasoning", "General Awareness"];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [sectionalSubject, setSectionalSubject] = useState(SUBJECTS[0]);
  const [perfSubject, setPerfSubject] = useState(SUBJECTS[0]);

  useEffect(() => { analyticsApi.get().then(setData); }, []);

  if (!data) return <div className="loading">Loading analytics...</div>;

  const { mockSeries, mockStats, subjectPerformance, accuracy, studyHours, consistency, weakAreas, preparationHealth, revision } = data;
  const sectional = mockSeries.sectional.filter((m) => m.subject === sectionalSubject);
  const subjectData = subjectPerformance.find((s) => s.subject === perfSubject);

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="grid two-col">
        <div className="card">
          <h3>Preparation Health</h3>
          <div className="kpi-value accent" style={{ fontSize: 30 }}>{preparationHealth.score} / 100</div>
          <div className="grid" style={{ gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginTop: 14 }}>
            {Object.entries(preparationHealth.breakdown).map(([k, v]) => (
              <div key={k}>
                <div className="muted" style={{ fontSize: 11, textTransform: "capitalize" }}>{k}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{v}%</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3>Consistency</h3>
          <div className="kpi-value accent" style={{ fontSize: 30 }}>{consistency.score} / 100</div>
          <div className="muted" style={{ marginTop: 8 }}>Streak {consistency.currentStreak}d (longest {consistency.longestStreak}d) · {consistency.activeDaysLast30}/30 active days · avg {consistency.avgDailyMinutes30}min/day</div>
        </div>
      </div>

      <ChartCard title="Chart 1 — Full Mock Performance" series={mockSeries.fullMock} stats={mockStats.fullMock} yKey="pct" />
      <ChartCard title="Chart 2 — Tier 1 Performance" series={mockSeries.tier1} stats={mockStats.tier1} yKey="pct" />
      <ChartCard title="Chart 3 — Tier 2 Performance" series={mockSeries.tier2} stats={mockStats.tier2} yKey="pct" />

      <div className="card">
        <h3>Chart 4 — Sectional Mock Performance</h3>
        <div className="chip-row">
          {SUBJECTS.map((s) => <button key={s} className={`chip ${sectionalSubject === s ? "active" : ""}`} onClick={() => setSectionalSubject(s)}>{s}</button>)}
        </div>
        {sectional.length === 0 ? <div className="empty-state">Not enough data yet.</div> : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={sectional}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={11} />
              <YAxis stroke="var(--text-secondary)" fontSize={11} unit="%" />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)" }} />
              <Line type="monotone" dataKey="pct" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card">
        <h3>Chart 5 — Subject-wise Performance</h3>
        <div className="chip-row">
          {SUBJECTS.map((s) => <button key={s} className={`chip ${perfSubject === s ? "active" : ""}`} onClick={() => setPerfSubject(s)}>{s}</button>)}
        </div>
        <div className="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
          <Stat label="Accuracy" value={`${subjectData.accuracy}%`} />
          <Stat label="Attempted" value={subjectData.questionsAttempted} />
          <Stat label="Correct" value={subjectData.questionsCorrect} />
        </div>
        {subjectData.scoreTrend.length === 0 ? <div className="empty-state">Not enough data yet.</div> : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={subjectData.scoreTrend}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={11} />
              <YAxis stroke="var(--text-secondary)" fontSize={11} unit="%" />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)" }} />
              <Line type="monotone" dataKey="pct" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid two-col">
        <div className="card">
          <h3>Accuracy</h3>
          <div className="stack">
            <div className="row"><span>Overall</span><span className="muted">{accuracy.overall}%</span></div>
            {Object.entries(accuracy.bySubject).map(([s, v]) => <div key={s} className="row"><span>{s}</span><span className="muted">{v}%</span></div>)}
          </div>
        </div>
        <div className="card">
          <h3>Revision Tracking</h3>
          <div className="stack">
            <div><div className="row"><span>Revision 1</span><span className="muted">{revision.revision1}%</span></div><div className="progress-track"><div className="progress-fill" style={{ width: `${revision.revision1}%` }} /></div></div>
            <div><div className="row"><span>Revision 2</span><span className="muted">{revision.revision2}%</span></div><div className="progress-track"><div className="progress-fill" style={{ width: `${revision.revision2}%` }} /></div></div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Study Hours — Subject Distribution</h3>
        {studyHours.subjectDistribution.every((s) => s.pct === 0) ? <div className="empty-state">Not enough data yet.</div> : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={studyHours.subjectDistribution}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="subject" stroke="var(--text-secondary)" fontSize={11} />
              <YAxis stroke="var(--text-secondary)" fontSize={11} unit="%" />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)" }} />
              <Bar dataKey="pct" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card">
        <h3>Weak Areas</h3>
        {weakAreas.length === 0 ? <div className="empty-state">Not enough data yet. Complete more study sessions and mocks.</div> : (
          <div className="stack">
            {weakAreas.map((w) => (
              <div key={w.name} className="row"><span>{w.name} <span className="muted">· {w.subject}</span></span><span className="muted">{w.progress}%</span></div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChartCard({ title, series, stats, yKey }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="grid" style={{ gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 14 }}>
        <Stat label="Highest" value={`${stats.highest}%`} />
        <Stat label="Lowest" value={`${stats.lowest}%`} />
        <Stat label="Average" value={`${stats.average}%`} />
        <Stat label="Latest" value={`${stats.latest}%`} />
        <Stat label="Improvement" value={`${stats.improvement > 0 ? "+" : ""}${stats.improvement}%`} />
      </div>
      {series.length === 0 ? <div className="empty-state">Not enough data yet.</div> : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={series}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={11} />
            <YAxis stroke="var(--text-secondary)" fontSize={11} unit="%" />
            <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)" }} />
            <Line type="monotone" dataKey={yKey} stroke="var(--accent)" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
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
