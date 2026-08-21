import { useAuth } from "./AuthContext.jsx";

export default function Settings() {
  const { user, logout } = useAuth();
  return (
    <div className="card" style={{ maxWidth: 420 }}>
      <h3>Account</h3>
      <div className="stack">
        <div><label>Name</label><div>{user?.name}</div></div>
        <div><label>Email</label><div>{user?.email}</div></div>
      </div>
      <button className="btn btn-danger" style={{ marginTop: 18 }} onClick={logout}>Log out</button>
    </div>
  );
}
