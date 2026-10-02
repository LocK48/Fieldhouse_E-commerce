import api from "./axios";

export async function createReview(data) {
  const response = await api.post("/reviews", data);
  return response.data.data.review;
}

export async function getProductReviews(productId, params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== "",
    ),
  );
  const response = await api.get(`/reviews/products/${productId}?${query}`);
  return response.data.data;
}
