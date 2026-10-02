import { useEffect, useMemo, useState } from "react";
import {
  addCartItem,
  getCart,
  removeCartItem,
  updateCartItem,
} from "./api/cart.api";
import { getCategories } from "./api/category.api";
import { getCurrentUser, login, logout, registerAccount } from "./api/auth.api";
import { createCodOrder, getMyOrders } from "./api/order.api";
import { getProducts } from "./api/product.api";
import { getAddresses } from "./api/address.api";
import {
  addWishlistProduct,
  getWishlist,
  removeWishlistProduct,
} from "./api/wishlist.api";
import AuthDialog from "./components/auth/AuthDialog";
import SiteHeader from "./components/layout/SiteHeader";
import ProductDialog from "./components/product/ProductDialog";
import CartPage from "./pages/Cart/CartPage";
import CheckoutPage from "./pages/Checkout/CheckoutPage";
import HomePage from "./pages/Home/HomePage";
import OrdersPage from "./pages/Orders/OrdersPage";
import SellerPage from "./pages/Seller/SellerPage";
import AdminPage from "./pages/Admin/AdminPage";
import ProfilePage from "./pages/Profile/ProfilePage";
import WishlistPage from "./pages/Wishlist/WishlistPage";
import mercurialImage from "../../mercurial.webp";
import "./App.css";
import "./Commerce.css";
import "./Dashboard.css";
import "./Account.css";

const freeShippingThreshold = 1_500_000;
const standardShipping = 30_000;

