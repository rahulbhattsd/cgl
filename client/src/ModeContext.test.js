import test from "node:test";
import assert from "node:assert/strict";
import { MODE_KEY, readMode } from "./modeStore.js";

test("mode defaults to CGL when unset or invalid", () => {
  assert.equal(readMode({ getItem: () => null }), "cgl");
  assert.equal(readMode({ getItem: () => "other" }), "cgl");
});

test("persisted SAP selection is restored", () => {
  assert.equal(readMode({ getItem: (key) => key === MODE_KEY ? "sap" : null }), "sap");
});
