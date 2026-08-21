import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading StudEdu...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
