import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User, Topic, TopicProgress, StudySession, Task, MockTest } from "./models.js";
import { signToken, requireAuth } from "./auth.js";
import path from "path";
import { fileURLToPath } from "url";
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// ---------- date helpers (see models.js note: dates are plain YYYY-MM-DD strings) ----------
const todayStr = () => new Date().toISOString().slice(0, 10);
const addDays = (str, n) => {
  const d = new Date(str + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const diffDays = (a, b) => Math.round((new Date(b + "T00:00:00Z") - new Date(a + "T00:00:00Z")) / 86400000);
const safePct = (num, den) => (den > 0 ? Math.round((num / den) * 1000) / 10 : 0);

function computeStreaks(dateStrings) {
  const unique = [...new Set(dateStrings)].sort();
  if (!unique.length) return { current: 0, longest: 0, activeDays: 0 };
  let longest = 1, run = 1;
  for (let i = 1; i < unique.length; i++) {
    run = diffDays(unique[i - 1], unique[i]) === 1 ? run + 1 : 1;
    if (run > longest) longest = run;
  }
  const set = new Set(unique);
  const t = todayStr();
  let cursor = set.has(t) ? t : addDays(t, -1);
  let current = 0;
  while (set.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }
  return { current, longest, activeDays: unique.length };
}

// ================= AUTH =================
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Name, email and password are required" });
    if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "An account with this email already exists" });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: email.toLowerCase(), password: hash });
    const token = signToken(user._id);
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: "Could not register right now" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });
    const ok = await bcrypt.compare(password || "", user.password);
    if (!ok) return res.status(401).json({ message: "Invalid email or password" });
    const token = signToken(user._id);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch {
    res.status(500).json({ message: "Could not log in right now" });
  }
});

app.post("/api/auth/logout", (req, res) => res.json({ message: "Logged out" }));

app.get("/api/auth/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId).select("name email createdAt");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user });
});

// ================= SYLLABUS =================
app.get("/api/syllabus", requireAuth, async (req, res) => {
  const topics = await Topic.find().sort({ subject: 1, order: 1 });
  const progress = await TopicProgress.find({ user: req.userId });
  const progressMap = new Map(progress.map((p) => [String(p.topic), p]));
  const STAGES = ["lecture", "notes", "practice", "test", "revision1", "revision2"];

  const subjects = {};
  for (const t of topics) {
    const p = progressMap.get(String(t._id));
    const stages = Object.fromEntries(STAGES.map((s) => [s, p ? p[s] : false]));
    const done = STAGES.filter((s) => stages[s]).length;
    if (!subjects[t.subject]) subjects[t.subject] = [];
    subjects[t.subject].push({ id: t._id, name: t.name, order: t.order, stages, progress: safePct(done, STAGES.length) });
  }

  const subjectSummary = Object.entries(subjects).map(([subject, topicList]) => {
    const totalStages = topicList.length * STAGES.length;
    const doneStages = topicList.reduce((sum, t) => sum + Math.round((t.progress / 100) * STAGES.length), 0);
    return { subject, progress: safePct(doneStages, totalStages), topicCount: topicList.length };
  });

  const allTopics = Object.values(subjects).flat();
  const totalStages = allTopics.length * STAGES.length;
  let doneStages = 0, stageDoneCounts = Object.fromEntries(STAGES.map((s) => [s, 0]));
  for (const t of allTopics) {
    for (const s of STAGES) if (t.stages[s]) { doneStages++; stageDoneCounts[s]++; }
  }
  const stageCompletion = Object.fromEntries(STAGES.map((s) => [s, safePct(stageDoneCounts[s], allTopics.length)]));

  res.json({
    subjects,
    subjectSummary,
    overallProgress: safePct(doneStages, totalStages),
    stageCompletion,
  });
});

