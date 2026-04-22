import { useLocale } from "../i18n/LocaleContext";

export function Pagination({ page, totalPages, onChange }) {
  const { locale } = useLocale();
  const text = paginationText[locale] ?? paginationText.en;
  const isFirstPage = page <= 0;
  const isLastPage = totalPages <= 1 || page >= totalPages - 1;

  return (
    <div className="pagination">
      <button
        className="button button-secondary"
        disabled={isFirstPage}
        onClick={() => onChange(page - 1)}
        type="button"
      >
        {text.previous}
      </button>
      <span className="pagination-label">
        {text.page} {totalPages === 0 ? 0 : page + 1} {text.of} {totalPages}
      </span>
      <button
        className="button button-secondary"
        disabled={isLastPage}
        onClick={() => onChange(page + 1)}
        type="button"
      >
        {text.next}
      </button>
    </div>
  );
}

const paginationText = {
  en: {
    next: "Next",
    of: "of",
    page: "Page",
    previous: "Previous"
  },
  de: {
    next: "Weiter",
    of: "von",
    page: "Seite",
    previous: "Zurück"
  },
  ru: {
    next: "Далее",
    of: "из",
    page: "Страница",
    previous: "Назад"
  }
};
