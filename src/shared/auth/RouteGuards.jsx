import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { ErrorBlock, LoadingBlock } from "../ui/StateBlocks";

export function RequireAuth({ children }) {
  const location = useLocation();
  const { isAuthenticated, isLoadingUser, user, userError } = useAuth();

  if (!isAuthenticated) {
    return <Navigate replace to="/login" state={{ from: location }} />;
  }

  if (isLoadingUser) {
    return <LoadingBlock label="Loading your workspace" />;
  }

  if (userError?.status === 401) {
    return <LoadingBlock label="Refreshing your session" />;
  }

  if (userError) {
    return <ErrorBlock error={userError} title="Your workspace could not be loaded" />;
  }

  if (!user) {
    return <LoadingBlock label="Refreshing your workspace" />;
  }

  return children;
}

export function RequireAdmin({ children }) {
  const location = useLocation();
  const { isAuthenticated, isLoadingUser, isAdmin, user, userError } = useAuth();

  if (!isAuthenticated) {
    return <Navigate replace to="/login" state={{ from: location }} />;
  }

  if (isLoadingUser) {
    return <LoadingBlock label="Checking admin access" />;
  }

  if (userError?.status === 401) {
    return <LoadingBlock label="Refreshing your admin session" />;
  }

  if (userError) {
    return <ErrorBlock error={userError} title="Admin access could not be loaded" />;
  }

  if (!user) {
    return <LoadingBlock label="Refreshing admin access" />;
  }

  if (!isAdmin) {
    return <Navigate replace to="/app/profile" />;
  }

  return children;
}
