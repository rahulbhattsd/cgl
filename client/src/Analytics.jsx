import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from "recharts";
import { analyticsApi } from "./api.js";
import { useMode } from "./ModeContext.jsx";
import { useSapData } from "./SapPages.jsx";
import { sapStats } from "./sapStore.js";

const SUBJECTS = ["Mathematics", "English", "Reasoning", "General Awareness"];

export default function Analytics() {
  const { mode } = useMode();
  const [sapData] = useSapData();
  const [data, setData] = useState(null);
  const [sectionalSubject, setSectionalSubject] = useState(SUBJECTS[0]);
  const [perfSubject, setPerfSubject] = useState(SUBJECTS[0]);

  useEffect(() => { if (mode === "cgl") analyticsApi.get().then(setData); }, [mode]);

  if (mode === "sap") return <SapAnalytics data={sapData} />;

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

function SapAnalytics({ data }) {
  const stats=sapStats(data);
  const sectionName=(name)=>({"A. ERP, SAP products and architecture":"Fundamentals","B. SAP navigation and daily operations":"Fundamentals","C. Organizational structure and data":"Fundamentals","D. Core functional modules (what each does + how they connect)":"Fundamentals","E. End-to-end business processes":"Fundamentals","F. Development environment":"ABAP basics","G. Language basics":"ABAP basics","H. Data types and structures":"ABAP basics","H2. Internal tables (critical)":"ABAP basics","I. Modularization":"ABAP Objects","J. ABAP Objects":"ABAP Objects","K. ABAP Dictionary (DDIC)":"DDIC","L. Database access and ABAP SQL":"SQL","M. Reports and output":"Reports/ALV","N. Transactions, debugging, troubleshooting":"Debugging","O. Enhancements and custom development":"Enhancements","Q1. CDS":"CDS/RAP","Q2. RAP":"CDS/RAP","R. Integration and APIs":"Integration"}[name]||name);
  const sections=stats.sections.map((s)=>({subject:s.name,hours:Math.round(data.studySessions.filter(x=>sectionName(x.section)===s.name).reduce((n,x)=>n+(Number(x.minutes)||0),0)/60*10)/10,progress:s.progress}));
  const byWeek=new Map();
  data.studySessions.forEach(s=>{const date=new Date(`${s.date}T00:00:00`);date.setDate(date.getDate()-((date.getDay()+6)%7));const key=date.toISOString().slice(0,10);byWeek.set(key,(byWeek.get(key)||0)+(Number(s.minutes)||0)/60);});
  const weekly=[...byWeek].sort(([a],[b])=>a.localeCompare(b)).slice(-12).map(([date,hours])=>({date,hours:Math.round(hours*10)/10}));
  const weak=stats.topics.filter(t=>{const value=data.topics[t.id]||{};return value.status==="Learning"||(Number(value.confidence)>0&&Number(value.confidence)<=2);}).slice(0,8);
  const health=Math.round((stats.overall+Math.min(stats.streak*10,100)+Math.min(stats.days/30*100,100))/3);
  const weekTotal=weekly.reduce((n,x)=>n+x.hours,0);
  return <div className="stack" style={{gap:18}}><div className="grid two-col"><section className="card"><h3>Preparation Health</h3><div className="kpi-value accent" style={{fontSize:30}}>{health} / 100</div><div className="grid health-grid">{[["Mastery",stats.overall],["Consistency",Math.min(stats.streak*10,100)],["Activity",Math.min(Math.round(stats.days/30*100),100)]].map(([k,v])=><div key={k}><div className="muted">{k}</div><strong>{v}%</strong></div>)}</div></section><section className="card"><h3>Consistency</h3><div className="kpi-value accent" style={{fontSize:30}}>{Math.min(stats.streak*10,100)} / 100</div><div className="muted">Streak {stats.streak}d · {stats.days} active days · {stats.minutes} study minutes</div></section></div><div className="grid two-col"><section className="card"><h3>Study Hours by Section</h3>{sections.every(s=>!s.hours)?<div className="empty-state">Log SAP study sessions to see section hours.</div>:<ResponsiveContainer width="100%" height={220}><BarChart data={sections}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3"/><XAxis dataKey="subject" stroke="var(--text-secondary)" fontSize={10}/><YAxis stroke="var(--text-secondary)"/><Tooltip contentStyle={{background:"var(--surface)",border:"1px solid var(--border)"}}/><Bar dataKey="hours" fill="var(--accent)" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer>}</section><section className="card"><h3>Weekly Study Hours</h3>{weekly.length===0?<div className="empty-state">Log sessions to see your weekly trend.</div>:<ResponsiveContainer width="100%" height={220}><LineChart data={weekly}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3"/><XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={10}/><YAxis stroke="var(--text-secondary)"/><Tooltip contentStyle={{background:"var(--surface)",border:"1px solid var(--border)"}}/><Line type="monotone" dataKey="hours" stroke="var(--accent)" strokeWidth={2} dot={{r:3}}/></LineChart></ResponsiveContainer>}</section></div><section className="card"><h3>Phase-wise Progress</h3><div className="stack">{[1,2,3,4].map(phase=>{const topics=stats.topics.filter(t=>t.phase===phase);const pct=topics.length?Math.round(topics.filter(t=>data.topics[t.id]?.status==="Mastered").length/topics.length*100):0;return <div key={phase}><div className="row"><span>Phase {phase}</span><span className="muted">{pct}%</span></div><div className="progress-track"><div className="progress-fill" style={{width:`${pct}%`}}/></div></div>})}</div></section><div className="grid two-col"><section className="card"><h3>Weak Topics</h3>{weak.length?<div className="stack">{weak.map(t=><div key={t.id} className="row"><span>{t.name}</span><span className="muted">{data.topics[t.id]?.confidence?`Confidence ${data.topics[t.id].confidence}/5`:"Learning"}</span></div>)}</div>:<div className="empty-state">No weak topics identified yet.</div>}</section><section className="card"><h3>Recent Activity</h3><div className="muted">{stats.days} active days · {weekTotal.toFixed(1)} hours this week · {stats.overall}% mastered</div></section></div></div>;
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
