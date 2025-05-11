
import { useRef, useEffect, useState, useCallback } from 'react';

/**
 * Enhanced debounce hook with more options and better memory management
 */
export function useDebounce<T>(value: T, delay: number = 500, options?: { leading?: boolean }): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(
    options?.leading ? value : (() => {
      // Only initialize with null-like values if the original value isn't null-like
      if (value === null || value === undefined) return value;
      if (typeof value === 'string') return '' as unknown as T;
      if (typeof value === 'number') return 0 as unknown as T;
      if (Array.isArray(value)) return [] as unknown as T;
      return value;
    })()
  );
  
  const mountedRef = useRef(true);
  const firstUpdateRef = useRef(true);

  useEffect(() => {
    if (options?.leading && firstUpdateRef.current) {
      firstUpdateRef.current = false;
      return;
    }
    
    const handler = setTimeout(() => {
      if (mountedRef.current) {
        setDebouncedValue(value);
      }
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay, options?.leading]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return debouncedValue;
}

/**
 * Optimized throttle hook with isThrottled indicator and better cleanup
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): [(...args: Parameters<T>) => void, boolean] {
  const [isThrottled, setIsThrottled] = useState<boolean>(false);
  const lastRan = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef<T>(callback);
  
  // Update the callback ref when it changes to avoid stale closures
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

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
          callbackRef.current(...args);
          setIsThrottled(false);
          timeoutRef.current = null;
        }, delay - (now - lastRan.current));
      } else {
        lastRan.current = now;
        callbackRef.current(...args);
        setIsThrottled(false);
      }
    },
    [delay]
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
 * Hook for batch processing with optimized memory usage
 */
export function useBatchRequests<T, R>(
  processFn: (items: T[]) => Promise<R[]>,
  delay: number = 500,
  maxBatchSize: number = 20
): [(item: T) => void, () => Promise<R[]>, boolean] {
  const [processing, setProcessing] = useState(false);
  const queueRef = useRef<T[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processFnRef = useRef(processFn);
  
  // Update process function reference
  useEffect(() => {
    processFnRef.current = processFn;
  }, [processFn]);

  // Add an item to the queue
  const addToQueue = useCallback((item: T) => {
    queueRef.current = [...queueRef.current, item];

    // If we reached max batch size, process immediately
    if (queueRef.current.length >= maxBatchSize) {
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
  }, [maxBatchSize, delay]);

  // Process the current batch
  const processBatch = useCallback(async (): Promise<R[]> => {
    if (queueRef.current.length === 0) return [];
    
    try {
      setProcessing(true);
      const itemsToProcess = [...queueRef.current];
      queueRef.current = [];
      
      const results = await processFnRef.current(itemsToProcess);
      return results;
    } catch (error) {
      console.error('Error processing batch:', error);
      throw error;
    } finally {
      setProcessing(false);
    }
  }, []);

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
 * Advanced memoization function with LRU cache and custom key resolver
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  resolver?: (...args: Parameters<T>) => string,
  options: { maxSize?: number } = {}
): T {
  const cache = new Map<string, { 
    value: ReturnType<T>, 
    lastAccessed: number 
  }>();
  const maxSize = options.maxSize || 100;
  
  const memoized = function(this: any, ...args: Parameters<T>): ReturnType<T> {
    const key = resolver 
      ? resolver(...args) 
      : JSON.stringify(args);
    
    const now = Date.now();
    
    if (cache.has(key)) {
      const item = cache.get(key)!;
      // Update last accessed time
      item.lastAccessed = now;
      return item.value;
    }
    
    const result = fn.apply(this, args);
    
    // If cache is full, remove least recently used item
    if (cache.size >= maxSize) {
      let oldestKey: string | null = null;
      let oldestTime = Infinity;
      
      for (const [k, v] of cache.entries()) {
        if (v.lastAccessed < oldestTime) {
          oldestTime = v.lastAccessed;
          oldestKey = k;
        }
      }
      
      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }
    
    cache.set(key, { 
      value: result, 
      lastAccessed: now 
    });
    
    return result;
  } as T;
  
  // Add a method to clear the cache
  (memoized as any).clearCache = () => {
    cache.clear();
  };
  
  return memoized;
}

/**
 * Intersection Observer hook for efficient lazy loading
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefCallback<Element>, boolean, IntersectionObserverEntry | null] {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [node, setNode] = useState<Element | null>(null);
  
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (observer.current) {
      observer.current.disconnect();
    }

    observer.current = new IntersectionObserver(([entry]) => {
      setEntry(entry);
      setIsIntersecting(entry.isIntersecting);
    }, options);

    const { current: currentObserver } = observer;

    if (node) {
      currentObserver.observe(node);
    }

    return () => currentObserver.disconnect();
  }, [node, options.root, options.rootMargin, options.threshold]);

  return [setNode, isIntersecting, entry];
}
