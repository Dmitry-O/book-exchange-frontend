import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useMetadataQuery } from "../../shared/api/hooks";
import { apiRequest } from "../../shared/api/http";
import { useAuth } from "../../shared/auth/AuthContext";
import { useLocale } from "../../shared/i18n/LocaleContext";
import { formatEnumLabel } from "../../shared/lib/format";
import { trimFormPayload } from "../../shared/lib/format";
import { BookCover, UserAvatar } from "../../shared/ui/Media";
import { FlagIcon, XIcon } from "../../shared/ui/Icons";

const initialForm = {
  reason: "",
  comment: ""
};

const reportText = {
  de: {
    aboutBook: "Dieses Buch melden",
    aboutUser: "Diesen Nutzer melden",
    alreadyBook: "Du hast für dieses Buch bereits eine Meldung gesendet.",
    alreadyUser: "Du hast für diesen Nutzer bereits eine Meldung gesendet.",
    chooseTarget: "Wähle oben zuerst aus, worauf sich die Meldung beziehen soll.",
    close: "Fenster schließen",
    comment: "Kommentar",
    commentPlaceholder: "Beschreibe kurz, was geprüft werden soll",
    helper:
      "Wähle zuerst, ob sich die Meldung auf das Buch oder auf den Besitzer des Inserats bezieht, und sende dann deinen Kommentar.",
    loadingReasons: "Meldegründe werden geladen...",
    openDialog: "Meldeformular öffnen",
    reason: "Grund",
    send: "Meldung senden",
    sending: "Meldung wird gesendet...",
    title: "Meldung"
  },
  en: {
    aboutBook: "Report this book",
    aboutUser: "Report this user",
    alreadyBook: "You have already sent a report about this book.",
    alreadyUser: "You have already sent a report about this user.",
    chooseTarget: "Choose what you want to report above to continue.",
    close: "Close window",
    comment: "Comment",
    commentPlaceholder: "Briefly describe what should be reviewed",
    helper:
      "First choose whether the report is about the book or about the owner of this listing, then send your moderation comment.",
    loadingReasons: "Loading report reasons...",
    openDialog: "Open report dialog",
    reason: "Reason",
    send: "Send report",
    sending: "Sending report...",
    title: "Report"
  },
  ru: {
    aboutBook: "Пожаловаться на книгу",
    aboutUser: "Пожаловаться на пользователя",
    alreadyBook: "Вы уже отправляли жалобу на эту книгу.",
    alreadyUser: "Вы уже отправляли жалобу на этого пользователя.",
    chooseTarget: "Сначала выберите, на что именно вы хотите пожаловаться.",
    close: "Закрыть окно",
    comment: "Комментарий",
    commentPlaceholder: "Коротко опишите, что именно нужно проверить",
    helper:
      "Сначала выберите, относится ли жалоба к книге или к владельцу объявления, а затем отправьте комментарий для модерации.",
    loadingReasons: "Загружаем причины жалобы...",
    openDialog: "Открыть окно жалобы",
    reason: "Причина",
    send: "Отправить жалобу",
    sending: "Отправляем жалобу...",
    title: "Жалоба"
  }
};

export function ReportActionCard({ book, variant = "icon" }) {
  const { locale } = useLocale();
  const { isAuthenticated, user } = useAuth();
  const text = reportText[locale] ?? reportText.en;
  const isOwnBook = isAuthenticated && user?.id === book.ownerUserId;
  const [isOpen, setIsOpen] = useState(false);

  if (!isAuthenticated || isOwnBook || variant !== "icon") {
    return null;
  }

  return (
    <>
      <button
        aria-label={text.openDialog}
        className="icon-button icon-button-danger"
        onClick={() => setIsOpen(true)}
        title={text.openDialog}
        type="button"
      >
        <FlagIcon />
      </button>

      {isOpen ? <ReportModal book={book} onClose={() => setIsOpen(false)} /> : null}
    </>
  );
}

