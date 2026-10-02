import { formatCurrency } from "../../utils/formatters";

export default function CartPage({
  cart,
  cartCount,
  shippingFee,
  cartTotal,
  busy,
  productImage,
  onChangeQuantity,
  onRemoveItem,
  onClearCart,
  onContinueShopping,
  onCheckout,
}) {
  return (
    <main className="commerce-page">
      <div className="page-heading">
        <button className="back-link" onClick={onContinueShopping}>
          ← Tiếp tục mua sắm
        </button>
        <p className="eyebrow">GIỎ HÀNG CỦA BẠN</p>
        <h1>
          Những món đồ <em>bạn chọn.</em>
        </h1>
        <p>{cartCount} sản phẩm {cartCount > 0 && <button className="remove-link" disabled={busy} onClick={onClearCart}>Xóa tất cả</button>}</p>
      </div>
      {!cart.items.length ? (
        <div className="commerce-empty">
          <span>🛒</span>
          <h2>Giỏ hàng đang trống</h2>
          <p>Khám phá bộ sưu tập và thêm món đồ bạn cần.</p>
          <button className="primary-button" onClick={onContinueShopping}>
            Đến cửa hàng <span>↗</span>
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          <section className="cart-lines">
            {cart.items.map((item) => (
              <article
                className={`cart-line ${item.available ? "" : "cart-line-unavailable"}`}
                key={`${item.product._id}-${item.variant?._id}`}
              >
                <div className="cart-thumb">
                  {productImage(item.product) ? (
                    <img
                      src={productImage(item.product)}
                      alt={item.product.name}
                    />
                  ) : (
                    <span>{item.product.name?.slice(0, 1)}</span>
                  )}
                </div>
                <div className="cart-item-info">
                  <p className="product-brand">
                    {item.product.brand || "FIELDHOUSE"}
                  </p>
                  <h2>{item.product.name}</h2>
                  <p>
                    {item.variant?.name ||
                      item.variant?.sku ||
                      "Phiên bản mặc định"}
                  </p>
                  {!item.available && (
                    <strong className="stock-warning">
                      Sản phẩm không đủ tồn kho. Hãy giảm số lượng hoặc xóa khỏi
                      giỏ.
                    </strong>
                  )}
                  <button
                    className="remove-link"
                    disabled={busy}
                    onClick={() => onRemoveItem(item)}
                  >
                    Xóa
                  </button>
                </div>
                <div className="cart-item-end">
                  <strong>{formatCurrency(item.subtotal)}</strong>
                  <div className="quantity-control">
                    <button
                      disabled={busy || item.quantity <= 1}
                      onClick={() => onChangeQuantity(item, item.quantity - 1)}
                      aria-label="Giảm số lượng"
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      disabled={
                        busy || item.quantity >= (item.variant?.stock || 99)
                      }
                      onClick={() => onChangeQuantity(item, item.quantity + 1)}
                      aria-label="Tăng số lượng"
                    >
                      +
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
          <aside className="order-summary">
            <h2>Tóm tắt đơn hàng</h2>
            <div>
              <span>Tạm tính</span>
              <strong>{formatCurrency(cart.subtotal)}</strong>
            </div>
            <div>
              <span>Phí giao hàng</span>
              <strong>
                {shippingFee ? formatCurrency(shippingFee) : "Miễn phí"}
              </strong>
            </div>
            <p className="shipping-hint">
              {cart.subtotal < 1500000
                ? `Mua thêm ${formatCurrency(1500000 - cart.subtotal)} để được miễn phí giao hàng.`
                : "Đơn hàng của bạn được miễn phí giao hàng."}
            </p>
            <div className="summary-total">
              <span>Tổng cộng</span>
              <strong>{formatCurrency(cartTotal)}</strong>
            </div>
            <button
              className="primary-button full-button"
              disabled={
                busy ||
                !cart.items.length ||
                cart.items.some((item) => !item.available)
              }
              onClick={onCheckout}
            >
              Tiến hành đặt hàng <span>↗</span>
            </button>
            <small>Thanh toán tiền mặt khi nhận hàng (COD)</small>
          </aside>
        </div>
      )}
    </main>
  );
}
