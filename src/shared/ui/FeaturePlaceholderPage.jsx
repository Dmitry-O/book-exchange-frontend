export function FeaturePlaceholderPage({ title, summary, checks }) {
  return (
    <section className="content-stack">
      <header className="section-card">
        <h1>{title}</h1>
        <p>{summary}</p>
      </header>

      <section className="section-card">
        <h2>What Will Land Here</h2>
        <ul className="clean-list">
          {checks.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </section>
  );
}
