import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DEFAULT_LIST_PAGE_SIZE } from "../../../shared/api/config";
import { useMetadataQuery } from "../../../shared/api/hooks";
import { apiRequest } from "../../../shared/api/http";
import { useAuth } from "../../../shared/auth/AuthContext";
import { buildQueryString, formatDateTime, formatEnumLabel } from "../../../shared/lib/format";
import { UserAvatar } from "../../../shared/ui/Media";
import { Pagination } from "../../../shared/ui/Pagination";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "../../../shared/ui/StateBlocks";

const defaultFilters = {
  searchText: "",
  roles: [],
  onlyBannedUsers: false,
  userType: "ALL"
};

const emptyBanForm = {
  bannedUntil: "",
  bannedPermanently: false,
  banReason: ""
};

export function AdminUsersPage() {
  const metadataQuery = useMetadataQuery();
  const [pageIndex, setPageIndex] = useState(0);
  const [filters, setFilters] = useState(defaultFilters);
  const [draftFilters, setDraftFilters] = useState(defaultFilters);

  const roles = (metadataQuery.data?.roles ?? []).filter((role) => role !== "SUPER_ADMIN");
  const userTypes = metadataQuery.data?.userTypes ?? ["ALL"];

  const usersQuery = useQuery({
    queryKey: ["admin-users", pageIndex, filters],
    queryFn: async () => {
      const query = buildQueryString({
        pageIndex,
        pageSize: DEFAULT_LIST_PAGE_SIZE,
        searchText: filters.searchText,
        roles: filters.roles,
        onlyBannedUsers: filters.onlyBannedUsers || undefined,
        userType: filters.userType === "ALL" ? undefined : filters.userType
      });
      const response = await apiRequest(`/admin/users?${query}`, { auth: true });

      return response.data;
    }
  });

  function handleApplyFilters(event) {
    event.preventDefault();
    setPageIndex(0);
    setFilters({
      searchText: draftFilters.searchText.trim(),
      roles: [...draftFilters.roles],
      onlyBannedUsers: draftFilters.onlyBannedUsers,
      userType: draftFilters.userType || "ALL"
    });
  }

  function handleResetFilters() {
    setPageIndex(0);
    setDraftFilters(defaultFilters);
    setFilters(defaultFilters);
  }

  function toggleRole(role) {
    setDraftFilters((current) => ({
      ...current,
      roles: current.roles.includes(role)
        ? current.roles.filter((item) => item !== role)
        : [...current.roles, role]
    }));
  }

  const users = usersQuery.data?.content ?? [];

  return (
    <section className="content-stack">
      <header className="section-card">
        <h1>User moderation</h1>
        <p>
          This screen uses `GET /admin/users` with search, role, banned-state, and user-type
          filters, then opens into the detail moderation view.
        </p>
      </header>

      <section className="section-card">
        <form className="content-stack" onSubmit={handleApplyFilters}>
          <div className="filters-grid">
            <label className="field">
              <span>Search</span>
              <input
                className="field-control"
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    searchText: event.target.value
                  }))
                }
                placeholder="Email or nickname"
                value={draftFilters.searchText}
              />
            </label>

            <label className="field">
              <span>User type</span>
              <select
                className="field-control"
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    userType: event.target.value
                  }))
                }
                value={draftFilters.userType}
              >
                {userTypes.map((userType) => (
                  <option key={userType} value={userType}>
                    {formatEnumLabel(userType)}
                  </option>
                ))}
              </select>
            </label>

            <label className="field field-checkbox admin-toggle-field">
              <span>Only banned users</span>
              <input
                checked={draftFilters.onlyBannedUsers}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    onlyBannedUsers: event.target.checked
                  }))
                }
                type="checkbox"
              />
            </label>

            <div className="field">
              <span>Result set</span>
              <div className="admin-summary-box">
                <strong>{usersQuery.data?.totalElements ?? 0}</strong>
                <span>matching users</span>
              </div>
            </div>
          </div>

          <div className="field">
            <span>Role filters</span>
            <div className="checkbox-grid">
              {roles.map((role) => (
                <label className="field field-checkbox admin-checkbox-card" key={role}>
                  <span>{formatEnumLabel(role)}</span>
                  <input
                    checked={draftFilters.roles.includes(role)}
                    onChange={() => toggleRole(role)}
                    type="checkbox"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="filters-actions">
            <button className="button" type="submit">
              Apply filters
            </button>
            <button className="button button-secondary" onClick={handleResetFilters} type="button">
              Reset
            </button>
          </div>
        </form>
      </section>

      {metadataQuery.isPending ? <LoadingBlock label="Loading admin metadata" /> : null}
      {metadataQuery.error ? (
        <ErrorBlock error={metadataQuery.error} title="Admin metadata could not be loaded" />
      ) : null}
      {usersQuery.isPending ? <LoadingBlock label="Loading moderated users" /> : null}
      {usersQuery.error ? (
        <ErrorBlock error={usersQuery.error} title="Admin users could not be loaded" />
      ) : null}

      {!usersQuery.isPending && !usersQuery.error && users.length === 0 ? (
        <EmptyBlock
          title="No users match these filters"
          description="Try resetting the filters or searching with a different email, nickname, or role."
        />
      ) : null}

      {users.length > 0 ? (
        <section className="list-stack">
          {users.map((user) => {
            const deleted = isUserDeleted(user);
            const banned = isUserBanned(user);

            return (
              <article className="section-card compact-card" key={user.id}>
                <div className="row-between">
                  <div className="entity-inline">
                    <UserAvatar name={user.nickname || user.email} photoUrl={user.photoUrl} size="md" />
                    <div>
                    <h2>{user.nickname || "Unknown user"}</h2>
                    <p className="muted-line">{user.email || "No email available"}</p>
                    </div>
                  </div>

                  <div className="pill-row">
                    <span className="subtle-chip">v{user.version}</span>
                    {deleted ? <span className="status-pill status-pill-danger">Deleted</span> : null}
                    {banned ? <span className="status-pill status-pill-warning">Banned</span> : null}
                  </div>
                </div>

                <div className="pill-row">
                  {(user.roles ?? []).map((role) => (
                    <span className="subtle-chip" key={`${user.id}-${role}`}>
                      {formatEnumLabel(role)}
                    </span>
                  ))}
                </div>

                <dl className="detail-list detail-list-compact">
                  <div>
                    <dt>User id</dt>
                    <dd>{user.id}</dd>
                  </div>
                  <div>
                    <dt>Locale</dt>
                    <dd>{user.locale || "Not available"}</dd>
                  </div>
                  <div>
                    <dt>Ban reason</dt>
                    <dd>{user.banReason || "Not available"}</dd>
                  </div>
                  <div>
                    <dt>Banned until</dt>
                    <dd>{formatDateTime(user.bannedUntil)}</dd>
                  </div>
                </dl>

                <div className="card-actions">
                  <span className="muted-line">
                    {deleted
                      ? `Deleted at ${formatDateTime(user.meta?.deletedAt)}`
                      : "Active moderation target"}
                  </span>
                  <Link className="button button-secondary" to={`/admin/users/${user.id}`}>
                    Open details
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      ) : null}

      {!usersQuery.isPending && !usersQuery.error && (usersQuery.data?.totalPages ?? 0) > 1 ? (
        <Pagination
          onChange={setPageIndex}
          page={pageIndex}
          totalPages={usersQuery.data.totalPages}
        />
      ) : null}
    </section>
  );
}

export function AdminUserDetailsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userId } = useParams();
  const { isSuperAdmin, user: currentUser } = useAuth();
  const [banForm, setBanForm] = useState(emptyBanForm);
  const [pendingAction, setPendingAction] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const [banError, setBanError] = useState("");

  const detailQuery = useQuery({
    queryKey: ["admin-user", String(userId)],
    enabled: Boolean(userId),
    queryFn: async () => {
      const response = await apiRequest(`/admin/users/${userId}`, { auth: true });

      return withVersion(response);
    }
  });

  useEffect(() => {
    if (!detailQuery.data) {
      return;
    }

    setBanForm(toBanForm(detailQuery.data));
  }, [detailQuery.data]);

  const targetUser = detailQuery.data;
  const isOwnAccount = currentUser?.id === targetUser?.id;
  const deleted = isUserDeleted(targetUser);
  const banned = isUserBanned(targetUser);
  const canPromote =
    isSuperAdmin &&
    !isOwnAccount &&
    !deleted &&
    !hasRole(targetUser, "ADMIN") &&
    !hasRole(targetUser, "SUPER_ADMIN");
  const canDemote =
    isSuperAdmin &&
    !isOwnAccount &&
    !deleted &&
    hasRole(targetUser, "ADMIN") &&
    !hasRole(targetUser, "SUPER_ADMIN");

  const moderationSummary = useMemo(() => {
    if (!targetUser) {
      return [];
    }

    return [
      {
        label: "Status",
        value: deleted ? "Deleted" : "Active"
      },
      {
        label: "Ban state",
        value: banned ? "Banned" : "Not banned"
      },
      {
        label: "Roles",
        value: (targetUser.roles ?? []).map((role) => formatEnumLabel(role)).join(", ") || "None"
      },
      {
        label: "Version",
        value: targetUser.__version ?? targetUser.version
      }
    ];
  }, [banned, deleted, targetUser]);

  async function persistUserMutation(requestPromise, successMessage, { onError } = {}) {
    setActionError(null);
    setActionMessage("");

    try {
      const response = await requestPromise;
      const nextUser = withVersion(response);

      queryClient.setQueryData(["admin-user", String(userId)], nextUser);
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });

      setActionMessage(successMessage);
      return nextUser;
    } catch (error) {
      if (onError) {
        onError(error);
      } else {
        setActionError(error);
      }
      return null;
    } finally {
      setPendingAction(null);
    }
  }

  async function handleRoleAction(action) {
    setBanError("");
    const targetLabel = action === "make-admin" ? "grant admin rights" : "remove admin rights";
    const confirmed = window.confirm(`Do you want to ${targetLabel} for this user?`);

    if (!confirmed) {
      return;
    }

    setPendingAction(action);

    const endpoint =
      action === "make-admin"
        ? `/admin/users/${userId}/make-admin`
        : `/admin/users/${userId}/remove-admin`;

    await persistUserMutation(
      apiRequest(endpoint, {
        method: "PATCH",
        auth: true
      }),
      action === "make-admin" ? "Admin rights granted." : "Admin rights removed."
    );
  }

  async function handleBanSubmit(event) {
    event.preventDefault();
    setBanError("");
    setActionError(null);

    const validationError = validateBanForm(banForm);

    if (validationError) {
      setBanError(validationError);
      setActionMessage("");
      return;
    }

    setPendingAction("ban");
    const nextUser = await persistUserMutation(
      apiRequest(`/admin/users/${userId}/ban`, {
        method: "PATCH",
        auth: true,
        version: targetUser.__version ?? targetUser.version,
        body: toBanPayload(banForm)
      }),
      banForm.bannedPermanently ? "Permanent ban applied." : "Temporary ban applied.",
      {
        onError: (error) => setBanError(error.message)
      }
    );

    if (nextUser) {
      setBanError("");
      setBanForm(toBanForm(nextUser));
    }
  }

  async function handleUnban() {
    setBanError("");
    const confirmed = window.confirm("Remove the current ban from this user?");

    if (!confirmed) {
      return;
    }

    setPendingAction("unban");
    const nextUser = await persistUserMutation(
      apiRequest(`/admin/users/${userId}/unban`, {
        method: "PATCH",
        auth: true,
        version: targetUser.__version ?? targetUser.version
      }),
      "User ban removed.",
      {
        onError: (error) => setBanError(error.message)
      }
    );

    if (nextUser) {
      setBanError("");
      setBanForm(toBanForm(nextUser));
    }
  }

  async function handleDelete() {
    setBanError("");
    const confirmed = window.confirm(
      "Soft-delete this user and cascade moderation changes to their books?"
    );

    if (!confirmed) {
      return;
    }

    setPendingAction("delete");
    setActionError(null);
    setActionMessage("");

    try {
      await apiRequest(`/admin/users/${userId}`, {
        method: "DELETE",
        auth: true,
        version: targetUser.__version ?? targetUser.version
      });

      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      await queryClient.removeQueries({ queryKey: ["admin-user", String(userId)] });
      navigate("/admin/users", { replace: true });
    } catch (error) {
      setActionError(error);
    } finally {
      setPendingAction(null);
    }
  }

  if (detailQuery.isPending) {
    return <LoadingBlock label="Loading admin user details" />;
  }

  if (detailQuery.error) {
    return <ErrorBlock error={detailQuery.error} title="Admin user details could not be loaded" />;
  }

  return (
    <section className="content-stack">
      <header className="section-card">
        <div className="row-between">
          <div className="entity-inline">
            <UserAvatar
              name={targetUser.nickname || targetUser.email}
              photoUrl={targetUser.photoUrl}
              size="lg"
            />
            <div>
              <h1>{targetUser.nickname || "Unknown user"}</h1>
              <p>
                This page uses `GET /admin/users/{'{userId}'}` and wires in role changes, ban
                management, and soft delete actions.
              </p>
            </div>
          </div>

          <div className="pill-row">
            <span className="subtle-chip">User #{targetUser.id}</span>
            <span className="subtle-chip">v{targetUser.__version ?? targetUser.version}</span>
          </div>
        </div>

        <div className="admin-summary-grid">
          {moderationSummary.map((item) => (
            <div className="meta-stat" key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </header>

      {actionMessage ? <p className="inline-message inline-message-success">{actionMessage}</p> : null}
      {actionError ? <ErrorBlock error={actionError} title="Moderation action failed" /> : null}

      <section className="detail-grid">
        <article className="section-card">
          <h2>Account snapshot</h2>
          <dl className="detail-list">
            <div>
              <dt>Email</dt>
              <dd>{targetUser.email || "Not available"}</dd>
            </div>
            <div>
              <dt>Nickname</dt>
              <dd>{targetUser.nickname || "Not available"}</dd>
            </div>
            <div>
              <dt>Photo URL</dt>
              <dd>{targetUser.photoUrl || "Not available"}</dd>
            </div>
            <div>
              <dt>Locale</dt>
              <dd>{targetUser.locale || "Not available"}</dd>
            </div>
            <div>
              <dt>Roles</dt>
              <dd>
                {(targetUser.roles ?? []).map((role) => formatEnumLabel(role)).join(", ") || "None"}
              </dd>
            </div>
            <div>
              <dt>Banned permanently</dt>
              <dd>{targetUser.bannedPermanently ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt>Banned until</dt>
              <dd>{formatDateTime(targetUser.bannedUntil)}</dd>
            </div>
            <div>
              <dt>Ban reason</dt>
              <dd>{targetUser.banReason || "Not available"}</dd>
            </div>
            <div>
              <dt>Deleted at</dt>
              <dd>{formatDateTime(targetUser.meta?.deletedAt)}</dd>
            </div>
          </dl>
        </article>

        <article className="section-card">
          <h2>Audit metadata</h2>
          <dl className="detail-list">
            <div>
              <dt>Created at</dt>
              <dd>{formatDateTime(targetUser.meta?.createdAt)}</dd>
            </div>
            <div>
              <dt>Updated at</dt>
              <dd>{formatDateTime(targetUser.meta?.updatedAt)}</dd>
            </div>
            <div>
              <dt>Created by</dt>
              <dd>{targetUser.meta?.createdBy ?? "Not available"}</dd>
            </div>
            <div>
              <dt>Updated by</dt>
              <dd>{targetUser.meta?.updatedBy ?? "Not available"}</dd>
            </div>
            <div>
              <dt>Created request id</dt>
              <dd>{targetUser.meta?.createdRequestId || "Not available"}</dd>
            </div>
            <div>
              <dt>Updated request id</dt>
              <dd>{targetUser.meta?.updatedRequestId || "Not available"}</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="detail-grid">
        <article className="section-card">
          <h2>Role management</h2>
          <p>Only super admins can grant or revoke admin rights from this view.</p>

          {isOwnAccount ? (
            <p className="inline-message inline-message-error">
              Role and moderation actions are disabled for your own account in the admin UI.
            </p>
          ) : null}

          <div className="card-actions">
            <button
              className="button"
              disabled={!canPromote || pendingAction !== null}
              onClick={() => void handleRoleAction("make-admin")}
              type="button"
            >
              {pendingAction === "make-admin" ? "Granting..." : "Make admin"}
            </button>
            <button
              className="button button-secondary"
              disabled={!canDemote || pendingAction !== null}
              onClick={() => void handleRoleAction("remove-admin")}
              type="button"
            >
              {pendingAction === "remove-admin" ? "Removing..." : "Remove admin"}
            </button>
          </div>
        </article>

        <article className="section-card">
          <h2>Delete user</h2>
          <p>
            This action calls `DELETE /admin/users/{'{userId}'}` and soft-deletes the user with
            optimistic locking.
          </p>

          <div className="card-actions">
            <button
              className="button button-danger"
              disabled={deleted || isOwnAccount || pendingAction !== null}
              onClick={() => void handleDelete()}
              type="button"
            >
              {pendingAction === "delete" ? "Deleting..." : "Delete user"}
            </button>
            <Link className="button button-secondary" to="/admin/users">
              Back to users
            </Link>
          </div>
        </article>
      </section>

      <section className="section-card">
        <h2>Ban management</h2>
        <p>
          Temporary bans require a date, while permanent bans only require a reason. Both flows use
          `PATCH /admin/users/{'{userId}'}/ban`.
        </p>

        <form className="content-stack" onSubmit={handleBanSubmit}>
          <div className="filters-grid">
            <label className="field field-checkbox admin-toggle-field">
              <span>Permanent ban</span>
              <input
                checked={banForm.bannedPermanently}
                disabled={deleted || isOwnAccount || pendingAction !== null}
                onChange={(event) =>
                  setBanForm((current) => ({
                    ...current,
                    bannedPermanently: event.target.checked
                  }))
                }
                type="checkbox"
              />
            </label>

            <label className="field">
              <span>Banned until</span>
              <input
                className="field-control"
                disabled={deleted || isOwnAccount || banForm.bannedPermanently || pendingAction !== null}
                onChange={(event) =>
                  setBanForm((current) => ({
                    ...current,
                    bannedUntil: event.target.value
                  }))
                }
                type="datetime-local"
                value={banForm.bannedUntil}
              />
            </label>
          </div>

          <label className="field">
            <span>Ban reason</span>
            <textarea
              className="field-control"
              disabled={deleted || isOwnAccount || pendingAction !== null}
              onChange={(event) =>
                setBanForm((current) => ({
                  ...current,
                  banReason: event.target.value
                }))
              }
              placeholder="Explain why this user is being moderated"
              rows={3}
              value={banForm.banReason}
            />
          </label>

          {banError ? <p className="inline-message inline-message-error">{banError}</p> : null}

          <div className="card-actions">
            <button
              className="button"
              disabled={deleted || isOwnAccount || pendingAction !== null}
              type="submit"
            >
              {pendingAction === "ban" ? "Saving ban..." : banned ? "Update ban" : "Ban user"}
            </button>
            <button
              className="button button-secondary"
              disabled={!banned || deleted || isOwnAccount || pendingAction !== null}
              onClick={() => void handleUnban()}
              type="button"
            >
              {pendingAction === "unban" ? "Removing..." : "Unban user"}
            </button>
          </div>
        </form>
      </section>
    </section>
  );
}

function hasRole(user, role) {
  return (user?.roles ?? []).includes(role);
}

function isUserBanned(user) {
  if (!user) {
    return false;
  }

  if (user.bannedPermanently) {
    return true;
  }

  if (!user.bannedUntil) {
    return false;
  }

  const bannedUntil = new Date(user.bannedUntil).getTime();

  return Number.isFinite(bannedUntil) && bannedUntil > Date.now();
}

function isUserDeleted(user) {
  return Boolean(user?.meta?.deletedAt);
}

function toBanForm(user) {
  return {
    bannedUntil: toDatetimeLocalValue(user?.bannedUntil),
    bannedPermanently: Boolean(user?.bannedPermanently),
    banReason: user?.banReason ?? ""
  };
}

function toBanPayload(form) {
  const payload = {
    bannedPermanently: Boolean(form.bannedPermanently),
    banReason: form.banReason.trim()
  };

  if (!form.bannedPermanently && form.bannedUntil) {
    payload.bannedUntil = new Date(form.bannedUntil).toISOString();
  }

  return payload;
}

function toDatetimeLocalValue(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetMinutes = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offsetMinutes * 60_000);

  return localDate.toISOString().slice(0, 16);
}

function validateBanForm(form) {
  const reason = form.banReason.trim();

  if (reason.length < 3) {
    return "Ban reason must be at least 3 characters long.";
  }

  if (!form.bannedPermanently && !form.bannedUntil) {
    return "Choose a ban end date or enable permanent ban.";
  }

  return null;
}

function withVersion(response) {
  return {
    ...response.data,
    __version: response.eTag ?? response.data?.version ?? null
  };
}
