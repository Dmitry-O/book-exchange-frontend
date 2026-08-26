import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useAdminOpenReportsSummaryQuery,
  useMetadataQuery,
  useUnreadUpdatesSummaryQuery
} from "../../shared/api/hooks";
import { useAuth } from "../../shared/auth/AuthContext";
import { useLocale } from "../../shared/i18n/LocaleContext";
import { getLocaleLabel } from "../../shared/i18n/locale";
import {
  DEMO_EMAIL_SANDBOX_CHANGED_EVENT,
  DEMO_EMAIL_SANDBOX_HEADER,
  DEMO_EMAIL_SANDBOX_MESSAGES_CHANGED_EVENT,
  activateDemoEmailSandboxForEmail,
  apiRequest,
  configureDemoEmailSandbox,
  readActiveDemoEmailAddress,
  readDemoEmailSandboxId
} from "../../shared/api/http";
import {
  DEMO_INBOX_STATE_EVENT,
  getUnreadDemoEmailCount
} from "../demo-email-sandbox/inboxState";
import { UserAvatar } from "../../shared/ui/Media";
import { DemoPrivacyNotice } from "../../shared/ui/DemoPrivacyNotice";
import {
  ArrowUpIcon,
  BellIcon,
  BookIcon,
  AdminBadgeIcon,
  EnvelopeClosedIcon,
  FlagIcon,
  HomeIcon,
  InfoIcon,
  MenuIcon,
  ShieldIcon,
  SignInIcon,
  SignOutIcon,
  SwapIcon,
  UserIcon,
  UserPlusIcon
} from "../../shared/ui/Icons";
import { ProjectResourceLinks } from "./ProjectResourceLinks";

const BASE_NAV_LINKS = [
  { to: "/", labelKey: "common.home", icon: HomeIcon, end: true },
  { to: "/catalog", labelKey: "common.catalog", icon: BookIcon },
  { to: "/about", labelKey: "common.about", icon: InfoIcon }
];

const FOOTER_COPY = {
  en: {
    title: "Book Exchange demo project",
    description:
      "A demonstration platform for book sharing: public catalog, accounts, book listings, exchange requests, reports, moderation, admin tools, email flows, and a React interface connected to the API.",
    stack: "Spring Boot API + React client"
  },
  de: {
    title: "Book Exchange Demo-Projekt",
    description:
      "Eine Demo-Plattform zum Teilen von Büchern: öffentlicher Katalog, Konten, Buchanzeigen, Tauschanfragen, Meldungen, Moderation, Admin-Tools, E-Mail-Flows und ein React-Interface mit API-Anbindung.",
    stack: "Spring Boot API + React Client"
  },
  ru: {
    title: "Book Exchange как демонстрационный проект",
    description:
      "Платформа для демонстрации обмена книгами: публичный каталог, аккаунты, объявления, запросы на обмен, жалобы, модерация, админка, email-сценарии и React-интерфейс, подключенный к API.",
    stack: "Spring Boot API + React client"
  }
};

const SCROLL_TOP_LABELS = {
  en: "Back to top",
  de: "Nach oben",
  ru: "Наверх"
};

const USER_MENU_OPEN_EVENT = "book-exchange:user-menu-open";

const USER_MENU_LINKS = [
  { to: "/app/profile", labelKey: "shell.profile", icon: UserIcon },
  { to: "/app/updates", labelKey: "shell.updates", badge: "updates", icon: BellIcon },
  { to: "/app/my-reports", labelKey: "shell.myReports", icon: FlagIcon },
  { to: "/app/my-books", labelKey: "shell.myBooks", icon: BookIcon },
  {
    to: "/app/exchanges",
    labelKey: "shell.exchanges",
    icon: SwapIcon,
    matchPrefixes: ["/app/exchanges", "/app/history"]
  }
];

