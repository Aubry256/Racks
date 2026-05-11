/**
 * components/product/ProductCard.tsx
 *
 * HCI Principle 3 — Visibility: stock level + delivery always shown
 * HCI Principle 9 — Affordance: disabled state when out of stock
 * HCI Principle 2 — Feedback: toast on add to cart
 *
 * vs Dombelo P.3: Dombelo shows NO stock levels on product pages.
 * vs Dombelo P.9: Dombelo has no wishlist. We show a heart button.
 */
import Link from "next/link";
import toast from "react-hot-toast";
import { Product } from "@/lib/api";
import { useCart } from "@/lib/useCart";
import { useState } from "react";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { addItem } = useCart();
  const [wished, setWished] = useState(false);

  const handleAddToCart = () => {
    // HCI P.7 — Simplicity: stays on page, does NOT redirect to checkout
    // vs Dombelo P.7: clicking add to cart immediately redirects to checkout
    const result = addItem({
      product_id: product.id,
      name: product.name,
      price: product.current_price,
      qty: 1,
      brand: product.brand,
      image: product.images?.[0],
      max_qty: product.stock_qty,
    });
    if (result?.success !== false) {
      toast.success(`${product.name.slice(0, 28)} added to cart!`, {
        duration: 2000,
      });
    }
  };

  const stockColor =
    product.stock_qty > 5
      ? "var(--color-success)"
      : product.stock_qty > 0
        ? "var(--color-warning)"
        : "var(--color-ink-muted)";

  const stockLabel =
    product.stock_qty > 5
      ? `${product.stock_qty} in stock`
      : product.stock_qty > 0
        ? `Only ${product.stock_qty} left!`
        : "Out of stock";

  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "12px",
        overflow: "hidden",
        transition: "box-shadow 0.2s",
        position: "relative",
      }}
    >
      {/* Wishlist heart — HCI P.9: affordance Dombelo lacks */}
      <button
        onClick={() => setWished((w) => !w)}
        aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          zIndex: 2,
          background: "rgba(255,255,255,0.85)",
          border: "none",
          borderRadius: "50%",
          width: 28,
          height: 28,
          cursor: "pointer",
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {wished ? "❤️" : "🤍"}
      </button>

      {/* Image */}
      <Link
        href={`/product/${product.slug}`}
        style={{ textDecoration: "none" }}
      >
        <div
          style={{
            height: "150px",
            background: "var(--color-surface-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "52px",
            position: "relative",
          }}
        >
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            "📦"
          )}
          {product.discount_pct > 0 && (
            <span
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                background: "var(--color-danger)",
                color: "#fff",
                fontSize: "11px",
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: "4px",
              }}
            >
              -{product.discount_pct}%
            </span>
          )}
          {!product.in_stock && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  background: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 9px",
                  borderRadius: 4,
                  color: "#555",
                }}
              >
                Out of Stock
              </span>
            </div>
          )}
        </div>
      </Link>

      <div style={{ padding: "12px" }}>
        <p
          style={{
            fontSize: "10px",
            fontWeight: 700,
            color: "var(--color-ink-3)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            margin: "0 0 4px",
          }}
        >
          {product.brand}
        </p>

        <Link
          href={`/product/${product.slug}`}
          style={{ textDecoration: "none" }}
        >
          <p
            style={{
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--color-ink)",
              lineHeight: 1.35,
              margin: "0 0 8px",
              minHeight: 36,
            }}
          >
            {product.name}
          </p>
        </Link>

        {/* Price */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            marginBottom: 6,
          }}
        >
          <span
            style={{
              fontSize: "16px",
              fontWeight: 800,
              color: "var(--color-ink)",
            }}
          >
            UGX {product.current_price.toLocaleString()}
          </span>
          {product.saving_ugx > 0 && (
            <span
              style={{
                fontSize: "11px",
                color: "var(--color-ink-muted)",
                textDecoration: "line-through",
              }}
            >
              {product.price.toLocaleString()}
            </span>
          )}
        </div>

        {/* Stock — HCI P.3: Dombelo shows NO stock levels at all */}
        <p
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: stockColor,
            margin: "0 0 10px",
          }}
        >
          {stockLabel}
        </p>

        {/* Add to cart — HCI P.5, P.7, P.9 */}
        <button
          onClick={handleAddToCart}
          disabled={!product.in_stock}
          style={{
            width: "100%",
            background: product.in_stock
              ? "var(--color-navy)"
              : "var(--color-border)",
            color: product.in_stock ? "#fff" : "var(--color-ink-muted)",
            border: "none",
            borderRadius: "8px",
            padding: "10px",
            fontWeight: 700,
            fontSize: "12px",
            cursor: product.in_stock ? "pointer" : "not-allowed",
          }}
        >
          {product.in_stock ? "Add to Cart" : "Out of Stock"}
        </button>
      </div>
    </div>
  );
}
