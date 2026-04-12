import { Navigate, useLocation } from "react-router-dom";
import { useLocale } from "../i18n/LocaleContext";
import { useAuth } from "./AuthContext";
import { ErrorBlock, LoadingBlock } from "../ui/StateBlocks";

export function RequireAuth({ children }) {
  const location = useLocation();
  const { t } = useLocale();
  const { isAuthenticated, isLoadingUser, user, userError } = useAuth();

  if (!isAuthenticated) {
    return <Navigate replace to="/login" state={{ from: location }} />;
  }

  if (isLoadingUser) {
    return <LoadingBlock label={t("routeGuards.loadingWorkspace")} />;
  }

  if (userError?.status === 401) {
    return <LoadingBlock label={t("routeGuards.refreshingSession")} />;
  }

  if (userError) {
    return <ErrorBlock error={userError} title={t("routeGuards.workspaceError")} />;
  }

  if (!user) {
    return <LoadingBlock label={t("routeGuards.refreshingSession")} />;
  }

  return children;
}

export function RequireAdmin({ children }) {
  const location = useLocation();
  const { t } = useLocale();
  const { isAuthenticated, isLoadingUser, isAdmin, user, userError } = useAuth();

  if (!isAuthenticated) {
    return <Navigate replace to="/login" state={{ from: location }} />;
  }

  if (isLoadingUser) {
    return <LoadingBlock label={t("routeGuards.checkingAdmin")} />;
  }

  if (userError?.status === 401) {
    return <LoadingBlock label={t("routeGuards.refreshingAdmin")} />;
  }

  if (userError) {
    return <ErrorBlock error={userError} title={t("routeGuards.adminError")} />;
  }

  if (!user) {
    return <LoadingBlock label={t("routeGuards.refreshingAdmin")} />;
  }

  if (!isAdmin) {
    return <Navigate replace to="/app/profile" />;
  }

  return children;
}
