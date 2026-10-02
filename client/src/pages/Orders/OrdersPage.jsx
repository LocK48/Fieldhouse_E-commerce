import { useState } from "react";
import { createReview } from "../../api/review.api";
import { formatCurrency, orderStatusLabels } from "../../utils/formatters";

function OrderReview({ order, item, onReviewed }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const productId = item.product?._id || item.product;
  if (
    order.orderStatus !== "DELIVERED" ||
    !productId ||
    order.reviewedProductIds?.includes(String(productId))
  )
    return null;
  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createReview({
        productId,
        orderId: order._id,
        rating: Number(rating),
        comment,
      });
      onReviewed(order._id, productId);
      setOpen(false);
    } catch (reason) {
      setError(
        reason.response?.data?.message ||
          reason.message ||
          "Không gửi được đánh giá.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="order-review">
      {open ? (
        <form onSubmit={submit}>
          <label>
            Đánh giá
            <select value={rating} onChange={(e) => setRating(e.target.value)}>
              {[5, 4, 3, 2, 1].map((value) => (
                <option value={value} key={value}>
                  {"★".repeat(value)} ({value}/5)
                </option>
              ))}
            </select>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={2000}
            placeholder="Chia sẻ trải nghiệm của bạn…"
            rows={3}
          />
          {error && <small role="alert">{error}</small>}
          <button disabled={saving}>
            {saving ? "Đang gửi…" : "Gửi đánh giá"}
          </button>
          <button type="button" onClick={() => setOpen(false)}>
            Hủy
          </button>
        </form>
      ) : (
        <button onClick={() => setOpen(true)}>Viết đánh giá</button>
      )}
    </div>
  );
}

export default function OrdersPage({ orders, loading, onShop, onReviewed }) {
  return (
    <main className="commerce-page">
      <div className="page-heading">
        <button className="back-link" onClick={onShop}>
          ← Tiếp tục mua sắm
        </button>
        <p className="eyebrow">TÀI KHOẢN FIELDHOUSE</p>
        <h1>
          Đơn hàng <em>của bạn.</em>
        </h1>
        <p>Xem trạng thái, địa chỉ giao hàng và từng sản phẩm trong đơn.</p>
      </div>
      {loading ? (
        <div className="commerce-empty">
          <div className="skeleton order-skeleton" />
        </div>
      ) : orders.length ? (
        <div className="orders-list">
          {orders.map((order) => (
            <article className="order-card" key={order._id}>
              <header>
                <div>
                  <small>MÃ ĐƠN</small>
                  <strong>#{order._id.slice(-8).toUpperCase()}</strong>
                  <small>
                    {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                  </small>
                </div>
                <span
                  className={`order-status status-${order.orderStatus?.toLowerCase()}`}
                >
                  {orderStatusLabels[order.orderStatus] || order.orderStatus}
                </span>
              </header>
              <div className="order-card-items">
                {order.items.map((item, index) => (
                  <div
                    className="order-line-item"
                    key={`${item.sku || item.product}-${index}`}
                  >
                    <span>
                      <strong>
                        {item.name} × {item.quantity}
                      </strong>
                      <small>
                        {item.variant?.name ||
                          item.variant?.sku ||
                          item.sku ||
                          ""}
                        {item.store ? ` · ${item.store.name || ""}` : ""}
                      </small>
                    </span>
                    <strong>{formatCurrency(item.subtotal)}</strong>
                    <OrderReview
                      order={order}
                      item={item}
                      onReviewed={onReviewed}
                    />
                  </div>
                ))}
              </div>
              <details className="order-shipping-details">
                <summary>Địa chỉ giao hàng</summary>
                <p>
                  {order.shippingAddress?.recipientName} ·{" "}
                  {order.shippingAddress?.phone}
                </p>
                <p>
                  {order.shippingAddress?.addressLine},{" "}
                  {order.shippingAddress?.ward},{" "}
                  {order.shippingAddress?.district},{" "}
                  {order.shippingAddress?.city}
                </p>
              </details>
              <footer>
                <span>
                  {order.paymentMethod || "COD"} ·{" "}
                  {order.paymentStatus === "PAID"
                    ? "Đã thanh toán"
                    : "Thanh toán khi nhận"}
                </span>
                <strong>{formatCurrency(order.total)}</strong>
              </footer>
            </article>
          ))}
        </div>
      ) : (
        <div className="commerce-empty">
          <span>◇</span>
          <h2>Bạn chưa có đơn hàng</h2>
          <p>Đơn hàng sau khi đặt sẽ xuất hiện tại đây.</p>
          <button className="primary-button" onClick={onShop}>
            Khám phá cửa hàng <span>↗</span>
          </button>
        </div>
      )}
    </main>
  );
}
