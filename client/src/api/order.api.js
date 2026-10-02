import api from "./axios";

export async function createCodOrder(shippingAddress) {
  const response = await api.post("/orders", { shippingAddress });
  return response.data.data.order;
}

export async function getMyOrders(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== "",
    ),
  );
  const response = await api.get(`/orders?${query}`);
  return response.data.data;
}

export async function getMyOrder(id) {
  const response = await api.get(`/orders/${id}`);
  return response.data.data.order;
}
