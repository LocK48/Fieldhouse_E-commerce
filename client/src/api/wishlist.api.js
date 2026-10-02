import api from "./axios";

export async function getWishlist() {
  const response = await api.get("/wishlist");
  return response.data.data.products;
}

export async function addWishlistProduct(productId) {
  const response = await api.put(`/wishlist/${productId}`);
  return response.data.data.products;
}

export async function removeWishlistProduct(productId) {
  const response = await api.delete(`/wishlist/${productId}`);
  return response.data.data.products;
}
