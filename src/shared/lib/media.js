import { API_BASE_URL } from "../api/config";

const apiOrigin = resolveApiOrigin();
const GENERATED_PLACEHOLDER_PATTERN =
  /(placeholder|default|mock|stub|sample|demo|no[-_]?image|book-cover-placeholder)/i;
const UPLOADED_BOOK_IMAGE_PATTERN = /\/users\/\d+\/books\/\d+_\d{10,}\.[a-z0-9]+(?:[?#].*)?$/i;

export function resolveMediaUrl(photoUrl, { kind = "generic", uploadedOnly = false } = {}) {
  if (!photoUrl) {
    return "";
  }

  const normalizedPhotoUrl = String(photoUrl).trim();

  if (!normalizedPhotoUrl) {
    return "";
  }

  if (/^data:image\//i.test(normalizedPhotoUrl)) {
    return normalizedPhotoUrl;
  }

  if (kind === "book" && GENERATED_PLACEHOLDER_PATTERN.test(normalizedPhotoUrl)) {
    return "";
  }

  if (
    uploadedOnly &&
    kind === "book" &&
    !isUploadedBookImageUrl(normalizedPhotoUrl)
  ) {
    return "";
  }

  try {
    return new URL(normalizedPhotoUrl, apiOrigin || undefined).toString();
  } catch {
    return normalizedPhotoUrl;
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

export function isUploadedBookImageUrl(photoUrl) {
  return /^data:image\//i.test(photoUrl) || UPLOADED_BOOK_IMAGE_PATTERN.test(photoUrl);
}
