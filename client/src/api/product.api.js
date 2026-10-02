import api from "./axios";

export async function getProducts(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== "",
    ),
  );
  const response = await api.get(`/products?${query}`);
  return response.data.data;
}

export async function getProduct(id) {
  const response = await api.get(`/products/${id}`);
  return response.data.data.product;
}

export async function getMyProducts() {
  const response = await api.get("/products/seller/me");
  return response.data.data.products;
}

export async function createProduct(data) {
  const response = await api.post("/products", data);
  return response.data.data.product;
}

export async function updateProduct(id, data) {
  const response = await api.patch(`/products/${id}`, data);
  return response.data.data.product;
}

export async function deleteProduct(id) {
  return api.delete(`/products/${id}`);
}
