import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { apiRequest } from "../../shared/api/http";
import { useAuth } from "../../shared/auth/AuthContext";
import { useLocale } from "../../shared/i18n/LocaleContext";
import { rt, rtf } from "../../shared/i18n/rawText";
import { formatBookCategoryLabel, getBookCategoryTagStyle } from "../../shared/lib/bookCategory";
import { getCityDisplayName } from "../../shared/lib/cities";
import { formatDateTimeReadable, formatEnumLabel } from "../../shared/lib/format";
import { BookCover, UserAvatar } from "../../shared/ui/Media";
import { ArrowLeftIcon, ExternalLinkIcon, GiftIcon } from "../../shared/ui/Icons";
import { RequestCreationCard } from "../exchanges/pages";
import { ReportActionCard } from "../reports/ReportActionCard";
import { ErrorBlock, LoadingBlock } from "../../shared/ui/StateBlocks";

const publicBookText = {
  de: {
    authorLabel: "Autor",
    ownerView: "Besitzeransicht öffnen"
  },
  en: {
    authorLabel: "Author",
    ownerView: "Open owner view"
  },
  ru: {
    authorLabel: "Автор",
    ownerView: "Открыть владелецкую страницу"
  }
};

export function PublicBookPage() {
  const { bookId } = useParams();
  const { locale } = useLocale();
  const { isAuthenticated, user } = useAuth();
  const text = publicBookText[locale] ?? publicBookText.en;

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
    return <LoadingBlock label={rt(locale, "Loading book details")} />;
  }

  if (bookQuery.error) {
    return <ErrorBlock error={bookQuery.error} title={rt(locale, "Book could not be loaded")} />;
  }

  const book = bookQuery.data;
  const isOwnBook = isAuthenticated && user?.id === book.ownerUserId;

  return (
    <section className="content-stack">
      <header className="section-card book-detail-hero">
        <div className="book-detail-header-bar">
          <Link aria-label={rt(locale, "Back to catalog")} className="back-link" to="/catalog">
            <ArrowLeftIcon />
          </Link>

          <div className="hero-icon-actions">
            {isOwnBook ? (
              <Link
                aria-label={text.ownerView}
                className="icon-button"
                title={text.ownerView}
                to={`/app/my-books/${book.id}`}
              >
                <ExternalLinkIcon />
              </Link>
            ) : (
              <ReportActionCard book={book} variant="icon" />
            )}
          </div>
        </div>

        <div className="book-hero-layout">
          <BookCover expandable photoUrl={book.photoUrl} size="hero" title={book.name} />

          <div>
            <div className="book-hero-tags">
              <span className="category-chip" style={getBookCategoryTagStyle(book.category)}>
                {formatBookCategoryLabel(book.category, locale, rt(locale, "Not available"))}
              </span>
              {book.isGift ? (
                <span aria-label={rt(locale, "Gift")} className="gift-icon-badge" title={rt(locale, "Gift")}>
                  <GiftIcon />
                </span>
              ) : null}
              {book.isExchanged ? (
                <span className="status-pill status-pill-success">{rt(locale, "Exchanged")}</span>
              ) : null}
            </div>
            <h1>{book.name}</h1>

            <div className="entity-inline entity-inline-spaced book-detail-owner">
              <UserAvatar name={book.ownerNickname} photoUrl={book.ownerPhotoUrl} size="sm" />
              <span>{book.ownerNickname || rt(locale, "Unknown owner")}</span>
            </div>

            <p className="book-detail-description">
              <strong>{rt(locale, "Description")}:</strong>{" "}
              {book.description || rt(locale, "No public description available for this book.")}
            </p>

            <div className="book-hero-facts">
              <p>{text.authorLabel}: {book.author || rt(locale, "Not available")}</p>
              <p>{rt(locale, "Publication year")}: {renderValue(locale, book.publicationYear)}</p>
              <p>
                {formatEnumLabel("CITY")}:{" "}
                {book.city ? getCityDisplayName(book.city, locale) : rt(locale, "Not available")}
              </p>
              {book.contactDetails ? <p>{rt(locale, "Contact details")}: {book.contactDetails}</p> : null}
            </div>

            <div className="book-hero-timeline">
              {book.meta?.createdAt ? (
                <p>{rtf(locale, "Created on {value}", { value: formatDateTimeReadable(book.meta?.createdAt) })}</p>
              ) : null}
              {book.meta?.updatedAt ? (
                <p>{rtf(locale, "Updated on {value}", { value: formatDateTimeReadable(book.meta?.updatedAt) })}</p>
              ) : null}
              {book.meta?.deletedAt ? (
                <p>{rtf(locale, "Deleted on {value}", { value: formatDateTimeReadable(book.meta?.deletedAt) })}</p>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {!isOwnBook ? (
        <section className="content-stack">
          <RequestCreationCard book={book} />
        </section>
      ) : null}
    </section>
  );
}

function renderValue(locale, value) {
  return value === null || value === undefined || value === "" ? rt(locale, "Not available") : value;
}
