
import { supabase } from "@/integrations/supabase/client";
import { 
  Vendor, VendorWithDetails, MenuItem, OrderWithDetails, 
  PaginationParams, VendorFilters, GeolocationPosition 
} from "@/types/app";
import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";

// API query keys for consistent cache management
export const queryKeys = {
  vendors: "vendors",
  vendor: (id: string) => ["vendor", id],
  menuItems: (vendorId: string) => ["menuItems", vendorId],
  orders: "orders",
  order: (id: string) => ["order", id],
  profile: "profile",
  addresses: "addresses"
};

// Vendors API
export const fetchVendors = async (
  filters?: VendorFilters,
  pagination?: PaginationParams,
  userLocation?: GeolocationPosition
): Promise<VendorWithDetails[]> => {
  let query = supabase
    .from('vendors')
    .select(`
      *,
      profile:profiles(first_name, last_name, avatar_url),
      categories:categories(*)
    `);

  // Apply filters
  if (filters?.searchQuery) {
    query = query.ilike('name', `%${filters.searchQuery}%`);
  }

  if (filters?.minRating) {
    query = query.gte('avg_rating', filters.minRating);
  }

  if (filters?.isOpen !== undefined) {
    query = query.eq('is_open', filters.isOpen);
  }

  // Apply pagination
  if (pagination) {
    const { page, pageSize } = pagination;
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    query = query.range(start, end);
  }

  // Apply sorting
  if (filters?.sortBy === 'rating') {
    query = query.order('avg_rating', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching vendors:", error);
    throw new Error(error.message);
  }

  // If we have user location, calculate and sort by distance
  if (userLocation && data) {
    // Use the database function we created for distance calculation
    const vendorsWithDistance = await Promise.all(
      data.map(async (vendor) => {
        const { data: distanceData } = await supabase.rpc('calculate_distance', {
          lat1: userLocation.latitude,
          lng1: userLocation.longitude,
          lat2: vendor.latitude,
          lng2: vendor.longitude
        });
        
        return {
          ...vendor,
          distance: distanceData
        };
      })
    );

    if (filters?.sortBy === 'distance') {
      return vendorsWithDistance.sort((a, b) => 
        (a.distance || Infinity) - (b.distance || Infinity)
      );
    }
    
    return vendorsWithDistance;
  }

  return data || [];
};

export const fetchVendorById = async (id: string): Promise<VendorWithDetails> => {
  const { data, error } = await supabase
    .from('vendors')
    .select(`
      *,
      profile:profiles!owner_id(*),
      menu_items(*),
      categories(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching vendor ${id}:`, error);
    throw new Error(error.message);
  }

  return data;
};

// Menu Items API
export const fetchMenuItems = async (vendorId: string): Promise<MenuItem[]> => {
  const { data, error } = await supabase
    .from('menu_items')
    .select(`
      *,
      category:categories(name)
    `)
    .eq('vendor_id', vendorId)
    .order('display_order');

  if (error) {
    console.error(`Error fetching menu items for vendor ${vendorId}:`, error);
    throw new Error(error.message);
  }

  return data || [];
};

// Orders API
export const fetchOrders = async (customerId?: string): Promise<OrderWithDetails[]> => {
  let query = supabase
    .from('orders')
    .select(`
      *,
      vendor:vendors(*),
      order_items:order_items(
        *,
        menu_item:menu_items(*),
        options:order_item_options(*)
      ),
      address:addresses(*)
    `)
    .order('created_at', { ascending: false });

  if (customerId) {
    query = query.eq('customer_id', customerId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching orders:", error);
    throw new Error(error.message);
  }

  return data || [];
};

export const fetchOrderById = async (orderId: string): Promise<OrderWithDetails> => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customer:profiles!customer_id(*),
      vendor:vendors(*),
      driver:profiles!driver_id(*),
      order_items:order_items(
        *,
        menu_item:menu_items(*),
        options:order_item_options(*)
      ),
      address:addresses(*),
      status_history:order_status_history(*)
    `)
    .eq('id', orderId)
    .single();

  if (error) {
    console.error(`Error fetching order ${orderId}:`, error);
    throw new Error(error.message);
  }

  return data;
};

// React Query hooks
export const useVendors = (
  filters?: VendorFilters,
  pagination?: PaginationParams,
  userLocation?: GeolocationPosition,
  options?: UseQueryOptions<VendorWithDetails[], Error>
) => {
  return useQuery({
    queryKey: [queryKeys.vendors, filters, pagination, userLocation],
    queryFn: () => fetchVendors(filters, pagination, userLocation),
    ...options
  });
};

export const useVendorById = (id: string, options?: UseQueryOptions<VendorWithDetails, Error>) => {
  return useQuery({
    queryKey: queryKeys.vendor(id),
    queryFn: () => fetchVendorById(id),
    enabled: !!id,
    ...options
  });
};

export const useMenuItems = (vendorId: string, options?: UseQueryOptions<MenuItem[], Error>) => {
  return useQuery({
    queryKey: queryKeys.menuItems(vendorId),
    queryFn: () => fetchMenuItems(vendorId),
    enabled: !!vendorId,
    ...options
  });
};

export const useOrders = (customerId?: string, options?: UseQueryOptions<OrderWithDetails[], Error>) => {
  return useQuery({
    queryKey: [queryKeys.orders, customerId],
    queryFn: () => fetchOrders(customerId),
    ...options
  });
};

export const useOrderById = (orderId: string, options?: UseQueryOptions<OrderWithDetails, Error>) => {
  return useQuery({
    queryKey: queryKeys.order(orderId),
    queryFn: () => fetchOrderById(orderId),
    enabled: !!orderId,
    ...options
  });
};
