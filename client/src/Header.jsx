import { useAuth } from "./AuthContext.jsx";

export default function Header({ title }) {
  const { user } = useAuth();
  return (
    <div className="topbar">
      <h1>{title}</h1>
      <span className="user-pill">{user?.name} · SSC CGL</span>
    </div>
  );
}
