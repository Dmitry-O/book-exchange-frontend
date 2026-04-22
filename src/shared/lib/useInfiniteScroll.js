import { useEffect, useRef } from "react";

export function useInfiniteScroll({
  enabled = true,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
  rootMargin = "320px"
}) {
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!enabled || !hasNextPage || isFetchingNextPage || typeof onLoadMore !== "function") {
      return undefined;
    }

    const node = triggerRef.current;

    if (!node || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [enabled, hasNextPage, isFetchingNextPage, onLoadMore, rootMargin]);

  return triggerRef;
}
