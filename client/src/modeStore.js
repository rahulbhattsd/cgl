export const MODE_KEY = "studedu_mode";
export function readMode(storage = globalThis.localStorage) {
  return storage?.getItem(MODE_KEY) === "sap" ? "sap" : "cgl";
}
