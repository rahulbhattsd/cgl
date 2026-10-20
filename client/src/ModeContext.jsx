import { createContext, useContext, useEffect, useState } from "react";
import { MODE_KEY, readMode } from "./modeStore.js";

const ModeContext = createContext(null);
export { MODE_KEY, readMode };
export function ModeProvider({ children }) {
  const [mode, setCurrentMode] = useState(readMode);
  useEffect(() => { document.documentElement.dataset.mode = mode; document.title = `StudEdu — ${mode === "sap" ? "SAP Prep" : "SSC CGL Command Center"}`; }, [mode]);
  const changeMode = (next) => { if (next === "cgl" || next === "sap") { try { localStorage.setItem(MODE_KEY, next); } catch {} setCurrentMode(next); } };
  return <ModeContext.Provider value={{ mode, setMode: changeMode }}>{children}</ModeContext.Provider>;
}
export const useMode = () => useContext(ModeContext);
