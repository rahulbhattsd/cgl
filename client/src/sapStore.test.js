import test from "node:test";
import assert from "node:assert/strict";
import { freshSapData, readSapData, writeSapData, updateTopic, exportSapData, importSapData, sapStats, SAP_KEY, syllabus } from "./sapStore.js";

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
  assert.equal(syllabus.sections.length, 22);
  const data = freshSapData();
  data.topics["G-0"] = { status: "Learning" };
  assert.equal(sapStats(data).overall, 0);
  data.topics["G-0"].status = "Mastered";
  assert.equal(sapStats(data).overall, Math.round(100 / sapStats(data).topics.length));
  assert.equal(syllabus.milestones.length, 3);
  assert.equal(syllabus.phases.length, 4);
});
