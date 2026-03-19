import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getWallet, addMoney,
  getPortfolio, getTransactions,
  getApprovedShares, buyShare, sellShare,
  getUserOrders, placeLimitBuy, placeStopLoss, cancelOrder,
  changeUsername, changePassword
} from "../services/api";
import "./Dashboard.css";
import "./UserDashboard.css";

// ── Tag helpers ──────────────────────────────────────────────────────────
const TAGS_KEY = (u) => `tags_${u}`;
function loadTags(u) { try { return JSON.parse(localStorage.getItem(TAGS_KEY(u))) || {}; } catch { return {}; } }
function saveTags(u, t) { localStorage.setItem(TAGS_KEY(u), JSON.stringify(t)); }

function getHeldSince(companyName, transactions) {
  const buys = transactions
    .filter((tx) => tx.companyName === companyName && tx.type === "BUY")
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  return buys.length ? new Date(buys[0].timestamp) : null;
}

function formatHeldSince(date) {
  if (!date) return "—";
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0)  return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "just now";
}

// ── Price Chart (shared) ─────────────────────────────────────────────────
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

// ── Order status badge ──────────────────────────────────────────────────
function OrderBadge({ status }) {
  const map = {
    PENDING:   { cls: "order-pending",   label: "⏳ Pending"   },
    EXECUTED:  { cls: "order-executed",  label: "✅ Executed"  },
    EXPIRED:   { cls: "order-expired",   label: "⏰ Expired"   },
    CANCELLED: { cls: "order-cancelled", label: "✖ Cancelled" },
    REJECTED:  { cls: "order-rejected",  label: "❌ Rejected"  },
  };
  const { cls, label } = map[status] || { cls: "", label: status };
  return <span className={`order-status-badge ${cls}`}>{label}</span>;
}

