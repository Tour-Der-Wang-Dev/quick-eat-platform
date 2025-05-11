
import { 
  Vendor, VendorWithDetails, MenuItem, OrderWithDetails, 
  PaginationParams, VendorFilters, GeolocationPosition
} from "@/types/app";
import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { 
  fetchVendors as fetchMockVendors,
  fetchVendorById as fetchMockVendorById,
  fetchMenuItems as fetchMockMenuItems,
  fetchOrders as fetchMockOrders,
  fetchOrderById as fetchMockOrderById
} from "./mockDataService";
import { memoize } from "@/utils/optimizationUtils";

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

// Memoized vendor filtering for better performance
const filterVendors = memoize((vendors: VendorWithDetails[], filters?: VendorFilters) => {
  if (!filters || Object.keys(filters).length === 0) return vendors;
  
  return vendors.filter(vendor => {
    // Apply filters
    if (filters.category && !vendor.categories?.some(c => c.name === filters.category)) return false;
    if (filters.rating && vendor.rating < filters.rating) return false;
    if (filters.priceRange && vendor.price_range !== filters.priceRange) return false;
    return true;
  });
});

// Vendors API
export const fetchVendors = async (
  filters?: VendorFilters,
  pagination?: PaginationParams,
  userLocation?: GeolocationPosition
): Promise<VendorWithDetails[]> => {
  const data = await fetchMockVendors(filters, pagination, userLocation);
  
  // Apply pagination in memory to reduce processing
  if (pagination) {
    const start = (pagination.page - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return data.slice(start, end);
  }
  
  return data;
};

export const fetchVendorById = async (id: string): Promise<VendorWithDetails> => {
  // Use mock data service instead of Supabase
  return fetchMockVendorById(id);
};

// Menu Items API
export const fetchMenuItems = async (vendorId: string): Promise<MenuItem[]> => {
  // Use mock data service instead of Supabase
  return fetchMockMenuItems(vendorId);
};

// Orders API
export const fetchOrders = async (customerId?: string): Promise<OrderWithDetails[]> => {
  // Use mock data service instead of Supabase
  return fetchMockOrders(customerId);
};

export const fetchOrderById = async (orderId: string): Promise<OrderWithDetails> => {
  // Use mock data service instead of Supabase
  return fetchMockOrderById(orderId);
};

// React Query hooks with optimized settings
export const useVendors = (
  filters?: VendorFilters,
  pagination?: PaginationParams,
  userLocation?: GeolocationPosition,
  options?: UseQueryOptions<VendorWithDetails[], Error>
) => {
  return useQuery({
    queryKey: [queryKeys.vendors, filters, pagination, userLocation],
    queryFn: () => fetchVendors(filters, pagination, userLocation),
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options
  });
};

export const useVendorById = (id: string, options?: UseQueryOptions<VendorWithDetails, Error>) => {
  return useQuery({
    queryKey: queryKeys.vendor(id),
    queryFn: () => fetchVendorById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options
  });
};

export const useMenuItems = (vendorId: string, options?: UseQueryOptions<MenuItem[], Error>) => {
  return useQuery({
    queryKey: queryKeys.menuItems(vendorId),
    queryFn: () => fetchMenuItems(vendorId),
    enabled: !!vendorId,
    staleTime: 1000 * 60 * 10, // 10 minutes - menu items change less frequently
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
