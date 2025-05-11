
import { useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/services/api';

type TableName = 'orders' | 'order_status_history' | 'drivers' | 'vendors';
type Event = 'INSERT' | 'UPDATE' | 'DELETE';

interface UseRealtimeSubscriptionProps {
  table: TableName;
  event?: Event | Event[];
  schema?: string;
  filter?: string;
  onRecordChange?: (payload: any) => void;
  invalidateQueryKey?: unknown[];
}

/**
 * Hook to subscribe to Supabase Realtime changes
 */
export function useRealtimeSubscription({
  table,
  event = ['INSERT', 'UPDATE', 'DELETE'],
  schema = 'public',
  filter,
  onRecordChange,
  invalidateQueryKey
}: UseRealtimeSubscriptionProps) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // Clean up any existing subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Create new channel for subscription
    const channel = supabase.channel('db-changes');
    let subscription = channel;

    // Convert event to array if it's a single string
    const events = Array.isArray(event) ? event : [event];

    // Subscribe to each event type
    events.forEach(eventType => {
      const eventConfig: any = {
        event: eventType,
        schema,
        table
      };

      if (filter) {
        eventConfig.filter = filter;
      }

      subscription = subscription.on(
        'postgres_changes',
        eventConfig,
        (payload) => {
          console.log(`Realtime update received for ${table}:`, payload);
          
          // Invoke the callback if provided
          if (onRecordChange) {
            onRecordChange(payload);
          }

          // Invalidate query cache if a query key is provided
          if (invalidateQueryKey) {
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: invalidateQueryKey });
            }, 0);
          }
        }
      );
    });

    // Start the subscription
    channelRef.current = subscription.subscribe((status) => {
      console.log(`Realtime subscription to ${table} status:`, status);
    });

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [table, event, schema, filter, onRecordChange, invalidateQueryKey, queryClient]);
}

/**
 * Specialized hook for order updates
 */
export function useOrderUpdates(orderId?: string) {
  return useRealtimeSubscription({
    table: 'orders',
    event: 'UPDATE',
    filter: orderId ? `id=eq.${orderId}` : undefined,
    invalidateQueryKey: orderId ? queryKeys.order(orderId) : [queryKeys.orders]
  });
}

/**
 * Specialized hook for driver location updates
 */
export function useDriverLocationUpdates(driverId: string) {
  return useRealtimeSubscription({
    table: 'drivers',
    event: 'UPDATE',
    filter: `id=eq.${driverId}`
  });
}

/**
 * Specialized hook for new orders
 */
export function useNewOrderNotifications(vendorId: string) {
  return useRealtimeSubscription({
    table: 'orders',
    event: 'INSERT',
    filter: `vendor_id=eq.${vendorId}`,
    invalidateQueryKey: [queryKeys.orders]
  });
}
