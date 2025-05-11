
// Define custom types for our application
// These replace the references to Database tables that were causing errors

// Basic profile type
export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// Customer type
export interface Customer {
  id: string;
  default_address_id?: string;
  stripe_customer_id?: string;
  loyalty_points: number;
  created_at: string;
  updated_at: string;
}

// Vendor type
export interface Vendor {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  logo_url?: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  is_open: boolean;
  avg_rating?: number;
  commission_rate: number;
  created_at: string;
  updated_at: string;
}

// Menu item type
export interface MenuItem {
  id: string;
  vendor_id: string;
  category_id?: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  is_featured: boolean;
  prep_time_minutes?: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// Order type
export interface Order {
  id: string;
  customer_id: string;
  vendor_id: string;
  driver_id?: string;
  address_id?: string;
  status: OrderStatus;
  total_price: number;
  subtotal: number;
  tax: number;
  delivery_fee: number;
  discount?: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  estimated_delivery_time?: string;
  actual_delivery_time?: string;
  special_instructions?: string;
  is_rated: boolean;
  created_at: string;
  updated_at: string;
}

// Order item type
export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id?: string;
  menu_item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  special_instructions?: string;
  created_at: string;
}

// Address type
export interface Address {
  id: string;
  customer_id: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Enum types
export type UserRole = 'customer' | 'driver' | 'vendor' | 'admin';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'credit_card' | 'debit_card' | 'bank_transfer' | 'digital_wallet' | 'cash_on_delivery';

// Extended types with related data
export interface VendorWithDetails extends Vendor {
  profile?: Profile;
  menu_items?: MenuItem[];
  categories?: Category[];
  average_rating?: number;
}

// Category type
export interface Category {
  id: string;
  vendor_id: string;
  name: string;
  description?: string;
  image_url?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// Order item option type
export interface OrderItemOption {
  id: string;
  order_item_id: string;
  option_group_name: string;
  option_item_name: string;
  price_adjustment: number;
}

// Order status history type
export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  updated_by?: string;
  notes?: string;
  created_at: string;
}

export interface OrderWithDetails extends Order {
  customer?: Profile;
  vendor?: Vendor;
  driver?: Profile;
  order_items?: (OrderItem & {
    menu_item?: MenuItem;
    options?: OrderItemOption[];
  })[];
  address?: Address;
  status_history?: OrderStatusHistory[];
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
