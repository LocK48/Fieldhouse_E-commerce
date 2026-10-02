import api from "./axios";

export async function getSellerApplications() {
  const response = await api.get("/admin/seller-applications");
  return response.data.data.applications;
}

export async function getPendingStores() {
  const response = await api.get("/admin/stores/pending");
  return response.data.data.stores;
}

export async function approveStore(storeId) {
  const response = await api.patch(`/admin/stores/${storeId}/approve`);
  return response.data.data.store;
}

export async function reviewSellerApplication(userId, approved) {
  const response = await api.patch(
    `/admin/seller-applications/${userId}/${approved ? "approve" : "reject"}`,
    approved ? {} : { rejectionReason: "Chưa đáp ứng điều kiện xét duyệt." },
  );
  return response.data.data.user;
}

export async function getPendingProducts() {
  const response = await api.get("/admin/products/pending");
  return response.data.data.products;
}

export async function reviewProduct(productId, approved) {
  const response = await api.patch(
    `/admin/products/${productId}/${approved ? "approve" : "reject"}`,
  );
  return response.data.data.product;
}

export async function getManageableOrders() {
  const response = await api.get('/admin/orders')
  return response.data.data.orders
}

export async function advanceOrder(orderId) {
  const response = await api.patch(`/admin/orders/${orderId}/advance`)
  return response.data.data.order
}
