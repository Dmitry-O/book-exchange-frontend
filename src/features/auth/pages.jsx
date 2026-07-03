import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useMetadataQuery } from "../../shared/api/hooks";
import { activateDemoEmailSandboxForEmail, apiRequest } from "../../shared/api/http";
import { useAuth } from "../../shared/auth/AuthContext";
import {
  getPasswordFeedback,
  getPasswordRequirements
} from "../../shared/auth/passwordFeedback";
import { useLocale } from "../../shared/i18n/LocaleContext";
import { getLocaleLabel } from "../../shared/i18n/locale";
import {
  clearPostLogoutRedirect,
  hasPostLogoutRedirect
} from "../../shared/auth/session";
import { trimFormPayload } from "../../shared/lib/format";
import { EnvelopeClosedIcon, ShieldIcon } from "../../shared/ui/Icons";
import { PasswordField } from "../../shared/ui/PasswordField";
import { PasswordStrengthFeedback } from "../../shared/ui/PasswordStrengthFeedback";
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
const PASSWORD_REQUIREMENTS_COPY = {
  de: {
    description: "Für mehr Sicherheit empfehlen wir mindestens 12 Zeichen.",
    title: "Passwortanforderungen"
  },
  en: {
    description: "For better security, we recommend at least 12 characters.",
    title: "Password requirements"
  },
  ru: {
    description: "Для надёжности лучше сделать пароль длиннее: от 12 символов.",
    title: "Требования к паролю"
  }
};

const DEMO_DATA_POLICY_COPY = {
  de: {
    error: "Bitte bestätige, dass du im Demo nur Testdaten verwendest.",
    labelStart:
      "Ich verwende in dieser Demo nur Testdaten und habe den",
    labelLink: "Datenschutzhinweis",
    labelEnd: "gelesen."
  },
  en: {
    error: "Confirm that you will use test data in this demo.",
    labelStart:
      "I will use only test data in this demo and have read the",
    labelLink: "data protection notice",
    labelEnd: "."
  },
  ru: {
    error: "Подтвердите, что в demo вы используете только тестовые данные.",
    labelStart:
      "Я использую в этой демо-среде только тестовые данные и ознакомился с",
    labelLink: "политикой защиты данных",
    labelEnd: "."
  }
};

const DEMO_ACCOUNT_PICKER_COPY = {
  de: {
    hint: "Wähle ein vorbereitetes Testkonto oder gib eigene Demo-Zugangsdaten ein.",
    label: "Demo-Konto",
    placeholder: "Demo-Konto auswählen"
  },
  en: {
    hint: "Choose a prepared test account or enter your own demo credentials.",
    label: "Demo account",
    placeholder: "Choose a demo account"
  },
  ru: {
    hint: "Выберите готовый тестовый аккаунт или введите свои demo-данные.",
    label: "Демо-аккаунт",
    placeholder: "Выберите демо-аккаунт"
  }
};

function getRequiredFieldMessage(locale) {
  if (locale === "ru") {
    return "Заполните это поле.";
  }

  if (locale === "de") {
    return "Bitte füllen Sie dieses Feld aus.";
  }

  return "Please fill in this field.";
}

function getInvalidEmailMessage(locale) {
  if (locale === "ru") {
    return "Введите корректный адрес электронной почты.";
  }

  if (locale === "de") {
    return "Gib eine gültige E-Mail-Adresse ein.";
  }

  return "Enter a valid email address.";
}