// ── Holding row ──────────────────────────────────────────────────────────
function HoldingRow({ h, stocks, transactions, tag, onTag, onSell, onStopLoss }) {
  const stock        = stocks.find((s) => s.companyName === h.companyName);
  const currentPrice = stock ? stock.price : h.avgPrice;
  const holdingPnl   = (currentPrice - h.avgPrice) * h.quantity;
  const holdingPct   = ((currentPrice - h.avgPrice) / h.avgPrice) * 100;
  const isProfit     = holdingPnl >= 0;
  const heldSince    = getHeldSince(h.companyName, transactions);

  return (
    <tr>
      <td>
        <div className="holding-name-group">
          <span className="share-name">{h.companyName}</span>
          <span className="held-since">since {formatHeldSince(heldSince)}</span>
        </div>
      </td>
      <td><span className="qty-badge">{h.quantity}</span></td>
      <td>₹{Number(h.avgPrice).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
      <td className={isProfit ? "price-up-text" : "price-down-text"}>
        ₹{Number(currentPrice).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
      </td>
      <td>
        <span className={`pnl-badge ${isProfit ? "profit" : "loss"}`}>
          {isProfit ? "+" : ""}₹{Math.abs(holdingPnl).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          <span className="pnl-pct"> ({holdingPct.toFixed(2)}%)</span>
        </span>
      </td>
      <td>
        <div className="tag-btns">
          <button className={`tag-btn ${tag === "LONG" ? "tag-active-long" : ""}`}
            onClick={() => onTag(h.companyName, tag === "LONG" ? null : "LONG")}>LT</button>
          <button className={`tag-btn ${tag === "SHORT" ? "tag-active-short" : ""}`}
            onClick={() => onTag(h.companyName, tag === "SHORT" ? null : "SHORT")}>ST</button>
        </div>
      </td>
      <td>
        <div className="action-btns">
          <button className="btn btn-red btn-xs"
            onClick={() => onSell({ companyName: h.companyName, price: currentPrice })}>
            Sell
          </button>
          <button className="btn btn-amber btn-xs"
            onClick={() => onStopLoss({ companyName: h.companyName, price: currentPrice, quantity: h.quantity })}>
            SL
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Holdings section ─────────────────────────────────────────────────────
function HoldingsSection({ title, icon, holdings, stocks, transactions, tags, onTag, onSell, onStopLoss, emptyMsg }) {
  const totalInvested = holdings.reduce((s, h) => s + h.avgPrice * h.quantity, 0);
  const totalCurrent  = holdings.reduce((s, h) => {
    const stock = stocks.find((st) => st.companyName === h.companyName);
    return s + (stock ? stock.price * h.quantity : h.avgPrice * h.quantity);
  }, 0);
  const sectionPnl    = totalCurrent - totalInvested;
  const sectionPnlPct = totalInvested > 0 ? ((sectionPnl / totalInvested) * 100).toFixed(2) : "0.00";
  const isProfit      = sectionPnl >= 0;

  return (
    <div className="portfolio-section">
      <div className="portfolio-section-header">
        <span className="portfolio-section-icon">{icon}</span>
        <span className="portfolio-section-title">{title}</span>
        <span className="portfolio-section-count">{holdings.length}</span>
        {holdings.length > 0 && (
          <span className={`portfolio-section-pnl ${isProfit ? "up" : "down"}`}>
            {isProfit ? "▲ +" : "▼ "}₹{Math.abs(sectionPnl).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            <span className="pnl-pct"> ({sectionPnlPct}%)</span>
          </span>
        )}
      </div>
      {holdings.length === 0 ? (
        <div className="empty-state small-empty">{emptyMsg}</div>
      ) : (
        <div className="table-scroll">
          <table className="user-table">
            <thead>
              <tr>
                <th>Company</th><th>Qty</th><th>Avg Buy</th>
                <th>Current</th><th>P&amp;L</th><th>Tag</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => (
                <HoldingRow key={h.id} h={h} stocks={stocks} transactions={transactions}
                  tag={tags[h.companyName]} onTag={onTag} onSell={onSell} onStopLoss={onStopLoss} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ──────────────────────────────────────────────────────
function UserDashboard() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  const [activeTab, setActiveTab]       = useState("market");
  const [wallet, setWallet]             = useState(null);
  const [holdings, setHoldings]         = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stocks, setStocks]             = useState([]);
  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [message, setMessage]           = useState({ text: "", type: "" });
  const [tags, setTags]                 = useState(() => loadTags(username));

  const [showTopup, setShowTopup]       = useState(false);
  const [topupAmount, setTopupAmount]   = useState("");
  const [topupLoading, setTopupLoading] = useState(false);

  const [tradeModal, setTradeModal]     = useState(null);
  const [tradeQty, setTradeQty]         = useState(1);
  const [tradeLoading, setTradeLoading] = useState(false);

  const [orderModal, setOrderModal]     = useState(null);
  const [orderPrice, setOrderPrice]     = useState("");
  const [orderQty, setOrderQty]         = useState(1);
  const [orderExpiry, setOrderExpiry]   = useState(24);
  const [orderLoading, setOrderLoading] = useState(false);

  const [showSettings, setShowSettings]             = useState(false);
  const [settingsTab, setSettingsTab]               = useState("username");
  const [newUsername, setNewUsername]               = useState("");
  const [confirmPassForUser, setConfirmPassForUser] = useState("");
  const [oldPassword, setOldPassword]               = useState("");
  const [newPassword, setNewPassword]               = useState("");
  const [confirmNewPass, setConfirmNewPass]         = useState("");
  const [settingsLoading, setSettingsLoading]       = useState(false);
  const [settingsMsg, setSettingsMsg]               = useState({ text: "", type: "" });

  // Chart state
  const [selectedId, setSelectedId] = useState(null);
  const historyRef                  = useRef({});

  const [flashMap, setFlashMap] = useState({});
  const prevRef                 = useRef({});
  const pollRef                 = useRef(null);

  // ── Loaders ────────────────────────────────────────────────────────────
  const loadAll = async () => {
    try {
      const [walletRes, holdingsRes, txRes, ordersRes] = await Promise.all([
        getWallet(username),
        getPortfolio(username),
        getTransactions(username),
        getUserOrders(username),
      ]);
      setWallet(walletRes.data);
      setHoldings(holdingsRes.data);
      setTransactions(txRes.data);
      setOrders(ordersRes.data);
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  };

  const loadStocks = async () => {
    try {
      const res = await getApprovedShares();
      const newStocks = res.data;
      const newFlash  = {};
      const now = new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", second: "2-digit"
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
        const snap = {};
        prev.forEach((s) => (snap[s.id] = s.price));
        prevRef.current = snap;
        return newStocks;
      });
      if (Object.keys(newFlash).length > 0) {
        setFlashMap(newFlash);
        setTimeout(() => setFlashMap({}), 700);
      }
    } catch (err) { console.error("Failed to load stocks", err); }
  };

  useEffect(() => {
    loadAll();
    loadStocks();
    pollRef.current = setInterval(() => loadStocks(), 3000);
    const orderPoll = setInterval(() => loadAll(), 10000);
    return () => { clearInterval(pollRef.current); clearInterval(orderPoll); };
  }, []);

  // ── Tag handler ──────────────────────────────────────────────────────
  const handleTag = (companyName, value) => {
    setTags((prev) => {
      const updated = { ...prev };
      if (value === null) delete updated[companyName];
      else updated[companyName] = value;
      saveTags(username, updated);
      return updated;
    });
  };

  // ── Trade ────────────────────────────────────────────────────────────
  const handleTopup = async () => {
    const amt = parseFloat(topupAmount);
    if (!amt || amt <= 0) return showMsg("Enter a valid amount", "error");
    try {
      setTopupLoading(true);
      const res = await addMoney(username, amt);
      setWallet(res.data);
      setShowTopup(false);
      setTopupAmount("");
      showMsg(`✅ ₹${amt.toLocaleString("en-IN")} added to wallet`, "success");
    } catch (err) {
      showMsg(err.response?.data || "Top-up failed", "error");
    } finally { setTopupLoading(false); }
  };

  const handleTrade = async () => {
    if (!tradeModal) return;
    const { type, stock } = tradeModal;
    const qty = parseInt(tradeQty);
    if (!qty || qty <= 0) return showMsg("Enter a valid quantity", "error");
    try {
      setTradeLoading(true);
      const fn = type === "BUY" ? buyShare : sellShare;
      const res = await fn(username, stock.companyName, qty);
      showMsg(`✅ ${res.data}`, "success");
      setTradeModal(null);
      setTradeQty(1);
      await loadAll();
      await loadStocks();
    } catch (err) {
      showMsg(err.response?.data || `${type} failed`, "error");
    } finally { setTradeLoading(false); }
  };

  // ── Order placement ──────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    const price = parseFloat(orderPrice);
    const qty   = parseInt(orderQty);
    if (!price || price <= 0) return showMsg("Enter a valid target price", "error");
    if (!qty   || qty <= 0)   return showMsg("Enter a valid quantity", "error");
    try {
      setOrderLoading(true);
      if (orderModal.type === "LIMIT_BUY") {
        await placeLimitBuy(username, orderModal.stock.companyName, price, qty, orderExpiry);
        showMsg(`✅ Limit Buy set — will buy ${qty} shares of ${orderModal.stock.companyName} at ₹${price}`, "success");
      } else {
        await placeStopLoss(username, orderModal.stock.companyName, price, qty, 0);
        showMsg(`✅ Stop Loss set — will sell ${qty} shares of ${orderModal.stock.companyName} at ₹${price}`, "success");
      }
      setOrderModal(null);
      setOrderPrice("");
      setOrderQty(1);
      await loadAll();
    } catch (err) {
      showMsg(err.response?.data || "Failed to place order", "error");
    } finally { setOrderLoading(false); }
  };

  const handleCancelOrder = async (id) => {
    try {
      await cancelOrder(id, username);
      showMsg("✅ Order cancelled", "success");
      await loadAll();
    } catch (err) {
      showMsg(err.response?.data || "Failed to cancel", "error");
    }
  };

  // ── Settings handlers ────────────────────────────────────────────────
  const handleChangeUsername = async () => {
    if (!newUsername.trim()) return setSettingsMsg({ text: "Enter a new username", type: "error" });
    if (!confirmPassForUser) return setSettingsMsg({ text: "Enter your password to confirm", type: "error" });
    if (newUsername === username) return setSettingsMsg({ text: "New username must be different", type: "error" });
    try {
      setSettingsLoading(true);
      const res = await changeUsername(username, newUsername.trim(), confirmPassForUser);
      localStorage.setItem("username", res.data.username);
      localStorage.setItem("token", res.data.token);
      setSettingsMsg({ text: "✅ Username updated! Refreshing...", type: "success" });
      setNewUsername("");
      setConfirmPassForUser("");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setSettingsMsg({ text: err.response?.data || "Failed to update username", type: "error" });
    } finally { setSettingsLoading(false); }
  };

  const handleChangePassword = async () => {
    if (!oldPassword) return setSettingsMsg({ text: "Enter your current password", type: "error" });
    if (!newPassword) return setSettingsMsg({ text: "Enter a new password", type: "error" });
    if (newPassword.length < 6) return setSettingsMsg({ text: "Password must be at least 6 characters", type: "error" });
    if (newPassword !== confirmNewPass) return setSettingsMsg({ text: "Passwords do not match", type: "error" });
    try {
      setSettingsLoading(true);
      await changePassword(username, oldPassword, newPassword);
      setSettingsMsg({ text: "✅ Password updated successfully", type: "success" });
      setOldPassword(""); setNewPassword(""); setConfirmNewPass("");
    } catch (err) {
      setSettingsMsg({ text: err.response?.data || "Failed to update password", type: "error" });
    } finally { setSettingsLoading(false); }
  };

  const showMsg = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  const handleLogout = () => { localStorage.clear(); navigate("/login"); };

  // ── Derived ────────────────────────────────────────────────────────────
  const totalInvested = holdings.reduce((s, h) => s + h.avgPrice * h.quantity, 0);
  const totalCurrent  = holdings.reduce((s, h) => {
    const stock = stocks.find((st) => st.companyName === h.companyName);
    return s + (stock ? stock.price * h.quantity : h.avgPrice * h.quantity);
  }, 0);
  const pnl         = totalCurrent - totalInvested;
  const pnlPct      = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;
  const pnlPositive = pnl >= 0;

  const longTerm  = holdings.filter((h) => tags[h.companyName] === "LONG");
  const shortTerm = holdings.filter((h) => tags[h.companyName] === "SHORT");
  const untagged  = holdings.filter((h) => !tags[h.companyName]);

  const pendingOrders  = orders.filter((o) => o.status === "PENDING");
  const executedOrders = orders.filter((o) => o.status === "EXECUTED");
  const otherOrders    = orders.filter((o) => !["PENDING", "EXECUTED"].includes(o.status));

  const getTicker = (name) => name.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase();

  return (
    <div className="dashboard-layout">

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo">ShareBazar</div>
          <span className="role-tag user">Investor</span>
        </div>
        <nav>
          {[
            { key: "market",    icon: "📈", label: "Market" },
            { key: "portfolio", icon: "💼", label: "Portfolio" },
            { key: "orders",    icon: "📑", label: "Orders" },
            { key: "history",   icon: "🧾", label: "History" },
          ].map(({ key, icon, label }) => (
            <button key={key}
              className={`nav-item ${activeTab === key ? "active" : ""}`}
              onClick={() => setActiveTab(key)}>
              <span className="nav-icon">{icon}</span> {label}
              {key === "orders" && pendingOrders.length > 0 && (
                <span className="nav-count">{pendingOrders.length}</span>
              )}
              {key === "portfolio" && holdings.length > 0 && (
                <span className="nav-count">{holdings.length}</span>
              )}
            </button>
          ))}
        </nav>

        <button className="nav-item settings-nav-btn"
          onClick={() => { setShowSettings(true); setSettingsMsg({ text: "", type: "" }); setSettingsTab("username"); }}>
          <span className="nav-icon">⚙️</span> Settings
        </button>

        <div className="sidebar-wallet">
          <div className="wallet-header">
            <span className="wallet-icon">💰</span>
            <p className="sidebar-wallet-label">Wallet Balance</p>
          </div>
          <p className="sidebar-wallet-balance">
            {wallet ? `₹${Number(wallet.balance).toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : "—"}
          </p>
          <button className="btn btn-green btn-sm wallet-btn" onClick={() => setShowTopup(true)}>
            + Add Money
          </button>
        </div>

        <div className="sidebar-tag-legend">
          <p className="sidebar-wallet-label" style={{ marginBottom: 8 }}>Portfolio Tags</p>
          {[
            { tag: "LONG",  cls: "tag-active-long",  label: "Long Term",  count: longTerm.length },
            { tag: "SHORT", cls: "tag-active-short", label: "Short Term", count: shortTerm.length },
            { tag: null,    cls: "",                 label: "Untagged",   count: untagged.length  },
          ].map(({ tag, cls, label, count }) => (
            <div key={label} className="legend-row">
              <span className={`tag-btn ${cls}`} style={{ pointerEvents: "none" }}>
                {tag === "LONG" ? "LT" : tag === "SHORT" ? "ST" : "—"}
              </span>
              <span className="legend-label">{label}</span>
              <span className="legend-count">{count}</span>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={handleLogout}>
            <span className="nav-icon">🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="dashboard-main">
        <div className="dash-header">
          <div>
            <p className="greeting">📈 Welcome back, <span className="greeting-name">{username}</span></p>
            <h2>Investor Dashboard</h2>
          </div>
          <span className="dash-date">
            🗓 {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>

        {message.text && (
          <div className={`dash-message ${message.type} global-msg`}>{message.text}</div>
        )}

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">💰</span>
            <p className="stat-label">Wallet</p>
            <p className="stat-value green">
              {wallet ? `₹${Number(wallet.balance).toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "—"}
            </p>
            <p className="stat-change">Available cash</p>
          </div>
          <div className="stat-card">
            <span className="stat-icon">📊</span>
            <p className="stat-label">Invested</p>
            <p className="stat-value blue">
              ₹{totalInvested.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </p>
            <p className="stat-change">{holdings.length} holdings</p>
          </div>
          <div className="stat-card">
            <span className="stat-icon">{pnlPositive ? "📈" : "📉"}</span>
            <p className="stat-label">P&amp;L</p>
            <p className={`stat-value ${pnlPositive ? "green" : "red"}`}>
              {pnlPositive ? "+" : ""}₹{Math.abs(pnl).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </p>
            <p className={`stat-change ${pnlPositive ? "up" : "down"}`}>
              {pnlPositive ? "▲" : "▼"} {Math.abs(pnlPct).toFixed(2)}%
            </p>
          </div>
          <div className="stat-card">
            <span className="stat-icon">📑</span>
            <p className="stat-label">Pending Orders</p>
            <p className="stat-value amber">{pendingOrders.length}</p>
            <p className="stat-change">{executedOrders.length} executed</p>
          </div>
        </div>

        {/* ══ MARKET TAB ══ */}
        {activeTab === "market" && (
          <div className="dash-section">
            <div className="section-header">
              <h3>Live Market</h3>
              <span className="section-badge live-badge">● LIVE</span>
            </div>
            <div className="section-body no-pad">
              <div className="table-scroll">
                <table className="user-table">
                  <thead>
                    <tr>
                      <th>Company</th><th>Ticker</th><th>Change</th>
                      <th>Price</th><th>Volume</th><th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stocks.length === 0 ? (
                      <tr><td colSpan="6" className="empty-td">Loading market data...</td></tr>
                    ) : stocks.map((stock) => {
                      const prev       = prevRef.current[stock.id];
                      const isUp       = prev == null ? true : stock.price >= prev;
                      const changePct  = prev == null || prev === 0 ? null
                        : Math.abs(((stock.price - prev) / prev) * 100);
                      const flash      = flashMap[stock.id];
                      const ticker     = getTicker(stock.companyName);
                      const owned      = holdings.find((h) => h.companyName === stock.companyName);
                      const isSelected = selectedId === stock.id;
                      const hist       = historyRef.current[stock.id] || [];
                      const first      = hist[0]?.price;
                      const last       = hist[hist.length - 1]?.price;
                      const totalDiff  = hist.length >= 2 ? last - first : null;
                      const totalPct   = totalDiff != null && first > 0
                        ? ((totalDiff / first) * 100).toFixed(2) : null;
                      const soldOut    = stock.availableVolume === 0;

                      return (
                        <>
                          <tr key={stock.id}
                            className={[
                              "clickable-row",
                              flash ? `flash-${flash}` : "",
                              isSelected ? "row-selected" : "",
                            ].join(" ")}
                            onClick={() => setSelectedId(isSelected ? null : stock.id)}>
                            <td>
                              <span className="stock-name-cell">
                                {stock.companyName}
                                {owned && <span className="owned-badge">owned</span>}
                                <span className="expand-hint">{isSelected ? " ▲" : " ▼"}</span>
                              </span>
                            </td>
                            <td><span className="stock-ticker">{ticker}</span></td>
                            <td>
                              {changePct === null ? (
                                <span className="change-badge neutral">—</span>
                              ) : (
                                <span className={`change-badge ${isUp ? "up" : "down"}`}>
                                  {isUp ? "▲" : "▼"} {changePct.toFixed(2)}%
                                </span>
                              )}
                            </td>
                            <td className={`price-cell ${flash ? `price-${flash}` : ""}`}>
                              ₹{Number(stock.price).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                            </td>
                            <td>
                              <span className={`volume-badge ${soldOut ? "sold-out" : ""}`}>
                                {soldOut ? "SOLD OUT" : `${stock.availableVolume}/${stock.totalVolume}`}
                              </span>
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <div className="action-btns">
                                <button
                                  className={`btn btn-xs ${soldOut ? "btn-outline" : "btn-green"}`}
                                  disabled={soldOut}
                                  onClick={() => { setTradeModal({ type: "BUY", stock }); setTradeQty(1); }}>
                                  {soldOut ? "Sold Out" : "Buy"}
                                </button>
                                <button className="btn btn-outline btn-xs"
                                  disabled={soldOut}
                                  onClick={() => {
                                    setOrderModal({ type: "LIMIT_BUY", stock });
                                    setOrderPrice(""); setOrderQty(1); setOrderExpiry(24);
                                  }}>
                                  Limit
                                </button>
                                {owned && (
                                  <button className="btn btn-red btn-xs"
                                    onClick={() => { setTradeModal({ type: "SELL", stock }); setTradeQty(1); }}>
                                    Sell
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Inline chart row */}
                          {isSelected && (
                            <tr key={`chart-${stock.id}`} className="chart-row">
                              <td colSpan="6">
                                <div className="chart-panel">
                                  <div className="chart-panel-header">
                                    <div className="chart-title-group">
                                      <span className="chart-company">{stock.companyName}</span>
                                      <span className="chart-ticker-tag">{ticker}</span>
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
              </div>
            </div>
          </div>
        )}

        {/* ══ PORTFOLIO TAB ══ */}
        {activeTab === "portfolio" && (
          <div>
            {loading ? (
              <div className="empty-state">Loading portfolio...</div>
            ) : holdings.length === 0 ? (
              <div className="dash-section">
                <div className="section-body">
                  <div className="empty-state">💼<br />No holdings yet. Buy stocks from the Market tab!</div>
                </div>
              </div>
            ) : (
              <>
                <div className="portfolio-tag-hint">
                  💡 Click <strong>LT</strong> or <strong>ST</strong> to tag holdings · Click <strong>SL</strong> to set stop loss
                </div>
                {[
                  { title: "Long Term",  icon: "🏦", list: longTerm,  emptyMsg: "No long term holdings tagged" },
                  { title: "Short Term", icon: "⚡", list: shortTerm, emptyMsg: "No short term holdings tagged" },
                  { title: "Untagged",   icon: "📋", list: untagged,  emptyMsg: "All holdings are tagged ✓" },
                ].map(({ title, icon, list, emptyMsg }) => (
                  <HoldingsSection key={title} title={title} icon={icon}
                    holdings={list} stocks={stocks} transactions={transactions}
                    tags={tags} onTag={handleTag}
                    onSell={(stock) => { setTradeModal({ type: "SELL", stock }); setTradeQty(1); }}
                    onStopLoss={({ companyName, price, quantity }) => {
                      setOrderModal({ type: "STOP_LOSS", stock: { companyName, price } });
                      setOrderPrice(""); setOrderQty(quantity); setOrderExpiry(0);
                    }}
                    emptyMsg={emptyMsg}
                  />
                ))}
              </>
            )}
          </div>
        )}

        {/* ══ ORDERS TAB ══ */}
        {activeTab === "orders" && (
          <div>
            <div className="dash-section">
              <div className="section-header">
                <h3>Pending Orders</h3>
                {pendingOrders.length > 0 && <span className="section-badge">{pendingOrders.length} active</span>}
              </div>
              <div className="section-body no-pad">
                {pendingOrders.length === 0 ? (
                  <div className="empty-state small-empty">No pending orders</div>
                ) : (
                  <div className="table-scroll">
                    <table className="user-table">
                      <thead>
                        <tr><th>Company</th><th>Type</th><th>Target ₹</th><th>Qty</th><th>Expires</th><th>Action</th></tr>
                      </thead>
                      <tbody>
                        {pendingOrders.map((o) => (
                          <tr key={o.id}>
                            <td><span className="share-name">{o.companyName}</span></td>
                            <td><span className={`type-badge ${o.type === "LIMIT_BUY" ? "buy" : "sell"}`}>
                              {o.type === "LIMIT_BUY" ? "Limit Buy" : "Stop Loss"}
                            </span></td>
                            <td className="price-up-text">₹{Number(o.targetPrice).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                            <td>{o.quantity}</td>
                            <td className="time-cell">
                              {o.expiresAt ? new Date(o.expiresAt).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Never"}
                            </td>
                            <td><button className="btn btn-outline btn-xs" onClick={() => handleCancelOrder(o.id)}>Cancel</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="dash-section">
              <div className="section-header">
                <h3>Executed Orders</h3>
                {executedOrders.length > 0 && <span className="section-badge">{executedOrders.length} filled</span>}
              </div>
              <div className="section-body no-pad">
                {executedOrders.length === 0 ? (
                  <div className="empty-state small-empty">No executed orders yet</div>
                ) : (
                  <div className="table-scroll">
                    <table className="user-table">
                      <thead>
                        <tr><th>Company</th><th>Type</th><th>Target ₹</th><th>Executed ₹</th><th>Qty</th><th>Note</th><th>Time</th></tr>
                      </thead>
                      <tbody>
                        {executedOrders.map((o) => (
                          <tr key={o.id}>
                            <td><span className="share-name">{o.companyName}</span></td>
                            <td><span className={`type-badge ${o.type === "LIMIT_BUY" ? "buy" : "sell"}`}>
                              {o.type === "LIMIT_BUY" ? "Limit Buy" : "Stop Loss"}
                            </span></td>
                            <td>₹{Number(o.targetPrice).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                            <td className="price-up-text">
                              {o.executedPrice ? `₹${Number(o.executedPrice).toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : "—"}
                            </td>
                            <td>{o.filledQuantity} / {o.quantity}</td>
                            <td className="time-cell">{o.note || "—"}</td>
                            <td className="time-cell">{new Date(o.executedAt).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {otherOrders.length > 0 && (
              <div className="dash-section">
                <div className="section-header">
                  <h3>Expired / Cancelled / Rejected</h3>
                  <span className="section-badge">{otherOrders.length}</span>
                </div>
                <div className="section-body no-pad">
                  <div className="table-scroll">
                    <table className="user-table">
                      <thead>
                        <tr><th>Company</th><th>Type</th><th>Target ₹</th><th>Qty</th><th>Status</th><th>Note</th></tr>
                      </thead>
                      <tbody>
                        {otherOrders.map((o) => (
                          <tr key={o.id}>
                            <td><span className="share-name">{o.companyName}</span></td>
                            <td><span className={`type-badge ${o.type === "LIMIT_BUY" ? "buy" : "sell"}`}>
                              {o.type === "LIMIT_BUY" ? "Limit Buy" : "Stop Loss"}
                            </span></td>
                            <td>₹{Number(o.targetPrice).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                            <td>{o.quantity}</td>
                            <td><OrderBadge status={o.status} /></td>
                            <td className="time-cell">{o.note || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ HISTORY TAB ══ */}
        {activeTab === "history" && (
          <div className="dash-section">
            <div className="section-header">
              <h3>Transaction History</h3>
              {transactions.length > 0 && <span className="section-badge">{transactions.length} trades</span>}
            </div>
            <div className="section-body no-pad">
              {loading ? (
                <div className="empty-state">Loading...</div>
              ) : transactions.length === 0 ? (
                <div className="empty-state">🧾<br />No transactions yet.</div>
              ) : (
                <div className="table-scroll">
                  <table className="user-table">
                    <thead>
                      <tr><th>Company</th><th>Type</th><th>Qty</th><th>Price</th><th>Total</th><th>Time</th></tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id}>
                          <td>
                            <div className="holding-name-group">
                              <span className="share-name">{tx.companyName}</span>
                              {tags[tx.companyName] && (
                                <span className={`inline-tag ${tags[tx.companyName] === "LONG" ? "tag-active-long" : "tag-active-short"}`}>
                                  {tags[tx.companyName] === "LONG" ? "LT" : "ST"}
                                </span>
                              )}
                            </div>
                          </td>
                          <td><span className={`type-badge ${tx.type === "BUY" ? "buy" : "sell"}`}>{tx.type}</span></td>
                          <td>{tx.quantity}</td>
                          <td>₹{Number(tx.price).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                          <td className="total-cell">₹{Number(tx.total).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                          <td className="time-cell">{new Date(tx.timestamp).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ══ TOP-UP MODAL ══ */}
      {showTopup && (
        <div className="modal-overlay" onClick={() => setShowTopup(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">💰</div>
            <h3 className="modal-title">Add Money to Wallet</h3>
            <p className="modal-sub">Current balance: <strong>₹{wallet ? Number(wallet.balance).toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "—"}</strong></p>
            <input className="dash-input" type="number" placeholder="Amount (₹)"
              value={topupAmount} onChange={(e) => setTopupAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTopup()} autoFocus />
            <div className="modal-quick-btns">
              {[1000, 5000, 10000, 25000].map((amt) => (
                <button key={amt} className="btn btn-outline btn-xs" onClick={() => setTopupAmount(amt.toString())}>
                  +₹{amt.toLocaleString("en-IN")}
                </button>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowTopup(false)}>Cancel</button>
              <button className="btn btn-green" onClick={handleTopup} disabled={topupLoading}>
                {topupLoading ? "Adding..." : "💰 Add Money"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ BUY/SELL MODAL ══ */}
      {tradeModal && (
        <div className="modal-overlay" onClick={() => setTradeModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">{tradeModal.type === "BUY" ? "🟢" : "🔴"}</div>
            <h3 className="modal-title">{tradeModal.type === "BUY" ? "Buy" : "Sell"} {tradeModal.stock.companyName}</h3>
            <p className="modal-sub">Current price: <strong>₹{Number(tradeModal.stock.price).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong></p>
            {tradeModal.type === "BUY" && tradeModal.stock.availableVolume > 0 && (
              <p className="modal-sub">Available: <strong>{tradeModal.stock.availableVolume} shares</strong></p>
            )}
            {tradeModal.type === "SELL" && (
              <p className="modal-sub">You own: <strong>{holdings.find((h) => h.companyName === tradeModal.stock.companyName)?.quantity ?? 0} shares</strong></p>
            )}
            <div className="qty-row">
              <button className="qty-btn" onClick={() => setTradeQty((q) => Math.max(1, q - 1))}>−</button>
              <input className="dash-input qty-input" type="number" min="1" value={tradeQty}
                onChange={(e) => setTradeQty(Math.max(1, parseInt(e.target.value) || 1))} />
              <button className="qty-btn" onClick={() => setTradeQty((q) => q + 1)}>+</button>
            </div>
            <div className="modal-total">
              Total: <strong>₹{(tradeModal.stock.price * tradeQty).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong>
              {tradeModal.type === "BUY" && wallet && (
                <span className="modal-balance-after">
                  &nbsp;· After: ₹{Math.max(0, wallet.balance - tradeModal.stock.price * tradeQty).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </span>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setTradeModal(null)}>Cancel</button>
              <button className={`btn ${tradeModal.type === "BUY" ? "btn-green" : "btn-red"}`}
                onClick={handleTrade} disabled={tradeLoading}>
                {tradeLoading ? "Processing..." : `✓ Confirm ${tradeModal.type}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ LIMIT BUY / STOP LOSS MODAL ══ */}
      {orderModal && (
        <div className="modal-overlay" onClick={() => setOrderModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">{orderModal.type === "LIMIT_BUY" ? "🎯" : "🛡️"}</div>
            <h3 className="modal-title">
              {orderModal.type === "LIMIT_BUY" ? "Limit Buy" : "Stop Loss"} — {orderModal.stock.companyName}
            </h3>
            <p className="modal-sub">Current price: <strong>₹{Number(orderModal.stock.price).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong></p>
            <p className="modal-sub order-hint">
              {orderModal.type === "LIMIT_BUY"
                ? "⬇ Set a price below current — triggers when price drops to your target"
                : "⬇ Set a price below current — auto-sells if price drops to this level"}
            </p>
            <label className="order-label">Target Price (₹)</label>
            <input className="dash-input" type="number" placeholder="e.g. 150.00"
              value={orderPrice} onChange={(e) => setOrderPrice(e.target.value)} autoFocus />
            <label className="order-label" style={{ marginTop: 12 }}>Quantity</label>
            <div className="qty-row">
              <button className="qty-btn" onClick={() => setOrderQty((q) => Math.max(1, q - 1))}>−</button>
              <input className="dash-input qty-input" type="number" min="1" value={orderQty}
                onChange={(e) => setOrderQty(Math.max(1, parseInt(e.target.value) || 1))} />
              <button className="qty-btn" onClick={() => setOrderQty((q) => q + 1)}>+</button>
            </div>
            {orderModal.type === "LIMIT_BUY" && (
              <>
                <label className="order-label" style={{ marginTop: 12 }}>Expires in (hours, 0 = never)</label>
                <input className="dash-input" type="number" min="0" value={orderExpiry}
                  onChange={(e) => setOrderExpiry(parseInt(e.target.value) || 0)} />
              </>
            )}
            {orderPrice && (
              <div className="modal-total" style={{ marginTop: 12 }}>
                Est. total: <strong>₹{(parseFloat(orderPrice) * orderQty || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong>
                {orderModal.type === "LIMIT_BUY" && wallet && (
                  <span className="modal-balance-after">
                    &nbsp;· Sufficient funds: {wallet.balance >= parseFloat(orderPrice) * orderQty ? "✅" : "❌"}
                  </span>
                )}
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setOrderModal(null)}>Cancel</button>
              <button className={`btn ${orderModal.type === "LIMIT_BUY" ? "btn-green" : "btn-amber"}`}
                onClick={handlePlaceOrder} disabled={orderLoading}>
                {orderLoading ? "Placing..." : orderModal.type === "LIMIT_BUY" ? "🎯 Place Limit Buy" : "🛡️ Set Stop Loss"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ SETTINGS MODAL ══ */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal modal-settings" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">⚙️</div>
            <h3 className="modal-title">Account Settings</h3>
            <p className="modal-sub">Logged in as <strong>{username}</strong></p>
            <div className="settings-tabs">
              <button className={`settings-tab ${settingsTab === "username" ? "active" : ""}`}
                onClick={() => { setSettingsTab("username"); setSettingsMsg({ text: "", type: "" }); }}>
                👤 Username
              </button>
              <button className={`settings-tab ${settingsTab === "password" ? "active" : ""}`}
                onClick={() => { setSettingsTab("password"); setSettingsMsg({ text: "", type: "" }); }}>
                🔒 Password
              </button>
            </div>
            {settingsTab === "username" && (
              <div className="settings-form">
                <label className="order-label">New Username</label>
                <input className="dash-input" type="text" placeholder="Enter new username"
                  value={newUsername} onChange={(e) => setNewUsername(e.target.value)} autoFocus />
                <label className="order-label" style={{ marginTop: 12 }}>Confirm with Password</label>
                <input className="dash-input" type="password" placeholder="Your current password"
                  value={confirmPassForUser} onChange={(e) => setConfirmPassForUser(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleChangeUsername()} />
                {settingsMsg.text && (
                  <div className={`dash-message ${settingsMsg.type} global-msg`} style={{ marginTop: 12 }}>{settingsMsg.text}</div>
                )}
                <div className="modal-actions">
                  <button className="btn btn-outline" onClick={() => setShowSettings(false)}>Cancel</button>
                  <button className="btn btn-green" onClick={handleChangeUsername} disabled={settingsLoading}>
                    {settingsLoading ? "Updating..." : "✓ Update Username"}
                  </button>
                </div>
              </div>
            )}
            {settingsTab === "password" && (
              <div className="settings-form">
                <label className="order-label">Current Password</label>
                <input className="dash-input" type="password" placeholder="Enter current password"
                  value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} autoFocus />
                <label className="order-label" style={{ marginTop: 12 }}>New Password</label>
                <input className="dash-input" type="password" placeholder="Min 6 characters"
                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <label className="order-label" style={{ marginTop: 12 }}>Confirm New Password</label>
                <input className="dash-input" type="password" placeholder="Repeat new password"
                  value={confirmNewPass} onChange={(e) => setConfirmNewPass(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleChangePassword()} />
                {settingsMsg.text && (
                  <div className={`dash-message ${settingsMsg.type} global-msg`} style={{ marginTop: 12 }}>{settingsMsg.text}</div>
                )}
                <div className="modal-actions">
                  <button className="btn btn-outline" onClick={() => setShowSettings(false)}>Cancel</button>
                  <button className="btn btn-green" onClick={handleChangePassword} disabled={settingsLoading}>
                    {settingsLoading ? "Updating..." : "✓ Update Password"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default UserDashboard;