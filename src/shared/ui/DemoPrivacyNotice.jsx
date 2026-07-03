import { useLocale } from "../i18n/LocaleContext";
import { AlertTriangleIcon } from "./Icons";

const NOTICE_TEXT = {
  en: "This is a public demo environment. Do not enter real personal data.",
  de: "Dies ist eine öffentliche Demo-Umgebung. Bitte gib keine echten personenbezogenen Daten ein.",
  ru: "Это публичная demo-среда, не вводите реальные персональные данные."
};

const RESET_TEXT = {
  en: {
    primary: "Demo data resets daily.",
    secondary: "Changes are temporary."
  },
  de: {
    primary: "Demo-Daten werden täglich zurückgesetzt.",
    secondary: "Änderungen sind nur temporär."
  },
  ru: {
    primary: "Демо-данные сбрасываются ежедневно.",
    secondary: "Изменения временные."
  }
};

export function DemoPrivacyNotice({
  children,
  className = "",
  compact = false,
  includeReset = false
}) {
  const { locale } = useLocale();
  const noticeText = NOTICE_TEXT[locale] ?? NOTICE_TEXT.en;
  const resetText = RESET_TEXT[locale] ?? RESET_TEXT.en;
  const classes = [
    "demo-privacy-notice",
    compact ? "demo-privacy-notice-compact" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} role="note">
      <AlertTriangleIcon />
      <span className="demo-privacy-notice-copy">
        <span>{noticeText}</span>
        {includeReset ? (
          <span className="demo-privacy-notice-reset">
            <span>{resetText.primary} </span>
            <span className="demo-privacy-notice-reset-secondary">
              {resetText.secondary}
              {children ? <> {children}</> : null}
            </span>
          </span>
        ) : children ? (
          <> {children}</>
        ) : null}
      </span>
    </div>
  );
}
