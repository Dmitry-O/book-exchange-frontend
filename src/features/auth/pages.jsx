import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useMetadataQuery } from "../../shared/api/hooks";
import { apiRequest } from "../../shared/api/http";
import { useAuth } from "../../shared/auth/AuthContext";
import { useLocale } from "../../shared/i18n/LocaleContext";
import {
  clearPostLogoutRedirect,
  hasPostLogoutRedirect
} from "../../shared/auth/session";
import { trimFormPayload } from "../../shared/lib/format";
import { ErrorBlock, LoadingBlock } from "../../shared/ui/StateBlocks";

const TOKEN_RECOVERY_CODES = new Set([
  "AUTH_TOKEN_EXPIRED",
  "AUTH_TOKEN_NOT_FOUND",
  "AUTH_TOKEN_NOT_VALID"
]);

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLocale();
  const { login, isAuthenticated } = useAuth();
  const [postLogoutRedirect] = useState(() => hasPostLogoutRedirect());
  const [form, setForm] = useState({
    email: "",
    password: ""
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const nextPath = postLogoutRedirect
    ? "/app/profile"
    : location.state?.from?.pathname || "/app/profile";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(nextPath, { replace: true });
    }
  }, [isAuthenticated, navigate, nextPath]);

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      await login(trimFormPayload(form));
      clearPostLogoutRedirect();
      navigate(nextPath, { replace: true });
    } catch (nextError) {
      setError(nextError);
    } finally {
      setPending(false);
    }
  }

  const helperCard = buildLoginHelper(t, error, form.email);

  return (
    <AuthPanel
      eyebrow={t("auth.signInEyebrow")}
      title={t("auth.signInTitle")}
      description={t("auth.signInDescription")}
      footer={
        <p className="muted-line">
          {t("auth.noAccount")} <Link to="/register">{t("auth.createOne")}</Link>
        </p>
      }
    >
      <form className="content-stack" onSubmit={handleSubmit}>
        <Field
          label={t("auth.email")}
          name="email"
          type="email"
          value={form.email}
          onChange={(value) => setForm((current) => ({ ...current, email: value }))}
          required
        />
        <Field
          label={t("auth.password")}
          name="password"
          type="password"
          value={form.password}
          onChange={(value) => setForm((current) => ({ ...current, password: value }))}
          required
        />

        {error ? <InlineError error={error} /> : null}

        <button className="button" disabled={pending} type="submit">
          {pending ? t("auth.signingIn") : t("common.signIn")}
        </button>
      </form>

      {helperCard ? <AuthHelperCard {...helperCard} /> : null}
    </AuthPanel>
  );
}

export function RegisterPage() {
  const metadataQuery = useMetadataQuery();
  const { locale, setLocale, t } = useLocale();
  const [form, setForm] = useState({
    email: "",
    password: "",
    nickname: "",
    locale
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const locale = metadataQuery.data?.locales?.[0];

    if (locale) {
      setForm((current) => ({ ...current, locale: current.locale || locale }));
    }
  }, [metadataQuery.data]);

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccessMessage("");

    try {
      const response = await apiRequest("/auth/register", {
        method: "POST",
        body: trimFormPayload(form),
        locale: form.locale
      });

      setSuccessMessage(
        response.message ||
          "Your account was created. Please confirm your email address before signing in."
      );
    } catch (nextError) {
      setError(nextError);
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthPanel
      eyebrow={t("auth.registerEyebrow")}
      title={t("auth.registerTitle")}
      description={t("auth.registerDescription")}
      footer={
        <p className="muted-line">
          {t("auth.alreadyRegistered")} <Link to="/login">{t("auth.goToLogin")}</Link>
        </p>
      }
    >
      {metadataQuery.isPending ? <LoadingBlock label={t("homePage.metadataLoading")} /> : null}
      {metadataQuery.error ? (
        <ErrorBlock error={metadataQuery.error} title="Metadata could not be loaded" />
      ) : null}

      <form className="content-stack" onSubmit={handleSubmit}>
        <Field
          label={t("auth.email")}
          name="email"
          type="email"
          value={form.email}
          onChange={(value) => setForm((current) => ({ ...current, email: value }))}
          required
        />
        <Field
          label={t("auth.nickname")}
          name="nickname"
          value={form.nickname}
          onChange={(value) => setForm((current) => ({ ...current, nickname: value }))}
          required
        />
        <Field
          label={t("auth.password")}
          name="password"
          type="password"
          value={form.password}
          onChange={(value) => setForm((current) => ({ ...current, password: value }))}
          required
        />
        <SelectField
          label={t("auth.locale")}
          name="locale"
          value={form.locale}
          options={metadataQuery.data?.locales ?? ["en"]}
          onChange={(value) => {
            setLocale(value);
            setForm((current) => ({ ...current, locale: value }));
          }}
        />

        {successMessage ? <InlineSuccess message={successMessage} /> : null}
        {error ? <InlineError error={error} /> : null}

        <button className="button" disabled={pending || metadataQuery.isPending} type="submit">
          {pending ? t("auth.creatingAccount") : t("auth.createAccount")}
        </button>
      </form>

      {successMessage ? (
        <AuthHelperCard
          title={t("auth.nextStepsTitle")}
          description={t("auth.nextStepsDescription")}
          actions={[
            {
              kind: "link",
              label: t("auth.resendConfirmation"),
              to: withEmailQuery("/resend-confirmation", form.email)
            },
            {
              kind: "link",
              label: t("auth.goToLogin"),
              to: "/login"
            }
          ]}
        />
      ) : null}
    </AuthPanel>
  );
}

