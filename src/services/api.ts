
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
  // Use mock data service instead of Supabase
  return fetchMockVendors(filters, pagination, userLocation);
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