const ADMIN_MENU_LINKS = [
  { to: "/admin/users", labelKey: "shell.manageUsers", icon: UserIcon },
  { to: "/admin/books", labelKey: "shell.manageBooks", icon: BookIcon },
  { to: "/admin/reports", labelKey: "shell.manageReports", icon: FlagIcon },
  { to: "/admin/exchanges", labelKey: "shell.manageExchanges", icon: SwapIcon }
];

function useDemoEmailSandboxFeature(metadata) {
  const queryClient = useQueryClient();
  const enabled = metadata?.features?.demoEmailSandboxEnabled === true;

  configureDemoEmailSandbox(enabled);

  useEffect(() => {
    if (!enabled) {
      void queryClient.cancelQueries({ queryKey: ["demo-email-sandbox"] });
      queryClient.removeQueries({ queryKey: ["demo-email-sandbox"] });
    }
  }, [enabled, queryClient]);

  return enabled;
}

export function PublicLayout() {
  const metadataQuery = useMetadataQuery();
  const demoEmailSandboxEnabled = useDemoEmailSandboxFeature(metadataQuery.data);

  return (
    <div className="app-frame">
      <ScrollBehavior />
      <AppHeader
        availableLocales={metadataQuery.data?.locales}
        demoEmailSandboxEnabled={demoEmailSandboxEnabled}
      />
      <SiteDemoBanner />
      <main className="page-container">
        <Outlet />
      </main>
      <SiteFooter />
      <ScrollToTopButton />
    </div>
  );
}

export function AppLayout() {
  const metadataQuery = useMetadataQuery();
  const demoEmailSandboxEnabled = useDemoEmailSandboxFeature(metadataQuery.data);

  return (
    <div className="app-frame">
      <ScrollBehavior />
      <AppHeader
        availableLocales={metadataQuery.data?.locales}
        demoEmailSandboxEnabled={demoEmailSandboxEnabled}
      />
      <SiteDemoBanner />
      <main className="page-container page-container-app">
        <Outlet />
      </main>
      <SiteFooter />
      <ScrollToTopButton />
    </div>
  );
}

function SiteFooter() {
  const { isAuthenticated } = useAuth();
  const { locale, t } = useLocale();
  const text = FOOTER_COPY[locale] ?? FOOTER_COPY.en;

  return (
    <footer className="site-footer">
      <div className="site-footer-copy">
        <strong>{text.title}</strong>
        <p>{text.description}</p>
        <DemoPrivacyNotice compact includeReset className="site-footer-demo-notice" />
        <span>{text.stack}</span>
      </div>

      <div className="site-footer-actions">
        <nav className="site-footer-nav">
          {BASE_NAV_LINKS.map((link) => {
            const Icon = link.icon;

            return (
              <Link key={link.to} to={link.to}>
                <Icon />
                <span>{t(link.labelKey)}</span>
              </Link>
            );
          })}
          {!isAuthenticated ? (
            <>
              <Link className="site-footer-auth-link" to="/login">
                <SignInIcon />
                <span>{t("common.signIn")}</span>
              </Link>
              <Link className="site-footer-auth-link" to="/register">
                <UserPlusIcon />
                <span>{t("common.register")}</span>
              </Link>
            </>
          ) : null}
        </nav>

        <ProjectResourceLinks compact />
        <Link className="site-footer-data-notice-link" to="/data-notice">
          <ShieldIcon />
          <span>{t("common.dataNotice")}</span>
        </Link>
      </div>
    </footer>
  );
}

function SiteDemoBanner() {
  const { t } = useLocale();

  return (
    <div className="site-demo-banner">
      <div className="site-demo-banner-inner">
        <DemoPrivacyNotice compact includeReset className="site-demo-banner-notice">
          <Link className="site-demo-banner-link" to="/data-notice">
            {t("common.dataNotice")}
          </Link>
        </DemoPrivacyNotice>
      </div>
    </div>
  );
}

