import { useState } from 'react'

export default function AuthDialog({ onClose, onSubmit }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try { await onSubmit(mode, form) }
    catch (reason) { setError(reason.response?.data?.message || reason.message || 'Không thể xác thực tài khoản.') }
    finally { setBusy(false) }
  }

  return <div className="modal-backdrop auth-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button className="modal-close" onClick={onClose} aria-label="Đóng">×</button><span className="brand-mark auth-mark">F</span><p className="eyebrow">FIELDHOUSE MEMBERS</p><h2 id="auth-title">{mode === 'login' ? 'Chào mừng trở lại.' : 'Bắt đầu hành trình.'}</h2><p className="auth-subtitle">{mode === 'login' ? 'Đăng nhập để tiếp tục mua sắm và theo dõi đơn hàng.' : 'Tạo tài khoản để lưu giỏ hàng và cập nhật đơn hàng.'}</p>
    <form onSubmit={submit} className="auth-form">{mode === 'register' && <label>Họ và tên<input autoComplete="name" required minLength={2} maxLength={100} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })}/></label>}<label>Email<input autoComplete="email" type="email" required maxLength={254} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })}/></label><label>Mật khẩu<input autoComplete={mode === 'login' ? 'current-password' : 'new-password'} type="password" required minLength={8} maxLength={128} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })}/></label>{error && <p className="auth-error" role="alert">{error}</p>}<button className="primary-button full-button" disabled={busy}>{busy ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'} <span>↗</span></button></form>
    <p className="auth-switch">{mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'} <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>{mode === 'login' ? 'Đăng ký' : 'Đăng nhập'}</button></p>
  </section></div>
}
