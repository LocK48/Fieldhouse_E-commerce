import { useEffect, useState } from "react";
import { getProductReviews } from "../../api/review.api";

export default function ProductReviews({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    getProductReviews(productId)
      .then((result) => setReviews(result.reviews || []))
      .catch((reason) => setError(reason.message || "Không tải được đánh giá."))
      .finally(() => setLoading(false));
  }, [productId]);
  return (
    <section className="product-reviews">
      <h3>Đánh giá sản phẩm</h3>
      {loading ? (
        <small>Đang tải đánh giá…</small>
      ) : error ? (
        <small>{error}</small>
      ) : reviews.length ? (
        reviews.map((review) => (
          <article key={review._id}>
            <header>
              <strong>{review.user?.name || "Khách hàng"}</strong>
              <span>
                {"★".repeat(review.rating)}
                {"☆".repeat(5 - review.rating)}
              </span>
            </header>
            {review.comment && <p>{review.comment}</p>}
            <small>
              {new Date(review.createdAt).toLocaleDateString("vi-VN")}
            </small>
          </article>
        ))
      ) : (
        <small>Sản phẩm chưa có đánh giá.</small>
      )}
    </section>
  );
}
