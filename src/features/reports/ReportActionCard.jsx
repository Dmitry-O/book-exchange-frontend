import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useMetadataQuery } from "../../shared/api/hooks";
import { apiRequest } from "../../shared/api/http";
import { useAuth } from "../../shared/auth/AuthContext";
import { formatEnumLabel, trimFormPayload } from "../../shared/lib/format";

const initialForm = {
  reason: "",
  comment: ""
};

export function ReportActionCard({ book }) {
  const { isAuthenticated, user } = useAuth();
  const isOwnBook = isAuthenticated && user?.id === book.ownerUserId;
  const [isOpen, setIsOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <section className="section-card">
        <h2>Reporting</h2>
        <p>Sign in if you want to send a moderation report about this book or its owner.</p>
        <div className="card-actions">
          <Link className="button" to="/login">
            Sign in
          </Link>
          <Link className="button button-secondary" to="/register">
            Register
          </Link>
        </div>
      </section>
    );
  }

  if (isOwnBook) {
    return (
      <section className="section-card">
        <h2>Reporting</h2>
        <p>This is your own listing, so reporting actions are intentionally hidden here.</p>
      </section>
    );
  }

  return (
    <>
      <section className="section-card">
        <h2>Reporting</h2>
        <p>
          If this listing or its owner needs moderation review, open the report dialog and choose
          what exactly should be reported.
        </p>

        <div className="card-actions">
          <button className="button button-secondary" onClick={() => setIsOpen(true)} type="button">
            Open report dialog
          </button>
          <Link className="button button-secondary" to="/app/my-reports">
            Open my reports
          </Link>
        </div>
      </section>

      {isOpen ? <ReportModal book={book} onClose={() => setIsOpen(false)} /> : null}
    </>
  );
}

function ReportModal({ book, onClose }) {
  const queryClient = useQueryClient();
  const metadataQuery = useMetadataQuery();
  const [targetType, setTargetType] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

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
      const response = await apiRequest(`/${"report"}/${resolveTargetId(book, targetType)}`, {
        method: "POST",
        auth: true,
        body: {
          targetType,
          ...trimFormPayload(form)
        }
      });

      await queryClient.invalidateQueries({ queryKey: ["my-reports"] });
      setSuccessMessage(response.message || "Your report has been sent.");
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

  return (
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
        className="modal-panel"
        role="dialog"
      >
        <div className="row-between">
          <div>
            <span className="eyebrow">Report</span>
            <h2>Moderation report</h2>
          </div>
          <button className="modal-close" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <p className="muted-line">
          First choose whether the report is about the book listing or about the owner of this
          listing. Then send the moderation comment.
        </p>

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
            <strong>Report this book</strong>
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
            <strong>Report this user</strong>
            <span>{book.ownerNickname}</span>
          </button>
        </div>

        {metadataQuery.isPending ? <p className="muted-line">Loading report reasons...</p> : null}
        {metadataQuery.error ? (
          <p className="inline-message inline-message-error">
            {metadataQuery.error.message}
          </p>
        ) : null}

        {targetType ? (
          <form className="content-stack" onSubmit={handleSubmit}>
            <label className="field">
              <span>Reason</span>
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
              <span>Comment</span>
              <textarea
                className="field-control"
                onChange={(event) =>
                  setForm((current) => ({ ...current, comment: event.target.value }))
                }
                placeholder="Describe what happened and why this should be reviewed"
                required
                rows={4}
                value={form.comment}
              />
            </label>

            {successMessage ? (
              <p className="inline-message inline-message-success">{successMessage}</p>
            ) : null}
            {error ? <p className="inline-message inline-message-error">{error.message}</p> : null}

            <div className="card-actions">
              <button
                className="button"
                disabled={pending || !form.reason || metadataQuery.isPending}
                type="submit"
              >
                {pending ? "Sending report..." : `Send ${targetType.toLowerCase()} report`}
              </button>
              <button className="button button-secondary" onClick={onClose} type="button">
                Done
              </button>
            </div>
          </form>
        ) : (
          <p className="muted-line">Choose one target above to continue.</p>
        )}
      </section>
    </div>
  );
}

function resolveTargetId(book, targetType) {
  return targetType === "USER" ? book.ownerUserId : book.id;
}