app.patch("/api/syllabus/topics/:topicId", requireAuth, async (req, res) => {
  const STAGES = ["lecture", "notes", "practice", "test", "revision1", "revision2"];
  const { stage } = req.body;
  if (!STAGES.includes(stage)) return res.status(400).json({ message: "Invalid stage" });
  const topic = await Topic.findById(req.params.topicId);
  if (!topic) return res.status(404).json({ message: "Topic not found" });

  let progress = await TopicProgress.findOne({ user: req.userId, topic: topic._id });
  if (!progress) progress = new TopicProgress({ user: req.userId, topic: topic._id });
  progress[stage] = !progress[stage];
  await progress.save();
  res.json({ topicId: topic._id, stage, value: progress[stage] });
});

// ================= STUDY SESSIONS =================
app.get("/api/study-sessions", requireAuth, async (req, res) => {
  const { subject, from, to, q } = req.query;
  const filter = { user: req.userId };
  if (subject) filter.subject = subject;
  if (from || to) filter.date = { ...(from && { $gte: from }), ...(to && { $lte: to }) };
  if (q) filter.$or = [{ topic: new RegExp(q, "i") }, { notes: new RegExp(q, "i") }];
  const sessions = await StudySession.find(filter).sort({ date: -1, createdAt: -1 });
  res.json({ sessions });
});

app.post("/api/study-sessions", requireAuth, async (req, res) => {
  try {
    const { date, subject, topic, duration, questionsAttempted, questionsCorrect, notes } = req.body;
    if (!date || !subject || !duration) return res.status(400).json({ message: "Date, subject and duration are required" });
    const session = await StudySession.create({
      user: req.userId, date, subject, topic, duration,
      questionsAttempted: questionsAttempted || 0, questionsCorrect: Math.min(questionsCorrect || 0, questionsAttempted || 0),
      notes,
    });
    res.status(201).json({ session });
  } catch {
    res.status(500).json({ message: "Could not save study session" });
  }
});

app.patch("/api/study-sessions/:id", requireAuth, async (req, res) => {
  const session = await StudySession.findOneAndUpdate({ _id: req.params.id, user: req.userId }, req.body, { new: true });
  if (!session) return res.status(404).json({ message: "Session not found" });
  res.json({ session });
});

app.delete("/api/study-sessions/:id", requireAuth, async (req, res) => {
  const r = await StudySession.deleteOne({ _id: req.params.id, user: req.userId });
  if (!r.deletedCount) return res.status(404).json({ message: "Session not found" });
  res.json({ message: "Deleted" });
});

// ================= TASKS =================
app.get("/api/tasks", requireAuth, async (req, res) => {
  const { date, completed, priority, q, view } = req.query;
  const filter = { user: req.userId };
  const today = todayStr();

  if (view === "today") {
    filter.date = today;
  } else if (view === "backlog") {
    filter.date = { $lt: today };
    filter.completed = false;
  } else {
    if (date) filter.date = date;
    if (completed !== undefined) filter.completed = completed === "true";
  }
  if (priority) filter.priority = priority;
  if (q) filter.title = new RegExp(q, "i");

  const tasks = await Task.find(filter);
  const RANK = { High: 3, Medium: 2, Low: 1 };
  tasks.sort((a, b) => (RANK[b.priority] - RANK[a.priority]) || a.date.localeCompare(b.date));
  res.json({ tasks });
});

app.post("/api/tasks", requireAuth, async (req, res) => {
  try {
    const { title, date } = req.body;
    if (!title || !date) return res.status(400).json({ message: "Title and date are required" });
    const task = await Task.create({ ...req.body, user: req.userId });
    res.status(201).json({ task });
  } catch {
    res.status(500).json({ message: "Could not save task" });
  }
});

app.patch("/api/tasks/:id", requireAuth, async (req, res) => {
  const task = await Task.findOneAndUpdate({ _id: req.params.id, user: req.userId }, req.body, { new: true });
  if (!task) return res.status(404).json({ message: "Task not found" });
  res.json({ task });
});

