const featureGroups = [
  {
    title: "Authentication",
    items: [
      "Register and email confirmation",
      "Login and refresh token flow",
      "Forgotten password and reset",
      "Logout and account removal"
    ]
  },
  {
    title: "Books",
    items: [
      "Public book search",
      "My books and exchanged books",
      "Create, edit, and delete book cards",
      "Gift mode and contact details"
    ]
  },
  {
    title: "Exchange Flow",
    items: [
      "Requests I sent",
      "Offers I received",
      "Approve or decline exchange",
      "Exchange history and details"
    ]
  },
  {
    title: "Moderation",
    items: [
      "Report user or book",
      "Admin users management",
      "Admin books and restore flow",
      "Admin reports and exchanges review"
    ]
  }
];

export default function App() {
  return (
    <div className="page-shell">
      <section className="hero">
        <div className="eyebrow">React starter for backend demo</div>
        <h1>Book Exchange Frontend</h1>
        <p className="hero-copy">
          A clean React workspace prepared for showcasing the API surface of the
          existing Spring Boot backend.
        </p>

        <div className="hero-grid">
          <article className="stat-card">
            <span className="stat-value">/api/v1</span>
            <span className="stat-label">Backend base path</span>
          </article>
          <article className="stat-card">
            <span className="stat-value">JWT + ETag</span>
            <span className="stat-label">Main integration concerns</span>
          </article>
          <article className="stat-card">
            <span className="stat-value">USER / ADMIN</span>
            <span className="stat-label">Primary app roles</span>
          </article>
        </div>
      </section>

      <section className="roadmap">
        {featureGroups.map((group) => (
          <article className="feature-card" key={group.title}>
            <h2>{group.title}</h2>
            <ul>
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}
