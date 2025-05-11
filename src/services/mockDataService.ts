
/**
 * Mock Data Service
 * 
 * This provides mock data for the application since the actual database tables don't exist yet.
 * This allows the application to function with our existing type definitions until the real database is set up.
 */

import { 
  Vendor, VendorWithDetails, MenuItem, OrderWithDetails, 
  PaginationParams, VendorFilters, GeolocationPosition,
  Profile, Customer, Order, OrderItem, Address, Category,
  PaymentMethod, PaymentStatus, OrderStatus
} from "@/types/app";

// Sample data
const mockVendors: VendorWithDetails[] = [
  {
    id: '1',
    owner_id: 'user1',
    name: 'Burger Palace',
    description: 'Best burgers in town',
    logo_url: 'https://placehold.co/400x300',
    address: '123 Main St, Anytown, USA',
    latitude: 37.7749,
    longitude: -122.4194,
    phone: '555-123-4567',
    email: 'info@burgerpalace.com',
    is_open: true,
    avg_rating: 4.5,
    commission_rate: 0.15,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    menu_items: [],
    categories: [
      { id: '1', vendor_id: '1', name: 'Burgers', display_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '2', vendor_id: '1', name: 'Sides', display_order: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ],
  },
  {
    id: '2',
    owner_id: 'user2',
    name: 'Pizza Heaven',
    description: 'Authentic Italian Pizza',
    logo_url: 'https://placehold.co/400x300',
    address: '456 Oak St, Anytown, USA',
    latitude: 37.7739,
    longitude: -122.4312,
    phone: '555-987-6543',
    email: 'info@pizzaheaven.com',
    is_open: true,
    avg_rating: 4.7,
    commission_rate: 0.15,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    menu_items: [],
    categories: [
      { id: '3', vendor_id: '2', name: 'Pizzas', display_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '4', vendor_id: '2', name: 'Pastas', display_order: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ],
  }
];

const mockMenuItems: MenuItem[] = [
  {
    id: '1',
    vendor_id: '1',
    category_id: '1',
    name: 'Classic Burger',
    description: 'Our signature beef patty with lettuce, tomato, and special sauce',
    price: 10.99,
    image_url: 'https://placehold.co/400x300',
    is_available: true,
    is_featured: true,
    prep_time_minutes: 10,
    display_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    vendor_id: '1',
    category_id: '1',
    name: 'Cheese Burger',
    description: 'Classic burger with cheddar cheese',
    price: 12.99,
    image_url: 'https://placehold.co/400x300',
    is_available: true,
    is_featured: false,
    prep_time_minutes: 10,
    display_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const mockOrders: OrderWithDetails[] = [
  {
    id: '1',
    customer_id: 'user3',
    vendor_id: '1',
    driver_id: 'driver1',
    address_id: 'addr1',
    status: 'confirmed' as OrderStatus,
    total_price: 24.98,
    subtotal: 21.98,
    tax: 2.00,
    delivery_fee: 3.00,
    payment_method: 'credit_card' as PaymentMethod,
    payment_status: 'completed' as PaymentStatus,
    special_instructions: 'Ring doorbell twice',
    is_rated: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    vendor: mockVendors[0],
    order_items: [
      {
        id: '1',
        order_id: '1',
        menu_item_id: '1',
        menu_item_name: 'Classic Burger',
        quantity: 2,
        unit_price: 10.99,
        subtotal: 21.98,
        created_at: new Date().toISOString(),
        menu_item: mockMenuItems[0]
      }
    ],
    address: {
      id: 'addr1',
      customer_id: 'user3',
      address_line1: '789 Pine St',
      city: 'Anytown',
      postal_code: '12345',
      country: 'USA',
      is_default: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }
];

// Mock API functions
export const fetchVendors = async (
  filters?: VendorFilters,
  pagination?: PaginationParams,
  userLocation?: GeolocationPosition
): Promise<VendorWithDetails[]> => {
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  let results = [...mockVendors];
  
  // Apply filters
  if (filters?.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    results = results.filter(vendor => 
      vendor.name.toLowerCase().includes(query) || 
      (vendor.description && vendor.description.toLowerCase().includes(query))
    );
  }

  if (filters?.minRating) {
    results = results.filter(vendor => 
      (vendor.avg_rating || 0) >= (filters.minRating || 0)
    );
  }

  if (filters?.isOpen !== undefined) {
    results = results.filter(vendor => vendor.is_open === filters.isOpen);
  }
  
  // Sort by rating if requested
  if (filters?.sortBy === 'rating') {
    results.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
  }
  
  // Add distance if user location provided
  if (userLocation) {
    results = results.map(vendor => ({
      ...vendor,
      distance: calculateDistance(
        userLocation.latitude, 
        userLocation.longitude, 
        vendor.latitude, 
        vendor.longitude
      )
    }));
    
    // Sort by distance if requested
    if (filters?.sortBy === 'distance') {
      results.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }
  }
  
  // Apply pagination
  if (pagination) {
    const { page, pageSize } = pagination;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    results = results.slice(start, end);
  }
  
  return results;
};

export const fetchVendorById = async (id: string): Promise<VendorWithDetails> => {
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const vendor = mockVendors.find(v => v.id === id);
  
  if (!vendor) {
    throw new Error(`Vendor with ID ${id} not found`);
  }
  
  // Add menu items to the vendor
  const vendorWithItems = {
    ...vendor,
    menu_items: mockMenuItems.filter(item => item.vendor_id === id)
  };
  
  return vendorWithItems;
};

export const fetchMenuItems = async (vendorId: string): Promise<MenuItem[]> => {
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return mockMenuItems.filter(item => item.vendor_id === vendorId);
};

export const fetchOrders = async (customerId?: string): Promise<OrderWithDetails[]> => {
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  if (customerId) {
    return mockOrders.filter(order => order.customer_id === customerId);
  }
  
  return mockOrders;
};

export const fetchOrderById = async (orderId: string): Promise<OrderWithDetails> => {
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const order = mockOrders.find(o => o.id === orderId);
  
  if (!order) {
    throw new Error(`Order with ID ${orderId} not found`);
  }
  
  return order;
};

// Utility function to calculate distance between coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}
