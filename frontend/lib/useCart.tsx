/**
 * lib/useCart.ts — Shared cart context
 *
 * Uses React Context so ALL components share the same cart state.
 * Without this, SiteHeader and ProductCard each run separate instances
 * and the counter never updates when items are added.
 *
 * HCI Principle 3 — Visibility: cart count always reflects reality
 * HCI Principle 4 — Error Recovery: confirm before removing items
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

export interface CartItem {
  product_id: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
  brand?: string;
  max_qty?: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => { success: boolean; message: string };
  removeItem: (product_id: string) => void;
  updateQty: (product_id: string, qty: number) => void;
  clearCart: () => void;
  total: number;
  count: number;
}

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = "racks_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) setItems(JSON.parse(s));
    } catch {}
  }, []);

  const persist = (next: CartItem[]) => {
    setItems(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const addItem = useCallback(
    (item: CartItem): { success: boolean; message: string } => {
      const MAX = item.max_qty ?? 10;
      let result = { success: true, message: "" };
      setItems((prev) => {
        const existing = prev.find((i) => i.product_id === item.product_id);
        const currentQty = existing?.qty || 0;
        const newQty = currentQty + item.qty;
        if (newQty > MAX) {
          result = {
            success: false,
            message:
              MAX === 0
                ? `${item.name} is out of stock`
                : `Only ${MAX} available — you already have ${currentQty} in your cart`,
          };
          return prev;
        }
        const next = existing
          ? prev.map((i) =>
              i.product_id === item.product_id ? { ...i, qty: newQty } : i,
            )
          : [...prev, item];
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {}
        result = { success: true, message: `${item.name} added to cart` };
        return next;
      });
      return result;
    },
    [],
  );

  const removeItem = useCallback(
    (product_id: string) => {
      // HCI P.4 — confirm before removing
      const item = items.find((i) => i.product_id === product_id);
      const confirmed =
        typeof window !== "undefined"
          ? window.confirm(
              `Remove "${item?.name || "this item"}" from your cart?`,
            )
          : true;
      if (!confirmed) return;
      setItems((prev) => {
        const next = prev.filter((i) => i.product_id !== product_id);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [items],
  );

  const updateQty = useCallback((product_id: string, qty: number) => {
    setItems((prev) => {
      const item = prev.find((i) => i.product_id === product_id);
      const MAX = item?.max_qty ?? 999;
      // HCI P.5 — Constraints: minimum is 1, not 0
      // Use removeItem to delete — reducing past 1 just stays at 1
      const clamped = Math.min(Math.max(1, qty), MAX);
      const next = prev.map((i) =>
        i.product_id === product_id ? { ...i, qty: clamped } : i,
      );
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQty, clearCart, total, count }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx)
    throw new Error(
      "useCart must be used inside CartProvider — wrap your _app.tsx with <CartProvider>",
    );
  return ctx;
}
