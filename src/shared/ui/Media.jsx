import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "../i18n/LocaleContext";
import { getInitials, resolveMediaUrl } from "../lib/media";
import bookPlaceholderCover from "../assets/book-placeholder-cover.svg";
import bookPlaceholderCoverFull from "../assets/book-placeholder-cover-full.svg";

export function UserAvatar({ className = "", name, photoUrl, size = "md" }) {
  const { locale } = useLocale();
  const text = mediaText[locale] ?? mediaText.en;

  return (
    <MediaFrame
      alt={name ? `${name} ${text.profilePhoto}` : text.userProfilePhoto}
      className={className}
      label={getInitials(name, "U")}
      photoUrl={photoUrl}
      shape="avatar"
      size={size}
      subtitle={text.user}
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

export function BookCover({
  className = "",
  detectLegacyMockImage = false,
  expandable = false,
  placeholderVariant = "framed",
  photoUrl,
  size = "md",
  title,
  uploadedOnly = false
}) {
  const { locale } = useLocale();
  const text = mediaText[locale] ?? mediaText.en;

  return (
    <MediaFrame
      alt={title ? `${title} ${text.cover}` : text.bookCover}
      className={className}
      detectLegacyMockImage={detectLegacyMockImage}
      expandable={expandable}
      label={getInitials(title, "B")}
      photoUrl={photoUrl}
      shape="book"
      size={size}
      subtitle={text.book}
      placeholderVariant={placeholderVariant}
      uploadedOnly={uploadedOnly}
    />
  );
}

function MediaFrame({
  alt,
  className,
  detectLegacyMockImage = false,
  expandable = false,
  label,
  placeholderVariant = "framed",
  photoUrl,
  shape,
  size,
  subtitle,
  uploadedOnly = false
}) {
  const { locale } = useLocale();
  const text = mediaText[locale] ?? mediaText.en;
  const [isOpen, setIsOpen] = useState(false);
  const [hideLegacyMockImage, setHideLegacyMockImage] = useState(false);
  const src = resolveMediaUrl(photoUrl, { kind: shape, uploadedOnly });
  const effectiveSrc = hideLegacyMockImage ? "" : src;
  const classes = ["media-frame", `media-frame-${shape}`, `media-frame-${size}`, className]
    .filter(Boolean)
    .join(" ");
  const avatarFallbackClasses = ["media-avatar-fallback", `media-avatar-fallback-${size}`, className]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    let cancelled = false;

    setHideLegacyMockImage(false);

    if (!src || !detectLegacyMockImage || shape !== "book") {
      return () => {
        cancelled = true;
      };
    }

    void detectLegacyBookMockImage(src).then((isLegacyMockImage) => {
      if (!cancelled) {
        setHideLegacyMockImage(isLegacyMockImage);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [detectLegacyMockImage, shape, src]);

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
        {effectiveSrc ? (
          expandable ? (
            <button
              aria-label={`${text.open} ${alt}`}
              className="media-expand-trigger"
              onClick={() => setIsOpen(true)}
              type="button"
            >
              <img alt={alt} className="media-image" src={effectiveSrc} />
              <span className="media-expand-hint">{text.open}</span>
            </button>
          ) : (
            <img alt={alt} className="media-image" src={effectiveSrc} />
          )
        ) : (
          renderPlaceholder(shape, label, subtitle, placeholderVariant)
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
                    <span className="eyebrow">{text.imagePreview}</span>
                  </div>
                  <button
                    aria-label={text.closeImagePreview}
                    className="modal-close"
                    onClick={() => setIsOpen(false)}
                    type="button"
                  >
                    {text.close}
                  </button>
                </div>
                <img alt={alt} className="media-lightbox-image" src={effectiveSrc} />
              </section>
            </div>,
            document.body
          )
        : null}
    </>
  );
}

function renderPlaceholder(shape, label, subtitle, placeholderVariant) {
  if (shape === "book") {
    return (
      <img
        alt=""
        aria-hidden="true"
        className={
          placeholderVariant === "fullbleed"
            ? "media-placeholder-book-image media-placeholder-book-image-fullbleed"
            : placeholderVariant === "bare"
              ? "media-placeholder-book-image media-placeholder-book-image-bare"
              : "media-placeholder-book-image"
        }
        src={placeholderVariant === "fullbleed" ? bookPlaceholderCoverFull : bookPlaceholderCover}
      />
    );
  }

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

const legacyBookMockImageCache = new Map();

function detectLegacyBookMockImage(src) {
  const cached = legacyBookMockImageCache.get(src);

  if (cached !== undefined) {
    return Promise.resolve(cached);
  }

  const promise = new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve(false);
      return;
    }

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 24;
        canvas.height = 36;
        const context = canvas.getContext("2d", { willReadFrequently: true });

        if (!context) {
          legacyBookMockImageCache.set(src, false);
          resolve(false);
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        const result = isLegacyBookMockSignature(pixels, canvas.width, canvas.height);

        legacyBookMockImageCache.set(src, result);
        resolve(result);
      } catch {
        legacyBookMockImageCache.set(src, false);
        resolve(false);
      }
    };

    image.onerror = () => {
      legacyBookMockImageCache.set(src, false);
      resolve(false);
    };

    image.src = src;
  });

  legacyBookMockImageCache.set(src, promise);

  return promise.then((result) => {
    legacyBookMockImageCache.set(src, result);
    return result;
  });
}

