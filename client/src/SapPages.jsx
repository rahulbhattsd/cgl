import { useEffect, useMemo, useState } from "react";
import { readSapData, sapStats, syllabusProgress, REVISION_STAGES, SAP_STATUSES, syllabus, updateTopic, writeSapData } from "./sapStore.js";

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
  useEffect(() => setDraft(data.planStart), [data.planStart]);
  const days = Math.max(0, Math.ceil((Date.parse(`${syllabus.joiningDate}T00:00:00`) - new Date().setHours(0,0,0,0)) / 86400000));
  const phaseWeeks = [[1,"Phase 1 · Week 1"],[2,"Phase 2 · Weeks 2–3"],[3,"Phase 3 · Weeks 4–5"],[4,"Phase 4 · Weeks 6–8"]];
  return <div className="stack sap-dashboard">
    <div className="grid kpi-grid">{[["SAP topics mastered",`${stats.overall}%`],["Study time",`${Math.floor(stats.minutes/60)}h ${stats.minutes%60}m`],["Current streak",`${stats.streak}d`],["Joining in",`${days} days`],["Active study days",stats.days],["Labs completed",Object.values(data.milestones).filter(x=>x?.done).length],["Weekly study time",`${Math.floor(stats.minutes/60)}h`],["Total topics",stats.topics.length]].map(([label,value],i)=><Kpi key={label} label={label} value={value} accent={i===0}/>)}</div>
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
  </div>;
}
function Kpi({label,value}) { return <div className="card kpi-card"><div className="kpi-label">{label}</div><div className="kpi-value accent">{value}</div></div>; }

