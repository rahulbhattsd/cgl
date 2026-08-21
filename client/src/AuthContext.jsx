import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("studedu_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("studedu_token");
    if (!token) { setLoading(false); return; }
    authApi.me().then(({ user }) => setUser(user)).catch(() => {
      localStorage.removeItem("studedu_token");
      localStorage.removeItem("studedu_user");
      setUser(null);
    }).finally(() => setLoading(false));
  }, []);

  const persist = ({ token, user }) => {
    localStorage.setItem("studedu_token", token);
    localStorage.setItem("studedu_user", JSON.stringify(user));
    setUser(user);
  };

  const login = async (email, password) => persist(await authApi.login({ email, password }));
  const register = async (name, email, password) => persist(await authApi.register({ name, email, password }));
  const logout = () => {
    localStorage.removeItem("studedu_token");
    localStorage.removeItem("studedu_user");
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
