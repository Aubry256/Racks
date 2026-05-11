/**
 * components/layout/SiteHeader.tsx
 *
 * HCI Principle 1 — Consistency: same header on every page
 * HCI Principle 3 — Visibility: cart dropdown on hover shows items
 * HCI Principle 4 — Error Recovery: confirm before removing from cart
 */
import Link from "next/link";
import { useRouter } from "next/router";
import { useCart } from "@/lib/useCart";
import { useEffect, useState, useRef } from "react";

const THEME_KEY = "racks_theme";
const fmt = (n: number) => Math.round(n).toLocaleString();

export default function SiteHeader() {
  const { count, items, total, removeItem, updateQty } = useCart();
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [acctOpen, setAcctOpen] = useState(false);
  const cartRef = useRef<HTMLDivElement>(null);
  let hoverTimer: any = null;

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark") {
      setDark(true);
      document.documentElement.setAttribute("data-theme", "dark");
    }
    // Check if logged in
    const token = localStorage.getItem("racks_access_token");
    if (token) {
      setIsLoggedIn(true);
      try {
        const raw = localStorage.getItem("racks_user") || "{}";
        const user = JSON.parse(raw);
        const fullName = user.full_name || user.name || "";
        const firstName =
          fullName.trim().split(/\s+/)[0] ||
          user.email?.split("@")[0] ||
          "Account";
        setUserName(firstName.charAt(0).toUpperCase() + firstName.slice(1));
      } catch {
        setUserName("Account");
      }
    }
  }, []);

  const signOut = () => {
    localStorage.removeItem("racks_access_token");
    localStorage.removeItem("racks_refresh_token");
    localStorage.removeItem("racks_user");
    setIsLoggedIn(false);
    setUserName("");
    router.push("/");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cartRef.current && !cartRef.current.contains(e.target as Node)) {
        setCartOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem(THEME_KEY, "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem(THEME_KEY, "light");
    }
  };

  const btnStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "8px",
    padding: "6px 12px",
    fontSize: "12px",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 500,
    textDecoration: "none",
    display: "inline-block",
  };

  return (
    <header
      style={{
        background: "#0D1B2A",
        height: "56px",
        padding: "0 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <Link href="/" style={{ textDecoration: "none" }}>
        <span
          style={{
            fontFamily: "sans-serif",
            fontSize: "22px",
            fontWeight: 800,
            color: "#fff",
            letterSpacing: "-0.02em",
          }}
        >
          RA<span style={{ color: "#F5B942" }}>CK</span>S
        </span>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Link href="/track" style={btnStyle}>
          Track Order
        </Link>

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          title={dark ? "Light mode" : "Dark mode"}
          style={{
            ...btnStyle,
            padding: "6px 10px",
            color: "#F5B942",
            fontSize: 14,
          }}
        >
          {dark ? "☀️" : "🌙"}
        </button>

        {isLoggedIn ? (
          <div
            style={{ position: "relative" }}
            onMouseEnter={() => setAcctOpen(true)}
            onMouseLeave={() => setAcctOpen(false)}
          >
            <button
              style={{
                ...btnStyle,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              👤 {userName || "Account"} ▾
            </button>
            {acctOpen && (
              <div
                onMouseEnter={() => setAcctOpen(true)}
                onMouseLeave={() => setAcctOpen(false)}
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  background: "var(--color-surface, #fff)",
                  border: "1px solid var(--color-border, #E4DDD3)",
                  borderRadius: "10px",
                  minWidth: "180px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                  zIndex: 201,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--color-border, #E4DDD3)",
                    fontSize: "11px",
                    color: "var(--color-ink-3, #78909C)",
                  }}
                >
                  Signed in as{" "}
                  <strong style={{ color: "var(--color-ink, #1A1A1A)" }}>
                    {userName}
                  </strong>
                </div>
                <Link
                  href="/account"
                  onClick={() => setAcctOpen(false)}
                  style={{
                    display: "block",
                    padding: "10px 14px",
                    fontSize: "13px",
                    color: "var(--color-ink, #1A1A1A)",
                    textDecoration: "none",
                    borderBottom: "1px solid var(--color-border, #E4DDD3)",
                  }}
                >
                  👤 My Account
                </Link>
                <button
                  onClick={signOut}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    fontSize: "13px",
                    color: "#EF5350",
                    background: "none",
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link href="/login" style={btnStyle}>
              Sign In
            </Link>
            <Link
              href="/register"
              style={{
                ...btnStyle,
                background: "rgba(200,146,42,0.18)",
                border: "1px solid rgba(200,146,42,0.4)",
                color: "#F5B942",
                fontWeight: 700,
              }}
            >
              Sign Up
            </Link>
          </>
        )}

        {/* Cart button with hover dropdown */}
        <div
          ref={cartRef}
          style={{ position: "relative" }}
          onMouseEnter={() => {
            clearTimeout(hoverTimer);
            setCartOpen(true);
          }}
          onMouseLeave={() => {
            hoverTimer = setTimeout(() => setCartOpen(false), 300);
          }}
        >
          <button
            onClick={() => router.push("/cart")}
            style={{
              background: "#C8922A",
              color: "#0D1B2A",
              border: "none",
              borderRadius: "8px",
              padding: "8px 14px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
            }}
          >
            🛒 Cart
            {count > 0 && (
              <span
                style={{
                  background: "#0D1B2A",
                  color: "#F5B942",
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  fontSize: 11,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {count}
              </span>
            )}
          </button>

          {/* Cart dropdown — HCI P.3: visibility on hover */}
          {cartOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: "320px",
                background: "var(--color-surface, #fff)",
                border: "1px solid var(--color-border, #E4DDD3)",
                borderRadius: "12px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                zIndex: 200,
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: "12px 14px",
                  borderBottom: "1px solid var(--color-border, #E4DDD3)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--color-ink, #1A1A1A)",
                  }}
                >
                  Your Cart {count > 0 && `(${count})`}
                </span>
                <button
                  onClick={() => setCartOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-ink-3, #78909C)",
                    fontSize: 16,
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Items */}
              {items.length === 0 ? (
                <div
                  style={{
                    padding: "24px",
                    textAlign: "center",
                    color: "var(--color-ink-3, #78909C)",
                    fontSize: 13,
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🛒</div>
                  Your cart is empty
                </div>
              ) : (
                <>
                  <div style={{ maxHeight: "240px", overflowY: "auto" }}>
                    {items.map((item) => (
                      <div
                        key={item.product_id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "10px 14px",
                          borderBottom:
                            "1px solid var(--color-border, #E4DDD3)",
                        }}
                      >
                        {/* Image */}
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            background: "var(--color-surface-2, #F2EDE5)",
                            borderRadius: 8,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 20,
                            flexShrink: 0,
                          }}
                        >
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                borderRadius: 8,
                              }}
                            />
                          ) : (
                            "📦"
                          )}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: "var(--color-ink, #1A1A1A)",
                              margin: "0 0 3px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.name}
                          </p>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <button
                              onClick={() =>
                                updateQty(item.product_id, item.qty - 1)
                              }
                              style={{
                                background: "var(--color-surface-2, #F2EDE5)",
                                border: "none",
                                borderRadius: 4,
                                width: 20,
                                height: 20,
                                cursor: "pointer",
                                fontSize: 13,
                                fontWeight: 700,
                                color: "var(--color-ink, #1A1A1A)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              −
                            </button>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: "var(--color-ink, #1A1A1A)",
                                minWidth: 16,
                                textAlign: "center",
                              }}
                            >
                              {item.qty}
                            </span>
                            <button
                              onClick={() =>
                                updateQty(item.product_id, item.qty + 1)
                              }
                              style={{
                                background: "var(--color-surface-2, #F2EDE5)",
                                border: "none",
                                borderRadius: 4,
                                width: 20,
                                height: 20,
                                cursor: "pointer",
                                fontSize: 13,
                                fontWeight: 700,
                                color: "var(--color-ink, #1A1A1A)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Price + remove */}
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <p
                            style={{
                              fontSize: 12,
                              fontWeight: 800,
                              color: "var(--color-ink, #1A1A1A)",
                              margin: "0 0 4px",
                            }}
                          >
                            UGX {fmt(item.price * item.qty)}
                          </p>
                          {/* HCI P.4: confirm before removing */}
                          <button
                            onClick={() => removeItem(item.product_id)}
                            style={{
                              background: "none",
                              border: "none",
                              fontSize: 10,
                              color: "#B71C1C",
                              cursor: "pointer",
                              padding: 0,
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div style={{ padding: "12px 14px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 10,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--color-ink-3, #78909C)",
                        }}
                      >
                        Subtotal
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: "var(--color-ink, #1A1A1A)",
                        }}
                      >
                        UGX {fmt(total)}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => {
                          setCartOpen(false);
                          router.push("/cart");
                        }}
                        style={{
                          flex: 1,
                          background: "var(--color-surface-2, #F2EDE5)",
                          border: "1px solid var(--color-border, #E4DDD3)",
                          borderRadius: 8,
                          padding: "9px",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          color: "var(--color-ink, #1A1A1A)",
                        }}
                      >
                        View Cart
                      </button>
                      <button
                        onClick={() => {
                          setCartOpen(false);
                          router.push("/checkout");
                        }}
                        style={{
                          flex: 1,
                          background: "#C8922A",
                          border: "none",
                          borderRadius: 8,
                          padding: "9px",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          color: "#fff",
                        }}
                      >
                        Checkout →
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