function isValidEmailAddress(value) {
  const email = value?.trim() ?? "";

  if (!email || email.length > 254 || /\s/.test(email)) {
    return false;
  }

  const separatorIndex = email.lastIndexOf("@");

  if (separatorIndex <= 0 || separatorIndex === email.length - 1) {
    return false;
  }

  const localPart = email.slice(0, separatorIndex);
  const domain = email.slice(separatorIndex + 1);

  if (
    localPart.length > 64 ||
    localPart.startsWith(".") ||
    localPart.endsWith(".") ||
    localPart.includes("..")
  ) {
    return false;
  }

  return (
    /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(localPart) &&
    /^(?=.{1,253}$)(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/.test(
      domain
    )
  );
}

function getPasswordsMatchMessage(locale) {
  if (locale === "ru") {
    return "Пароли совпадают";
  }

  if (locale === "de") {
    return "Die Passwörter stimmen überein";
  }

  return "The passwords match";
}

function buildMissingFieldErrors(locale, fields) {
  const message = getRequiredFieldMessage(locale);

  return fields.reduce((accumulator, field) => {
    accumulator[field] = message;
    return accumulator;
  }, {});
}

function readEmailActionCooldown(actionKey) {
  if (typeof window === "undefined") {
    return 0;
  }

  if (!actionKey) {
    return 0;
  }

  try {
    const raw = window.localStorage.getItem(EMAIL_ACTION_COOLDOWNS_STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) : {};
    const expiresAt = Number(stored[actionKey]);
    const remaining = Math.ceil((expiresAt - Date.now()) / 1000);

    if (remaining > 0) {
      return remaining;
    }

    delete stored[actionKey];
    window.localStorage.setItem(EMAIL_ACTION_COOLDOWNS_STORAGE_KEY, JSON.stringify(stored));
    return 0;
  } catch {
    return 0;
  }
}

function writeEmailActionCooldown(actionKey, cooldownSeconds) {
  if (typeof window === "undefined") {
    return;
  }

  if (!actionKey) {
    return;
  }

  try {
    const raw = window.localStorage.getItem(EMAIL_ACTION_COOLDOWNS_STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) : {};

    if (cooldownSeconds > 0) {
      stored[actionKey] = Date.now() + Math.ceil(cooldownSeconds) * 1000;
    } else {
      delete stored[actionKey];
    }

    window.localStorage.setItem(EMAIL_ACTION_COOLDOWNS_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Ignore localStorage issues and keep the in-memory cooldown.
  }
}

function clearEmailActionCooldown(actionKey) {
  writeEmailActionCooldown(actionKey, 0);
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
  const metadataQuery = useMetadataQuery();
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
  const demoAccountsEnabled = metadataQuery.isSuccess;
  const demoAccountsQuery = useQuery({
    queryKey: ["demo-accounts"],
    enabled: demoAccountsEnabled,
    staleTime: 60_000,
    retry: false,
    queryFn: async () => {
      const response = await apiRequest("/demo/accounts", { locale });

      return Array.isArray(response.data) ? response.data : [];
    }
  });
  const demoAccounts =
    demoAccountsQuery.error || !Array.isArray(demoAccountsQuery.data)
      ? []
      : demoAccountsQuery.data;
  const demoAccountPickerCopy = DEMO_ACCOUNT_PICKER_COPY[locale] ?? DEMO_ACCOUNT_PICKER_COPY.en;
  const demoAccountOptions = [
    { label: demoAccountPickerCopy.placeholder, value: "" },
    ...demoAccounts.map((account) => ({
      label: formatDemoAccountLabel(account),
      value: account.email
    }))
  ];
  const showDemoAccountPicker = demoAccounts.length > 0;

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

  function handleDemoAccountChange(email) {
    const selectedAccount = demoAccounts.find((account) => account.email === email);

    if (!selectedAccount) {
      setForm({ email: "", password: "" });
      setFieldErrors({ email: "", password: "" });
      setError(null);
      return;
    }

    setForm({
      email: selectedAccount.email ?? "",
      password: selectedAccount.password ?? ""
    });
    setFieldErrors({ email: "", password: "" });
    setError(null);
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
        {showDemoAccountPicker ? (
          <label className="field auth-demo-account-picker">
            <span>{demoAccountPickerCopy.label}</span>
            <PrettySelect
              ariaLabel={demoAccountPickerCopy.label}
              onChange={handleDemoAccountChange}
              options={demoAccountOptions}
              value={demoAccounts.some((account) => account.email === form.email) ? form.email : ""}
            />
            <span className="field-hint">{demoAccountPickerCopy.hint}</span>
          </label>
        ) : null}
        <Field
          error={fieldErrors.email}
          label={t("auth.email")}
          name="email"
          type="email"
          value={form.email}
          onBlur={() => {
            if (form.email.trim() && !isValidEmailAddress(form.email)) {
              setFieldErrors((current) => ({
                ...current,
                email: getInvalidEmailMessage(locale)
              }));
            }
          }}
          onChange={(value) => {
            setForm((current) => ({ ...current, email: value }));
            setFieldErrors((current) => ({ ...current, email: "" }));
            setError(null);
          }}
          required
        />
        <PasswordField
          error={fieldErrors.password}
          label={t("auth.password")}
          name="password"
          value={form.password}
          onChange={(value) => {
            setForm((current) => ({ ...current, password: value }));
            setFieldErrors((current) => ({ ...current, password: "" }));
            setError(null);
          }}
          revealLabel={t("auth.holdToShowPassword")}
          required
        />
        <button className="button auth-submit-button" disabled={pending} type="submit">
          {pending ? t("auth.signingIn") : t("common.signIn")}
        </button>
        <div className="auth-form-message-slot">{error ? <InlineError error={error} /> : null}</div>
      </form>
    </AuthPanel>
  );
}

function RegisterSuccessHelper({
  email,
  locale,
  title,
  description,
  buttonLabel,
  successFallback
}) {
  return (
    <AuthHelperCard description={description} title={title}>
      <EmailActionForm
        alwaysShowInboxLink
        buttonLabel={buttonLabel}
        compact
        cooldownKey="register-success-resend-confirmation"
        cooldownHintBuilder={(seconds) => getRegisterCooldownText(locale, seconds)}
        cooldownSeconds={60}
        disableAfterSuccess={false}
        endpoint="/auth/resend_confirmation_email"
        hideEmailField
        initialCooldownActive
        initialEmail={email}
        locale={locale}
        showSuccessMessage={false}
        successFallback={successFallback}
      />
    </AuthHelperCard>
  );
}

export function RegisterPage() {
  const metadataQuery = useMetadataQuery();
  const { locale, locales, setLocale, t } = useLocale();
  const [form, setForm] = useState({
    demoDataPolicyAccepted: false,
    email: "",
    password: "",
    nickname: "",
    locale
  });
  const [fieldErrors, setFieldErrors] = useState({
    demoDataPolicyAccepted: "",
    email: "",
    nickname: "",
    password: "",
    locale: ""
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const passwordFeedback = getPasswordFeedback(form.locale || locale, "", form.password);
  const passwordRequirements = getPasswordRequirements(form.locale || locale, form.password);

  useEffect(() => {
    const locale = metadataQuery.data?.locales?.[0];

    if (locale) {
      setForm((current) => ({ ...current, locale: current.locale || locale }));
    }
  }, [metadataQuery.data]);

  useEffect(() => {
    setForm((current) =>
      current.locale === locale ? current : { ...current, locale }
    );
    setFieldErrors((current) => ({ ...current, locale: "" }));
  }, [locale]);

  useEffect(() => {
    if (!fieldErrors.demoDataPolicyAccepted) {
      return;
    }

    const nextError = (DEMO_DATA_POLICY_COPY[locale] ?? DEMO_DATA_POLICY_COPY.en).error;
    setFieldErrors((current) =>
      current.demoDataPolicyAccepted === nextError
        ? current
        : { ...current, demoDataPolicyAccepted: nextError }
    );
  }, [fieldErrors.demoDataPolicyAccepted, locale]);

  async function handleSubmit(event) {
    event.preventDefault();
    const missingFields = [];

    if (!form.email.trim()) {
      missingFields.push("email");
    } else if (!isValidEmailAddress(form.email)) {
      setFieldErrors((current) => ({
        ...current,
        email: getInvalidEmailMessage(locale)
      }));
      setError(null);
      setSuccessMessage("");
      return;
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

    if (!form.demoDataPolicyAccepted) {
      setFieldErrors((current) => ({
        ...current,
        demoDataPolicyAccepted:
          (DEMO_DATA_POLICY_COPY[locale] ?? DEMO_DATA_POLICY_COPY.en).error
      }));
      setError(null);
      setSuccessMessage("");
      return;
    }

    setPending(true);
    setError(null);
    setSuccessMessage("");
    setFieldErrors({
      demoDataPolicyAccepted: "",
      email: "",
      nickname: "",
      password: "",
      locale: ""
    });

    try {
      await activateDemoEmailSandboxForEmail(form.email, form.locale);
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
      wide
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
        <ErrorBlock error={metadataQuery.error} title={t("auth.registrationDataError")} />
      ) : null}

      <div className="auth-register-workspace">
      <form className="content-stack auth-form-shell auth-form-shell-centered auth-form-shell-narrow auth-primary-form" onSubmit={handleSubmit} noValidate>
        <Field
          error={fieldErrors.email}
          label={t("auth.email")}
          name="email"
          type="email"
          value={form.email}
          onBlur={() => {
            if (form.email.trim() && !isValidEmailAddress(form.email)) {
              setFieldErrors((current) => ({
                ...current,
                email: getInvalidEmailMessage(locale)
              }));
            }
          }}
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
        <div className="security-password-field-stack">
          <PasswordField
            error={fieldErrors.password}
            label={t("auth.password")}
            name="password"
            value={form.password}
            onChange={(value) => {
              setForm((current) => ({ ...current, password: value }));
              setFieldErrors((current) => ({ ...current, password: "" }));
              setError(null);
            }}
            revealLabel={t("auth.holdToShowPassword")}
            required
            showRequiredMark
          />
          <div className="password-strength-slot">
            <PasswordStrengthFeedback feedback={passwordFeedback} />
          </div>
        </div>
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
        <DemoDataPolicyCheckbox
          checked={form.demoDataPolicyAccepted}
          error={fieldErrors.demoDataPolicyAccepted}
          locale={locale}
          onChange={(checked) => {
            setForm((current) => ({ ...current, demoDataPolicyAccepted: checked }));
            setFieldErrors((current) => ({ ...current, demoDataPolicyAccepted: "" }));
            setError(null);
          }}
        />
        <button
          className="button auth-submit-button"
          disabled={
            pending ||
            Boolean(successMessage) ||
            (Boolean(form.password) && !passwordFeedback?.canSubmit)
          }
          type="submit"
        >
          {pending ? t("auth.creatingAccount") : t("auth.createAccount")}
        </button>
        <div className="auth-form-message-slot">
          {successMessage ? <InlineSuccess message={successMessage} /> : null}
          {!successMessage && error ? <InlineError error={error} /> : null}
        </div>
      </form>
        <aside className="auth-register-aside">
          <PasswordRequirementsCard
            locale={form.locale || locale}
            requirements={passwordRequirements}
          />
          {successMessage ? (
            <RegisterSuccessHelper
              buttonLabel={t("auth.resendConfirmation")}
              description={t("auth.nextStepsDescription")}
              email={form.email}
              locale={form.locale}
              successFallback="A new confirmation email has been sent."
              title={t("auth.nextStepsTitle")}
            />
          ) : error?.errorCode === "AUTH_ACCOUNT_NOT_VERIFIED" ? (
            <InlineEmailActionCard
              buttonLabel={t("auth.resendConfirmation")}
              cooldownKey="register-error-resend-confirmation"
              cooldownHintBuilder={(seconds) => getRegisterCooldownText(form.locale, seconds)}
              cooldownSeconds={60}
              description={t("auth.accountNeedsConfirmationDescription")}
              disableAfterSuccess={false}
              endpoint="/auth/resend_confirmation_email"
              hideEmailField
              initialEmail={form.email}
              successFallback="A new confirmation email has been sent."
              title={t("auth.accountNeedsConfirmationTitle")}
            />
          ) : null}
        </aside>
      </div>
    </AuthPanel>
  );
}

export function ForgotPasswordPage() {
  const { locale, t } = useLocale();

  return (
    <EmailActionPage
      compact
      cooldownKey="forgot-password-page"
      eyebrow={t("auth.resetEyebrow")}
      title={t("auth.forgotPasswordTitle")}
      description={t("auth.forgotPasswordDescription")}
      endpoint="/auth/forgot_password"
      buttonLabel={t("auth.sendResetLink")}
      cooldownHintBuilder={(seconds) => buildResetCooldownNote(locale, seconds)}
      cooldownSeconds={60}
      disableAfterSuccess={false}
      offerConfirmationOnUnverified
      successFallback="If the account exists, password reset instructions have been sent."
    />
  );
}

export function ResendConfirmationPage() {
  const { locale, t } = useLocale();

  return (
    <EmailActionPage
      cooldownKey="resend-confirmation-page"
      eyebrow={t("auth.verifyEyebrow")}
      title={t("auth.resendTitle")}
      description={t("auth.resendDescription")}
      endpoint="/auth/resend_confirmation_email"
      buttonLabel={t("auth.resendConfirmation")}
      cooldownHintBuilder={(seconds) => getRegisterCooldownText(locale, seconds)}
      cooldownSeconds={60}
      disableAfterSuccess={false}
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
      cooldownKey="delete-account-request-page"
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
  const { locale, t } = useLocale();

  return (
    <TokenActionPage
      actionLabel={t("auth.verifyAction")}
      autoRun
      description={null}
      endpointBuilder={(token) => `/auth/verify?token=${encodeURIComponent(token)}`}
      eyebrow={t("auth.verifyEyebrow")}
      method="GET"
      validationTokenType="CONFIRM_EMAIL"
      recoveryAction={{
        buttonLabel: t("auth.sendNewConfirmation"),
        cooldownKey: "verify-email-recovery",
        cooldownHintBuilder: (seconds) => getRegisterCooldownText(locale, seconds),
        cooldownSeconds: 60,
        disableAfterSuccess: false,
        endpoint: "/auth/resend_confirmation_email",
        successFallback: "A new confirmation email has been sent.",
        softSuccessActions: [{ kind: "link", label: t("auth.goToLogin"), to: "/login" }],
        softSuccessErrorCodes: ["AUTH_ACCOUNT_ALREADY_VERIFIED"],
        title: t("auth.freshConfirmationTitle"),
        description: t("auth.freshConfirmationDescription")
      }}
      softSuccessErrorCodes={["AUTH_ACCOUNT_ALREADY_VERIFIED"]}
      successActions={[
        { kind: "link", label: t("auth.signInAccount"), to: "/login" },
        { kind: "link", label: t("common.goHome"), to: "/", secondary: true }
      ]}
      successFallback={t("auth.emailConfirmed")}
      title={t("auth.verifyTitle")}
    />
  );
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { locale, t } = useLocale();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [fieldErrors, setFieldErrors] = useState({ newPassword: "", confirmPassword: "" });
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const tokenValidation = useTokenValidation(token, "RESET_PASSWORD");

  const effectiveError = tokenValidation.error ?? error;
  const canRecover = !token || isRecoverableTokenError(effectiveError);
  const passwordFeedback = getPasswordFeedback(locale, "", form.newPassword);
  const confirmPasswordError =
    confirmPasswordTouched &&
    form.confirmPassword &&
    form.newPassword !== form.confirmPassword
      ? t("auth.passwordMismatch")
      : fieldErrors.confirmPassword;
  const canSubmitPassword = Boolean(
    tokenValidation.isValid &&
      form.newPassword &&
      form.confirmPassword &&
      form.newPassword === form.confirmPassword &&
      passwordFeedback?.canSubmit &&
      !pending
  );

  async function handleSubmit(event) {
    event.preventDefault();

    if (!token) {
      setError(new Error("Reset token is missing from the URL."));
      return;
    }

    const missingFields = [];

    if (!form.newPassword.trim()) {
      missingFields.push("newPassword");
    }

    if (!form.confirmPassword.trim()) {
      missingFields.push("confirmPassword");
    }

    if (missingFields.length) {
      setFieldErrors(buildMissingFieldErrors(locale, missingFields));
      setConfirmPasswordTouched(true);
      setError(null);
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setFieldErrors({
        newPassword: "",
        confirmPassword: t("auth.passwordMismatch")
      });
      setConfirmPasswordTouched(true);
      setError(null);
      return;
    }

    setPending(true);
    setError(null);
    setSuccessMessage("");
    setFieldErrors({ newPassword: "", confirmPassword: "" });

    try {
      const response = await apiRequest(`/auth/reset_password?token=${encodeURIComponent(token)}`, {
        method: "PATCH",
        body: trimFormPayload({ newPassword: form.newPassword })
      });

      setSuccessMessage(response.message || "Your password has been changed.");
      setForm({ newPassword: "", confirmPassword: "" });
      setConfirmPasswordTouched(false);
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
      description={successMessage ? null : t("auth.resetDescription")}
    >
      {!token ? (
        <InlineError error={{ message: "Reset token was not found in the URL." }} />
      ) : null}

      {tokenValidation.isPending ? <LoadingBlock /> : null}
      {tokenValidation.error ? <InlineError error={tokenValidation.error} /> : null}

      {successMessage ? (
        <div className="content-stack auth-token-success">
          <InlineSuccess message={successMessage} />
          <div className="auth-actions-row">
            <button className="button" onClick={() => navigate("/login")} type="button">
              {t("auth.signInAccount")}
            </button>
            <Link className="button button-secondary" to="/">
              {t("common.goHome")}
            </Link>
          </div>
        </div>
      ) : tokenValidation.isValid ? (
        <form className="content-stack auth-form-shell auth-form-shell-centered auth-reset-form" onSubmit={handleSubmit}>
          <div className="security-password-field-stack">
            <PasswordField
              error={fieldErrors.newPassword}
              label={t("auth.newPassword")}
              name="newPassword"
              value={form.newPassword}
              onChange={(value) => {
                setForm((current) => ({ ...current, newPassword: value }));
                setFieldErrors((current) => ({ ...current, newPassword: "", confirmPassword: "" }));
                setError(null);
              }}
              revealLabel={t("auth.holdToShowPassword")}
              required
            />
            <div className="password-strength-slot">
              <PasswordStrengthFeedback feedback={passwordFeedback} />
            </div>
          </div>
          <PasswordField
            label={t("auth.confirmPassword")}
            name="confirmPassword"
            value={form.confirmPassword}
            onBlur={() => setConfirmPasswordTouched(true)}
            onChange={(value) => {
              setForm((current) => ({ ...current, confirmPassword: value }));
              setFieldErrors((current) => ({ ...current, confirmPassword: "" }));
              setError(null);
            }}
            revealLabel={t("auth.holdToShowPassword")}
            required
          />
          <div className="password-match-slot">
            {confirmPasswordError ? (
              <p className="password-match-message password-match-message-error">
                {confirmPasswordError}
              </p>
            ) : form.confirmPassword && form.newPassword === form.confirmPassword ? (
              <p className="password-match-message">
                <span aria-hidden="true">✓</span>
                {getPasswordsMatchMessage(locale)}
              </p>
            ) : null}
          </div>

          <button className="button auth-submit-button" disabled={!canSubmitPassword} type="submit">
            {pending ? t("auth.resettingPassword") : t("auth.resetPassword")}
          </button>
          <div className="auth-form-message-slot">{error ? <InlineError error={error} /> : null}</div>
        </form>
      ) : null}

      {canRecover && !successMessage ? (
        <InlineEmailActionCard
          buttonLabel={t("auth.sendNewReset")}
          cooldownKey="reset-password-recovery"
          cooldownHintBuilder={(seconds) => buildResetCooldownNote(locale, seconds)}
          cooldownSeconds={60}
          description={t("auth.requestFreshResetDescription")}
          disableAfterSuccess={false}
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
  const { locale, t } = useLocale();

  return (
    <TokenActionPage
      actionLabel={t("auth.deleteAction")}
      description={t("auth.deleteDescription")}
      destructive
      endpointBuilder={(token) => `/auth/delete_account?token=${encodeURIComponent(token)}`}
      eyebrow={t("auth.deleteEyebrow")}
      method="PATCH"
      validationTokenType="DELETE_ACCOUNT"
      onSuccess={() => clearSession()}
      recoveryAction={{
        buttonLabel: t("auth.sendNewDeletion"),
        cooldownKey: "delete-account-confirm-recovery",
        cooldownHintBuilder: (seconds) => buildDeleteCooldownNote(locale, seconds),
        cooldownSeconds: 60,
        disableAfterSuccess: false,
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
  cooldownKey,
  buttonLabel,
  successFallback,
  footer,
  compact = false,
  cooldownSeconds = 0,
  cooldownHintBuilder,
  disableAfterSuccess = true,
  offerConfirmationOnUnverified = false,
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
        cooldownKey={cooldownKey}
        cooldownSeconds={cooldownSeconds}
        disableAfterSuccess={disableAfterSuccess}
        endpoint={endpoint}
        initialEmail={initialEmail}
        locale={locale}
        cooldownHintBuilder={cooldownHintBuilder}
        offerConfirmationOnUnverified={offerConfirmationOnUnverified}
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
  validationTokenType = null,
  onSuccess
}) {
  const [searchParams] = useSearchParams();
  const { t } = useLocale();
  const token = searchParams.get("token") ?? "";
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const hasAutoRun = useRef(false);
  const tokenValidation = useTokenValidation(token, validationTokenType);

  const hasToken = Boolean(token);
  const effectiveError = tokenValidation.error ?? error;
  const isSoftSuccess = Boolean(
    effectiveError?.errorCode && softSuccessErrorCodes.includes(effectiveError.errorCode)
  );
  const effectiveSuccessMessage = successMessage || (isSoftSuccess ? effectiveError?.message : "");
  const shouldOfferRecovery =
    recoveryAction &&
    !effectiveSuccessMessage &&
    (!hasToken || isRecoverableTokenError(effectiveError));
  const shouldShowActionButton =
    !effectiveSuccessMessage &&
    !autoRun &&
    tokenValidation.isValid;

  useEffect(() => {
    if (
      !autoRun ||
      !hasToken ||
      !tokenValidation.isValid ||
      hasAutoRun.current ||
      effectiveSuccessMessage
    ) {
      return;
    }

    hasAutoRun.current = true;
    void handleRequest();
  }, [autoRun, effectiveSuccessMessage, hasToken, tokenValidation.isValid]);

  async function handleRequest() {
    if (!token) {
      setError(new Error("Token is missing from the URL."));
      return;
    }

    if (!tokenValidation.isValid) {
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
    <AuthPanel
      eyebrow={eyebrow}
      title={title}
      description={effectiveSuccessMessage ? null : description}
    >
      <div className="content-stack auth-form-shell auth-form-shell-centered auth-token-action">
        {tokenValidation.isPending || pending ? <LoadingBlock /> : null}

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

        <div className="auth-form-message-slot">
          {effectiveSuccessMessage ? <InlineSuccess message={effectiveSuccessMessage} /> : null}
          {!effectiveSuccessMessage && effectiveError ? <InlineError error={effectiveError} /> : null}
        </div>

        {effectiveSuccessMessage ? <ActionLinksRow actions={successActions} /> : null}

        {shouldOfferRecovery ? (
          <InlineEmailActionCard
            buttonLabel={recoveryAction.buttonLabel ?? "Send email"}
            cooldownKey={recoveryAction.cooldownKey}
            cooldownHintBuilder={recoveryAction.cooldownHintBuilder}
            cooldownSeconds={recoveryAction.cooldownSeconds}
            description={recoveryAction.description}
            disableAfterSuccess={recoveryAction.disableAfterSuccess}
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
  cooldownKey,
  buttonLabel,
  successFallback,
  initialEmail = "",
  alwaysShowInboxLink = false,
  compact = false,
  hideEmailField = false,
  locale,
  cooldownSeconds = 0,
  initialCooldownActive = false,
  disableAfterSuccess = true,
  cooldownHintBuilder,
  offerConfirmationOnUnverified = false,
  showSuccessMessage = true,
  softSuccessErrorCodes = [],
  softSuccessActions = []
}) {
  const { t } = useLocale();
  const metadataQuery = useMetadataQuery();
  const demoEmailSandboxEnabled =
    metadataQuery.data?.features?.demoEmailSandboxEnabled === true;
  const actionCooldownKey = cooldownKey || endpoint;
  const [email, setEmail] = useState(() => initialEmail || readRememberedEmail(endpoint));
  const [fieldError, setFieldError] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [softSuccessMessage, setSoftSuccessMessage] = useState("");
  const [softSuccessCode, setSoftSuccessCode] = useState("");
  const [cooldownRemaining, setCooldownRemaining] = useState(() => {
    const storedCooldown = readEmailActionCooldown(actionCooldownKey);

    if (storedCooldown > 0) {
      return storedCooldown;
    }

    return initialCooldownActive ? cooldownSeconds : 0;
  });

  useEffect(() => {
    setEmail(initialEmail || readRememberedEmail(endpoint));
  }, [endpoint, initialEmail]);

  useEffect(() => {
    const storedCooldown = readEmailActionCooldown(actionCooldownKey);

    if (storedCooldown > 0) {
      setCooldownRemaining(storedCooldown);
      return;
    }

    if (initialCooldownActive) {
      setCooldownRemaining(cooldownSeconds);
      writeEmailActionCooldown(actionCooldownKey, cooldownSeconds);
    }
  }, [actionCooldownKey, cooldownSeconds, initialCooldownActive]);

  useEffect(() => {
    if (cooldownRemaining <= 0) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setCooldownRemaining(readEmailActionCooldown(actionCooldownKey));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [actionCooldownKey, cooldownRemaining]);

  function handleEmailChange(nextValue) {
    setEmail(nextValue);
    setFieldError("");
    setError(null);
    setSuccessMessage("");
    setSoftSuccessMessage("");
    setSoftSuccessCode("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!email.trim()) {
      setFieldError(getRequiredFieldMessage(locale));
      setError(null);
      return;
    }

    if (!isValidEmailAddress(email)) {
      setFieldError(getInvalidEmailMessage(locale));
      setError(null);
      return;
    }

    setPending(true);
    setFieldError("");
    setError(null);
    setSuccessMessage("");
    setSoftSuccessMessage("");
    setSoftSuccessCode("");

    if (cooldownSeconds > 0) {
      setCooldownRemaining(cooldownSeconds);
      writeEmailActionCooldown(actionCooldownKey, cooldownSeconds);
    }

    try {
      await activateDemoEmailSandboxForEmail(email, locale);
      const response = await apiRequest(endpoint, {
        method: "PATCH",
        body: trimFormPayload({ email }),
        locale
      });

      setSuccessMessage(response.message || successFallback);
      writeRememberedEmail(endpoint, email);
    } catch (nextError) {
      const emailError = interpolateEmailError(nextError, email);

      if (softSuccessErrorCodes.includes(emailError?.errorCode)) {
        setSoftSuccessMessage(emailError.message || successFallback);
        setSoftSuccessCode(emailError.errorCode ?? "");
        if (emailError.errorCode === "AUTH_ACCOUNT_ALREADY_VERIFIED") {
          setCooldownRemaining(0);
          clearEmailActionCooldown(actionCooldownKey);
        } else if (cooldownSeconds > 0) {
          setCooldownRemaining((current) => current || cooldownSeconds);
        }
        writeRememberedEmail(endpoint, email);
      } else if (emailError?.status === 429 && cooldownSeconds > 0) {
        setCooldownRemaining((current) => current || cooldownSeconds);
        writeRememberedEmail(endpoint, email);
        setError(emailError);
      } else {
        setError(emailError);
      }
    } finally {
      setPending(false);
    }
  }

  const isPermanentSoftSuccess = softSuccessCode === "AUTH_ACCOUNT_ALREADY_VERIFIED";
  const isCompleted =
    isPermanentSoftSuccess || (disableAfterSuccess && Boolean(successMessage || softSuccessMessage));
  const isCoolingDown = cooldownRemaining > 0;
  const emailSuccessActions =
    alwaysShowInboxLink || successMessage || softSuccessMessage
      ? isPermanentSoftSuccess
        ? softSuccessActions
        : [
            ...(demoEmailSandboxEnabled
              ? [{ kind: "link", label: t("auth.openDemoInbox"), to: "/demo-inbox", secondary: true }]
              : []),
            ...(softSuccessMessage ? softSuccessActions : [])
          ]
      : [];
  const shouldOfferConfirmation =
    offerConfirmationOnUnverified && error?.errorCode === "AUTH_ACCOUNT_NOT_VERIFIED";

  return (
    <>
      <form
        className={
          compact
            ? "content-stack auth-inline-form auth-email-action-form"
            : "content-stack auth-form-shell auth-form-shell-centered auth-email-action-form"
        }
        noValidate
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
            className="button auth-submit-button"
            disabled={pending || isCompleted || isCoolingDown}
            type="submit"
          >
            {pending ? t("auth.sending") : buttonLabel}
          </button>
          {cooldownHintBuilder && isCoolingDown && !isPermanentSoftSuccess ? (
            <span className="auth-cooldown-note">{cooldownHintBuilder(cooldownRemaining)}</span>
          ) : null}
        </div>
        <div className="auth-form-message-slot">
          {error ? <InlineError error={error} /> : null}
          {showSuccessMessage && successMessage ? <InlineSuccess message={successMessage} /> : null}
          {showSuccessMessage && softSuccessMessage ? <InlineSuccess message={softSuccessMessage} /> : null}
        </div>
        {emailSuccessActions.length ? <ActionLinksRow actions={emailSuccessActions} /> : null}
      </form>

      {shouldOfferConfirmation ? (
        <InlineEmailActionCard
          buttonLabel={t("auth.resendConfirmation")}
          cooldownKey={`${actionCooldownKey}:confirmation-recovery`}
          cooldownHintBuilder={(seconds) => getRegisterCooldownText(locale, seconds)}
          cooldownSeconds={60}
          description={t("auth.accountNeedsConfirmationDescription")}
          disableAfterSuccess={false}
          endpoint="/auth/resend_confirmation_email"
          hideEmailField
          initialEmail={email}
          successFallback="A new confirmation email has been sent."
          title={t("auth.accountNeedsConfirmationTitle")}
        />
      ) : null}
    </>
  );
}

function InlineEmailActionCard({
  title,
  description,
  endpoint,
  cooldownKey,
  buttonLabel,
  successFallback,
  cooldownHintBuilder,
  cooldownSeconds = 0,
  disableAfterSuccess = true,
  initialEmail = "",
  hideEmailField = false,
  softSuccessErrorCodes = [],
  softSuccessActions = []
}) {
  const { locale } = useLocale();

  return (
    <section className="auth-helper-card auth-helper-card-soft">
      <h2>{title}</h2>
      <p>{description}</p>
      <EmailActionForm
        buttonLabel={buttonLabel}
        compact
        cooldownKey={cooldownKey}
        cooldownHintBuilder={cooldownHintBuilder}
        cooldownSeconds={cooldownSeconds}
        disableAfterSuccess={disableAfterSuccess}
        endpoint={endpoint}
        hideEmailField={hideEmailField}
        initialEmail={initialEmail}
        locale={locale}
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

function formatDemoAccountLabel(account) {
  return account.email || account.label || account.nickname || "";
}

function DemoDataPolicyCheckbox({ checked, error = "", locale, onChange }) {
  const copy = DEMO_DATA_POLICY_COPY[locale] ?? DEMO_DATA_POLICY_COPY.en;
  const labelEndPrefix = copy.labelEnd.startsWith(".") ? "" : " ";

  return (
    <label className="field auth-demo-policy-field">
      <span className="auth-demo-policy-control">
        <input
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          type="checkbox"
        />
        <span>
          {copy.labelStart}{" "}
          <Link onClick={(event) => event.stopPropagation()} to="/data-notice">
            {copy.labelLink}
          </Link>
          {labelEndPrefix}
          {copy.labelEnd}
        </span>
      </span>
      <span className="field-feedback-slot">
        {error ? <span className="field-feedback field-feedback-error">{error}</span> : null}
      </span>
    </label>
  );
}

function PasswordRequirementsCard({ locale, requirements }) {
  const copy = PASSWORD_REQUIREMENTS_COPY[locale] ?? PASSWORD_REQUIREMENTS_COPY.en;

  return (
    <aside className="auth-password-requirements profile-password-requirements">
      <h3>
        <ShieldIcon />
        {copy.title}
      </h3>
      <p>{copy.description}</p>
      <ul>
        {requirements.map((requirement) => (
          <li
            className={requirement.met ? "password-requirement-met" : ""}
            key={requirement.key}
          >
            <span aria-hidden="true">{requirement.met ? "✓" : "○"}</span>
            {requirement.label}
          </li>
        ))}
      </ul>
    </aside>
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
            {action.to === "/demo-inbox" ? <EnvelopeClosedIcon /> : null}
            <span>{action.label}</span>
          </Link>
        )
      )}
    </div>
  );
}

function AuthPanel({ eyebrow, title, description, children, footer, postFooter, compact = false, wide = false }) {
  return (
    <section className={wide ? "auth-shell auth-shell-wide" : "auth-shell"}>
      <div className={compact ? "auth-panel auth-panel-compact" : "auth-panel"}>
        <h1 className="auth-panel-title">{title}</h1>
        {description ? <p>{description}</p> : null}
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
  if (!error?.errorCode && !error?.message) {
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

  if (isWrongCredentialsError(error)) {
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

const WRONG_CREDENTIALS_ERROR_CODES = new Set([
  "AUTH_INVALID_CREDENTIALS",
  "AUTH_WRONG_PASSWORD"
]);

const WRONG_CREDENTIALS_MESSAGE_PARTS = [
  "incorrect email address or password",
  "e-mail-adresse oder passwort ist falsch",
  "неверный адрес электронной почты или пароль",
  "неверный адрес эл. почты или пароль"
];

function isWrongCredentialsError(error) {
  if (!error) {
    return false;
  }

  if (WRONG_CREDENTIALS_ERROR_CODES.has(error.errorCode)) {
    return true;
  }

  const message = String(error.message ?? "")
    .trim()
    .toLowerCase();

  return WRONG_CREDENTIALS_MESSAGE_PARTS.some((part) => message.includes(part));
}

function isRecoverableTokenError(error) {
  return Boolean(error?.errorCode && TOKEN_RECOVERY_CODES.has(error.errorCode));
}

function useTokenValidation(token, tokenType) {
  const [state, setState] = useState({
    error: null,
    isPending: Boolean(token && tokenType),
    isValid: !tokenType
  });

  useEffect(() => {
    if (!tokenType) {
      setState({ error: null, isPending: false, isValid: true });
      return undefined;
    }

    if (!token) {
      setState({ error: null, isPending: false, isValid: false });
      return undefined;
    }

    const controller = new AbortController();
    setState({ error: null, isPending: true, isValid: false });

    apiRequest(
      `/auth/validate_token?token=${encodeURIComponent(token)}&tokenType=${encodeURIComponent(tokenType)}`,
      { signal: controller.signal }
    )
      .then(() => {
        setState({ error: null, isPending: false, isValid: true });
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setState({ error, isPending: false, isValid: false });
        }
      });

    return () => controller.abort();
  }, [token, tokenType]);

  return state;
}

function withEmailQuery(path, email) {
  const trimmedEmail = email?.trim();

  if (!trimmedEmail) {
    return path;
  }

  return `${path}?email=${encodeURIComponent(trimmedEmail)}`;
}

function interpolateEmailError(error, email) {
  if (!error?.message || !email) {
    return error;
  }

  return {
    ...error,
    message: error.message.replaceAll("{0}", email.trim())
  };
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
