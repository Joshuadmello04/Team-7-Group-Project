import { useState, useEffect } from "react";
import { loginUser } from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role === "USER") navigate("/user");
    if (role === "ADMIN") navigate("/admin");
    if (role === "COMPANY") navigate("/company");
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      setMessage("Enter username and password");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await loginUser({ username, password });

      const token = res.data.token;
      const role = res.data.role;

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("username", username);

      if (role === "USER") navigate("/user");
      else if (role === "ADMIN") navigate("/admin");
      else if (role === "COMPANY") navigate("/company");
    } catch (err) {
      console.error(err);
      if (typeof err.response?.data === "string") {
        setMessage(err.response.data);
      } else {
        setMessage("Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="auth-page">
      {/* Left Panel */}
      <div className="auth-left">
        <div className="auth-left-content">
          <Link to="/" className="auth-brand">
            <span className="auth-brand-icon">📈</span>
            <span className="auth-brand-text">ShareBazar</span>
          </Link>

          <div className="auth-left-hero">
            <h1>Welcome back, Investor</h1>
            <p>
              Sign in to access your portfolio, track market trends, and
              continue your investment journey.
            </p>
          </div>

          <div className="auth-left-stats">
            <div className="auth-stat">
              <span className="auth-stat-val">10K+</span>
              <span className="auth-stat-lbl">Traders</span>
            </div>
            <div className="auth-stat-sep"></div>
            <div className="auth-stat">
              <span className="auth-stat-val">500+</span>
              <span className="auth-stat-lbl">Stocks</span>
            </div>
            <div className="auth-stat-sep"></div>
            <div className="auth-stat">
              <span className="auth-stat-val">99.9%</span>
              <span className="auth-stat-lbl">Uptime</span>
            </div>
          </div>

          {/* Floating shapes */}
          <div className="auth-shapes">
            <div className="auth-shape as1"></div>
            <div className="auth-shape as2"></div>
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="auth-right">
        <div className="auth-form-wrapper">
          <div className="auth-form-header">
            <h2>Sign In</h2>
            <p>Enter your credentials to continue</p>
          </div>

          <div className="auth-form">
            <div className="input-group">
              <label>Username</label>
              <div className="input-wrap">
                <span className="input-icon">👤</span>
                <input
                  value={username}
                  placeholder="Enter your username"
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="input-wrap">
                <span className="input-icon">🔒</span>
                <input
                  value={password}
                  type="password"
                  placeholder="Enter your password"
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>

            <button
              className="auth-btn"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <span className="btn-loader"></span>
              ) : (
                <>🚀 Sign In</>
              )}
            </button>

            {message && (
              <p
                className={`auth-message ${
                  message.startsWith("✅") ? "success" : "error"
                }`}
              >
                {message}
              </p>
            )}
          </div>

          <div className="auth-footer">
            <p>
              Don't have an account?{" "}
              <Link to="/signup" className="auth-link">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;