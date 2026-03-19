import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./Home.css";

function Home() {
  return (
    <>
      <Navbar />

      <div className="home">

        {/* ── Hero Section ── */}
        <section className="hero">
          <div className="hero-shapes">
            <div className="shape s1"></div>
            <div className="shape s2"></div>
            <div className="shape s3"></div>
          </div>

          <div className="hero-content">
            <div className="hero-badge">🟢 Market is Live — Start Trading</div>

            <h1 className="hero-title">
              Invest Smarter with
              <span className="highlight"> ShareBazar</span>
            </h1>

            <p className="hero-subtitle">
              India's next-generation stock trading platform. Buy, sell, and
              track shares in real time with a seamless, secure experience.
            </p>

            <div className="hero-actions">
              <Link to="/register" className="btn-hero primary">
                🚀 Start Investing Free
              </Link>
              <a href="#features" className="btn-hero outline">
                Learn More →
              </a>
            </div>

            {/* Mini Ticker */}
            <div className="hero-ticker">
              <div className="htick">
                <span className="htick-label">NIFTY 50</span>
                <span className="htick-val up">22,450.50 ▲</span>
              </div>
              <div className="htick-sep"></div>
              <div className="htick">
                <span className="htick-label">SENSEX</span>
                <span className="htick-val up">73,890.25 ▲</span>
              </div>
              <div className="htick-sep"></div>
              <div className="htick">
                <span className="htick-label">BANKNIFTY</span>
                <span className="htick-val down">48,120.00 ▼</span>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="hero-stats">
            <div className="hstat">
              <p className="hstat-val">10K+</p>
              <p className="hstat-lbl">Active Traders</p>
            </div>
            <div className="hstat">
              <p className="hstat-val">₹50Cr+</p>
              <p className="hstat-lbl">Trading Volume</p>
            </div>
            <div className="hstat">
              <p className="hstat-val">500+</p>
              <p className="hstat-lbl">Listed Companies</p>
            </div>
            <div className="hstat">
              <p className="hstat-val">99.9%</p>
              <p className="hstat-lbl">Uptime</p>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="section features" id="features">
          <div className="container">
            <span className="sec-tag">Why ShareBazar?</span>
            <h2 className="sec-title">
              Everything you need to trade with confidence
            </h2>
            <p className="sec-desc">
              From real-time data to secure transactions — tools that empower
              your investment journey.
            </p>

            <div className="feat-grid">
              {[
                { icon: "📊", title: "Real-Time Tracking",  desc: "Live stock prices, market trends, and portfolio updates at your fingertips." },
                { icon: "🔒", title: "Bank-Grade Security", desc: "Enterprise encryption and multi-factor authentication to guard your wealth." },
                { icon: "⚡", title: "Instant Execution",   desc: "Lightning-fast order execution with zero delays. Never miss an opportunity." },
                { icon: "📈", title: "Smart Analytics",     desc: "AI-powered insights and analytics for data-driven investment decisions." },
                { icon: "🏢", title: "Company Portal",      desc: "Companies can list shares, manage IPOs, and connect with investors." },
                { icon: "💰", title: "Zero Commission",     desc: "Trade stocks without hidden fees. Transparent pricing, no surprises." },
              ].map((f, i) => (
                <div className="feat-card" key={i}>
                  <div className="feat-icon">{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Market Overview ── */}
        <section className="section market" id="market">
          <div className="container">
            <span className="sec-tag">Live Market</span>
            <h2 className="sec-title">Today's Market Overview</h2>
            <p className="sec-desc">
              Stay updated with the latest market movements and trending stocks.
            </p>

            <div className="market-grid">
              {[
                { name: "Reliance Ind.", price: "₹2,890.50", pct: "+2.4%", dir: "up",   pts: "0,25 15,20 30,22 45,15 60,18 75,10 100,5" },
                { name: "TCS",           price: "₹3,745.25", pct: "+1.8%", dir: "up",   pts: "0,20 20,22 35,18 50,20 70,12 85,8 100,5" },
                { name: "Infosys",       price: "₹1,425.75", pct: "-0.9%", dir: "down", pts: "0,5 20,8 40,12 55,10 70,18 85,22 100,25" },
                { name: "HDFC Bank",     price: "₹1,650.00", pct: "+1.2%", dir: "up",   pts: "0,22 25,18 40,20 60,14 80,10 100,6" },
              ].map((s, i) => (
                <div className={`mcard ${s.dir}`} key={i}>
                  <div className="mcard-top">
                    <span className="mcard-name">{s.name}</span>
                    <span className={`mcard-badge ${s.dir}`}>{s.pct}</span>
                  </div>
                  <p className="mcard-price">{s.price}</p>
                  <svg viewBox="0 0 100 30" className={`mini-chart ${s.dir}`}>
                    <polyline
                      points={s.pts}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Steps ── */}
        <section className="section steps" id="about">
          <div className="container">
            <span className="sec-tag">Get Started</span>
            <h2 className="sec-title">Start trading in 3 simple steps</h2>

            <div className="steps-row">
              {[
                { n: "01", t: "Create Account", d: "Sign up in seconds with just your email. No paperwork." },
                { n: "02", t: "Browse Market",  d: "Explore listed shares, analyze trends, find opportunities." },
                { n: "03", t: "Start Trading",  d: "Buy and sell shares instantly. Track portfolio in real time." },
              ].map((s, i) => (
                <div className="step-wrap" key={i}>
                  {i > 0 && <div className="step-arrow">→</div>}
                  <div className="step-card">
                    <div className="step-num">{s.n}</div>
                    <h3>{s.t}</h3>
                    <p>{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="cta-section">
          <div className="cta-box">
            <div className="cta-icon">📈</div>
            <h2>Ready to start your investment journey?</h2>
            <p>
              Join thousands of traders already growing their wealth on
              ShareBazar. It's free to start.
            </p>
            <div className="cta-btns">
              <Link to="/register" className="btn-hero primary">
                🚀 Create Free Account
              </Link>
              <Link to="/login" className="btn-hero outline">
                Sign In →
              </Link>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="footer">
          <div className="footer-top">
            <div className="footer-brand">
              <span style={{ fontSize: "1.4rem" }}>📈</span>
              <span className="footer-brand-name">ShareBazar</span>
              <p className="footer-tagline">
                India's next-gen stock trading platform.
              </p>
            </div>
            <div className="footer-cols">
              <div className="footer-col">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#market">Market</a>
                <a href="#">Pricing</a>
              </div>
              <div className="footer-col">
                <h4>Company</h4>
                <a href="#about">About</a>
                <a href="#">Careers</a>
                <a href="#">Contact</a>
              </div>
              <div className="footer-col">
                <h4>Legal</h4>
                <a href="#">Terms</a>
                <a href="#">Privacy</a>
                <a href="#">Security</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} ShareBazar. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}

export default Home;