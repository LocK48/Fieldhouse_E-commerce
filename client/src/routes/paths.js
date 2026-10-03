export const ROUTES = Object.freeze({
  HOME: "/",
  PRODUCTS: "/products",
  PRODUCT_DETAIL: "/products/:productId",
  STOREFRONT: "/stores/slug/:slug",
  CART: "/cart",
  CHECKOUT: "/checkout",
  ORDERS: "/orders",
  PROFILE: "/profile",
  WISHLIST: "/wishlist",
  SELLER: "/seller",
  SELLER_MESSAGES: "/seller/messages",
  ADMIN: "/admin",
  ADMIN_MESSAGES: "/admin/messages",
});

export const productDetailPath = (productId) => `/products/${productId}`;
export const storefrontPath = (slug) =>
  `/stores/slug/${encodeURIComponent(slug)}`;
