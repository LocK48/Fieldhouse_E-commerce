import api from "./axios";

export async function applySeller(data) {
  const response = await api.post("/users/me/seller-application", data);
  return response.data.data.user;
}

export async function updateProfile(data) {
  const response = await api.patch("/users/me", data);
  return response.data.data.user;
}

export async function changePassword(data) {
  const response = await api.patch("/users/me/password", data);
  return response.data;
}
