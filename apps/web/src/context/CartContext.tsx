import { createContext, useContext, useEffect, useCallback, useState, ReactNode } from 'react';
import api from '../api/client';
import type { Cart, CheckoutResult } from '../types';

const ACTIVE_VENDOR_KEY = 'activeCartVendorId';

export interface CheckoutPayload {
  cartId: string;
  paymentMethod?: string;
  deliveryAddress: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  specialInstructions?: string;
  currency?: string;
  customerEmail?: string;
}

interface CartContextType {
  cart: Cart | null;
  activeVendorId: string | null;
  loading: boolean;
  mutation: boolean;
  error: string | null;
  itemCount: number;
  setActiveVendor: (vendorId: string) => void;
  refresh: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  checkout: (payload: CheckoutPayload) => Promise<CheckoutResult | null>;
  reset: () => void;
}

function unwrap<T>(res: { data: unknown }): T | null {
  let payload: unknown = res.data;
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    payload = (payload as Record<string, unknown>).data;
  }
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    payload = (payload as Record<string, unknown>).data;
  }
  return (payload ?? null) as T | null;
}

function errorMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e.response?.data?.message || e.message || 'Request failed';
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [activeVendorId, setActiveVendorIdState] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_VENDOR_KEY) : null,
  );
  const [loading, setLoading] = useState(false);
  const [mutation, setMutation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const vendorId = activeVendorId;
    if (!vendorId) {
      setCart(null);
      return;
    }
    if (!localStorage.getItem('accessToken')) return;
    setLoading(true);
    try {
      const res = await api.get(`/carts?vendorId=${vendorId}`);
      setCart(unwrap<Cart>(res));
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [activeVendorId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setActiveVendor = useCallback((vendorId: string) => {
    localStorage.setItem(ACTIVE_VENDOR_KEY, vendorId);
    setActiveVendorIdState(vendorId);
    setError(null);
  }, []);

  const runMutation = useCallback(async (fn: () => Promise<{ data: unknown }>) => {
    if (!localStorage.getItem('accessToken')) return null;
    setMutation(true);
    setError(null);
    try {
      const res = await fn();
      setCart(unwrap<Cart>(res));
      return res;
    } catch (err) {
      setError(errorMessage(err));
      throw err;
    } finally {
      setMutation(false);
    }
  }, []);

  const addItem = useCallback((productId: string, quantity = 1) => {
    if (!activeVendorId) throw new Error('No vendor selected');
    return runMutation(() =>
      api.post('/carts/items', { vendorId: activeVendorId, productId, quantity }),
    );
  }, [activeVendorId, runMutation]);

  const updateItem = useCallback((productId: string, quantity: number) => {
    if (!cart) throw new Error('No active cart');
    return runMutation(() =>
      api.patch(`/carts/${cart.id}/items/${productId}`, { quantity }),
    );
  }, [cart, runMutation]);

  const removeItem = useCallback((productId: string) => {
    if (!cart) throw new Error('No active cart');
    return runMutation(() => api.delete(`/carts/${cart.id}/items/${productId}`));
  }, [cart, runMutation]);

  const clearCart = useCallback(() => {
    if (!cart) return Promise.resolve();
    return runMutation(() => api.delete(`/carts/${cart.id}`));
  }, [cart, runMutation]);

  const checkout = useCallback(async (payload: CheckoutPayload): Promise<CheckoutResult | null> => {
    if (!localStorage.getItem('accessToken')) return null;
    setMutation(true);
    setError(null);
    try {
      const res = await api.post('/orders/checkout', payload);
      const result = unwrap<CheckoutResult>(res);
      setCart(null);
      return result;
    } catch (err) {
      setError(errorMessage(err));
      return null;
    } finally {
      setMutation(false);
    }
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(ACTIVE_VENDOR_KEY);
    setActiveVendorIdState(null);
    setCart(null);
    setError(null);
  }, []);

  const value: CartContextType = {
    cart,
    activeVendorId,
    loading,
    mutation,
    error,
    itemCount: cart?.itemCount ?? 0,
    setActiveVendor,
    refresh,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    checkout,
    reset,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
