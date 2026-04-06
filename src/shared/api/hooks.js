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

export function useUnreadUpdatesSummaryQuery(enabled) {
  return useQuery({
    queryKey: ["updates", "summary"],
    enabled,
    queryFn: async () => {
      const response = await apiRequest(
        `/updates/unread?pageIndex=0&pageSize=${DEFAULT_LIST_PAGE_SIZE}`,
        {
          auth: true
        }
      );

      return response.data;
    }
  });
}
