import { BookOpenCheck, CalendarDays, Clock, FileBarChart, LayoutDashboard, LineChart, ListChecks, Search, Settings as SettingsIcon } from "lucide-react";

export const SAP_SECTIONS = ["Fundamentals", "ABAP basics", "ABAP Objects", "DDIC", "SQL", "Reports/ALV", "Debugging", "Enhancements", "CDS/RAP", "Integration"];
const commonNavigation = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/syllabus", label: "Syllabus", icon: BookOpenCheck },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/study-tracker", label: "Study Tracker", icon: Clock },
  { to: "/mock-tests", label: "Mock Tests", sapLabel: "Practice Labs", icon: FileBarChart },
  { to: "/analytics", label: "Analytics", icon: LineChart },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];
export const MODE_CONFIG = {
  cgl: { name: "SSC CGL", navigation: commonNavigation, sections: ["Mathematics", "English", "Reasoning", "General Awareness"] },
  sap: { name: "SAP Prep", navigation: [...commonNavigation, { to: "/quick-reference", label: "T-code Reference", icon: Search }], sections: SAP_SECTIONS },
};
