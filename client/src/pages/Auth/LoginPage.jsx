import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AuthPageLayout from "./AuthPageLayout";
import { ROUTES } from "../../routes/paths";

export default function LoginPage({ onLogin }) {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onLogin({ email, password });
    } catch (reason) {
      setError(
        reason.response?.data?.message ||
          reason.message ||
          "Không thể đăng nhập. Vui lòng thử lại.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthPageLayout
      eyebrow="CHÀO MỪNG TRỞ LẠI"
      title={
        <>
          Đăng nhập
          <br />
          vào tài khoản.
        </>
      }
      description="Tiếp tục mua sắm và theo dõi những đơn hàng của bạn."
    >
      <form className="auth-page-form" onSubmit={submit}>
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="ban@email.com"
          />
        </label>
        <label>
          Mật khẩu
          <input
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            maxLength={128}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Nhập mật khẩu"
          />
        </label>
        {error && (
          <p className="auth-page-error" role="alert">
            {error}
          </p>
        )}
        <button className="auth-page-submit" disabled={busy}>
          {busy ? "Đang đăng nhập…" : "Đăng nhập"}
          <span>↗</span>
        </button>
      </form>
      <p className="auth-page-switch">
        Chưa có tài khoản?{" "}
        <Link to={ROUTES.REGISTER} state={location.state}>
          Tạo tài khoản
        </Link>
      </p>
      <Link className="auth-back-link" to={ROUTES.HOME}>
        ← Quay lại cửa hàng
      </Link>
    </AuthPageLayout>
  );
}