export function ForgotPasswordPage() {
  const { t } = useLocale();

  return (
    <EmailActionPage
      eyebrow={t("auth.resetEyebrow")}
      title={t("auth.forgotPasswordTitle")}
      description={t("auth.forgotPasswordDescription")}
      endpoint="/auth/forgot_password"
      buttonLabel={t("auth.sendResetLink")}
      successFallback="If the account exists, password reset instructions have been sent."
    />
  );
}

export function ResendConfirmationPage() {
  const { t } = useLocale();

  return (
    <EmailActionPage
      eyebrow={t("auth.verifyEyebrow")}
      title={t("auth.resendTitle")}
      description={t("auth.resendDescription")}
      endpoint="/auth/resend_confirmation_email"
      buttonLabel={t("auth.resendConfirmation")}
      successFallback="A new confirmation email has been sent."
      softSuccessActions={[{ kind: "link", label: t("auth.goToLogin"), to: "/login" }]}
      softSuccessErrorCodes={["AUTH_ACCOUNT_ALREADY_VERIFIED"]}
      footer={
        <p className="muted-line">
          {t("auth.alreadyConfirmed")} <Link to="/login">{t("auth.backToLogin")}</Link>
        </p>
      }
    />
  );
}

export function DeleteAccountRequestPage() {
  const { t } = useLocale();

  return (
    <EmailActionPage
      eyebrow={t("auth.deleteEyebrow")}
      title={t("auth.requestDeleteTitle")}
      description={t("auth.requestDeleteDescription")}
      endpoint="/auth/initiate_delete_account"
      buttonLabel={t("auth.sendDeletionEmail")}
      successFallback="If the account exists, an account deletion email has been sent."
    />
  );
}

