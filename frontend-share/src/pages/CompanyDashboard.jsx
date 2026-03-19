import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createShare, getCompanyShares, getApprovedShares } from "../services/api";
import "./Dashboard.css";

// ── Price Chart (same as UserDashboard) ──────────────────────────────────
function PriceChart({ history }) {
  if (!history || history.length < 2) {
    return (
      <div className="chart-empty">
        Collecting price data... ({history?.length || 0} / 2 points needed)
      </div>
    );
  }
  const W = 520, H = 200, PAD = 16;
  const prices = history.map((h) => h.price);
  const times  = history.map((h) => h.time);
  const minP   = Math.min(...prices);
  const maxP   = Math.max(...prices);
  const range  = maxP - minP || 1;
  const toX    = (i) => PAD + (i / (prices.length - 1)) * (W - PAD * 2);
  const toY    = (p) => PAD + ((maxP - p) / range) * (H - PAD * 2);

  const linePath = prices.map((p, i) => {
    if (i === 0) return `M ${toX(i).toFixed(1)} ${toY(p).toFixed(1)}`;
    const cpX = ((toX(i) + toX(i - 1)) / 2).toFixed(1);
    return `C ${cpX} ${toY(prices[i - 1]).toFixed(1)}, ${cpX} ${toY(p).toFixed(1)}, ${toX(i).toFixed(1)} ${toY(p).toFixed(1)}`;
  }).join(" ");

  const fillPath = `${linePath} L ${toX(prices.length - 1).toFixed(1)} ${H - PAD} L ${toX(0).toFixed(1)} ${H - PAD} Z`;
  const isUp     = prices[prices.length - 1] >= prices[0];
  const color    = isUp ? "#00e676" : "#ff5252";
  const fillClr  = isUp ? "rgba(0,230,118,0.08)" : "rgba(255,82,82,0.08)";
  const yLabels  = [maxP, minP + range / 2, minP];
  const xLabels  = [
    { i: 0,                             label: times[0] },
    { i: Math.floor(prices.length / 2), label: times[Math.floor(prices.length / 2)] },
    { i: prices.length - 1,             label: times[prices.length - 1] },
  ];

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="price-svg" preserveAspectRatio="none">
        {[0, 1, 2].map((i) => {
          const y = PAD + (i / 2) * (H - PAD * 2);
          return <line key={i} x1={PAD} y1={y} x2={W - PAD} y2={y}
            stroke="#1e2d3d" strokeWidth="1" strokeDasharray="4 4" />;
        })}
        <path d={fillPath} fill={fillClr} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2"
          strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={toX(prices.length - 1)} cy={toY(prices[prices.length - 1])} r="4" fill={color} />
        <circle cx={toX(prices.length - 1)} cy={toY(prices[prices.length - 1])} r="8" fill={color} opacity="0.2">
          <animate attributeName="r" values="4;10;4" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
      <div className="chart-y-labels">
        {yLabels.map((p, i) => (
          <span key={i}>₹{Number(p).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
        ))}
      </div>
      <div className="chart-x-labels">
        {xLabels.map(({ i, label }) => <span key={i}>{label}</span>)}
      </div>
    </div>
  );
}

