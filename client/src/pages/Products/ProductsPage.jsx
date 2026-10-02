import ProductCard from "../../components/product/ProductCard";

export default function ProductsPage({
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
  search,
  productImage,
  onOpenProduct,
  isWishlisted,
  onToggleWishlist,
}) {
  const categoryNames = ["Tất cả", ...categories.map((item) => item.name)];
  return (
    <main className="products-page">
      <header className="products-heading">
        <p className="eyebrow">FIELDHOUSE · CỬA HÀNG</p>
        <h1>
          {search ? (
            <>
              Kết quả cho <em>“{search}”</em>
            </>
          ) : (
            <>
              Tất cả <em>sản phẩm.</em>
            </>
          )}
        </h1>
        <p>
          {pagination?.total ?? 0} sản phẩm được tuyển chọn cho hành trình của
          bạn.
        </p>
      </header>
      <div className="products-toolbar">
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
          Sắp xếp
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
        <div className="notice" role="alert">
          {error}
        </div>
      )}
      {loading ? (
        <div className="product-grid">
          {Array.from({ length: 8 }, (_, index) => (
            <div className="skeleton" key={index} />
          ))}
        </div>
      ) : products.length ? (
        <div className="product-grid products-result-grid">
          {products.map((product, index) => (
            <ProductCard
              key={product._id}
              product={product}
              index={index}
              productImage={productImage}
              onOpenProduct={onOpenProduct}
              isWishlisted={isWishlisted}
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span>⌕</span>
          <h3>Chưa có sản phẩm phù hợp</h3>
          <p>Thử từ khóa hoặc danh mục khác nhé.</p>
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
    </main>
  );
}
