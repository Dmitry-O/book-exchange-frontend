import { useEffect, useState } from "react";
import { useAuth } from "../../shared/auth/AuthContext";
import { useLocale } from "../../shared/i18n/LocaleContext";
import { trimFormPayload } from "../../shared/lib/format";
import { ImageUploadField } from "../../shared/ui/ImageUploadField";
import { ErrorBlock, LoadingBlock } from "../../shared/ui/StateBlocks";

export function ProfilePage() {
  const { locale, t } = useLocale();
  const { deleteProfilePhoto, isLoadingUser, refetchUser, updateProfile, user, userError } = useAuth();
  const [form, setForm] = useState({
    nickname: "",
    photoUrl: ""
  });
  const [profileVersion, setProfileVersion] = useState(null);
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
      photoUrl: user.photoUrl ?? ""
    });
    setProfileVersion(user.__version ?? user.version ?? null);
  }, [user]);

  if (isLoadingUser) {
    return <LoadingBlock label={t("profile.title")} />;
  }

  if (userError) {
    return <ErrorBlock error={userError} title={t("profile.title")} />;
  }

  const updateNicknameLabel =
    locale === "ru" ? "Обновить никнейм" : t("profile.saveProfile");
  const photoUploadedLabel =
    locale === "ru" ? "Фото профиля загружено." : t("profile.photoUploaded");

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccessMessage("");
    setPhotoError("");
    setPhotoMessage("");

    try {
      const response = await updateProfile(toProfilePayload(form), profileVersion);
      const refreshedUser = await refetchUser();
      const nextUser = refreshedUser.data ?? null;

      setProfileVersion(nextUser?.__version ?? response.eTag ?? response.data?.version ?? profileVersion);
      setForm((current) => ({
        ...current,
        nickname: nextUser?.nickname ?? current.nickname,
        photoUrl: nextUser?.photoUrl ?? response.data?.photoUrl ?? current.photoUrl
      }));
      setSuccessMessage(t("profile.updated"));
    } catch (nextError) {
      setError(nextError);
    } finally {
      setPending(false);
    }
  }

  async function handlePhotoUpload(photoBase64) {
    const previousPhotoUrl = form.photoUrl;

    setPhotoPending(true);
    setPhotoError("");
    setPhotoMessage("");
    setError(null);
    setSuccessMessage("");
    setForm((current) => ({
      ...current,
      photoUrl: photoBase64
    }));

    try {
      const response = await updateProfile({ photoBase64 }, profileVersion);
      const refreshedUser = await refetchUser();
      const nextUser = refreshedUser.data ?? null;

      setProfileVersion(nextUser?.__version ?? response.eTag ?? response.data?.version ?? profileVersion);
      setForm((current) => ({
        ...current,
        photoUrl: nextUser?.photoUrl ?? response.data?.photoUrl ?? current.photoUrl
      }));
      setPhotoMessage(photoUploadedLabel);
    } catch (nextError) {
      setForm((current) => ({
        ...current,
        photoUrl: previousPhotoUrl
      }));
      setPhotoError(nextError.message);
      throw nextError;
    } finally {
      setPhotoPending(false);
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
      const response = await deleteProfilePhoto(profileVersion);
      const refreshedUser = await refetchUser();
      const nextUser = refreshedUser.data ?? null;

      setProfileVersion(nextUser?.__version ?? response.eTag ?? response.data?.version ?? profileVersion);
      setForm((current) => ({
        ...current,
        photoUrl: nextUser?.photoUrl ?? response.data?.photoUrl ?? ""
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
        <h1>{t("profile.title")}</h1>
        <p>{t("profile.description")}</p>
      </header>

      <section className="content-stack">
        <article className="section-card profile-data-card">
          <h2>{t("profile.currentData")}</h2>
          <form className="content-stack" onSubmit={handleSubmit}>
            <ImageUploadField
              entityName={form.nickname || user.email}
              error={photoError}
              helperText={null}
              kind="user"
              label={t("profile.profilePhoto")}
              message={photoMessage}
              onChange={handlePhotoUpload}
              onRemove={handleDeletePhoto}
              photoBase64={null}
              photoUrl={form.photoUrl}
              removePending={photoPending}
            />

            <StaticField label={t("auth.email")} value={user.email} />
            <div className="inline-field-action">
              <Field
                label={t("auth.nickname")}
                value={form.nickname}
                onChange={(value) => setForm((current) => ({ ...current, nickname: value }))}
              />

              <button className="button button-compact" disabled={pending} type="submit">
                {pending ? t("profile.saving") : updateNicknameLabel}
              </button>
            </div>

            {successMessage ? <p className="inline-message inline-message-success">{successMessage}</p> : null}
            {error ? <p className="inline-message inline-message-error">{error.message}</p> : null}
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

function StaticField({ label, value }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input className="field-control" disabled readOnly type="email" value={value} />
    </label>
  );
}

function toProfilePayload(form) {
  const payload = trimFormPayload({
    nickname: form.nickname
  });

  if (form.photoBase64 !== null) {
    payload.photoBase64 = form.photoBase64;
  }

  return payload;
}
