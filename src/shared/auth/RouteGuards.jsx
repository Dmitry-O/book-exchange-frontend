import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { LoadingBlock } from "../ui/StateBlocks";

export function RequireAuth({ children }) {
  const location = useLocation();
  const { isAuthenticated, isLoadingUser } = useAuth();

  if (!isAuthenticated) {
    return <Navigate replace to="/login" state={{ from: location }} />;
  }

  if (isLoadingUser) {
    return <LoadingBlock label="Loading your workspace" />;
  }

  return children;
}

export function RequireAdmin({ children }) {
  const location = useLocation();
  const { isAuthenticated, isLoadingUser, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate replace to="/login" state={{ from: location }} />;
  }

  if (isLoadingUser) {
    return <LoadingBlock label="Checking admin access" />;
  }

  if (!isAdmin) {
    return <Navigate replace to="/app/profile" />;
  }

  return children;
}
