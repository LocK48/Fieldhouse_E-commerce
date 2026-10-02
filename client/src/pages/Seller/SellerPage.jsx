import { useEffect, useState } from "react";
import { applySeller } from "../../api/user.api";
import { getMyStore, createStore } from "../../api/store.api";
import { deleteProduct, getMyProducts } from "../../api/product.api";
import ProductForm from "../../components/product/ProductForm";
import { formatCurrency } from "../../utils/formatters";

const statusLabels = {
  PENDING: "Đang chờ duyệt",
  ACTIVE: "Đang hoạt động",
  REJECTED: "Bị từ chối",
  ARCHIVED: "Đã lưu trữ",
};

export default function SellerPage({
  user,
  onUserChange,
  onFeedback,
  productImage,
}) {
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(user.role === "SELLER");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(undefined);
  const [creatingStore, setCreatingStore] = useState(false);
  const [storeForm, setStoreForm] = useState({
    name: "",
    slug: "",
    description: "",
  });
  const [application, setApplication] = useState({
    businessName: "",
    description: "",
    reason: "",
  });
  const [saving, setSaving] = useState(false);

  async function loadSellerData(refresh = true) {
    if (refresh) setLoading(true);
    if (refresh) setError("");
    try {
      const currentStore = await getMyStore();
      setStore(currentStore);
      setProducts(await getMyProducts());
    } catch (reason) {
      if (reason.response?.status === 404) setStore(null);
      else
        setError(
          reason.response?.data?.message ||
            reason.message ||
            "Không thể tải dữ liệu cửa hàng.",
        );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user.role !== "SELLER") return;
    getMyStore()
      .then((currentStore) => {
        setStore(currentStore);
        return getMyProducts();
      })
      .then(setProducts)
      .catch((reason) => {
        if (reason.response?.status === 404) setStore(null);
        else
          setError(
            reason.response?.data?.message ||
              reason.message ||
              "Không thể tải dữ liệu cửa hàng.",
          );
      })
      .finally(() => setLoading(false));
  }, [user.role]);

  async function submitApplication(event) {
    event.preventDefault();
    setSaving(true);
    try {
      onUserChange(await applySeller(application));
      onFeedback("success", "Đã gửi đơn đăng ký người bán để admin xét duyệt.");
    } catch (reason) {
      setError(
        reason.response?.data?.message ||
          reason.message ||
          "Không thể gửi đơn đăng ký.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function submitStore(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const created = await createStore({
        ...storeForm,
        slug: storeForm.slug
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-"),
      });
      setStore(created);
      setCreatingStore(false);
      onFeedback(
        "success",
        "Đã tạo cửa hàng. Cửa hàng cần được admin duyệt trước khi đăng sản phẩm.",
      );
    } catch (reason) {
      setError(
        reason.response?.data?.message ||
          reason.message ||
          "Không thể tạo cửa hàng.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function archiveProduct(product) {
    if (!window.confirm(`Lưu trữ sản phẩm “${product.name}”?`)) return;
    try {
      await deleteProduct(product._id);
      setProducts((items) => items.filter((item) => item._id !== product._id));
      onFeedback("success", "Đã lưu trữ sản phẩm.");
    } catch (reason) {
      setError(
        reason.response?.data?.message ||
          reason.message ||
          "Không thể lưu trữ sản phẩm.",
      );
    }
  }

  if (user.role !== "SELLER")
    return (
      <main className="commerce-page seller-page">
        <header className="page-heading">
          <p className="eyebrow">FIELDHOUSE · ĐỐI TÁC</p>
          <h1>
            Đăng ký trở thành <em>người bán</em>
          </h1>
          <p>Gửi thông tin cửa hàng để đội ngũ FIELDHOUSE xét duyệt.</p>
        </header>
        {user.sellerStatus === "PENDING" ? (
          <div className="notice">
            Đơn đăng ký của bạn đang chờ admin xét duyệt.
          </div>
        ) : (
          <form
            className="product-form dashboard-form"
            onSubmit={submitApplication}
          >
            {error && <p role="alert">{error}</p>}
            <label>
              Tên cửa hàng dự kiến
              <input
                value={application.businessName}
                onChange={(e) =>
                  setApplication({
                    ...application,
                    businessName: e.target.value,
                  })
                }
                required
                maxLength={150}
              />
            </label>
            <label>
              Giới thiệu cửa hàng
              <textarea
                value={application.description}
                onChange={(e) =>
                  setApplication({
                    ...application,
                    description: e.target.value,
                  })
                }
                rows={4}
                maxLength={2000}
              />
            </label>
            <label>
              Lý do đăng ký
              <textarea
                value={application.reason}
                onChange={(e) =>
                  setApplication({ ...application, reason: e.target.value })
                }
                rows={3}
                maxLength={1000}
                required
              />
            </label>
            <button className="primary-button" disabled={saving}>
              {saving ? "Đang gửi…" : "Gửi đăng ký"} <span>↗</span>
            </button>
            {user.sellerStatus === "REJECTED" && (
              <small>
                Đơn trước chưa được duyệt. Bạn có thể cập nhật thông tin và gửi
                lại.
              </small>
            )}
          </form>
        )}
      </main>
    );

  return (
    <main className="commerce-page seller-page">
      <header className="page-heading">
        <p className="eyebrow">KÊNH NGƯỜI BÁN</p>
        <h1>
          Quản lý <em>cửa hàng</em>
        </h1>
        <p>Sản phẩm mới sẽ hiển thị sau khi admin duyệt.</p>
      </header>
      {error && (
        <div className="notice" role="alert">
          {error}
        </div>
      )}
      {loading ? (
        <div className="skeleton dashboard-skeleton" />
      ) : !store ? (
        <section className="dashboard-panel">
          <h2>Tạo cửa hàng</h2>
          <p>
            Bắt đầu bằng hồ sơ cửa hàng. Admin cần duyệt cửa hàng trước khi bạn
            đăng sản phẩm.
          </p>
          {creatingStore ? (
            <form
              className="product-form dashboard-form"
              onSubmit={submitStore}
            >
              <label>
                Tên cửa hàng
                <input
                  value={storeForm.name}
                  onChange={(e) =>
                    setStoreForm({ ...storeForm, name: e.target.value })
                  }
                  required
                  maxLength={150}
                />
              </label>
              <label>
                Đường dẫn cửa hàng
                <input
                  value={storeForm.slug}
                  onChange={(e) =>
                    setStoreForm({ ...storeForm, slug: e.target.value })
                  }
                  required
                  pattern="[a-zA-Z0-9-]+"
                />
                <small>Chỉ dùng chữ không dấu, số và dấu gạch ngang.</small>
              </label>
              <label>
                Mô tả
                <textarea
                  value={storeForm.description}
                  onChange={(e) =>
                    setStoreForm({ ...storeForm, description: e.target.value })
                  }
                  maxLength={2000}
                  rows={4}
                />
              </label>
              <button disabled={saving}>
                {saving ? "Đang tạo…" : "Tạo cửa hàng"}
              </button>
            </form>
          ) : (
            <button
              className="primary-button"
              onClick={() => setCreatingStore(true)}
            >
              Tạo hồ sơ cửa hàng <span>↗</span>
            </button>
          )}
        </section>
      ) : (
        <>
          <section className="dashboard-panel store-overview">
            <div>
              <p className="eyebrow">CỬA HÀNG</p>
              <h2>{store.name}</h2>
              <p>/{store.slug}</p>
            </div>
            <span
              className={`dashboard-status status-${store.status?.toLowerCase()}`}
            >
              {statusLabels[store.status] || store.status}
            </span>
          </section>
          {store.status === "ACTIVE" && (
            <div className="dashboard-toolbar">
              <h2>
                Sản phẩm của bạn <span>{products.length}</span>
              </h2>
              <button
                className="primary-button"
                onClick={() => setEditing(null)}
              >
                Thêm sản phẩm <span>＋</span>
              </button>
            </div>
          )}
          {store.status !== "ACTIVE" ? (
            <div className="notice">
              Cửa hàng đang chờ admin duyệt. Bạn có thể quản lý sản phẩm sau khi
              được duyệt.
            </div>
          ) : products.length ? (
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Giá</th>
                    <th>Tồn kho</th>
                    <th>Trạng thái</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id}>
                      <td>
                        <div className="seller-product">
                          <img src={productImage(product) || ""} alt="" />
                          <span>
                            <strong>{product.name}</strong>
                            <small>
                              {product.category?.name || "Chưa phân loại"}
                            </small>
                          </span>
                        </div>
                      </td>
                      <td>
                        {formatCurrency(product.variants?.[0]?.price || 0)}
                      </td>
                      <td>
                        {product.variants?.reduce(
                          (sum, item) => sum + item.stock,
                          0,
                        ) || 0}
                      </td>
                      <td>
                        <span
                          className={`dashboard-status status-${product.status?.toLowerCase()}`}
                        >
                          {statusLabels[product.status] || product.status}
                        </span>
                      </td>
                      <td className="dashboard-actions">
                        <button onClick={() => setEditing(product)}>Sửa</button>
                        <button onClick={() => archiveProduct(product)}>
                          Lưu trữ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="commerce-empty">
              <span>＋</span>
              <h2>Chưa có sản phẩm</h2>
              <p>Thêm sản phẩm đầu tiên cho cửa hàng.</p>
            </div>
          )}
          {editing !== undefined && (
            <div
              className="modal-backdrop"
              onClick={() => setEditing(undefined)}
            >
              <section
                className="dashboard-modal"
                role="dialog"
                aria-modal="true"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  className="modal-close"
                  onClick={() => setEditing(undefined)}
                  aria-label="Đóng"
                >
                  ×
                </button>
                <h2>{editing ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm"}</h2>
                <ProductForm
                  key={editing?._id || "new"}
                  product={editing || undefined}
                  onSaved={async () => {
                    setEditing(undefined);
                    await loadSellerData();
                    onFeedback(
                      "success",
                      "Đã lưu sản phẩm. Sản phẩm mới sẽ chờ admin duyệt.",
                    );
                  }}
                />
              </section>
            </div>
          )}
        </>
      )}
    </main>
  );
}
