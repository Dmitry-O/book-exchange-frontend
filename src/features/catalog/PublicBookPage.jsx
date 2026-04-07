import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { apiRequest } from "../../shared/api/http";
import { RequestCreationCard } from "../exchanges/pages";
import { ReportActionCard } from "../reports/ReportActionCard";
import { ErrorBlock, LoadingBlock } from "../../shared/ui/StateBlocks";

export function PublicBookPage() {
  const { bookId } = useParams();

  const bookQuery = useQuery({
    queryKey: ["public-book", bookId],
    enabled: Boolean(bookId),
    queryFn: async () => {
      const response = await apiRequest(`/book/${bookId}`);
      return {
        ...response.data,
        __version: response.eTag ?? response.data?.version ?? null
      };
    }
  });

  if (bookQuery.isPending) {
    return <LoadingBlock label="Loading book details" />;
  }

  if (bookQuery.error) {
    return <ErrorBlock error={bookQuery.error} title="Book could not be loaded" />;
  }

  const book = bookQuery.data;

  return (
    <section className="content-stack">
      <header className="section-card book-detail-hero">
        <div>
          <span className="eyebrow">{book.isGift ? "Gift" : "Exchange"}</span>
          <h1>{book.name}</h1>
          <p>{book.description || "No public description available for this book."}</p>
        </div>

        <div className="book-detail-stats">
          <DetailStat label="Author" value={book.author} />
          <DetailStat label="Category" value={book.category} />
          <DetailStat label="Year" value={book.publicationYear} />
          <DetailStat label="City" value={book.city} />
        </div>
      </header>

      <section className="detail-grid">
        <article className="section-card">
          <h2>Owner data exposed for frontend actions</h2>
          <dl className="detail-list">
            <div>
              <dt>Owner nickname</dt>
              <dd>{book.ownerNickname || "Not available"}</dd>
            </div>
            <div>
              <dt>Owner user id</dt>
              <dd>{book.ownerUserId ?? "Not available"}</dd>
            </div>
            <div>
              <dt>Book id</dt>
              <dd>{book.id}</dd>
            </div>
            <div>
              <dt>Version / ETag</dt>
              <dd>{book.__version ?? book.version ?? "Not available"}</dd>
            </div>
          </dl>
        </article>

        <RequestCreationCard book={book} />
      </section>

      <section className="section-card">
        <h2>Navigation</h2>
        <p>
          You can use this public book page as the entry point for creating an exchange request
          with one of your own books.
        </p>

        <div className="card-actions">
          <Link className="button button-secondary" to="/catalog">
            Back to catalog
          </Link>
          <Link className="button button-secondary" to="/app/exchanges/requests">
            Open my requests
          </Link>
        </div>
      </section>

      <ReportActionCard book={book} />
    </section>
  );
}

function DetailStat({ label, value }) {
  return (
    <div className="meta-stat">
      <strong>{value === null || value === undefined || value === "" ? "Not available" : value}</strong>
      <span>{label}</span>
    </div>
  );
}
