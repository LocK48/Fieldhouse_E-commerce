import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  requestRegistrationOtp,
  verifyRegistrationOtp,
} from "../../api/auth.api";
import { useFeedback } from "../../components/common/FeedbackContext";
import { ROUTES } from "../../routes/paths";
import AuthPageLayout from "./AuthPageLayout";

export default function RegisterPage({ onVerified }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useFeedback();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [code, setCode] = useState("");
  const [step, setStep] = useState("details");
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = window.setTimeout(
      () => setCooldown((value) => value - 1),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function sendCode(event) {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận chưa khớp.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await requestRegistrationOtp({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      setStep("verify");
      setCooldown(result.resendAfterSeconds || 60);
      showToast("Mã xác thực đã được gửi đến email của bạn.", "success");
    } catch (reason) {
      setError(
        reason.response?.data?.message ||
          reason.message ||
          "Không gửi được mã xác thực.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await verifyRegistrationOtp(form.email, code);
      showToast("Email đã được xác thực. Đang đăng nhập…", "success");
      try {
        await onVerified({ email: form.email, password: form.password });
      } catch {
        showToast("Tài khoản đã tạo. Vui lòng đăng nhập để tiếp tục.", "error");
        navigate(ROUTES.LOGIN, { state: { email: form.email } });
      }
    } catch (reason) {
      setError(
        reason.response?.data?.message ||
          reason.message ||
          "Không thể xác thực mã OTP.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthPageLayout
      eyebrow={step === "verify" ? "XÁC THỰC EMAIL" : "THAM GIA FIELDHOUSE"}
      title={
        step === "verify" ? (
          <>
            Kiểm tra
            <br />
            hộp thư nhé.
          </>
        ) : (
          <>
            Tạo tài khoản
            <br />
            của bạn.
          </>
        )
      }
      description={
        step === "verify" ? (
          <>
            Nhập mã 6 chữ số đã gửi tới <strong>{form.email}</strong>.
          </>
        ) : (
          "Lưu sản phẩm yêu thích, đặt hàng nhanh và theo dõi hành trình mua sắm."
        )
      }
    >
      {step === "details" ? (
        <form className="auth-page-form" onSubmit={sendCode}>
          <label>
            Họ và tên
            <input
              autoComplete="name"
              required
              minLength={2}
              maxLength={100}
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              placeholder="Tên của bạn"
            />
          </label>
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
              placeholder="ban@email.com"
            />
          </label>
          <label>
            Mật khẩu
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              value={form.password}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
              placeholder="Tối thiểu 8 ký tự"
            />
          </label>
          <label>
            Xác nhận mật khẩu
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              value={form.confirmPassword}
              onChange={(event) =>
                setForm({ ...form, confirmPassword: event.target.value })
              }
              placeholder="Nhập lại mật khẩu"
            />
          </label>
          {error && (
            <p className="auth-page-error" role="alert">
              {error}
            </p>
          )}
          <button className="auth-page-submit" disabled={busy}>
            {busy ? "Đang gửi mã…" : "Gửi mã xác thực"}
            <span>↗</span>
          </button>
        </form>
      ) : (
        <form className="auth-page-form" onSubmit={verifyCode}>
          <label>
            Mã OTP
            <input
              className="auth-otp-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
            />
          </label>
          {error && (
            <p className="auth-page-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="auth-page-submit"
            disabled={busy || code.length !== 6}
          >
            {busy ? "Đang xác thực…" : "Xác thực và tạo tài khoản"}
            <span>↗</span>
          </button>
          <button
            className="auth-resend"
            type="button"
            disabled={busy || cooldown > 0}
            onClick={sendCode}
          >
            {cooldown > 0
              ? `Gửi lại mã sau ${cooldown}s`
              : "Gửi lại mã xác thực"}
          </button>
        </form>
      )}
      <p className="auth-page-switch">
        {step === "verify" ? "Bạn nhập sai email?" : "Đã có tài khoản?"}{" "}
        <Link
          to={ROUTES.LOGIN}
          state={{ ...(location.state || {}), email: form.email }}
        >
          Đăng nhập
        </Link>
      </p>
      {step === "verify" && (
        <button
          className="auth-back-link auth-step-back"
          onClick={() => {
            setStep("details");
            setCode("");
            setError("");
          }}
        >
          ← Sửa thông tin đăng ký
        </button>
      )}
      {step === "details" && (
        <Link className="auth-back-link" to={ROUTES.HOME}>
          ← Quay lại cửa hàng
        </Link>
      )}
    </AuthPageLayout>
  );
}
