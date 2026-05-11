import { useEffect, useState } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { DEFAULT_LIST_PAGE_SIZE } from "../../../shared/api/config";
import { useMetadataQuery } from "../../../shared/api/hooks";
import { apiRequest } from "../../../shared/api/http";
import { useAuth } from "../../../shared/auth/AuthContext";
import { useLocale } from "../../../shared/i18n/LocaleContext";
import { rt, rtf } from "../../../shared/i18n/rawText";
import { buildQueryString, formatDateTime, formatEnumLabel } from "../../../shared/lib/format";
import { useInfiniteScroll } from "../../../shared/lib/useInfiniteScroll";
import { UserAvatar } from "../../../shared/ui/Media";
import { ArrowLeftIcon, FilterIcon, SearchIcon, TrashIcon, UserIcon, XIcon } from "../../../shared/ui/Icons";
import { PageTitle } from "../../../shared/ui/PageTitle";
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

const adminUsersText = {
  de: {
    accountCreated: "Konto erstellt",
    adminActionToAdmin: "Zum Admin machen",
    adminActionToUser: "Adminrechte entziehen",
    allLoaded: "Alle passenden Nutzer sind geladen",
    allUsers: "Alle",
    activeUsers: "Aktive",
    banReason: "Sperrgrund",
    banReasonPlaceholder: "Gib an, warum dieser Nutzer gesperrt wird",
    banSectionTitle: "Nutzer sperren",
    banUntilField: "Sperren bis",
    banUser: "Nutzer sperren",
    banned: "Gesperrt",
    bannedPermanently: "Dauerhaft gesperrt",
    bannedUntil: "Gesperrt bis",
    blockForever: "Dauerhaft sperren",
    deletedUsers: "Gelöschte",
    deletedUser: "Gelöscht",
    filtersHide: "Filter ausblenden",
    filtersShow: "Filter anzeigen",
    lastUpdated: "Letzte Aktualisierung",
    loadingMore: "Weitere Nutzer werden geladen...",
    ownProfile: "Dein Profil",
    searchPlaceholder: "E-Mail oder Nickname eingeben...",
    submitBan: "Änderungen übernehmen",
    userDeletedAt: "Konto gelöscht",
    usersFound: "Gefundene Nutzer",
    manageTitle: "Benutzerverwaltung",
    overviewTitle: "Benutzerübersicht"
  },
  en: {
    accountCreated: "Account created",
    adminActionToAdmin: "Make admin",
    adminActionToUser: "Revoke admin rights",
    allLoaded: "All matching users are loaded",
    allUsers: "All",
    activeUsers: "Active",
    banReason: "Ban reason",
    banReasonPlaceholder: "Explain why this user is being blocked",
    banSectionTitle: "User blocking",
    banUntilField: "Block until",
    banUser: "Block user",
    banned: "Banned",
    bannedPermanently: "Banned permanently",
    bannedUntil: "Banned until",
    blockForever: "Block permanently",
    deletedUsers: "Deleted",
    deletedUser: "Deleted",
    filtersHide: "Hide filters",
    filtersShow: "Show filters",
    lastUpdated: "Last updated",
    loadingMore: "Loading more users...",
    ownProfile: "Your profile",
    searchPlaceholder: "Enter email or nickname...",
    submitBan: "Apply changes",
    userDeletedAt: "Account deleted",
    usersFound: "Users found",
    manageTitle: "User management",
    overviewTitle: "User overview"
  },
  ru: {
    accountCreated: "Уч. запись создана",
    adminActionToAdmin: "Сделать админом",
    adminActionToUser: "Отнять права админа",
    allLoaded: "Все подходящие пользователи уже загружены",
    allUsers: "Все",
    activeUsers: "Активные",
    banReason: "Причина блокировки",
    banReasonPlaceholder: "Укажите, почему этот пользователь блокируется",
    banSectionTitle: "Блокировка пользователя",
    banUntilField: "Заблокировать до",
    banUser: "Заблокировать пользователя",
    banned: "Заблокирован",
    bannedPermanently: "Заблокирован навсегда",
    bannedUntil: "Заблокирован до",
    blockForever: "Заблокировать навсегда",
    deletedUsers: "Удаленные",
    deletedUser: "Удален",
    filtersHide: "Скрыть фильтры",
    filtersShow: "Показать фильтры",
    lastUpdated: "Последнее обновление",
    loadingMore: "Подгружаем ещё пользователей...",
    ownProfile: "Ваш профиль",
    searchPlaceholder: "Введите email или никнейм...",
    submitBan: "Внести изменения",
    userDeletedAt: "Уч. запись удалена",
    usersFound: "Найдено пользователей",
    manageTitle: "Управление пользователями",
    overviewTitle: "Обзор пользователя"
  }
};

