import { Link } from "react-router-dom";
import { useMetadataQuery } from "../../shared/api/hooks";

export function HomePage() {
  const metadataQuery = useMetadataQuery();
  const metadata = metadataQuery.data;

  return (
    <div className="content-stack">
      <section className="hero-card">
        <div className="eyebrow">Phase 1</div>
        <h1>Frontend foundation around your backend is now taking shape</h1>
        <p>
          This phase wires the React app to your live API with real auth, metadata
          bootstrap, public catalog pages, and the first protected account screens.
        </p>

        <div className="hero-actions">
          <Link className="button" to="/catalog">
            Open catalog
          </Link>
          <Link className="button button-secondary" to="/login">
            Sign in
          </Link>
        </div>
      </section>

      <section className="cards-grid cards-grid-three">
        <article className="section-card">
          <h2>Public catalog</h2>
          <p>Search and open public books through the real `/book/search` and `/book/{'{id}'}` endpoints.</p>
        </article>
        <article className="section-card">
          <h2>Real auth flow</h2>
          <p>Login, registration, email verification, resend-confirmation, and password recovery are connected.</p>
        </article>
        <article className="section-card">
          <h2>Protected account area</h2>
          <p>Profile, security, unread updates, and my reports already live behind auth guards.</p>
        </article>
      </section>

      <section className="section-card">
        <h2>Metadata snapshot</h2>
        {metadata ? (
          <div className="meta-grid">
            <MetaStat label="Locales" value={metadata.locales.length} />
            <MetaStat label="Report reasons" value={metadata.reportReasons.length} />
            <MetaStat label="Exchange statuses" value={metadata.exchangeStatuses.length} />
            <MetaStat label="Book sort fields" value={metadata.bookSortFields.length} />
          </div>
        ) : (
          <p>Metadata is loading.</p>
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
