import api from "./axios";

export async function getCategories() {
  const response = await api.get("/categories");
  return response.data.data.categories;
}

export async function createCategory(data) {
  const response = await api.post("/categories", data);
  return response.data.data.category;
}

export async function updateCategory(id, data) {
  const response = await api.patch(`/categories/${id}`, data);
  return response.data.data.category;
}

export async function deleteCategory(id) {
  await api.delete(`/categories/${id}`);
}
