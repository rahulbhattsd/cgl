import axios from "axios";

const client = axios.create({ baseURL: "/api" });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("studedu_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("studedu_token");
      localStorage.removeItem("studedu_user");
      if (!location.pathname.startsWith("/login")) location.href = "/login";
    }
    return Promise.reject(err);
  }
);

const msg = (err, fallback) => err?.response?.data?.message || fallback;

export const authApi = {
  register: (data) => client.post("/auth/register", data).then((r) => r.data).catch((e) => { throw new Error(msg(e, "Could not register")); }),
  login: (data) => client.post("/auth/login", data).then((r) => r.data).catch((e) => { throw new Error(msg(e, "Could not log in")); }),
  me: () => client.get("/auth/me").then((r) => r.data),
};

export const syllabusApi = {
  get: () => client.get("/syllabus").then((r) => r.data),
  toggleStage: (topicId, stage) => client.patch(`/syllabus/topics/${topicId}`, { stage }).then((r) => r.data),
};

export const studyApi = {
  list: (params) => client.get("/study-sessions", { params }).then((r) => r.data.sessions),
  create: (data) => client.post("/study-sessions", data).then((r) => r.data.session).catch((e) => { throw new Error(msg(e, "Could not save session")); }),
  update: (id, data) => client.patch(`/study-sessions/${id}`, data).then((r) => r.data.session),
  remove: (id) => client.delete(`/study-sessions/${id}`),
};

export const taskApi = {
  list: (params) => client.get("/tasks", { params }).then((r) => r.data.tasks),
  create: (data) => client.post("/tasks", data).then((r) => r.data.task).catch((e) => { throw new Error(msg(e, "Could not save task")); }),
  update: (id, data) => client.patch(`/tasks/${id}`, data).then((r) => r.data.task),
  remove: (id) => client.delete(`/tasks/${id}`),
};

export const mockApi = {
  list: (params) => client.get("/mocks", { params }).then((r) => r.data.mocks),
  create: (data) => client.post("/mocks", data).then((r) => r.data.mock).catch((e) => { throw new Error(msg(e, "Could not save mock")); }),
  update: (id, data) => client.patch(`/mocks/${id}`, data).then((r) => r.data.mock),
  remove: (id) => client.delete(`/mocks/${id}`),
};

export const dashboardApi = { get: () => client.get("/dashboard").then((r) => r.data) };
export const analyticsApi = { get: () => client.get("/analytics").then((r) => r.data) };
export const calendarApi = {
  get: (year) => client.get("/calendar", { params: { year } }).then((r) => r.data),
  getDay: (date) => client.get(`/calendar/${date}`).then((r) => r.data),
};
