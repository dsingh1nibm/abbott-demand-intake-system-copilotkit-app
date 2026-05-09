"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("user");
    setUser(stored ? JSON.parse(stored) : null);
  }, [pathname]); // re-check on every page change

  const logout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  const showNavbar = user && pathname !== "/login";

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: "sans-serif", backgroundColor: "#f1f5f9", minHeight: "100vh" }}>

        {/* NAVBAR — only shown when logged in */}
        {showNavbar && (
          <nav style={{
            background: "linear-gradient(135deg, #1e3a8a, #2563eb)",
            padding: "0 24px",
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 2px 12px rgba(37,99,235,0.3)",
            position: "sticky",
            top: 0,
            zIndex: 1000,
          }}>
            {/* Left — Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#fff" opacity="0.9"/>
                  <path d="M2 17l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M2 12l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
                </svg>
              </div>
              <span style={{ fontWeight: 700, fontSize: 17, color: "#fff", letterSpacing: "-0.3px" }}>
                Abbott
              </span>
            </div>

            {/* Right — User info + logout */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 700, fontSize: 14,
                }}>
                  {user?.Name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{user?.Name}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{user?.Department}</div>
                </div>
              </div>
              <button
                onClick={logout}
                style={{
                  border: "1px solid rgba(255,255,255,0.3)",
                  background: "transparent", color: "#fff",
                  padding: "6px 14px", borderRadius: 8,
                  cursor: "pointer", fontSize: 13,
                }}
              >
                Sign Out
              </button>
            </div>
          </nav>
        )}

        <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {children}
        </main>

      </body>
    </html>
  );
}