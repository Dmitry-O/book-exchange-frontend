export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api/v1"
).replace(/\/$/, "");

export const DEFAULT_PAGE_SIZE = 12;
export const DEFAULT_LIST_PAGE_SIZE = 20;
