import { Link } from "react-router-dom";
import { ROUTES } from "../../routes/paths";
import "./AuthPages.css";

export default function AuthPageLayout({
  eyebrow,
  title,
  description,
  children,
}) {
  return (
    <main className="auth-page">
      <aside className="auth-visual">
        <Link className="auth-visual-brand" to={ROUTES.HOME}>
          <span>F</span> fieldhouse<span className="brand-dot">.</span>
        </Link>
        <div className="auth-visual-copy">
          <span className="auth-orbit auth-orbit-one" />
          <span className="auth-orbit auth-orbit-two" />
          <p>BUILT FOR THE LOVE OF THE GAME</p>
          <h2>
            Move with
            <br />
            <em>your own</em> rhythm.
          </h2>
          <span className="auth-visual-line" />
          <small>Khám phá những lựa chọn phù hợp với nhịp sống của bạn.</small>
        </div>
        <p className="auth-visual-footer">FIELDHOUSE · EVERYDAY, IN MOTION</p>
      </aside>
      <section className="auth-panel">
        <div className="auth-panel-content">
          <Link className="auth-mobile-brand" to={ROUTES.HOME}>
            fieldhouse<span>.</span>
          </Link>
          <p className="auth-page-eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="auth-page-description">{description}</p>
          {children}
        </div>
      </section>
    </main>
  );
}
