export function Pagination({ page, totalPages, onChange }) {
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
        Previous
      </button>
      <span className="pagination-label">
        Page {totalPages === 0 ? 0 : page + 1} of {totalPages}
      </span>
      <button
        className="button button-secondary"
        disabled={isLastPage}
        onClick={() => onChange(page + 1)}
        type="button"
      >
        Next
      </button>
    </div>
  );
}
