import { NavLink, Outlet } from "react-router-dom";
import { useMetadataQuery, useUnreadUpdatesSummaryQuery } from "../../shared/api/hooks";
import { useAuth } from "../../shared/auth/AuthContext";
import { useLocale } from "../../shared/i18n/LocaleContext";
import { getLocaleLabel } from "../../shared/i18n/locale";
import { UserAvatar } from "../../shared/ui/Media";
import { LoadingBlock } from "../../shared/ui/StateBlocks";

export function PublicLayout() {
  const metadataQuery = useMetadataQuery();
  const { t } = useLocale();
  const publicLinks = [
    { to: "/", label: t("common.home") },
    { to: "/catalog", label: t("common.catalog") },
    { to: "/login", label: t("common.login") },
    { to: "/register", label: t("common.register") }
  ];

  return (
    <div className="app-frame">
      <header className="topbar">
        <NavLink className="brand" to="/">
          {t("common.appName")}
        </NavLink>

        <nav className="topbar-nav">
          {publicLinks.map((link) => (
            <TopNavLink key={link.to} to={link.to}>
              {link.label}
            </TopNavLink>
          ))}
        </nav>

        <LocalePicker availableLocales={metadataQuery.data?.locales} />
      </header>

      <main className="page-container">
        {metadataQuery.isPending ? <LoadingBlock label={t("shell.loadingMetadata")} /> : <Outlet />}
      </main>
    </div>
  );
}

export function AppLayout({ adminMode = false }) {
  const { isAdmin, logout, user } = useAuth();
  const { t } = useLocale();
  const unreadQuery = useUnreadUpdatesSummaryQuery(!adminMode);
  const appLinks = [
    { to: "/app/profile", label: t("shell.profile") },
    { to: "/app/security", label: t("shell.security") },
    { to: "/app/updates", label: t("shell.updates") },
    { to: "/app/my-reports", label: t("shell.myReports") },
    { to: "/app/my-books", label: t("shell.myBooks") },
    { to: "/app/exchanges/requests", label: t("shell.requests") },
    { to: "/app/exchanges/offers", label: t("shell.offers") },
    { to: "/app/history", label: t("shell.history") }
  ];
  const adminLinks = [
    { to: "/admin/users", label: t("shell.users") },
    { to: "/admin/books", label: t("shell.books") },
    { to: "/admin/reports", label: t("shell.reports") },
    { to: "/admin/exchanges", label: t("shell.exchanges") }
  ];
  const utilityLinks = [
    { to: "/", label: t("common.home"), end: true },
    { to: "/catalog", label: t("common.catalog") }
  ];

  const navigationLinks = adminMode ? adminLinks : appLinks;
  const unreadCount = unreadQuery.data?.totalElements ?? 0;
  const headerLinks = adminMode
    ? [...utilityLinks, { to: "/app/profile", label: t("shell.workspace") }]
    : utilityLinks;

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <NavLink className="brand brand-block" to={adminMode ? "/admin/users" : "/app/profile"}>
          {t("common.appName")}
        </NavLink>

        <div className="sidebar-group">
          <span className="sidebar-label">{adminMode ? t("shell.admin") : t("shell.workspace")}</span>
          {navigationLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive ? "sidebar-link sidebar-link-active" : "sidebar-link"
              }
            >
              <span>{link.label}</span>
              {!adminMode && link.to === "/app/updates" && unreadCount > 0 ? (
                <span className="badge">{unreadCount}</span>
              ) : null}
            </NavLink>
          ))}
        </div>

        {isAdmin && !adminMode ? (
          <div className="sidebar-group">
            <span className="sidebar-label">{t("shell.moderation")}</span>
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                isActive ? "sidebar-link sidebar-link-active" : "sidebar-link"
              }
            >
              <span>{t("shell.openAdminArea")}</span>
            </NavLink>
          </div>
        ) : null}

        <button className="button button-secondary button-full" onClick={() => void logout()} type="button">
          {t("shell.logout")}
        </button>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-header">
          <div className="dashboard-header-copy">
            <div>
              <span className="eyebrow">{adminMode ? t("shell.adminMode") : t("shell.signedIn")}</span>
              <h1>{adminMode ? t("shell.moderationConsole") : t("shell.frontendWorkspace")}</h1>
            </div>

            <nav className="topbar-nav dashboard-header-nav">
              {headerLinks.map((link) => (
                <HeaderNavLink key={link.to} end={link.end} to={link.to}>
                  {link.label}
                </HeaderNavLink>
              ))}
            </nav>
          </div>

          <div className="user-chip">
            <UserAvatar name={user?.nickname ?? user?.email} photoUrl={user?.photoUrl} size="sm" />
            <div>
              <span>{user?.nickname ?? t("shell.unknownUser")}</span>
              <small>{user?.email ?? t("shell.noEmail")}</small>
            </div>
          </div>

          <LocalePicker />
        </header>

        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function TopNavLink({ children, to }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => (isActive ? "topbar-link topbar-link-active" : "topbar-link")}
    >
      {children}
    </NavLink>
  );
}

function HeaderNavLink({ children, end = false, to }) {
  return (
    <NavLink
      end={end}
      to={to}
      className={({ isActive }) => (isActive ? "topbar-link topbar-link-active" : "topbar-link")}
    >
      {children}
    </NavLink>
  );
}

function LocalePicker({ availableLocales }) {
  const { locale, locales, setLocale, t } = useLocale();
  const options = availableLocales?.length ? availableLocales : locales;

  return (
    <label className="locale-picker">
      <span>{t("common.language")}</span>
      <select
        className="field-control locale-picker-control"
        onChange={(event) => setLocale(event.target.value)}
        value={locale}
      >
        {options.map((item) => (
          <option key={item} value={item}>
            {getLocaleLabel(item)}
          </option>
        ))}
      </select>
    </label>
  );
}
