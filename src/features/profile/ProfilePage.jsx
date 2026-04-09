import { useEffect, useState } from "react";
import { useMetadataQuery } from "../../shared/api/hooks";
import { useAuth } from "../../shared/auth/AuthContext";
import { formatDateTime, trimFormPayload } from "../../shared/lib/format";
import { ImageUploadField } from "../../shared/ui/ImageUploadField";
import { UserAvatar } from "../../shared/ui/Media";
import { ErrorBlock, LoadingBlock } from "../../shared/ui/StateBlocks";

export function ProfilePage() {
  const metadataQuery = useMetadataQuery();
  const { deleteProfilePhoto, isLoadingUser, updateProfile, user, userError } = useAuth();
  const [form, setForm] = useState({
    nickname: "",
    locale: "en",
    photoBase64: null,
    photoUrl: ""
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [photoPending, setPhotoPending] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [photoMessage, setPhotoMessage] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    setForm({
      nickname: user.nickname ?? "",
      locale: user.locale ?? metadataQuery.data?.locales?.[0] ?? "en",
      photoBase64: null,
      photoUrl: user.photoUrl ?? ""
    });
  }, [metadataQuery.data, user]);

  if (isLoadingUser) {
    return <LoadingBlock label="Loading profile" />;
  }

  if (userError) {
    return <ErrorBlock error={userError} title="Profile could not be loaded" />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccessMessage("");

    try {
      const payload = toProfilePayload(form);
      const response = await updateProfile(payload, user.__version ?? user.version);
      setForm((current) => ({
        ...current,
        photoBase64: null,
        photoUrl: response.data?.photoUrl ?? current.photoUrl
      }));
      setSuccessMessage(response.message || "Profile updated successfully.");
    } catch (nextError) {
      setError(nextError);
    } finally {
      setPending(false);
    }
  }

  async function handleDeletePhoto() {
    const confirmed = window.confirm("Delete your current profile photo?");

    if (!confirmed) {
      return;
    }

    setPhotoPending(true);
    setPhotoError("");
    setPhotoMessage("");
    setError(null);
    setSuccessMessage("");

    try {
      const response = await deleteProfilePhoto(user.__version ?? user.version);
      setForm((current) => ({
        ...current,
        photoBase64: null,
        photoUrl: response.data?.photoUrl ?? ""
      }));
      setPhotoMessage(response.message || "Profile photo deleted.");
    } catch (nextError) {
      setPhotoError(nextError.message);
    } finally {
      setPhotoPending(false);
    }
  }

  return (
    <section className="content-stack">
      <header className="section-card">
        <span className="eyebrow">Profile</span>
        <h1>Account profile</h1>
        <p>
          This page is backed by `GET /user` and `PATCH /user`, including If-Match version handling.
        </p>
      </header>

      <section className="detail-grid">
        <article className="section-card">
          <div className="entity-header">
            <UserAvatar name={user.nickname || user.email} photoUrl={user.photoUrl} size="lg" />
            <div>
              <h2>Current backend data</h2>
              <p>Photo rendering now comes from `photoUrl`, while updates still send `photoBase64`.</p>
            </div>
          </div>
          <dl className="detail-list">
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Roles</dt>
              <dd>{(user.roles ?? []).join(", ") || "No roles"}</dd>
            </div>
            <div>
              <dt>Locale</dt>
              <dd>{user.locale || "Not set"}</dd>
            </div>
            <div>
              <dt>Version / ETag</dt>
              <dd>{user.__version ?? user.version ?? "Not available"}</dd>
            </div>
            <div>
              <dt>Banned until</dt>
              <dd>{formatDateTime(user.bannedUntil)}</dd>
            </div>
            <div>
              <dt>Ban reason</dt>
              <dd>{user.banReason || "None"}</dd>
            </div>
          </dl>
        </article>

        <article className="section-card">
          <h2>Edit profile</h2>
          <form className="content-stack" onSubmit={handleSubmit}>
            <Field
              label="Nickname"
              value={form.nickname}
              onChange={(value) => setForm((current) => ({ ...current, nickname: value }))}
            />
            <label className="field">
              <span>Locale</span>
              <select
                className="field-control"
                onChange={(event) =>
                  setForm((current) => ({ ...current, locale: event.target.value }))
                }
                value={form.locale}
              >
                {(metadataQuery.data?.locales ?? ["en"]).map((locale) => (
                  <option key={locale} value={locale}>
                    {locale}
                  </option>
                ))}
              </select>
            </label>
            <ImageUploadField
              error={photoError}
              entityName={form.nickname || user.email}
              kind="user"
              label="Profile photo"
              message={photoMessage}
              onChange={(value) => setForm((current) => ({ ...current, photoBase64: value }))}
              onRemove={handleDeletePhoto}
              photoBase64={form.photoBase64}
              photoUrl={form.photoUrl}
              removePending={photoPending}
            />

            {successMessage ? <p className="inline-message inline-message-success">{successMessage}</p> : null}
            {error ? <p className="inline-message inline-message-error">{error.message}</p> : null}

            <button className="button" disabled={pending} type="submit">
              {pending ? "Saving..." : "Save profile"}
            </button>
          </form>
        </article>
      </section>
    </section>
  );
}

function Field({ label, onChange, value }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input className="field-control" onChange={(event) => onChange(event.target.value)} value={value} />
    </label>
  );
}

function toProfilePayload(form) {
  const payload = trimFormPayload({
    nickname: form.nickname,
    locale: form.locale
  });

  if (form.photoBase64 !== null) {
    payload.photoBase64 = form.photoBase64;
  }

  return payload;
}
