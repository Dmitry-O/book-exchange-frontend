import { Link } from "react-router-dom";
import { useMetadataQuery } from "../../shared/api/hooks";
import { useLocale } from "../../shared/i18n/LocaleContext";

export function HomePage() {
  const metadataQuery = useMetadataQuery();
  const metadata = metadataQuery.data;
  const { t } = useLocale();

  return (
    <div className="content-stack">
      <section className="hero-card">
        <div className="eyebrow">{t("homePage.phase")}</div>
        <h1>{t("homePage.title")}</h1>
        <p>{t("homePage.description")}</p>

        <div className="hero-actions">
          <Link className="button" to="/catalog">
            {t("homePage.openCatalog")}
          </Link>
          <Link className="button button-secondary" to="/login">
            {t("homePage.signIn")}
          </Link>
        </div>
      </section>

      <section className="cards-grid cards-grid-three">
        <article className="section-card">
          <h2>{t("homePage.catalogTitle")}</h2>
          <p>{t("homePage.catalogDescription")}</p>
        </article>
        <article className="section-card">
          <h2>{t("homePage.authTitle")}</h2>
          <p>{t("homePage.authDescription")}</p>
        </article>
        <article className="section-card">
          <h2>{t("homePage.workspaceTitle")}</h2>
          <p>{t("homePage.workspaceDescription")}</p>
        </article>
      </section>

      <section className="section-card">
        <h2>{t("homePage.metadataTitle")}</h2>
        {metadata ? (
          <div className="meta-grid">
            <MetaStat label={t("homePage.locales")} value={metadata.locales.length} />
            <MetaStat label={t("homePage.reportReasons")} value={metadata.reportReasons.length} />
            <MetaStat label={t("homePage.exchangeStatuses")} value={metadata.exchangeStatuses.length} />
            <MetaStat label={t("homePage.bookSortFields")} value={metadata.bookSortFields.length} />
          </div>
        ) : (
          <p>{t("homePage.metadataLoading")}</p>
        )}
      </section>
    </div>
  );
}

function MetaStat({ label, value }) {
  return (
    <div className="meta-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
