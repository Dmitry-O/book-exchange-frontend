import { useEffect, useState } from "react";
import { EyeIcon, EyeOffIcon } from "./Icons";

export function PasswordField({
  error = "",
  label,
  name,
  onBlur,
  onChange,
  revealLabel,
  showRequiredMark = false,
  ...inputProps
}) {
  const [visible, setVisible] = useState(false);
  const hasValue = Boolean(String(inputProps.value ?? ""));

  useEffect(() => {
    if (!hasValue) {
      setVisible(false);
    }
  }, [hasValue]);

  function hidePassword() {
    setVisible(false);
  }

  return (
    <label className="field password-reveal-field">
      <span className="field-label">
        {label}
        {showRequiredMark ? <span className="field-required-mark">*</span> : null}
      </span>
      <span className="password-reveal-control">
        <input
          {...inputProps}
          className="field-control"
          name={name}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          type={visible ? "text" : "password"}
        />
        {hasValue ? (
          <button
            aria-label={revealLabel}
            aria-pressed={visible}
            className="password-reveal-button"
            onBlur={hidePassword}
            onContextMenu={(event) => event.preventDefault()}
            onPointerCancel={hidePassword}
            onPointerDown={(event) => {
              event.preventDefault();
              setVisible(true);
            }}
            onPointerLeave={hidePassword}
            onPointerUp={hidePassword}
            type="button"
          >
            {visible ? <EyeIcon /> : <EyeOffIcon />}
          </button>
        ) : null}
      </span>
      <span className="field-feedback-slot">
        {error ? <span className="field-feedback field-feedback-error">{error}</span> : null}
      </span>
    </label>
  );
}
