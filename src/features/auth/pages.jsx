import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useMetadataQuery } from "../../shared/api/hooks";
import { apiRequest } from "../../shared/api/http";
import { useAuth } from "../../shared/auth/AuthContext";
import { useLocale } from "../../shared/i18n/LocaleContext";
import { getLocaleLabel } from "../../shared/i18n/locale";
import {
  clearPostLogoutRedirect,
  hasPostLogoutRedirect
} from "../../shared/auth/session";
import { trimFormPayload } from "../../shared/lib/format";
import { PrettySelect } from "../../shared/ui/PrettySelect";
import { ErrorBlock, LoadingBlock } from "../../shared/ui/StateBlocks";

const TOKEN_RECOVERY_CODES = new Set([
  "AUTH_TOKEN_EXPIRED",
  "AUTH_TOKEN_NOT_FOUND",
  "AUTH_TOKEN_NOT_VALID"
]);

const LOCALE_LABELS = {
  de: "🇩🇪 Deutsch",
  en: "🇬🇧 English",
  ru: "🇷🇺 Русский"
};

function getLocaleOption(option) {
  return {
    value: option,
    label: getLocaleLabel(option)
  };
}

function formatCooldownDuration(locale, seconds) {
  if (locale === "ru") {
    const remainder10 = seconds % 10;
    const remainder100 = seconds % 100;

    if (remainder10 === 1 && remainder100 !== 11) {
      return `${seconds} секунду`;
    }

    if (remainder10 >= 2 && remainder10 <= 4 && (remainder100 < 12 || remainder100 > 14)) {
      return `${seconds} секунды`;
    }

    return `${seconds} секунд`;
  }

  if (locale === "de") {
    return `${seconds} Sekunden`;
  }

  return `${seconds} seconds`;
}

function getRegisterCooldownText(locale, seconds) {
  const duration = formatCooldownDuration(locale, seconds);

  if (locale === "ru") {
    return `Повторно письмо можно будет отправить через ${duration}`;
  }

  if (locale === "de") {
    return `Du kannst die E-Mail in ${duration} erneut senden.`;
  }

  return `You can resend the email in ${duration}.`;
}

function buildResetCooldownNote(locale, seconds) {
  const duration = formatCooldownDuration(locale, seconds);

  if (locale === "ru") {
    return `Отправить ссылку для сброса пароля повторно через ${duration}`;
  }

  if (locale === "de") {
    return `Link zum Zurücksetzen des Passworts in ${duration} erneut senden`;
  }

  return `Send the password reset link again in ${duration}`;
}

function buildDeleteCooldownNote(locale, seconds) {
  const duration = formatCooldownDuration(locale, seconds);

  if (locale === "ru") {
    return `Отправить ссылку на удаление аккаунта повторно через ${duration}`;
  }

  if (locale === "de") {
    return `Link zum Löschen des Kontos in ${duration} erneut senden`;
  }

  return `Send the account deletion link again in ${duration}`;
}

function getResetCooldownText(locale, seconds) {
  const duration = formatCooldownDuration(locale, seconds);

  if (locale === "ru") {
    return `Отправить ссылку для сброса пароля повторно через ${duration}`;
  }

  if (locale === "de") {
    return `Link zum Zurücksetzen des Passworts in ${duration} erneut senden`;
  }

  return `Send the password reset link again in ${duration}`;
}

function getDeleteCooldownText(locale, seconds) {
  const duration = formatCooldownDuration(locale, seconds);

  if (locale === "ru") {
    return `Отправить ссылку на удаление аккаунта повторно через ${duration}`;
  }

  if (locale === "de") {
    return `Link zum Löschen des Kontos in ${duration} erneut senden`;
  }

  return `Send the account deletion link again in ${duration}`;
}

const EMAIL_ACTION_COOLDOWNS_STORAGE_KEY = "book-exchange/email-action-cooldowns";
const EMAIL_ACTION_LAST_EMAIL_STORAGE_KEY = "book-exchange/email-action-last-email";

function getRequiredFieldMessage(locale) {
  if (locale === "ru") {
    return "Заполните это поле.";
  }

  if (locale === "de") {
    return "Bitte füllen Sie dieses Feld aus.";
  }

  return "Please fill in this field.";
}

function buildMissingFieldErrors(locale, fields) {
  const message = getRequiredFieldMessage(locale);

  return fields.reduce((accumulator, field) => {
    accumulator[field] = message;
    return accumulator;
  }, {});
}

