import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { DEFAULT_PAGE_SIZE } from "../../shared/api/config";
import { useMetadataQuery } from "../../shared/api/hooks";
import { apiRequest } from "../../shared/api/http";
import { useLocale } from "../../shared/i18n/LocaleContext";
import { buildQueryString, formatEnumLabel } from "../../shared/lib/format";
import { BookCover, UserIdentityInline } from "../../shared/ui/Media";
import { Pagination } from "../../shared/ui/Pagination";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "../../shared/ui/StateBlocks";

const initialFilters = {
  author: "",
  category: "",
  city: "",
  publicationYear: "",
  isGift: "",
  searchText: "",
  sortBy: "",
  sortDirection: "ASC"
};

export function CatalogPage() {
  const metadataQuery = useMetadataQuery();
  const { t } = useLocale();
  const [filters, setFilters] = useState(initialFilters);
  const [pageIndex, setPageIndex] = useState(0);

  const queryString = useMemo(
    () =>
      buildQueryString({
        pageIndex,
        pageSize: DEFAULT_PAGE_SIZE,
        ...filters
      }),
    [filters, pageIndex]
  );

  const booksQuery = useQuery({
    queryKey: ["catalog", queryString],
    queryFn: async () => {
      const response = await apiRequest(`/book/search?${queryString}`);
      return response.data;
    }
  });

  function updateFilter(name, value) {
    setPageIndex(0);
    setFilters((current) => ({
      ...current,
      [name]: value
    }));
  }

  const books = booksQuery.data?.content ?? [];
  const totalPages = booksQuery.data?.totalPages ?? 0;
  const totalElements = booksQuery.data?.totalElements ?? 0;

  return (
    <section className="content-stack catalog-page">
      <header className="section-card">
        <span className="eyebrow">{t("catalog.eyebrow")}</span>
        <h1>{t("catalog.title")}</h1>
        <p>{t("catalog.description")}</p>
      </header>

      <section className="section-card">
        <div className="filters-grid">
          <Field
            label={t("catalog.searchText")}
            onChange={(value) => updateFilter("searchText", value)}
            value={filters.searchText}
          />
          <Field label={t("catalog.author")} onChange={(value) => updateFilter("author", value)} value={filters.author} />
          <Field
            label={t("catalog.category")}
            onChange={(value) => updateFilter("category", value)}
            value={filters.category}
          />
          <Field label={t("catalog.city")} onChange={(value) => updateFilter("city", value)} value={filters.city} />
          <Field
            label={t("catalog.publicationYear")}
            onChange={(value) => updateFilter("publicationYear", value)}
            type="number"
            value={filters.publicationYear}
          />
          <SelectField
            label={t("catalog.giftOnly")}
            onChange={(value) => updateFilter("isGift", value)}
            options={[
              { label: t("catalog.all"), value: "" },
              { label: t("catalog.giftOnlyOption"), value: "true" },
              { label: t("catalog.exchangeOnly"), value: "false" }
            ]}
            value={filters.isGift}
          />
          <SelectField
            label={t("catalog.sortField")}
            onChange={(value) => updateFilter("sortBy", value)}
            options={[
              { label: t("catalog.defaultSort"), value: "" },
              ...((metadataQuery.data?.bookSortFields ?? []).map((item) => ({
                label: formatEnumLabel(item),
                value: item
              })))
            ]}
            value={filters.sortBy}
          />
          <SelectField
            label={t("catalog.sortDirection")}
            onChange={(value) => updateFilter("sortDirection", value)}
            options={[
              { label: t("catalog.ascending"), value: "ASC" },
              { label: t("catalog.descending"), value: "DESC" }
            ]}
            value={filters.sortDirection}
          />
        </div>

        <div className="filters-actions">
          <button
            className="button button-secondary"
            onClick={() => {
              setFilters(initialFilters);
              setPageIndex(0);
            }}
            type="button"
          >
            {t("catalog.resetFilters")}
          </button>
          <span className="muted-line">{t("catalog.booksMatched", { count: totalElements })}</span>
        </div>
      </section>

      {booksQuery.isPending ? <LoadingBlock label={t("catalog.loading")} /> : null}
      {booksQuery.error ? <ErrorBlock error={booksQuery.error} title={t("catalog.requestFailed")} /> : null}

      {!booksQuery.isPending && !booksQuery.error && books.length === 0 ? (
        <EmptyBlock
          description={t("catalog.noBooksDescription")}
          title={t("catalog.noBooks")}
        />
      ) : null}

      {books.length > 0 ? (
        <section className="book-grid">
          {books.map((book) => (
            <article className="book-card" key={book.id}>
              <Link className="book-card-cover-link" to={`/book/${book.id}`}>
                <BookCover className="book-card-cover" photoUrl={book.photoUrl} size="card" title={book.name} />
              </Link>

              <div className="book-card-head">
                <span className="eyebrow">{book.isGift ? t("catalog.gift") : t("catalog.exchange")}</span>
                <span className="subtle-chip">{book.city || t("catalog.noCity")}</span>
              </div>

              <h2>{book.name}</h2>
              <p className="book-meta">
                {book.author} / {book.category} / {book.publicationYear || t("catalog.unknownYear")}
              </p>
              <p className="book-description">
                {book.description || t("catalog.noDescription")}
              </p>

                <div className="book-owner">
                  <UserIdentityInline name={book.ownerNickname} photoUrl={book.ownerPhotoUrl} size="sm">
                    <strong>{book.ownerNickname || t("catalog.unknownOwner")}</strong>
                  </UserIdentityInline>
                </div>
            </article>
          ))}
        </section>
      ) : null}

      {!booksQuery.isPending && !booksQuery.error && totalPages > 1 ? (
        <Pagination onChange={setPageIndex} page={pageIndex} totalPages={totalPages} />
      ) : null}
    </section>
  );
}

function Field({ label, onChange, type = "text", value }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        className="field-control"
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
    </label>
  );
}

function SelectField({ label, onChange, options, value }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select className="field-control" onChange={(event) => onChange(event.target.value)} value={value}>
        {options.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
