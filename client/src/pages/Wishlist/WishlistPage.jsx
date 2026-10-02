import { formatCurrency } from "../../utils/formatters";

export default function WishlistPage({
  products,
  loading,
  productImage,
  onOpenProduct,
  onRemove,
  onShop,
}) {
  return (
    <main className="commerce-page">
      <header className="page-heading">
        <button className="back-link" onClick={onShop}>
          ← Tiếp tục mua sắm
        </button>
        <p className="eyebrow">TÀI KHOẢN FIELDHOUSE</p>
        <h1>
          Danh sách <em>yêu thích.</em>
        </h1>
        <p>Lưu lại những món đồ bạn muốn xem sau.</p>
      </header>
      {loading ? (
        <div className="product-grid">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="skeleton" key={index} />
          ))}
        </div>
      ) : products.length ? (
        <div className="product-grid">
          {products.map((product) => (
            <article className="product-card" key={product._id}>
              <button
                className="product-image"
                onClick={() => onOpenProduct(product)}
              >
                <div className="product-art">
                  {productImage(product) ? (
                    <img src={productImage(product)} alt={product.name} />
                  ) : (
                    <span>{product.category?.name?.slice(0, 1) || "F"}</span>
                  )}
                </div>
              </button>
              <div className="product-meta">
                <div>
                  <p>{product.brand || product.store?.name || "FIELDHOUSE"}</p>
                  <h3>{product.name}</h3>
                </div>
                <button
                  className="save-button"
                  onClick={() => onRemove(product)}
                  aria-label={`Bỏ ${product.name} khỏi yêu thích`}
                >
                  ♥
                </button>
              </div>
              <div className="product-price">
                <strong>
                  {formatCurrency(
                    product.priceRange?.min ??
                      product.variants?.[0]?.price ??
                      0,
                  )}
                </strong>
                <button className="text-link" onClick={() => onRemove(product)}>
                  Bỏ lưu
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="commerce-empty">
          <span>♡</span>
          <h2>Danh sách đang trống</h2>
          <p>Lưu sản phẩm yêu thích ngay tại trang cửa hàng.</p>
          <button className="primary-button" onClick={onShop}>
            Khám phá cửa hàng <span>↗</span>
          </button>
        </div>
      )}
    </main>
  );
}
