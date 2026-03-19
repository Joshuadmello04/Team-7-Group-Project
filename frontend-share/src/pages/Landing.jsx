import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getApprovedShares } from "../services/api";
import "./Landing.css";

function getTicker(name) {
  return name.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase();
}

// ── Smooth SVG chart ──────────────────────────────────────────────────────
function PriceChart({ history }) {
  if (!history || history.length < 2) {
    return (
      <div className="chart-empty">
        <span className="chart-empty-icon">📊</span>
        <p>Collecting price data...</p>
        <span className="chart-empty-sub">
          {history?.length || 0} / 2 points needed
        </span>
      </div>
    );
  }

  const W = 520, H = 180, PAD = 20;
  const prices = history.map((h) => h.price);
  const times  = history.map((h) => h.time);
  const minP   = Math.min(...prices);
  const maxP   = Math.max(...prices);
  const range  = maxP - minP || 1;

  const toX = (i) => PAD + (i / (prices.length - 1)) * (W - PAD * 2);
  const toY = (p) => PAD + ((maxP - p) / range) * (H - PAD * 2);

  const linePath = prices
    .map((p, i) => {
      if (i === 0) return `M ${toX(i).toFixed(1)} ${toY(p).toFixed(1)}`;
      const cpX = ((toX(i) + toX(i - 1)) / 2).toFixed(1);
      return `C ${cpX} ${toY(prices[i - 1]).toFixed(1)}, ${cpX} ${toY(p).toFixed(1)}, ${toX(i).toFixed(1)} ${toY(p).toFixed(1)}`;
    })
    .join(" ");

  const fillPath = `${linePath} L ${toX(prices.length - 1).toFixed(1)} ${H - PAD} L ${toX(0).toFixed(1)} ${H - PAD} Z`;

  const isUp    = prices[prices.length - 1] >= prices[0];
  const color   = isUp ? "#10b981" : "#ef4444";
  const fillClr = isUp ? "url(#greenGrad)" : "url(#redGrad)";

  const yLabels = [maxP, minP + range / 2, minP];
  const xLabels = [
    { i: 0, label: times[0] },
    { i: Math.floor(prices.length / 2), label: times[Math.floor(prices.length / 2)] },
    { i: prices.length - 1, label: times[prices.length - 1] },
  ];

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="price-svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 1, 2].map((i) => {
          const y = PAD + (i / 2) * (H - PAD * 2);
          return (
            <line key={i} x1={PAD} y1={y} x2={W - PAD} y2={y}
              stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
          );
        })}

        {/* Fill */}
        <path d={fillPath} fill={fillClr} />

        {/* Smooth line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5"
          strokeLinejoin="round" strokeLinecap="round" />

        {/* Static dot */}
        <circle cx={toX(prices.length - 1)} cy={toY(prices[prices.length - 1])}
          r="4" fill="#fff" stroke={color} strokeWidth="2.5" />

        {/* Pulsing ring */}
        <circle cx={toX(prices.length - 1)} cy={toY(prices[prices.length - 1])}
          r="8" fill={color} opacity="0.2">
          <animate attributeName="r" values="4;12;4" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>

      {/* Y-axis */}
      <div className="chart-y-labels">
        {yLabels.map((p, i) => (
          <span key={i}>₹{Number(p).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
        ))}
      </div>

      {/* X-axis */}
      <div className="chart-x-labels">
        {xLabels.map(({ i, label }) => (
          <span key={i}>{label}</span>
        ))}
      </div>
    </div>
  );
}

