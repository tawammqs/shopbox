import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  slug: string;
  title: string;
  image: string;
  colorId: string | null;
  colorName: string | null;
  sizeId: string | null;
  sizeLabel: string | null;
  unitPrice: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, colorId: string | null, sizeId: string | null) => void;
  updateQty: (productId: string, colorId: string | null, sizeId: string | null, qty: number) => void;
  clear: () => void;
  totalCount: () => number;
  totalPrice: () => number;
};

const sameLine = (a: CartItem, productId: string, colorId: string | null, sizeId: string | null) =>
  a.productId === productId && a.colorId === colorId && a.sizeId === sizeId;

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      addItem: (item) =>
        set((s) => {
          const existing = s.items.find((i) => sameLine(i, item.productId, item.colorId, item.sizeId));
          if (existing) {
            return {
              items: s.items.map((i) =>
                sameLine(i, item.productId, item.colorId, item.sizeId)
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i,
              ),
              isOpen: true,
            };
          }
          return { items: [...s.items, item], isOpen: true };
        }),
      removeItem: (productId, colorId, sizeId) =>
        set((s) => ({ items: s.items.filter((i) => !sameLine(i, productId, colorId, sizeId)) })),
      updateQty: (productId, colorId, sizeId, qty) =>
        set((s) => ({
          items: s.items
            .map((i) => (sameLine(i, productId, colorId, sizeId) ? { ...i, quantity: Math.max(1, qty) } : i))
            .filter((i) => i.quantity > 0),
        })),
      clear: () => set({ items: [] }),
      totalCount: () => get().items.reduce((a, b) => a + b.quantity, 0),
      totalPrice: () => get().items.reduce((a, b) => a + b.unitPrice * b.quantity, 0),
    }),
    { name: "cart-v1" },
  ),
);
