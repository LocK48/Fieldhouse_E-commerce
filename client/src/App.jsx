import { useEffect, useMemo, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { getCart } from "./api/cart.api";
import { getCategories } from "./api/category.api";
import { getCurrentUser, login, logout } from "./api/auth.api";
import { cancelMyOrder, createCodOrder, getMyOrders } from "./api/order.api";
import { getProducts } from "./api/product.api";
import { resolveMediaUrl } from "./api/axios";
import { getAddresses } from "./api/address.api";
import {
  addWishlistProduct,
  getWishlist,
  removeWishlistProduct,
} from "./api/wishlist.api";
import SiteHeader from "./components/layout/SiteHeader";
import { useFeedback } from "./components/common/FeedbackContext";
import CartPage from "./pages/Cart/CartPage";
import CheckoutPage from "./pages/Checkout/CheckoutPage";
import HomePage from "./pages/Home/HomePage";
import OrdersPage from "./pages/Orders/OrdersPage";
import SellerPage from "./pages/Seller/SellerPage";
import AdminPage from "./pages/Admin/AdminPage";
import ProfilePage from "./pages/Profile/ProfilePage";
import WishlistPage from "./pages/Wishlist/WishlistPage";
import ProductsPage from "./pages/Products/ProductsPage";
import ProductDetailPage from "./pages/ProductDetail/ProductDetailPage";
import StorefrontPage from "./pages/Storefront/StorefrontPage";
import StorefrontLayout from "./components/layout/StorefrontLayout";
import SellerLayout from "./components/layout/SellerLayout";
import AdminLayout from "./components/layout/AdminLayout";
import ChatWorkspace from "./components/chat/ChatWorkspace";
import CustomerChatWidget from "./components/chat/CustomerChatWidget";
import { useCommerceStore } from "./store/useCommerceStore";
import { useCartActions } from "./hooks/useCartActions";
import { ROUTES, productDetailPath } from "./routes/paths";
import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import "./App.css";
import "./Commerce.css";
import "./Dashboard.css";
import "./Account.css";
import "./ProductPages.css";

const freeShippingThreshold = 1_500_000;
const standardShipping = 30_000;

function App() {
  const { confirm, showToast } = useFeedback();
  const setFeedback = ({ type, text }) => showToast(text, type);
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = [ROUTES.LOGIN, ROUTES.REGISTER].includes(
    location.pathname,
  );
  const view = location.pathname.startsWith("/products/")
    ? "product-detail"
    : {
        [ROUTES.HOME]: "shop",
        [ROUTES.PRODUCTS]: "products",
        [ROUTES.CART]: "cart",
        [ROUTES.CHECKOUT]: "checkout",
        [ROUTES.ORDERS]: "orders",
        [ROUTES.PROFILE]: "profile",
        [ROUTES.WISHLIST]: "wishlist",
        [ROUTES.SELLER]: "management",
        [ROUTES.SELLER_MESSAGES]: "management",
        [ROUTES.ADMIN]: "management",
        [ROUTES.ADMIN_MESSAGES]: "management",
      }[location.pathname] || "shop";
  const setView = (nextView) => {
    const paths = {
      shop: ROUTES.HOME,
      products: ROUTES.PRODUCTS,
      cart: ROUTES.CART,
      checkout: ROUTES.CHECKOUT,
      orders: ROUTES.ORDERS,
      profile: ROUTES.PROFILE,
      wishlist: ROUTES.WISHLIST,
      management: ROUTES.SELLER,
    };
    navigate(
      nextView.startsWith("/")
        ? nextView
        : nextView === "management" && user?.role === "ADMIN"
          ? ROUTES.ADMIN
          : paths[nextView] || "/",
    );
  };
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const query = new URLSearchParams(location.search).get("search") || "";
  const [category, setCategory] = useState("Tất cả");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const user = useCommerceStore((state) => state.user);
  const setUser = useCommerceStore((state) => state.setUser);
  const [authChecked, setAuthChecked] = useState(
    () =>
      !localStorage.getItem("fieldhouse-access-token") &&
      !localStorage.getItem("fieldhouse-refresh-token"),
  );
  const cart = useCommerceStore((state) => state.cart);
  const setCart = useCommerceStore((state) => state.setCart);
  const wishlist = useCommerceStore((state) => state.wishlist);
  const setWishlist = useCommerceStore((state) => state.setWishlist);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const addresses = useCommerceStore((state) => state.addresses);
  const setAddresses = useCommerceStore((state) => state.setAddresses);
  const clearCommerceState = useCommerceStore(
    (state) => state.clearCommerceState,
  );
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [pendingAdd, setPendingAdd] = useState(null);
  const [pendingWishlistProduct, setPendingWishlistProduct] = useState(null);
  const [pendingChat, setPendingChat] = useState(null);
  const [chatStartRequest, setChatStartRequest] = useState(null);
  const [returnView, setReturnView] = useState("shop");
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
  const { refreshCart, putItemInCart, changeQuantity, deleteItem, emptyCart } =
    useCartActions({ setCart, setBusy, setFeedback, confirm });

  function requestChat(storeId = null) {
    if (user && user.role !== "CUSTOMER") {
      showToast("Tính năng chat dành cho tài khoản khách hàng.", "error");
      return;
    }
    if (!user) {
      setPendingChat({ storeId });
      setReturnView(
        view === "product-detail"
          ? `${location.pathname}${location.search}`
          : "shop",
      );
      navigate(ROUTES.LOGIN);
      return;
    }
    setChatStartRequest((current) => ({ id: (current?.id || 0) + 1, storeId }));
  }

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
  }, [userId, setAddresses, setWishlist]);

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
    ) {
      return undefined;
    }

    getCurrentUser()
      .then(async (currentUser) => {
        if (!active) return;
        setUser(currentUser);
        setAuthChecked(true);
        setShipping((value) => ({
          ...value,
          recipientName: currentUser.name || value.recipientName,
        }));
        const currentCart = await getCart();
        if (active) setCart(currentCart);
      })
      .catch(() => {
        if (active) setAuthChecked(true);
        localStorage.removeItem("fieldhouse-access-token");
        localStorage.removeItem("fieldhouse-refresh-token");
      });

    return () => {
      active = false;
    };
  }, [setCart, setUser]);

  function productImage(product, index = 0) {
    const image = product?.images?.[index] || product?.images?.[0];
    return (
      resolveMediaUrl(image?.url, image?.key) ||
      (product?.slug?.includes("mercurial") ? mercurialImage : "")
    );
  }

  async function toggleWishlist(product) {
    if (!user) {
      setPendingWishlistProduct(product);
      setReturnView(
        view === "product-detail"
          ? `${location.pathname}${location.search}`
          : "shop",
      );
      navigate(ROUTES.LOGIN);
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
      setReturnView("wishlist");
      navigate(ROUTES.LOGIN);
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
      setReturnView("profile");
      navigate(ROUTES.LOGIN);
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
      setReturnView(
        view === "product-detail"
          ? `${location.pathname}${location.search}`
          : "shop",
      );
      navigate(ROUTES.LOGIN);
      return;
    }
    putItemInCart(product, variantId);
  }

  async function handleAuth(form) {
    const signedIn = await login(form.email, form.password);
    setUser(signedIn);
    setShipping((value) => ({
      ...value,
      recipientName: signedIn.name || value.recipientName,
    }));
    setFeedback({
      type: "success",
      text: `Chào mừng trở lại, ${signedIn.name}.`,
    });
    try {
      setCart(await getCart());
    } catch {
      setCart({ items: [], subtotal: 0 });
    }

    if (pendingAdd) {
      const queuedItem = pendingAdd;
      setPendingAdd(null);
      setView(returnView);
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

    if (pendingChat) {
      const target = pendingChat;
      setPendingChat(null);
      setChatStartRequest((current) => ({
        id: (current?.id || 0) + 1,
        storeId: target.storeId,
      }));
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
    clearCommerceState();
    setOrders([]);
    setAccountMenuOpen(false);
    setView("shop");
    setFeedback({ type: "success", text: "Bạn đã đăng xuất." });
  }

  async function openCart() {
    if (!user) {
      setReturnView("cart");
      navigate(ROUTES.LOGIN);
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

  async function cancelOrder(order) {
    const accepted = await confirm({
      title: "Hủy đơn hàng?",
      description: `Đơn #${order._id.slice(-8).toUpperCase()} sẽ được hủy và tồn kho được hoàn lại.`,
      confirmLabel: "Hủy đơn hàng",
    });
    if (!accepted) return;
    setBusy(true);
    try {
      const updatedOrder = await cancelMyOrder(order._id);
      setOrders((items) =>
        items.map((item) => (item._id === order._id ? updatedOrder : item)),
      );
      setFeedback({
        type: "success",
        text: "Đã hủy đơn hàng. Tồn kho đã được hoàn lại.",
      });
    } catch (reason) {
      setFeedback({
        type: "error",
        text:
          reason.response?.data?.message ||
          reason.message ||
          "Không thể hủy đơn hàng.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function openOrders() {
    if (!user) {
      setReturnView("orders");
      navigate(ROUTES.LOGIN);
      setAccountMenuOpen(false);
      return;
    }
    setView("orders");
    setAccountMenuOpen(false);
    await loadOrders();
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
    navigate(productDetailPath(product._id), {
      state: { from: `${location.pathname}${location.search}` },
    });
  }

  const protectedPage = (content) =>
    authChecked ? user ? content : <Navigate to="/" replace /> : null;

  return (
    <div
      className={`app-shell mx-0 min-h-screen w-full max-w-none overflow-hidden bg-[#faf9f6] text-[#18211d] ${isAuthPage ? "auth-shell" : ""} ${location.pathname.startsWith(ROUTES.SELLER) || location.pathname.startsWith(ROUTES.ADMIN) ? "role-shell" : ""}`}
    >
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
          setPage(1);
          const search = value.trim();
          navigate(
            search
              ? `/products?search=${encodeURIComponent(search)}`
              : "/products",
            { replace: true },
          );
        }}
        onGoShop={() => {
          setView("shop");
          setAccountMenuOpen(false);
          navigate("/");
        }}
        onOpenOrders={openOrders}
        onToggleAccount={() => setAccountMenuOpen((open) => !open)}
        onOpenAuth={() => {
          setReturnView("shop");
          navigate(ROUTES.LOGIN);
        }}
        onLogout={handleLogout}
        onOpenCart={openCart}
        onOpenManagement={() => {
          setView("management");
          setAccountMenuOpen(false);
        }}
        onOpenProfile={openProfile}
        onOpenWishlist={openWishlist}
        onOpenChat={() => requestChat()}
      />

      <Routes>
        <Route
          path={ROUTES.LOGIN}
          element={<LoginPage onLogin={handleAuth} />}
        />
        <Route
          path={ROUTES.REGISTER}
          element={<RegisterPage onVerified={handleAuth} />}
        />
        <Route
          path="/"
          element={
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
          }
        />
        <Route
          path={ROUTES.PRODUCTS}
          element={
            <ProductsPage
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
              search={query}
              productImage={productImage}
              onOpenProduct={openProduct}
              isWishlisted={(product) =>
                wishlist.some((item) => item._id === product._id)
              }
              onToggleWishlist={toggleWishlist}
            />
          }
        />
        <Route
          path={ROUTES.PRODUCT_DETAIL}
          element={
            <ProductDetailPage
              key={location.pathname}
              busy={busy}
              productImage={productImage}
              isWishlisted={(product) =>
                wishlist.some((item) => item._id === product._id)
              }
              onToggleWishlist={toggleWishlist}
              onAddToCart={requestAddToCart}
              onOpenChat={requestChat}
            />
          }
        />
        <Route
          path={ROUTES.STOREFRONT}
          element={
            <StorefrontLayout>
              <StorefrontPage
                productImage={productImage}
                onOpenProduct={openProduct}
                onOpenChat={requestChat}
              />
            </StorefrontLayout>
          }
        />
        <Route
          path={ROUTES.CART}
          element={protectedPage(
            <CartPage
              cart={cart}
              cartCount={cartCount}
              shippingFee={shippingFee}
              cartTotal={cartTotal}
              busy={busy}
              productImage={productImage}
              onChangeQuantity={changeQuantity}
              onRemoveItem={deleteItem}
              onClearCart={emptyCart}
              onContinueShopping={() => setView("shop")}
              onCheckout={openCheckout}
            />,
          )}
        />
        <Route
          path={ROUTES.CHECKOUT}
          element={protectedPage(
            <CheckoutPage
              cart={cart}
              cartTotal={cartTotal}
              shippingFee={shippingFee}
              shipping={shipping}
              addresses={addresses}
              onChooseAddress={(address) =>
                setShipping((value) => ({ ...value, ...address }))
              }
              onShippingChange={setShipping}
              busy={busy}
              onBack={() => setView("cart")}
              onSubmit={placeOrder}
            />,
          )}
        />
        <Route
          path={ROUTES.ORDERS}
          element={protectedPage(
            <OrdersPage
              orders={orders}
              loading={ordersLoading}
              busy={busy}
              onCancelOrder={cancelOrder}
              onShop={() => setView("shop")}
              onReviewed={(orderId, productId, reviewId) =>
                setOrders((items) =>
                  items.map((order) =>
                    order._id === orderId
                      ? {
                          ...order,
                          reviewedProductIds: [
                            ...(order.reviewedProductIds || []),
                            String(productId),
                          ],
                          reviewIdsByProduct: {
                            ...(order.reviewIdsByProduct || {}),
                            [String(productId)]: reviewId,
                          },
                        }
                      : order,
                  ),
                )
              }
              onReviewDeleted={(orderId, productId) =>
                setOrders((items) =>
                  items.map((order) => {
                    if (order._id !== orderId) return order;
                    const reviewIdsByProduct = {
                      ...(order.reviewIdsByProduct || {}),
                    };
                    delete reviewIdsByProduct[String(productId)];
                    return {
                      ...order,
                      reviewedProductIds: (
                        order.reviewedProductIds || []
                      ).filter((id) => id !== String(productId)),
                      reviewIdsByProduct,
                    };
                  }),
                )
              }
            />,
          )}
        />
        <Route
          path={ROUTES.PROFILE}
          element={protectedPage(
            <ProfilePage
              user={user}
              onUserChange={setUser}
              onFeedback={(type, text) => setFeedback({ type, text })}
            />,
          )}
        />
        <Route
          path={ROUTES.WISHLIST}
          element={protectedPage(
            <WishlistPage
              products={wishlist}
              loading={wishlistLoading}
              productImage={productImage}
              onOpenProduct={openProduct}
              onRemove={(product) => toggleWishlist(product)}
              onShop={() => setView("shop")}
            />,
          )}
        />
        <Route
          path={ROUTES.ADMIN}
          element={
            !authChecked ? null : user?.role === "ADMIN" ? (
              <AdminLayout user={user}>
                <AdminPage
                  onFeedback={(type, text) => setFeedback({ type, text })}
                  onCategoriesChanged={async () =>
                    setCategories(await getCategories())
                  }
                  productImage={productImage}
                />
              </AdminLayout>
            ) : (
              <Navigate to={user ? ROUTES.SELLER : ROUTES.HOME} replace />
            )
          }
        />
        <Route
          path={ROUTES.SELLER}
          element={
            !authChecked ? null : user && user.role !== "ADMIN" ? (
              <SellerLayout user={user}>
                <SellerPage
                  user={user}
                  onUserChange={setUser}
                  onFeedback={(type, text) => setFeedback({ type, text })}
                  productImage={productImage}
                />
              </SellerLayout>
            ) : (
              <Navigate
                to={user?.role === "ADMIN" ? ROUTES.ADMIN : ROUTES.HOME}
                replace
              />
            )
          }
        />
        <Route
          path={ROUTES.ADMIN_MESSAGES}
          element={
            !authChecked ? null : user?.role === "ADMIN" ? (
              <AdminLayout user={user}>
                <main className="commerce-page admin-chat-page">
                  <header className="page-heading">
                    <p className="eyebrow">FIELDHOUSE · CSKH</p>
                    <h1>
                      Hỗ trợ <em>khách hàng.</em>
                    </h1>
                    <p>Trả lời tin nhắn từ khách hàng theo thời gian thực.</p>
                  </header>
                  <ChatWorkspace user={user} mode="admin" embedded />
                </main>
              </AdminLayout>
            ) : (
              <Navigate to={ROUTES.ADMIN} replace />
            )
          }
        />
        <Route
          path={ROUTES.SELLER_MESSAGES}
          element={
            !authChecked ? null : user?.role === "SELLER" ? (
              <SellerLayout user={user}>
                <main className="commerce-page seller-chat-page">
                  <header className="page-heading">
                    <p className="eyebrow">KÊNH NGƯỜI BÁN</p>
                    <h1>
                      Hộp thư <em>cửa hàng.</em>
                    </h1>
                    <p>Trao đổi trực tiếp với khách hàng.</p>
                  </header>
                  <ChatWorkspace user={user} mode="seller" embedded />
                </main>
              </SellerLayout>
            ) : (
              <Navigate to={ROUTES.SELLER} replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <footer className="site-footer">
        <a
          className="brand"
          href="/"
          onClick={(event) => {
            event.preventDefault();
            setView("shop");
            navigate("/");
          }}
        >
          <span className="brand-mark">F</span>
          <span>
            fieldhouse<span className="brand-dot">.</span>
          </span>
        </a>
        <p>Built for the love of the game.</p>
        <span>© 2026 FIELDHOUSE</span>
      </footer>

      <CustomerChatWidget user={user} startRequest={chatStartRequest} />
    </div>
  );
}

export default App;
