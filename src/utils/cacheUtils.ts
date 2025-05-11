
import { useState, useEffect, useRef, useCallback } from 'react';

const CACHE_PREFIX = 'food_delivery_app_cache_';
const DEFAULT_CACHE_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

// In-memory cache for frequent access items
const memoryCache = new Map<string, {
  value: any;
  expiresAt: number;
}>();

interface CacheOptions {
  /** Time in milliseconds for cache to be valid */
  expiresIn?: number;
  /** Whether to use memory cache in addition to localStorage */
  useMemoryCache?: boolean;
}

/**
 * Save data to cache with expiration
 */
export const setCache = <T>(key: string, value: T, options?: CacheOptions): void => {
  try {
    const expiresIn = options?.expiresIn || DEFAULT_CACHE_TIME;
    const now = Date.now();
    const expiresAt = now + expiresIn;
    
    const item = {
      value,
      timestamp: now,
      expiresAt
    };
    
    // Store in localStorage
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(item));
    
    // If memory cache is enabled, store there too for faster access
    if (options?.useMemoryCache !== false) {
      memoryCache.set(key, { value, expiresAt });
    }
  } catch (error) {
    console.error('Error setting cache:', error);
  }
};

/**
 * Get data from cache if it exists and is not expired
 */
export const getCache = <T>(key: string): T | null => {
  try {
    // Check memory cache first for performance
    const memItem = memoryCache.get(key);
    const now = Date.now();
    
    if (memItem && now < memItem.expiresAt) {
      return memItem.value as T;
    }
    
    // If not in memory or expired, try localStorage
    const cachedData = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    
    if (!cachedData) {
      return null;
    }
    
    const item = JSON.parse(cachedData);
    
    if (now > item.expiresAt) {
      // Cache expired, remove it
      removeCache(key);
      return null;
    }
    
    // Refresh memory cache
    memoryCache.set(key, { value: item.value, expiresAt: item.expiresAt });
    
    return item.value;
  } catch (error) {
    console.error('Error getting cache:', error);
    return null;
  }
};

/**
 * Remove a specific item from cache
 */
export const removeCache = (key: string): void => {
  localStorage.removeItem(`${CACHE_PREFIX}${key}`);
  memoryCache.delete(key);
};

/**
 * Clear all app-related cache items
 */
export const clearAllCache = (): void => {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(CACHE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
  memoryCache.clear();
};

/**
 * Optimized hook for caching values with automatic cleanup
 */
export function useLocalStorageCache<T>(
  key: string, 
  initialValue: T, 
  options?: CacheOptions
): [T, (value: T | ((prevValue: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    const cached = getCache<T>(key);
    return cached !== null ? cached : initialValue;
  });
  
  // Use ref to avoid unnecessary effect triggers
  const valueRef = useRef(value);
  valueRef.current = value;
  
  // Debounced update to reduce writes
  const debouncedSetCache = useCallback(
    debounce((key: string, value: T, options?: CacheOptions) => {
      setCache(key, value, options);
    }, 300),
    [key, options]
  );
  
  useEffect(() => {
    debouncedSetCache(key, valueRef.current, options);
  }, [key, value, options, debouncedSetCache]);
  
  const updateValue = useCallback((newValue: T | ((prevValue: T) => T)) => {
    setValue(prev => {
      const updatedValue = typeof newValue === 'function' 
        ? (newValue as ((prevValue: T) => T))(prev)
        : newValue;
      return updatedValue;
    });
  }, []);
  
  // Clean up
  useEffect(() => {
    return () => {
      debouncedSetCache.cancel();
    };
  }, [debouncedSetCache]);
  
  return [value, updateValue];
}

/**
 * Simple debounce function
 */
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  const debounced = function(this: any, ...args: Parameters<T>) {
    const context = this;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      timeout = null;
      func.apply(context, args);
    }, wait);
  } as T & { cancel: () => void };
  
  debounced.cancel = function() {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };
  
  return debounced;
}
