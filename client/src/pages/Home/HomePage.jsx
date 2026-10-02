import ProductCard from "../../components/product/ProductCard";
import { Link } from "react-router-dom";

export default function HomePage({
  products,
  categories,
  category,
  onCategoryChange,
  sort,
  onSortChange,
  page,
  onPageChange,
  pagination,
  loading,
  error,
  productImage,
  onOpenProduct,
  isWishlisted,
  onToggleWishlist,
}) {
  const categoryNames = [
    "Tất cả",
    ...(categories.length
      ? categories.map((item) => item.name)
      : ["Chạy bộ", "Bóng đá", "Tập luyện", "Phụ kiện"]),
  ];

  return (
    <main id="home">
      <section className="hero" id="collections">
        <div className="hero-copy">
          <p className="eyebrow">— TRANG BỊ CHO CHUYỂN ĐỘNG</p>
          <h1>
            Chơi hết mình.
            <br />
            <em>Sống hết chất.</em>
          </h1>
          <p className="hero-description">
            Thiết bị thể thao tuyển chọn cho những người luôn tiến về phía
            trước. Tìm món đồ tiếp theo giúp bạn bứt phá.
          </p>
          <a className="primary-button" href="#products">
            Khám phá bộ sưu tập <span>↗</span>
          </a>
          <div className="hero-proof">
            <div className="avatar-stack">
              <span>✦</span>
              <span>✦</span>
              <span>✦</span>
            </div>
            <p>
              <strong>2.400+</strong> vận động viên tin chọn
            </p>
          </div>
        </div>
        <div className="hero-art" aria-label="Bộ sưu tập thể thao Fieldhouse">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-sun" />
          <div className="art-ball">F</div>
          <div className="art-caption">
            <span>FIELD NOTES / 01</span>
            <strong>Move with purpose.</strong>
          </div>
          <div className="art-index">
            01 <span>/</span> 04
          </div>
        </div>
        <div className="hero-side-label">PERFORMANCE GOODS · EST. 2024</div>
      </section>

      <section className="benefits">
        <div>
          <i>↗</i>
          <p>
            <strong>Giao hàng toàn quốc</strong>
            <small>Miễn phí đơn từ 1.500.000₫</small>
          </p>
        </div>
        <div>
          <i>⟲</i>
          <p>
            <strong>Đổi trả dễ dàng</strong>
            <small>Trong vòng 30 ngày</small>
          </p>
        </div>
        <div>
          <i>✓</i>
          <p>
            <strong>Hàng chính hãng</strong>
            <small>Cam kết nguồn gốc rõ ràng</small>
          </p>
        </div>
        <div>
          <i>♡</i>
          <p>
            <strong>Hỗ trợ tận tâm</strong>
            <small>Đồng hành cùng bạn mỗi ngày</small>
          </p>
        </div>
      </section>

      <section className="shop-section" id="products">
        <div className="section-heading">
          <div>
            <p className="eyebrow">LỰA CHỌN CỦA BẠN</p>
            <h2>
              Sẵn sàng cho <em>cuộc chơi.</em>
            </h2>
          </div>
          <Link to="/products" className="text-link">
            Xem tất cả ↗
          </Link>
        </div>
        <div className="shop-controls">
          <div
            className="category-tabs"
            role="tablist"
            aria-label="Lọc theo danh mục"
          >
            {categoryNames.map((name) => (
              <button
                key={name}
                role="tab"
                aria-selected={category === name}
                className={category === name ? "selected" : ""}
                onClick={() => onCategoryChange(name)}
              >
                {name}
              </button>
            ))}
          </div>
          <label className="sort-label">
            Sắp xếp{" "}
            <select
              value={sort}
              onChange={(event) => onSortChange(event.target.value)}
            >
              <option value="newest">Mới nhất</option>
              <option value="price_asc">Giá tăng dần</option>
              <option value="price_desc">Giá giảm dần</option>
              <option value="rating">Đánh giá cao</option>
            </select>
          </label>
        </div>
        {error && (
          <div className="notice">
            <strong>Chưa kết nối được cửa hàng.</strong> {error}
            <small> Chạy API và nạp dữ liệu mẫu để xem sản phẩm.</small>
          </div>
        )}
        {loading ? (
          <div className="product-grid">
            {Array.from({ length: 4 }, (_, index) => (
              <div className="skeleton" key={index} />
            ))}
          </div>
        ) : products.length ? (
          <div className="product-grid">
            {products.map((product, index) => <ProductCard key={product._id} product={product} index={index} productImage={productImage} onOpenProduct={onOpenProduct} isWishlisted={isWishlisted} onToggleWishlist={onToggleWishlist} />)}
          </div>
        ) : (
          <div className="empty-state">
            <span>⌕</span>
            <h3>
              {error ? "Cửa hàng đang tạm nghỉ" : "Chưa có sản phẩm phù hợp"}
            </h3>
            <p>
              {error
                ? "Hãy khởi động API rồi tải lại trang."
                : "Thử chọn danh mục khác hoặc tìm từ khóa khác nhé."}
            </p>
          </div>
        )}
        {pagination?.totalPages > 1 && (
          <div className="pagination">
            <button
              disabled={!pagination.hasPreviousPage}
              onClick={() => onPageChange(page - 1)}
            >
              ← Trước
            </button>
            <span>
              Trang {pagination.page} / {pagination.totalPages}
            </span>
            <button
              disabled={!pagination.hasNextPage}
              onClick={() => onPageChange(page + 1)}
            >
              Tiếp →
            </button>
          </div>
        )}
      </section>

      <section className="story-banner" id="story">
        <div className="story-mark">F.</div>
        <div>
          <p className="eyebrow">KHÔNG CHỈ LÀ MỘT MÓN ĐỒ</p>
          <h2>
            Chuyển động tạo nên
            <br />
            <em>phiên bản tốt hơn.</em>
          </h2>
        </div>
        <p className="story-description">
          Fieldhouse tuyển chọn những sản phẩm giúp bạn tập trung vào điều quan
          trọng nhất: tận hưởng từng bước tiến của mình.
        </p>
        <a className="round-link" href="#products">
          ↗
        </a>
      </section>
    </main>
  );
}
