import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useNavigate } from "react-router-dom";
import { useLocale } from "../i18n/LocaleContext";

const UnsavedChangesContext = createContext(null);

const confirmDialogCopy = {
  en: {
    cancel: "Cancel",
    confirm: "Continue",
    title: "Confirm action",
    unsavedCancel: "Stay here",
    unsavedConfirm: "Leave page",
    unsavedMessage: "You have unsaved changes. If you leave this page, they will be lost.",
    unsavedTitle: "Unsaved changes"
  },
  de: {
    cancel: "Abbrechen",
    confirm: "Fortfahren",
    title: "Aktion bestätigen",
    unsavedCancel: "Hier bleiben",
    unsavedConfirm: "Seite verlassen",
    unsavedMessage: "Du hast ungespeicherte Änderungen. Wenn du diese Seite verlässt, gehen sie verloren.",
    unsavedTitle: "Ungespeicherte Änderungen"
  },
  ru: {
    cancel: "Отмена",
    confirm: "Продолжить",
    title: "Подтвердите действие",
    unsavedCancel: "Остаться",
    unsavedConfirm: "Покинуть страницу",
    unsavedMessage: "У вас есть несохранённые изменения. Если покинуть страницу сейчас, они будут потеряны.",
    unsavedTitle: "Несохранённые изменения"
  }
};

export function UnsavedChangesProvider({ children }) {
  const navigate = useNavigate();
  const { locale } = useLocale();
  const copy = confirmDialogCopy[locale] ?? confirmDialogCopy.en;
  const guardsRef = useRef(new Map());
  const [dialog, setDialog] = useState(null);

  const getActiveGuard = useCallback(() => {
    for (const guard of guardsRef.current.values()) {
      if (guard.when) {
        return guard;
      }
    }

    return null;
  }, []);

  const requestConfirmation = useCallback(
    (options = {}) =>
      new Promise((resolve) => {
        const normalizedOptions =
          typeof options === "string" ? { message: options } : { ...options };

        setDialog({
          cancelLabel: normalizedOptions.cancelLabel ?? copy.cancel,
          confirmLabel: normalizedOptions.confirmLabel ?? copy.confirm,
          message: normalizedOptions.message ?? "",
          resolve,
          title: normalizedOptions.title ?? copy.title,
          variant: normalizedOptions.variant ?? "default"
        });
      }),
    [copy.cancel, copy.confirm, copy.title]
  );

  const closeDialog = useCallback((confirmed) => {
    setDialog((current) => {
      if (current) {
        current.resolve(confirmed);
      }

      return null;
    });
  }, []);

  const confirmNavigation = useCallback(async () => {
    const activeGuard = getActiveGuard();

    if (!activeGuard) {
      return true;
    }

    return requestConfirmation(activeGuard);
  }, [getActiveGuard, requestConfirmation]);

  const registerGuard = useCallback((id, guard) => {
    guardsRef.current.set(id, guard);

    return () => {
      guardsRef.current.delete(id);
    };
  }, []);

  useEffect(() => {
    function handleDocumentClick(event) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      ) {
        return;
      }

      const clickTarget =
        event.target instanceof Element ? event.target : event.target?.parentElement;
      const anchor = clickTarget?.closest?.("a[href]");

      if (!anchor || anchor.target || anchor.hasAttribute("download")) {
        return;
      }

      const nextUrl = new URL(anchor.href, window.location.href);

      if (nextUrl.origin !== window.location.origin) {
        return;
      }

      if (
        nextUrl.pathname === window.location.pathname &&
        nextUrl.search === window.location.search &&
        nextUrl.hash === window.location.hash
      ) {
        return;
      }

      const activeGuard = getActiveGuard();

      if (!activeGuard) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      void requestConfirmation(activeGuard).then((confirmed) => {
        if (confirmed) {
          navigate(`${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
        }
      });
    }

    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [getActiveGuard, navigate, requestConfirmation]);

  useEffect(() => {
    function handleBeforeUnload(event) {
      if (!getActiveGuard()) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [getActiveGuard]);

  const value = useMemo(
    () => ({
      confirmNavigation,
      registerGuard,
      requestConfirmation
    }),
    [confirmNavigation, registerGuard, requestConfirmation]
  );

  return (
    <UnsavedChangesContext.Provider value={value}>
      {children}
      {dialog ? (
        <div className="modal-backdrop confirmation-modal-backdrop" role="presentation">
          <section
            aria-modal="true"
            className={`confirmation-modal confirmation-modal-${dialog.variant}`}
            role="dialog"
          >
            <div className="confirmation-modal-copy">
              <h2>{dialog.title}</h2>
              {dialog.message ? <p>{dialog.message}</p> : null}
            </div>
            <div className="confirmation-modal-actions">
              <button
                className="button button-secondary"
                onClick={() => closeDialog(false)}
                type="button"
              >
                {dialog.cancelLabel}
              </button>
              <button className="button" onClick={() => closeDialog(true)} type="button">
                {dialog.confirmLabel}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChangesGuard(when, options) {
  const { locale } = useLocale();
  const context = useContext(UnsavedChangesContext);
  const idRef = useRef(Symbol("unsaved-changes-guard"));
  const copy = confirmDialogCopy[locale] ?? confirmDialogCopy.en;
  const resolvedOptions = useMemo(() => {
    if (typeof options === "string") {
      return {
        cancelLabel: copy.unsavedCancel,
        confirmLabel: copy.unsavedConfirm,
        message: options,
        title: copy.unsavedTitle,
        variant: "warning"
      };
    }

    return {
      cancelLabel: options?.cancelLabel ?? copy.unsavedCancel,
      confirmLabel: options?.confirmLabel ?? copy.unsavedConfirm,
      message: options?.message ?? copy.unsavedMessage,
      title: options?.title ?? copy.unsavedTitle,
      variant: options?.variant ?? "warning"
    };
  }, [
    copy.unsavedCancel,
    copy.unsavedConfirm,
    copy.unsavedMessage,
    copy.unsavedTitle,
    options
  ]);

  useEffect(() => {
    if (!context) {
      return undefined;
    }

    return context.registerGuard(idRef.current, {
      ...resolvedOptions,
      when: Boolean(when)
    });
  }, [context, resolvedOptions, when]);
}

export function useUnsavedChangesPrompt() {
  const context = useContext(UnsavedChangesContext);

  return context?.confirmNavigation ?? (() => Promise.resolve(true));
}

export function useConfirmDialog() {
  const context = useContext(UnsavedChangesContext);

  return context?.requestConfirmation ?? ((options) => {
    const normalizedOptions = typeof options === "string" ? { message: options } : options ?? {};

    return Promise.resolve(window.confirm(normalizedOptions.message ?? ""));
  });
}
