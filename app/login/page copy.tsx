"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
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
      const res = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username, password: password }),
      });
      const data = await res.json();
      if (data.success) {
        // Store user in localStorage
        localStorage.setItem("user", JSON.stringify(data.user));
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
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(3deg); }
        }
        @keyframes floatReverse {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(20px) rotate(-3deg); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        .login-card { animation: fadeUp 0.6s ease forwards; }
        .shape1 { animation: float 6s ease-in-out infinite; }
        .shape2 { animation: floatReverse 8s ease-in-out infinite; }
        .shape3 { animation: float 10s ease-in-out infinite 2s; }
        .glow { animation: pulse 3s ease-in-out infinite; }

        .login-input {
          width: 100%;
          padding: 13px 16px;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          background: #f8fafc;
          color: #1e293b;
          transition: border-color 0.2s, background 0.2s;
        }
        .login-input:focus {
          border-color: #2563eb;
          background: #fff;
        }
        .login-btn {
          width: 100%;
          padding: 13px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
          box-shadow: 0 4px 16px rgba(37,99,235,0.35);
        }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(37,99,235,0.45);
        }
        .login-btn:disabled { opacity: 0.7; cursor: not-allowed; }
      `}</style>

      <div style={pageWrap}>
        {/* Background shapes */}
        <div className="shape1" style={{ ...shape, width: 320, height: 320, top: -80, left: -80, background: "rgba(37,99,235,0.12)" }} />
        <div className="shape2" style={{ ...shape, width: 200, height: 200, bottom: 60, right: -60, background: "rgba(99,102,241,0.1)" }} />
        <div className="shape3" style={{ ...shape, width: 140, height: 140, top: "40%", right: "15%", background: "rgba(16,185,129,0.08)" }} />
        <div className="glow" style={glowDot} />

        {/* Card */}
        <div className="login-card" style={card}>
          {/* Logo / Brand */}
          <div style={brand}>
            <div style={logoBox}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#fff" opacity="0.9"/>
                <path d="M2 17l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                <path d="M2 12l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: "#0f172a", letterSpacing: "-0.5px" }}>
                Abbott
              </div>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                Demand Intake System
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <h1 style={heading}>Welcome back</h1>
            <p style={subheading}>Sign in to your account to continue</p>
          </div>

          {/* Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>Username</label>
              <input
                className="login-input"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                autoFocus
              />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input
                className="login-input"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>

            {error && (
              <div style={errorBox}>
                <span>⚠️</span> {error}
              </div>
            )}

            <button className="login-btn" onClick={handleLogin} disabled={loading}>
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const pageWrap: any = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 50%, #f0fdf4 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  overflow: "hidden",
  padding: 20,
};

const shape: any = {
  position: "absolute",
  borderRadius: "50%",
  filter: "blur(40px)",
};

const glowDot: any = {
  position: "absolute",
  width: 500,
  height: 500,
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
};

const card: any = {
  background: "#fff",
  borderRadius: 20,
  padding: "36px 40px",
  width: "100%",
  maxWidth: 420,
  boxShadow: "0 20px 60px rgba(15,23,42,0.1), 0 1px 0 rgba(255,255,255,0.8) inset",
  position: "relative",
  zIndex: 1,
  border: "1px solid rgba(226,232,240,0.8)",
};

const brand: any = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 32,
};

const logoBox: any = {
  width: 44,
  height: 44,
  borderRadius: 12,
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
};

const heading: any = {
  fontFamily: "'Syne', sans-serif",
  fontWeight: 700,
  fontSize: 26,
  color: "#0f172a",
  letterSpacing: "-0.5px",
  marginBottom: 6,
};

const subheading: any = {
  fontSize: 14,
  color: "#64748b",
  fontWeight: 400,
};

const labelStyle: any = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 6,
  letterSpacing: "0.3px",
};

const errorBox: any = {
  background: "#fef2f2",
  border: "1px solid #fecaca",
  color: "#dc2626",
  padding: "10px 14px",
  borderRadius: 8,
  fontSize: 13,
  display: "flex",
  alignItems: "center",
  gap: 8,
};
