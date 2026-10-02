import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { getProduct } from "../../api/product.api";
import { formatCurrency } from "../../utils/formatters";
import ProductReviews from "../../components/product/ProductReviews";

export default function ProductDetailPage({
  busy,
  productImage,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
}) {
  const { productId } = useParams();
  const location = useLocation();
  const productsPath = location.state?.from || "/products";
  const [product, setProduct] = useState(null);
  const [variantId, setVariantId] = useState("");
  const [imageIndex, setImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getProduct(productId)
      .then((result) => {
        if (!active) return;
        setProduct(result);
        setVariantId(result.variants?.find((item) => item.isActive)?._id || "");
        setImageIndex(0);
      })
      .catch((reason) => {
        if (active)
          setError(
            reason.response?.data?.message ||
              reason.message ||
              "Không tải được sản phẩm.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [productId]);

  if (loading)
    return (
      <main className="product-detail-page">
        <div className="product-detail-skeleton" />
      </main>
    );
  if (error || !product)
    return (
      <main className="product-detail-page">
        <div className="empty-state">
          <span>⌕</span>
          <h2>Không tìm thấy sản phẩm</h2>
          <p>{error || "Sản phẩm không còn được bán."}</p>
          <Link className="primary-button" to="/products">
            Quay lại cửa hàng ↗
          </Link>
        </div>
      </main>
    );

  const variants = product.variants?.filter((item) => item.isActive) || [];
  const selected =
    variants.find((item) => item._id === variantId) || variants[0];
  const images = product.images?.length ? product.images : [];
  const store = product.store;

  return (
    <main className="product-detail-page">
      <nav className="detail-breadcrumb">
        <Link to="/">Trang chủ</Link>
        <span>/</span>
        <Link to={productsPath}>Sản phẩm</Link>
        <span>/</span>
        <span>{product.name}</span>
      </nav>
      <section className="product-detail-layout">
        <div className="detail-gallery">
          <div className="detail-main-image">
            {images[imageIndex] ? (
              <img
                src={images[imageIndex].url || productImage(product)}
                alt={images[imageIndex].alt || product.name}
              />
            ) : productImage(product) ? (
              <img src={productImage(product)} alt={product.name} />
            ) : (
              <span>{product.category?.name?.slice(0, 1) || "F"}</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="detail-thumbnails">
              {images.map((image, index) => (
                <button
                  className={imageIndex === index ? "selected" : ""}
                  key={image.key || image.url}
                  onClick={() => setImageIndex(index)}
                  aria-label={`Ảnh sản phẩm ${index + 1}`}
                >
                  <img src={image.url} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="detail-info">
          <p className="eyebrow">
            {product.category?.name || "FIELDHOUSE"}
            {product.brand ? ` · ${product.brand}` : ""}
          </p>
          <h1>{product.name}</h1>
          <div className="detail-rating">
            {product.averageRating > 0 ? (
              <>
                ★ {product.averageRating.toFixed(1)}{" "}
                <span>({product.reviewCount || 0} đánh giá)</span>
              </>
            ) : (
              <span>Sản phẩm mới</span>
            )}
          </div>
          <p className="detail-description">{product.description}</p>
          <strong className="detail-price">
            {formatCurrency(selected?.price ?? product.priceRange?.min ?? 0)}
          </strong>
          {variants.length > 1 && (
            <label className="detail-variant">
              Chọn phiên bản
              <select
                value={selected?._id || ""}
                onChange={(event) => setVariantId(event.target.value)}
              >
                {variants.map((variant) => (
                  <option value={variant._id} key={variant._id}>
                    {variant.name || variant.sku} ·{" "}
                    {formatCurrency(variant.price)}
                  </option>
                ))}
              </select>
            </label>
          )}
          {selected && (
            <p className="detail-stock">
              {selected.stock > 0
                ? `Còn ${selected.stock} sản phẩm`
                : "Tạm hết hàng"}
            </p>
          )}
          <div className="detail-actions">
            <button
              className="primary-button"
              disabled={busy || !selected || selected.stock < 1}
              onClick={() => onAddToCart(product, selected?._id)}
            >
              {busy ? "Đang thêm…" : "Thêm vào giỏ"}
              <span>↗</span>
            </button>
            <button
              className={`detail-wishlist ${isWishlisted(product) ? "is-saved" : ""}`}
              onClick={() => onToggleWishlist(product)}
            >
              {isWishlisted(product) ? "♥ Đã yêu thích" : "♡ Yêu thích"}
            </button>
          </div>
          <div className="seller-card">
            <div className="seller-avatar">
              {store?.logo ? (
                <img src={store.logo} alt="" />
              ) : store?.owner?.avatar ? (
                <img src={store.owner.avatar} alt="" />
              ) : (
                <span>{store?.name?.slice(0, 1) || "S"}</span>
              )}
            </div>
            <div>
              <small>ĐƯỢC BÁN BỞI</small>
              <strong>
                {store?.name || store?.owner?.name || "Nhà bán hàng Fieldhouse"}
              </strong>
              {store?.description && <p>{store.description}</p>}
            </div>
            {store?.slug && (
              <small className="seller-slug">/{store.slug}</small>
            )}
          </div>
          <div className="detail-promises">
            <span>✓ Thanh toán khi nhận hàng</span>
            <span>↗ Giao hàng toàn quốc</span>
            <span>◇ Hàng chính hãng</span>
          </div>
        </div>
      </section>
      <ProductReviews productId={product._id} />
      <Link className="detail-back" to={productsPath}>
        ← Quay lại cửa hàng
      </Link>
    </main>
  );
}
