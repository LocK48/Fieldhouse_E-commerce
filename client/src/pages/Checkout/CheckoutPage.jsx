import { formatCurrency } from "../../utils/formatters";

export default function CheckoutPage({
  cart,
  cartTotal,
  shippingFee,
  shipping,
  addresses = [],
  onChooseAddress,
  onShippingChange,
  busy,
  onBack,
  onSubmit,
}) {
  function updateField(event) {
    onShippingChange({ ...shipping, [event.target.name]: event.target.value });
  }
  return (
    <main className="commerce-page">
      <div className="page-heading">
        <button className="back-link" onClick={onBack}>
          ← Quay lại giỏ hàng
        </button>
        <p className="eyebrow">HOÀN TẤT ĐƠN HÀNG</p>
        <h1>
          Thông tin <em>giao hàng.</em>
        </h1>
        <p>Đơn hàng được thanh toán khi nhận (COD).</p>
      </div>
      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={onSubmit}>
          <h2>Địa chỉ nhận hàng</h2>
          {addresses.length > 0 && (
            <label className="saved-address-select">
              Dùng địa chỉ đã lưu
              <select
                defaultValue=""
                onChange={(event) => {
                  const selected = addresses.find(
                    (address) => address._id === event.target.value,
                  );
                  if (selected) onChooseAddress(selected);
                }}
              >
                <option value="">Nhập địa chỉ khác</option>
                {addresses.map((address) => (
                  <option key={address._id} value={address._id}>
                    {address.recipientName} · {address.addressLine}
                    {address.isDefault ? " (Mặc định)" : ""}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="form-grid">
            <label>
              Người nhận
              <input
                name="recipientName"
                required
                maxLength={100}
                value={shipping.recipientName}
                onChange={updateField}
              />
            </label>
            <label>
              Số điện thoại
              <input
                name="phone"
                required
                type="tel"
                minLength={8}
                maxLength={30}
                value={shipping.phone}
                onChange={updateField}
                placeholder="09xx xxx xxx"
              />
            </label>
            <label className="field-wide">
              Địa chỉ
              <input
                name="addressLine"
                required
                maxLength={250}
                value={shipping.addressLine}
                onChange={updateField}
                placeholder="Số nhà, tên đường"
              />
            </label>
            <label>
              Phường / xã
              <input
                name="ward"
                required
                maxLength={100}
                value={shipping.ward}
                onChange={updateField}
              />
            </label>
            <label>
              Quận / huyện
              <input
                name="district"
                required
                maxLength={100}
                value={shipping.district}
                onChange={updateField}
              />
            </label>
            <label className="field-wide">
              Tỉnh / thành phố
              <input
                name="city"
                required
                maxLength={100}
                value={shipping.city}
                onChange={updateField}
              />
            </label>
          </div>
          <div className="payment-choice">
            <span className="payment-radio">✓</span>
            <span>
              <strong>Thanh toán khi nhận hàng</strong>
              <small>Chuẩn bị tiền mặt khi đơn hàng được giao tới.</small>
            </span>
            <b>COD</b>
          </div>
          <button
            className="primary-button full-button"
            disabled={
              busy ||
              !cart.items.length ||
              cart.items.some((item) => !item.available)
            }
          >
            {busy ? "Đang tạo đơn…" : `Đặt hàng · ${formatCurrency(cartTotal)}`}{" "}
            <span>↗</span>
          </button>
        </form>
        <aside className="order-summary checkout-summary">
          <h2>Đơn hàng của bạn</h2>
          {cart.items.map((item) => (
            <div
              className="checkout-item"
              key={`${item.product._id}-${item.variant?._id}`}
            >
              <span>
                {item.product.name} × {item.quantity}
              </span>
              <strong>{formatCurrency(item.subtotal)}</strong>
            </div>
          ))}
          <div>
            <span>Tạm tính</span>
            <strong>{formatCurrency(cart.subtotal)}</strong>
          </div>
          <div>
            <span>Giao hàng</span>
            <strong>
              {shippingFee ? formatCurrency(shippingFee) : "Miễn phí"}
            </strong>
          </div>
          <div className="summary-total">
            <span>Tổng cộng</span>
            <strong>{formatCurrency(cartTotal)}</strong>
          </div>
          <small>Giá được xác nhận lại từ kho khi đặt hàng.</small>
        </aside>
      </div>
    </main>
  );
}
