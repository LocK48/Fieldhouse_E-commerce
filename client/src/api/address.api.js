import api from "./axios";

export async function getAddresses() {
  const response = await api.get("/users/me/addresses");
  return response.data.data.addresses;
}

export async function createAddress(data) {
  const response = await api.post("/users/me/addresses", data);
  return response.data.data.address;
}

export async function updateAddress(id, data) {
  const response = await api.patch(`/users/me/addresses/${id}`, data);
  return response.data.data.address;
}

export async function deleteAddress(id) {
  await api.delete(`/users/me/addresses/${id}`);
}
