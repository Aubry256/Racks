/**
 * components/promotions/FlashSaleBanner.tsx
 *
 * HCI Principle 3 — Visibility: live countdown from API data
 * HCI Principle 2 — Feedback: timer updates every second
 *
 * vs Dombelo: no promotions system, no countdown, no flash sales
 */
import { useEffect, useState } from "react";

interface Props {
  name: string;
  discountPct: number;
  endsAt: string; // ISO datetime from API
}

export default function FlashSaleBanner({ name, discountPct, endsAt }: Props) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const tick = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Ended");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  return (
    <div
      style={{
        background: "var(--color-danger)",
        borderRadius: "10px",
        padding: "13px 18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 22 }}>⚡</span>
        <div>
          <p
            style={{ fontWeight: 800, color: "#fff", margin: 0, fontSize: 14 }}
          >
            {name} — Up to {discountPct}% off
          </p>
          <p
            style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", margin: 0 }}
          >
            Today only · Free delivery in Kampala
          </p>
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p
          style={{
            fontSize: 9,
            color: "rgba(255,255,255,0.55)",
            textTransform: "uppercase",
            margin: "0 0 3px",
          }}
        >
          Ends in
        </p>
        <p
          style={{
            fontFamily: "monospace",
            fontSize: 20,
            fontWeight: 800,
            color: "#fff",
            margin: 0,
          }}
        >
          {timeLeft || "00:00:00"}
        </p>
      </div>
    </div>
  );
}
