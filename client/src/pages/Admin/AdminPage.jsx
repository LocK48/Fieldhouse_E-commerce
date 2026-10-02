import { useEffect, useState } from "react";
import {
  approveStore,
  advanceOrder,
  getManageableOrders,
  getPendingProducts,
  getPendingStores,
  getSellerApplications,
  reviewProduct,
  reviewSellerApplication,
} from "../../api/admin.api";
import CategoryManager from "./CategoryManager";
import { formatCurrency, orderStatusLabels } from "../../utils/formatters";

export default function AdminPage({ onFeedback, onCategoriesChanged, productImage }) {
  const [applications, setApplications] = useState([]);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  async function loadQueue(refresh = true) {
    if (refresh) setLoading(true);
    if (refresh) setError("");
    try {
      const [nextApplications, nextStores, nextProducts, nextOrders] = await Promise.all([
        getSellerApplications(),
        getPendingStores(),
        getPendingProducts(),
        getManageableOrders(),
      ]);
      setApplications(nextApplications);
      setStores(nextStores);
      setProducts(nextProducts);
      setOrders(nextOrders);
    } catch (reason) {
      setError(
        reason.response?.data?.message ||
          reason.message ||
          "Không thể tải hàng chờ duyệt.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    Promise.all([
      getSellerApplications(),
      getPendingStores(),
      getPendingProducts(),
      getManageableOrders(),
    ])
      .then(([nextApplications, nextStores, nextProducts, nextOrders]) => {
        setApplications(nextApplications);
        setStores(nextStores);
        setProducts(nextProducts);
        setOrders(nextOrders);
      })
      .catch((reason) =>
        setError(
          reason.response?.data?.message ||
            reason.message ||
            "Không thể tải hàng chờ duyệt.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  async function decide(type, item, approved) {
    const id = item._id;
    setBusyId(id);
    try {
      if (type === "seller") {
        await reviewSellerApplication(id, approved);
        setApplications((items) =>
          items.filter((application) => application._id !== id),
        );
      } else {
        await reviewProduct(id, approved);
        setProducts((items) => items.filter((product) => product._id !== id));
      }
      onFeedback(
        "success",
        approved ? "Đã duyệt yêu cầu." : "Đã từ chối yêu cầu.",
      );
    } catch (reason) {
      setError(
        reason.response?.data?.message ||
          reason.message ||
          "Không thể cập nhật trạng thái.",
      );
    } finally {
      setBusyId("");
    }
  }

  async function approvePendingStore(store) {
    setBusyId(store._id);
    try {
      await approveStore(store._id);
      setStores((items) => items.filter((item) => item._id !== store._id));
      onFeedback("success", "Đã duyệt cửa hàng.");
    } catch (reason) {
      setError(
        reason.response?.data?.message ||
          reason.message ||
          "Không thể duyệt cửa hàng.",
      );
    } finally {
      setBusyId("");
    }
  }

  async function moveOrderForward(order) {
    setBusyId(order._id);
    try {
      const updated = await advanceOrder(order._id);
      setOrders((items) => items.filter((item) => item._id !== order._id));
      onFeedback("success", `Đơn hàng đã chuyển sang ${orderStatusLabels[updated.orderStatus] || updated.orderStatus}.`);
    } catch (reason) {
      setError(reason.response?.data?.message || reason.message || "Không thể cập nhật đơn hàng.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <main className="commerce-page admin-page">
      <header className="page-heading">
        <p className="eyebrow">FIELDHOUSE · QUẢN TRỊ</p>
        <h1>
          Trung tâm <em>kiểm duyệt</em>
        </h1>
        <p>Xét duyệt tài khoản người bán và sản phẩm mới.</p>
      </header>
      {error && (
        <div className="notice" role="alert">
          {error}
          <button className="dashboard-retry" onClick={loadQueue}>
            Tải lại
          </button>
        </div>
      )}
      {loading ? (
        <div className="skeleton dashboard-skeleton" />
      ) : (
        <>
          <section className="admin-section">
            <div className="dashboard-toolbar">
              <h2>
                Đăng ký người bán <span>{applications.length}</span>
              </h2>
            </div>
            {applications.length ? (
              <div className="admin-queue">
                {applications.map((item) => (
                  <article className="admin-card" key={item._id}>
                    <div>
                      <p className="eyebrow">
                        {item.sellerApplication?.businessName ||
                          "Người bán mới"}
                      </p>
                      <h3>{item.name}</h3>
                      <p>{item.email}</p>
                      {item.sellerApplication?.description && (
                        <p>{item.sellerApplication.description}</p>
                      )}
                      {item.sellerApplication?.reason && (
                        <blockquote>{item.sellerApplication.reason}</blockquote>
                      )}
                      <small>
                        Gửi ngày{" "}
                        {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                      </small>
                    </div>
                    <div className="admin-card-actions">
                      <button
                        disabled={busyId === item._id}
                        onClick={() => decide("seller", item, false)}
                      >
                        Từ chối
                      </button>
                      <button
                        className="primary-button"
                        disabled={busyId === item._id}
                        onClick={() => decide("seller", item, true)}
                      >
                        Duyệt
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="admin-empty">Không có đơn đăng ký đang chờ.</p>
            )}
          </section>
          <section className="admin-section">
            <div className="dashboard-toolbar">
              <h2>
                Sản phẩm chờ duyệt <span>{products.length}</span>
              </h2>
            </div>
            {products.length ? (
              <div className="admin-queue">
                {products.map((item) => (
                  <article className="admin-card" key={item._id}>
                    <div className="admin-product-preview">
                      {productImage(item) && (
                        <img src={productImage(item)} alt="" />
                      )}
                      <div>
                        <p className="eyebrow">
                          {item.store?.name || "Cửa hàng"} ·{" "}
                          {item.category?.name || "Chưa phân loại"}
                        </p>
                        <h3>{item.name}</h3>
                        <p>{item.description}</p>
                        <small>
                          SKU {item.variants?.[0]?.sku || "—"} · Tồn kho{" "}
                          {item.variants?.[0]?.stock ?? 0}
                        </small>
                      </div>
                    </div>
                    <div className="admin-card-actions">
                      <button
                        disabled={busyId === item._id}
                        onClick={() => decide("product", item, false)}
                      >
                        Từ chối
                      </button>
                      <button
                        className="primary-button"
                        disabled={busyId === item._id}
                        onClick={() => decide("product", item, true)}
                      >
                        Duyệt
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="admin-empty">Không có sản phẩm đang chờ.</p>
            )}
          </section>
          <section className="admin-section">
            <div className="dashboard-toolbar">
              <h2>
                Cửa hàng chờ duyệt <span>{stores.length}</span>
              </h2>
            </div>
            {stores.length ? (
              <div className="admin-queue">
                {stores.map((store) => (
                  <article className="admin-card" key={store._id}>
                    <div>
                      <p className="eyebrow">/{store.slug}</p>
                      <h3>{store.name}</h3>
                      <p>
                        {store.owner?.name} · {store.owner?.email}
                      </p>
                      {store.description && <p>{store.description}</p>}
                    </div>
                    <div className="admin-card-actions">
                      <button
                        className="primary-button"
                        disabled={busyId === store._id}
                        onClick={() => approvePendingStore(store)}
                      >
                        Duyệt cửa hàng
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="admin-empty">Không có cửa hàng đang chờ.</p>
            )}
          </section>
          <section className="admin-section">
            <div className="dashboard-toolbar"><h2>Đơn hàng cần xử lý <span>{orders.length}</span></h2></div>
            {orders.length ? <div className="admin-queue">{orders.map((order) => <article className="admin-card" key={order._id}><div><p className="eyebrow">#{order._id.slice(-8).toUpperCase()} · {orderStatusLabels[order.orderStatus] || order.orderStatus}</p><h3>{order.user?.name || "Khách hàng"}</h3><p>{order.user?.email} · {order.items.length} mặt hàng</p><small>{order.items.map((item) => `${item.name} × ${item.quantity}`).join(" · ")}</small><p>{order.shippingAddress?.recipientName} · {order.shippingAddress?.phone} · {order.shippingAddress?.city}</p><strong>{formatCurrency(order.total)}</strong></div><div className="admin-card-actions"><button className="primary-button" disabled={busyId === order._id} onClick={() => moveOrderForward(order)}>{order.orderStatus === "PENDING" ? "Xác nhận" : order.orderStatus === "CONFIRMED" ? "Chuẩn bị" : order.orderStatus === "PROCESSING" ? "Bàn giao vận chuyển" : "Đánh dấu đã giao"}</button></div></article>)}</div> : <p className="admin-empty">Không có đơn cần xử lý.</p>}
          </section>
          <CategoryManager onFeedback={onFeedback} onCategoriesChanged={onCategoriesChanged} />
        </>
      )}
    </main>
  );
}
