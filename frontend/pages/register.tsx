/**
 * pages/register.tsx
 *
 * HCI Principle 5 — Constraints: phone only accepts Uganda numbers
 * HCI Principle 2 — Feedback: inline validation on each field
 * HCI Principle 4 — Error Recovery: account saved in DB permanently
 */
"use client";
import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { register } from "@/lib/api";

const UGANDA_PHONE = /^(07[0-9]{8}|256[0-9]{9})$/;
const DISTRICTS = [
  "Kampala",
  "Wakiso",
  "Mukono",
  "Entebbe",
  "Jinja",
  "Mbarara",
  "Gulu",
  "Mbale",
  "Masaka",
  "Lira",
  "Arua",
  "Kabale",
  "Fortportal",
  "Soroti",
  "Hoima",
  "Kasese",
  "Bushenyi",
  "Iganga",
  "Tororo",
  "Busia",
  "Adjumani",
  "Moroto",
  "Kotido",
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    district: "Kampala",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("racks_access_token");
      if (token) setAlreadyLoggedIn(true);
    }
  }, []);

  const set = (key: string) => (e: any) => {
    let val = e.target.value;
    // Phone — only allow digits, +, spaces
    if (key === "phone") val = val.replace(/[^0-9+ ]/g, "");
    setForm((f) => ({ ...f, [key]: val }));
  };

  const blur = (key: string) => () =>
    setTouched((t) => ({ ...t, [key]: true }));

  // Validation
  const phoneOk = UGANDA_PHONE.test(form.phone.replace(/\s/g, ""));
  const emailOk = form.email.includes("@") && form.email.includes(".");
  const passwordOk = form.password.length >= 8;
  const nameOk = form.full_name.trim().length >= 2;
  const formValid =
    emailOk && passwordOk && nameOk && (form.phone === "" || phoneOk);

  const handleRegister = async () => {
    setTouched({ email: true, password: true, full_name: true, phone: true });
    if (!formValid) {
      setError("Please fix the errors above before continuing.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await register(form);
      localStorage.setItem("racks_access_token", data.access);
      localStorage.setItem("racks_refresh_token", data.refresh);
      // Save full user object — fallback to email if full_name missing
      const userData = {
        id: data.user?.id || "",
        email: data.user?.email || email || "",
        full_name:
          data.user?.full_name || data.user?.email?.split("@")[0] || "User",
        role: data.user?.role || "customer",
        district: data.user?.district || "",
        phone: data.user?.phone || "",
      };
      localStorage.setItem("racks_user", JSON.stringify(userData));
      setSuccess(
        `Welcome to Racks${data.user?.full_name ? ", " + data.user.full_name.split(" ")[0] : ""}! Your account is ready.`,
      );
      setTimeout(() => router.replace("/"), 2000);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.email?.[0] ||
          "Could not create account. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Already logged in screen
  if (alreadyLoggedIn)
    return (
      <>
        <Head>
          <title>Create Account — Racks</title>
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
                You already have an account
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "rgba(255,255,255,.4)",
                  margin: 0,
                }}
              >
                You're signed in on this device. No need to register again.
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
        <title>Create Account — Racks</title>
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
        <div style={{ width: "100%", maxWidth: "420px" }}>
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <span
                style={{
                  fontFamily: "sans-serif",
                  fontSize: "30px",
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
                marginTop: "5px",
              }}
            >
              Create your account — it's free
            </div>
          </div>

          <div
            style={{
              background: "#162435",
              borderRadius: "16px",
              padding: "26px 22px",
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
                  marginBottom: "14px",
                  fontSize: "13px",
                  color: "#EF5350",
                }}
              >
                {error}
              </div>
            )}
            {success && (
              <div
                style={{
                  background: "rgba(27,94,32,.2)",
                  border: "1px solid #2E7D32",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  marginBottom: "14px",
                  fontSize: "13px",
                  color: "#66BB6A",
                }}
              >
                {success}
              </div>
            )}

            {/* Full Name */}
            <div style={{ marginBottom: "12px" }}>
              <label style={lbl}>Full Name</label>
              <input
                style={{
                  ...inp,
                  borderColor:
                    touched.full_name && !nameOk
                      ? "#B71C1C"
                      : "rgba(255,255,255,.12)",
                }}
                type="text"
                value={form.full_name}
                onChange={set("full_name")}
                onBlur={blur("full_name")}
                placeholder="e.g. Aisha Nakato"
                autoComplete="name"
              />
              {touched.full_name && !nameOk && (
                <div style={hint}>Enter your full name</div>
              )}
            </div>

            {/* Email */}
            <div style={{ marginBottom: "12px" }}>
              <label style={lbl}>Email Address *</label>
              <input
                style={{
                  ...inp,
                  borderColor:
                    touched.email && !emailOk
                      ? "#B71C1C"
                      : "rgba(255,255,255,.12)",
                }}
                type="email"
                value={form.email}
                onChange={set("email")}
                onBlur={blur("email")}
                placeholder="you@example.com"
                autoComplete="email"
              />
              {touched.email && !emailOk && (
                <div style={hint}>Enter a valid email address</div>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: "12px" }}>
              <label style={lbl}>Password *</label>
              <input
                style={{
                  ...inp,
                  borderColor:
                    touched.password && !passwordOk
                      ? "#B71C1C"
                      : "rgba(255,255,255,.12)",
                }}
                type="password"
                value={form.password}
                onChange={set("password")}
                onBlur={blur("password")}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
              />
              {touched.password && !passwordOk && (
                <div style={hint}>Password must be at least 8 characters</div>
              )}
              {form.password.length >= 8 && (
                <div style={{ ...hint, color: "#66BB6A" }}>✓ Strong enough</div>
              )}
            </div>

            {/* Phone — HCI P.5: only digits allowed, Uganda format */}
            <div style={{ marginBottom: "12px" }}>
              <label style={lbl}>Phone Number (MoMo)</label>
              <input
                style={{
                  ...inp,
                  borderColor:
                    touched.phone && form.phone && !phoneOk
                      ? "#B71C1C"
                      : touched.phone && phoneOk
                        ? "#2E7D32"
                        : "rgba(255,255,255,.12)",
                }}
                type="tel"
                inputMode="numeric"
                value={form.phone}
                onChange={set("phone")}
                onBlur={blur("phone")}
                placeholder="e.g. 0771234567"
                maxLength={13}
                autoComplete="tel"
              />
              {touched.phone && form.phone && !phoneOk && (
                <div style={hint}>
                  Valid: MTN (076, 077, 078, 039) or Airtel (070, 075)
                </div>
              )}
              {touched.phone && phoneOk && (
                <div style={{ ...hint, color: "#66BB6A" }}>
                  ✓ Valid MTN / Airtel number
                </div>
              )}
              {!touched.phone && (
                <div style={{ ...hint, color: "rgba(255,255,255,.25)" }}>
                  Your MTN or Airtel number for MoMo payments
                </div>
              )}
            </div>

            {/* District */}
            <div style={{ marginBottom: "20px" }}>
              <label style={lbl}>Your District</label>
              <select
                value={form.district}
                onChange={set("district")}
                style={{ ...inp, cursor: "pointer" }}
              >
                {DISTRICTS.map((d) => (
                  <option key={d} value={d} style={{ background: "#162435" }}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleRegister}
              disabled={loading}
              style={{
                width: "100%",
                background: loading
                  ? "#546E7A"
                  : formValid
                    ? "#C8922A"
                    : "rgba(200,146,42,0.4)",
                color: loading ? "#fff" : "#0D1B2A",
                border: "none",
                borderRadius: "10px",
                padding: "14px",
                fontFamily: "sans-serif",
                fontSize: "14px",
                fontWeight: 800,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background .2s",
              }}
            >
              {loading ? "Creating account…" : "Create Account"}
            </button>

            <div
              style={{
                textAlign: "center",
                marginTop: "16px",
                fontSize: "13px",
                color: "rgba(255,255,255,.4)",
              }}
            >
              Already have an account?{" "}
              <Link
                href="/login"
                style={{
                  color: "#F5B942",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Sign In
              </Link>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <Link
              href="/"
              style={{
                fontSize: "12px",
                color: "rgba(255,255,255,.3)",
                textDecoration: "none",
              }}
            >
              ← Continue browsing without an account
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
const hint: React.CSSProperties = {
  fontSize: "10px",
  color: "#EF5350",
  marginTop: "4px",
};
