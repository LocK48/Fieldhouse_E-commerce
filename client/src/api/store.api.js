import api from "./axios";

export async function getMyStore() {
  const response = await api.get("/stores/me");
  return response.data.data.store;
}

export async function createStore(data) {
  const response = await api.post("/stores", data);
  return response.data.data.store;
}

export async function updateMyStore(data) {
  const response = await api.patch("/stores/me", data);
  return response.data.data.store;
}

export async function getPublicStore(slug) {
  const response = await api.get(`/stores/slug/${encodeURIComponent(slug)}`);
  return response.data.data;
}
