import { useQuery } from "@tanstack/react-query";
import { DEFAULT_LIST_PAGE_SIZE } from "./config";
import { apiRequest } from "./http";

export function useMetadataQuery() {
  return useQuery({
    queryKey: ["metadata"],
    staleTime: Infinity,
    queryFn: async () => {
      const response = await apiRequest("/metadata");
      return response.data;
    }
  });
}

export function useCityAutocompleteQuery(query, locale, limit = 10, enabled = true) {
  const normalizedQuery = String(query ?? "").trim();

  return useQuery({
    queryKey: ["metadata", "cities", locale, normalizedQuery, limit],
    enabled: enabled && normalizedQuery.length >= 2,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const response = await apiRequest(
        `/metadata/cities?query=${encodeURIComponent(normalizedQuery)}&limit=${limit}`,
        { locale }
      );

      return response.data ?? [];
    }
  });
}

export function useUnreadUpdatesSummaryQuery(enabled) {
  return useQuery({
    queryKey: ["updates", "summary"],
    enabled,
    queryFn: async () => {
      const response = await apiRequest(
        `/updates?pageIndex=0&pageSize=${DEFAULT_LIST_PAGE_SIZE}&readState=UNREAD`,
        {
          auth: true
        }
      );

      return response.data;
    }
  });
}

export function useAdminOpenReportsSummaryQuery(enabled) {
  return useQuery({
    queryKey: ["admin-reports", "summary", "open"],
    enabled,
    queryFn: async () => {
      const response = await apiRequest(
        `/admin/reports?pageIndex=0&pageSize=1&reportStatuses=OPEN&sortDirection=DESC`,
        {
          auth: true
        }
      );

      return response.data;
    }
  });
}