export function SapSyllabus() {
  const [data, save] = useSapData();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(() => Object.fromEntries(syllabus.sections.map((section) => [section.id, false])));
  const stats = syllabusProgress(data);
  const query = search.trim().toLocaleLowerCase();
  const matches = (topic) => {
    const state = data.topics[topic.id]?.checks || {};
    const any = REVISION_STAGES.some(([key]) => state[key]);
    const revisions = ["r1", "r2", "r3"].filter((key) => state[key]).length;
    const isComplete = !!state.study && revisions === 3;
    const byFilter = filter === "all" ||
      (filter === "not-started" && !any) ||
      (filter === "studying" && !state.study && any) ||
      (filter === "studied" && !!state.study && revisions === 0) ||
      (filter === "revision-pending" && !!state.study && revisions < 3) ||
      (filter === "fully-revised" && isComplete);
    return byFilter && (!query || `${topic.name} ${topic.description || ""}`.toLocaleLowerCase().includes(query));
  };
  const filtered = useMemo(() => stats.sections.map((section) => ({
    ...section,
    visibleTopics: section.topics.filter(matches),
  })).filter((section) => section.visibleTopics.length), [stats, search, filter, data]);
  const setAllOpen = (value) => setOpen(Object.fromEntries(syllabus.sections.map((section) => [section.id, value])));
  const jumpToNext = () => {
    if (!stats.next) return;
    setOpen((current) => ({ ...current, [stats.next.section.id]: true }));
    window.setTimeout(() => document.getElementById(stats.next.id)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  };
  const toggle = (topic, key, checked) => {
    const value = data.topics[topic.id] || {};
    save(updateTopic(data, topic.id, { checks: { ...(value.checks || {}), [key]: checked } }));
  };
  const expandAll = Object.values(open).some((value) => !value);

  return <div className="stack sap-syllabus-page">
    <section className="card sap-syllabus-summary" aria-label="Syllabus progress">
      <div className="row sap-syllabus-title"><div><p className="sap-eyebrow">SAP + ABAP learning tracker</p><h2>Syllabus</h2></div><button className="btn btn-primary" onClick={jumpToNext} disabled={!stats.next}>{stats.next ? "Continue Learning" : "All topics complete"}</button></div>
      <div className="sap-progress-metrics">
        <div><span className="muted">Topics studied</span><strong>{stats.studyPct}%</strong><small>{stats.studied} / {stats.count}</small></div>
        <div><span className="muted">Revision progress</span><strong>{stats.revisionPct}%</strong><small>{stats.revisions} / {stats.count * 3} rounds</small></div>
        <div><span className="muted">Fully revised</span><strong>{stats.fullyRevised}</strong><small>all four checks complete</small></div>
        {REVISION_STAGES.slice(1).map(([key, label]) => <div key={key}><span className="muted">{label} complete</span><strong>{stats.stageCounts[key]} / {stats.count}</strong><small>{stats.count ? Math.round(stats.stageCounts[key] / stats.count * 100) : 0}% of topics</small></div>)}
      </div>
      <div className="progress-track sap-total-progress"><div className="progress-fill" style={{ width: `${stats.studyPct}%` }} /></div>
      <div className="field-row sap-syllabus-controls"><input aria-label="Search SAP syllabus" placeholder="Search topics..." value={search} onChange={(event) => setSearch(event.target.value)} /><select aria-label="Filter topics" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All topics</option><option value="not-started">Not Started</option><option value="studying">Studying</option><option value="studied">Studied</option><option value="revision-pending">Revision Pending</option><option value="fully-revised">Fully Revised</option></select><button className="btn" onClick={() => setAllOpen(expandAll)}>{expandAll ? "Expand all sections" : "Collapse all sections"}</button></div>
    </section>
    <div className="sap-phase-list">{stats.phases.map((phase) => <section className="card sap-phase-card" key={phase.number}>
      <div className="sap-phase-heading"><div><p className="sap-eyebrow">Phase {phase.number}</p><h3>{phase.title}</h3></div><div className="sap-phase-numbers"><span>{phase.sectionCount} sections</span><span>{phase.count} topics</span><span>{phase.studyPct}% studied</span><span>{phase.revisionPct}% revisions</span></div></div>
      <div className="progress-track sap-phase-progress"><div className="progress-fill" style={{ width: `${phase.studyPct}%` }} /></div>
      <div className="sap-section-list">{phase.sections.map((section) => {
        const expanded = !!open[section.id];
        const visible = filtered.find((item) => item.id === section.id)?.visibleTopics || [];
        return <section className="sap-outline-section" key={section.id}>
          <button className="syllabus-section-toggle" aria-expanded={expanded} aria-controls={`${section.id}-topics`} onClick={() => setOpen((current) => ({ ...current, [section.id]: !expanded }))}>
            <span><strong>Section {section.number}: {section.name}</strong><span className="sap-section-meta">{section.studied}/{section.count} studied ({section.count ? Math.round(section.studied / section.count * 100) : 0}%) · {section.fullyRevised} fully revised</span></span><span className="sap-section-expand">{expanded ? "Collapse" : "Expand"} · {section.count} topics</span>
          </button>
          {expanded && <div className="sap-syllabus-topics" id={`${section.id}-topics`}>
            {visible.length ? visible.map((topic) => {
              const state = data.topics[topic.id]?.checks || {};
              const complete = REVISION_STAGES.every(([key]) => state[key]);
              return <article className={`sap-checklist-topic${complete ? " is-complete" : ""}`} id={topic.id} key={topic.id}>
                <div className="sap-topic-name"><strong>{topic.name}</strong>{topic.description && <p>{topic.description}</p>}</div>
                <div className="sap-topic-checks">{REVISION_STAGES.map(([key, label]) => <label className="sap-revision-check" key={key}><input type="checkbox" checked={!!state[key]} aria-label={`${label} complete: ${topic.name}`} onChange={(event) => toggle(topic, key, event.target.checked)} /><span>{label}</span></label>)}</div>
                <span className="sap-topic-state" aria-live="polite">{complete ? "Complete" : state.study ? "Study complete · revisions pending" : data.topics[topic.id]?.legacyStatus === "Learning" ? "Previously marked Learning · study not checked" : "Not studied"}</span>
              </article>;
            }) : <p className="sap-filter-empty">No topics match this search or filter in this section.</p>}
          </div>}
        </section>;
      })}</div>
    </section>)}</div>
    {filtered.length === 0 && <div className="card empty-state">No syllabus topics match your search or filter.</div>}
  </div>;
}

export function SapQuickReference() {
  const [q,setQ]=useState(""); const results=syllabus.tcodes.filter(x=>`${x.code} ${x.description}`.toLowerCase().includes(q.toLowerCase()));
  return <section className="card"><h3>T-code quick reference</h3><p className="muted">Availability depends on system and role.</p><input aria-label="Search T-codes" placeholder="Search code or purpose..." value={q} onChange={e=>setQ(e.target.value)}/><div className="table-wrap"><table><thead><tr><th>T-code</th><th>Purpose</th></tr></thead><tbody>{results.map(x=><tr key={x.code}><td><code>{x.code}</code></td><td>{x.description}</td></tr>)}</tbody></table></div></section>;
}