app.delete("/api/tasks/:id", requireAuth, async (req, res) => {
  const r = await Task.deleteOne({ _id: req.params.id, user: req.userId });
  if (!r.deletedCount) return res.status(404).json({ message: "Task not found" });
  res.json({ message: "Deleted" });
});

// ================= MOCK TESTS =================
app.get("/api/mocks", requireAuth, async (req, res) => {
  const { type, subject, from, to } = req.query;
  const filter = { user: req.userId };
  if (type) filter.type = type;
  if (subject) filter.subject = subject;
  if (from || to) filter.date = { ...(from && { $gte: from }), ...(to && { $lte: to }) };
  const mocks = await MockTest.find(filter).sort({ date: -1 });
  res.json({ mocks });
});

app.post("/api/mocks", requireAuth, async (req, res) => {
  try {
    const body = req.body;
    if (!body.date || !body.type || !body.tier || body.totalMarks == null || body.score == null)
      return res.status(400).json({ message: "Date, type, tier, total marks and score are required" });
    if (body.type === "Sectional" && !body.subject)
      return res.status(400).json({ message: "Subject is required for a sectional mock" });
    const mock = await MockTest.create({ ...body, user: req.userId });
    res.status(201).json({ mock });
  } catch {
    res.status(500).json({ message: "Could not save mock test" });
  }
});

app.patch("/api/mocks/:id", requireAuth, async (req, res) => {
  const mock = await MockTest.findOneAndUpdate({ _id: req.params.id, user: req.userId }, req.body, { new: true });
  if (!mock) return res.status(404).json({ message: "Mock not found" });
  res.json({ mock });
});

app.delete("/api/mocks/:id", requireAuth, async (req, res) => {
  const r = await MockTest.deleteOne({ _id: req.params.id, user: req.userId });
  if (!r.deletedCount) return res.status(404).json({ message: "Mock not found" });
  res.json({ message: "Deleted" });
});

// ================= CALENDAR =================
app.get("/api/calendar", requireAuth, async (req, res) => {
  const year = req.query.year || String(new Date().getFullYear());
  const from = `${year}-01-01`, to = `${year}-12-31`;
  const sessions = await StudySession.find({ user: req.userId, date: { $gte: from, $lte: to } });
  const tasks = await Task.find({ user: req.userId, date: { $gte: from, $lte: to }, completed: true });
  const mocks = await MockTest.find({ user: req.userId, date: { $gte: from, $lte: to } });

  const byDate = {};
  const ensure = (d) => (byDate[d] ||= { date: d, totalStudyMinutes: 0, tasksCompleted: 0, mocksCompleted: 0, questionsSolved: 0 });
  for (const s of sessions) {
    const e = ensure(s.date);
    e.totalStudyMinutes += s.duration;
    e.questionsSolved += s.questionsAttempted || 0;
  }
  for (const t of tasks) ensure(t.date).tasksCompleted += 1;
  for (const m of mocks) ensure(m.date).mocksCompleted += 1;

  const days = Object.values(byDate).map((d) => {
    // Activity score blends study time with completed tasks/mocks so a day with
    // only completed tasks (no logged study session) still shows green.
    const score = d.totalStudyMinutes + d.tasksCompleted * 30 + d.mocksCompleted * 45;
    const level = score === 0 ? 0 : score <= 60 ? 1 : score <= 120 ? 2 : score <= 180 ? 3 : 4;
    return { ...d, level };
  });

  res.json({ year, days });
});

app.get("/api/calendar/:date", requireAuth, async (req, res) => {
  const { date } = req.params;
  const [sessions, tasks, mocks] = await Promise.all([
    StudySession.find({ user: req.userId, date }).sort({ createdAt: 1 }),
    Task.find({ user: req.userId, date }),
    MockTest.find({ user: req.userId, date }),
  ]);
  const totalStudyMinutes = sessions.reduce((s, x) => s + x.duration, 0);
  const attempted = sessions.reduce((s, x) => s + (x.questionsAttempted || 0), 0);
  const correct = sessions.reduce((s, x) => s + (x.questionsCorrect || 0), 0);
  res.json({
    date,
    totalStudyMinutes,
    tasksCompleted: tasks.filter((t) => t.completed).length,
    tasksTotal: tasks.length,
    questionsSolved: attempted,
    accuracy: safePct(correct, attempted),
    mocksCompleted: mocks.length,
    sessions, tasks, mocks,
  });
});

