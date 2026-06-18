const passwordFeedbackCopy = {
  de: {
    invalidPrefix: "Das Passwort braucht noch",
    medium:
      "Das Passwort erfüllt die Anforderungen. Für mehr Sicherheit empfehlen wir mindestens 12 Zeichen.",
    same: "Das neue Passwort muss sich vom aktuellen Passwort unterscheiden.",
    labels: {
      invalid: "Noch nicht sicher",
      medium: "Sicher",
      strong: "Sehr sicher"
    },
    strong: "Gutes Passwort. Du kannst es jetzt speichern.",
    requirements: {
      digit: "Mindestens eine Zahl",
      length: "8-64 Zeichen",
      lower: "Mindestens ein Kleinbuchstabe",
      noSpace: "Keine Leerzeichen",
      symbol: "Mindestens ein Sonderzeichen",
      upper: "Mindestens ein Grossbuchstabe"
    }
  },
  en: {
    invalidPrefix: "Password still needs",
    medium:
      "The password meets the requirements. For better security, use at least 12 characters.",
    same: "The new password must be different from the current password.",
    labels: {
      invalid: "Not secure yet",
      medium: "Secure",
      strong: "Very secure"
    },
    strong: "Strong password. You can save it now.",
    requirements: {
      digit: "Minimum one digit",
      length: "8-64 characters",
      lower: "Minimum one lowercase letter",
      noSpace: "No spaces",
      symbol: "Minimum one special character",
      upper: "Minimum one uppercase letter"
    }
  },
  ru: {
    invalidPrefix: "Пароль должен содержать",
    medium:
      "Пароль подходит по требованиям. Для надёжности лучше сделать его длиннее: от 12 символов.",
    same: "Новый пароль должен отличаться от текущего.",
    labels: {
      invalid: "Пока ненадёжный",
      medium: "Надёжный",
      strong: "Очень надёжный"
    },
    strong: "Хороший пароль. Его уже можно сохранить.",
    summary:
      "Пароль должен содержать: от 8 до 64 символов, цифру, строчную и заглавную буквы, спецсимвол и не содержать пробелов.",
    requirements: {
      digit: "Минимум одна цифра",
      length: "От 8 до 64 символов",
      lower: "Минимум одна строчная буква",
      noSpace: "Без пробелов",
      symbol: "Минимум один спецсимвол",
      upper: "Минимум одна заглавная буква"
    }
  }
};

export function getPasswordRequirements(locale, password = "") {
  const text = passwordFeedbackCopy[locale] ?? passwordFeedbackCopy.en;

  return [
    { key: "length", met: password.length >= 8 && password.length <= 64 },
    { key: "lower", met: /[a-z]/.test(password) },
    { key: "upper", met: /[A-Z]/.test(password) },
    { key: "digit", met: /\d/.test(password) },
    { key: "symbol", met: /[^A-Za-z0-9\s]/.test(password) },
    { key: "noSpace", met: Boolean(password) && !/\s/.test(password) }
  ].map((requirement) => ({
    ...requirement,
    label: text.requirements[requirement.key]
  }));
}

export function getPasswordFeedback(locale, _currentPassword, newPassword) {
  if (!newPassword) {
    return null;
  }

  const text = passwordFeedbackCopy[locale] ?? passwordFeedbackCopy.en;
  const hasWhitespace = /\s/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasDigit = /\d/.test(newPassword);
  const hasSymbol = /[^A-Za-z0-9\s]/.test(newPassword);
  const missingRequirements = [];
  const requirements = getPasswordRequirements(locale, newPassword);

  if (newPassword.length < 8 || newPassword.length > 64) {
    missingRequirements.push(text.requirements.length);
  }

  if (!hasLower) {
    missingRequirements.push(text.requirements.lower);
  }

  if (!hasUpper) {
    missingRequirements.push(text.requirements.upper);
  }

  if (!hasDigit) {
    missingRequirements.push(text.requirements.digit);
  }

  if (!hasSymbol) {
    missingRequirements.push(text.requirements.symbol);
  }

  if (hasWhitespace) {
    missingRequirements.push(text.requirements.noSpace);
  }

  if (missingRequirements.length > 0) {
    return {
      canSubmit: false,
      label: text.labels.invalid,
      requirements,
      score: Math.max(1, requirements.filter((requirement) => requirement.met).length - 1),
      text: text.summary ?? `${text.invalidPrefix}: ${missingRequirements.join(", ")}.`,
      tone: "danger"
    };
  }

  if (newPassword.length >= 12) {
    return {
      canSubmit: true,
      label: text.labels.strong,
      requirements,
      score: 5,
      text: text.strong,
      tone: "success"
    };
  }

  return {
    canSubmit: true,
    label: text.labels.medium,
    requirements,
    score: 4,
    text: text.medium,
    tone: "warning"
  };
}
