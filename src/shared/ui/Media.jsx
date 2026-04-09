import { useState } from "react";
import { createPortal } from "react-dom";
import { getInitials, resolveMediaUrl } from "../lib/media";

export function UserAvatar({ className = "", name, photoUrl, size = "md" }) {
  return (
    <MediaFrame
      alt={name ? `${name} profile photo` : "User profile photo"}
      className={className}
      label={getInitials(name, "U")}
      photoUrl={photoUrl}
      shape="avatar"
      size={size}
      subtitle="User"
    />
  );
}

export function UserIdentityInline({
  children,
  className = "",
  name,
  photoUrl,
  size = "sm",
}) {
  const classes = ["user-identity-inline", className].filter(Boolean).join(" ");

  return (
    <div className={classes}>
      <UserAvatar name={name} photoUrl={photoUrl} size={size} />
      <div className="user-identity-inline-copy">{children}</div>
    </div>
  );
}

export function BookCover({ className = "", expandable = false, photoUrl, size = "md", title }) {
  return (
    <MediaFrame
      alt={title ? `${title} cover` : "Book cover"}
      className={className}
      expandable={expandable}
      label={getInitials(title, "B")}
      photoUrl={photoUrl}
      shape="book"
      size={size}
      subtitle="Book"
    />
  );
}

function MediaFrame({ alt, className, expandable = false, label, photoUrl, shape, size, subtitle }) {
  const [isOpen, setIsOpen] = useState(false);
  const src = resolveMediaUrl(photoUrl);
  const classes = ["media-frame", `media-frame-${shape}`, `media-frame-${size}`, className]
    .filter(Boolean)
    .join(" ");
  const avatarFallbackClasses = ["media-avatar-fallback", `media-avatar-fallback-${size}`, className]
    .filter(Boolean)
    .join(" ");

  if (!src && shape === "avatar") {
    return (
      <div aria-label={alt} className={avatarFallbackClasses}>
        <strong>{label}</strong>
      </div>
    );
  }

  return (
    <>
      <div className={classes}>
        {src ? (
          expandable ? (
            <button
              aria-label={`Open ${alt}`}
              className="media-expand-trigger"
              onClick={() => setIsOpen(true)}
              type="button"
            >
              <img alt={alt} className="media-image" src={src} />
              <span className="media-expand-hint">Open</span>
            </button>
          ) : (
            <img alt={alt} className="media-image" src={src} />
          )
        ) : (
          renderPlaceholder(shape, label, subtitle)
        )}
      </div>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="modal-backdrop media-lightbox-backdrop"
              onClick={(event) => {
                if (event.target === event.currentTarget) {
                  setIsOpen(false);
                }
              }}
              role="presentation"
            >
              <section aria-modal="true" className="modal-panel media-lightbox-panel" role="dialog">
                <div className="row-between">
                  <div>
                    <span className="eyebrow">Image preview</span>
                  </div>
                  <button
                    aria-label="Close image preview"
                    className="modal-close"
                    onClick={() => setIsOpen(false)}
                    type="button"
                  >
                    X
                  </button>
                </div>
                <img alt={alt} className="media-lightbox-image" src={src} />
              </section>
            </div>,
            document.body
          )
        : null}
    </>
  );
}

function renderPlaceholder(shape, label, subtitle) {
  return (
    <div className="media-placeholder media-placeholder-book">
      <div className="book-placeholder-illustration">
        <span className="book-placeholder-spine" />
        <span className="book-placeholder-line book-placeholder-line-primary" />
        <span className="book-placeholder-line book-placeholder-line-mid" />
        <span className="book-placeholder-line book-placeholder-line-short" />
      </div>
    </div>
  );
}