// ================= DASHBOARD =================
app.get("/api/dashboard", requireAuth, async (req, res) => {
  const userId = req.userId;
  const [topics, progress, sessions, tasks, mocks] = await Promise.all([
    Topic.find(),
    TopicProgress.find({ user: userId }),
    StudySession.find({ user: userId }),
    Task.find({ user: userId }),
    MockTest.find({ user: userId }),
  ]);

  const STAGES = ["lecture", "notes", "practice", "test", "revision1", "revision2"];
  const progressMap = new Map(progress.map((p) => [String(p.topic), p]));
  let doneStages = 0;
  const subjectTotals = {};
  for (const t of topics) {
    const p = progressMap.get(String(t._id));
    const done = p ? STAGES.filter((s) => p[s]).length : 0;
    doneStages += done;
    subjectTotals[t.subject] ||= { done: 0, total: 0 };
    subjectTotals[t.subject].done += done;
    subjectTotals[t.subject].total += STAGES.length;
  }
  const overallSyllabus = safePct(doneStages, topics.length * STAGES.length);
  const syllabusBySubject = Object.entries(subjectTotals).map(([subject, v]) => ({ subject, progress: safePct(v.done, v.total) }));

  const totalStudyMinutes = sessions.reduce((s, x) => s + x.duration, 0);
  const activeDates = [...new Set(sessions.filter((s) => s.duration > 0).map((s) => s.date))];
  const { current, longest, activeDays } = computeStreaks(activeDates);

  const today = todayStr();
  const todayTasks = tasks.filter((t) => t.date === today);
  const completedToday = todayTasks.filter((t) => t.completed).length;

  const avgMockScore = mocks.length
    ? Math.round((mocks.reduce((s, m) => s + safePct(m.score, m.totalMarks), 0) / mocks.length) * 10) / 10
    : 0;

  // weak areas: lowest-progress topics that have at least started, plus lowest sectional/subject mock accuracy
  const weakTopics = [];
  for (const t of topics) {
    const p = progressMap.get(String(t._id));
    const done = p ? STAGES.filter((s) => p[s]).length : 0;
    if (done > 0 && done < STAGES.length) weakTopics.push({ name: t.name, subject: t.subject, progress: safePct(done, STAGES.length) });
  }
  weakTopics.sort((a, b) => a.progress - b.progress);

  const recentMinutesLast7 = sessions
    .filter((s) => diffDays(s.date, today) <= 6 && diffDays(s.date, today) >= 0)
    .reduce((s, x) => s + x.duration, 0);

  res.json({
    kpis: {
      overallSyllabus,
      studyMinutes: totalStudyMinutes,
      currentStreak: current,
      longestStreak: longest,
      studyDays: activeDays,
      tasksCompleted: tasks.filter((t) => t.completed).length,
      tasksTotal: tasks.length,
      totalMocks: mocks.length,
      avgMockScore,
    },
    todayTasks: todayTasks.map((t) => ({ id: t._id, title: t.title, completed: t.completed, priority: t.priority })),
    todayTasksSummary: { completed: completedToday, total: todayTasks.length, pct: safePct(completedToday, todayTasks.length) },
    syllabusBySubject,
    weakAreas: weakTopics.slice(0, 5),
    recentMinutesLast7,
    mockTrend: mocks
      .slice()
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .slice(-10)
      .map((m) => ({ date: m.date, score: safePct(m.score, m.totalMarks) })),
  });
});