function isLegacyBookMockSignature(pixels, width, height) {
  const background = samplePixel(pixels, width, height, 18, 7);
  const backgroundLower = samplePixel(pixels, width, height, 18, 29);
  const spine = samplePixel(pixels, width, height, 3, 18);
  const blobA = samplePixel(pixels, width, height, 13, 13);
  const blobB = samplePixel(pixels, width, height, 13, 19);
  const blobC = samplePixel(pixels, width, height, 13, 25);

  const backgroundLuma = luma(background);
  const backgroundLowerLuma = luma(backgroundLower);
  const spineLuma = luma(spine);
  const blobLumas = [blobA, blobB, blobC].map(luma);

  const mutedPalette = [background, backgroundLower, spine, blobA, blobB, blobC].every(isMutedGray);
  const brightBackground = backgroundLuma > 210 && backgroundLowerLuma > 205;
  const darkerSpine = spineLuma < backgroundLuma - 18 && spineLuma > 120;
  const stackedBlobs = blobLumas.every((value) => value < backgroundLuma - 14 && value > 135);
  const consistentBlobs = Math.max(...blobLumas) - Math.min(...blobLumas) < 24;

  return mutedPalette && brightBackground && darkerSpine && stackedBlobs && consistentBlobs;
}

function samplePixel(pixels, width, height, x, y) {
  const safeX = Math.max(0, Math.min(width - 1, x));
  const safeY = Math.max(0, Math.min(height - 1, y));
  const index = (safeY * width + safeX) * 4;

  return {
    r: pixels[index] ?? 0,
    g: pixels[index + 1] ?? 0,
    b: pixels[index + 2] ?? 0
  };
}

function luma({ r, g, b }) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function isMutedGray({ r, g, b }) {
  return Math.max(r, g, b) - Math.min(r, g, b) < 28;
}

const mediaText = {
  en: {
    book: "Book",
    bookCover: "Book cover",
    close: "Close",
    closeImagePreview: "Close image preview",
    cover: "cover",
    imagePreview: "Image preview",
    open: "Open",
    profilePhoto: "profile photo",
    user: "User",
    userProfilePhoto: "User profile photo"
  },
  de: {
    book: "Buch",
    bookCover: "Buchcover",
    close: "Schließen",
    closeImagePreview: "Bildvorschau schließen",
    cover: "Cover",
    imagePreview: "Bildvorschau",
    open: "Öffnen",
    profilePhoto: "Profilfoto",
    user: "Benutzer",
    userProfilePhoto: "Profilfoto des Benutzers"
  },
  ru: {
    book: "Книга",
    bookCover: "Обложка книги",
    close: "Закрыть",
    closeImagePreview: "Закрыть предпросмотр изображения",
    cover: "обложка",
    imagePreview: "Предпросмотр изображения",
    open: "Открыть",
    profilePhoto: "фото профиля",
    user: "Пользователь",
    userProfilePhoto: "Фото профиля пользователя"
  }
};
