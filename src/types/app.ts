
import { Database } from '@/integrations/supabase/types';

// Type aliases from Supabase schema
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Customer = Database['public']['Tables']['customers']['Row'];
export type Vendor = Database['public']['Tables']['vendors']['Row'];
export type MenuItem = Database['public']['Tables']['menu_items']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderItem = Database['public']['Tables']['order_items']['Row'];
export type Address = Database['public']['Tables']['addresses']['Row'];

// Enum types
export type UserRole = Database['public']['Enums']['user_role'];
export type OrderStatus = Database['public']['Enums']['order_status'];
export type PaymentStatus = Database['public']['Enums']['payment_status'];
export type PaymentMethod = Database['public']['Enums']['payment_method'];

// Extended types with related data
export interface VendorWithDetails extends Vendor {
  profile?: Profile;
  menu_items?: MenuItem[];
  categories?: Array<Database['public']['Tables']['categories']['Row']>;
  average_rating?: number;
}

export interface OrderWithDetails extends Order {
  customer?: Profile;
  vendor?: Vendor;
  driver?: Profile;
  order_items?: (OrderItem & {
    menu_item?: MenuItem;
    options?: Array<Database['public']['Tables']['order_item_options']['Row']>;
  })[];
  address?: Address;
  status_history?: Array<Database['public']['Tables']['order_status_history']['Row']>;
}

// Query filter and pagination types
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface VendorFilters {
  searchQuery?: string;
  minRating?: number;
  isOpen?: boolean;
  sortBy?: 'rating' | 'distance' | 'deliveryTime';
  categoryId?: string;
}

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
}
