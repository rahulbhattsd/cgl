import test from "node:test";
import assert from "node:assert/strict";
import { freshSapData, readSapData, writeSapData, updateTopic, exportSapData, importSapData, sapStats, syllabusProgress, SAP_KEY, syllabus } from "./sapStore.js";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: (k) => values.get(k) ?? null, setItem: (k, v) => values.set(k, v), values };
}

test("SAP progress uses its own namespace and keeps saved data", () => {
  const storage = memoryStorage({ "studedu_cgl_progress": "legacy cgl" });
  const data = updateTopic(readSapData(storage), "G-0", { status: "Learning", notes: "Syntax" });
  writeSapData(data, storage);
  assert.equal(storage.getItem(SAP_KEY) != null, true);
  assert.equal(storage.getItem("studedu_cgl_progress"), "legacy cgl");
  assert.equal(readSapData(storage).topics["G-0"].status, "Learning");
});

test("empty, malformed and unnamespaced legacy storage never overwrites CGL data", () => {
  const storage = memoryStorage({ "studedu_cgl_progress": JSON.stringify({ topics: { "G-0": "legacy" } }), [SAP_KEY]: "not-json" });
  assert.deepEqual(readSapData(storage).topics, {});
  assert.equal(storage.getItem("studedu_cgl_progress"), JSON.stringify({ topics: { "G-0": "legacy" } }));
  assert.deepEqual(freshSapData().studySessions, []);
});

test("SAP backup round-trip preserves milestones and rejects CGL export", () => {
  const data = { ...freshSapData(), milestones: { 1: { done: true, notes: "done" } } };
  assert.deepEqual(importSapData(exportSapData(data)).milestones, data.milestones);
  assert.throws(() => importSapData(JSON.stringify({ mode: "cgl", progress: {} })));
});

test("SAP syllabus preserves phases, practice and master-only completion", () => {
  assert.equal(syllabus.sections.length, 25);
  assert.equal(syllabus.sections.reduce((n, section) => n + section.topics.length, 0), 436);
  const data = freshSapData();
  const topicId = syllabus.sections[6].topics[0].id;
  data.topics[topicId] = { status: "Learning" };
  assert.equal(sapStats(data).overall, 0);
  data.topics[topicId].status = "Mastered";
  assert.equal(sapStats(data).overall, Math.round(100 / sapStats(data).topics.length));
  assert.equal(syllabus.milestones.length, 3);
  assert.equal(syllabus.phaseGroups.length, 6);
});

test("topic checks are independent and revision statistics use the full syllabus", () => {
  const data = freshSapData();
  const topicId = syllabus.sections[0].topics[0].id;
  data.topics[topicId] = { checks: { study: true, r1: true, r2: false, r3: false } };
  const stats = syllabusProgress(data);
  assert.equal(stats.count, 436);
  assert.equal(stats.studied, 1);
  assert.equal(stats.revisions, 1);
  assert.equal(stats.stageCounts.r1, 1);
  assert.equal(stats.stageCounts.r2, 0);
  assert.equal(stats.stageCounts.r3, 0);
  assert.equal(stats.studyPct, Math.round(100 / 436));
  assert.equal(stats.revisionPct, Math.round(100 / (436 * 3)));
});

test("each topic checkbox persists independently through the SAP storage adapter", () => {
  const storage = memoryStorage();
  let data = readSapData(storage);
  const topicId = syllabus.sections[0].topics[0].id;
  for (const check of ["study", "r1", "r2", "r3"]) {
    data = updateTopic(data, topicId, { checks: { ...(data.topics[topicId]?.checks || {}), [check]: true } });
  }
  writeSapData(data, storage);
  const restored = readSapData(storage);
  assert.deepEqual(restored.topics[topicId].checks, { study: true, r1: true, r2: true, r3: true });
});

test("unambiguous legacy SAP statuses migrate to checklist ticks without removing old records", () => {
  const legacyId = "J-0";
  const targetId = "section-11-topic-01";
  const storage = memoryStorage({ [SAP_KEY]: JSON.stringify({ topics: { [legacyId]: { status: "Mastered", notes: "saved" } } }) });
  const data = readSapData(storage);
  assert.deepEqual(data.topics[targetId].checks, { study: true, r1: false, r2: false, r3: false });
  assert.equal(data.topics[targetId].notes, "saved");
  assert.equal(data.topics[legacyId].status, "Mastered");
  const learning = readSapData(memoryStorage({ [SAP_KEY]: JSON.stringify({ topics: { "C-0": { status: "Learning" } } }) }));
  assert.deepEqual(learning.topics["section-03-topic-01"].checks, { study: false, r1: false, r2: false, r3: false });
  assert.equal(learning.topics["section-03-topic-01"].legacyStatus, "Learning");
});
