
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { useAuth } from '@/services/authService';
import { useCart } from '@/services/cartService';
import { useUserLocation } from '@/services/locationService';
import { GeolocationPosition } from '@/types/app';

// App state interface
interface AppState {
  darkMode: boolean;
  selectedLanguage: string;
  searchQuery: string;
  notifications: {
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
  }[];
}

// Define actions
type AppAction = 
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'SET_LANGUAGE'; payload: string }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<AppState['notifications'][0], 'id' | 'read'> }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' };

// Initial state
const initialState: AppState = {
  darkMode: false,
  selectedLanguage: 'en',
  searchQuery: '',
  notifications: [],
};

// Reducer function
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'TOGGLE_DARK_MODE':
      return { ...state, darkMode: !state.darkMode };
    case 'SET_LANGUAGE':
      return { ...state, selectedLanguage: action.payload };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'ADD_NOTIFICATION':
      return { 
        ...state, 
        notifications: [
          { 
            id: Date.now().toString(), 
            ...action.payload, 
            read: false 
          }, 
          ...state.notifications
        ].slice(0, 20) // Keep only the last 20 notifications
      };
    case 'MARK_NOTIFICATION_READ':
      return { 
        ...state, 
        notifications: state.notifications.map(n => 
          n.id === action.payload ? { ...n, read: true } : n
        )
      };
    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [] };
    default:
      return state;
  }
};

// Create context
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  user: ReturnType<typeof useAuth>['user'];
  loading: ReturnType<typeof useAuth>['loading'];
  signIn: ReturnType<typeof useAuth>['signIn'];
  signUp: ReturnType<typeof useAuth>['signUp'];
  signOut: ReturnType<typeof useAuth>['signOut'];
  cart: ReturnType<typeof useCart>['cart'];
  addToCart: ReturnType<typeof useCart>['addToCart'];
  updateCartItem: ReturnType<typeof useCart>['updateCartItem'];
  removeCartItem: ReturnType<typeof useCart>['removeCartItem'];
  clearCart: ReturnType<typeof useCart>['clearCart'];
  subtotal: ReturnType<typeof useCart>['subtotal'];
  tax: ReturnType<typeof useCart>['tax'];
  deliveryFee: ReturnType<typeof useCart>['deliveryFee'];
  total: ReturnType<typeof useCart>['total'];
  itemCount: ReturnType<typeof useCart>['itemCount'];
  location: GeolocationPosition | null;
  updateLocation: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { user, loading, signIn, signUp, signOut } = useAuth();
  const { 
    cart, addToCart, updateCartItem, removeCartItem, 
    clearCart, subtotal, tax, deliveryFee, total, itemCount 
  } = useCart();
  const { location, updateLocation } = useUserLocation();

  // Initialize dark mode based on user preference
  React.useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark && !state.darkMode) {
      dispatch({ type: 'TOGGLE_DARK_MODE' });
    }
  }, []);

  // Apply dark mode class to document
  React.useEffect(() => {
    if (state.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.darkMode]);

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        user,
        loading,
        signIn,
        signUp,
        signOut,
        cart,
        addToCart,
        updateCartItem,
        removeCartItem,
        clearCart,
        subtotal,
        tax,
        deliveryFee,
        total,
        itemCount,
        location,
        updateLocation
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the AppContext
export const useAppContext = (): AppContextValue => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
