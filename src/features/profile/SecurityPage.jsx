import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/auth/AuthContext";
import {
  getPasswordFeedback,
  getPasswordRequirements
} from "../../shared/auth/passwordFeedback";
import { useLocale } from "../../shared/i18n/LocaleContext";
import {
  AlertTriangleIcon,
  LockIcon,
  ShieldIcon,
  SignOutIcon,
  TrashIcon
} from "../../shared/ui/Icons";
import { PasswordField } from "../../shared/ui/PasswordField";
import { PasswordStrengthFeedback } from "../../shared/ui/PasswordStrengthFeedback";

const accountManagementHeading = {
  de: "Kontoverwaltung",
  en: "Account management",
  ru: "Управление аккаунтом"
};

const securityCopy = {
  de: {
    deleteNote:
      "Dein Profil wird anonymisiert, deine Bücher verschwinden aus dem Katalog und offene Tauschanfragen werden automatisch abgelehnt. Abgeschlossene und abgelehnte Tausche bleiben anonymisiert im Verlauf. Eine Anmeldung und Wiederherstellung deiner Daten sind danach nicht mehr möglich.",
    deleteTitle: "Achtung!",
    requirementsTitle: "Passwortanforderungen",
    passwordsMatch: "Die Passwörter stimmen überein",
    samePassword: "Das neue Passwort muss sich vom aktuellen Passwort unterscheiden."
  },
  en: {
    deleteNote:
      "Your profile will be anonymized, your books will disappear from the catalog, and pending exchanges will be declined automatically. Completed and declined exchanges remain in history anonymously. You will no longer be able to sign in or restore your data.",
    deleteTitle: "Attention!",
    requirementsTitle: "Password requirements",
    passwordsMatch: "The passwords match",
    samePassword: "The new password must be different from the current password."
  },
  ru: {
    deleteNote:
      "Профиль будет обезличен, ваши книги исчезнут из каталога, а ожидающие обмены будут автоматически отменены. Завершённые и отклонённые обмены останутся в истории в обезличенном виде. Войти в аккаунт или восстановить данные после удаления будет невозможно.",
    deleteTitle: "Внимание!",
    requirementsTitle: "Требования к паролю",
    passwordsMatch: "Пароли совпадают",
    samePassword: "Новый пароль должен отличаться от текущего."
  }
};

export function SecuritySettingsPanel() {
  const navigate = useNavigate();
  const { locale, t } = useLocale();
  const { deleteOwnAccount, changePassword, logout, user } = useAuth();
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordPending, setPasswordPending] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const accountManagementTitle = accountManagementHeading[locale] ?? accountManagementHeading.en;
  const copy = securityCopy[locale] ?? securityCopy.en;
  const passwordFeedback = getPasswordFeedback(locale, "", passwordForm.newPassword);
  const samePasswordAsCurrent = Boolean(
    passwordForm.currentPassword &&
      passwordForm.newPassword &&
      passwordForm.currentPassword === passwordForm.newPassword
  );
  const confirmPasswordError =
    passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword
      ? t("auth.passwordMismatch")
      : "";
  const passwordRequirements = getPasswordRequirements(locale, passwordForm.newPassword);
  const passwordsMatch = Boolean(
    passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword
  );
  const canSubmitPassword = Boolean(
    passwordForm.currentPassword &&
      passwordForm.newPassword &&
      passwordForm.confirmPassword &&
      !confirmPasswordError &&
      !samePasswordAsCurrent &&
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
      const response = await changePassword(
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        },
        user.__version ?? user.version
      );
      setPasswordMessage(response.message || t("security.changed"));
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
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
        <div className="profile-security-section-head">
          <span className="profile-card-heading-icon">
            <ShieldIcon />
          </span>
          <div>
            <h2>{accountManagementTitle}</h2>
          </div>
        </div>

        <div className="profile-security-workspace">
          <section className="content-stack profile-security-primary">
            <form autoComplete="off" className="content-stack" onSubmit={handlePasswordSubmit}>
              <div className="security-password-grid">
                <PasswordField
                  autoComplete="off"
                  label={t("security.currentPassword")}
                  name="currentPassword"
                  onChange={(value) => handlePasswordFieldChange("currentPassword", value)}
                  revealLabel={t("auth.holdToShowPassword")}
                  value={passwordForm.currentPassword}
                />

                <div className="security-password-field-stack">
                  <PasswordField
                    autoComplete="new-password"
                    label={t("auth.newPassword")}
                    name="newPassword"
                    onChange={(value) => handlePasswordFieldChange("newPassword", value)}
                    revealLabel={t("auth.holdToShowPassword")}
                    value={passwordForm.newPassword}
                  />
                  <div className="password-strength-slot">
                    <PasswordStrengthFeedback feedback={passwordFeedback} />
                  </div>
                </div>

                <PasswordField
                  autoComplete="new-password"
                  label={t("auth.confirmPassword")}
                  name="confirmPassword"
                  onChange={(value) => handlePasswordFieldChange("confirmPassword", value)}
                  revealLabel={t("auth.holdToShowPassword")}
                  value={passwordForm.confirmPassword}
                />

                <div className="password-match-slot">
                  {confirmPasswordError ? (
                    <p className="password-match-message password-match-message-error">
                      {confirmPasswordError}
                    </p>
                  ) : samePasswordAsCurrent ? (
                    <p className="password-match-message password-match-message-error">
                      {copy.samePassword}
                    </p>
                  ) : passwordsMatch ? (
                    <p className="password-match-message">
                      <span aria-hidden="true">✓</span>
                      {copy.passwordsMatch}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="security-password-action">
                <button
                  className="button button-compact security-action-button security-password-button"
                  disabled={!canSubmitPassword}
                  type="submit"
                >
                  <LockIcon />
                  {passwordPending ? t("security.updating") : t("security.changePassword")}
                </button>
              </div>

              {passwordMessage ? (
                <p className="inline-message inline-message-success">{passwordMessage}</p>
              ) : null}
              {passwordError ? (
                <p className="inline-message inline-message-error">{passwordError.message}</p>
              ) : null}
            </form>
          </section>

          <aside className="content-stack profile-security-session">
            <section className="profile-password-requirements">
              <h3>
                <ShieldIcon />
                {copy.requirementsTitle}
              </h3>
              <ul>
                {passwordRequirements.map((requirement) => (
                  <li
                    className={requirement.met ? "password-requirement-met" : ""}
                    key={requirement.key}
                  >
                    <span aria-hidden="true">{requirement.met ? "✓" : "○"}</span>
                    {requirement.label}
                  </li>
                ))}
              </ul>
            </section>

            <div className="profile-session-actions">
              <button
                className="button button-secondary button-compact security-action-button profile-session-action-logout"
                onClick={() => void logout()}
                type="button"
              >
                <SignOutIcon />
                {t("security.logoutCurrentSession")}
              </button>
              <button
                className="button button-danger button-compact security-action-button profile-session-action-delete"
                disabled={deletePending}
                onClick={() => void handleDeleteAccount()}
                type="button"
              >
                <TrashIcon />
                {deletePending ? t("security.deletingAccount") : t("security.deleteAccount")}
              </button>
            </div>

            {deleteError ? (
              <p className="inline-message inline-message-error">{deleteError.message}</p>
            ) : null}

            <section className="profile-delete-warning">
              <AlertTriangleIcon />
              <div>
                <strong>{copy.deleteTitle}</strong>
                <p>{copy.deleteNote}</p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </article>
  );
}

export function SecurityPage() {
  return <Navigate replace to="/app/profile" />;
}