function readEmailActionCooldown(endpoint, email) {
  if (typeof window === "undefined") {
    return 0;
  }

  const normalizedEmail = email?.trim().toLowerCase();

  if (!endpoint || !normalizedEmail) {
    return 0;
  }

  try {
    const raw = window.localStorage.getItem(EMAIL_ACTION_COOLDOWNS_STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) : {};
    const cooldownKey = `${endpoint}::${normalizedEmail}`;
    const expiresAt = Number(stored[cooldownKey]);

    if (!expiresAt) {
      return 0;
    }

    const remaining = Math.ceil((expiresAt - Date.now()) / 1000);

    if (remaining <= 0) {
      delete stored[cooldownKey];
      window.localStorage.setItem(EMAIL_ACTION_COOLDOWNS_STORAGE_KEY, JSON.stringify(stored));
      return 0;
    }

    return remaining;
  } catch {
    return 0;
  }
}

function writeEmailActionCooldown(endpoint, email, cooldownSeconds) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedEmail = email?.trim().toLowerCase();

  if (!endpoint || !normalizedEmail || cooldownSeconds <= 0) {
    return;
  }

  try {
    const raw = window.localStorage.getItem(EMAIL_ACTION_COOLDOWNS_STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) : {};
    stored[`${endpoint}::${normalizedEmail}`] = Date.now() + cooldownSeconds * 1000;
    window.localStorage.setItem(EMAIL_ACTION_COOLDOWNS_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Ignore localStorage issues and keep the in-memory cooldown.
  }
}

function readRememberedEmail(endpoint) {
  if (typeof window === "undefined" || !endpoint) {
    return "";
  }

  try {
    const raw = window.localStorage.getItem(EMAIL_ACTION_LAST_EMAIL_STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) : {};

    return typeof stored[endpoint] === "string" ? stored[endpoint] : "";
  } catch {
    return "";
  }
}

