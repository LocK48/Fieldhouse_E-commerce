import { formatCurrency } from "../../utils/formatters";
import CartLineItem from "../../components/cart/CartLineItem";

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
        <p>
          {cartCount} sản phẩm{" "}
          {cartCount > 0 && (
            <button
              className="remove-link"
              disabled={busy}
              onClick={onClearCart}
            >
              Xóa tất cả
            </button>
          )}
        </p>
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
              <CartLineItem
                key={`${item.product._id}-${item.variant?._id}`}
                item={item}
                busy={busy}
                productImage={productImage}
                onChangeQuantity={onChangeQuantity}
                onRemoveItem={onRemoveItem}
              />
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
