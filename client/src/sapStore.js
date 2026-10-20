import syllabus from "./sapSyllabusData.js";
import legacyTopicMap from "./sapLegacyTopicMap.json" with { type: "json" };

export const SAP_KEY = "sap:progress";
export const SAP_STATUSES = ["Not started", "Learning", "Revised", "Mastered"];
export function freshSapData() {
  const milestones = Object.fromEntries(syllabus.milestones.map((_, index) => [`starter-${index}`, { done: false, notes: "" }]));
  return { topics: {}, milestones, resources: {}, studySessions: [], trainer: {}, planStart: new Date().toISOString().slice(0, 10), tasks: [], labs: [], calendarEvents: [] };
}
export function migrateSapData(data = {}) {
  const topics = { ...(data.topics || {}) };
  for (const [legacyId, topicId] of Object.entries(legacyTopicMap)) {
    const previous = topics[legacyId];
    if (!previous || topics[topicId]?.checks) continue;
    const status = previous.status;
    if (!["Learning", "Revised", "Mastered"].includes(status)) continue;
    topics[topicId] = {
      ...previous,
      ...(status === "Learning" ? { legacyStatus: "Learning" } : {}),
      checks: { study: status !== "Learning", r1: status === "Revised", r2: false, r3: false },
    };
  }
  return { ...freshSapData(), ...data, topics, milestones: data.milestones || {}, resources: data.resources || {}, studySessions: data.studySessions || [], trainer: data.trainer || {}, tasks: data.tasks || [], labs: data.labs || [], calendarEvents: data.calendarEvents || [] };
}
export function readSapData(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(SAP_KEY);
    const data = raw ? JSON.parse(raw) : freshSapData();
    return migrateSapData(data);
  } catch { return freshSapData(); }
}
export function writeSapData(data, storage = globalThis.localStorage) { try { storage?.setItem(SAP_KEY, JSON.stringify(data)); } catch { /* Storage can be unavailable in restricted browser contexts. */ } }
export function updateTopic(data, id, patch) { return { ...data, topics: { ...data.topics, [id]: { ...(data.topics[id] || {}), ...patch } } }; }
export function exportSapData(data) { return JSON.stringify({ version: 1, mode: "sap", exportedAt: new Date().toISOString(), progress: data }, null, 2); }
export function importSapData(text) {
  const parsed = JSON.parse(text);
  const data = parsed.progress || parsed;
  if ((parsed.mode && parsed.mode !== "sap") || !data || typeof data !== "object" || Array.isArray(data)) throw new Error("This file is not a valid SAP progress export.");
  return migrateSapData(data);
}
export function sapStats(data) {
  const topics = syllabus.sections.flatMap((s) => s.topics.map((t) => ({ ...t, section: s.name })));
  const complete = topics.filter((t) => data.topics[t.id]?.status === "Mastered").length;
  const phases = [...new Set(topics.map((t) => t.phase))];
  const sections = syllabus.sections.map((s) => {
    const list = s.topics; const done = list.filter((t) => data.topics[t.id]?.status === "Mastered").length;
    return { name: s.name, progress: list.length ? Math.round(done / list.length * 100) : 0 };
  });
  const sessions = data.studySessions;
  const activeDays = new Set(sessions.map((x) => x.date));
  let streak = 0; const dayMs = 86400000; let cursor = new Date(); cursor.setHours(0,0,0,0);
  if (!activeDays.has(cursor.toISOString().slice(0,10))) cursor = new Date(cursor.getTime() - dayMs);
  while (activeDays.has(cursor.toISOString().slice(0,10))) { streak++; cursor = new Date(cursor.getTime() - dayMs); }
  const next = topics.find((t) => !data.topics[t.id]?.status || data.topics[t.id]?.status === "Not started");
  return { topics, complete, overall: topics.length ? Math.round(complete / topics.length * 100) : 0, sections, phases, days: activeDays.size, streak, minutes: sessions.reduce((n, x) => n + (Number(x.minutes) || 0), 0), next };
}
export const REVISION_STAGES = [
  ["study", "Study"], ["r1", "R1"], ["r2", "R2"], ["r3", "R3"],
];
export function syllabusProgress(data) {
  const topics = syllabus.sections.flatMap((section) => section.topics.map((topic) => ({ ...topic, section, phase: section.phase })));
  const checksFor = (topic) => data.topics[topic.id]?.checks || {};
  const completed = (topic) => REVISION_STAGES.map(([key]) => !!checksFor(topic)[key]);
  const count = (list, key) => list.reduce((n, topic) => n + (checksFor(topic)[key] ? 1 : 0), 0);
  const full = (topic) => completed(topic).every(Boolean);
  const sectionStats = syllabus.sections.map((section) => {
    const list = topics.filter((topic) => topic.section.id === section.id);
    return { ...section, count: list.length, studied: count(list, "study"), fullyRevised: list.filter(full).length,
      revisionCount: list.reduce((n, topic) => n + completed(topic).slice(1).filter(Boolean).length, 0) };
  });
  const phaseStats = syllabus.phaseGroups.map((phase) => {
    const list = topics.filter((topic) => topic.phase === phase.number);
    const revisions = list.reduce((n, topic) => n + completed(topic).slice(1).filter(Boolean).length, 0);
    return { ...phase, count: list.length, sectionCount: phase.sections.length, studied: count(list, "study"),
      studyPct: list.length ? Math.round(count(list, "study") / list.length * 100) : 0,
      revisionCount: revisions, revisionPct: list.length ? Math.round(revisions / (list.length * 3) * 100) : 0,
      sections: sectionStats.filter((section) => section.phase === phase.number) };
  });
  const revisions = topics.reduce((n, topic) => n + completed(topic).slice(1).filter(Boolean).length, 0);
  const stageCounts = Object.fromEntries(REVISION_STAGES.map(([key]) => [key, count(topics, key)]));
  return { topics, count: topics.length, studied: stageCounts.study, studyPct: topics.length ? Math.round(stageCounts.study / topics.length * 100) : 0,
    revisions, revisionPct: topics.length ? Math.round(revisions / (topics.length * 3) * 100) : 0,
    stageCounts, fullyRevised: topics.filter(full).length, sections: sectionStats, phases: phaseStats,
    next: topics.find((topic) => !full(topic)) };
}
export { syllabus };
