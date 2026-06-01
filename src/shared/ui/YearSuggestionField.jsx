import { useEffect, useId, useMemo, useRef, useState } from "react";

export function YearSuggestionField({
  className = "",
  hint = "",
  isInvalid = false,
  label,
  onChange,
  sanitizeValue = (nextValue) => nextValue,
  suggestions = [],
  value
}) {
  const listId = useId();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const visibleSuggestions = useMemo(() => {
    const currentValue = String(value ?? "");
    const normalizedSuggestions = suggestions.map(String).filter(Boolean);
    const filteredSuggestions = currentValue
      ? normalizedSuggestions.filter((suggestion) => suggestion.startsWith(currentValue))
      : normalizedSuggestions;

    return filteredSuggestions.slice(0, 8);
  }, [suggestions, value]);

  useEffect(() => {
    function handleDocumentClick(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, []);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [value, visibleSuggestions.length]);

  function commitSuggestion(nextValue) {
    onChange(sanitizeValue(nextValue));
    setOpen(false);
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }

    if (!visibleSuggestions.length) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setHighlightedIndex((current) => (current + 1) % visibleSuggestions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setHighlightedIndex((current) =>
        current === 0 ? visibleSuggestions.length - 1 : current - 1
      );
      return;
    }

    if (event.key === "Enter" && open) {
      event.preventDefault();
      commitSuggestion(visibleSuggestions[highlightedIndex] ?? visibleSuggestions[0]);
      return;
    }

  }

  return (
    <label className={`field ${className}`.trim()} ref={rootRef}>
      <span>{label}</span>
      <div className="year-suggestion-shell">
        <input
          aria-controls={open && visibleSuggestions.length ? listId : undefined}
          aria-expanded={open && visibleSuggestions.length > 0}
          aria-invalid={isInvalid}
          className="field-control"
          inputMode="numeric"
          onChange={(event) => {
            onChange(sanitizeValue(event.target.value));
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          role="combobox"
          value={value}
        />

        {open && visibleSuggestions.length > 0 ? (
          <div className="year-suggestion-dropdown" id={listId} role="listbox">
            {visibleSuggestions.map((suggestion, index) => {
              const active = index === highlightedIndex;

              return (
                <button
                  aria-selected={active}
                  className={
                    active
                      ? "year-suggestion-option year-suggestion-option-active"
                      : "year-suggestion-option"
                  }
                  key={suggestion}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    commitSuggestion(suggestion);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  role="option"
                  type="button"
                >
                  {suggestion}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
      {isInvalid && hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}
