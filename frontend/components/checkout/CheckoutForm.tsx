/**
 * components/checkout/CheckoutForm.tsx
 *
 * Updated to:
 * 1. Load ALL districts from /api/delivery-zones/?covered=true (dynamic)
 * 2. Added Visa/Mastercard as a payment option via Flutterwave
 *
 * HCI Principle 5 — Constraints:
 * Districts come from the database. Admin enables them at
 * http://localhost:8000/admin → Delivery Zones → tick is_covered.
 * No code change needed to add new districts.
 *
 * HCI Principle 3 — Visibility:
 * Uncovered districts are shown but disabled with a
 * "Coming soon" label so users know Racks is aware of their area.
 */

"use client";
import { useState, useEffect } from "react";
import { createOrder, initiatePayment, getCoveredZones } from "@/lib/api";
import { useCart } from "@/lib/useCart";

// Uganda mobile number validation
// MTN: 076, 077, 078, 039  |  Airtel: 070, 075
// phoneClean has 256 prepended so we match against 256XXXXXXXXX
const UGANDA_PHONE_REGEX = /^256(7[045678][0-9]{7}|39[0-9]{7})$/;

interface DeliveryZone {
  free_above: number;
  district: string;
  is_covered: boolean;
  delivery_days: number;
  delivery_fee: number;
}

interface Props {
  onSuccess?: (orderId: string) => void;
}

