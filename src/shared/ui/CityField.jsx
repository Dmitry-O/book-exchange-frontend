import { useEffect, useId, useMemo, useState } from "react";
import { useLocale } from "../i18n/LocaleContext";
import { findCitySuggestions } from "../lib/cities";

const BEST_MATCH_LABELS = {
  de: "Beste Wahl",
  en: "Best match",
  ru: "Лучший вариант"
};

export function CityField({ compactDropdown = false, label, onChange, required = false, value }) {
  const listId = useId();
  const { locale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const suggestions = useMemo(() => findCitySuggestions(value, locale), [locale, value]);
  const inlineSuggestion = useMemo(() => getInlineSuggestion(value, suggestions), [suggestions, value]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [value, suggestions.length]);

  function commitSuggestion(nextValue) {
    onChange(nextValue);
    setIsOpen(false);
    setHighlightedIndex(0);
  }

  function handleKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((current) => (current + 1) % Math.max(suggestions.length, 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((current) =>
        current === 0 ? Math.max(suggestions.length - 1, 0) : current - 1
      );
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if ((event.key === "Tab" || event.key === "Enter") && isOpen && suggestions.length > 0) {
      const suggestion = suggestions[highlightedIndex] ?? suggestions[0];

      if (suggestion && normalizeCityValue(suggestion.label) !== normalizeCityValue(value)) {
        event.preventDefault();
        commitSuggestion(suggestion.label);
      }
    }

    if (event.key === "ArrowRight" && inlineSuggestion && value.length > 0) {
      event.preventDefault();
      commitSuggestion(inlineSuggestion);
    }
  }

  return (
    <label className={`field city-field${compactDropdown ? " city-field-compact" : ""}`}>
      <span>{label}</span>

      <div className="city-field-shell">
        {inlineSuggestion ? (
          <div aria-hidden="true" className="city-field-ghost">
            <span className="city-field-ghost-typed">{value}</span>
            <span>{inlineSuggestion.slice(value.length)}</span>
          </div>
        ) : null}

        <input
          aria-autocomplete="both"
          aria-controls={isOpen ? listId : undefined}
          aria-expanded={isOpen && suggestions.length > 0}
          autoComplete="address-level2"
          className="field-control city-field-input"
          onBlur={() => {
            window.setTimeout(() => {
              setIsOpen(false);
            }, 120);
          }}
          onChange={(event) => {
            onChange(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          required={required}
          role="combobox"
          type="text"
          value={value}
        />

        {isOpen && suggestions.length > 0 ? (
          <div className="city-field-dropdown" id={listId} role="listbox">
            {suggestions.map((city, index) => {
              const isActive = index === highlightedIndex;

              return (
                <button
                  className={`city-field-option${isActive ? " city-field-option-active" : ""}`}
                  key={city.key}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    commitSuggestion(city.label);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  aria-selected={isActive}
                  role="option"
                  type="button"
                >
                  <span>{city.label}</span>
                  {index === 0 ? (
                    <span className="city-field-option-note">
                      {BEST_MATCH_LABELS[locale] ?? BEST_MATCH_LABELS.en}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </label>
  );
}

function getInlineSuggestion(value, suggestions) {
  if (!value || suggestions.length === 0) {
    return "";
  }

  const normalizedValue = normalizeCityValue(value);
  const primarySuggestion = suggestions[0].label;
  const normalizedSuggestion = normalizeCityValue(primarySuggestion);

  if (!normalizedSuggestion.startsWith(normalizedValue) || normalizedSuggestion === normalizedValue) {
    return "";
  }

  return primarySuggestion;
}
function normalizeCityValue(value) {
  return String(value ?? "")
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
