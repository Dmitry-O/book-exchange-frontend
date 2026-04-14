import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { apiRequest } from "../../shared/api/http";
import { useLocale } from "../../shared/i18n/LocaleContext";
import { formatBookCategoryLabel } from "../../shared/lib/bookCategory";
import { BookCover, UserAvatar } from "../../shared/ui/Media";
import { RequestCreationCard } from "../exchanges/pages";
import { ReportActionCard } from "../reports/ReportActionCard";
import { ErrorBlock, LoadingBlock } from "../../shared/ui/StateBlocks";

export function PublicBookPage() {
  const { bookId } = useParams();
  const { locale } = useLocale();

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
        <div className="book-detail-header-bar">
          <Link aria-label="Back to catalog" className="back-link" to="/catalog">
            <ArrowLeftIcon />
          </Link>
        </div>

        <div className="book-hero-layout">
          <BookCover expandable photoUrl={book.photoUrl} size="hero" title={book.name} />

          <div>
            <h1>{book.name}</h1>
            <p>{book.description || "No public description available for this book."}</p>

            <div className="entity-inline entity-inline-spaced">
              <UserAvatar name={book.ownerNickname} photoUrl={book.ownerPhotoUrl} size="sm" />
              <span>{book.ownerNickname || "Unknown owner"}</span>
            </div>
          </div>
        </div>

        <div className="book-detail-stats">
          <DetailStat label="Author" value={book.author} />
          <DetailStat
            label="Category"
            value={formatBookCategoryLabel(book.category, locale, "Not available")}
          />
          <DetailStat label="Year" value={book.publicationYear} />
          <DetailStat label="City" value={book.city} />
        </div>
      </header>

      <section className="detail-grid">
        <article className="section-card">
          <h2>About this book</h2>
          <dl className="detail-list">
            <div>
              <dt>Owner</dt>
              <dd>{book.ownerNickname || "Not available"}</dd>
            </div>
            <div>
              <dt>Availability</dt>
              <dd>{book.isGift ? "Gift" : "Exchange"}</dd>
            </div>
            <div>
              <dt>Publication year</dt>
              <dd>{book.publicationYear || "Not available"}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{book.city || "Not available"}</dd>
            </div>
          </dl>
        </article>

        <RequestCreationCard book={book} />
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

function ArrowLeftIcon() {
  return (
    <svg aria-hidden="true" className="icon-svg" viewBox="0 0 24 24">
      <path
        d="M14.75 5.75 8.5 12l6.25 6.25"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
