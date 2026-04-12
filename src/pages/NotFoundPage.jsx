import { Link } from "react-router-dom";
import { useLocale } from "../shared/i18n/LocaleContext";

export function NotFoundPage() {
  const { t } = useLocale();

  return (
    <section className="auth-shell">
      <div className="auth-panel">
        <span className="eyebrow">404</span>
        <h1>{t("notFound.title")}</h1>
        <p>{t("notFound.description")}</p>
        <Link className="button" to="/">
          {t("common.backHome")}
        </Link>
      </div>
    </section>
  );
}
