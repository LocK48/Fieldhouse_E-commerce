import { create } from "zustand";

export const useCommerceStore = create((set) => {
  const updateValue = (key, value) =>
    set((state) => ({
      [key]: typeof value === "function" ? value(state[key]) : value,
    }));

  return {
    user: null,
    cart: { items: [], subtotal: 0 },
    wishlist: [],
    addresses: [],
    setUser: (value) => updateValue("user", value),
    setCart: (value) => updateValue("cart", value),
    setWishlist: (value) => updateValue("wishlist", value),
    setAddresses: (value) => updateValue("addresses", value),
    clearCommerceState: () =>
      set({ user: null, cart: { items: [], subtotal: 0 }, wishlist: [], addresses: [] }),
  };
});