// ── Main Landing ──────────────────────────────────────────────────────────
function Landing() {
  const [stocks, setStocks]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [time, setTime]             = useState(new Date());
  const [flashMap, setFlashMap]     = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const prevRef                     = useRef({});
  const historyRef                  = useRef({});

  const loadStocks = async () => {
    try {
      const res       = await getApprovedShares();
      const newStocks = res.data;
      const newFlash  = {};
      const now       = new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", second: "2-digit",
      });

      newStocks.forEach((s) => {
        const prev = prevRef.current[s.id];
        if (!historyRef.current[s.id]) historyRef.current[s.id] = [];
        const hist = historyRef.current[s.id];
        if (hist.length === 0 || hist[hist.length - 1].price !== s.price) {
          hist.push({ price: s.price, time: now });
          if (hist.length > 60) hist.shift();
        }
        if (prev != null && s.price !== prev)
          newFlash[s.id] = s.price >= prev ? "up" : "down";
      });

      setStocks((prev) => {
        const snapshot = {};
        prev.forEach((s) => (snapshot[s.id] = s.price));
        prevRef.current = snapshot;
        return newStocks;
      });

      if (Object.keys(newFlash).length > 0) {
        setFlashMap(newFlash);
        setTimeout(() => setFlashMap({}), 700);
      }
    } catch (err) {
      console.error("Failed to load shares", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStocks();
    const interval = setInterval(loadStocks, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const tick = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  // Market summary
  const totalUp   = stocks.filter((s) => {
    const prev = prevRef.current[s.id];
    return prev != null && s.price > prev;
  }).length;
  const totalDown = stocks.filter((s) => {
    const prev = prevRef.current[s.id];
    return prev != null && s.price < prev;
  }).length;

  return (
    <div className="landing-page">

      {/* ── Navbar ── */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <Link to="/" className="landing-brand">
            <span className="landing-brand-icon">📈</span>
            <span className="landing-brand-text">ShareBazar</span>
          </Link>
          <div className="landing-nav-links">
            <Link to="/login" className="landing-nav-link">Sign In</Link>
            <Link to="/signup" className="landing-nav-cta">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="landing-hero">
        <div className="landing-hero-content">
          <div className="landing-hero-badge">
            <span className="live-dot"></span>
            Live Market Data
          </div>
          <h1>
            Real-Time <span className="text-green">Stock Market</span>
          </h1>
          <p className="landing-hero-sub">
            Track live equity prices, analyze trends with interactive charts,
            and make informed investment decisions.
          </p>
        </div>
      </div>

      {/* ── Status Bar ── */}
      <div className="landing-container">
        <div className="status-bar">
          <div className="status-item">
            <span className="status-dot-wrap">
              <span className="status-dot"></span>
            </span>
            <span>Market Open</span>
          </div>
          <div className="status-item">
            <span className="status-icon">🕐</span>
            <span>{time.toLocaleTimeString()}</span>
          </div>
          <div className="status-item">
            <span className="status-icon">📋</span>
            <span>{stocks.length} Listed</span>
          </div>
          <div className="status-item up">
            <span>▲ {totalUp}</span>
          </div>
          <div className="status-item down">
            <span>▼ {totalDown}</span>
          </div>
          <div className="status-item">
            <span className="status-icon">🌐</span>
            <span>NSE · BSE</span>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="stock-table-card">
          <div className="stock-table-header">
            <h2>
              <span className="header-bar"></span>
              Equity Listings
            </h2>
            <span className="table-live-tag">
              <span className="live-dot-sm"></span>
              LIVE
            </span>
          </div>

          <div className="stock-table-wrapper">
            <table className="stock-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Ticker</th>
                  <th>Change</th>
                  <th className="th-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="table-empty">
                      <div className="table-loader">
                        <span className="loader-spinner"></span>
                        Loading market data...
                      </div>
                    </td>
                  </tr>
                ) : stocks.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="table-empty">
                      <span className="empty-icon">📋</span>
                      <p>No approved stocks listed yet.</p>
                    </td>
                  </tr>
                ) : (
                  stocks.map((stock) => {
                    const prev       = prevRef.current[stock.id];
                    const isUp       = prev == null ? true : stock.price >= prev;
                    const changePct  = prev == null || prev === 0 ? null
                      : Math.abs(((stock.price - prev) / prev) * 100);
                    const flash      = flashMap[stock.id];
                    const isSelected = selectedId === stock.id;
                    const hist       = historyRef.current[stock.id] || [];
                    const first      = hist[0]?.price;
                    const last       = hist[hist.length - 1]?.price;
                    const totalDiff  = hist.length >= 2 ? last - first : null;
                    const totalPct   = totalDiff != null && first > 0
                      ? ((totalDiff / first) * 100).toFixed(2) : null;

                    return (
                      <React.Fragment key={stock.id}>
                        <tr
                          className={[
                            "stock-row",
                            flash ? `flash-${flash}` : "",
                            isSelected ? "row-selected" : "",
                          ].join(" ")}
                          onClick={() => setSelectedId(isSelected ? null : stock.id)}
                        >
                          <td>
                            <div className="stock-name-group">
                              <span className="stock-avatar">
                                {stock.companyName.charAt(0)}
                              </span>
                              <div className="stock-name-text">
                                <span className="stock-company-name">
                                  {stock.companyName}
                                </span>
                                <span className="stock-expand-hint">
                                  {isSelected ? "Hide chart ▲" : "View chart ▼"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="ticker-tag">
                              {getTicker(stock.companyName)}
                            </span>
                          </td>
                          <td>
                            {changePct === null ? (
                              <span className="change-pill neutral">—</span>
                            ) : (
                              <span className={`change-pill ${isUp ? "up" : "down"}`}>
                                {isUp ? "▲" : "▼"} {changePct.toFixed(2)}%
                              </span>
                            )}
                          </td>
                          <td className={`price-td ${flash ? `price-flash-${flash}` : ""}`}>
                            <span className="price-value">
                              ₹{Number(stock.price).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                            </span>
                          </td>
                        </tr>

                        {isSelected && (
                          <tr className="chart-row">
                            <td colSpan="4">
                              <div className="chart-panel">
                                <div className="chart-panel-header">
                                  <div className="chart-title-group">
                                    <span className="chart-avatar">
                                      {stock.companyName.charAt(0)}
                                    </span>
                                    <div>
                                      <span className="chart-company">{stock.companyName}</span>
                                      <span className="chart-ticker-tag">
                                        {getTicker(stock.companyName)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="chart-price-group">
                                    <span className="chart-current-price">
                                      ₹{Number(stock.price).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
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

                                <div className="chart-footer">
                                  <span className="chart-note">
                                    📊 {hist.length} data points · last 60 updates
                                  </span>
                                  <span className="chart-refresh">
                                    ⟳ Refreshes every 3s
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── CTA Banner ── */}
        <div className="landing-cta">
          <div className="landing-cta-content">
            <h3>Want to start trading?</h3>
            <p>Create a free account and begin investing in minutes.</p>
          </div>
          <div className="landing-cta-actions">
            <Link to="/signup" className="cta-btn primary">
              🚀 Create Account
            </Link>
            <Link to="/login" className="cta-btn outline">
              Sign In →
            </Link>
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="landing-footer">
          <div className="footer-left">
            <span className="footer-brand">📈 ShareBazar</span>
            <span>Prices refresh every 3 seconds</span>
          </div>
          <span>© {new Date().getFullYear()} ShareBazar. All rights reserved.</span>
        </footer>
      </div>
    </div>
  );
}

// Need React for Fragment
import React from "react";

export default Landing;