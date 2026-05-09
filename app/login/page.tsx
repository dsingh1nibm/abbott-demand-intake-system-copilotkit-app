"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  console.log("ENV CHECK:", process.env.NEXT_PUBLIC_DOMAIN_ASK_EF_BACKEND);
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Please enter username and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
            
        const res = await fetch(`${process.env.NEXT_PUBLIC_DOMAIN_ASK_EF_BACKEND}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("user", JSON.stringify({ ...data.user, Password: password }));
        router.push("/dashboard");
      } else {
        setError(data.message || "Invalid username or password.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css');

        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; font-family: 'Inter', sans-serif; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-ring {
          0%, 100% { opacity: 0.07; }
          50%       { opacity: 0.13; }
        }

        .login-root {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 100vh;
        }

        /* ── LEFT PANEL ── */
        .login-left {
          background: #003087;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px 52px;
        }
        .ll-mesh {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse at 20% 15%, rgba(0,153,218,.32) 0%, transparent 55%),
            radial-gradient(ellipse at 85% 75%, rgba(0,87,168,.45) 0%, transparent 55%),
            radial-gradient(ellipse at 5%  80%, rgba(0,153,218,.15) 0%, transparent 45%);
          pointer-events: none;
        }
        .ll-dots {
          position: absolute; inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,.07) 1.2px, transparent 1.2px);
          background-size: 26px 26px;
          pointer-events: none;
        }
        .ll-ring {
          position: absolute; border-radius: 50%;
          border: 1px solid rgba(255,255,255,.07);
          pointer-events: none;
          animation: pulse-ring 6s ease-in-out infinite;
        }
        .ll-ring-1 { width: 480px; height: 480px; top: -160px; right: -140px; }
        .ll-ring-2 { width: 300px; height: 300px; top: -40px; right: -30px; border-color: rgba(0,153,218,.16); animation-delay: 2s; }
        .ll-ring-3 { width: 520px; height: 520px; bottom: -200px; left: -160px; animation-delay: 4s; }

        .ll-content { position: relative; z-index: 1; animation: fadeUp 0.7s ease forwards; }

        .ll-mono {
          width: 68px; height: 68px;
          border-radius: 18px;
          background: rgba(255,255,255,.1);
          border: 1.5px solid rgba(255,255,255,.2);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          margin-bottom: 32px;
        }
        .lm-letters {
          font-size: 26px; font-weight: 900;
          color: #fff; letter-spacing: -2px; line-height: 1;
        }
        .lm-sub {
          font-size: 7.5px; font-weight: 700;
          color: rgba(255,255,255,.5);
          letter-spacing: 2px; text-transform: uppercase; margin-top: 2px;
        }
        .ll-eyebrow {
          font-size: 11px; font-weight: 700;
          letter-spacing: 2px; text-transform: uppercase;
          color: #0099DA; margin-bottom: 10px;
        }
        .ll-content h1 {
          font-size: 2rem; font-weight: 800;
          color: #fff; margin: 0 0 12px;
          line-height: 1.15; letter-spacing: -.3px;
        }
        .ll-content h1 em { color: #0099DA; font-style: normal; }
        .ll-content p {
          font-size: 14px; color: rgba(255,255,255,.62);
          line-height: 1.7; margin: 0 0 40px; max-width: 360px;
        }
        .ll-features { display: flex; flex-direction: column; gap: 14px; }
        .ll-feat {
          display: flex; align-items: center; gap: 12px;
          font-size: 13px; color: rgba(255,255,255,.78);
        }
        .ll-feat-icon {
          width: 34px; height: 34px; border-radius: 9px;
          background: rgba(255,255,255,.09);
          border: 1px solid rgba(255,255,255,.12);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; color: #0099DA; flex-shrink: 0;
        }
        .ll-footer {
          position: relative; z-index: 1;
          border-top: 1px solid rgba(255,255,255,.1);
          padding-top: 20px;
        }
        .ll-footer-brand {
          display: flex; align-items: center; gap: 10px; margin-bottom: 8px;
        }
        .ll-footer-brand span {
          font-size: 15px; font-weight: 800;
          color: rgba(255,255,255,.8); letter-spacing: -.3px;
        }
        .ll-footer p {
          font-size: 11px; color: rgba(255,255,255,.36);
          margin: 0; line-height: 1.5;
        }

        /* ── RIGHT PANEL ── */
        .login-right {
          background: #F4F6F9;
          display: flex; align-items: center; justify-content: center;
          padding: 48px 40px;
        }
        .login-box {
          width: 100%; max-width: 400px;
          animation: fadeUp 0.6s ease 0.1s both;
        }
        .lb-header { text-align: center; margin-bottom: 28px; }
        .lb-logo-wrap {
          display: inline-flex; align-items: center; justify-content: center;
          width: 56px; height: 56px;
          background: #fff; border: 1px solid #D8DDE6;
          border-radius: 14px; margin-bottom: 16px;
          box-shadow: 0 2px 8px rgba(0,48,135,.08);
        }
        .lb-logo-wrap i { font-size: 24px; color: #003087; }
        .lb-header h2 {
          font-size: 1.3rem; font-weight: 800;
          color: #003087; margin: 0 0 4px; letter-spacing: -.2px;
        }
        .lb-header p { font-size: 13px; color: #7A8899; margin: 0; }

        .lb-card {
          background: #fff;
          border: 1px solid #D8DDE6;
          border-radius: 12px;
          padding: 32px 32px 28px;
          box-shadow: 0 2px 16px rgba(0,48,135,.06);
        }

        .lb-label {
          display: block;
          font-size: 11.5px; font-weight: 700;
          color: #4A5568; letter-spacing: .4px;
          text-transform: uppercase; margin-bottom: 6px;
        }
        .lb-input {
          width: 100%; height: 44px; font-size: 14px;
          border: 1px solid #D8DDE6; border-radius: 8px;
          background: #F9FAFB; color: #0D1B2E;
          padding: 0 14px; outline: none;
          font-family: 'Inter', sans-serif;
          transition: border-color .15s, box-shadow .15s;
        }
        .lb-input:focus {
          border-color: #003087;
          box-shadow: 0 0 0 3px rgba(0,48,135,.1);
          background: #fff;
        }
        .lb-input::placeholder { color: #B0BAC9; }

        .lb-btn {
          width: 100%; height: 46px;
          background: #003087; border: none;
          color: #fff; font-weight: 700;
          font-size: 14px; border-radius: 8px;
          cursor: pointer; letter-spacing: .3px;
          font-family: 'Inter', sans-serif;
          transition: background .15s, transform .1s;
          display: flex; align-items: center;
          justify-content: center; gap: 8px;
          margin-top: 24px;
        }
        .lb-btn:hover:not(:disabled) { background: #0057A8; }
        .lb-btn:active:not(:disabled) { transform: scale(.99); }
        .lb-btn:disabled { opacity: .7; cursor: not-allowed; }

        .lb-error {
          font-size: 13px; border-radius: 8px;
          padding: 10px 14px; margin-bottom: 20px;
          background: #FEF2F2; border: 1px solid #FECACA;
          color: #DC2626; display: flex; align-items: center; gap: 8px;
        }

        .lb-divider {
          display: flex; align-items: center;
          gap: 12px; margin: 20px 0;
          font-size: 11.5px; color: #B0BAC9;
        }
        .lb-divider::before, .lb-divider::after {
          content: ''; flex: 1; height: 1px; background: #E8EDF3;
        }

        .lb-register {
          text-align: center; font-size: 13px; color: #7A8899;
        }
        .lb-register a {
          color: #003087; font-weight: 700; text-decoration: none;
        }
        .lb-register a:hover { text-decoration: underline; }

        .lb-security {
          display: flex; align-items: center;
          justify-content: center; gap: 6px;
          margin-top: 20px; font-size: 11.5px; color: #B0BAC9;
        }
        .lb-security i { color: #00833E; font-size: 13px; }

        .mb-3 { margin-bottom: 16px; }
        .mb-4 { margin-bottom: 20px; }

        @media (max-width: 768px) {
          .login-root { grid-template-columns: 1fr; }
          .login-left { display: none; }
          .login-right { padding: 32px 20px; background: #fff; }
        }
      `}</style>

      <div className="login-root">

        {/* ── LEFT — Brand panel ── */}
        <div className="login-left">
          <div className="ll-mesh" />
          <div className="ll-dots" />
          <div className="ll-ring ll-ring-1" />
          <div className="ll-ring ll-ring-2" />
          <div className="ll-ring ll-ring-3" />

          <div className="ll-content">
            <div className="ll-mono">
              <span className="lm-letters">EF</span>
              <span className="lm-sub">Ask EF</span>
            </div>

            <div className="ll-eyebrow">Abbott Experience Factory</div>
            <h1>Your <em>single entry point</em><br />for every request</h1>
            <p>Ask EF is Abbott's unified AI assistant — demand intake, project status, reporting, code review, document generation and more. All in one place.</p>

            <div className="ll-features">
              <div className="ll-feat">
                <div className="ll-feat-icon"><i className="bi bi-inbox-fill" /></div>
                Demand Intake
              </div>
              <div className="ll-feat">
                <div className="ll-feat-icon"><i className="bi bi-graph-up-arrow" /></div>
                Project Status &amp; Reporting
              </div>
              <div className="ll-feat">
                <div className="ll-feat-icon"><i className="bi bi-robot" /></div>
                Powered by IBM Watson Orchestrate
              </div>
              <div className="ll-feat">
                <div className="ll-feat-icon"><i className="bi bi-shield-lock-fill" /></div>
                Secure · Role-based · Abbott SSO
              </div>
            </div>
          </div>

          <div className="ll-footer">
            <div className="ll-footer-brand">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#fff" opacity="0.8"/>
                <path d="M2 17l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                <path d="M2 12l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
              </svg>
              <span>Abbott Laboratories</span>
            </div>
            <p>© 2026 Abbott Laboratories &nbsp;·&nbsp; Internal Use Only &nbsp;·&nbsp; Life. To the Fullest.</p>
          </div>
        </div>

        {/* ── RIGHT — Login form ── */}
        <div className="login-right">
          <div className="login-box">

            <div className="lb-header">
              <div className="lb-logo-wrap">
                <i className="bi bi-layers-fill" />
              </div>
              <h2>Welcome back</h2>
              <p>Sign in to your Ask EF account</p>
            </div>

            <div className="lb-card">
              {error && (
                <div className="lb-error">
                  <i className="bi bi-exclamation-circle" />
                  {error}
                </div>
              )}

              <div className="mb-3">
                <label className="lb-label">Username</label>
                <input
                  type="text"
                  className="lb-input"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label className="lb-label">Password</label>
                <input
                  type="password"
                  className="lb-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>

              <button className="lb-btn" onClick={handleLogin} disabled={loading}>
                {loading ? (
                  <>
                    <i className="bi bi-arrow-repeat" style={{ animation: "spin 1s linear infinite" }} />
                    Signing in...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right" />
                    Sign In
                  </>
                )}
              </button>

              <div className="lb-divider">or</div>

              <div className="lb-register">
                New to Ask EF? <a href="#">Create an account</a>
              </div>
            </div>

            <div className="lb-security">
              <i className="bi bi-shield-check-fill" />
              Secured &nbsp;·&nbsp; Abbott Confidential &nbsp;·&nbsp; Internal Access Only
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
