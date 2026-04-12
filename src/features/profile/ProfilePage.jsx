import { useEffect, useState } from "react";
import { useMetadataQuery } from "../../shared/api/hooks";
import { useAuth } from "../../shared/auth/AuthContext";
import { useLocale } from "../../shared/i18n/LocaleContext";
import { formatDateTime, trimFormPayload } from "../../shared/lib/format";
import { ImageUploadField } from "../../shared/ui/ImageUploadField";
import { UserAvatar } from "../../shared/ui/Media";
import { ErrorBlock, LoadingBlock } from "../../shared/ui/StateBlocks";

export function ProfilePage() {
  const metadataQuery = useMetadataQuery();
  const { locale, setLocale, t } = useLocale();
  const { deleteProfilePhoto, isLoadingUser, updateProfile, user, userError } = useAuth();
  const [form, setForm] = useState({
    nickname: "",
    locale,
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
    return <LoadingBlock label={t("profile.title")} />;
  }

  if (userError) {
    return <ErrorBlock error={userError} title={t("profile.title")} />;
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
      setSuccessMessage(response.message || t("profile.updated"));
      setLocale(form.locale);
    } catch (nextError) {
      setError(nextError);
    } finally {
      setPending(false);
    }
  }

  async function handleDeletePhoto() {
    const confirmed = window.confirm(t("profile.deletePhotoConfirm"));

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
      setPhotoMessage(response.message || t("profile.photoDeleted"));
    } catch (nextError) {
      setPhotoError(nextError.message);
    } finally {
      setPhotoPending(false);
    }
  }

  return (
    <section className="content-stack">
      <header className="section-card">
        <span className="eyebrow">{t("profile.eyebrow")}</span>
        <h1>{t("profile.title")}</h1>
        <p>{t("profile.description")}</p>
      </header>

      <section className="detail-grid">
        <article className="section-card">
          <div className="entity-header">
            <UserAvatar name={user.nickname || user.email} photoUrl={user.photoUrl} size="lg" />
            <div>
              <h2>{t("profile.currentData")}</h2>
              <p>{t("profile.currentDataDescription")}</p>
            </div>
          </div>
          <dl className="detail-list">
            <div>
              <dt>{t("auth.email")}</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>{t("profile.roles")}</dt>
              <dd>{(user.roles ?? []).join(", ") || t("profile.noRoles")}</dd>
            </div>
            <div>
              <dt>{t("auth.locale")}</dt>
              <dd>{user.locale || t("profile.notSet")}</dd>
            </div>
            <div>
              <dt>{t("profile.version")}</dt>
              <dd>{user.__version ?? user.version ?? t("common.notAvailable")}</dd>
            </div>
            <div>
              <dt>{t("profile.bannedUntil")}</dt>
              <dd>{formatDateTime(user.bannedUntil)}</dd>
            </div>
            <div>
              <dt>{t("profile.banReason")}</dt>
              <dd>{user.banReason || t("profile.none")}</dd>
            </div>
          </dl>
        </article>

        <article className="section-card">
          <h2>{t("profile.editTitle")}</h2>
          <form className="content-stack" onSubmit={handleSubmit}>
            <Field
              label={t("auth.nickname")}
              value={form.nickname}
              onChange={(value) => setForm((current) => ({ ...current, nickname: value }))}
            />
            <label className="field">
              <span>{t("auth.locale")}</span>
              <select
                className="field-control"
                onChange={(event) => {
                  setLocale(event.target.value);
                  setForm((current) => ({ ...current, locale: event.target.value }));
                }}
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
              label={t("profile.profilePhoto")}
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
              {pending ? t("profile.saving") : t("profile.saveProfile")}
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
