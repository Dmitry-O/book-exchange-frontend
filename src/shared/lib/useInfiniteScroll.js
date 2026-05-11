import { useEffect, useRef } from "react";

export function useInfiniteScroll({
  enabled = true,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
  rootMargin = "320px"
}) {
  const triggerRef = useRef(null);
  const onLoadMoreRef = useRef(onLoadMore);
  const isFetchingRef = useRef(isFetchingNextPage);
  const requestLockedRef = useRef(false);
  const intersectingRef = useRef(false);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    isFetchingRef.current = isFetchingNextPage;

    if (!isFetchingNextPage) {
      requestLockedRef.current = false;
    }
  }, [isFetchingNextPage]);

  useEffect(() => {
    if (!enabled || !hasNextPage) {
      requestLockedRef.current = false;
      intersectingRef.current = false;
    }
  }, [enabled, hasNextPage]);

  useEffect(() => {
    if (!enabled || !hasNextPage || typeof onLoadMoreRef.current !== "function") {
      requestLockedRef.current = false;
      return undefined;
    }

    const node = triggerRef.current;

    if (!node || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (!entry) {
          return;
        }

        if (!entry.isIntersecting) {
          intersectingRef.current = false;
          return;
        }

        if (intersectingRef.current || requestLockedRef.current || isFetchingRef.current) {
          return;
        }

        intersectingRef.current = true;
        requestLockedRef.current = true;
        onLoadMoreRef.current?.();
      },
      { rootMargin }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [enabled, hasNextPage, rootMargin]);

  return triggerRef;
}
