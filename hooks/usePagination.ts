import { useState, useCallback } from 'react';

interface UsePaginationOptions<T> {
  initialItems?: T[];
  itemsPerPage?: number;
  loadMore: (offset: number, limit: number) => Promise<T[]>;
}

interface UsePaginationReturn<T> {
  items: T[];
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  reset: () => void;
}

export const usePagination = <T,>({
  initialItems = [],
  itemsPerPage = 12,
  loadMore: loadMoreFn
}: UsePaginationOptions<T>): UsePaginationReturn<T> => {
  const [items, setItems] = useState<T[]>(initialItems);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) {
      return;
    }

    setIsLoading(true);
    try {
      const newItems = await loadMoreFn(items.length, itemsPerPage);
      
      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setItems(prev => [...prev, ...newItems]);
        // Si recibimos menos items que el límite, no hay más
        if (newItems.length < itemsPerPage) {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('Error loading more items:', error);
    } finally {
      setIsLoading(false);
    }
  }, [items.length, isLoading, hasMore, itemsPerPage, loadMoreFn]);

  const reset = useCallback(() => {
    setItems(initialItems);
    setHasMore(true);
    setIsLoading(false);
  }, [initialItems]);

  return {
    items,
    isLoading,
    hasMore,
    loadMore,
    reset
  };
};
