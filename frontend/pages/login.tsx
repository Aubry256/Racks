/**
 * pages/login.tsx
 * HCI Principle 1 — Consistency: redirects logged-in users cleanly
 * HCI Principle 2 — Feedback: specific error messages
 */
"use client";
import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("racks_access_token");
      if (token) setAlreadyLoggedIn(true);
    }
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await login(email, password);

      localStorage.setItem("racks_access_token", data.access);
      localStorage.setItem("racks_refresh_token", data.refresh);

      // Save user data explicitly — never rely on data.user being non-null
      localStorage.setItem(
        "racks_user",
        JSON.stringify({
          id: data.user?.id || "",
          email: data.user?.email || email,
          full_name: data.user?.full_name || "",
          role: data.user?.role || "customer",
          district: data.user?.district || "",
          phone: data.user?.phone || "",
        }),
      );

      const role = data.user?.role;
      if (role === "vendor") router.replace("/vendor/dashboard");
      else if (role === "admin") router.replace("/admin/dashboard");
      else router.replace("/");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.error;
      setError(msg || "Incorrect email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (alreadyLoggedIn)
    return (
      <>
        <Head>
          <title>Login — Racks</title>
        </Head>
        <div
          style={{
            minHeight: "100vh",
            background: "#0D1B2A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{ textAlign: "center", maxWidth: "360px", width: "100%" }}
          >
            <div
              style={{
                fontFamily: "sans-serif",
                fontSize: "28px",
                fontWeight: 900,
                color: "#fff",
                marginBottom: "20px",
              }}
            >
              RA<span style={{ color: "#F5B942" }}>CK</span>S
            </div>
            <div
              style={{
                background: "rgba(27,94,32,.15)",
                border: "1px solid #2E7D32",
                borderRadius: "12px",
                padding: "22px",
                marginBottom: "16px",
              }}
            >
              <div style={{ fontSize: "36px", marginBottom: "10px" }}>✅</div>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#66BB6A",
                  marginBottom: "6px",
                }}
              >
                You are already signed in
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "rgba(255,255,255,.4)",
                  margin: 0,
                }}
              >
                You have an active session on this device.
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <a
                href="/"
                style={{
                  flex: 1,
                  background: "#C8922A",
                  color: "#0D1B2A",
                  borderRadius: "8px",
                  padding: "11px",
                  textAlign: "center",
                  fontWeight: 700,
                  fontSize: "13px",
                  textDecoration: "none",
                  display: "block",
                }}
              >
                Continue Shopping
              </a>
              <button
                onClick={() => {
                  localStorage.removeItem("racks_access_token");
                  localStorage.removeItem("racks_refresh_token");
                  localStorage.removeItem("racks_user");
                  setAlreadyLoggedIn(false);
                }}
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,.07)",
                  border: "1px solid rgba(255,255,255,.15)",
                  color: "#fff",
                  borderRadius: "8px",
                  padding: "11px",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </>
    );

  return (
    <>
      <Head>
        <title>Login — Racks</title>
      </Head>
      <div
        style={{
          minHeight: "100vh",
          background: "#0D1B2A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div style={{ width: "100%", maxWidth: "380px" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <span
                style={{
                  fontFamily: "sans-serif",
                  fontSize: "32px",
                  fontWeight: 900,
                  color: "#fff",
                }}
              >
                RA<span style={{ color: "#F5B942" }}>CK</span>S
              </span>
            </Link>
            <div
              style={{
                fontSize: "13px",
                color: "rgba(255,255,255,.4)",
                marginTop: "6px",
              }}
            >
              Sign in to your account
            </div>
          </div>

          <div
            style={{
              background: "#162435",
              borderRadius: "16px",
              padding: "28px 24px",
              border: "1px solid #1E3348",
            }}
          >
            {error && (
              <div
                style={{
                  background: "rgba(183,28,28,.15)",
                  border: "1px solid #B71C1C",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  marginBottom: "16px",
                  fontSize: "13px",
                  color: "#EF5350",
                  lineHeight: 1.5,
                }}
              >
                {error}
              </div>
            )}

            <div style={{ marginBottom: "14px" }}>
              <label style={lbl}>Email Address</label>
              <input
                style={inp}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "5px",
                }}
              >
                <label style={lbl}>Password</label>
                <Link
                  href="/forgot-password"
                  style={{
                    fontSize: "11px",
                    color: "rgba(255,255,255,.4)",
                    textDecoration: "none",
                  }}
                >
                  Forgot password?
                </Link>
              </div>
              <input
                style={inp}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="Your password"
                autoComplete="current-password"
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                width: "100%",
                background: loading ? "#546E7A" : "#C8922A",
                color: loading ? "#fff" : "#0D1B2A",
                border: "none",
                borderRadius: "10px",
                padding: "14px",
                fontFamily: "sans-serif",
                fontSize: "14px",
                fontWeight: 800,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>

            <div
              style={{
                textAlign: "center",
                marginTop: "18px",
                fontSize: "13px",
                color: "rgba(255,255,255,.4)",
              }}
            >
              New to Racks?{" "}
              <Link
                href="/register"
                style={{
                  color: "#F5B942",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Create an account
              </Link>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <Link
              href="/"
              style={{
                fontSize: "12px",
                color: "rgba(255,255,255,.3)",
                textDecoration: "none",
              }}
            >
              ← Continue browsing without signing in
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

const lbl: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 700,
  color: "rgba(255,255,255,.5)",
  textTransform: "uppercase",
  letterSpacing: ".07em",
  marginBottom: "5px",
};
const inp: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: "8px",
  padding: "11px 13px",
  fontSize: "13px",
  color: "#fff",
  outline: "none",
  boxSizing: "border-box",
};
