import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  slug: string;
}

export interface CustomerInfo {
  fullName: string;
  phone: string;
  email: string;
  deliveryAddress: string;
  paymentMethod: 'card' | 'cash';
}

interface CartStore {
  items: CartItem[];
  customerInfo: CustomerInfo;
  isOpen: boolean;
  
  // Cart actions
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  
  // Customer info actions
  updateCustomerInfo: (info: Partial<CustomerInfo>) => void;
  
  // UI actions
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  
  // Computed values
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      customerInfo: {
        fullName: '',
        phone: '',
        email: '',
        deliveryAddress: '',
        paymentMethod: 'card',
      },
      isOpen: false,

      addItem: (item) => {
        console.log('Adding item to cart:', item);
        const items = get().items;
        const existingItem = items.find(i => i.id === item.id);
        
        if (existingItem) {
          set({
            items: items.map(i =>
              i.id === item.id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            )
          });
        } else {
          set({
            items: [...items, { ...item, quantity: 1 }]
          });
        }
      },

      removeItem: (id) => {
        set({
          items: get().items.filter(item => item.id !== id)
        });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        
        set({
          items: get().items.map(item =>
            item.id === id ? { ...item, quantity } : item
          )
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      updateCustomerInfo: (info) => {
        set({
          customerInfo: { ...get().customerInfo, ...info }
        });
      },

      openCart: () => {
        set({ isOpen: true });
      },

      closeCart: () => {
        set({ isOpen: false });
      },

      toggleCart: () => {
        set({ isOpen: !get().isOpen });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
        customerInfo: state.customerInfo,
      }),
    }
  )
);

