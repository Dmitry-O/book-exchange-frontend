import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMetadataQuery } from "../../shared/api/hooks";
import { apiRequest } from "../../shared/api/http";
import { useAuth } from "../../shared/auth/AuthContext";
import { useLocale } from "../../shared/i18n/LocaleContext";
import { formatEnumLabel, trimFormPayload } from "../../shared/lib/format";
import { BookCover, UserAvatar } from "../../shared/ui/Media";
import { FlagIcon, XIcon } from "../../shared/ui/Icons";
import { PrettySelect } from "../../shared/ui/PrettySelect";

const REPORT_CLOSE_TIMEOUT_MS = 5000;

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
    autoClose: "Dieses Fenster schließt sich automatisch in:",
    chooseTarget: "Wähle oben zuerst aus, worauf sich die Meldung beziehen soll.",
    close: "Fenster schließen",
    comment: "Kommentar",
    commentPlaceholder: "Beschreibe kurz, was geprüft werden soll",
    helper:
      "Wähle zuerst, ob sich die Meldung auf das Buch oder auf den Besitzer des Inserats bezieht, und sende dann deinen Kommentar.",
    loadReasonsError: "Die Gründe konnten nicht geladen werden. Bitte versuche es später noch einmal.",
    loadingReasons: "Meldegründe werden geladen...",
    openDialog: "Meldeformular öffnen",
    reason: "Grund",
    send: "Meldung senden",
    sending: "Meldung wird gesendet...",
    sent: "Meldung gesendet",
    title: "Meldung"
  },
  en: {
    aboutBook: "Report this book",
    aboutUser: "Report this user",
    alreadyBook: "You have already sent a report about this book.",
    alreadyUser: "You have already sent a report about this user.",
    autoClose: "This window will close automatically in:",
    chooseTarget: "Choose what you want to report above to continue.",
    close: "Close window",
    comment: "Comment",
    commentPlaceholder: "Briefly describe what should be reviewed",
    helper:
      "First choose whether the report is about the book or about the owner of this listing, then send your moderation comment.",
    loadReasonsError: "Report reasons could not be loaded. Please try again later.",
    loadingReasons: "Loading report reasons...",
    openDialog: "Open report dialog",
    reason: "Reason",
    send: "Send report",
    sending: "Sending report...",
    sent: "Report sent",
    title: "Report"
  },
  ru: {
    aboutBook: "Пожаловаться на книгу",
    aboutUser: "Пожаловаться на пользователя",
    alreadyBook: "Вы уже отправляли жалобу на эту книгу.",
    alreadyUser: "Вы уже отправляли жалобу на этого пользователя.",
    autoClose: "Это окно будет автоматически закрыто через:",
    chooseTarget: "Сначала выберите, на что именно вы хотите пожаловаться.",
    close: "Закрыть окно",
    comment: "Комментарий",
    commentPlaceholder: "Коротко опишите, что именно нужно проверить",
    helper:
      "Сначала выберите, относится ли жалоба к книге или к владельцу объявления, а затем отправьте комментарий для модерации.",
    loadReasonsError: "Не удалось загрузить причины жалобы. Попробуйте позже.",
    loadingReasons: "Загружаем причины жалобы...",
    openDialog: "Открыть окно жалобы",
    reason: "Причина",
    send: "Отправить жалобу",
    sending: "Отправляем жалобу...",
    sent: "Жалоба отправлена",
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
  const [targetType, setTargetType] = useState("BOOK");
  const [form, setForm] = useState(initialForm);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [closeDeadline, setCloseDeadline] = useState(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const text = reportText[locale] ?? reportText.en;

  const targetLocksQuery = useQuery({
    queryKey: ["report-target-locks", book.id, book.ownerUserId],
    refetchOnMount: "always",
    queryFn: async () => {
      const content = [];
      let pageIndex = 0;
      let totalPages = 1;

      while (pageIndex < totalPages) {
        const response = await apiRequest(`/report/user?pageIndex=${pageIndex}&pageSize=100`, {
          auth: true
        });
        const page = response.data ?? {};

        content.push(...(page.content ?? []));
        totalPages = page.totalPages ?? 0;
        pageIndex += 1;
      }

      return content;
    }
  });

  const existingTargetKeys = useMemo(
    () =>
      new Set(
        (targetLocksQuery.data ?? [])
          .filter((report) => report?.targetType && report?.targetId && report?.status === "OPEN")
          .map((report) => `${report.targetType}:${report.targetId}`)
      ),
    [targetLocksQuery.data]
  );

  const bookTargetKey = `BOOK:${book.id}`;
  const userTargetKey = `USER:${book.ownerUserId}`;
  const isBookAlreadyReported = existingTargetKeys.has(bookTargetKey);
  const isUserAlreadyReported = existingTargetKeys.has(userTargetKey);
  const selectedTargetKey = targetType ? `${targetType}:${resolveTargetId(book, targetType)}` : "";
  const alreadyReported = Boolean(selectedTargetKey) && existingTargetKeys.has(selectedTargetKey);
  const countdownActive = closeDeadline !== null;
  const closeSeconds = Math.max(1, Math.ceil(remainingMs / 1000));
  const progressDegrees = Math.max(0, Math.min(360, (remainingMs / REPORT_CLOSE_TIMEOUT_MS) * 360));

  useEffect(() => {
    if (!metadataQuery.data?.reportReasons?.length) {
      return;
    }

    setForm((current) => ({
      ...current,
      reason: current.reason || metadataQuery.data.reportReasons[0]
    }));
  }, [metadataQuery.data]);

  useEffect(() => {
    if (!closeDeadline || typeof window === "undefined") {
      return undefined;
    }

    const updateCountdown = () => {
      const nextRemainingMs = Math.max(0, closeDeadline - Date.now());
      setRemainingMs(nextRemainingMs);

      if (nextRemainingMs <= 0) {
        onClose();
        return false;
      }

      return true;
    };

    updateCountdown();
    const timerId = window.setInterval(() => {
      if (!updateCountdown()) {
        window.clearInterval(timerId);
      }
    }, 100);

    return () => window.clearInterval(timerId);
  }, [closeDeadline, onClose]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!targetType || alreadyReported || countdownActive || !form.comment.trim()) {
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
      await queryClient.invalidateQueries({ queryKey: ["report-target-locks", book.id, book.ownerUserId] });
      setSuccessMessage(response.message || text.sent);
      setCloseDeadline(Date.now() + REPORT_CLOSE_TIMEOUT_MS);
      setRemainingMs(REPORT_CLOSE_TIMEOUT_MS);
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
            disabled={pending || countdownActive}
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
            {isBookAlreadyReported ? (
              <span className="inline-message inline-message-error">{text.alreadyBook}</span>
            ) : null}
          </button>
          <button
            className={targetType === "USER" ? "choice-card choice-card-active" : "choice-card"}
            disabled={pending || countdownActive}
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
            {isUserAlreadyReported ? (
              <span className="inline-message inline-message-error">{text.alreadyUser}</span>
            ) : null}
          </button>
        </div>

        {metadataQuery.isPending ? <p className="muted-line">{text.loadingReasons}</p> : null}
        {metadataQuery.error ? (
          <p className="inline-message inline-message-error">
            {text.loadReasonsError}
          </p>
        ) : null}

        {targetType ? (
          <form className="content-stack" onSubmit={handleSubmit}>
            <label className="field">
              <span>{text.reason}</span>
              <PrettySelect
                ariaLabel={text.reason}
                disabled={alreadyReported || pending || countdownActive}
                onChange={(nextValue) =>
                  setForm((current) => ({ ...current, reason: nextValue }))
                }
                options={(metadataQuery.data?.reportReasons ?? []).map((reason) => ({
                  label: formatEnumLabel(reason),
                  value: reason
                }))}
                value={form.reason}
              />
            </label>

            <label className="field">
              <span>
                {text.comment}
                <span className="field-required-mark">*</span>
              </span>
              <textarea
                className="field-control"
                disabled={alreadyReported || pending || countdownActive}
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

            <div className="card-actions report-modal-actions">
              <button
                className="button"
                disabled={
                  pending ||
                  !form.reason ||
                  !form.comment.trim() ||
                  metadataQuery.isPending ||
                  targetLocksQuery.isPending ||
                  alreadyReported ||
                  countdownActive
                }
                type="submit"
              >
                {pending ? text.sending : text.send}
              </button>

              {countdownActive ? (
                <div className="report-modal-auto-close">
                  <span>{text.autoClose}</span>
                  <span
                    aria-hidden="true"
                    className="report-modal-countdown-ring"
                    style={{
                      background: `conic-gradient(from -90deg, rgba(31, 107, 88, 0.22) 0deg ${progressDegrees}deg, rgba(18, 32, 43, 0.08) ${progressDegrees}deg 360deg)`
                    }}
                  >
                    <span className="report-modal-countdown-core">{closeSeconds}</span>
                  </span>
                </div>
              ) : null}
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
