import { formatCurrency } from "../../utils/formatters";

export default function ProductCard({ product, index = 0, productImage, onOpenProduct, isWishlisted, onToggleWishlist }) {
  const price = product.priceRange?.min ?? product.variants?.[0]?.price ?? 0;
  return (
    <article className="product-card">
      <button className="product-image" onClick={() => onOpenProduct(product)} aria-label={`Xem ${product.name}`}>
        <div className={`product-art art-${index % 4}`}>
          {productImage(product) ? <img src={productImage(product)} alt={product.images?.[0]?.alt || product.name} /> : <span>{product.category?.name?.slice(0, 1) || "F"}</span>}
          <b className="product-tag">{product.category?.name || "FIELDHOUSE"}</b>
          <b className="quick-view">Xem chi tiết ↗</b>
        </div>
      </button>
      <div className="product-meta">
        <div>
          <p>{product.brand || product.store?.name || "FIELDHOUSE"}</p>
          <button className="product-title-link" onClick={() => onOpenProduct(product)}>{product.name}</button>
        </div>
        <button className={`save-button ${isWishlisted?.(product) ? "is-saved" : ""}`} type="button" aria-label={isWishlisted?.(product) ? "Bỏ yêu thích" : "Thêm yêu thích"} onClick={() => onToggleWishlist?.(product)}>
          {isWishlisted?.(product) ? "♥" : "♡"}
        </button>
      </div>
      <div className="product-price">
        <strong>{formatCurrency(price)}</strong>
        {product.averageRating > 0 && <span>★ {product.averageRating.toFixed(1)}</span>}
      </div>
    </article>
  );
}
