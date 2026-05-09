"use client";

import React, { useState } from "react";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ✍️ WRITE YOUR LOGIC HERE
  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // Replace this URL with your FastAPI endpoint (e.g., http://localhost:8000/login)
      const response = await fetch("/api/auth/login", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "testuser",
          password: "password123",
        }),
      });

      if (response.ok) {
        setIsLoggedIn(true);
        console.log("Logged in successfully!");
      } else {
        console.error("Login failed");
      }
    } catch (error) {
      console.error("Network error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <nav style={{ /* ... your styles ... */ }}>
      <div>AI Chat App</div>
      
      <button 
        onClick={handleLogin} // 👈 LINK THE FUNCTION HERE
        disabled={isLoading}
        style={{
          padding: "8px 16px",
          backgroundColor: isLoggedIn ? "#4CAF50" : "#0070f3",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: isLoading ? "not-allowed" : "pointer"
        }}
      >
        {isLoading ? "Loading..." : isLoggedIn ? "Logged In" : "Login"}
      </button>
    </nav>
  );
}