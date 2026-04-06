import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="auth-shell">
      <div className="auth-panel">
        <span className="eyebrow">404</span>
        <h1>Page not found</h1>
        <p>The route exists in the frontend app, but this particular page has not been defined.</p>
        <Link className="button" to="/">
          Back home
        </Link>
      </div>
    </section>
  );
}
