import { useState } from "react";
import { registerUser, registerCompany } from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";

function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSignup = async () => {
    if (!username || !password) {
      setMessage("Enter all fields");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      if (role === "USER") {
        await registerUser({ username, password });
      } else {
        await registerCompany({ username, password });
      }

      setMessage("✅ Registration successful! Redirecting...");
      setUsername("");
      setPassword("");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data || err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSignup();
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
            <h1>Start Your Investment Journey</h1>
            <p>
              Create your account and join thousands of traders building wealth
              on India's next-gen stock trading platform.
            </p>
          </div>

          <div className="auth-left-features">
            <div className="auth-feature">
              <span className="auth-feature-icon">⚡</span>
              <div>
                <h4>Instant Setup</h4>
                <p>Get started in under 30 seconds</p>
              </div>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">🔒</span>
              <div>
                <h4>Bank-Grade Security</h4>
                <p>Your data is always encrypted</p>
              </div>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">💰</span>
              <div>
                <h4>Zero Commission</h4>
                <p>Trade without hidden fees</p>
              </div>
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
            <h2>Create Account</h2>
            <p>Fill in the details to get started</p>
          </div>

          <div className="auth-form">
            <div className="input-group">
              <label>Username</label>
              <div className="input-wrap">
                <span className="input-icon">👤</span>
                <input
                  value={username}
                  placeholder="Choose a username"
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
                  placeholder="Create a password"
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Account Type</label>
              <div className="role-selector">
                <button
                  className={`role-option ${role === "USER" ? "active" : ""}`}
                  onClick={() => setRole("USER")}
                  type="button"
                >
                  <span className="role-opt-icon">👤</span>
                  <div>
                    <span className="role-opt-title">Investor</span>
                    <span className="role-opt-desc">Buy & sell stocks</span>
                  </div>
                </button>

                <button
                  className={`role-option ${role === "COMPANY" ? "active" : ""}`}
                  onClick={() => setRole("COMPANY")}
                  type="button"
                >
                  <span className="role-opt-icon">🏢</span>
                  <div>
                    <span className="role-opt-title">Company</span>
                    <span className="role-opt-desc">List your shares</span>
                  </div>
                </button>
              </div>
            </div>

            <button
              className="auth-btn"
              onClick={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <span className="btn-loader"></span>
              ) : (
                <>🚀 Create Account</>
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
              Already have an account?{" "}
              <Link to="/login" className="auth-link">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;