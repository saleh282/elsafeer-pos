import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const linkStyle = ({ isActive }) => ({
    padding: "10px 14px",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    color: isActive ? "#fff" : "var(--color-text)",
    background: isActive ? "var(--color-primary)" : "transparent",
  });

  return (
    <nav
      className="app-navbar flex items-center justify-between"
      style={{
        padding: "12px 20px",
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        position: "sticky",
        top: 0,
        zIndex: 10,
        flexWrap: "wrap",
        gap: 10,
      }}
    >
      <div className="flex items-center gap-16" style={{ flexWrap: "wrap" }}>
        <NavLink to="/dashboard" className="brand-logo" aria-label="حلواني السفير">
          <img src="/logo.jpg" alt="حلواني السفير" />
          <strong>السفير</strong>
        </NavLink>
        <NavLink to="/dashboard" style={linkStyle}>
          الرئيسية
        </NavLink>
        {user?.role === "cashier" && (
          <NavLink to="/pos" style={linkStyle}>
            الكاشير
          </NavLink>
        )}
        <NavLink to="/sales" style={linkStyle}>
          سجل المبيعات
        </NavLink>
        <NavLink to="/reports" style={linkStyle}>
          التقارير
        </NavLink>
      </div>
      <div className="flex items-center gap-12">
        <div style={{ textAlign: "left" }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{user?.name}</div>
          <div className="text-muted" style={{ fontSize: 12 }}>
            {user?.role === "owner" ? "مالك" : user?.branchName}
          </div>
        </div>
        <button className="btn-outline btn-sm" onClick={handleLogout}>
          خروج
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
