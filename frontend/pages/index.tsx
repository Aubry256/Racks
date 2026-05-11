/**
 * pages/index.tsx — Racks Homepage
 * Compact Jumia-style header + working category filter by ID
 */
import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import SiteHeader from "@/components/layout/SiteHeader";
import ProductCard from "@/components/product/ProductCard";
import FlashSaleBanner from "@/components/promotions/FlashSaleBanner";
import OnboardingModal from "@/components/onboarding/OnboardingModal";
import {
  getProducts,
  getActivePromos,
  getCategories,
  Product,
} from "@/lib/api";

interface Props {
  products: Product[];
  promos: any;
  categories: any[];
  error?: string;
}

export default function HomePage({
  products,
  promos,
  categories,
  error,
}: Props) {
  const [activeCategory, setActiveCategory] = useState("");

  // Filter by category numeric ID — API returns p.category as a number
  const displayed = activeCategory
    ? products.filter((p) => String(p.category) === activeCategory)
    : products;

  return (
    <>
      <Head>
        <title>Racks — Uganda's Sharpest Online Mall</title>
        <meta
          name="description"
          content="Electronics, home appliances, fashion. MTN MoMo & Airtel Money accepted."
        />
      </Head>

      <OnboardingModal />
      <SiteHeader />

      {/* Compact category bar — Jumia style */}
      <div
        style={{
          background: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
          padding: "0 16px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            gap: 0,
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          {[{ name: "All", id: "", icon: "🏠" }, ...categories].map((cat) => {
            const catId = cat.id ? String(cat.id) : "";
            const isActive = activeCategory === catId;
            return (
              <button
                key={catId || "all"}
                onClick={() => setActiveCategory(catId)}
                style={{
                  flexShrink: 0,
                  background: "none",
                  border: "none",
                  borderBottom: isActive
                    ? "2px solid #C8922A"
                    : "2px solid transparent",
                  padding: "10px 14px",
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? "#C8922A" : "var(--color-ink-2)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all .15s",
                }}
              >
                {cat.icon} {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Slim hero — Jumia style */}
      <div style={{ background: "var(--color-navy)", padding: "20px 16px" }}>
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "sans-serif",
                fontSize: "clamp(18px,3vw,28px)",
                fontWeight: 800,
                color: "#fff",
                lineHeight: 1.2,
                marginBottom: 4,
              }}
            >
              Uganda's{" "}
              <em style={{ color: "#F5B942", fontStyle: "normal" }}>
                Sharpest
              </em>{" "}
              Online Mall
            </h1>
            <p style={{ fontSize: 12, color: "#78909C", margin: 0 }}>
              Electronics · Appliances · Fashion — MoMo & Airtel Money accepted
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a
              href="#products"
              style={{
                background: "#C8922A",
                color: "#0D1B2A",
                border: "none",
                borderRadius: 6,
                padding: "9px 18px",
                fontSize: 12,
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Shop Now
            </a>
            <Link
              href="/track"
              style={{
                background: "transparent",
                color: "#fff",
                border: "1px solid rgba(255,255,255,.25)",
                borderRadius: 6,
                padding: "9px 16px",
                fontSize: 12,
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Track Order
            </Link>
          </div>
        </div>
      </div>

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 16px" }}>
        {/* Flash Sale */}
        {promos?.flash_sale && (
          <div style={{ marginTop: 16 }}>
            <FlashSaleBanner
              name={promos.flash_sale.name}
              discountPct={promos.flash_sale.discount_pct}
              endsAt={promos.flash_sale.ends_at}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-danger)",
              borderRadius: 8,
              padding: 12,
              margin: "16px 0",
              color: "var(--color-danger)",
              fontSize: 13,
            }}
          >
            Could not load products. Make sure Django is running on port 8000.
          </div>
        )}

        {/* Product grid */}
        <section id="products">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              margin: "16px 0 12px",
            }}
          >
            <h2
              style={{
                fontFamily: "sans-serif",
                fontSize: 16,
                fontWeight: 700,
                color: "var(--color-ink)",
              }}
            >
              {activeCategory
                ? `${categories.find((c) => String(c.id) === activeCategory)?.name || ""} (${displayed.length})`
                : `🔥 All Products (${displayed.length})`}
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 12,
              marginBottom: 32,
            }}
          >
            {displayed.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        {/* Brand spotlight */}
        <section
          style={{
            background: "var(--color-navy)",
            borderRadius: 10,
            padding: "18px 22px",
            marginBottom: 32,
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#F5B942",
              textTransform: "uppercase",
              letterSpacing: ".1em",
              marginBottom: 3,
            }}
          >
            Brand Spotlight
          </p>
          <h3
            style={{
              fontFamily: "sans-serif",
              fontSize: 18,
              fontWeight: 800,
              color: "#fff",
              marginBottom: 5,
            }}
          >
            {promos?.brand_week
              ? `${promos.brand_week.brand} Week`
              : "Samsung Week"}
          </h3>
          <p style={{ fontSize: 12, color: "#78909C", marginBottom: 12 }}>
            {promos?.brand_week
              ? `Extra ${promos.brand_week.discount_pct}% off all ${promos.brand_week.brand} products`
              : "Extra 15% off all Samsung products this week"}
          </p>
          <a
            href="/?brand=Samsung"
            style={{
              background: "#C8922A",
              color: "#0D1B2A",
              padding: "9px 18px",
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Shop Samsung →
          </a>
        </section>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const [productsRes, promosRes, catsRes] = await Promise.all([
      getProducts({ ordering: "-created_at", limit: "160" }),
      getActivePromos(),
      getCategories(),
    ]);
    return {
      props: {
        products: productsRes.data.results || productsRes.data || [],
        promos: promosRes.data,
        categories: catsRes.data.results || catsRes.data || [],
      },
    };
  } catch {
    return {
      props: {
        products: [],
        promos: {},
        categories: [],
        error: "Could not connect to API.",
      },
    };
  }
};
