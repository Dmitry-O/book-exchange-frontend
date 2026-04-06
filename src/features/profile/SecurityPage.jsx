import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/auth/AuthContext";

export function SecurityPage() {
  const navigate = useNavigate();
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
      setPasswordMessage(response.message || "Password has been changed.");
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
      "Delete the current account? This action should call DELETE /user."
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
        <span className="eyebrow">Security</span>
        <h1>Session and password controls</h1>
        <p>
          This page uses `PATCH /user/reset_password`, `PATCH /user/logout`, and `DELETE /user`.
        </p>
      </header>

      <section className="detail-grid">
        <article className="section-card">
          <h2>Change password</h2>
          <form className="content-stack" onSubmit={handlePasswordSubmit}>
            <Field
              label="Current password"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(value) =>
                setPasswordForm((current) => ({ ...current, currentPassword: value }))
              }
            />
            <Field
              label="New password"
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
              {passwordPending ? "Updating..." : "Change password"}
            </button>
          </form>
        </article>

        <article className="section-card">
          <h2>Session actions</h2>
          <p className="muted-line">
            Current profile version: {user?.__version ?? user?.version ?? "unknown"}
          </p>

          <div className="content-stack">
            <button className="button button-secondary" onClick={() => void logout()} type="button">
              Logout current session
            </button>
            <button
              className="button button-danger"
              disabled={deletePending}
              onClick={() => void handleDeleteAccount()}
              type="button"
            >
              {deletePending ? "Deleting account..." : "Delete account"}
            </button>
            {deleteError ? (
              <p className="inline-message inline-message-error">{deleteError.message}</p>
            ) : null}
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
