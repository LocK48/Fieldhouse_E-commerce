export default function SiteHeader({
  view,
  user,
  cartCount,
  query,
  accountMenuOpen,
  onQueryChange,
  onGoShop,
  onOpenOrders,
  onToggleAccount,
  onOpenAuth,
  onLogout,
  onOpenCart,
  onOpenManagement,
  onOpenProfile,
  onOpenWishlist,
}) {
  const managementLabel =
    user?.role === "ADMIN"
      ? "Quản trị"
      : user?.role === "SELLER"
        ? "Kênh người bán"
        : "Đăng ký người bán";
  return (
    <header className="site-header">
      <a className="brand" href="#home" onClick={onGoShop}>
        <span className="brand-mark">F</span>
        <span>
          fieldhouse<span className="brand-dot">.</span>
        </span>
      </a>
      <nav className="main-nav" aria-label="Điều hướng">
        <a
          className={["shop", "products", "product-detail"].includes(view) ? "active" : ""}
          href="#products"
          onClick={onGoShop}
        >
          Cửa hàng
        </a>
        <a href="#collections" onClick={onGoShop}>
          Bộ sưu tập
        </a>
        {user && (
          <button
            className={`nav-link ${view === "orders" ? "active" : ""}`}
            onClick={onOpenOrders}
          >
            Đơn hàng
          </button>
        )}
      </nav>
      <div className="header-actions">
        <label className="search-box">
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="Tìm sản phẩm"
            placeholder="Tìm sản phẩm..."
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </label>
        <button
          className="account-button"
          onClick={user ? onToggleAccount : onOpenAuth}
          aria-label={user ? "Tài khoản" : "Đăng nhập"}
        >
          {user ? (
            <>
              <span className="account-avatar">
                {user.name?.slice(0, 1).toUpperCase()}
              </span>
              <span className="account-name">{user.name?.split(" ")[0]}</span>
            </>
          ) : (
            <>
              <span>♡</span>
              <span className="account-name">Tài khoản</span>
            </>
          )}
        </button>
        <button className="cart-button" onClick={onOpenCart}>
          Giỏ hàng <span>{cartCount}</span>
        </button>
        {accountMenuOpen && (
          <div className="account-menu">
            <strong>{user?.name}</strong>
            <small>{user?.email}</small>
            <button onClick={onOpenProfile}>Hồ sơ & địa chỉ</button>
            <button onClick={onOpenOrders}>Đơn hàng của tôi</button>
            <button onClick={onOpenWishlist}>Yêu thích</button>
            {user?.role === "ADMIN" ||
            user?.role === "SELLER" ||
            user?.sellerStatus !== "APPROVED" ? (
              <button onClick={onOpenManagement}>{managementLabel}</button>
            ) : null}
            <button onClick={onLogout}>Đăng xuất</button>
          </div>
        )}
      </div>
    </header>
  );
}
