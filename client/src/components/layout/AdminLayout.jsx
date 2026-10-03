import { NavLink } from "react-router-dom";
import { ROUTES } from "../../routes/paths";
import "./RoleLayouts.css";

export default function AdminLayout({ children, user }) {
  return (
    <div className="role-layout admin-layout">
      <aside className="role-sidebar">
        <div className="role-brand">
          <span className="admin-brand-mark">F</span>
          <span>
            <small>FIELDHOUSE</small>
            <strong>Control room</strong>
          </span>
        </div>
        <p className="role-caption">QUẢN TRỊ HỆ THỐNG</p>
        <nav>
          <NavLink end to={ROUTES.ADMIN}>
            Tổng quan <span>↗</span>
          </NavLink>
          <NavLink to={ROUTES.ADMIN_MESSAGES}>
            Hỗ trợ khách hàng <span>✳</span>
          </NavLink>
          <NavLink to={ROUTES.PROFILE}>
            Hồ sơ cá nhân <span>○</span>
          </NavLink>
        </nav>
        <div className="role-sidebar-user">
          <span>{user?.name?.slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{user?.name}</strong>
            <small>Quản trị viên</small>
          </div>
        </div>
      </aside>
      <div className="role-content">{children}</div>
    </div>
  );
}