export function AdminUsersPage() {
  const { locale } = useLocale();
  const { user: currentUser } = useAuth();
  const metadataQuery = useMetadataQuery();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState(defaultFilters);
  const [draftFilters, setDraftFilters] = useState(defaultFilters);
  const text = adminUsersText[locale] ?? adminUsersText.en;

  const roles = (metadataQuery.data?.roles ?? []).filter((role) => role !== "SUPER_ADMIN");
  const userTypes = getOrderedUserTypes(metadataQuery.data?.userTypes ?? ["ACTIVE", "DELETED", "ALL"]);

  const usersQuery = useInfiniteQuery({
    queryKey: ["admin-users", filters],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const query = buildQueryString({
        pageIndex: pageParam,
        pageSize: DEFAULT_LIST_PAGE_SIZE,
        searchText: filters.searchText,
        roles: filters.roles,
        onlyBannedUsers: filters.onlyBannedUsers || undefined,
        userType: filters.userType === "ALL" ? undefined : filters.userType
      });
      const response = await apiRequest(`/admin/users?${query}`, { auth: true });

      return response.data;
    },
    getNextPageParam: (lastPage, pages) =>
      pages.length < (lastPage?.totalPages ?? 0) ? pages.length : undefined
  });

  const users = (usersQuery.data?.pages ?? []).flatMap((page) => page.content ?? []);
  const totalUsers = usersQuery.data?.pages?.[0]?.totalElements ?? 0;
  const loadMoreRef = useInfiniteScroll({
    enabled: !usersQuery.isPending && !usersQuery.error,
    hasNextPage: usersQuery.hasNextPage,
    isFetchingNextPage: usersQuery.isFetchingNextPage,
    onLoadMore: () => void usersQuery.fetchNextPage()
  });

  function handleSearch() {
    setFilters((current) => ({
      ...current,
      searchText: searchText.trim()
    }));
  }

  function handleClearSearch() {
    setSearchText("");

    if (filters.searchText) {
      setFilters((current) => ({
        ...current,
        searchText: ""
      }));
    }
  }

  function handleApplyFilters(event) {
    event.preventDefault();
    setFilters((current) => ({
      ...current,
      roles: [...draftFilters.roles],
      onlyBannedUsers: draftFilters.onlyBannedUsers,
      userType: draftFilters.userType || "ALL"
    }));
  }

  function handleResetFilters() {
    setDraftFilters(defaultFilters);
    setFilters((current) => ({
      ...defaultFilters,
      searchText: current.searchText
    }));
  }

  function toggleRole(role) {
    setDraftFilters((current) => ({
      ...current,
      roles: current.roles.includes(role)
        ? current.roles.filter((item) => item !== role)
        : [...current.roles, role]
    }));
  }

  return (
    <section className="content-stack">
      <header className="section-card">
        <PageTitle admin icon={UserIcon}>{text.manageTitle}</PageTitle>
        <p>{rt(locale, "Review user accounts, apply filters, and open detailed moderation controls.")}</p>
      </header>

      <section className="section-card catalog-controls-card">
        <div className="catalog-search-stack">
          <div className="catalog-search-shell">
            <input
              aria-label={rt(locale, "Search text")}
              className="field-control catalog-search-input"
              onChange={(event) => setSearchText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSearch();
                }
              }}
              placeholder={text.searchPlaceholder}
              value={searchText}
            />
            {searchText ? (
              <button
                aria-label={rt(locale, "Clear search")}
                className="catalog-search-clear"
                onClick={handleClearSearch}
                type="button"
              >
                <XIcon />
              </button>
            ) : null}
            <button
              aria-label={rt(locale, "Search")}
              className="catalog-search-submit"
              onClick={handleSearch}
              type="button"
            >
              <SearchIcon />
            </button>
            <button
              aria-expanded={filtersOpen}
              aria-label={filtersOpen ? text.filtersHide : text.filtersShow}
              className={
                filtersOpen
                  ? "catalog-filter-toggle catalog-filter-toggle-active"
                  : "catalog-filter-toggle"
              }
              onClick={() => setFiltersOpen((current) => !current)}
              type="button"
            >
              <FilterIcon />
            </button>
          </div>

          {filtersOpen ? (
            <form className="catalog-filters-panel" onSubmit={handleApplyFilters}>
              <div className="filters-grid">
                <label className="field filter-field-span-2">
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
                        {formatUserTypeFilterLabel(text, userType)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field field-checkbox admin-toggle-field filter-field-span-2">
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
              </div>

              <div className="field">
                <span>{rt(locale, "Role filters")}</span>
                <div className="checkbox-grid">
                  {roles.map((role) => (
                    <label className="field field-checkbox admin-checkbox-card" key={role}>
                      <span>{formatDisplayRole(locale, role)}</span>
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
          ) : null}
        </div>
      </section>

      {metadataQuery.isPending ? <LoadingBlock label={rt(locale, "Loading admin metadata")} /> : null}
      {metadataQuery.error ? (
        <ErrorBlock error={metadataQuery.error} title={rt(locale, "Admin metadata could not be loaded")} />
      ) : null}
      {usersQuery.isPending ? <LoadingBlock label={rt(locale, "Loading moderated users")} /> : null}
      {usersQuery.error ? (
        <ErrorBlock error={usersQuery.error} title={rt(locale, "Admin users could not be loaded")} />
      ) : null}

      {!usersQuery.isPending && !usersQuery.error ? (
        <div className="catalog-results-toolbar admin-users-results-toolbar">
          <span className="muted-line">
            {text.usersFound}: {totalUsers}
          </span>
        </div>
      ) : null}

      {!usersQuery.isPending && !usersQuery.error && users.length === 0 ? (
        <EmptyBlock
          title={rt(locale, "No users match these filters")}
          description={rt(locale, "Try resetting the filters or searching with a different email, nickname, or role.")}
        />
      ) : null}

      {users.length > 0 ? (
        <section className="admin-user-grid">
          {users.map((user) => (
            <AdminUserCard
              currentUserId={currentUser?.id}
              key={user.id}
              locale={locale}
              text={text}
              user={user}
            />
          ))}
        </section>
      ) : null}

      <div className="infinite-scroll-status" ref={loadMoreRef}>
        {usersQuery.isFetchingNextPage ? text.loadingMore : null}
        {!usersQuery.hasNextPage && users.length > 0 ? text.allLoaded : null}
      </div>
    </section>
  );
}

export function AdminUserDetailsPage() {
  const { locale } = useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userId } = useParams();
  const { isSuperAdmin, user: currentUser } = useAuth();
  const [banForm, setBanForm] = useState(emptyBanForm);
  const [pendingAction, setPendingAction] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const [banError, setBanError] = useState("");
  const text = adminUsersText[locale] ?? adminUsersText.en;
  const backTo = location.state?.backTo || "/admin/users";

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
  const currentUserId = getEntityId(currentUser);
  const targetUserId = getEntityId(targetUser) ?? userId;
  const isOwnAccount = isSameId(currentUserId, targetUserId) || isSameId(currentUserId, userId);
  const deleted = isUserDeleted(targetUser);
  const banned = isUserBanned(targetUser);
  const userActionDisabled = !currentUser || deleted || isOwnAccount || pendingAction !== null;
  const banControlsDisabled = !currentUser || deleted || isOwnAccount || pendingAction !== null;
  const canShowRoleAction =
    isSuperAdmin && !isOwnAccount && !deleted && !hasRole(targetUser, "SUPER_ADMIN");
  const roleAction = hasRole(targetUser, "ADMIN") ? "remove-admin" : "make-admin";

  async function persistUserMutation(requestPromise, successMessage, { onError } = {}) {
    setActionError(null);
    setActionMessage("");

    try {
      const response = await requestPromise;
      const nextUser = withVersion(response);

      queryClient.setQueryData(["admin-user", String(userId)], nextUser);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
          queryClient.invalidateQueries({ queryKey: ["updates"] }),
          queryClient.invalidateQueries({ queryKey: ["updates", "summary"] })
        ]);
        await Promise.all([
          queryClient.refetchQueries({ queryKey: ["updates"], type: "active" }),
          queryClient.refetchQueries({ queryKey: ["updates", "summary"], type: "active" })
        ]);

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

  async function handleRoleAction() {
    setBanError("");
    const targetLabel =
      roleAction === "make-admin" ? text.adminActionToAdmin : text.adminActionToUser;
    const confirmed = window.confirm(rtf(locale, "Do you want to {action} for this user?", { action: targetLabel }));

    if (!confirmed) {
      return;
    }

    setPendingAction(roleAction);

    const endpoint =
      roleAction === "make-admin"
        ? `/admin/users/${userId}/make-admin`
        : `/admin/users/${userId}/remove-admin`;

    await persistUserMutation(
      apiRequest(endpoint, {
        method: "PATCH",
        auth: true
      }),
      roleAction === "make-admin" ? rt(locale, "Admin rights granted.") : rt(locale, "Admin rights removed.")
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
    if (userActionDisabled) {
      return;
    }

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

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
          queryClient.invalidateQueries({ queryKey: ["updates"] }),
          queryClient.invalidateQueries({ queryKey: ["updates", "summary"] })
        ]);
        await Promise.all([
          queryClient.refetchQueries({ queryKey: ["updates"], type: "active" }),
          queryClient.refetchQueries({ queryKey: ["updates", "summary"], type: "active" })
        ]);
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
          <div className="book-detail-header-main">
            <Link aria-label={rt(locale, "Back to users")} className="back-link" to={backTo}>
              <ArrowLeftIcon />
            </Link>
            <PageTitle admin icon={UserIcon}>{text.overviewTitle}</PageTitle>
          </div>

          <div className="hero-icon-actions">
            <button
              aria-label={rt(locale, "Delete user")}
              className="icon-button icon-button-danger"
              disabled={userActionDisabled}
              onClick={() => void handleDelete()}
              title={rt(locale, "Delete user")}
              type="button"
            >
              <TrashIcon />
            </button>
          </div>
        </div>

        <div className="admin-user-detail-head">
          <div className="admin-user-detail-main">
            <UserAvatar
              name={targetUser.nickname || targetUser.email}
              photoUrl={targetUser.photoUrl}
              size="lg"
            />
            <div className="admin-user-detail-copy">
              <h1>{targetUser.nickname || rt(locale, "Unknown user")}</h1>
              <p>{targetUser.email || rt(locale, "Not available")}</p>
            </div>
          </div>

          <div className="pill-row admin-user-detail-labels">
            {getDisplayRoles(targetUser).map((role) => (
              <span className={getRoleChipClassName(role)} key={role}>
                {formatDisplayRole(locale, role)}
              </span>
            ))}
            {isOwnAccount ? <span className="status-pill status-pill-success">{text.ownProfile}</span> : null}
            {deleted ? <span className="status-pill status-pill-danger">{text.deletedUser}</span> : null}
            {renderBanStatusPill(locale, text, targetUser)}
          </div>
        </div>

        <div className="admin-user-detail-body">
          <div className="admin-user-date-stack">
            <span>{text.accountCreated}: {formatDateTime(targetUser.meta?.createdAt)}</span>
            <span>{text.lastUpdated}: {formatDateTime(targetUser.meta?.updatedAt)}</span>
            {deleted ? (
              <span>{text.userDeletedAt}: {formatDateTime(targetUser.meta?.deletedAt)}</span>
            ) : null}
          </div>
          {targetUser.banReason ? (
            <p className="admin-user-ban-reason">
              <strong>{text.banReason}:</strong> {targetUser.banReason}
            </p>
          ) : null}
          {canShowRoleAction ? (
            <div className="card-actions">
              <button
                className={roleAction === "remove-admin" ? "button button-secondary" : "button"}
                disabled={pendingAction !== null}
                onClick={() => void handleRoleAction()}
                type="button"
              >
                {pendingAction === roleAction
                  ? rt(locale, "Saving...")
                  : roleAction === "remove-admin"
                    ? text.adminActionToUser
                    : text.adminActionToAdmin}
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {actionMessage ? <p className="inline-message inline-message-success">{actionMessage}</p> : null}
      {actionError ? <ErrorBlock error={actionError} title={rt(locale, "Moderation action failed")} /> : null}

      <section className={`section-card${isOwnAccount ? " admin-user-ban-section-disabled" : ""}`}>
        <h2>{text.banSectionTitle}</h2>

        <form className="content-stack" onSubmit={handleBanSubmit}>
          <div className="filters-grid">
            <label className="field field-checkbox admin-toggle-field">
              <span>{text.blockForever}</span>
              <input
                checked={banForm.bannedPermanently}
                disabled={banControlsDisabled}
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
              <span>{text.banUntilField}</span>
              <input
                className="field-control"
                disabled={banControlsDisabled || banForm.bannedPermanently}
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
            <span>{text.banReason}</span>
            <textarea
              className="field-control"
              disabled={banControlsDisabled}
              onChange={(event) =>
                setBanForm((current) => ({
                  ...current,
                  banReason: event.target.value
                }))
              }
              placeholder={text.banReasonPlaceholder}
              rows={3}
              value={banForm.banReason}
            />
          </label>

          {banError ? <p className="inline-message inline-message-error">{banError}</p> : null}

          <div className="card-actions">
            <button
              className="button"
              disabled={banControlsDisabled}
              type="submit"
            >
              {pendingAction === "ban" ? rt(locale, "Saving ban...") : banned ? text.submitBan : text.banUser}
            </button>
            <button
              className="button button-secondary"
              disabled={!banned || banControlsDisabled}
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

function AdminUserCard({ currentUserId, locale, text, user }) {
  const deleted = isUserDeleted(user);
  const isOwnAccount = isSameId(currentUserId, getEntityId(user));

  return (
    <Link
      className={`section-card compact-card admin-user-card${deleted ? " admin-user-card-deleted" : ""}`}
      to={`/admin/users/${user.id}`}
    >
      <div className="admin-user-card-top">
        <span className="admin-user-card-identity">
          <UserAvatar name={user.nickname || user.email} photoUrl={user.photoUrl} size="md" />
          <span className="admin-user-card-copy">
            <strong>{user.nickname || rt(locale, "Unknown user")}</strong>
            <span>{user.email || rt(locale, "No email available")}</span>
          </span>
        </span>

        <div className="pill-row admin-user-card-statuses">
          {getDisplayRoles(user, { includeUser: false }).map((role) => (
            <span className={getRoleChipClassName(role)} key={`${user.id}-${role}`}>
              {formatDisplayRole(locale, role)}
            </span>
          ))}
          {isOwnAccount ? <span className="status-pill status-pill-success">{text.ownProfile}</span> : null}
          {deleted ? <span className="status-pill status-pill-danger">{text.deletedUser}</span> : null}
          {renderBanStatusPill(locale, text, user)}
        </div>
      </div>
    </Link>
  );
}

function hasRole(user, role) {
  return (user?.roles ?? []).includes(role);
}

function getDisplayRoles(user, { includeUser = true } = {}) {
  const roles = user?.roles ?? [];

  if (roles.includes("SUPER_ADMIN")) {
    return ["SUPER_ADMIN"];
  }

  if (roles.includes("ADMIN")) {
    return ["ADMIN"];
  }

  if (roles.includes("USER")) {
    return includeUser ? ["USER"] : [];
  }

  return includeUser ? roles : roles.filter((role) => role !== "USER");
}

function getOrderedUserTypes(userTypes) {
  const values = userTypes.length > 0 ? userTypes : ["ACTIVE", "DELETED", "ALL"];
  const preferredOrder = ["ACTIVE", "DELETED", "ALL"];

  return [
    ...preferredOrder.filter((userType) => values.includes(userType)),
    ...values.filter((userType) => !preferredOrder.includes(userType))
  ];
}

function formatUserTypeFilterLabel(text, userType) {
  if (userType === "ACTIVE") {
    return text.activeUsers;
  }

  if (userType === "DELETED") {
    return text.deletedUsers;
  }

  if (userType === "ALL") {
    return text.allUsers;
  }

  return formatEnumLabel(userType);
}

function getRoleChipClassName(role) {
  if (role === "ADMIN" || role === "SUPER_ADMIN") {
    return "status-pill status-pill-warning";
  }

  return "status-pill status-pill-neutral";
}

function formatDisplayRole(locale, role) {
  if (role === "ADMIN") {
    return locale === "ru" ? "Админ" : locale === "de" ? "Admin" : "Admin";
  }

  if (role === "USER") {
    return locale === "ru" ? "Пользователь" : locale === "de" ? "Nutzer" : "User";
  }

  return formatEnumLabel(role);
}

function renderBanStatusPill(locale, text, user) {
  if (!isUserBanned(user)) {
    return null;
  }

  if (user.bannedPermanently) {
    return <span className="status-pill status-pill-danger">{text.bannedPermanently}</span>;
  }

  return (
    <span className="status-pill status-pill-warning">
      {text.bannedUntil}: {formatDateTime(user.bannedUntil)}
    </span>
  );
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
  return Boolean(user?.meta?.deletedAt || user?.deletedAt || user?.deleted);
}

function getEntityId(entity) {
  return entity?.id ?? entity?.userId ?? entity?.subjectId ?? null;
}

function isSameId(left, right) {
  if (left === null || left === undefined || right === null || right === undefined) {
    return false;
  }

  return String(left) === String(right);
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
