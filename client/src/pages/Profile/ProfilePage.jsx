import { useEffect, useState } from "react";
import {
  createAddress,
  deleteAddress,
  getAddresses,
  updateAddress,
} from "../../api/address.api";
import { changePassword, updateProfile } from "../../api/user.api";
import { useFeedback } from "../../components/common/FeedbackContext";

const emptyAddress = {
  recipientName: "",
  phone: "",
  addressLine: "",
  ward: "",
  district: "",
  city: "",
  country: "Vietnam",
  isDefault: false,
};
const addressFields = [
  ["recipientName", "Người nhận"],
  ["phone", "Số điện thoại"],
  ["addressLine", "Địa chỉ"],
  ["ward", "Phường / xã"],
  ["district", "Quận / huyện"],
  ["city", "Tỉnh / thành phố"],
];

export default function ProfilePage({ user, onUserChange, onFeedback }) {
  const { confirm } = useFeedback();
  const [name, setName] = useState(user.name || "");
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [editingId, setEditingId] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function reloadAddresses() {
    setAddresses(await getAddresses());
  }
  useEffect(() => {
    getAddresses()
      .then(setAddresses)
      .catch((reason) =>
        setError(reason.message || "Không tải được sổ địa chỉ."),
      )
      .finally(() => setLoading(false));
  }, []);

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const nextUser = await updateProfile({ name: name.trim() });
      onUserChange(nextUser);
      onFeedback("success", "Đã cập nhật hồ sơ.");
    } catch (reason) {
      setError(
        reason.response?.data?.message ||
          reason.message ||
          "Không thể cập nhật hồ sơ.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await changePassword(passwordForm);
      setPasswordForm({ currentPassword: "", newPassword: "" });
      onFeedback("success", "Đã đổi mật khẩu.");
    } catch (reason) {
      setError(
        reason.response?.data?.message ||
          reason.message ||
          "Không thể đổi mật khẩu.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveAddress(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editingId) await updateAddress(editingId, addressForm);
      else await createAddress(addressForm);
      await reloadAddresses();
      setAddressForm(emptyAddress);
      setEditingId("");
      onFeedback("success", "Đã lưu địa chỉ.");
    } catch (reason) {
      setError(
        reason.response?.data?.message ||
          reason.message ||
          "Không thể lưu địa chỉ.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeAddress(address) {
    const accepted = await confirm({
      title: "Xóa địa chỉ?",
      description: `Địa chỉ của ${address.recipientName} sẽ bị xóa khỏi sổ địa chỉ.`,
      confirmLabel: "Xóa địa chỉ",
    });
    if (!accepted) return;
    try {
      await deleteAddress(address._id);
      await reloadAddresses();
    } catch (reason) {
      setError(
        reason.response?.data?.message ||
          reason.message ||
          "Không thể xóa địa chỉ.",
      );
    }
  }

  async function makeDefault(address) {
    try {
      await updateAddress(address._id, { isDefault: true });
      await reloadAddresses();
    } catch (reason) {
      setError(
        reason.response?.data?.message ||
          reason.message ||
          "Không thể đặt địa chỉ mặc định.",
      );
    }
  }

  return (
    <main className="commerce-page profile-page">
      <header className="page-heading">
        <p className="eyebrow">TÀI KHOẢN FIELDHOUSE</p>
        <h1>
          Hồ sơ <em>của bạn.</em>
        </h1>
        <p>Thông tin cá nhân, mật khẩu và sổ địa chỉ giao hàng.</p>
      </header>
      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}
      <div className="profile-grid">
        <section className="dashboard-panel">
          <h2>Thông tin cá nhân</h2>
          <form className="product-form dashboard-form" onSubmit={saveProfile}>
            <label>
              Họ và tên
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={100}
              />
            </label>
            <label>
              Email
              <input value={user.email} disabled />
            </label>
            <button disabled={saving}>Lưu hồ sơ</button>
          </form>
        </section>
        <section className="dashboard-panel">
          <h2>Đổi mật khẩu</h2>
          <form className="product-form dashboard-form" onSubmit={savePassword}>
            <label>
              Mật khẩu hiện tại
              <input
                type="password"
                autoComplete="current-password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    currentPassword: e.target.value,
                  })
                }
                required
              />
            </label>
            <label>
              Mật khẩu mới
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value,
                  })
                }
                required
              />
            </label>
            <button disabled={saving}>Đổi mật khẩu</button>
          </form>
        </section>
      </div>
      <section className="dashboard-panel address-section">
        <div className="dashboard-toolbar">
          <h2>
            Sổ địa chỉ <span>{addresses.length}</span>
          </h2>
        </div>
        {loading ? (
          <div className="skeleton dashboard-skeleton" />
        ) : (
          <div className="address-list">
            {addresses.map((address) => (
              <article className="address-card" key={address._id}>
                <div>
                  <strong>{address.recipientName}</strong>
                  {address.isDefault && (
                    <span className="dashboard-status status-active">
                      Mặc định
                    </span>
                  )}
                  <p>{address.phone}</p>
                  <p>
                    {address.addressLine}, {address.ward}, {address.district},{" "}
                    {address.city}
                  </p>
                </div>
                <div className="dashboard-actions">
                  {!address.isDefault && (
                    <button onClick={() => makeDefault(address)}>
                      Đặt mặc định
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditingId(address._id);
                      setAddressForm({ ...emptyAddress, ...address });
                    }}
                  >
                    Sửa
                  </button>
                  <button onClick={() => removeAddress(address)}>Xóa</button>
                </div>
              </article>
            ))}
          </div>
        )}
        <form
          className="product-form dashboard-form address-form"
          onSubmit={saveAddress}
        >
          <h3>{editingId ? "Cập nhật địa chỉ" : "Thêm địa chỉ"}</h3>
          <div className="form-grid">
            {addressFields.map(([field, label]) => (
              <label
                className={field === "addressLine" ? "field-wide" : ""}
                key={field}
              >
                {label}
                <input
                  value={addressForm[field]}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, [field]: e.target.value })
                  }
                  required
                  maxLength={field === "addressLine" ? 250 : 100}
                />
              </label>
            ))}
          </div>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={addressForm.isDefault}
              onChange={(e) =>
                setAddressForm({ ...addressForm, isDefault: e.target.checked })
              }
            />{" "}
            Đặt làm địa chỉ mặc định
          </label>
          <div className="dashboard-actions">
            <button disabled={saving}>
              {editingId ? "Lưu địa chỉ" : "Thêm địa chỉ"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId("");
                  setAddressForm(emptyAddress);
                }}
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}
