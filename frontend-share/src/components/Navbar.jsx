import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

const ROLE_LABELS = {
  USER:    { label: "Investor",  icon: "👤" },
  COMPANY: { label: "Company",   icon: "🏢" },
  ADMIN:   { label: "Admin",     icon: "👑" },
};

const ROLE_DASH = {
  USER:    "/user",
  COMPANY: "/company",
  ADMIN:   "/admin",
};

function Navbar() {
  const navigate  = useNavigate();
  const role      = localStorage.getItem("role");
  const username  = localStorage.getItem("username");
  const roleInfo  = ROLE_LABELS[role] || null;

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <nav className="navbar">

      {/* Brand */}
      <Link to={role ? ROLE_DASH[role] : "/"} className="navbar-brand">
        <span className="brand-icon">📈</span>
        ShareBazar
        <span className="dot" />
      </Link>

      {/* Links */}
      <div className="navbar-links">
        {!role && (
          <>
            <Link to="/" className="nav-link">Market</Link>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/signup" className="cta">Get Started</Link>
          </>
        )}

        {role && roleInfo && (
          <>
            <Link to={ROLE_DASH[role]} className="nav-link">
              Dashboard
            </Link>

            <div className="navbar-divider" />

            <div className="navbar-user">
              <span className="navbar-user-icon">{roleInfo.icon}</span>
              <div className="navbar-user-info">
                {username && (
                  <span className="navbar-username">{username}</span>
                )}
                <span className={`navbar-role-tag ${role.toLowerCase()}`}>
                  {roleInfo.label}
                </span>
              </div>
            </div>

            <button className="navbar-logout" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;