function CompanyDashboard() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  const [price, setPrice]           = useState("");
  const [companyName, setCompanyName] = useState("");
  const [volume, setVolume]         = useState(100);
  const [shares, setShares]         = useState([]);
  const [loading, setLoading]       = useState(false);
  const [message, setMessage]       = useState("");

  // Chart state — track live prices for company's own shares
  const [selectedId, setSelectedId] = useState(null);
  const [liveShares, setLiveShares] = useState([]);
  const historyRef                  = useRef({});
  const prevRef                     = useRef({});
  const pollRef                     = useRef(null);

  const loadShares = async () => {
    try {
      const res = await getCompanyShares(username);
      setShares(res.data);
    } catch (err) {
      console.error("Failed to load shares", err);
    }
  };

  // Poll approved shares to build price history for company's own shares
  const loadLivePrices = async () => {
    try {
      const res = await getApprovedShares();
      const all = res.data;
      const now = new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", second: "2-digit"
      });

      all.forEach((s) => {
        if (!historyRef.current[s.id]) historyRef.current[s.id] = [];
        const hist = historyRef.current[s.id];
        const prev = prevRef.current[s.id];
        if (hist.length === 0 || hist[hist.length - 1].price !== s.price) {
          hist.push({ price: s.price, time: now });
          if (hist.length > 60) hist.shift();
        }
        prevRef.current[s.id] = s.price;
      });

      setLiveShares(all);
    } catch (err) {
      console.error("Failed to load live prices", err);
    }
  };

  useEffect(() => {
    loadShares();
    loadLivePrices();
    pollRef.current = setInterval(loadLivePrices, 3000);
    return () => clearInterval(pollRef.current);
  }, []);

  const handleCreate = async () => {
    if (!companyName || !price) {
      setMessage("Please fill in all fields.");
      return;
    }
    if (volume < 1 || volume > 1000) {
      setMessage("Volume must be between 1 and 1000.");
      return;
    }
    try {
      setLoading(true);
      setMessage("");
      await createShare({ companyName, price: parseFloat(price), totalVolume: parseInt(volume) }, username);
      setMessage("✅ Share created — pending approval.");
      setCompanyName("");
      setPrice("");
      setVolume(100);
      loadShares();
    } catch (err) {
      setMessage(err.response?.data || "Failed to create share.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const approved   = shares.filter((s) => s.approved);
  const pending    = shares.filter((s) => !s.approved);
  const totalValue = approved.reduce((sum, s) => sum + Number(s.price), 0);
  const getTicker  = (name) => name.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase();

  return (
    <div className="dashboard-layout">

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo">ShareBazar</div>
          <span className="role-tag company">Company</span>
        </div>
        <nav>
          <button className="nav-item active">
            <span className="nav-icon">🏢</span> Dashboard
          </button>
          <button className="nav-item">
            <span className="nav-icon">📈</span> My Stocks
          </button>
          <button className="nav-item">
            <span className="nav-icon">💹</span> Create Share
          </button>
          <button className="nav-item">
            <span className="nav-icon">📊</span> Analytics
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
            <p className="greeting">🏢 Company Portal</p>
            <h2>Welcome back, <span style={{ color: "var(--accent)" }}>{username || "Company"}</span></h2>
          </div>
          <span className="dash-date">
            🗓 {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">📋</span>
            <p className="stat-label">Total Shares</p>
            <p className="stat-value blue">{shares.length || "—"}</p>
            <p className="stat-change">All submissions</p>
          </div>
          <div className="stat-card">
            <span className="stat-icon">✅</span>
            <p className="stat-label">Approved</p>
            <p className="stat-value green">{approved.length || "—"}</p>
            <p className="stat-change">Active listings</p>
          </div>
          <div className="stat-card">
            <span className="stat-icon">⏳</span>
            <p className="stat-label">Pending</p>
            <p className="stat-value amber">{pending.length || "—"}</p>
            <p className="stat-change">Awaiting approval</p>
          </div>
          <div className="stat-card">
            <span className="stat-icon">💰</span>
            <p className="stat-label">Total Value</p>
            <p className="stat-value green">{totalValue > 0 ? `₹${totalValue.toLocaleString()}` : "—"}</p>
            <p className="stat-change">Approved shares value</p>
          </div>
        </div>

        {/* Create Share */}
        <div className="dash-section">
          <div className="section-header">
            <h3>Create New Share</h3>
          </div>
          <div className="section-body">
            <p style={{ color: "var(--text-muted)", fontSize: "0.84rem", marginBottom: "18px" }}>
              Submit a new share listing for admin approval. Set your price and total volume (max 1000 shares).
            </p>
            <div className="form-row">
              <input className="dash-input" placeholder="Company Name"
                value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              <input className="dash-input" placeholder="Price (₹)" value={price}
                type="number" min="1" onChange={(e) => setPrice(e.target.value)} />
              <input className="dash-input" placeholder="Total Shares (max 1000)"
                value={volume} type="number" min="1" max="1000"
                onChange={(e) => setVolume(Math.min(1000, Math.max(1, parseInt(e.target.value) || 1)))} />
              <button className="btn btn-blue" onClick={handleCreate} disabled={loading}>
                {loading ? "Submitting..." : "📈 Create Share"}
              </button>
            </div>
            <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 8 }}>
              Volume: {volume} shares · Est. market cap: ₹{(parseFloat(price || 0) * volume).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </p>
            {message && (
              <p className={`dash-message ${message.startsWith("✅") ? "success" : "error"}`}>{message}</p>
            )}
          </div>
        </div>

        {/* My Shares with chart */}
        <div className="dash-section">
          <div className="section-header">
            <h3>My Shares</h3>
            {shares.length > 0 && <span className="section-badge">{shares.length} total</span>}
          </div>
          <div className="section-body no-pad">
            {shares.length === 0 ? (
              <div className="empty-state">📋<br />No shares submitted yet. Create your first share above.</div>
            ) : (
              <table className="user-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Ticker</th>
                    <th>Price</th>
                    <th>Volume</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {shares.map((s) => {
                    const live       = liveShares.find((l) => l.companyName === s.companyName);
                    const livePrice  = live ? live.price : s.price;
                    const isSelected = selectedId === s.id;
                    const hist       = historyRef.current[live?.id] || [];
                    const first      = hist[0]?.price;
                    const last       = hist[hist.length - 1]?.price;
                    const totalDiff  = hist.length >= 2 ? last - first : null;
                    const totalPct   = totalDiff != null && first > 0
                      ? ((totalDiff / first) * 100).toFixed(2) : null;
                    const soldPct    = s.totalVolume > 0
                      ? Math.round(((s.totalVolume - (s.availableVolume ?? s.totalVolume)) / s.totalVolume) * 100)
                      : 0;

                    return (
                      <>
                        <tr key={s.id}
                          className={`clickable-row ${isSelected ? "row-selected" : ""} ${s.approved ? "" : ""}`}
                          onClick={() => s.approved && setSelectedId(isSelected ? null : s.id)}>
                          <td>
                            <span className="stock-name-cell">
                              {s.companyName}
                              {s.approved && <span className="expand-hint">{isSelected ? " ▲" : " ▼"}</span>}
                            </span>
                          </td>
                          <td><span className="stock-ticker">{getTicker(s.companyName)}</span></td>
                          <td className="price-up-text">
                            ₹{Number(livePrice).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                          </td>
                          <td>
                            <div className="volume-info">
                              <span className="volume-text">
                                {s.availableVolume ?? s.totalVolume}/{s.totalVolume}
                              </span>
                              <div className="volume-bar">
                                <div className="volume-bar-fill" style={{ width: `${soldPct}%` }} />
                              </div>
                              <span className="volume-sold">{soldPct}% sold</span>
                            </div>
                          </td>
                          <td>
                            <span className={`share-status ${s.approved ? "approved" : "pending"}`}>
                              {s.approved ? "✓ Approved" : "⏳ Pending"}
                            </span>
                          </td>
                        </tr>

                        {/* Inline chart row — only for approved shares */}
                        {isSelected && s.approved && (
                          <tr key={`chart-${s.id}`} className="chart-row">
                            <td colSpan="5">
                              <div className="chart-panel">
                                <div className="chart-panel-header">
                                  <div className="chart-title-group">
                                    <span className="chart-company">{s.companyName}</span>
                                    <span className="chart-ticker-tag">{getTicker(s.companyName)}</span>
                                  </div>
                                  <div className="chart-price-group">
                                    <span className="chart-current-price">
                                      ₹{Number(livePrice).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                                    </span>
                                    {totalPct !== null && (
                                      <span className={`chart-delta ${totalDiff >= 0 ? "up" : "down"}`}>
                                        {totalDiff >= 0 ? "▲ +" : "▼ "}
                                        {Math.abs(totalDiff).toFixed(2)} ({totalPct}%)
                                        <span className="chart-delta-label"> session</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <PriceChart history={hist} />
                                <p className="chart-note">
                                  {hist.length} data points · last 60 updates · refreshes every 3s
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Analytics placeholder */}
        <div className="dash-section">
          <div className="section-header">
            <h3>Performance Analytics</h3>
          </div>
          <div className="section-body">
            <p style={{ color: "var(--text-muted)", fontSize: "0.84rem", marginBottom: "20px" }}>
              Track stock performance, trading volume, and shareholder activity.
            </p>
            <div className="btn-group">
              <button className="btn btn-blue">📊 View Analytics</button>
              <button className="btn btn-outline">Export Data</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CompanyDashboard;