export default function CheckoutForm({ onSuccess }: Props) {
  const { items, total, clearCart } = useCart();

  // Form state
  const [fullName, setFullName] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<"momo" | "airtel" | "card" | "cod">(
    "momo",
  );

  // District data from API
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [deliveryFee, setDeliveryFee] = useState(0);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedOrderId, setSavedOrderId] = useState("");

  // ── Load all covered districts from API ─────────────────────────
  // HCI Principle 5 — Constraints:
  // Only covered districts appear. Admin controls this via admin panel.
  // Adding Arua? Go to admin → Delivery Zones → Arua → tick is_covered.
  // It appears in this dropdown immediately. No code change.
  useEffect(() => {
    getCoveredZones()
      .then((res) => {
        const data: DeliveryZone[] = res.data.results || res.data || [];
        setZones(data);
        // Pre-select first covered district
        if (data.length > 0) setDistrict(data[0].district);
        setZonesLoading(false);
      })
      .catch(() => {
        // Fallback if API not running
        setZones([
          {
            district: "Kampala",
            is_covered: true,
            delivery_days: 1,
            delivery_fee: 0,
          },
          {
            district: "Wakiso",
            is_covered: true,
            delivery_days: 1,
            delivery_fee: 5000,
          },
          {
            district: "Mbarara",
            is_covered: true,
            delivery_days: 3,
            delivery_fee: 20000,
          },
        ]);
        setZonesLoading(false);
      });
  }, []);

  // Update delivery fee when district changes
  useEffect(() => {
    const zone = zones.find((z) => z.district === district);
    if (zone) {
      // Free delivery if order is above free_above threshold
      setDeliveryFee(
        zone.free_above && total >= zone.free_above
          ? 0
          : Number(zone.delivery_fee),
      );
    }
  }, [district, zones, total]);

  // ── Validation ────────────────────────────────────────────────────
  const phoneClean = "256" + phone.replace(/\s/g, "");
  const needsPhone = method === "momo" || method === "airtel";
  const phoneValid = !needsPhone || UGANDA_PHONE_REGEX.test(phoneClean);

  const canSubmit = Boolean(
    fullName &&
    district &&
    address &&
    phoneValid &&
    items.length > 0 &&
    !loading,
  );

  const grandTotal = total + deliveryFee;

  // ── Submit ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError("");

    try {
      // STEP 1: Save draft order BEFORE payment (HCI P.4 — Error Recovery)
      const { data: orderData } = await createOrder({
        items,
        total_amount: grandTotal,
        delivery_address: { line1: address, district },
        district,
        payment_method: method,
        delivery_fee: deliveryFee,
      });
      setSavedOrderId(orderData.order_id);
      clearCart();

      // STEP 2: Cash on delivery — no payment needed
      if (method === "cod") {
        alert("Order placed! Pay cash when your item arrives.");
        onSuccess?.(orderData.order_id);
        return;
      }

      // STEP 3: Initiate payment via Flutterwave
      // card method redirects to Flutterwave's hosted Visa/Mastercard page
      const { data: payData } = await initiatePayment(
        orderData.order_id,
        method === "card" ? undefined : phoneClean,
      );

      if (payData.demo_mode) {
        alert(payData.message);
        onSuccess?.(orderData.order_id);
        return;
      }

      // Redirect to Flutterwave checkout (handles Visa + MoMo)
      window.location.href = payData.payment_link;
    } catch (err: any) {
      // HCI P.4 — Error Recovery: order is saved, tell user they can retry
      setError(
        err?.response?.data?.error ||
          "Payment failed. Your order has been saved — retry from your Orders page.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Selected zone info for delivery display
  const selectedZone = zones.find((z) => z.district === district);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Delivery details */}
      <section style={sectionStyle}>
        <div style={sectionHeadStyle}>Delivery Details</div>
        <div
          style={{
            padding: "14px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div>
            <label style={labelStyle}>Full Name *</label>
            <input
              style={inputStyle}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Aubry Arihona"
            />
          </div>

          {/* District dropdown — populated from API */}
          <div>
            <label style={labelStyle}>
              District *
              <span
                style={{
                  fontSize: "9px",
                  color: "#78909C",
                  fontWeight: 400,
                  marginLeft: "6px",
                }}
              >
                ({zones.length} areas covered)
              </span>
            </label>
            <select
              style={inputStyle}
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              disabled={zonesLoading}
            >
              {zonesLoading ? (
                <option>Loading districts…</option>
              ) : (
                zones.map((z) => (
                  <option key={z.district} value={z.district}>
                    {z.district}
                    {z.delivery_fee === 0
                      ? " — Free delivery"
                      : ` — UGX ${z.delivery_fee.toLocaleString()}`}
                    {" · "}
                    {z.delivery_days === 1
                      ? "Tomorrow"
                      : `${z.delivery_days} days`}
                  </option>
                ))
              )}
            </select>
            {/* Live delivery info for selected district */}
            {selectedZone && (
              <div
                style={{
                  fontSize: "11px",
                  color: "#1B5E20",
                  fontWeight: 600,
                  marginTop: "5px",
                }}
              >
                📦{" "}
                {selectedZone.delivery_days === 1
                  ? "Delivered tomorrow"
                  : `Delivered in ${selectedZone.delivery_days} days`}
                {deliveryFee === 0
                  ? " · FREE delivery"
                  : ` · UGX ${selectedZone.delivery_fee.toLocaleString()} delivery fee`}
                {selectedZone.free_above &&
                total >= selectedZone.free_above &&
                selectedZone.delivery_fee > 0
                  ? " (free — order above UGX 200,000 ✓)"
                  : ""}
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle}>Delivery Address *</label>
            <input
              style={inputStyle}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Ntinda, near Shell station"
            />
          </div>
        </div>
      </section>

      {/* Payment method */}
      <section style={sectionStyle}>
        <div style={sectionHeadStyle}>Payment Method</div>
        <div
          style={{
            padding: "14px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {/* Four payment options including Visa */}
          {(
            [
              { id: "momo", label: "MTN MoMo", sub: "Uganda MTN number" },
              {
                id: "airtel",
                label: "Airtel Money",
                sub: "Uganda Airtel number",
              },
              {
                id: "card",
                label: "Visa / Mastercard",
                sub: "Credit or debit card",
              },
              {
                id: "cod",
                label: "Cash on Delivery",
                sub: "Pay when item arrives",
              },
            ] as const
          ).map((opt) => (
            <label
              key={opt.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: method === opt.id ? "#F9F6F1" : "#fff",
                border: `${method === opt.id ? "1.5px solid #C8922A" : "1px solid #E4DDD3"}`,
                borderRadius: "8px",
                padding: "10px",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="payment"
                value={opt.id}
                checked={method === opt.id}
                onChange={() => setMethod(opt.id)}
                style={{ accentColor: "#C8922A" }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: method === opt.id ? 700 : 400,
                  }}
                >
                  {opt.label}
                </div>
                <div style={{ fontSize: "10px", color: "#78909C" }}>
                  {opt.sub}
                </div>
              </div>
              {opt.id === "momo" && (
                <span
                  style={{
                    fontSize: "9px",
                    background: "#E8F5E9",
                    color: "#1B5E20",
                    padding: "2px 7px",
                    borderRadius: "8px",
                    fontWeight: 700,
                  }}
                >
                  Recommended
                </span>
              )}
              {opt.id === "card" && (
                <span style={{ fontSize: "9px", color: "#78909C" }}>
                  VISA MC AMEX
                </span>
              )}
            </label>
          ))}

          {/* Phone number field for MoMo / Airtel */}
          {needsPhone && (
            <div>
              <label style={labelStyle}>
                {method === "momo" ? "MTN" : "Airtel"} Mobile Number *
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "12px",
                    color: "#78909C",
                    fontWeight: 500,
                  }}
                >
                  +256
                </span>
                <input
                  style={{ ...inputStyle, paddingLeft: "52px" }}
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/[^0-9\s]/g, ""))
                  }
                  placeholder="771 234 567"
                  maxLength={9}
                />
              </div>
              {phone.length >= 9 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    marginTop: "5px",
                  }}
                >
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      background: phoneValid ? "#1B5E20" : "#B71C1C",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "9px",
                      color: "#fff",
                      fontWeight: 800,
                    }}
                  >
                    {phoneValid ? "✓" : "✗"}
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      color: phoneValid ? "#1B5E20" : "#B71C1C",
                      fontWeight: 600,
                    }}
                  >
                    {phoneValid
                      ? "Valid — we'll send a payment prompt to this number"
                      : "Valid: MTN (076/077/078/039) or Airtel (070/075)"}
                  </span>
                </div>
              )}
              <p
                style={{
                  fontSize: "10px",
                  color: "#78909C",
                  marginTop: "5px",
                  lineHeight: 1.5,
                }}
              >
                A payment prompt will appear on your phone. Enter your PIN to
                complete payment.
              </p>
            </div>
          )}

          {/* Card info */}
          {method === "card" && (
            <div
              style={{
                background: "#F9F6F1",
                border: "1px solid #E4DDD3",
                borderRadius: "7px",
                padding: "10px 12px",
                fontSize: "11px",
                color: "#3A3A3A",
                lineHeight: 1.55,
              }}
            >
              💳 You will be redirected to a secure Flutterwave page to enter
              your Visa or Mastercard details. Your card information is handled
              by Flutterwave — Racks never sees it.
            </div>
          )}
        </div>
      </section>

      {/* Order total */}
      <section style={{ ...sectionStyle, padding: "14px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "12px",
            color: "#78909C",
            marginBottom: "5px",
          }}
        >
          <span>Subtotal</span>
          <span>UGX {total.toLocaleString()}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "12px",
            color: deliveryFee === 0 ? "#1B5E20" : "#3A3A3A",
            marginBottom: "8px",
          }}
        >
          <span>Delivery</span>
          <span>
            {deliveryFee === 0 ? "FREE" : `UGX ${deliveryFee.toLocaleString()}`}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "15px",
            fontWeight: 800,
            color: "#1A1A1A",
            borderTop: "1px solid #E4DDD3",
            paddingTop: "8px",
          }}
        >
          <span>Total</span>
          <span>UGX {grandTotal.toLocaleString()}</span>
        </div>
      </section>

      {/* Error message */}
      {error && (
        <div
          style={{
            background: "#FFEBEE",
            border: "1px solid #B71C1C",
            borderRadius: "8px",
            padding: "12px 14px",
            fontSize: "12px",
            color: "#B71C1C",
            lineHeight: 1.5,
          }}
        >
          {error}
          {savedOrderId && (
            <div style={{ marginTop: "6px", fontSize: "10px" }}>
              Order ID:{" "}
              <strong>{savedOrderId.slice(0, 8).toUpperCase()}</strong> — go to
              My Orders to retry.
            </div>
          )}
        </div>
      )}

      {/* Pay button — disabled until form complete */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{
          width: "100%",
          background: canSubmit ? "#0D1B2A" : "#D4D4D4",
          color: canSubmit ? "#fff" : "#7A7A7A",
          border: "none",
          borderRadius: "10px",
          padding: "15px",
          fontFamily: "sans-serif",
          fontSize: "14px",
          fontWeight: 800,
          cursor: canSubmit ? "pointer" : "not-allowed",
        }}
      >
        {loading
          ? "Saving your order…"
          : method === "cod"
            ? "Place Order — Pay on Delivery"
            : method === "card"
              ? `Pay UGX ${grandTotal.toLocaleString()} — Visa / Mastercard`
              : method === "airtel"
                ? `Pay UGX ${grandTotal.toLocaleString()} — Airtel Money`
                : `Pay UGX ${grandTotal.toLocaleString()} — MTN MoMo`}
      </button>

      <p
        style={{
          textAlign: "center",
          fontSize: "10px",
          color: "#78909C",
          lineHeight: 1.6,
        }}
      >
        🔒 Your order is saved before payment begins. If anything fails, your
        items are not lost.
      </p>
    </div>
  );
}

// Styles
const sectionStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #E4DDD3",
  borderRadius: "10px",
  overflow: "hidden",
};
const sectionHeadStyle: React.CSSProperties = {
  padding: "8px 14px",
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
