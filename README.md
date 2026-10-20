# StudEdu — SSC CGL Preparation Command Center

A personal SSC CGL preparation, planning, consistency and analytics platform. GitHub-style contribution calendar + syllabus tracker + study tracker + task manager + mock test analytics, built MERN from scratch.

## Features

- JWT auth (register/login/logout, protected routes)
- Dashboard with real KPIs: syllabus %, study hours, streak, study days, tasks, mocks
- GitHub-style green contribution heatmap with click-to-view day detail
- Streak calculation (current + longest) computed from real activity, not the frontend
- SSC CGL syllabus (Maths, English, Reasoning, GA) with 6-stage topic tracking (Lecture/Notes/Practice/Test/Revision 1/Revision 2)
- Task manager with priority, filters, search
- Study session tracker with accuracy, totals (today/week/month/all-time)
- Mock test system (Full/Tier 1/Tier 2/Sectional) with conditional fields
- Analytics page: 5 required charts (Full Mock, Tier 1, Tier 2, Sectional, Subject-wise), accuracy, study-hour distribution, consistency score, weak areas, preparation health
- SAP Prep mode with a separate SAP syllabus, phase planner, tracker, milestones, and T-code reference

## Tech Stack

MERN — React + Vite (JS/JSX), plain CSS, Node/Express, MongoDB/Mongoose, Recharts, Lucide icons. No TypeScript, Tailwind, Bootstrap or Next.js.

## Folder Structure

```
studedu/
├── client/
│   ├── src/            (flat: pages + components + api.js + AuthContext.jsx + index.css)
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── server.js        (Express app + all routes)
│   ├── models.js         (all Mongoose models)
│   ├── auth.js            (JWT helpers/middleware)
│   ├── syllabusData.js     (SSC CGL syllabus seed data)
│   ├── seed.js
│   └── package.json
├── .env.example
└── package.json          (root, runs client+server together)
```

## Setup

1. Install MongoDB locally or use a MongoDB Atlas connection string.
2. Copy `.env.example` to `server/.env` and fill in `MONGO_URI` and `JWT_SECRET`.
3. Install everything:
   ```bash
   npm run install:all
   ```
4. Seed the SSC CGL syllabus (topics only — no fake user stats):
   ```bash
   npm run seed
   ```
5. Run client + server together:
   ```bash
   npm run dev
   ```
   Client: http://localhost:5173 · Server: http://localhost:5000

## Environment Variables (server/.env)

```
MONGO_URI=mongodb://127.0.0.1:27017/studedu
JWT_SECRET=replace_with_a_long_random_string
PORT=5000
CLIENT_URL=http://localhost:5173
```

## API Overview

```
POST   /api/auth/register | login | logout
GET    /api/auth/me

GET    /api/syllabus
PATCH  /api/syllabus/topics/:topicId   { stage }

GET/POST/PATCH/DELETE  /api/study-sessions
GET/POST/PATCH/DELETE  /api/tasks
GET/POST/PATCH/DELETE  /api/mocks

GET    /api/dashboard
GET    /api/analytics
GET    /api/calendar?year=YYYY
GET    /api/calendar/:date
```

All non-auth routes require `Authorization: Bearer <token>` and only ever touch the authenticated user's own data.

## Date Handling

All user-facing dates (study sessions, tasks, mocks) are stored as plain `YYYY-MM-DD` strings — never as timezone-aware timestamps — so streaks and daily aggregates never shift due to UTC conversion.

## SAP Prep mode

Use the CGL | SAP switch in the header to change preparation modes. The selection persists in `studedu_mode`; SAP study progress is kept separately in the `sap:*` localStorage namespace and can be exported/imported as JSON. SAP syllabus content lives in `client/src/sapSyllabus.json`: add a section with an `id`, `name`, `phase`, and `topics` array, then assign a distinct `id` to each section/topic position that remains stable for saved progress. Shared screens use `client/src/modeConfig.js` for per-mode labels, navigation and sections, while `[data-mode="sap"]` overrides the accent variables in `client/src/index.css`. A new preparation mode can follow the same pattern: add its config, syllabus/data adapter and theme variables, then reuse the shared screen structure. The existing CGL database records and API remain unchanged.

## Screenshots

_Add screenshots here after running the app locally._

## Future Improvements

- Move JWT from localStorage to an httpOnly cookie
- Per-topic activity dates on the calendar (currently keyed off sessions/tasks/mocks)
- Configurable daily study-time target used in the consistency formula
- Export/import study data
