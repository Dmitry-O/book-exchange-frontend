import { useLocale } from "../i18n/LocaleContext";
import { rt } from "../i18n/rawText";

export function FeaturePlaceholderPage({ title, summary, checks }) {
  const { locale } = useLocale();

  return (
    <section className="content-stack">
      <header className="section-card">
        <h1>{title}</h1>
        <p>{summary}</p>
      </header>

      <section className="section-card">
        <h2>{rt(locale, "What will be added here")}</h2>
        <ul className="clean-list">
          {checks.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </section>
  );
}