function ReportModal({ book, onClose }) {
  const { locale } = useLocale();
  const queryClient = useQueryClient();
  const metadataQuery = useMetadataQuery();
  const [targetType, setTargetType] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const text = reportText[locale] ?? reportText.en;

  useEffect(() => {
    if (!metadataQuery.data?.reportReasons?.length) {
      return;
    }

    setForm((current) => ({
      ...current,
      reason: current.reason || metadataQuery.data.reportReasons[0]
    }));
  }, [metadataQuery.data]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!targetType) {
      return;
    }

    setPending(true);
    setError(null);
    setSuccessMessage("");

    try {
      const response = await apiRequest(`/report/${resolveTargetId(book, targetType)}`, {
        method: "POST",
        auth: true,
        body: {
          targetType,
          ...trimFormPayload(form)
        }
      });

      await queryClient.invalidateQueries({ queryKey: ["my-reports"] });
      setSuccessMessage(response.message || text.send);
      setForm((current) => ({
        ...current,
        comment: ""
      }));
    } catch (nextError) {
      setError(nextError);
    } finally {
      setPending(false);
    }
  }

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <section
        aria-modal="true"
        className="modal-panel report-modal-panel"
        role="dialog"
      >
        <div className="row-between">
          <h2>{text.title}</h2>
          <button
            aria-label={text.close}
            className="modal-close modal-close-icon"
            onClick={onClose}
            title={text.close}
            type="button"
          >
            <XIcon />
          </button>
        </div>

        <p className="muted-line">{text.helper}</p>

        <div className="choice-grid">
          <button
            className={targetType === "BOOK" ? "choice-card choice-card-active" : "choice-card"}
            onClick={() => {
              setTargetType("BOOK");
              setError(null);
              setSuccessMessage("");
            }}
            type="button"
          >
            <BookCover photoUrl={book.photoUrl} size="sm" title={book.name} />
            <strong>{text.aboutBook}</strong>
            <span>{book.name}</span>
          </button>
          <button
            className={targetType === "USER" ? "choice-card choice-card-active" : "choice-card"}
            onClick={() => {
              setTargetType("USER");
              setError(null);
              setSuccessMessage("");
            }}
            type="button"
          >
            <UserAvatar name={book.ownerNickname} photoUrl={book.ownerPhotoUrl} size="sm" />
            <strong>{text.aboutUser}</strong>
            <span>{book.ownerNickname}</span>
          </button>
        </div>

        {metadataQuery.isPending ? <p className="muted-line">{text.loadingReasons}</p> : null}
        {metadataQuery.error ? (
          <p className="inline-message inline-message-error">
            {metadataQuery.error.message}
          </p>
        ) : null}

        {targetType ? (
          <form className="content-stack" onSubmit={handleSubmit}>
            <label className="field">
              <span>{text.reason}</span>
              <select
                className="field-control"
                onChange={(event) =>
                  setForm((current) => ({ ...current, reason: event.target.value }))
                }
                value={form.reason}
              >
                {(metadataQuery.data?.reportReasons ?? []).map((reason) => (
                  <option key={reason} value={reason}>
                    {formatEnumLabel(reason)}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>{text.comment}</span>
              <textarea
                className="field-control"
                onChange={(event) =>
                  setForm((current) => ({ ...current, comment: event.target.value }))
                }
                placeholder={text.commentPlaceholder}
                required
                rows={4}
                value={form.comment}
              />
            </label>

            {successMessage ? (
              <p className="inline-message inline-message-success">{successMessage}</p>
            ) : null}
            {error ? (
              <p className="inline-message inline-message-error">
                {resolveErrorMessage(error, targetType, text)}
              </p>
            ) : null}

            <div className="card-actions">
              <button
                className="button"
                disabled={pending || !form.reason || metadataQuery.isPending}
                type="submit"
              >
                {pending ? text.sending : text.send}
              </button>
            </div>
          </form>
        ) : (
          <p className="muted-line">{text.chooseTarget}</p>
        )}
      </section>
    </div>,
    document.body
  );
}

function resolveErrorMessage(error, targetType, text) {
  if (error?.errorCode === "REPORT_ALREADY_EXISTS") {
    return targetType === "USER" ? text.alreadyUser : text.alreadyBook;
  }

  return error?.message ?? "";
}

function resolveTargetId(book, targetType) {
  return targetType === "USER" ? book.ownerUserId : book.id;
}
