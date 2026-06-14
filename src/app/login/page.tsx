"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error ?? "Incorrect password");
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}
      className="bg-gray-50"
    >
      <div style={{ width: "100%", maxWidth: 360, padding: "0 16px" }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#4f46e5",
              margin: "0 auto 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5z"
                stroke="white"
                strokeWidth="1.5"
              />
              <path d="M7 9h10M7 12h6M7 15h8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111", margin: 0 }}>
            Meridian
          </h1>
          <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>Lilium Labs</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          style={{
            background: "white",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            padding: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,.07)",
          }}
        >
          <label
            htmlFor="password"
            style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
            placeholder="••••••••"
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: 14,
              borderRadius: 8,
              border: "1px solid #d1d5db",
              outline: "none",
              boxSizing: "border-box",
              color: "#111",
              background: "white",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#4f46e5")}
            onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
          />

          {error && (
            <p style={{ marginTop: 8, fontSize: 13, color: "#dc2626" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 16,
              width: "100%",
              padding: "9px 0",
              borderRadius: 8,
              background: loading ? "#818cf8" : "#4f46e5",
              color: "white",
              fontSize: 14,
              fontWeight: 500,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}
          >
            {loading ? "Verifying…" : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
