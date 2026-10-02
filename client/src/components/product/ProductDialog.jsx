import { formatCurrency } from "../../utils/formatters";
import ProductReviews from "./ProductReviews";

export default function ProductDialog({
  product,
  variantId,
  busy,
  productImage,
  isWishlisted,
  onToggleWishlist,
  onVariantChange,
  onAddToCart,
  onClose,
}) {
  const activeVariants =
    product.variants?.filter((variant) => variant.isActive) || [];
  const selectedVariant =
    activeVariants.find((variant) => variant._id === variantId) ||
    activeVariants[0];
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="product-modal product-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Đóng">
          ×
        </button>
        <div className="modal-image">
          {productImage(product) ? (
            <img src={productImage(product)} alt={product.name} />
          ) : (
            product.category?.name?.slice(0, 1) || "F"
          )}
        </div>
        <div className="modal-content">
          <p className="product-brand">
            {product.brand || product.store?.name || "FIELDHOUSE"}
          </p>
          <h2 id="modal-title">{product.name}</h2>
          <p>{product.description}</p>
          {activeVariants.length > 1 && (
            <label className="variant-select">
              Phiên bản
              <select
                value={selectedVariant?._id || ""}
                onChange={(event) => onVariantChange(event.target.value)}
              >
                {activeVariants.map((variant) => (
                  <option key={variant._id} value={variant._id}>
                    {variant.name || variant.sku} ·{" "}
                    {formatCurrency(variant.price)}
                  </option>
                ))}
              </select>
            </label>
          )}
          <strong className="modal-price">
            {formatCurrency(
              selectedVariant?.price ?? product.priceRange?.min ?? 0,
            )}
          </strong>
          <button
            className="primary-button"
            disabled={busy || !selectedVariant || selectedVariant.stock < 1}
            onClick={() => onAddToCart(product, selectedVariant?._id)}
          >
            {busy ? "Đang thêm…" : "Thêm vào giỏ"} <span>↗</span>
          </button>
          <button
            className="wishlist-modal-button"
            onClick={() => onToggleWishlist(product)}
          >
            {isWishlisted ? "♥ Đã lưu yêu thích" : "♡ Lưu yêu thích"}
          </button>
          <small>
            {selectedVariant?.stock > 0
              ? `Còn ${selectedVariant.stock} sản phẩm · Tồn kho được xác nhận khi đặt hàng.`
              : "Phiên bản này hiện đã hết hàng."}
          </small>
        </div>
        <ProductReviews productId={product._id} />
      </section>
    </div>
  );
}
