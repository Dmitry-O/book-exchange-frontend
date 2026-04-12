import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/auth/AuthContext";
import { useLocale } from "../../shared/i18n/LocaleContext";

export function SecurityPage() {
  const navigate = useNavigate();
  const { t } = useLocale();
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

  async function handlePasswordSubmit(event) {
    event.preventDefault();
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
    const confirmed = window.confirm(
      t("security.deleteConfirm")
    );

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
    <section className="content-stack">
      <header className="section-card">
        <span className="eyebrow">{t("security.eyebrow")}</span>
        <h1>{t("security.title")}</h1>
        <p>{t("security.description")}</p>
      </header>

      <section className="detail-grid">
        <article className="section-card">
          <h2>{t("security.changePassword")}</h2>
          <form className="content-stack" onSubmit={handlePasswordSubmit}>
            <Field
              label={t("security.currentPassword")}
              type="password"
              value={passwordForm.currentPassword}
              onChange={(value) =>
                setPasswordForm((current) => ({ ...current, currentPassword: value }))
              }
            />
            <Field
              label={t("auth.newPassword")}
              type="password"
              value={passwordForm.newPassword}
              onChange={(value) =>
                setPasswordForm((current) => ({ ...current, newPassword: value }))
              }
            />

            {passwordMessage ? (
              <p className="inline-message inline-message-success">{passwordMessage}</p>
            ) : null}
            {passwordError ? (
              <p className="inline-message inline-message-error">{passwordError.message}</p>
            ) : null}

            <button className="button" disabled={passwordPending} type="submit">
              {passwordPending ? t("security.updating") : t("security.changePassword")}
            </button>
          </form>
        </article>

        <article className="section-card">
          <h2>{t("security.sessionActions")}</h2>
          <p className="muted-line">
            {t("security.currentProfileVersion")}: {user?.__version ?? user?.version ?? t("security.unknownVersion")}
          </p>

          <div className="content-stack">
            <button className="button button-secondary" onClick={() => void logout()} type="button">
              {t("security.logoutCurrentSession")}
            </button>
            <button
              className="button button-danger"
              disabled={deletePending}
              onClick={() => void handleDeleteAccount()}
              type="button"
            >
              {deletePending ? t("security.deletingAccount") : t("security.deleteAccount")}
            </button>
            {deleteError ? (
              <p className="inline-message inline-message-error">{deleteError.message}</p>
            ) : null}
            <p className="muted-line">
              {t("security.publicDeleteFlowPrefix")}{" "}
              <Link to="/delete-account-request">{t("security.publicDeleteFlowLink")}</Link>.
            </p>
          </div>
        </article>
      </section>
    </section>
  );
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
