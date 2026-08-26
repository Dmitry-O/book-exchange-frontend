import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "../../shared/i18n/LocaleContext";
import { ExternalLinkIcon, VideoGuideIcon, XIcon } from "../../shared/ui/Icons";

const DemoVideoGuideContext = createContext(null);
const AUTO_OPEN_STORAGE_KEY = "book-exchange/demo-video-guide-auto-open";
const SEEN_VIDEO_STORAGE_KEY = "book-exchange/demo-video-guide-seen";

const VIDEO_GUIDE_COPY = {
  en: {
    close: "Close video guide",
    description: "A short walkthrough of the main demo flows.",
    open: "Open video guide",
    openExternal: "Open in a new tab",
    title: "Demo video guide"
  },
  de: {
    close: "Video-Guide schließen",
    description: "Ein kurzer Überblick über die wichtigsten Demo-Abläufe.",
    open: "Video-Guide öffnen",
    openExternal: "In neuem Tab öffnen",
    title: "Demo-Video-Guide"
  },
  ru: {
    close: "Закрыть видео-обзор",
    description: "Короткий обзор основных сценариев в демо-версии.",
    open: "Открыть видео-обзор",
    openExternal: "Открыть в новой вкладке",
    title: "Видео-обзор демо"
  }
};

export function DemoVideoGuideProvider({ children }) {
  const { locale } = useLocale();
  const copy = VIDEO_GUIDE_COPY[locale] ?? VIDEO_GUIDE_COPY.en;
  const videoUrl = useMemo(
    () => normalizeGoogleDriveVideoUrl(import.meta.env.VITE_DEMO_VIDEO_GUIDE_URL),
    []
  );
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!videoUrl || !readAutoOpenRequest()) {
      return;
    }

    clearAutoOpenRequest();

    if (readSeenVideoUrl() !== videoUrl) {
      setIsOpen(true);
    }
  }, [videoUrl]);

  const value = useMemo(
    () => ({
      hasVideoGuide: Boolean(videoUrl),
      openVideoGuide: () => setIsOpen(true),
      videoGuideLabel: copy.open
    }),
    [copy.open, videoUrl]
  );

  function handleClose() {
    if (videoUrl) {
      writeSeenVideoUrl(videoUrl);
    }

    setIsOpen(false);
  }

  return (
    <DemoVideoGuideContext.Provider value={value}>
      {children}
      {isOpen && videoUrl ? (
        <DemoVideoGuideModal copy={copy} onClose={handleClose} videoUrl={videoUrl} />
      ) : null}
    </DemoVideoGuideContext.Provider>
  );
}

export function useDemoVideoGuide() {
  const context = useContext(DemoVideoGuideContext);

  if (!context) {
    throw new Error("useDemoVideoGuide must be used within DemoVideoGuideProvider");
  }

  return context;
}

export function requestDemoVideoGuideAutoOpen() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(AUTO_OPEN_STORAGE_KEY, "true");
  } catch {
    // The guide remains available from the header when browser storage is blocked.
  }
}

function DemoVideoGuideModal({ copy, onClose, videoUrl }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="modal-backdrop video-guide-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <section
        aria-labelledby="demo-video-guide-title"
        aria-modal="true"
        className="modal-panel video-guide-modal"
        role="dialog"
      >
        <div className="video-guide-modal-header">
          <div className="video-guide-title-wrap">
            <span aria-hidden="true" className="video-guide-title-icon">
              <VideoGuideIcon />
            </span>
            <div>
              <h2 id="demo-video-guide-title">{copy.title}</h2>
              <p>{copy.description}</p>
            </div>
          </div>
          <button
            aria-label={copy.close}
            className="modal-close modal-close-icon"
            onClick={onClose}
            title={copy.close}
            type="button"
          >
            <XIcon />
          </button>
        </div>

        <div className="video-guide-frame">
          <iframe
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            src={videoUrl}
            title={copy.title}
          />
        </div>

        <a className="video-guide-external-link" href={videoUrl} rel="noreferrer" target="_blank">
          <ExternalLinkIcon />
          <span>{copy.openExternal}</span>
        </a>
      </section>
    </div>,
    document.body
  );
}

function normalizeGoogleDriveVideoUrl(value) {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase();

    if (url.protocol !== "https:" || (host !== "drive.google.com" && host !== "docs.google.com")) {
      return "";
    }

    const fileMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
    const fileId = fileMatch?.[1] ?? url.searchParams.get("id");

    if (fileId) {
      return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview`;
    }

    return url.toString();
  } catch {
    return "";
  }
}

function readAutoOpenRequest() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(AUTO_OPEN_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function clearAutoOpenRequest() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(AUTO_OPEN_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup errors.
  }
}

function readSeenVideoUrl() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return window.localStorage.getItem(SEEN_VIDEO_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeSeenVideoUrl(videoUrl) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(SEEN_VIDEO_STORAGE_KEY, videoUrl);
  } catch {
    // The guide can still be opened manually from the header.
  }
}
