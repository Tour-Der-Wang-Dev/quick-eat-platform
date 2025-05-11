
import { useState, useEffect } from 'react';

const CACHE_PREFIX = 'food_delivery_app_cache_';
const DEFAULT_CACHE_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

interface CacheOptions {
  /** Time in milliseconds for cache to be valid */
  expiresIn?: number;
}

interface CacheItem<T> {
  value: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Save data to local storage cache with expiration
 */
export const setCache = <T>(key: string, value: T, options?: CacheOptions): void => {
  try {
    const expiresIn = options?.expiresIn || DEFAULT_CACHE_TIME;
    const now = Date.now();
    
    const item: CacheItem<T> = {
      value,
      timestamp: now,
      expiresAt: now + expiresIn
    };
    
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(item));
  } catch (error) {
    console.error('Error setting cache:', error);
  }
};

/**
 * Get data from local storage cache if it exists and is not expired
 */
export const getCache = <T>(key: string): T | null => {
  try {
    const cachedData = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    
    if (!cachedData) {
      return null;
    }
    
    const item: CacheItem<T> = JSON.parse(cachedData);
    const now = Date.now();
    
    if (now > item.expiresAt) {
      // Cache expired, remove it
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }
    
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
};

/**
 * Hook for caching a value
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
  
  useEffect(() => {
    setCache(key, value, options);
  }, [key, value, options]);
  
  const updateValue = (newValue: T | ((prevValue: T) => T)) => {
    setValue(prev => {
      const updatedValue = typeof newValue === 'function' 
        ? (newValue as ((prevValue: T) => T))(prev)
        : newValue;
      return updatedValue;
    });
  };
  
  return [value, updateValue];
}
