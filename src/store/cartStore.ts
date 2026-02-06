import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface CartState {
  items: CartItem[];
  discount: number;
  customerId: string | null;
  employeeSplits: Array<{ userId: string; percentage: number }>;

  // Computed values stored in state for reactivity
  subtotal: number;

  // Actions
  addItem: (item: { productId: string; name: string; sku: string; price: number }, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setDiscount: (amount: number) => void;
  setCustomer: (customerId: string | null) => void;
  setEmployeeSplits: (splits: Array<{ userId: string; percentage: number }>) => void;
  clear: () => void;

  // Helpers (derived calculations)
  tax: (taxRate: number) => number;
  total: (taxRate: number) => number;
}

const calculateSubtotal = (items: CartItem[]) => {
  return items.reduce((sum, item) => sum + item.subtotal, 0);
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      discount: 0,
      customerId: null,
      employeeSplits: [],
      subtotal: 0,

      addItem: (product, quantity) => {
        const items = get().items;
        const existing = items.find((item) => item.productId === product.productId);
        let newItems;

        if (existing) {
          newItems = items.map((item) =>
            item.productId === product.productId
              ? {
                ...item,
                quantity: item.quantity + quantity,
                subtotal: (item.quantity + quantity) * item.price,
              }
              : item
          );
        } else {
          newItems = [
            ...items,
            {
              id: `cart-${product.productId}`,
              productId: product.productId,
              name: product.name,
              sku: product.sku,
              price: product.price,
              quantity,
              subtotal: product.price * quantity,
            },
          ];
        }

        set({
          items: newItems,
          subtotal: calculateSubtotal(newItems)
        });
      },

      removeItem: (productId) => {
        const newItems = get().items.filter((item) => item.productId !== productId);
        set({
          items: newItems,
          subtotal: calculateSubtotal(newItems)
        });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        const newItems = get().items.map((item) =>
          item.productId === productId
            ? { ...item, quantity, subtotal: quantity * item.price }
            : item
        );

        set({
          items: newItems,
          subtotal: calculateSubtotal(newItems)
        });
      },

      setDiscount: (amount) => set({ discount: amount }),
      setCustomer: (customerId) => set({ customerId }),
      setEmployeeSplits: (splits) => set({ employeeSplits: splits }),

      clear: () => set({
        items: [],
        discount: 0,
        customerId: null,
        employeeSplits: [],
        subtotal: 0
      }),

      tax: (taxRate) => {
        const subtotal = get().subtotal; // Now accessing updated state
        const discount = get().discount;
        // Tax usually applied after discount? Yes.
        const taxable = Math.max(0, subtotal - discount);
        return taxable * (taxRate / 100);
      },

      total: (taxRate) => {
        const subtotal = get().subtotal;
        const discount = get().discount;
        const taxAmount = get().tax(taxRate); // Call internal helper
        return Math.max(0, subtotal - discount) + taxAmount;
      },
    }),
    {
      name: 'pos-pro-cart',
    }
  )
);

export type { CartItem };
