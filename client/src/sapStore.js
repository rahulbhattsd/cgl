import syllabus from "./sapSyllabusData.js";

export const SAP_KEY = "sap:progress";
export const SAP_STATUSES = ["Not started", "Learning", "Revised", "Mastered"];
export function freshSapData() {
  const milestones = Object.fromEntries(syllabus.milestones.map((_, index) => [`starter-${index}`, { done: false, notes: "" }]));
  return { topics: {}, milestones, resources: {}, studySessions: [], trainer: {}, planStart: new Date().toISOString().slice(0, 10), tasks: [], labs: [], calendarEvents: [] };
}
export function migrateSapData(data = {}) {
  return { ...freshSapData(), ...data, topics: data.topics || {}, milestones: data.milestones || {}, resources: data.resources || {}, studySessions: data.studySessions || [], trainer: data.trainer || {}, tasks: data.tasks || [], labs: data.labs || [], calendarEvents: data.calendarEvents || [] };
}
export function readSapData(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(SAP_KEY);
    const data = raw ? JSON.parse(raw) : freshSapData();
    return migrateSapData(data);
  } catch { return freshSapData(); }
}
export function writeSapData(data, storage = globalThis.localStorage) { storage?.setItem(SAP_KEY, JSON.stringify(data)); }
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
export { syllabus };