function writeRememberedEmail(endpoint, email) {
  if (typeof window === "undefined" || !endpoint) {
    return;
  }

  const normalizedEmail = email?.trim();

  if (!normalizedEmail) {
    return;
  }

  try {
    const raw = window.localStorage.getItem(EMAIL_ACTION_LAST_EMAIL_STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) : {};
    stored[endpoint] = normalizedEmail;
    window.localStorage.setItem(EMAIL_ACTION_LAST_EMAIL_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Ignore localStorage issues and keep the in-memory value.
  }
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { locale, t } = useLocale();
  const { login, isAuthenticated } = useAuth();
  const [postLogoutRedirect] = useState(() => hasPostLogoutRedirect());
  const [form, setForm] = useState({
    email: "",
    password: ""
  });
  const [fieldErrors, setFieldErrors] = useState({
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
    const missingFields = [];

    if (!form.email.trim()) {
      missingFields.push("email");
    }

    if (!form.password.trim()) {
      missingFields.push("password");
    }

    if (missingFields.length) {
      setFieldErrors(buildMissingFieldErrors(locale, missingFields));
      setError(null);
      return;
    }

    setPending(true);
    setError(null);
    setFieldErrors({ email: "", password: "" });

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

  const helperCards = buildLoginHelpers(t, error, form.email);

  return (
    <AuthPanel
      compact
      eyebrow={t("auth.signInEyebrow")}
      title={t("auth.signInTitle")}
      description={t("auth.signInDescription")}
      footer={
        <p className="muted-line">
          {t("auth.noAccount")} <Link to="/register">{t("auth.createOne")}</Link>
        </p>
      }
      postFooter={
        helperCards.length ? (
          <>
            {helperCards.map((card) => (
              <AuthHelperCard
                key={`${card.title}-${card.description}`}
                actions={card.actions}
                description={card.description}
                title={card.title}
              />
            ))}
          </>
        ) : null
      }
    >
      <form className="content-stack auth-form-shell auth-form-shell-centered auth-primary-form" onSubmit={handleSubmit}>
        <Field
          error={fieldErrors.email}
          label={t("auth.email")}
          name="email"
          type="email"
          value={form.email}
          onChange={(value) => {
            setForm((current) => ({ ...current, email: value }));
            setFieldErrors((current) => ({ ...current, email: "" }));
            setError(null);
          }}
          required
        />
        <Field
          error={fieldErrors.password}
          label={t("auth.password")}
          name="password"
          type="password"
          value={form.password}
          onChange={(value) => {
            setForm((current) => ({ ...current, password: value }));
            setFieldErrors((current) => ({ ...current, password: "" }));
            setError(null);
          }}
          required
        />
        <div className="auth-form-message-slot">{error ? <InlineError error={error} /> : null}</div>

        <button className="button auth-submit-button" disabled={pending} type="submit">
          {pending ? t("auth.signingIn") : t("common.signIn")}
        </button>
      </form>
    </AuthPanel>
  );
}

function RegisterSuccessHelper({ email, locale, title, description, buttonLabel, successFallback }) {
  return (
    <AuthHelperCard description={description} title={title}>
      <EmailActionForm
        buttonLabel={buttonLabel}
        compact
        cooldownHintBuilder={(seconds) => getRegisterCooldownText(locale, seconds)}
        cooldownSeconds={60}
        disableAfterSuccess={false}
        endpoint="/auth/resend_confirmation_email"
        hideEmailField
        initialCooldownActive
        initialEmail={email}
        locale={locale}
        successFallback={successFallback}
      />
    </AuthHelperCard>
  );
}

export function RegisterPage() {
  const metadataQuery = useMetadataQuery();
  const { locale, locales, setLocale, t } = useLocale();
  const [form, setForm] = useState({
    email: "",
    password: "",
    nickname: "",
    locale
  });
  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    nickname: "",
    password: "",
    locale: ""
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
    const missingFields = [];

    if (!form.email.trim()) {
      missingFields.push("email");
    }

    if (!form.nickname.trim()) {
      missingFields.push("nickname");
    }

    if (!form.password.trim()) {
      missingFields.push("password");
    }

    if (!form.locale) {
      missingFields.push("locale");
    }

    if (missingFields.length) {
      setFieldErrors((current) => ({ ...current, ...buildMissingFieldErrors(locale, missingFields) }));
      setError(null);
      setSuccessMessage("");
      return;
    }

    setPending(true);
    setError(null);
    setSuccessMessage("");
    setFieldErrors({
      email: "",
      nickname: "",
      password: "",
      locale: ""
    });

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
      compact
      eyebrow={t("auth.registerEyebrow")}
      title={t("auth.registerTitle")}
      description={t("auth.registerDescription")}
      footer={
        <p className="muted-line">
          {t("auth.alreadyRegistered")} <Link to="/login">{t("auth.goToLogin")}</Link>
        </p>
      }
      postFooter={
        successMessage ? (
          <RegisterSuccessHelper
            buttonLabel={t("auth.resendConfirmation")}
            description={t("auth.nextStepsDescription")}
            email={form.email}
            locale={form.locale}
            successFallback="A new confirmation email has been sent."
            title={t("auth.nextStepsTitle")}
          />
        ) : null
      }
    >
      {metadataQuery.isPending ? <LoadingBlock label={t("homePage.metadataLoading")} /> : null}
      {metadataQuery.error ? (
        <ErrorBlock error={metadataQuery.error} title={t("auth.registrationDataError")} />
      ) : null}

      <form className="content-stack auth-form-shell auth-form-shell-centered auth-form-shell-narrow auth-primary-form" onSubmit={handleSubmit}>
        <Field
          error={fieldErrors.email}
          label={t("auth.email")}
          name="email"
          type="email"
          value={form.email}
          onChange={(value) => {
            setForm((current) => ({ ...current, email: value }));
            setFieldErrors((current) => ({ ...current, email: "" }));
            setError(null);
          }}
          required
          showRequiredMark
        />
        <Field
          error={fieldErrors.nickname}
          label={t("auth.nickname")}
          name="nickname"
          value={form.nickname}
          onChange={(value) => {
            setForm((current) => ({ ...current, nickname: value }));
            setFieldErrors((current) => ({ ...current, nickname: "" }));
            setError(null);
          }}
          required
          showRequiredMark
        />
        <Field
          error={fieldErrors.password}
          label={t("auth.password")}
          name="password"
          type="password"
          value={form.password}
          onChange={(value) => {
            setForm((current) => ({ ...current, password: value }));
            setFieldErrors((current) => ({ ...current, password: "" }));
            setError(null);
          }}
          required
          showRequiredMark
        />
        <LocaleSelectField
          error={fieldErrors.locale}
          label={t("auth.locale")}
          value={form.locale}
          options={(metadataQuery.data?.locales ?? locales).map(getLocaleOption)}
          onChange={(value) => {
            setLocale(value);
            setForm((current) => ({ ...current, locale: value }));
            setFieldErrors((current) => ({ ...current, locale: "" }));
            setError(null);
          }}
          showRequiredMark
        />
        <div className="auth-form-message-slot">
          {successMessage ? <InlineSuccess message={successMessage} /> : null}
          {!successMessage && error ? <InlineError error={error} /> : null}
        </div>

        <button
          className="button auth-submit-button"
          disabled={pending || Boolean(successMessage)}
          type="submit"
        >
          {pending ? t("auth.creatingAccount") : t("auth.createAccount")}
        </button>
      </form>
    </AuthPanel>
  );
}

export function ForgotPasswordPage() {
  const { locale, t } = useLocale();

  return (
    <EmailActionPage
      compact
      eyebrow={t("auth.resetEyebrow")}
      title={t("auth.forgotPasswordTitle")}
      description={t("auth.forgotPasswordDescription")}
      endpoint="/auth/forgot_password"
      buttonLabel={t("auth.sendResetLink")}
      cooldownHintBuilder={(seconds) => buildResetCooldownNote(locale, seconds)}
      cooldownSeconds={60}
      disableAfterSuccess={false}
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
  const { locale, t } = useLocale();

  return (
    <EmailActionPage
      compact
      eyebrow={t("auth.deleteEyebrow")}
      title={t("auth.requestDeleteTitle")}
      description={t("auth.requestDeleteDescription")}
      endpoint="/auth/initiate_delete_account"
      buttonLabel={t("auth.sendDeletionEmail")}
      cooldownHintBuilder={(seconds) => buildDeleteCooldownNote(locale, seconds)}
      cooldownSeconds={60}
      disableAfterSuccess={false}
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
        <form className="content-stack auth-form-shell auth-form-shell-centered" onSubmit={handleSubmit}>
          <Field
            label={t("auth.newPassword")}
            name="newPassword"
            type="password"
            value={form.newPassword}
            onChange={(value) => setForm({ newPassword: value })}
            required
          />

          <div className="auth-form-message-slot">{error ? <InlineError error={error} /> : null}</div>

          <button className="button auth-submit-button" disabled={pending || !token} type="submit">
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
  compact = false,
  cooldownSeconds = 0,
  cooldownHintBuilder,
  disableAfterSuccess = true,
  softSuccessErrorCodes = [],
  softSuccessActions = []
}) {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";
  const { locale } = useLocale();

  return (
    <AuthPanel
      compact={compact}
      eyebrow={eyebrow}
      title={title}
      description={description}
      footer={footer}
    >
      <EmailActionForm
        buttonLabel={buttonLabel}
        cooldownSeconds={cooldownSeconds}
        disableAfterSuccess={disableAfterSuccess}
        endpoint={endpoint}
        initialEmail={initialEmail}
        locale={locale}
        cooldownHintBuilder={cooldownHintBuilder}
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
      <div className="content-stack auth-form-shell auth-form-shell-centered">
        <div className="auth-form-message-slot">
          {effectiveSuccessMessage ? <InlineSuccess message={effectiveSuccessMessage} /> : null}
          {!effectiveSuccessMessage && error ? <InlineError error={error} /> : null}
        </div>

        {shouldShowActionButton ? (
          <button
            className={destructive ? "button button-danger auth-submit-button" : "button auth-submit-button"}
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
  hideEmailField = false,
  locale,
  cooldownSeconds = 0,
  initialCooldownActive = false,
  disableAfterSuccess = true,
  cooldownHintBuilder,
  softSuccessErrorCodes = [],
  softSuccessActions = []
}) {
  const { t } = useLocale();
  const [email, setEmail] = useState(() => initialEmail || readRememberedEmail(endpoint));
  const [fieldError, setFieldError] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [softSuccessMessage, setSoftSuccessMessage] = useState("");
  const [cooldownRemaining, setCooldownRemaining] = useState(() => {
    const storedCooldown = readEmailActionCooldown(
      endpoint,
      initialEmail || readRememberedEmail(endpoint)
    );

    if (storedCooldown > 0) {
      return storedCooldown;
    }

    return initialCooldownActive ? cooldownSeconds : 0;
  });

  useEffect(() => {
    setEmail(initialEmail || readRememberedEmail(endpoint));
  }, [endpoint, initialEmail]);

  useEffect(() => {
    const storedCooldown = readEmailActionCooldown(endpoint, email || initialEmail);

    if (storedCooldown > 0) {
      setCooldownRemaining(storedCooldown);
      return;
    }

    if (initialCooldownActive) {
      setCooldownRemaining(cooldownSeconds);
    }
  }, [cooldownSeconds, email, endpoint, initialCooldownActive, initialEmail]);

  useEffect(() => {
    if (cooldownRemaining <= 0) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setCooldownRemaining((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldownRemaining]);

  function handleEmailChange(nextValue) {
    setEmail(nextValue);
    setFieldError("");
    setError(null);
    setSuccessMessage("");
    setSoftSuccessMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!email.trim()) {
      setFieldError(getRequiredFieldMessage(locale));
      setError(null);
      return;
    }

    setPending(true);
    setFieldError("");
    setError(null);
    setSuccessMessage("");

    try {
      const response = await apiRequest(endpoint, {
        method: "PATCH",
        body: trimFormPayload({ email }),
        locale
      });

      setSuccessMessage(response.message || successFallback);
      if (cooldownSeconds > 0) {
        setCooldownRemaining(cooldownSeconds);
        writeEmailActionCooldown(endpoint, email, cooldownSeconds);
      }
      writeRememberedEmail(endpoint, email);
    } catch (nextError) {
      if (softSuccessErrorCodes.includes(nextError?.errorCode)) {
        setSoftSuccessMessage(nextError.message || successFallback);
        if (cooldownSeconds > 0) {
          setCooldownRemaining(cooldownSeconds);
          writeEmailActionCooldown(endpoint, email, cooldownSeconds);
        }
        writeRememberedEmail(endpoint, email);
      } else if (nextError?.status === 429 && cooldownSeconds > 0) {
        setCooldownRemaining(cooldownSeconds);
        writeEmailActionCooldown(endpoint, email, cooldownSeconds);
        writeRememberedEmail(endpoint, email);
        setError(nextError);
      } else {
        setError(nextError);
      }
    } finally {
      setPending(false);
    }
  }

  const isCompleted = disableAfterSuccess && Boolean(successMessage || softSuccessMessage);
  const isCoolingDown = cooldownRemaining > 0;

  return (
    <form
      className={
        compact
          ? "content-stack auth-inline-form"
          : "content-stack auth-form-shell auth-form-shell-centered"
      }
      onSubmit={handleSubmit}
    >
      {hideEmailField ? null : (
        <Field
          error={fieldError}
          label={t("auth.email")}
          name="email"
          type="email"
          value={email}
          onChange={handleEmailChange}
          required
        />
      )}

      <div className="auth-submit-row">
        <button
          className={compact ? "button auth-submit-button" : "button auth-submit-button"}
          disabled={pending || isCompleted || isCoolingDown}
          type="submit"
        >
          {pending ? t("auth.sending") : buttonLabel}
        </button>
        {cooldownHintBuilder && isCoolingDown ? (
          <span className="auth-cooldown-note">{cooldownHintBuilder(cooldownRemaining)}</span>
        ) : null}
      </div>
      <div className="auth-form-message-slot">
        {error ? <InlineError error={error} /> : null}
        {successMessage ? <InlineSuccess message={successMessage} /> : null}
        {softSuccessMessage ? <InlineSuccess message={softSuccessMessage} /> : null}
      </div>
      {softSuccessMessage ? <ActionLinksRow actions={softSuccessActions} /> : null}
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

function AuthHelperCard({ title, description, actions = [], children }) {
  return (
    <section className="auth-helper-card">
      <h2>{title}</h2>
      <p>{description}</p>
      {children ?? <ActionLinksRow actions={actions} />}
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

function AuthPanel({ eyebrow, title, description, children, footer, postFooter, compact = false }) {
  return (
    <section className="auth-shell">
      <div className={compact ? "auth-panel auth-panel-compact" : "auth-panel"}>
        <h1 className="auth-panel-title">{title}</h1>
        <p>{description}</p>
        {children}
        {footer ? <div className="auth-footer">{footer}</div> : null}
        {postFooter ? <div className="auth-panel-post-footer">{postFooter}</div> : null}
      </div>
    </section>
  );
}

function Field({ label, name, onChange, showRequiredMark = false, error = "", ...inputProps }) {
  return (
    <label className="field">
      <span className="field-label">
        {label}
        {showRequiredMark ? <span className="field-required-mark">*</span> : null}
      </span>
      <input
        {...inputProps}
        className="field-control"
        name={name}
        onChange={(event) => onChange(event.target.value)}
      />
      <span className="field-feedback-slot">
        {error ? <span className="field-feedback field-feedback-error">{error}</span> : null}
      </span>
    </label>
  );
}

function LocaleSelectField({ label, options, onChange, value, showRequiredMark = false, error = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selectedOption = options.find((option) => (option.value ?? option) === value) ?? options[0];

  useEffect(() => {
    function handlePointerDown(event) {
      if (!ref.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="field locale-select-field" ref={ref}>
      <span className="field-label">
        {label}
        {showRequiredMark ? <span className="field-required-mark">*</span> : null}
      </span>
      <button
        aria-expanded={open}
        className="field-control locale-select-trigger"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="field-control-leading locale-select-leading">
          <LocaleFlagIcon locale={value} />
        </span>
        <span className="locale-select-trigger-label">{selectedOption?.label ?? getLocaleLabel(value)}</span>
        <span className="locale-select-trigger-caret">▾</span>
      </button>
      {open ? (
        <div className="locale-select-dropdown">
          {options.map((option) => {
            const optionValue = option.value ?? option;
            const optionLabel = option.label ?? option;

            return (
              <button
                key={optionValue}
                className={
                  optionValue === value
                    ? "locale-select-option locale-select-option-active"
                    : "locale-select-option"
                }
                onClick={() => {
                  onChange(optionValue);
                  setOpen(false);
                }}
                type="button"
              >
                <span className="field-control-leading locale-select-leading">
                  <LocaleFlagIcon locale={optionValue} />
                </span>
                <span>{optionLabel}</span>
              </button>
            );
          })}
        </div>
      ) : null}
      <span className="field-feedback-slot">
        {error ? <span className="field-feedback field-feedback-error">{error}</span> : null}
      </span>
    </div>
  );
}

function SelectField({
  label,
  name,
  options,
  onChange,
  value,
  showRequiredMark = false,
  leadingVisual = null
}) {
  return (
    <label className="field">
      <span className="field-label">
        {label}
        {showRequiredMark ? <span className="field-required-mark">*</span> : null}
      </span>
      <div className={leadingVisual ? "field-control-wrap field-control-wrap-with-icon" : ""}>
        {leadingVisual ? <span className="field-control-leading">{leadingVisual}</span> : null}
        <PrettySelect
          ariaLabel={typeof label === "string" ? label : name}
          className={leadingVisual ? "field-control-with-leading" : ""}
          name={name}
          onChange={onChange}
          options={options}
          value={value}
        />
      </div>
    </label>
  );
}

function InlineError({ error }) {
  return <p className="inline-message inline-message-error">{error?.message}</p>;
}

function InlineSuccess({ message }) {
  return <p className="inline-message inline-message-success">{message}</p>;
}

function buildLoginHelpers(t, error, email) {
  if (!error?.errorCode) {
    return [];
  }

  if (error?.errorCode === "AUTH_ACCOUNT_NOT_VERIFIED") {
    return [
      {
        title: t("auth.accountNeedsConfirmationTitle"),
        description: t("auth.accountNeedsConfirmationDescription"),
        actions: [
          {
            kind: "link",
            label: t("auth.resendConfirmation"),
            to: withEmailQuery("/resend-confirmation", email)
          }
        ]
      }
    ];
  }

  if (error.errorCode === "AUTH_WRONG_PASSWORD") {
    return [
      {
        title: t("auth.wrongPasswordTitle"),
        description: t("auth.wrongPasswordDescription"),
        actions: [
          {
            kind: "link",
            label: t("auth.sendResetLink"),
            to: withEmailQuery("/forgot-password", email)
          }
        ]
      }
    ];
  }

  if (
    error.errorCode === "AUTH_PERMANENTLY_BANNED" ||
    error.errorCode === "AUTH_TEMPORARILY_BANNED"
  ) {
    return [
      {
        title: t("auth.bannedTitle"),
        description: t("auth.bannedDescription"),
        actions: [
          {
            kind: "link",
            label: t("auth.requestDeletionEmail"),
            to: withEmailQuery("/delete-account-request", email)
          }
        ]
      }
    ];
  }

  return [];
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
