import { AdminBadgeIcon } from "./Icons";

export function PageTitle({ admin = false, children, icon: Icon }) {
  return (
    <div className="page-title">
      {Icon ? (
        <span className={admin ? "page-title-icon page-title-icon-admin" : "page-title-icon"}>
          <Icon />
          {admin ? (
            <span className="admin-icon-badge">
              <AdminBadgeIcon />
            </span>
          ) : null}
        </span>
      ) : null}
      <h1>{children}</h1>
    </div>
  );
}
