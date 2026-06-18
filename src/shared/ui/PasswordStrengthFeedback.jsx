export function PasswordStrengthFeedback({ feedback, showRequirements = false, title }) {
  if (!feedback) {
    return null;
  }

  return (
    <div className={`password-strength password-strength-${feedback.tone}`}>
      <div className="password-strength-meter" aria-label={feedback.label}>
        <span className="password-strength-segments" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((segment) => (
            <span
              className={segment <= feedback.score ? "password-strength-segment-active" : ""}
              key={segment}
            />
          ))}
        </span>
        <strong>{feedback.label}</strong>
      </div>
      <p>{feedback.text}</p>

      {showRequirements ? (
        <div className="password-requirements">
          {title ? <h3>{title}</h3> : null}
          <ul>
            {feedback.requirements.map((requirement) => (
              <li
                className={requirement.met ? "password-requirement-met" : ""}
                key={requirement.key}
              >
                <span aria-hidden="true">{requirement.met ? "✓" : "○"}</span>
                {requirement.label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
