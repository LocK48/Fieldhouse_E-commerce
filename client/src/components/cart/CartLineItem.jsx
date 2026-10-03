import { formatCurrency } from "../../utils/formatters";

export default function CartLineItem({
  item,
  busy,
  productImage,
  onChangeQuantity,
  onRemoveItem,
}) {
  const product = item.product;

  return (
    <article
      className={`cart-line ${item.available ? "" : "cart-line-unavailable"}`}
    >
      <div className="cart-thumb">
        {productImage(product) ? (
          <img src={productImage(product)} alt={product.name} />
        ) : (
          <span>{product.name?.slice(0, 1)}</span>
        )}
      </div>
      <div className="cart-item-info">
        <p className="product-brand">{product.brand || "FIELDHOUSE"}</p>
        <h2>{product.name}</h2>
        <p>{item.variant?.name || item.variant?.sku || "Phiên bản mặc định"}</p>
        {!item.available && (
          <strong className="stock-warning">
            Sản phẩm không đủ tồn kho. Hãy giảm số lượng hoặc xóa khỏi giỏ.
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
            disabled={busy || item.quantity >= (item.variant?.stock || 99)}
            onClick={() => onChangeQuantity(item, item.quantity + 1)}
            aria-label="Tăng số lượng"
          >
            +
          </button>
        </div>
      </div>
    </article>
  );
}
