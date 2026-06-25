import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI } from '../api';

const CartContext = createContext(null);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);

  const fetchCart = useCallback(async () => {
    try {
      const { data } = await cartAPI.get();
      setCart(data);
    } catch {
      // Cart may not exist yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  useEffect(() => {
    const onLogin = () => {
      setLoading(true);
      fetchCart();
    };
    const onLogout = () => {
      setCart(null);
    };
    window.addEventListener('auth:login', onLogin);
    window.addEventListener('auth:logout', onLogout);
    return () => {
      window.removeEventListener('auth:login', onLogin);
      window.removeEventListener('auth:logout', onLogout);
    };
  }, [fetchCart]);

  const addToCart = async (productId, quantity = 1, variantId = null, options = null) => {
    const { data } = await cartAPI.add({
      product_id: productId,
      product_variant_id: variantId,
      quantity,
      options,
    });
    setCart(data);
    setCartOpen(true);
    return data;
  };

  const updateQuantity = async (itemId, quantity) => {
    const { data } = await cartAPI.update(itemId, { quantity });
    setCart(data);
    return data;
  };

  const removeItem = async (itemId) => {
    const { data } = await cartAPI.remove(itemId);
    setCart(data);
    return data;
  };

  const applyCoupon = async (code) => {
    const { data } = await cartAPI.applyCoupon(code);
    setCart(data);
    return data;
  };

  const removeCoupon = async () => {
    const { data } = await cartAPI.removeCoupon();
    setCart(data);
    return data;
  };

  const itemCount = cart?.items?.length || 0;
  const cartTotal = cart?.total || 0;

  return (
    <CartContext.Provider value={{
      cart, loading, cartOpen, setCartOpen,
      itemCount, cartTotal,
      addToCart, updateQuantity, removeItem,
      applyCoupon, removeCoupon, refreshCart: fetchCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}