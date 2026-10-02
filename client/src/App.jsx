import { useEffect, useMemo, useState } from 'react'
import { getCategories } from './api/category.api'
import { getProducts } from './api/product.api'
import mercurialImage from '../../mercurial.webp'
import './App.css'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })

function App() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Tất cả')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cartCount, setCartCount] = useState(() => Number(localStorage.getItem('fieldhouse-cart-count') || 0))
  const [selected, setSelected] = useState(null)
  const categoryNames = useMemo(() => ['Tất cả', ...categories.map((item) => item.name)], [categories])

  useEffect(() => { getCategories().then(setCategories).catch(() => setCategories([])) }, [])
  useEffect(() => {
    let active = true
    const timer = setTimeout(() => {
      setLoading(true)
      setError('')
      getProducts({ search: query.trim(), category: categories.find((item) => item.name === category)?._id, sort, page, limit: 12 })
        .then((result) => { if (active) { setProducts(result.products || []); setPagination(result.pagination) } })
        .catch((reason) => { if (active) setError(reason.message || 'Không thể tải sản phẩm. Hãy kiểm tra kết nối API.') })
        .finally(() => { if (active) setLoading(false) })
    }, query ? 250 : 0)
    return () => { active = false; clearTimeout(timer) }
  }, [query, category, categories, sort, page])

  function addToCart() {
    const next = cartCount + 1
    setCartCount(next)
    localStorage.setItem('fieldhouse-cart-count', String(next))
    setSelected(null)
  }

  function productImage(product) {
    return product.images?.[0]?.url || (product.slug?.includes('mercurial') ? mercurialImage : '')
  }

  return <div className="app-shell">
    <div className="announcement">Giao hàng miễn phí cho đơn hàng từ 1.500.000₫ <span>·</span> Đổi trả trong 30 ngày</div>
    <header className="site-header">
      <a className="brand" href="#home"><span className="brand-mark">F</span><span>fieldhouse<span className="brand-dot">.</span></span></a>
      <nav className="main-nav"><a className="active" href="#products">Cửa hàng</a><a href="#collections">Bộ sưu tập</a><a href="#story">Câu chuyện</a></nav>
      <div className="header-actions"><label className="search-box"><span>⌕</span><input aria-label="Tìm sản phẩm" placeholder="Tìm sản phẩm..." value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} /></label><a className="cart-button" href="#products">Giỏ hàng <span>{cartCount}</span></a></div>
    </header>

    <main id="home">
      <section className="hero" id="collections"><div className="hero-copy"><p className="eyebrow">— TRANG BỊ CHO CHUYỂN ĐỘNG</p><h1>Chơi hết mình.<br /><em>Sống hết chất.</em></h1><p className="hero-description">Thiết bị thể thao tuyển chọn cho những người luôn tiến về phía trước. Tìm món đồ tiếp theo giúp bạn bứt phá.</p><a className="primary-button" href="#products">Khám phá bộ sưu tập <span>↗</span></a><div className="hero-proof"><div className="avatar-stack"><span>✦</span><span>✦</span><span>✦</span></div><p><strong>2.400+</strong> vận động viên tin chọn</p></div></div>
        <div className="hero-art" aria-label="Bộ sưu tập thể thao Fieldhouse"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-sun"/><div className="art-ball">F</div><div className="art-caption"><span>FIELD NOTES / 01</span><strong>Move with purpose.</strong></div><div className="art-index">01 <span>/</span> 04</div></div><div className="hero-side-label">PERFORMANCE GOODS · EST. 2024</div>
      </section>

      <section className="benefits"><div><i>↗</i><p><strong>Giao hàng toàn quốc</strong><small>Miễn phí đơn từ 1.500.000₫</small></p></div><div><i>⟲</i><p><strong>Đổi trả dễ dàng</strong><small>Trong vòng 30 ngày</small></p></div><div><i>✓</i><p><strong>Hàng chính hãng</strong><small>Cam kết nguồn gốc rõ ràng</small></p></div><div><i>♡</i><p><strong>Hỗ trợ tận tâm</strong><small>Đồng hành cùng bạn mỗi ngày</small></p></div></section>

      <section className="shop-section" id="products"><div className="section-heading"><div><p className="eyebrow">LỰA CHỌN CỦA BẠN</p><h2>Sẵn sàng cho <em>cuộc chơi.</em></h2></div><a href="#products" className="text-link">Xem tất cả ↗</a></div>
        <div className="shop-controls"><div className="category-tabs" role="tablist">{(categoryNames.length === 1 ? ['Tất cả', 'Chạy bộ', 'Bóng đá', 'Tập luyện', 'Phụ kiện'] : categoryNames).map((name) => <button key={name} role="tab" aria-selected={category === name} className={category === name ? 'selected' : ''} onClick={() => { setCategory(name); setPage(1) }}>{name}</button>)}</div><label className="sort-label">Sắp xếp <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1) }}><option value="newest">Mới nhất</option><option value="price_asc">Giá tăng dần</option><option value="price_desc">Giá giảm dần</option><option value="rating">Đánh giá cao</option></select></label></div>
        {error && <div className="notice"><strong>Chưa kết nối được cửa hàng.</strong> {error}<small> Chạy API và nạp dữ liệu mẫu để xem sản phẩm.</small></div>}
        {loading ? <div className="product-grid">{Array.from({ length: 4 }, (_, i) => <div className="skeleton" key={i}/>)}</div> : products.length ? <div className="product-grid">{products.map((product, index) => <article className="product-card" key={product._id}><button className="product-image" onClick={() => setSelected(product)} aria-label={`Xem ${product.name}`}><div className={`product-art art-${index % 4}`}>{productImage(product) ? <img src={productImage(product)} alt={product.images?.[0]?.alt || product.name}/> : <span>{product.category?.name?.slice(0, 1) || 'F'}</span>}<b className="product-tag">{product.category?.name || 'FIELDHOUSE'}</b><b className="quick-view">Xem nhanh ↗</b></div></button><div className="product-meta"><div><p>{product.brand || product.store?.name || 'FIELDHOUSE'}</p><h3>{product.name}</h3></div><button className="save-button" aria-label="Lưu sản phẩm">♡</button></div><div className="product-price"><strong>{money.format(product.priceRange?.min ?? product.variants?.[0]?.price ?? 0)}</strong>{product.averageRating > 0 && <span>★ {product.averageRating.toFixed(1)}</span>}</div></article>)}</div> : <div className="empty-state"><span>⌕</span><h3>{error ? 'Cửa hàng đang tạm nghỉ' : 'Chưa có sản phẩm phù hợp'}</h3><p>{error ? 'Hãy khởi động API rồi tải lại trang.' : 'Thử chọn danh mục khác hoặc tìm từ khóa khác nhé.'}</p></div>}
        {pagination?.totalPages > 1 && <div className="pagination"><button disabled={!pagination.hasPreviousPage} onClick={() => setPage(page - 1)}>← Trước</button><span>Trang {pagination.page} / {pagination.totalPages}</span><button disabled={!pagination.hasNextPage} onClick={() => setPage(page + 1)}>Tiếp →</button></div>}
      </section>

      <section className="story-banner" id="story"><div className="story-mark">F.</div><div><p className="eyebrow">KHÔNG CHỈ LÀ MỘT MÓN ĐỒ</p><h2>Chuyển động tạo nên<br/><em>phiên bản tốt hơn.</em></h2></div><p className="story-description">Fieldhouse tuyển chọn những sản phẩm giúp bạn tập trung vào điều quan trọng nhất: tận hưởng từng bước tiến của mình.</p><a className="round-link" href="#products">↗</a></section>
    </main>
    <footer className="site-footer"><a className="brand" href="#home"><span className="brand-mark">F</span><span>fieldhouse<span className="brand-dot">.</span></span></a><p>Built for the love of the game.</p><span>© 2026 FIELDHOUSE</span></footer>
    {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><section className="product-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSelected(null)} aria-label="Đóng">×</button><div className="modal-image">{productImage(selected) ? <img src={productImage(selected)} alt={selected.name}/> : selected.category?.name?.slice(0, 1) || 'F'}</div><div className="modal-content"><p className="product-brand">{selected.brand || selected.store?.name || 'FIELDHOUSE'}</p><h2 id="modal-title">{selected.name}</h2><p>{selected.description}</p><strong>{money.format(selected.priceRange?.min ?? selected.variants?.[0]?.price ?? 0)}</strong><button className="primary-button" onClick={addToCart}>Thêm vào giỏ <span>↗</span></button><small>Giá và tồn kho được cập nhật từ cửa hàng.</small></div></section></div>}
  </div>
}

export default App
