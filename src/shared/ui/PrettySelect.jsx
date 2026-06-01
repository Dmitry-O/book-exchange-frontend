import { useEffect, useId, useRef, useState } from "react";

export function PrettySelect({
  ariaLabel,
  className = "",
  disabled = false,
  name,
  onChange,
  options = [],
  required = false,
  value
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const listId = useId();
  const normalizedOptions = options.map(normalizeOption);
  const selectedOption =
    normalizedOptions.find((option) => String(option.value) === String(value)) ??
    normalizedOptions[0] ??
    { label: "", value: "" };
  const classes = ["pretty-select", className].filter(Boolean).join(" ");

  useEffect(() => {
    function handleDocumentClick(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleSelect(nextValue) {
    onChange?.(nextValue);
    setOpen(false);
  }

  return (
    <div className={classes} ref={rootRef}>
      {name ? <input name={name} type="hidden" value={value ?? ""} /> : null}
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        aria-required={required ? "true" : undefined}
        className="pretty-select-trigger field-control"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="pretty-select-trigger-label">{selectedOption.label}</span>
        <span className="pretty-select-caret" aria-hidden="true" />
      </button>

      {open ? (
        <div className="pretty-select-menu" id={listId} role="listbox">
          {normalizedOptions.map((option) => {
            const active = String(option.value) === String(value);

            return (
              <button
                aria-selected={active}
                className={active ? "pretty-select-option pretty-select-option-active" : "pretty-select-option"}
                key={option.key}
                onClick={() => handleSelect(option.value)}
                role="option"
                type="button"
              >
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function normalizeOption(option) {
  const value = option?.value ?? option ?? "";
  const label = option?.label ?? option ?? "";

  return {
    key: `${value || "empty"}-${label}`,
    label,
    value
  };
}
