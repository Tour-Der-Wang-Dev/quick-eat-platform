
import { MenuItem } from '@/types/app';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define Cart types
export type CartItem = {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
  image?: string;
};

export type Cart = {
  items: CartItem[];
  vendorId?: string;
  vendorName?: string;
};

// Define Cart Store interface
interface CartStore {
  cart: Cart;
  addToCart: (item: MenuItem, quantity: number, specialInstructions?: string) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  getSubtotal: () => number;
  getTax: () => number;
  getDeliveryFee: () => number;
}

// Tax and delivery fee calculations
const calculateTax = (subtotal: number): number => subtotal * 0.10;
const calculateDeliveryFee = (subtotal: number): number => {
  if (subtotal >= 50) return 0;
  return 5.99;
};

// Create and export the cart store
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: { items: [] },
      
      addToCart: (menuItem: MenuItem, quantity: number, specialInstructions?: string) => {
        const { cart } = get();
        
        // Check if adding from a different vendor
        if (cart.vendorId && cart.vendorId !== menuItem.vendor_id) {
          // Confirm with user before clearing cart
          const confirmClear = window.confirm(
            `Your cart contains items from ${cart.vendorName}. Do you want to clear it and add items from this restaurant instead?`
          );
          
          if (!confirmClear) return;
          
          // Clear cart if confirmed
          set({
            cart: {
              items: [],
              vendorId: undefined,
              vendorName: undefined,
            }
          });
        }
        
        // Check if item already exists in cart
        const existingItemIndex = cart.items.findIndex(
          item => item.menuItemId === menuItem.id
        );
        
        if (existingItemIndex >= 0) {
          // Update existing item
          const updatedItems = [...cart.items];
          updatedItems[existingItemIndex].quantity += quantity;
          if (specialInstructions) {
            updatedItems[existingItemIndex].specialInstructions = specialInstructions;
          }
          
          // Update cart with new items
          set({ cart: { 
            ...cart,
            items: updatedItems,
            vendorId: menuItem.vendor_id,
          }});
        } else {
          // Add new item
          const newItem: CartItem = {
            id: `${Date.now()}`, // Generate unique ID
            menuItemId: menuItem.id,
            name: menuItem.name,
            price: menuItem.price,
            quantity,
            specialInstructions,
            image: menuItem.image_url,
          };
          
          // Update cart with new item and vendor info if needed
          set({ cart: {
            items: [...cart.items, newItem],
            vendorId: menuItem.vendor_id,
            vendorName: cart.vendorName || "Restaurant", // This would be replaced with actual vendor name
          }});
        }
      },
      
      removeFromCart: (itemId: string) => {
        const { cart } = get();
        const updatedItems = cart.items.filter(item => item.id !== itemId);
        
        // If cart is empty after removal, clear vendor info
        const updatedCart: Cart = updatedItems.length > 0 
          ? { ...cart, items: updatedItems }
          : { items: [], vendorId: undefined, vendorName: undefined };
        
        set({ cart: updatedCart });
      },
      
      updateQuantity: (itemId: string, quantity: number) => {
        const { cart } = get();
        
        if (quantity <= 0) {
          get().removeFromCart(itemId);
          return;
        }
        
        const updatedItems = cart.items.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        );
        
        set({ cart: { ...cart, items: updatedItems } });
      },
      
      clearCart: () => {
        set({
          cart: {
            items: [],
            vendorId: undefined,
            vendorName: undefined,
          }
        });
      },
      
      getTotal: () => {
        const subtotal = get().getSubtotal();
        const tax = get().getTax();
        const deliveryFee = get().getDeliveryFee();
        return subtotal + tax + deliveryFee;
      },
      
      getItemCount: () => {
        return get().cart.items.reduce((count, item) => count + item.quantity, 0);
      },
      
      getSubtotal: () => {
        return get().cart.items.reduce(
          (sum, item) => sum + item.price * item.quantity, 
          0
        );
      },
      
      getTax: () => {
        return calculateTax(get().getSubtotal());
      },
      
      getDeliveryFee: () => {
        return calculateDeliveryFee(get().getSubtotal());
      },
    }),
    {
      name: 'food-delivery-cart',
    }
  )
);

// Export a hook that can be used in components
export const useCart = () => {
  const store = useCartStore();
  
  return {
    cart: store.cart,
    addToCart: store.addToCart,
    updateCartItem: store.updateQuantity,
    removeCartItem: store.removeFromCart,
    clearCart: store.clearCart,
    subtotal: store.getSubtotal(),
    tax: store.getTax(),
    deliveryFee: store.getDeliveryFee(),
    total: store.getTotal(),
    itemCount: store.getItemCount(),
  };
};