function AppHeader({ availableLocales, demoEmailSandboxEnabled }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isAuthenticated, isSuperAdmin, logout, updateProfile, user } = useAuth();
  const { locale, locales, setLocale, t } = useLocale();
  const unreadQuery = useUnreadUpdatesSummaryQuery(isAuthenticated);
  const adminOpenReportsQuery = useAdminOpenReportsSummaryQuery(isAuthenticated && isAdmin);
  const [menuOpen, setMenuOpen] = useState(false);
  const [localeMenuOpen, setLocaleMenuOpen] = useState(false);
  const [localePending, setLocalePending] = useState(false);
  const [activeDemoSandboxId, setActiveDemoSandboxId] = useState(() =>
    readDemoEmailSandboxId(user?.email || readActiveDemoEmailAddress())
  );
  const [, setInboxStateVersion] = useState(0);
  const menuRef = useRef(null);
  const localeRef = useRef(null);

  const unreadCount = unreadQuery.data?.totalElements ?? 0;
  const adminOpenReportsCount = adminOpenReportsQuery.data?.totalElements ?? 0;
  const userMenuBadgeCount = unreadCount + (isAdmin ? adminOpenReportsCount : 0);
  const localeOptions = availableLocales?.length ? availableLocales : locales;
  const currentDemoEmail = user?.email || readActiveDemoEmailAddress();
  const currentDemoSandboxId = readDemoEmailSandboxId(currentDemoEmail);
  const effectiveDemoSandboxId =
    activeDemoSandboxId === currentDemoSandboxId ? activeDemoSandboxId : currentDemoSandboxId;
  const demoInboxQuery = useQuery({
    queryKey: ["demo-email-sandbox", "header-unread", effectiveDemoSandboxId],
    enabled: demoEmailSandboxEnabled && Boolean(effectiveDemoSandboxId),
    retry: false,
    refetchInterval: 4000,
    refetchIntervalInBackground: true,
    queryFn: async ({ signal }) => {
      const response = await apiRequest("/demo/email-sandbox/messages?limit=100", {
        headers: {
          [DEMO_EMAIL_SANDBOX_HEADER]: effectiveDemoSandboxId
        },
        signal
      });
      return response.data;
    }
  });
  const headerMessages =
    demoInboxQuery.data?.sandboxId &&
    demoInboxQuery.data.sandboxId !== effectiveDemoSandboxId
      ? []
      : demoInboxQuery.data?.messages ?? [];
  const demoInboxUnreadCount = getUnreadDemoEmailCount(
    effectiveDemoSandboxId,
    headerMessages
  );

  useEffect(() => {
    function syncDemoInboxState() {
      const activeEmail = user?.email || readActiveDemoEmailAddress();
      setActiveDemoSandboxId(readDemoEmailSandboxId(activeEmail));
      setInboxStateVersion((current) => current + 1);
    }

    window.addEventListener("storage", syncDemoInboxState);
    window.addEventListener(DEMO_EMAIL_SANDBOX_CHANGED_EVENT, syncDemoInboxState);
    window.addEventListener(DEMO_INBOX_STATE_EVENT, syncDemoInboxState);

    return () => {
      window.removeEventListener("storage", syncDemoInboxState);
      window.removeEventListener(DEMO_EMAIL_SANDBOX_CHANGED_EVENT, syncDemoInboxState);
      window.removeEventListener(DEMO_INBOX_STATE_EVENT, syncDemoInboxState);
    };
  }, [user?.email]);

  useEffect(() => {
    const activeEmail = user?.email || readActiveDemoEmailAddress();
    setActiveDemoSandboxId(readDemoEmailSandboxId(activeEmail));
  }, [user?.email]);

  useEffect(() => {
    if (!demoEmailSandboxEnabled || !currentDemoEmail || currentDemoSandboxId) {
      return undefined;
    }

    let cancelled = false;

    void activateDemoEmailSandboxForEmail(currentDemoEmail, locale).then((sandboxId) => {
      if (!cancelled && sandboxId) {
        setActiveDemoSandboxId(sandboxId);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [currentDemoEmail, currentDemoSandboxId, demoEmailSandboxEnabled, locale]);

  useEffect(() => {
    let retryTimer = null;

    function refreshDemoInbox() {
      if (!demoEmailSandboxEnabled || !effectiveDemoSandboxId) {
        return;
      }

      void demoInboxQuery.refetch();
      window.clearTimeout(retryTimer);
      retryTimer = window.setTimeout(() => {
        void demoInboxQuery.refetch();
      }, 1200);
    }

    window.addEventListener(DEMO_EMAIL_SANDBOX_MESSAGES_CHANGED_EVENT, refreshDemoInbox);

    return () => {
      window.removeEventListener(DEMO_EMAIL_SANDBOX_MESSAGES_CHANGED_EVENT, refreshDemoInbox);
      window.clearTimeout(retryTimer);
    };
  }, [demoEmailSandboxEnabled, effectiveDemoSandboxId, demoInboxQuery.refetch]);

  useEffect(() => {
    setMenuOpen(false);
    setLocaleMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleDocumentClick(event) {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }

      if (!localeRef.current?.contains(event.target)) {
        setLocaleMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setLocaleMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleLocaleChange(nextLocale) {
    const previousLocale = locale;

    if (nextLocale === previousLocale) {
      setLocaleMenuOpen(false);
      return;
    }

    setLocale(nextLocale);
    setLocaleMenuOpen(false);

    if (!isAuthenticated || !user) {
      return;
    }

    setLocalePending(true);

    try {
      await updateProfile({ locale: nextLocale }, user.__version ?? user.version);
    } catch (error) {
      setLocale(previousLocale);
      window.alert(error?.message ?? "Language could not be updated.");
    } finally {
      setLocalePending(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  }

  const activeMenuLinks = useMemo(() => {
    const items = USER_MENU_LINKS.map((item) => ({
      ...item,
      label: t(item.labelKey),
      badgeValue: item.badge === "updates" && unreadCount > 0 ? unreadCount : null
    }));

    const adminItems = isAdmin
      ? ADMIN_MENU_LINKS.map((item) => ({
          ...item,
          admin: true,
          label: t(item.labelKey),
          badgeTone: item.to === "/admin/reports" ? "danger" : "default",
          badgeValue:
            item.to === "/admin/reports" && adminOpenReportsCount > 0
              ? adminOpenReportsCount
              : null
        }))
      : [];

    return { items, adminItems };
  }, [adminOpenReportsCount, isAdmin, t, unreadCount]);

  return (
    <header className="topbar topbar-unified">
      <div className="topbar-brand-slot">
        <NavLink aria-label={t("common.appName")} className="brand" to="/">
          <img alt={t("common.appName")} src="/logo_with_title_transparent.png" />
        </NavLink>
      </div>

      <nav className="topbar-nav">
        {BASE_NAV_LINKS.map((link) => (
          <TopNavLink icon={link.icon} key={link.to} end={link.end} to={link.to}>
            {t(link.labelKey)}
          </TopNavLink>
        ))}
      </nav>

      <div className="topbar-end">
        {demoEmailSandboxEnabled ? (
          <HeaderInboxLink
            badgeValue={demoInboxUnreadCount}
            label={t("common.demoInbox")}
          />
        ) : null}

        <LocalePicker
          disabled={localePending}
          locale={locale}
          menuOpen={localeMenuOpen}
          onChange={handleLocaleChange}
          onToggle={() => setLocaleMenuOpen((current) => !current)}
          options={localeOptions}
          pickerRef={localeRef}
        />

        {isAuthenticated ? (
          <div className="user-menu" ref={menuRef}>
            <div className={menuOpen ? "user-menu-shell user-menu-shell-open" : "user-menu-shell"}>
              <button
                className="user-chip user-chip-button"
                onClick={() => navigate("/app/profile")}
                type="button"
              >
                <span className="user-chip-avatar-wrap">
                  <UserAvatar name={user?.nickname ?? user?.email} photoUrl={user?.photoUrl} size="sm" />
                </span>
                <div className="user-chip-copy">
                  <span>{user?.nickname ?? t("shell.unknownUser")}</span>
                  <small>{user?.email ?? t("shell.noEmail")}</small>
                </div>
                {isSuperAdmin ? (
                  <span className="status-pill status-pill-super-admin">{t("shell.superAdmin")}</span>
                ) : isAdmin ? (
                  <span className="status-pill status-pill-success">{t("shell.admin")}</span>
                ) : null}
              </button>

              <button
                aria-expanded={menuOpen}
                aria-label={t("shell.workspace")}
                className={`icon-button user-menu-toggle${menuOpen ? " user-menu-toggle-active" : ""}`}
                onClick={() => {
                  setMenuOpen((current) => {
                    const next = !current;

                    if (next && typeof window !== "undefined") {
                      window.dispatchEvent(new Event(USER_MENU_OPEN_EVENT));
                    }

                    return next;
                  });
                }}
                type="button"
              >
                <MenuIcon />
                {userMenuBadgeCount > 0 ? (
                  <span className="user-menu-toggle-badge">{userMenuBadgeCount}</span>
                ) : null}
              </button>
            </div>

            {menuOpen ? (
              <div className="topbar-menu">
                <div className="topbar-menu-group">
                  {activeMenuLinks.items.map((item) => (
                    <MenuLink
                      active={isMenuLinkActive(location.pathname, item)}
                      badgeValue={item.badgeValue}
                      icon={item.icon}
                      key={item.to}
                      label={item.label}
                      navigate={navigate}
                      to={item.to}
                    />
                  ))}
                </div>

                {activeMenuLinks.adminItems.length ? (
                  <div className="topbar-menu-group">
                    <span className="topbar-menu-label">{t("shell.admin")}</span>
                    {activeMenuLinks.adminItems.map((item) => (
                      <MenuLink
                        active={isMenuLinkActive(location.pathname, item)}
                        admin={item.admin}
                        badgeValue={item.badgeValue}
                        icon={item.icon}
                        key={item.to}
                        label={item.label}
                        navigate={navigate}
                        to={item.to}
                      />
                    ))}
                  </div>
                ) : null}

                <div className="topbar-menu-group">
                  <button
                    className="topbar-menu-item topbar-menu-item-danger"
                    onClick={() => void handleLogout()}
                    type="button"
                  >
                    <span className="topbar-menu-item-main">
                      <span className="topbar-menu-item-icon">
                        <SignOutIcon />
                      </span>
                      <span>{t("shell.logout")}</span>
                    </span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="topbar-auth-actions">
            <NavLink className="button button-secondary topbar-auth-link" to="/login">
              <SignInIcon />
              <span>{t("common.signIn")}</span>
            </NavLink>
            <NavLink className="button topbar-auth-link" to="/register">
              <UserPlusIcon />
              <span>{t("common.register")}</span>
            </NavLink>
          </div>
        )}
      </div>
    </header>
  );
}

function TopNavLink({ children, end = false, icon: Icon, to }) {
  return (
    <NavLink
      end={end}
      to={to}
      className={({ isActive }) => (isActive ? "topbar-link topbar-link-active" : "topbar-link")}
    >
      {Icon ? <Icon /> : null}
      <span>{children}</span>
    </NavLink>
  );
}

function HeaderInboxLink({ badgeValue, label }) {
  return (
    <NavLink
      className={({ isActive }) =>
        isActive
          ? "topbar-link topbar-link-active topbar-inbox-link"
          : "topbar-link topbar-inbox-link"
      }
      to="/demo-inbox"
    >
      <EnvelopeClosedIcon />
      <span>{label}</span>
      {badgeValue > 0 ? <span className="topbar-inbox-badge">{badgeValue}</span> : null}
    </NavLink>
  );
}

function ScrollBehavior() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ left: 0, top: 0, behavior: "auto" });
    }
  }, [location.pathname]);

  return null;
}

function ScrollToTopButton() {
  const { locale } = useLocale();
  const [visible, setVisible] = useState(false);
  const label = SCROLL_TOP_LABELS[locale] ?? SCROLL_TOP_LABELS.en;

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > 420);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <button
      aria-label={label}
      className={visible ? "scroll-top-button scroll-top-button-visible" : "scroll-top-button"}
      onClick={() => window.scrollTo({ left: 0, top: 0, behavior: "smooth" })}
      type="button"
    >
      <ArrowUpIcon />
    </button>
  );
}

function LocalePicker({
  disabled = false,
  locale,
  menuOpen,
  onChange,
  onToggle,
  options,
  pickerRef
}) {
  return (
    <div className="locale-picker locale-picker-compact locale-picker-menu" ref={pickerRef}>
      <button
        aria-expanded={menuOpen}
        className="locale-picker-button"
        disabled={disabled}
        onClick={onToggle}
        type="button"
      >
        <LocaleFlagIcon locale={locale} />
        <span className="locale-picker-button-label">{getLocaleLabel(locale)}</span>
        <span className="locale-picker-button-caret" aria-hidden="true" />
      </button>

      {menuOpen ? (
        <div className="locale-picker-dropdown">
          {options.map((item) => (
            <button
              key={item}
              className={
                item === locale
                  ? "locale-picker-option locale-picker-option-active"
                  : "locale-picker-option"
              }
              disabled={disabled}
              onClick={() => void onChange(item)}
              type="button"
            >
              <LocaleFlagIcon locale={item} />
              <span>{getLocaleLabel(item)}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({
  active = false,
  admin = false,
  badgeTone = "default",
  badgeValue = null,
  icon: Icon,
  label,
  navigate,
  to
}) {
  const className = [
    "topbar-menu-item",
    admin ? "topbar-menu-item-admin" : "topbar-menu-item-user",
    active ? "topbar-menu-item-active" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      aria-current={active ? "page" : undefined}
      className={className}
      onClick={() => navigate(to)}
      type="button"
    >
      <span className="topbar-menu-item-main">
        {Icon ? (
          <span
            className={
              admin
                ? "topbar-menu-item-icon topbar-menu-item-icon-admin"
                : "topbar-menu-item-icon"
            }
          >
            <Icon />
            {admin ? (
              <span className="admin-icon-badge admin-icon-badge-menu">
                <AdminBadgeIcon />
              </span>
            ) : null}
          </span>
        ) : null}
        <span>{label}</span>
      </span>
      {badgeValue ? <span className={badgeTone === "danger" ? "badge badge-danger" : "badge"}>{badgeValue}</span> : null}
    </button>
  );
}

function isMenuLinkActive(pathname, item) {
  const paths = [item.to, ...(item.matchPrefixes ?? [])];

  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function LocaleFlagIcon({ locale }) {
  if (locale === "de") {
    return (
      <svg aria-hidden="true" className="locale-flag-icon" viewBox="0 0 24 24">
        <rect width="24" height="8" fill="#111111" />
        <rect y="8" width="24" height="8" fill="#c62828" />
        <rect y="16" width="24" height="8" fill="#f2c94c" />
      </svg>
    );
  }

  if (locale === "ru") {
    return (
      <svg aria-hidden="true" className="locale-flag-icon" viewBox="0 0 24 24">
        <rect width="24" height="8" fill="#ffffff" />
        <rect y="8" width="24" height="8" fill="#2f6bcc" />
        <rect y="16" width="24" height="8" fill="#c23b33" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="locale-flag-icon" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="3" fill="#234a9f" />
      <path d="M10 0h4v24h-4z" fill="#ffffff" />
      <path d="M0 10h24v4H0z" fill="#ffffff" />
      <path d="M11 0h2v24h-2z" fill="#c23b33" />
      <path d="M0 11h24v2H0z" fill="#c23b33" />
      <path
        d="M0 2l8 8H5l-5-5zM24 2l-8 8h3l5-5zM0 22l8-8H5l-5 5zM24 22l-8-8h3l5 5z"
        fill="#ffffff"
      />
      <path
        d="M0 3l7 7h-2L0 5zM24 3l-7 7h2l5-5zM0 21l7-7h-2l-5 5zM24 21l-7-7h2l5 5z"
        fill="#c23b33"
      />
    </svg>
  );
}
