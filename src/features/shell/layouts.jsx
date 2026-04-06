import { NavLink, Outlet } from "react-router-dom";
import { useMetadataQuery, useUnreadUpdatesSummaryQuery } from "../../shared/api/hooks";
import { useAuth } from "../../shared/auth/AuthContext";
import { LoadingBlock } from "../../shared/ui/StateBlocks";

const publicLinks = [
  { to: "/", label: "Home" },
  { to: "/catalog", label: "Catalog" },
  { to: "/login", label: "Login" },
  { to: "/register", label: "Register" }
];

const appLinks = [
  { to: "/app/profile", label: "Profile" },
  { to: "/app/security", label: "Security" },
  { to: "/app/updates", label: "Updates" },
  { to: "/app/my-reports", label: "My reports" },
  { to: "/app/my-books", label: "My books" },
  { to: "/app/exchanges/requests", label: "Requests" },
  { to: "/app/exchanges/offers", label: "Offers" },
  { to: "/app/history", label: "History" }
];

const adminLinks = [
  { to: "/admin/users", label: "Users" },
  { to: "/admin/books", label: "Books" },
  { to: "/admin/reports", label: "Reports" },
  { to: "/admin/exchanges", label: "Exchanges" }
];

export function PublicLayout() {
  const metadataQuery = useMetadataQuery();

  return (
    <div className="app-frame">
      <header className="topbar">
        <NavLink className="brand" to="/">
          Book Exchange
        </NavLink>

        <nav className="topbar-nav">
          {publicLinks.map((link) => (
            <TopNavLink key={link.to} to={link.to}>
              {link.label}
            </TopNavLink>
          ))}
        </nav>
      </header>

      <main className="page-container">
        {metadataQuery.isPending ? <LoadingBlock label="Loading app metadata" /> : <Outlet />}
      </main>
    </div>
  );
}

export function AppLayout({ adminMode = false }) {
  const { isAdmin, logout, user } = useAuth();
  const unreadQuery = useUnreadUpdatesSummaryQuery(!adminMode);

  const navigationLinks = adminMode ? adminLinks : appLinks;
  const unreadCount = unreadQuery.data?.totalElements ?? 0;

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <NavLink className="brand brand-block" to={adminMode ? "/admin/users" : "/app/profile"}>
          Book Exchange
        </NavLink>

        <div className="sidebar-group">
          <span className="sidebar-label">{adminMode ? "Admin" : "Workspace"}</span>
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
            <span className="sidebar-label">Moderation</span>
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                isActive ? "sidebar-link sidebar-link-active" : "sidebar-link"
              }
            >
              <span>Open admin area</span>
            </NavLink>
          </div>
        ) : null}

        <button className="button button-secondary button-full" onClick={() => void logout()} type="button">
          Logout
        </button>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">{adminMode ? "Admin mode" : "Signed in"}</span>
            <h1>{adminMode ? "Moderation Console" : "Frontend Workspace"}</h1>
          </div>

          <div className="user-chip">
            <span>{user?.nickname ?? "Unknown user"}</span>
            <small>{user?.email ?? "No email"}</small>
          </div>
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
