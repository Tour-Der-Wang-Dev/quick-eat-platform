
import { GeolocationPosition } from '@/types/app';
import { getCache, setCache } from '@/utils/cacheUtils';
import { useState, useEffect, useCallback, useRef } from 'react';
import { memoize } from '@/utils/optimizationUtils';

// Constants
const LOCATION_CACHE_KEY = 'user_location';
const LOCATION_CACHE_TIME = 10 * 60 * 1000; // 10 minutes
const DEFAULT_LOCATION: GeolocationPosition = {
  latitude: 13.7563, // Bangkok default coordinates
  longitude: 100.5018
};

// Memoized distance calculation for better performance
const calculateDistanceMemoized = memoize(
  (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },
  (lat1, lon1, lat2, lon2) => `${lat1.toFixed(4)},${lon1.toFixed(4)},${lat2.toFixed(4)},${lon2.toFixed(4)}`
);

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Service to handle geolocation with caching and fallback
 */
export const LocationService = {
  /**
   * Get current position with promise
   */
  getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      // Try to get from cache first for instant response
      const cachedLocation = getCache<GeolocationPosition>(LOCATION_CACHE_KEY);
      
      if (cachedLocation) {
        resolve(cachedLocation);
        // Still update location in background
        this.updateLocationInBackground();
        return;
      }

      // Get fresh location if not in cache
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            };
            
            // Cache the location with memory caching for faster access
            setCache(LOCATION_CACHE_KEY, userLocation, {
              expiresIn: LOCATION_CACHE_TIME,
              useMemoryCache: true
            });
            
            resolve(userLocation);
          },
          (error) => {
            console.error('Error getting location:', error);
            resolve(DEFAULT_LOCATION);
          },
          { 
            enableHighAccuracy: true, 
            timeout: 5000, 
            maximumAge: 10000 
          }
        );
      } else {
        console.warn('Geolocation is not supported by this browser');
        resolve(DEFAULT_LOCATION);
      }
    });
  },

  /**
   * Update location in background without blocking
   */
  updateLocationInBackground() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          
          setCache(LOCATION_CACHE_KEY, userLocation, {
            expiresIn: LOCATION_CACHE_TIME,
            useMemoryCache: true
          });
        },
        (error) => {
          console.error('Error updating location in background:', error);
        },
        { enableHighAccuracy: true }
      );
    }
  },

  /**
   * Calculate distance between two points in kilometers
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    return calculateDistanceMemoized(lat1, lon1, lat2, lon2);
  },

  deg2rad
};

/**
 * Optimized hook for using location in components
 */
export function useUserLocation() {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const updateLocation = useCallback(async () => {
    try {
      setLoading(true);
      const position = await LocationService.getCurrentPosition();
      
      if (isMountedRef.current) {
        setLocation(position);
        setError(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError('Unable to retrieve your location');
        setLocation(DEFAULT_LOCATION);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    updateLocation();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [updateLocation]);

  return { location, loading, error, updateLocation };
}
