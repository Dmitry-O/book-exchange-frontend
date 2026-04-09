import { API_BASE_URL } from "../api/config";

const apiOrigin = resolveApiOrigin();

export function resolveMediaUrl(photoUrl) {
  if (!photoUrl) {
    return "";
  }

  try {
    return new URL(photoUrl, apiOrigin || undefined).toString();
  } catch {
    return photoUrl;
  }
}

export function getInitials(value, fallback = "?") {
  if (!value) {
    return fallback;
  }

  const parts = String(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return fallback;
  }

  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

function resolveApiOrigin() {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return "";
  }
}