export function VerifyEmailPage() {
  const { t } = useLocale();

  return (
    <TokenActionPage
      actionLabel={t("auth.verifyAction")}
      autoRun
      description={t("auth.verifyDescription")}
      endpointBuilder={(token) => `/auth/verify?token=${encodeURIComponent(token)}`}
      eyebrow={t("auth.verifyEyebrow")}
      method="GET"
      recoveryAction={{
        buttonLabel: t("auth.sendNewConfirmation"),
        endpoint: "/auth/resend_confirmation_email",
        successFallback: "A new confirmation email has been sent.",
        softSuccessActions: [{ kind: "link", label: t("auth.goToLogin"), to: "/login" }],
        softSuccessErrorCodes: ["AUTH_ACCOUNT_ALREADY_VERIFIED"],
        title: t("auth.freshConfirmationTitle"),
        description: t("auth.freshConfirmationDescription")
      }}
      softSuccessErrorCodes={["AUTH_ACCOUNT_ALREADY_VERIFIED"]}
      successActions={[
        { kind: "link", label: t("common.signIn"), to: "/login" },
        { kind: "link", label: t("common.goHome"), to: "/", secondary: true }
      ]}
      successFallback={t("auth.emailConfirmed")}
      title={t("auth.verifyTitle")}
    />
  );
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { t } = useLocale();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [form, setForm] = useState({ newPassword: "" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const canRecover = !token || isRecoverableTokenError(error);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!token) {
      setError(new Error("Reset token is missing from the URL."));
      return;
    }

    setPending(true);
    setError(null);
    setSuccessMessage("");

    try {
      const response = await apiRequest(`/auth/reset_password?token=${encodeURIComponent(token)}`, {
        method: "PATCH",
        body: trimFormPayload(form)
      });

      setSuccessMessage(response.message || "Your password has been changed.");
      setForm({ newPassword: "" });
    } catch (nextError) {
      setError(nextError);
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthPanel
      eyebrow={t("auth.resetEyebrow")}
      title={t("auth.resetTitle")}
      description={t("auth.resetDescription")}
    >
      {!token ? (
        <InlineError error={{ message: "Reset token was not found in the URL." }} />
      ) : null}

      {successMessage ? (
        <div className="content-stack">
          <InlineSuccess message={successMessage} />
          <div className="auth-actions-row">
            <button className="button" onClick={() => navigate("/login")} type="button">
              {t("common.signIn")}
            </button>
            <Link className="button button-secondary" to="/">
              {t("common.goHome")}
            </Link>
          </div>
        </div>
      ) : (
        <form className="content-stack" onSubmit={handleSubmit}>
          <Field
            label={t("auth.newPassword")}
            name="newPassword"
            type="password"
            value={form.newPassword}
            onChange={(value) => setForm({ newPassword: value })}
            required
          />

          {error ? <InlineError error={error} /> : null}

          <button className="button" disabled={pending || !token} type="submit">
            {pending ? t("auth.resettingPassword") : t("auth.resetPassword")}
          </button>
        </form>
      )}

      {canRecover && !successMessage ? (
        <InlineEmailActionCard
          buttonLabel={t("auth.sendNewReset")}
          description={t("auth.requestFreshResetDescription")}
          endpoint="/auth/forgot_password"
          successFallback="If the account exists, a new reset email has been sent."
          title={t("auth.requestFreshResetTitle")}
        />
      ) : null}
    </AuthPanel>
  );
}

export function DeleteAccountTokenPage() {
  const { clearSession } = useAuth();
  const { t } = useLocale();

  return (
    <TokenActionPage
      actionLabel={t("auth.deleteAction")}
      description={t("auth.deleteDescription")}
      destructive
      endpointBuilder={(token) => `/auth/delete_account?token=${encodeURIComponent(token)}`}
      eyebrow={t("auth.deleteEyebrow")}
      method="PATCH"
      onSuccess={() => clearSession()}
      recoveryAction={{
        buttonLabel: t("auth.sendNewDeletion"),
        endpoint: "/auth/initiate_delete_account",
        successFallback: "If the account exists, a new deletion email has been sent.",
        title: t("auth.newDeletionTitle"),
        description: t("auth.newDeletionDescription")
      }}
      successActions={[
        { kind: "link", label: t("common.goHome"), to: "/" },
        { kind: "link", label: t("common.catalog"), to: "/catalog", secondary: true }
      ]}
      successFallback={t("auth.deletedSuccess")}
      title={t("auth.deleteTitle")}
    />
  );
}

function EmailActionPage({
  eyebrow,
  title,
  description,
  endpoint,
  buttonLabel,
  successFallback,
  footer,
  softSuccessErrorCodes = [],
  softSuccessActions = []
}) {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";
  const { locale } = useLocale();

  return (
    <AuthPanel eyebrow={eyebrow} title={title} description={description} footer={footer}>
      <EmailActionForm
        buttonLabel={buttonLabel}
        endpoint={endpoint}
        initialEmail={initialEmail}
        locale={locale}
        softSuccessActions={softSuccessActions}
        softSuccessErrorCodes={softSuccessErrorCodes}
        successFallback={successFallback}
      />
    </AuthPanel>
  );
}

function TokenActionPage({
  eyebrow,
  title,
  description,
  endpointBuilder,
  method,
  autoRun = false,
  actionLabel,
  successFallback,
  destructive = false,
  successActions = [],
  recoveryAction = null,
  softSuccessErrorCodes = [],
  onSuccess
}) {
  const [searchParams] = useSearchParams();
  const { t } = useLocale();
  const token = searchParams.get("token") ?? "";
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const hasAutoRun = useRef(false);

  const hasToken = Boolean(token);
  const isSoftSuccess = Boolean(error?.errorCode && softSuccessErrorCodes.includes(error.errorCode));
  const effectiveSuccessMessage = successMessage || (isSoftSuccess ? error?.message : "");
  const shouldOfferRecovery =
    recoveryAction &&
    !effectiveSuccessMessage &&
    (!hasToken || isRecoverableTokenError(error));
  const shouldShowActionButton = !effectiveSuccessMessage && !autoRun;

  useEffect(() => {
    if (!autoRun || !hasToken || hasAutoRun.current || effectiveSuccessMessage) {
      return;
    }

    hasAutoRun.current = true;
    void handleRequest();
  }, [autoRun, effectiveSuccessMessage, hasToken]);

  async function handleRequest() {
    if (!token) {
      setError(new Error("Token is missing from the URL."));
      return;
    }

    setPending(true);
    setError(null);
    setSuccessMessage("");

    try {
      const response = await apiRequest(endpointBuilder(token), { method });
      setSuccessMessage(response.message || successFallback);
      await onSuccess?.(response);
    } catch (nextError) {
      setError(nextError);
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthPanel eyebrow={eyebrow} title={title} description={description}>
      <div className="content-stack">
        {effectiveSuccessMessage ? <InlineSuccess message={effectiveSuccessMessage} /> : null}
        {!effectiveSuccessMessage && error ? <InlineError error={error} /> : null}

        {shouldShowActionButton ? (
          <button
            className={destructive ? "button button-danger" : "button"}
            disabled={pending || !hasToken}
            onClick={() => void handleRequest()}
            type="button"
          >
            {pending ? t("auth.processing") : actionLabel}
          </button>
        ) : null}

        {effectiveSuccessMessage ? <ActionLinksRow actions={successActions} /> : null}

        {shouldOfferRecovery ? (
          <InlineEmailActionCard
            buttonLabel={recoveryAction.buttonLabel ?? "Send email"}
            description={recoveryAction.description}
            endpoint={recoveryAction.endpoint}
            softSuccessActions={recoveryAction.softSuccessActions}
            softSuccessErrorCodes={recoveryAction.softSuccessErrorCodes}
            successFallback={recoveryAction.successFallback}
            title={recoveryAction.title}
          />
        ) : null}
      </div>
    </AuthPanel>
  );
}

function EmailActionForm({
  endpoint,
  buttonLabel,
  successFallback,
  initialEmail = "",
  compact = false,
  locale,
  softSuccessErrorCodes = [],
  softSuccessActions = []
}) {
  const { t } = useLocale();
  const [email, setEmail] = useState(initialEmail);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [softSuccessMessage, setSoftSuccessMessage] = useState("");

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  function handleEmailChange(nextValue) {
    setEmail(nextValue);
    setError(null);
    setSuccessMessage("");
    setSoftSuccessMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccessMessage("");

    try {
      const response = await apiRequest(endpoint, {
        method: "PATCH",
        body: trimFormPayload({ email }),
        locale
      });

      setSuccessMessage(response.message || successFallback);
    } catch (nextError) {
      if (softSuccessErrorCodes.includes(nextError?.errorCode)) {
        setSoftSuccessMessage(nextError.message || successFallback);
      } else {
        setError(nextError);
      }
    } finally {
      setPending(false);
    }
  }

  const isCompleted = Boolean(successMessage || softSuccessMessage);

  return (
    <form className={compact ? "content-stack auth-inline-form" : "content-stack"} onSubmit={handleSubmit}>
      <Field
        label={t("auth.email")}
        name="email"
        type="email"
        value={email}
        onChange={handleEmailChange}
        required
      />

      {successMessage ? <InlineSuccess message={successMessage} /> : null}
      {softSuccessMessage ? <InlineSuccess message={softSuccessMessage} /> : null}
      {error ? <InlineError error={error} /> : null}
      {softSuccessMessage ? <ActionLinksRow actions={softSuccessActions} /> : null}

      <button className="button" disabled={pending || isCompleted} type="submit">
        {pending ? t("auth.sending") : buttonLabel}
      </button>
    </form>
  );
}

function InlineEmailActionCard({
  title,
  description,
  endpoint,
  buttonLabel,
  successFallback,
  softSuccessErrorCodes = [],
  softSuccessActions = []
}) {
  return (
    <section className="auth-helper-card auth-helper-card-soft">
      <h2>{title}</h2>
      <p>{description}</p>
      <EmailActionForm
        buttonLabel={buttonLabel}
        compact
        endpoint={endpoint}
        softSuccessActions={softSuccessActions}
        softSuccessErrorCodes={softSuccessErrorCodes}
        successFallback={successFallback}
      />
    </section>
  );
}

function AuthHelperCard({ title, description, actions = [] }) {
  return (
    <section className="auth-helper-card">
      <h2>{title}</h2>
      <p>{description}</p>
      <ActionLinksRow actions={actions} />
    </section>
  );
}

function ActionLinksRow({ actions = [] }) {
  if (!actions.length) {
    return null;
  }

  return (
    <div className="auth-actions-row">
      {actions.map((action) =>
        action.kind === "button" ? (
          <button
            key={`${action.kind}-${action.label}`}
            className={action.secondary ? "button button-secondary" : "button"}
            onClick={action.onClick}
            type="button"
          >
            {action.label}
          </button>
        ) : (
          <Link
            key={`${action.kind}-${action.label}-${action.to}`}
            className={action.secondary ? "button button-secondary" : "button"}
            to={action.to}
          >
            {action.label}
          </Link>
        )
      )}
    </div>
  );
}

function AuthPanel({ eyebrow, title, description, children, footer }) {
  return (
    <section className="auth-shell">
      <div className="auth-panel">
        <h1>{title}</h1>
        <p>{description}</p>
        {children}
        {footer ? <div className="auth-footer">{footer}</div> : null}
      </div>
    </section>
  );
}

function Field({ label, name, onChange, ...inputProps }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        {...inputProps}
        className="field-control"
        name={name}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SelectField({ label, name, options, onChange, value }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select
        className="field-control"
        name={name}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function InlineError({ error }) {
  return <p className="inline-message inline-message-error">{error?.message}</p>;
}

function InlineSuccess({ message }) {
  return <p className="inline-message inline-message-success">{message}</p>;
}

function buildLoginHelper(t, error, email) {
  if (!error?.errorCode) {
    return null;
  }

  if (error.errorCode === "AUTH_ACCOUNT_NOT_VERIFIED") {
    return {
      title: t("auth.accountNeedsConfirmationTitle"),
      description: t("auth.accountNeedsConfirmationDescription"),
      actions: [
        {
          kind: "link",
          label: t("auth.resendConfirmation"),
          to: withEmailQuery("/resend-confirmation", email)
        }
      ]
    };
  }

  if (error.errorCode === "AUTH_PERMANENTLY_BANNED") {
    return {
      title: t("auth.bannedTitle"),
      description: t("auth.bannedDescription"),
      actions: [
        {
          kind: "link",
          label: t("auth.requestDeletionEmail"),
          to: withEmailQuery("/delete-account-request", email)
        }
      ]
    };
  }

  if (error.errorCode === "AUTH_WRONG_PASSWORD") {
    return {
      title: t("auth.wrongPasswordTitle"),
      description: t("auth.wrongPasswordDescription"),
      actions: [
        {
          kind: "link",
          label: t("auth.resetPassword"),
          to: withEmailQuery("/forgot-password", email)
        }
      ]
    };
  }

  return null;
}

function isRecoverableTokenError(error) {
  return Boolean(error?.errorCode && TOKEN_RECOVERY_CODES.has(error.errorCode));
}

function withEmailQuery(path, email) {
  const trimmedEmail = email?.trim();

  if (!trimmedEmail) {
    return path;
  }

  return `${path}?email=${encodeURIComponent(trimmedEmail)}`;
}
