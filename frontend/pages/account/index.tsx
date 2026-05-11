/**
 * pages/account/index.tsx
 *
 * Customer account dashboard.
 *
 * Tabs:
 * 1. Orders    → full order history with status and receipt links
 * 2. Wishlist  → saved products
 * 3. Addresses → billing + shipping (separate — HCI P.9 fix)
 * 4. Profile   → name, phone, district, password change
 */

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import api from "@/lib/api";

const TABS = ["Orders", "Wishlist", "Addresses", "Profile"];

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  pending: { bg: "#F3F4F6", color: "#78909C" },
  processing: { bg: "#E8F5E9", color: "#1B5E20" },
  dispatched: { bg: "#FDF3E0", color: "#C8922A" },
  delivered: { bg: "#E8F5E9", color: "#1B5E20" },
  cancelled: { bg: "#FFEBEE", color: "#B71C1C" },
};

export default function AccountPage() {
  const router = useRouter();
  const [tab, setTab] = useState("Orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<{
    billing: any[];
    shipping: any[];
  }>({ billing: [], shipping: [] });
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [pForm, setPForm] = useState({
    full_name: "",
    phone: "",
    district: "",
  });
  const [pwForm, setPwForm] = useState({
    current_password: "",
    new_password: "",
  });
  const [pMessage, setPMessage] = useState("");
  const [pwMessage, setPwMessage] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    const t = router.query.tab as string;
    if (t && ["Orders", "Wishlist", "Addresses", "Profile"].includes(t)) {
      setTab(t);
    }
  }, [router.query.tab]);

  const loadAll = async () => {
    try {
      const [ordersRes, wishlistRes, addressRes, profileRes] =
        await Promise.all([
          api.get("/api/auth/customer/orders/"),
          api.get("/api/auth/customer/wishlist/"),
          api.get("/api/auth/customer/addresses/"),
          api.get("/api/auth/customer/profile/"),
        ]);
      setOrders(ordersRes.data.orders || []);
      setWishlist(wishlistRes.data.items || []);
      setAddresses(addressRes.data);
      setProfile(profileRes.data);
      setPForm({
        full_name: profileRes.data.full_name || "",
        phone: profileRes.data.phone || "",
        district: profileRes.data.district || "",
      });
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (id: number) => {
    try {
      await api.delete(`/api/auth/customer/wishlist/${id}/`);
      setWishlist((w) => w.filter((i) => i.id !== id));
    } catch {}
  };

  const saveProfile = async () => {
    try {
      await api.put("/api/auth/customer/profile/", pForm);
      setPMessage("✓ Profile updated successfully.");
    } catch {
      setPMessage("Failed to update profile.");
    }
  };

  const changePassword = async () => {
    if (!pwForm.current_password || !pwForm.new_password) {
      setPwMessage("Both fields are required.");
      return;
    }
    try {
      await api.put("/api/auth/customer/password/", pwForm);
      setPwMessage("✓ Password changed. Please log in again.");
      setPwForm({ current_password: "", new_password: "" });
    } catch (err: any) {
      setPwMessage(err?.response?.data?.error || "Failed to change password.");
    }
  };

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          color: "#78909C",
        }}
      >
        Loading…
      </div>
    );

  return (
    <>
      <Head>
        <title>My Account — Racks</title>
      </Head>

      {/* Header */}
      <div
        style={{
          background: "#0D1B2A",
          padding: "0 24px",
          height: "52px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link href="/" style={{ textDecoration: "none" }}>
          <span
            style={{
              fontFamily: "sans-serif",
              fontSize: "18px",
              fontWeight: 900,
              color: "#fff",
            }}
          >
            RA<span style={{ color: "#F5B942" }}>CK</span>S
          </span>
        </Link>
        <span style={{ fontSize: "12px", color: "rgba(255,255,255,.5)" }}>
          {profile?.full_name
            ? `Hi, ${profile.full_name.split(" ")[0]}`
            : "My Account"}
        </span>
        <Link
          href="/"
          style={{
            fontSize: "12px",
            color: "rgba(255,255,255,.45)",
            textDecoration: "none",
          }}
        >
          ← Shop
        </Link>
      </div>

      {/* Tabs */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #E4DDD3",
          padding: "0 24px",
          display: "flex",
        }}
      >
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "14px 16px",
              border: "none",
              background: "none",
              fontFamily: "sans-serif",
              fontSize: "13px",
              fontWeight: tab === t ? 700 : 400,
              color: tab === t ? "#0D1B2A" : "#78909C",
              borderBottom:
                tab === t ? "2px solid #C8922A" : "2px solid transparent",
              cursor: "pointer",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div
        style={{
          background: "#F4EFE8",
          minHeight: "calc(100vh - 100px)",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          {/* ── ORDERS ── */}
          {tab === "Orders" && (
            <div>
              <div
                style={{
                  fontFamily: "sans-serif",
                  fontSize: "17px",
                  fontWeight: 800,
                  color: "#0D1B2A",
                  marginBottom: "14px",
                }}
              >
                Order History ({orders.length})
              </div>
              {orders.length === 0 ? (
                <div
                  style={{
                    background: "#fff",
                    border: "1px solid #E4DDD3",
                    borderRadius: "10px",
                    padding: "32px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "28px", marginBottom: "8px" }}>
                    🛒
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#0D1B2A",
                      marginBottom: "6px",
                    }}
                  >
                    No orders yet
                  </div>
                  <Link
                    href="/"
                    style={{
                      display: "inline-block",
                      background: "#C8922A",
                      color: "#0D1B2A",
                      borderRadius: "7px",
                      padding: "9px 18px",
                      fontWeight: 700,
                      fontSize: "12px",
                      textDecoration: "none",
                    }}
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {orders.map((order: any) => {
                    const s =
                      STATUS_STYLES[order.status] || STATUS_STYLES.pending;
                    return (
                      <div
                        key={order.id}
                        style={{
                          background: "#fff",
                          border: "1px solid #E4DDD3",
                          borderRadius: "10px",
                          padding: "14px 16px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "6px",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontFamily: "monospace",
                                fontSize: "11px",
                                color: "#78909C",
                                marginBottom: "2px",
                              }}
                            >
                              #{order.id.slice(0, 8).toUpperCase()}
                            </div>
                            <div
                              style={{
                                fontSize: "13px",
                                fontWeight: 600,
                                color: "#1A1A1A",
                              }}
                            >
                              {order.first_item}
                              {order.item_count > 1 && (
                                <span
                                  style={{
                                    fontSize: "11px",
                                    color: "#78909C",
                                    marginLeft: "4px",
                                  }}
                                >
                                  +{order.item_count - 1} more
                                </span>
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#78909C",
                                marginTop: "2px",
                              }}
                            >
                              {new Date(order.created_at).toLocaleDateString(
                                "en-UG",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}{" "}
                              · {order.district}
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div
                              style={{
                                fontFamily: "sans-serif",
                                fontSize: "14px",
                                fontWeight: 800,
                                color: "#0D1B2A",
                                marginBottom: "4px",
                              }}
                            >
                              UGX {Number(order.total_amount).toLocaleString()}
                            </div>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                padding: "3px 8px",
                                borderRadius: "8px",
                                background: s.bg,
                                color: s.color,
                              }}
                            >
                              {order.status}
                            </span>
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            marginTop: "8px",
                            paddingTop: "8px",
                            borderTop: "1px solid #F2EDE5",
                          }}
                        >
                          <Link
                            href={`/order/${order.id}`}
                            style={{
                              flex: 1,
                              textAlign: "center",
                              background: "#F2EDE5",
                              color: "#0D1B2A",
                              borderRadius: "6px",
                              padding: "7px",
                              fontSize: "11px",
                              fontWeight: 600,
                              textDecoration: "none",
                            }}
                          >
                            Track Order
                          </Link>
                          <Link
                            href={`/order/${order.id}/receipt`}
                            style={{
                              flex: 1,
                              textAlign: "center",
                              background: "#F9F6F1",
                              color: "#3A3A3A",
                              borderRadius: "6px",
                              padding: "7px",
                              fontSize: "11px",
                              fontWeight: 600,
                              textDecoration: "none",
                              border: "1px solid #E4DDD3",
                            }}
                          >
                            🧾 Receipt
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── WISHLIST ── */}
          {tab === "Wishlist" && (
            <div>
              <div
                style={{
                  fontFamily: "sans-serif",
                  fontSize: "17px",
                  fontWeight: 800,
                  color: "#0D1B2A",
                  marginBottom: "14px",
                }}
              >
                Wishlist ({wishlist.length})
              </div>
              {wishlist.length === 0 ? (
                <div
                  style={{
                    background: "#fff",
                    border: "1px solid #E4DDD3",
                    borderRadius: "10px",
                    padding: "32px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "28px", marginBottom: "8px" }}>♡</div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#0D1B2A",
                      marginBottom: "6px",
                    }}
                  >
                    Your wishlist is empty
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#78909C",
                      marginBottom: "14px",
                    }}
                  >
                    Tap the ♡ on any product to save it here.
                  </div>
                  <Link
                    href="/"
                    style={{
                      display: "inline-block",
                      background: "#C8922A",
                      color: "#0D1B2A",
                      borderRadius: "7px",
                      padding: "9px 18px",
                      fontWeight: 700,
                      fontSize: "12px",
                      textDecoration: "none",
                    }}
                  >
                    Browse Products
                  </Link>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
                    gap: "10px",
                  }}
                >
                  {wishlist.map((item: any) => (
                    <div
                      key={item.id}
                      style={{
                        background: "#fff",
                        border: "1px solid #E4DDD3",
                        borderRadius: "10px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100px",
                          background: "#F4EFE8",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "36px",
                        }}
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            style={{
                              height: "100%",
                              objectFit: "cover",
                              width: "100%",
                            }}
                          />
                        ) : (
                          "📦"
                        )}
                      </div>
                      <div style={{ padding: "10px" }}>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#78909C",
                            marginBottom: "2px",
                          }}
                        >
                          {item.brand}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#1A1A1A",
                            marginBottom: "6px",
                            lineHeight: 1.3,
                          }}
                        >
                          {item.name}
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 800,
                            color: "#0D1B2A",
                            marginBottom: "8px",
                          }}
                        >
                          UGX {Number(item.price).toLocaleString()}
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <Link
                            href={`/product/${item.product_id}`}
                            style={{
                              flex: 1,
                              textAlign: "center",
                              background: "#0D1B2A",
                              color: "#fff",
                              borderRadius: "5px",
                              padding: "6px",
                              fontSize: "11px",
                              fontWeight: 600,
                              textDecoration: "none",
                            }}
                          >
                            View
                          </Link>
                          <button
                            onClick={() => removeFromWishlist(item.id)}
                            style={{
                              background: "#FFEBEE",
                              color: "#B71C1C",
                              border: "none",
                              borderRadius: "5px",
                              padding: "6px 8px",
                              fontSize: "13px",
                              cursor: "pointer",
                            }}
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ADDRESSES ── */}
          {tab === "Addresses" && (
            <div>
              <div
                style={{
                  fontFamily: "sans-serif",
                  fontSize: "17px",
                  fontWeight: 800,
                  color: "#0D1B2A",
                  marginBottom: "6px",
                }}
              >
                Saved Addresses
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#78909C",
                  marginBottom: "16px",
                }}
              >
                Billing and shipping are stored separately — you can use
                different addresses for each.
              </div>
              {(["billing", "shipping"] as const).map((type) => (
                <div key={type} style={{ marginBottom: "20px" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#78909C",
                      textTransform: "uppercase",
                      letterSpacing: ".07em",
                      marginBottom: "8px",
                    }}
                  >
                    {type === "billing"
                      ? "💳 Billing Addresses"
                      : "🚚 Shipping / Delivery Addresses"}
                  </div>
                  {addresses[type].length === 0 ? (
                    <div
                      style={{
                        background: "#fff",
                        border: "1px dashed #E4DDD3",
                        borderRadius: "8px",
                        padding: "16px",
                        textAlign: "center",
                        fontSize: "12px",
                        color: "#78909C",
                      }}
                    >
                      No {type} address saved yet
                    </div>
                  ) : (
                    addresses[type].map((addr: any) => (
                      <div
                        key={addr.id}
                        style={{
                          background: "#fff",
                          border: "1px solid #E4DDD3",
                          borderRadius: "8px",
                          padding: "12px 14px",
                          marginBottom: "6px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: "13px",
                              fontWeight: 700,
                              color: "#1A1A1A",
                              marginBottom: "2px",
                            }}
                          >
                            {addr.label}
                            {addr.is_default && (
                              <span
                                style={{
                                  marginLeft: "8px",
                                  background: "#E8F5E9",
                                  color: "#1B5E20",
                                  fontSize: "9px",
                                  fontWeight: 700,
                                  padding: "1px 6px",
                                  borderRadius: "8px",
                                }}
                              >
                                Default
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "12px", color: "#78909C" }}>
                            {addr.line1}, {addr.district}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── PROFILE ── */}
          {tab === "Profile" && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <section style={sectionStyle}>
                <div style={sectionHeadStyle}>Personal Information</div>
                <div
                  style={{
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div>
                    <label style={labelStyle}>Full Name</label>
                    <input
                      style={inputStyle}
                      value={pForm.full_name}
                      onChange={(e) =>
                        setPForm((f) => ({ ...f, full_name: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone Number</label>
                    <input
                      style={inputStyle}
                      value={pForm.phone}
                      onChange={(e) =>
                        setPForm((f) => ({ ...f, phone: e.target.value }))
                      }
                      placeholder="0771234567"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Default District</label>
                    <input
                      style={inputStyle}
                      value={pForm.district}
                      onChange={(e) =>
                        setPForm((f) => ({ ...f, district: e.target.value }))
                      }
                      placeholder="e.g. Kampala"
                    />
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#78909C",
                        marginTop: "3px",
                      }}
                    >
                      Saves time at checkout — pre-fills your district
                      automatically
                    </div>
                  </div>
                  {pMessage && (
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: pMessage.startsWith("✓") ? "#1B5E20" : "#B71C1C",
                      }}
                    >
                      {pMessage}
                    </div>
                  )}
                  <button
                    onClick={saveProfile}
                    style={{
                      background: "#0D1B2A",
                      color: "#fff",
                      border: "none",
                      borderRadius: "7px",
                      padding: "10px",
                      fontFamily: "sans-serif",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              </section>

              <section style={sectionStyle}>
                <div style={sectionHeadStyle}>Change Password</div>
                <div
                  style={{
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div>
                    <label style={labelStyle}>Current Password</label>
                    <input
                      style={inputStyle}
                      type="password"
                      value={pwForm.current_password}
                      onChange={(e) =>
                        setPwForm((f) => ({
                          ...f,
                          current_password: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>New Password</label>
                    <input
                      style={inputStyle}
                      type="password"
                      value={pwForm.new_password}
                      onChange={(e) =>
                        setPwForm((f) => ({
                          ...f,
                          new_password: e.target.value,
                        }))
                      }
                      placeholder="Minimum 8 characters"
                    />
                  </div>
                  {pwMessage && (
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: pwMessage.startsWith("✓")
                          ? "#1B5E20"
                          : "#B71C1C",
                      }}
                    >
                      {pwMessage}
                    </div>
                  )}
                  <button
                    onClick={changePassword}
                    style={{
                      background: "#0D1B2A",
                      color: "#fff",
                      border: "none",
                      borderRadius: "7px",
                      padding: "10px",
                      fontFamily: "sans-serif",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Change Password
                  </button>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const sectionStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #E4DDD3",
  borderRadius: "10px",
  overflow: "hidden",
};
const sectionHeadStyle: React.CSSProperties = {
  padding: "8px 16px",
  background: "#F2EDE5",
  borderBottom: "1px solid #E4DDD3",
  fontSize: "10px",
  fontWeight: 700,
  color: "#1A1A1A",
  textTransform: "uppercase",
  letterSpacing: ".07em",
};
const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "10px",
  fontWeight: 700,
  color: "#3A3A3A",
  textTransform: "uppercase",
  letterSpacing: ".07em",
  marginBottom: "4px",
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#F9F6F1",
  border: "1px solid #E4DDD3",
  borderRadius: "7px",
  padding: "9px 11px",
  fontSize: "12px",
  color: "#1A1A1A",
  outline: "none",
  boxSizing: "border-box",
};