// ================= ANALYTICS =================
app.get("/api/analytics", requireAuth, async (req, res) => {
  const userId = req.userId;
  const [sessions, mocks, topics, progress] = await Promise.all([
    StudySession.find({ user: userId }),
    MockTest.find({ user: userId }).sort({ date: 1 }),
    Topic.find(),
    TopicProgress.find({ user: userId }),
  ]);

  const byType = (type) => mocks.filter((m) => m.type === type).map((m) => ({ date: m.date, score: m.score, pct: safePct(m.score, m.totalMarks) }));
  const byTier = (tier) => mocks.filter((m) => m.tier === tier).map((m) => ({ date: m.date, score: m.score, pct: safePct(m.score, m.totalMarks) }));
  const mockSeries = {
    fullMock: byType("Full Mock"),
    tier1: byTier("Tier 1"),
    tier2: byTier("Tier 2"),
    sectional: mocks.filter((m) => m.type === "Sectional").map((m) => ({ date: m.date, subject: m.subject, score: m.score, pct: safePct(m.score, m.totalMarks) })),
  };

  const stats = (arr, key = "pct") => {
    if (!arr.length) return { highest: 0, lowest: 0, average: 0, latest: 0, total: 0, improvement: 0 };
    const vals = arr.map((x) => x[key]);
    const improvement = Math.round((vals[vals.length - 1] - vals[0]) * 10) / 10;
    return {
      highest: Math.max(...vals), lowest: Math.min(...vals),
      average: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10,
      latest: vals[vals.length - 1], total: arr.length, improvement,
    };
  };

  const SUBJECTS = ["Mathematics", "English", "Reasoning", "General Awareness"];
  const subjectPerformance = SUBJECTS.map((subject) => {
    const subMocks = mocks.filter((m) => m.subject === subject);
    const subSessions = sessions.filter((s) => s.subject === subject);
    const attempted = subSessions.reduce((s, x) => s + (x.questionsAttempted || 0), 0);
    const correct = subSessions.reduce((s, x) => s + (x.questionsCorrect || 0), 0);
    return {
      subject,
      scoreTrend: subMocks.map((m) => ({ date: m.date, pct: safePct(m.score, m.totalMarks) })),
      accuracy: safePct(correct, attempted),
      questionsAttempted: attempted,
      questionsCorrect: correct,
    };
  });

  const subjectAccuracy = Object.fromEntries(subjectPerformance.map((s) => [s.subject, s.accuracy]));
  const overallAttempted = sessions.reduce((s, x) => s + (x.questionsAttempted || 0), 0);
  const overallCorrect = sessions.reduce((s, x) => s + (x.questionsCorrect || 0), 0);

  // study hours by day/week/month + subject distribution
  const dailyMap = {};
  for (const s of sessions) dailyMap[s.date] = (dailyMap[s.date] || 0) + s.duration;
  const dailyHours = Object.entries(dailyMap).sort().map(([date, minutes]) => ({ date, hours: Math.round((minutes / 60) * 100) / 100 }));

  const weekKey = (date) => {
    const d = new Date(date + "T00:00:00Z");
    const onejan = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((d - onejan) / 86400000 + onejan.getUTCDay() + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
  };
  const weeklyMap = {};
  for (const s of sessions) { const k = weekKey(s.date); weeklyMap[k] = (weeklyMap[k] || 0) + s.duration; }
  const weeklyHours = Object.entries(weeklyMap).sort().map(([week, minutes]) => ({ week, hours: Math.round((minutes / 60) * 100) / 100 }));

  const monthlyMap = {};
  for (const s of sessions) { const k = s.date.slice(0, 7); monthlyMap[k] = (monthlyMap[k] || 0) + s.duration; }
  const monthlyHours = Object.entries(monthlyMap).sort().map(([month, minutes]) => ({ month, hours: Math.round((minutes / 60) * 100) / 100 }));

  const totalMinutes = sessions.reduce((s, x) => s + x.duration, 0);
  const subjectDistribution = SUBJECTS.map((subject) => ({
    subject, pct: safePct(sessions.filter((s) => s.subject === subject).reduce((s, x) => s + x.duration, 0), totalMinutes),
  }));

  // consistency: heuristic, documented — average of (streak/30), (active days in last 30 / 30), (avg daily minutes last 30 / 120 target)
  const activeDates = [...new Set(sessions.filter((s) => s.duration > 0).map((s) => s.date))];
  const { current, longest, activeDays } = computeStreaks(activeDates);
  const today = todayStr();
  const last30 = sessions.filter((s) => diffDays(s.date, today) >= 0 && diffDays(s.date, today) <= 29);
  const activeDaysLast30 = new Set(last30.map((s) => s.date)).size;
  const minutesLast30 = last30.reduce((s, x) => s + x.duration, 0);
  const avgDailyMinutes30 = minutesLast30 / 30;
  const DAILY_TARGET_MINUTES = 120;
  const streakScore = Math.min(current / 30, 1) * 100;
  const activeRatioScore = (activeDaysLast30 / 30) * 100;
  const targetScore = Math.min(avgDailyMinutes30 / DAILY_TARGET_MINUTES, 1) * 100;
  const consistency = Math.round((streakScore + activeRatioScore + targetScore) / 3);

  // weak areas (same heuristic as dashboard, topic-level)
  const STAGES = ["lecture", "notes", "practice", "test", "revision1", "revision2"];
  const progressMap = new Map(progress.map((p) => [String(p.topic), p]));
  const weakAreas = [];
  for (const t of topics) {
    const p = progressMap.get(String(t._id));
    const done = p ? STAGES.filter((s) => p[s]).length : 0;
    if (done > 0 && done < STAGES.length) weakAreas.push({ name: t.name, subject: t.subject, progress: safePct(done, STAGES.length) });
  }
  weakAreas.sort((a, b) => a.progress - b.progress);

  const revision1Pct = safePct(progress.filter((p) => p.revision1).length, topics.length || 1);
  const revision2Pct = safePct(progress.filter((p) => p.revision2).length, topics.length || 1);
  let doneStages = 0;
  for (const t of topics) { const p = progressMap.get(String(t._id)); doneStages += p ? STAGES.filter((s) => p[s]).length : 0; }
  const syllabusPct = safePct(doneStages, topics.length * STAGES.length);
  const avgMockPct = mocks.length ? Math.round((mocks.reduce((s, m) => s + safePct(m.score, m.totalMarks), 0) / mocks.length) * 10) / 10 : 0;
  const overallAccuracyPct = safePct(overallCorrect, overallAttempted);
  const revisionAvg = Math.round(((revision1Pct + revision2Pct) / 2) * 10) / 10;

  // preparation health: equal-weight average of five components (documented, not scientific)
  const preparationHealth = Math.round((syllabusPct + consistency + revisionAvg + avgMockPct + overallAccuracyPct) / 5);

  res.json({
    mockSeries,
    mockStats: { fullMock: stats(mockSeries.fullMock), tier1: stats(mockSeries.tier1), tier2: stats(mockSeries.tier2), sectional: stats(mockSeries.sectional) },
    subjectPerformance,
    accuracy: { overall: overallAccuracyPct, bySubject: subjectAccuracy },
    studyHours: { daily: dailyHours, weekly: weeklyHours, monthly: monthlyHours, subjectDistribution },
    consistency: { score: consistency, currentStreak: current, longestStreak: longest, activeDays, activeDaysLast30, avgDailyMinutes30: Math.round(avgDailyMinutes30) },
    weakAreas: weakAreas.slice(0, 8),
    preparationHealth: { score: preparationHealth, breakdown: { syllabus: syllabusPct, consistency, revision: revisionAvg, mockScore: avgMockPct, accuracy: overallAccuracyPct } },
    revision: { revision1: revision1Pct, revision2: revision2Pct },
  });
});

app.use("/api", (req, res) => res.status(404).json({ message: "Not found" }));

const clientDist = path.join(__dirname, "../client/dist");
app.use(express.static(clientDist));
app.get("*", (req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`StudEdu server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
