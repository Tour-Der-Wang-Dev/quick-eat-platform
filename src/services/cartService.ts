
import { MenuItem } from "@/types/app";
import { useLocalStorageCache } from "@/utils/cacheUtils";
import { useCallback } from "react";

export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  options?: {
    groupId: string;
    groupName: string;
    itemId: string;
    itemName: string;
    priceAdjustment: number;
  }[];
  specialInstructions?: string;
}

export interface Cart {
  items: CartItem[];
  vendorId: string | null;
  vendorName: string | null;
}

const EMPTY_CART: Cart = {
  items: [],
  vendorId: null,
  vendorName: null,
};

export const useCart = () => {
  const [cart, setCart] = useLocalStorageCache<Cart>("shopping_cart", EMPTY_CART);

  const clearCart = useCallback(() => {
    setCart(EMPTY_CART);
  }, [setCart]);

  const addToCart = useCallback(
    (
      menuItem: MenuItem,
      quantity: number = 1,
      options?: CartItem["options"],
      specialInstructions?: string,
      vendorName?: string
    ) => {
      setCart((prevCart) => {
        // If adding from a different vendor, clear cart first
        if (prevCart.vendorId && prevCart.vendorId !== menuItem.vendor_id) {
          return {
            items: [
              {
                id: `${menuItem.id}_${Date.now()}`,
                menuItem,
                quantity,
                options,
                specialInstructions,
              },
            ],
            vendorId: menuItem.vendor_id,
            vendorName: vendorName || null,
          };
        }

        const existingItemIndex = prevCart.items.findIndex(
          (item) =>
            item.menuItem.id === menuItem.id &&
            JSON.stringify(item.options) === JSON.stringify(options) &&
            item.specialInstructions === specialInstructions
        );

        let newItems;
        if (existingItemIndex >= 0) {
          // Update existing item
          newItems = [...prevCart.items];
          newItems[existingItemIndex] = {
            ...newItems[existingItemIndex],
            quantity: newItems[existingItemIndex].quantity + quantity,
          };
        } else {
          // Add new item
          newItems = [
            ...prevCart.items,
            {
              id: `${menuItem.id}_${Date.now()}`,
              menuItem,
              quantity,
              options,
              specialInstructions,
            },
          ];
        }

        return {
          items: newItems,
          vendorId: menuItem.vendor_id,
          vendorName: vendorName || prevCart.vendorName,
        };
      });
    },
    [setCart]
  );

  const updateCartItem = useCallback(
    (itemId: string, quantity: number) => {
      setCart((prevCart) => {
        if (quantity <= 0) {
          // Remove item if quantity is 0 or less
          return {
            ...prevCart,
            items: prevCart.items.filter((item) => item.id !== itemId),
          };
        }

        return {
          ...prevCart,
          items: prevCart.items.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          ),
        };
      });
    },
    [setCart]
  );

  const removeCartItem = useCallback(
    (itemId: string) => {
      setCart((prevCart) => ({
        ...prevCart,
        items: prevCart.items.filter((item) => item.id !== itemId),
      }));
    },
    [setCart]
  );

  // Calculate cart totals with memoization
  const calculateTotals = useCallback(() => {
    const subtotal = cart.items.reduce(
      (sum, item) => {
        const itemPrice = item.menuItem.price;
        const optionsPrice = item.options?.reduce(
          (total, opt) => total + (opt.priceAdjustment || 0),
          0
        ) || 0;
        
        const totalItemPrice = (itemPrice + optionsPrice) * item.quantity;
        return sum + totalItemPrice;
      },
      0
    );
    
    // Example tax calculation (assuming 7% tax)
    const tax = subtotal * 0.07;
    
    // Example delivery fee calculation (fixed fee of 40)
    const deliveryFee = cart.items.length > 0 ? 40 : 0;
    
    // Total cost
    const total = subtotal + tax + deliveryFee;
    
    return {
      subtotal,
      tax,
      deliveryFee,
      total,
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }, [cart.items]);

  return {
    cart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    ...calculateTotals(),
  };
};
