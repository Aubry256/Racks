/**
 * pages/_app.tsx — Global app wrapper
 */
import type { AppProps } from "next/app";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Toaster } from "react-hot-toast";
import BackToTop from "@/components/ui/BackToTop";
import { CartProvider } from "@/lib/useCart";
import "../styles/tokens.css";

const NO_FOOTER = ["/order/[id]/receipt"];

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const showFooter = !NO_FOOTER.includes(router.pathname);

  return (
    <CartProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0D1B2A" />
      </Head>

      <Component {...pageProps} />

      {showFooter && (
        <footer
          style={{
            background: "#0D1B2A",
            borderTop: "1px solid #1E3348",
            padding: "32px 24px 24px",
            marginTop: "40px",
          }}
        >
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "28px",
                marginBottom: "28px",
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "sans-serif",
                    fontSize: "22px",
                    fontWeight: 900,
                    color: "#fff",
                    marginBottom: "8px",
                  }}
                >
                  RA<span style={{ color: "#F5B942" }}>CK</span>S
                </div>
                <p
                  style={{
                    fontSize: "12px",
                    color: "rgba(255,255,255,.4)",
                    lineHeight: 1.6,
                  }}
                >
                  Uganda's sharpest online mall. MTN MoMo · Airtel · Visa
                  accepted.
                </p>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "rgba(255,255,255,.35)",
                    textTransform: "uppercase",
                    letterSpacing: ".08em",
                    marginBottom: "12px",
                  }}
                >
                  Shop
                </div>
                {[
                  "Electronics",
                  "TVs & Audio",
                  "Kitchen",
                  "Appliances",
                  "Computing",
                  "Fashion",
                ].map((c) => (
                  <Link
                    key={c}
                    href={`/?category=${c.toLowerCase().replace(/\s+/g, "-")}`}
                    style={{
                      display: "block",
                      fontSize: "12px",
                      color: "rgba(255,255,255,.5)",
                      textDecoration: "none",
                      marginBottom: "6px",
                    }}
                  >
                    {c}
                  </Link>
                ))}
              </div>
              <div>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "rgba(255,255,255,.35)",
                    textTransform: "uppercase",
                    letterSpacing: ".08em",
                    marginBottom: "12px",
                  }}
                >
                  Help
                </div>
                {[
                  { href: "/help", label: "Contact Us" },
                  { href: "/faq", label: "FAQs" },
                  { href: "/terms", label: "Terms & Conditions" },
                  { href: "/track", label: "Track an Order" },
                ].map((i) => (
                  <Link
                    key={i.href}
                    href={i.href}
                    style={{
                      display: "block",
                      fontSize: "12px",
                      color: "rgba(255,255,255,.5)",
                      textDecoration: "none",
                      marginBottom: "6px",
                    }}
                  >
                    {i.label}
                  </Link>
                ))}
              </div>
              <div>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "rgba(255,255,255,.35)",
                    textTransform: "uppercase",
                    letterSpacing: ".08em",
                    marginBottom: "12px",
                  }}
                >
                  Contact
                </div>
                <a
                  href="https://wa.me/256700000000"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    color: "#25D366",
                    textDecoration: "none",
                    marginBottom: "8px",
                    fontWeight: 600,
                  }}
                >
                  💬 WhatsApp Us
                </a>
                <a
                  href="mailto:support@racks.ug"
                  style={{
                    display: "block",
                    fontSize: "12px",
                    color: "rgba(255,255,255,.5)",
                    textDecoration: "none",
                    marginBottom: "6px",
                  }}
                >
                  ✉️ support@racks.ug
                </a>
                <a
                  href="tel:+256700000000"
                  style={{
                    display: "block",
                    fontSize: "12px",
                    color: "rgba(255,255,255,.5)",
                    textDecoration: "none",
                    marginBottom: "6px",
                  }}
                >
                  📞 +256 700 000 000
                </a>
                <div
                  style={{
                    fontSize: "11px",
                    color: "rgba(255,255,255,.3)",
                    marginTop: "4px",
                  }}
                >
                  Mon–Sat · 8 AM – 8 PM
                </div>
              </div>
            </div>
            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,.08)",
                paddingTop: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,.3)" }}>
                © 2026 Racks Uganda · All rights reserved
              </div>
              <div style={{ display: "flex", gap: "16px" }}>
                {[
                  { href: "/terms", label: "Terms" },
                  { href: "/faq", label: "FAQs" },
                  { href: "/help", label: "Help" },
                ].map((i) => (
                  <Link
                    key={i.href}
                    href={i.href}
                    style={{
                      fontSize: "11px",
                      color: "rgba(255,255,255,.35)",
                      textDecoration: "none",
                    }}
                  >
                    {i.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </footer>
      )}

      {showFooter && <BackToTop />}

      {showFooter && (
        <a
          href="https://wa.me/256700000000?text=Hi Racks, I need help"
          target="_blank"
          rel="noreferrer"
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "#25D366",
            color: "#fff",
            borderRadius: "50px",
            padding: "12px 18px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 16px rgba(37,211,102,.4)",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: 700,
            zIndex: 999,
          }}
        >
          💬 <span>Help</span>
        </a>
      )}

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2500,
          style: {
            background: "#0D1B2A",
            color: "#F0EBE3",
            borderRadius: "10px",
            border: "1px solid #1E3348",
            fontSize: "13px",
          },
          success: { iconTheme: { primary: "#C8922A", secondary: "#0D1B2A" } },
          error: { iconTheme: { primary: "#B71C1C", secondary: "#fff" } },
        }}
      />
    </CartProvider>
  );
}
