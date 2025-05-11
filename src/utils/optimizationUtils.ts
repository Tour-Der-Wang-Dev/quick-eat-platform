import { useRef, useEffect, useState, useCallback } from 'react';

/**
 * Custom debounce hook for limiting function calls
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom throttle hook for limiting function calls
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): [(...args: Parameters<T>) => void, boolean] {
  const [isThrottled, setIsThrottled] = useState<boolean>(false);
  const lastRan = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const throttledFn = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastRan.current < delay) {
        setIsThrottled(true);

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          lastRan.current = now;
          callback(...args);
          setIsThrottled(false);
        }, delay - (now - lastRan.current));
      } else {
        lastRan.current = now;
        callback(...args);
        setIsThrottled(false);
      }
    },
    [callback, delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [throttledFn, isThrottled];
}

/**
 * Hook for batching API requests
 */
export function useBatchRequests<T, R>(
  processFn: (items: T[]) => Promise<R[]>,
  delay: number = 500,
  maxBatchSize: number = 20
): [(item: T) => void, () => Promise<R[]>, boolean] {
  const [queue, setQueue] = useState<T[]>([]);
  const [processing, setProcessing] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add an item to the queue
  const addToQueue = useCallback((item: T) => {
    setQueue(prev => [...prev, item]);

    // If we reached max batch size, process immediately
    if (queue.length >= maxBatchSize - 1) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      processBatch();
    } else if (!timeoutRef.current) {
      // Otherwise, set a timer to process the batch
      timeoutRef.current = setTimeout(() => {
        processBatch();
        timeoutRef.current = null;
      }, delay);
    }
  }, [queue.length, maxBatchSize]);

  // Process the current batch
  const processBatch = useCallback(async (): Promise<R[]> => {
    if (queue.length === 0) return [];
    
    try {
      setProcessing(true);
      const itemsToProcess = [...queue];
      setQueue([]);
      
      const results = await processFn(itemsToProcess);
      return results;
    } catch (error) {
      console.error('Error processing batch:', error);
      throw error;
    } finally {
      setProcessing(false);
    }
  }, [queue, processFn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [addToQueue, processBatch, processing];
}

/**
 * Memoization function for expensive computations
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  resolver?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  const memoized = function(this: any, ...args: Parameters<T>): ReturnType<T> {
    const key = resolver ? resolver(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }
    
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  } as T;
  
  return memoized;
}
