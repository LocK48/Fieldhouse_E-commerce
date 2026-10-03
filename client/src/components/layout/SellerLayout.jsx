import { NavLink } from "react-router-dom";
import { ROUTES } from "../../routes/paths";
import "./RoleLayouts.css";

export default function SellerLayout({ children, user }) {
  return (
    <div className="role-layout seller-layout">
      <aside className="role-sidebar">
        <div className="role-brand">
          <span className="brand-mark">F</span>
          <span>
            <small>FIELDHOUSE</small>
            <strong>Seller studio</strong>
          </span>
        </div>
        <p className="role-caption">KÊNH NGƯỜI BÁN</p>
        <nav>
          <NavLink end to={ROUTES.SELLER}>
            Tổng quan <span>↗</span>
          </NavLink>
          <NavLink to={ROUTES.SELLER_MESSAGES}>
            Tin nhắn <span>✳</span>
          </NavLink>
          <NavLink to={ROUTES.PROFILE}>
            Hồ sơ cá nhân <span>○</span>
          </NavLink>
        </nav>
        <div className="role-sidebar-user">
          <span>{user?.name?.slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{user?.name}</strong>
            <small>Người bán</small>
          </div>
        </div>
      </aside>
      <div className="role-content">{children}</div>
    </div>
  );
}
