import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/auth/AuthContext";
import { useLocale } from "../../shared/i18n/LocaleContext";

const passwordHintText = {
  de:
    "8 bis 64 Zeichen, mindestens ein Kleinbuchstabe, ein Grossbuchstabe, eine Zahl, ein Sonderzeichen und keine Leerzeichen.",
  en:
    "Use 8 to 64 characters with at least one lowercase letter, one uppercase letter, one number, one symbol, and no spaces.",
  ru:
    "От 8 до 64 символов, минимум одна строчная буква, одна заглавная, одна цифра, один спецсимвол и без пробелов."
};

const passwordFeedbackText = {
  de: {
    invalid: "Das neue Passwort erfuellt die Anforderungen noch nicht.",
    medium: "Passwort ist in Ordnung, koennte aber noch staerker sein.",
    same: "Das neue Passwort muss sich vom aktuellen Passwort unterscheiden.",
    strong: "Gutes Passwort. Du kannst es jetzt speichern."
  },
  en: {
    invalid: "The new password does not meet the requirements yet.",
    medium: "This password is acceptable, but it could be stronger.",
    same: "The new password must be different from the current password.",
    strong: "Strong password. You can save it now."
  },
  ru: {
    invalid: "Новый пароль пока не соответствует требованиям.",
    medium: "Пароль уже подходит, но его можно сделать сильнее.",
    same: "Новый пароль должен отличаться от текущего.",
    strong: "Хороший пароль. Его уже можно сохранить."
  }
};

export function SecuritySettingsPanel() {
  const navigate = useNavigate();
  const { locale, t } = useLocale();
  const { deleteOwnAccount, changePassword, logout, user } = useAuth();
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: ""
  });
  const [passwordPending, setPasswordPending] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const hint = passwordHintText[locale] ?? passwordHintText.en;
  const passwordFeedback = getPasswordFeedback(
    locale,
    passwordForm.currentPassword,
    passwordForm.newPassword
  );
  const canSubmitPassword = Boolean(
    passwordForm.currentPassword &&
      passwordForm.newPassword &&
      passwordFeedback?.canSubmit &&
      !passwordPending
  );

  function handlePasswordFieldChange(field, value) {
    setPasswordForm((current) => ({ ...current, [field]: value }));
    setPasswordError(null);
    setPasswordMessage("");
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();

    if (!canSubmitPassword) {
      return;
    }

    setPasswordPending(true);
    setPasswordError(null);
    setPasswordMessage("");

    try {
      const response = await changePassword(passwordForm, user.__version ?? user.version);
      setPasswordMessage(response.message || t("security.changed"));
      setPasswordForm({
        currentPassword: "",
        newPassword: ""
      });
    } catch (nextError) {
      setPasswordError(nextError);
    } finally {
      setPasswordPending(false);
    }
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(t("security.deleteConfirm"));

    if (!confirmed) {
      return;
    }

    setDeletePending(true);
    setDeleteError(null);

    try {
      await deleteOwnAccount(user.__version ?? user.version);
      navigate("/", { replace: true });
    } catch (nextError) {
      setDeleteError(nextError);
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <article className="section-card profile-security-card">
      <div className="profile-security-stack">
        <section className="content-stack">
          <div className="profile-security-section-head">
            <h2>{t("security.changePassword")}</h2>
            <p className="muted-line">{hint}</p>
          </div>

          <form className="content-stack" onSubmit={handlePasswordSubmit}>
            <div className="security-password-grid">
              <Field
                label={t("security.currentPassword")}
                onChange={(value) => handlePasswordFieldChange("currentPassword", value)}
                type="password"
                value={passwordForm.currentPassword}
              />

              <div className="security-password-field-stack">
                <Field
                  label={t("auth.newPassword")}
                  onChange={(value) => handlePasswordFieldChange("newPassword", value)}
                  type="password"
                  value={passwordForm.newPassword}
                />
                {passwordFeedback ? (
                  <p
                    className={`security-password-feedback security-password-feedback-${passwordFeedback.tone}`}
                  >
                    {passwordFeedback.text}
                  </p>
                ) : null}
              </div>

              <div className="security-password-action">
                <button
                  className="button button-compact security-action-button security-password-button"
                  disabled={!canSubmitPassword}
                  type="submit"
                >
                  {passwordPending ? t("security.updating") : t("security.changePassword")}
                </button>
              </div>
            </div>

            {passwordMessage ? (
              <p className="inline-message inline-message-success">{passwordMessage}</p>
            ) : null}
            {passwordError ? (
              <p className="inline-message inline-message-error">{passwordError.message}</p>
            ) : null}
          </form>
        </section>

        <section className="content-stack">
          <div className="profile-session-actions">
            <button
              className="button button-secondary button-compact security-action-button"
              onClick={() => void logout()}
              type="button"
            >
              {t("security.logoutCurrentSession")}
            </button>
            <button
              className="button button-danger button-compact security-action-button"
              disabled={deletePending}
              onClick={() => void handleDeleteAccount()}
              type="button"
            >
              {deletePending ? t("security.deletingAccount") : t("security.deleteAccount")}
            </button>
          </div>

          {deleteError ? (
            <p className="inline-message inline-message-error">{deleteError.message}</p>
          ) : null}
        </section>
      </div>
    </article>
  );
}

export function SecurityPage() {
  return <Navigate replace to="/app/profile" />;
}

function Field({ label, onChange, type, value }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        className="field-control"
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
    </label>
  );
}

function getPasswordFeedback(locale, currentPassword, newPassword) {
  if (!newPassword) {
    return null;
  }

  const text = passwordFeedbackText[locale] ?? passwordFeedbackText.en;
  const hasWhitespace = /\s/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasDigit = /\d/.test(newPassword);
  const hasSymbol = /[^A-Za-z0-9\s]/.test(newPassword);
  const meetsRequirements =
    newPassword.length >= 8 &&
    newPassword.length <= 64 &&
    !hasWhitespace &&
    hasLower &&
    hasUpper &&
    hasDigit &&
    hasSymbol;

  if (currentPassword && currentPassword === newPassword) {
    return {
      canSubmit: false,
      text: text.same,
      tone: "danger"
    };
  }

  if (!meetsRequirements) {
    return {
      canSubmit: false,
      text: text.invalid,
      tone: "danger"
    };
  }

  if (newPassword.length >= 12) {
    return {
      canSubmit: true,
      text: text.strong,
      tone: "success"
    };
  }

  return {
    canSubmit: true,
    text: text.medium,
    tone: "warning"
  };
}
