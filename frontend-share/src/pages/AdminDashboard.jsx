import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllShares, approveShare } from "../services/api";
import "./Dashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();

  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadShares = async () => {
    try {
      const res = await getAllShares();
      setShares(res.data);
    } catch (err) {
      console.error("Failed to load shares", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShares();
  }, []);

  const handleApprove = async (id) => {
    try {
      setMessage("");
      await approveShare(id);
      setMessage("✅ Share approved successfully.");
      loadShares();
    } catch (err) {
      setMessage(err.response?.data || "Failed to approve share.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const approved = shares.filter((s) => s.approved);
  const pending = shares.filter((s) => !s.approved);

  return (
    <div className="dashboard-layout">

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo">ShareBazar</div>
          <span className="role-tag admin">Admin</span>
        </div>

        <nav>
          <button className="nav-item active">
            <span className="nav-icon">📊</span> Dashboard
          </button>
          <button className="nav-item">
            <span className="nav-icon">🏢</span> Companies
          </button>
          <button className="nav-item">
            <span className="nav-icon">📈</span> Market
          </button>
          <button className="nav-item">
            <span className="nav-icon">👥</span> Users
          </button>
          <button className="nav-item">
            <span className="nav-icon">⚙️</span> Settings
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={handleLogout}>
            <span className="nav-icon">🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="dashboard-main">

        {/* Header */}
        <div className="dash-header">
          <div>
            <p className="greeting">📈 ShareBazar Control Panel</p>
            <h2>Admin Dashboard</h2>
          </div>
          <span className="dash-date">
            🗓{" "}
            {new Date().toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Ticker Bar */}
        <div className="ticker-bar">
          <div className="ticker-item">
            <span className="ticker-symbol">NIFTY 50</span>
            <span className="ticker-up">▲ 22,450.50</span>
            <span className="ticker-sep">│</span>
          </div>
          <div className="ticker-item">
            <span className="ticker-symbol">SENSEX</span>
            <span className="ticker-up">▲ 73,890.25</span>
            <span className="ticker-sep">│</span>
          </div>
          <div className="ticker-item">
            <span className="ticker-symbol">BANKNIFTY</span>
            <span className="ticker-down">▼ 48,120.00</span>
            <span className="ticker-sep">│</span>
          </div>
          <div className="ticker-item">
            <span className="ticker-symbol">PLATFORM</span>
            <span style={{ color: "#a7f3d0" }}>🟢 Live</span>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">📋</span>
            <p className="stat-label">Total Shares</p>
            <p className="stat-value blue">
              {loading ? "—" : shares.length}
            </p>
            <p className="stat-change">All submissions</p>
          </div>
          <div className="stat-card">
            <span className="stat-icon">✅</span>
            <p className="stat-label">Approved</p>
            <p className="stat-value green">
              {loading ? "—" : approved.length}
            </p>
            <p className="stat-change">Live on market</p>
          </div>
          <div className="stat-card">
            <span className="stat-icon">⏳</span>
            <p className="stat-label">Pending Approval</p>
            <p className="stat-value amber">
              {loading ? "—" : pending.length}
            </p>
            <p className="stat-change">Awaiting review</p>
          </div>
          <div className="stat-card">
            <span className="stat-icon">💹</span>
            <p className="stat-label">Approval Rate</p>
            <p className="stat-value green">
              {loading || shares.length === 0
                ? "—"
                : `${Math.round((approved.length / shares.length) * 100)}%`}
            </p>
            <p className="stat-change">Overall ratio</p>
          </div>
        </div>

        {/* Share Approval */}
        <div className="dash-section">
          <div className="section-header">
            <h3>Share Approvals</h3>
            {pending.length > 0 && (
              <span className="section-badge">
                {pending.length} pending
              </span>
            )}
          </div>
          <div className="section-body">
            {message && (
              <p
                className={`dash-message ${
                  message.startsWith("✅") ? "success" : "error"
                }`}
                style={{ marginBottom: "16px" }}
              >
                {message}
              </p>
            )}
            {loading ? (
              <div className="empty-state">Loading shares...</div>
            ) : shares.length === 0 ? (
              <div className="empty-state">
                📋
                <br />
                No shares submitted yet.
              </div>
            ) : (
              <div className="shares-list">
                {shares.map((s) => (
                  <div key={s.id} className="share-row">
                    <span className="share-name">{s.companyName}</span>
                    <span className="share-price">₹{s.price}</span>
                    <span
                      className={`share-status ${
                        s.approved ? "approved" : "pending"
                      }`}
                    >
                      {s.approved ? "✓ Approved" : "⏳ Pending"}
                    </span>
                    {!s.approved && (
                      <button
                        className="btn btn-green share-approve-btn"
                        onClick={() => handleApprove(s.id)}
                      >
                        ✓ Approve
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Company Management */}
        <div className="dash-section">
          <div className="section-header">
            <h3>Company Management</h3>
          </div>
          <div className="section-body">
            <p
              style={{
                color: "var(--gray-500)",
                fontSize: "0.84rem",
                marginBottom: "20px",
              }}
            >
              Create and manage company accounts on the platform.
            </p>
            <div className="btn-group">
              <button className="btn btn-green">+ Create Company</button>
              <button className="btn btn-outline">View All Companies</button>
            </div>
          </div>
        </div>

        {/* User Management */}
        <div className="dash-section">
          <div className="section-header">
            <h3>User Management</h3>
          </div>
          <div className="section-body">
            <p
              style={{
                color: "var(--gray-500)",
                fontSize: "0.84rem",
                marginBottom: "20px",
              }}
            >
              View and manage registered user accounts.
            </p>
            <div className="btn-group">
              <button className="btn btn-outline">View All Users</button>
              <button className="btn btn-outline">Export Report</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;