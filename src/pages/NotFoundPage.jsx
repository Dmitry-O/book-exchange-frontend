import { Link } from "react-router-dom";
import { useLocale } from "../shared/i18n/LocaleContext";

export function NotFoundPage() {
  const { t } = useLocale();

  return (
    <section className="auth-shell">
      <div className="auth-panel not-found-panel">
        <h1 className="auth-panel-title">{t("notFound.title")}</h1>
        <div className="not-found-content">
          <div className="not-found-copy">
            <p>{t("notFound.description")}</p>
            <Link className="button not-found-home-button" to="/">
              {t("common.backHome")}
            </Link>
          </div>
          <img alt="" className="not-found-image" src="/not_found.png" />
        </div>
      </div>
    </section>
  );
}