function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState({ items: [], subtotal: 0 });
  const [wishlist, setWishlist] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [view, setView] = useState("shop");
  const [authOpen, setAuthOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [pendingAdd, setPendingAdd] = useState(null);
  const [pendingWishlistProduct, setPendingWishlistProduct] = useState(null);
  const [returnView, setReturnView] = useState("shop");
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [shipping, setShipping] = useState({
    recipientName: "",
    phone: "",
    addressLine: "",
    ward: "",
    district: "",
    city: "",
    country: "Vietnam",
  });

  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const shippingFee =
    cart.subtotal >= freeShippingThreshold ? 0 : standardShipping;
  const cartTotal = cart.subtotal + shippingFee;
  const categoryId = useMemo(
    () => categories.find((item) => item.name === category)?._id,
    [categories, category],
  );
  const userId = user?.id;

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!userId) return;
    getWishlist()
      .then(setWishlist)
      .catch(() => setWishlist([]));
    getAddresses()
      .then(setAddresses)
      .catch(() => setAddresses([]));
  }, [userId]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(
      () => {
        setLoading(true);
        setCatalogError("");
        getProducts({
          search: query.trim(),
          category: categoryId,
          sort,
          page,
          limit: 12,
        })
          .then((result) => {
            if (active) {
              setProducts(result.products || []);
              setPagination(result.pagination);
            }
          })
          .catch((reason) => {
            if (active)
              setCatalogError(
                reason.message ||
                  "Không thể tải sản phẩm. Hãy kiểm tra kết nối API.",
              );
          })
          .finally(() => {
            if (active) setLoading(false);
          });
      },
      query ? 250 : 0,
    );
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query, categoryId, sort, page]);

  useEffect(() => {
    let active = true;
    if (
      !localStorage.getItem("fieldhouse-access-token") &&
      !localStorage.getItem("fieldhouse-refresh-token")
    )
      return undefined;

    getCurrentUser()
      .then(async (currentUser) => {
        if (!active) return;
        setUser(currentUser);
        setShipping((value) => ({
          ...value,
          recipientName: currentUser.name || value.recipientName,
        }));
        const currentCart = await getCart();
        if (active) setCart(currentCart);
      })
      .catch(() => {
        localStorage.removeItem("fieldhouse-access-token");
        localStorage.removeItem("fieldhouse-refresh-token");
      });

    return () => {
      active = false;
    };
  }, []);

  function productImage(product) {
    return (
      product?.images?.[0]?.url ||
      (product?.slug?.includes("mercurial") ? mercurialImage : "")
    );
  }

  async function refreshCart() {
    const nextCart = await getCart();
    setCart(nextCart);
    return nextCart;
  }

  async function putItemInCart(product, variantId) {
    try {
      setBusy(true);
      setCart(
        await addCartItem({ productId: product._id, variantId, quantity: 1 }),
      );
      setSelectedProduct(null);
      setFeedback({ type: "success", text: "Đã thêm sản phẩm vào giỏ hàng." });
    } catch (reason) {
      setFeedback({
        type: "error",
        text: reason.message || "Không thể thêm sản phẩm vào giỏ.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function toggleWishlist(product) {
    if (!user) {
      setPendingWishlistProduct(product);
      setReturnView("shop");
      setSelectedProduct(null);
      setAuthOpen(true);
      return;
    }
    try {
      const exists = wishlist.some((item) => item._id === product._id);
      setWishlist(
        exists
          ? await removeWishlistProduct(product._id)
          : await addWishlistProduct(product._id),
      );
      setFeedback({
        type: "success",
        text: exists
          ? "Đã bỏ sản phẩm khỏi yêu thích."
          : "Đã lưu sản phẩm vào yêu thích.",
      });
    } catch (reason) {
      setFeedback({
        type: "error",
        text: reason.message || "Không thể cập nhật danh sách yêu thích.",
      });
    }
  }

  async function openWishlist() {
    if (!user) {
      setAuthOpen(true);
      setReturnView("wishlist");
      return;
    }
    setAccountMenuOpen(false);
    setView("wishlist");
    setWishlistLoading(true);
    try {
      setWishlist(await getWishlist());
    } catch (reason) {
      setFeedback({
        type: "error",
        text: reason.message || "Không thể tải danh sách yêu thích.",
      });
    } finally {
      setWishlistLoading(false);
    }
  }

  async function openProfile() {
    if (!user) {
      setAuthOpen(true);
      setReturnView("profile");
      return;
    }
    setAccountMenuOpen(false);
    setView("profile");
  }

  async function openCheckout() {
    try {
      const saved = await getAddresses();
      setAddresses(saved);
      const preferred = saved.find((address) => address.isDefault);
      if (preferred) setShipping((value) => ({ ...value, ...preferred }));
      setView("checkout");
    } catch {
      setView("checkout");
    }
  }

  function requestAddToCart(product, variantId) {
    if (!user) {
      setPendingAdd({ product, variantId });
      setReturnView("shop");
      setSelectedProduct(null);
      setAuthOpen(true);
      return;
    }
    putItemInCart(product, variantId);
  }

  async function handleAuth(mode, form) {
    if (mode === "register")
      await registerAccount({
        name: form.name,
        email: form.email,
        password: form.password,
      });
    const signedIn = await login(form.email, form.password);
    setUser(signedIn);
    setShipping((value) => ({
      ...value,
      recipientName: signedIn.name || value.recipientName,
    }));
    setAuthOpen(false);
    setFeedback({
      type: "success",
      text:
        mode === "register"
          ? "Tạo tài khoản thành công. Bạn đã đăng nhập."
          : `Chào mừng trở lại, ${signedIn.name}.`,
    });
    try {
      setCart(await getCart());
    } catch {
      setCart({ items: [], subtotal: 0 });
    }

    if (pendingAdd) {
      const queuedItem = pendingAdd;
      setPendingAdd(null);
      await putItemInCart(queuedItem.product, queuedItem.variantId);
      return;
    }

    if (pendingWishlistProduct) {
      const queuedProduct = pendingWishlistProduct;
      setPendingWishlistProduct(null);
      try {
        setWishlist(await addWishlistProduct(queuedProduct._id));
        setFeedback({
          type: "success",
          text: "Đã lưu sản phẩm vào yêu thích.",
        });
      } catch (reason) {
        setFeedback({
          type: "error",
          text: reason.message || "Không thể cập nhật danh sách yêu thích.",
        });
      }
    }

    setView(returnView);
    if (returnView === "orders") await loadOrders();
  }

  async function handleLogout() {
    try {
      await logout();
    } catch {
      /* Clear local state even if the API is unavailable. */
    }
    setUser(null);
    setCart({ items: [], subtotal: 0 });
    setOrders([]);
    setWishlist([]);
    setAddresses([]);
    setAccountMenuOpen(false);
    setView("shop");
    setFeedback({ type: "success", text: "Bạn đã đăng xuất." });
  }

  async function openCart() {
    if (!user) {
      setReturnView("cart");
      setAuthOpen(true);
      return;
    }
    try {
      await refreshCart();
      setView("cart");
    } catch (reason) {
      setFeedback({
        type: "error",
        text: reason.message || "Không thể tải giỏ hàng.",
      });
    }
  }

  async function loadOrders() {
    setOrdersLoading(true);
    try {
      const result = await getMyOrders({ page: 1, limit: 20 });
      setOrders(result.orders || []);
    } catch (reason) {
      setFeedback({
        type: "error",
        text: reason.message || "Không thể tải lịch sử đơn hàng.",
      });
    } finally {
      setOrdersLoading(false);
    }
  }

  async function openOrders() {
    if (!user) {
      setReturnView("orders");
      setAuthOpen(true);
      setAccountMenuOpen(false);
      return;
    }
    setView("orders");
    setAccountMenuOpen(false);
    await loadOrders();
  }

  async function changeQuantity(item, quantity) {
    try {
      setBusy(true);
      setCart(
        await updateCartItem({
          productId: item.product._id,
          variantId: item.variant._id,
          quantity,
        }),
      );
    } catch (reason) {
      setFeedback({
        type: "error",
        text: reason.message || "Không thể cập nhật số lượng.",
      });
      try {
        await refreshCart();
      } catch {
        /* Keep the current cart visible. */
      }
    } finally {
      setBusy(false);
    }
  }

  async function deleteItem(item) {
    try {
      setBusy(true);
      setCart(
        await removeCartItem({
          productId: item.product._id,
          variantId: item.variant?._id,
        }),
      );
    } catch (reason) {
      setFeedback({
        type: "error",
        text: reason.message || "Không thể xóa sản phẩm.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function placeOrder(event) {
    event.preventDefault();
    try {
      setBusy(true);
      const order = await createCodOrder(shipping);
      setCart({ items: [], subtotal: 0 });
      setView("orders");
      setOrders([order]);
      setFeedback({
        type: "success",
        text: `Đặt hàng thành công · Mã đơn ${order._id.slice(-8).toUpperCase()}`,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      try {
        const result = await getMyOrders({ page: 1, limit: 20 });
        setOrders(result.orders?.length ? result.orders : [order]);
      } catch {
        /* Keep the created order visible if history cannot refresh. */
      }
    } catch (reason) {
      setFeedback({
        type: "error",
        text:
          reason.message ||
          "Chưa thể tạo đơn hàng. Hãy kiểm tra lại tồn kho và địa chỉ.",
      });
      if (reason.response?.status === 409) {
        try {
          await refreshCart();
        } catch {
          /* Preserve checkout if the cart refresh also fails. */
        }
      }
    } finally {
      setBusy(false);
    }
  }

  function openProduct(product) {
    setSelectedProduct(product);
    setSelectedVariantId(
      product.variants?.find((item) => item.isActive)?._id || "",
    );
  }

  function closeAuth() {
    setAuthOpen(false);
    setPendingAdd(null);
    setPendingWishlistProduct(null);
    setReturnView("shop");
  }

  return (
    <div className="app-shell">
      <div className="announcement">
        Giao hàng miễn phí cho đơn từ 1.500.000₫ <span>·</span> Thanh toán khi
        nhận hàng
      </div>
      <SiteHeader
        view={view}
        user={user}
        cartCount={cartCount}
        query={query}
        accountMenuOpen={accountMenuOpen}
        onQueryChange={(value) => {
          setQuery(value);
          setPage(1);
          setView("shop");
        }}
        onGoShop={() => {
          setView("shop");
          setAccountMenuOpen(false);
        }}
        onOpenOrders={openOrders}
        onToggleAccount={() => setAccountMenuOpen((open) => !open)}
        onOpenAuth={() => setAuthOpen(true)}
        onLogout={handleLogout}
        onOpenCart={openCart}
        onOpenManagement={() => {
          setView("management");
          setAccountMenuOpen(false);
        }}
        onOpenProfile={openProfile}
        onOpenWishlist={openWishlist}
      />

      {feedback && (
        <div className={`feedback feedback-${feedback.type}`} role="status">
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} aria-label="Đóng thông báo">
            ×
          </button>
        </div>
      )}

      {view === "shop" && (
        <HomePage
          products={products}
          categories={categories}
          category={category}
          onCategoryChange={(value) => {
            setCategory(value);
            setPage(1);
          }}
          sort={sort}
          onSortChange={(value) => {
            setSort(value);
            setPage(1);
          }}
          page={page}
          onPageChange={setPage}
          pagination={pagination}
          loading={loading}
          error={catalogError}
          productImage={productImage}
          onOpenProduct={openProduct}
          isWishlisted={(product) =>
            wishlist.some((item) => item._id === product._id)
          }
          onToggleWishlist={toggleWishlist}
        />
      )}
      {view === "cart" && (
        <CartPage
          cart={cart}
          cartCount={cartCount}
          shippingFee={shippingFee}
          cartTotal={cartTotal}
          busy={busy}
          productImage={productImage}
          onChangeQuantity={changeQuantity}
          onRemoveItem={deleteItem}
          onContinueShopping={() => setView("shop")}
          onCheckout={openCheckout}
        />
      )}
      {view === "checkout" && (
        <CheckoutPage
          cart={cart}
          cartTotal={cartTotal}
          shippingFee={shippingFee}
          shipping={shipping}
          addresses={addresses}
          onChooseAddress={(address) => setShipping((value) => ({ ...value, ...address }))}
          onShippingChange={setShipping}
          busy={busy}
          onBack={() => setView("cart")}
          onSubmit={placeOrder}
        />
      )}
      {view === "orders" && (
        <OrdersPage
          orders={orders}
          loading={ordersLoading}
          onShop={() => setView("shop")}
          onReviewed={(orderId, productId) => setOrders((items) => items.map((order) => order._id === orderId ? { ...order, reviewedProductIds: [...(order.reviewedProductIds || []), String(productId)] } : order))}
        />
      )}
      {view === "profile" && user && (
        <ProfilePage
          user={user}
          onUserChange={setUser}
          onFeedback={(type, text) => setFeedback({ type, text })}
        />
      )}
      {view === "wishlist" && user && (
        <WishlistPage
          products={wishlist}
          loading={wishlistLoading}
          productImage={productImage}
          onOpenProduct={openProduct}
          onRemove={(product) => toggleWishlist(product)}
          onShop={() => setView("shop")}
        />
      )}
      {view === "management" && user?.role === "ADMIN" && (
        <AdminPage
          onFeedback={(type, text) => setFeedback({ type, text })}
          onCategoriesChanged={async () => setCategories(await getCategories())}
          productImage={productImage}
        />
      )}
      {view === "management" && user && user.role !== "ADMIN" && (
        <SellerPage
          user={user}
          onUserChange={setUser}
          onFeedback={(type, text) => setFeedback({ type, text })}
          productImage={productImage}
        />
      )}

      <footer className="site-footer">
        <a className="brand" href="#home" onClick={() => setView("shop")}>
          <span className="brand-mark">F</span>
          <span>
            fieldhouse<span className="brand-dot">.</span>
          </span>
        </a>
        <p>Built for the love of the game.</p>
        <span>© 2026 FIELDHOUSE</span>
      </footer>

      {selectedProduct && (
        <ProductDialog
          product={selectedProduct}
          variantId={selectedVariantId}
          busy={busy}
          productImage={productImage}
          isWishlisted={wishlist.some(
            (item) => item._id === selectedProduct._id,
          )}
          onToggleWishlist={toggleWishlist}
          onVariantChange={setSelectedVariantId}
          onAddToCart={requestAddToCart}
          onClose={() => setSelectedProduct(null)}
        />
      )}
      {authOpen && <AuthDialog onClose={closeAuth} onSubmit={handleAuth} />}
    </div>
  );
}

export default App;
