import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DEFAULT_LIST_PAGE_SIZE } from "../../../shared/api/config";
import { useMetadataQuery } from "../../../shared/api/hooks";
import { apiRequest } from "../../../shared/api/http";
import { useLocale } from "../../../shared/i18n/LocaleContext";
import { rt, rtf } from "../../../shared/i18n/rawText";
import { useAuth } from "../../../shared/auth/AuthContext";
import { buildQueryString, formatDateTime, formatEnumLabel } from "../../../shared/lib/format";
import { UserAvatar } from "../../../shared/ui/Media";
import { ArrowLeftIcon, TrashIcon } from "../../../shared/ui/Icons";
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
  const { locale } = useLocale();
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
        <h1>{rt(locale, "User moderation")}</h1>
        <p>{rt(locale, "Review user accounts, apply filters, and open detailed moderation controls.")}</p>
      </header>

      <section className="section-card">
        <form className="content-stack" onSubmit={handleApplyFilters}>
          <div className="filters-grid">
            <label className="field">
              <span>{rt(locale, "Search")}</span>
              <input
                className="field-control"
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    searchText: event.target.value
                  }))
                }
                placeholder={rt(locale, "Email or nickname")}
                value={draftFilters.searchText}
              />
            </label>

            <label className="field">
              <span>{rt(locale, "User type")}</span>
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
              <span>{rt(locale, "Only banned users")}</span>
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
              <span>{rt(locale, "Result set")}</span>
              <div className="admin-summary-box">
                <strong>{usersQuery.data?.totalElements ?? 0}</strong>
                <span>{rt(locale, "matching users")}</span>
              </div>
            </div>
          </div>

          <div className="field">
            <span>{rt(locale, "Role filters")}</span>
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
              {rt(locale, "Apply filters")}
            </button>
            <button className="button button-secondary" onClick={handleResetFilters} type="button">
              {rt(locale, "Reset")}
            </button>
          </div>
        </form>
      </section>

      {metadataQuery.isPending ? <LoadingBlock label={rt(locale, "Loading admin metadata")} /> : null}
      {metadataQuery.error ? (
        <ErrorBlock error={metadataQuery.error} title={rt(locale, "Admin metadata could not be loaded")} />
      ) : null}
      {usersQuery.isPending ? <LoadingBlock label={rt(locale, "Loading moderated users")} /> : null}
      {usersQuery.error ? (
        <ErrorBlock error={usersQuery.error} title={rt(locale, "Admin users could not be loaded")} />
      ) : null}

      {!usersQuery.isPending && !usersQuery.error && users.length === 0 ? (
        <EmptyBlock
          title={rt(locale, "No users match these filters")}
          description={rt(locale, "Try resetting the filters or searching with a different email, nickname, or role.")}
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
                      <h2>{user.nickname || rt(locale, "Unknown user")}</h2>
                      <p className="muted-line">{user.email || rt(locale, "No email available")}</p>
                    </div>
                  </div>

                  <div className="pill-row">
                    {deleted ? <span className="status-pill status-pill-danger">{rt(locale, "Deleted")}</span> : null}
                    {banned ? <span className="status-pill status-pill-warning">{rt(locale, "Banned")}</span> : null}
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
                    <dt>{rt(locale, "Ban reason")}</dt>
                    <dd>{user.banReason || rt(locale, "Not available")}</dd>
                  </div>
                  <div>
                    <dt>{rt(locale, "Banned until")}</dt>
                    <dd>{formatDateTime(user.bannedUntil)}</dd>
                  </div>
                </dl>

                <div className="card-actions">
                  <span className="muted-line">
                    {deleted
                      ? rtf(locale, "Deleted at {value}", { value: formatDateTime(user.meta?.deletedAt) })
                      : rt(locale, "Active moderation target")}
                  </span>
                  <Link className="button button-secondary" to={`/admin/users/${user.id}`}>
                    {rt(locale, "Open details")}
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
  const { locale } = useLocale();
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
        label: rt(locale, "Status"),
        value: deleted ? rt(locale, "Deleted") : rt(locale, "Active")
      },
      {
        label: rt(locale, "Ban state"),
        value: banned ? rt(locale, "Banned") : rt(locale, "Not banned")
      },
      {
        label: rt(locale, "Roles"),
        value: (targetUser.roles ?? []).map((role) => formatEnumLabel(role)).join(", ") || rt(locale, "None")
      }
    ];
  }, [banned, deleted, locale, targetUser]);

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
    const targetLabel =
      action === "make-admin" ? rt(locale, "grant admin rights") : rt(locale, "remove admin rights");
    const confirmed = window.confirm(rtf(locale, "Do you want to {action} for this user?", { action: targetLabel }));

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
      action === "make-admin" ? rt(locale, "Admin rights granted.") : rt(locale, "Admin rights removed.")
    );
  }

  async function handleBanSubmit(event) {
    event.preventDefault();
    setBanError("");
    setActionError(null);

    const validationError = validateBanForm(locale, banForm);

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
      banForm.bannedPermanently ? rt(locale, "Permanent ban applied.") : rt(locale, "Temporary ban applied."),
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
    const confirmed = window.confirm(rt(locale, "Remove the current ban from this user?"));

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
      rt(locale, "User ban removed."),
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
      rt(locale, "Soft-delete this user and cascade moderation changes to their books?")
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
    return <LoadingBlock label={rt(locale, "Loading admin user details")} />;
  }

  if (detailQuery.error) {
    return <ErrorBlock error={detailQuery.error} title={rt(locale, "Admin user details could not be loaded")} />;
  }

  return (
    <section className="content-stack">
      <header className="section-card book-detail-hero">
        <div className="book-detail-header-bar">
          <Link aria-label={rt(locale, "Back to users")} className="back-link" to="/admin/users">
            <ArrowLeftIcon />
          </Link>

          <div className="hero-icon-actions">
            <button
              aria-label={rt(locale, "Delete user")}
              className="icon-button icon-button-danger"
              disabled={deleted || isOwnAccount || pendingAction !== null}
              onClick={() => void handleDelete()}
              title={rt(locale, "Delete user")}
              type="button"
            >
              <TrashIcon />
            </button>
          </div>
        </div>

        <div className="entity-inline">
          <UserAvatar
            name={targetUser.nickname || targetUser.email}
            photoUrl={targetUser.photoUrl}
            size="lg"
          />
          <div>
            <h1>{targetUser.nickname || rt(locale, "Unknown user")}</h1>
            <p>{targetUser.email || rt(locale, "Not available")}</p>
            <div className="hero-meta-line">
              <span>{rt(locale, "Created at")}: {formatDateTime(targetUser.meta?.createdAt)}</span>
              <span>{rt(locale, "Updated at")}: {formatDateTime(targetUser.meta?.updatedAt)}</span>
            </div>
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
      {actionError ? <ErrorBlock error={actionError} title={rt(locale, "Moderation action failed")} /> : null}

      <section className="content-stack">
        <article className="section-card">
          <h2>{rt(locale, "Account overview")}</h2>
          <dl className="detail-list">
            <div>
              <dt>{rt(locale, "Email")}</dt>
              <dd>{targetUser.email || rt(locale, "Not available")}</dd>
            </div>
            <div>
              <dt>{rt(locale, "Nickname")}</dt>
              <dd>{targetUser.nickname || rt(locale, "Not available")}</dd>
            </div>
            <div>
              <dt>{rt(locale, "Roles")}</dt>
              <dd>
                {(targetUser.roles ?? []).map((role) => formatEnumLabel(role)).join(", ") || rt(locale, "None")}
              </dd>
            </div>
            <div>
              <dt>{rt(locale, "Banned permanently")}</dt>
              <dd>{targetUser.bannedPermanently ? rt(locale, "Yes") : rt(locale, "No")}</dd>
            </div>
            <div>
              <dt>{rt(locale, "Banned until")}</dt>
              <dd>{formatDateTime(targetUser.bannedUntil)}</dd>
            </div>
            <div>
              <dt>{rt(locale, "Ban reason")}</dt>
              <dd>{targetUser.banReason || rt(locale, "Not available")}</dd>
            </div>
            <div>
              <dt>{rt(locale, "Deleted at")}</dt>
              <dd>{formatDateTime(targetUser.meta?.deletedAt)}</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="content-stack">
        <article className="section-card">
          <h2>{rt(locale, "Role management")}</h2>
          <p>{rt(locale, "Only super admins can grant or revoke admin rights from this view.")}</p>

          {isOwnAccount ? (
            <p className="inline-message inline-message-error">
              {rt(locale, "Role and moderation actions are disabled for your own account in the admin UI.")}
            </p>
          ) : null}

          <div className="card-actions">
            <button
              className="button"
              disabled={!canPromote || pendingAction !== null}
              onClick={() => void handleRoleAction("make-admin")}
              type="button"
            >
              {pendingAction === "make-admin" ? rt(locale, "Granting...") : rt(locale, "Make admin")}
            </button>
            <button
              className="button button-secondary"
              disabled={!canDemote || pendingAction !== null}
              onClick={() => void handleRoleAction("remove-admin")}
              type="button"
            >
              {pendingAction === "remove-admin" ? rt(locale, "Removing...") : rt(locale, "Remove admin")}
            </button>
          </div>
        </article>
      </section>

      <section className="section-card">
        <h2>{rt(locale, "Ban management")}</h2>
        <p>{rt(locale, "Choose whether the ban is temporary or permanent and explain the reason.")}</p>

        <form className="content-stack" onSubmit={handleBanSubmit}>
          <div className="filters-grid">
            <label className="field field-checkbox admin-toggle-field">
              <span>{rt(locale, "Permanent ban")}</span>
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
              <span>{rt(locale, "Banned until")}</span>
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
            <span>{rt(locale, "Ban reason")}</span>
            <textarea
              className="field-control"
              disabled={deleted || isOwnAccount || pendingAction !== null}
              onChange={(event) =>
                setBanForm((current) => ({
                  ...current,
                  banReason: event.target.value
                }))
              }
              placeholder={rt(locale, "Explain why this user is being moderated")}
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
              {pendingAction === "ban" ? rt(locale, "Saving ban...") : banned ? rt(locale, "Update ban") : rt(locale, "Ban user")}
            </button>
            <button
              className="button button-secondary"
              disabled={!banned || deleted || isOwnAccount || pendingAction !== null}
              onClick={() => void handleUnban()}
              type="button"
            >
              {pendingAction === "unban" ? rt(locale, "Removing...") : rt(locale, "Unban user")}
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

function validateBanForm(locale, form) {
  const reason = form.banReason.trim();

  if (reason.length < 3) {
    return rt(locale, "Ban reason must be at least 3 characters long.");
  }

  if (!form.bannedPermanently && !form.bannedUntil) {
    return rt(locale, "Choose a ban end date or enable permanent ban.");
  }

  return null;
}

function withVersion(response) {
  return {
    ...response.data,
    __version: response.eTag ?? response.data?.version ?? null
  };
}
