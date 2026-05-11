-- ============================================================
-- RACKS — Complete Database Schema
-- PostgreSQL 16
--
-- HOW TO RUN THIS FILE:
-- Option 1 (SQL Shell):
--   \i C:/path/to/racks_school/database/schema.sql
--
-- Option 2 (VSCode terminal, psql installed):
--   psql -U racks_user -d racks_db -f schema.sql
--
-- Option 3 (Django does it automatically):
--   python manage.py migrate
--   (Django reads models.py files and builds these tables itself)
--   This file is provided so you can SEE and UNDERSTAND the
--   database structure without running Django.
--
-- WHY POSTGRESQL:
--   - SQLite: single user only, no concurrent writes, no JSONB
--   - MySQL: weaker JSONB support, less reliable Django tooling
--   - PostgreSQL: full ACID, excellent JSONB columns (used for
--     product attributes and cart items), best Django integration,
--     used by Flutterwave and most serious African e-commerce
--
-- TABLE OVERVIEW:
--   users_user            → Customer and vendor accounts
--   users_vendorprofile   → Extra info for vendor accounts
--   products_category     → Product categories (hierarchical)
--   products_product      → All products listed on Racks
--   orders_cart           → Persistent shopping carts
--   orders_order          → Customer orders (draft-first pattern)
--   payments_payment      → Payment attempts via Flutterwave
--   promotions_promotion  → Flash sales, clearance, brand weeks
--   delivery_deliveryzone → Uganda districts + delivery info
--   django_*              → Django internal tables (auto-created)
-- ============================================================

-- Clean slate (DROP in reverse dependency order)
DROP TABLE IF EXISTS payments_payment       CASCADE;
DROP TABLE IF EXISTS orders_order           CASCADE;
DROP TABLE IF EXISTS orders_cart            CASCADE;
DROP TABLE IF EXISTS products_product       CASCADE;
DROP TABLE IF EXISTS products_category      CASCADE;
DROP TABLE IF EXISTS users_vendorprofile    CASCADE;
DROP TABLE IF EXISTS users_user             CASCADE;
DROP TABLE IF EXISTS promotions_promotion   CASCADE;
DROP TABLE IF EXISTS delivery_deliveryzone  CASCADE;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- TABLE 1: users_user
-- ============================================================
-- Stores every person who has an account on Racks.
-- Uses email as the login field (not username — more modern).
-- UUID primary key: safer than sequential integers because
--   it doesn't reveal how many users exist.
--
-- HCI Principle 1 — Consistency:
--   Same user record serves web, mobile, and admin.
--   One source of truth for authentication state.
-- ============================================================

CREATE TABLE users_user (

  -- Primary key as UUID (globally unique, safe to expose in URLs)
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Login credentials
  email         VARCHAR(254)  NOT NULL UNIQUE,  -- Login field (not username)
  password      VARCHAR(128)  NOT NULL,         -- Hashed with bcrypt — NEVER plaintext

  -- Profile fields
  full_name     VARCHAR(255)  NOT NULL DEFAULT '',
  phone         VARCHAR(20)   NOT NULL DEFAULT '',  -- Uganda mobile number for MoMo
  district      VARCHAR(100)  NOT NULL DEFAULT '',  -- Saved district: pre-fills checkout

  -- Role determines what the user can do
  -- customer → can browse and buy
  -- vendor   → can list products and manage inventory
  -- admin    → full platform access
  role          VARCHAR(20)   NOT NULL DEFAULT 'customer'
                CHECK (role IN ('customer', 'vendor', 'admin')),

  -- Account status
  is_verified   BOOLEAN       NOT NULL DEFAULT FALSE,  -- Email verified
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,   -- Can log in
  is_staff      BOOLEAN       NOT NULL DEFAULT FALSE,  -- Can access /admin

  -- Django required fields
  is_superuser  BOOLEAN       NOT NULL DEFAULT FALSE,
  last_login    TIMESTAMPTZ,
  date_joined   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()

);

-- Indexes speed up common queries
-- We search users by email on every login
CREATE INDEX idx_user_email    ON users_user (email);
-- We filter users by role (admin panel lists vendors separately)
CREATE INDEX idx_user_role     ON users_user (role);
-- We list users by join date in admin
CREATE INDEX idx_user_created  ON users_user (created_at DESC);

COMMENT ON TABLE  users_user               IS 'All Racks user accounts — customers, vendors, and admins';
COMMENT ON COLUMN users_user.id            IS 'UUID primary key — safer than sequential integer, safe to expose in URLs';
COMMENT ON COLUMN users_user.email         IS 'Used for login (replaces default Django username field)';
COMMENT ON COLUMN users_user.password      IS 'Hashed with bcrypt. Django never stores plaintext passwords.';
COMMENT ON COLUMN users_user.district      IS 'Saved to pre-fill the delivery address at checkout — reduces friction on repeat orders';
COMMENT ON COLUMN users_user.role          IS 'customer = buyer, vendor = seller, admin = full access';


-- ============================================================
-- TABLE 2: users_vendorprofile
-- ============================================================
-- Extra details for users who are vendors.
-- Separate table because most users are customers and don't
-- need vendor fields. Keeps the user table lean and fast.
-- ============================================================

CREATE TABLE users_vendorprofile (

  id             SERIAL        PRIMARY KEY,
  user_id        UUID          NOT NULL UNIQUE REFERENCES users_user(id) ON DELETE CASCADE,

  -- Store identity
  store_name     VARCHAR(200)  NOT NULL,
  store_slug     VARCHAR(200)  NOT NULL UNIQUE,  -- URL-safe: "techeast-uganda"
  description    TEXT          NOT NULL DEFAULT '',
  logo_url       VARCHAR(200)  NOT NULL DEFAULT '',
  district       VARCHAR(100)  NOT NULL DEFAULT '',
  business_type  VARCHAR(50)   NOT NULL DEFAULT '',
  tin_number     VARCHAR(50)   NOT NULL DEFAULT '',  -- Uganda Revenue Authority TIN

  -- Commercial terms
  plan           VARCHAR(20)   NOT NULL DEFAULT 'starter'
                 CHECK (plan IN ('starter', 'pro')),
                 -- starter = free, 8% commission per sale
                 -- pro = UGX 80,000/month, 5% commission

  commission_pct NUMERIC(5,2)  NOT NULL DEFAULT 8.00,
                 -- Percentage Racks keeps from each sale
                 -- starter = 8.00, pro = 5.00

  -- Application status
  status         VARCHAR(20)   NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'active', 'suspended')),
                 -- pending: just applied, under review
                 -- active: approved and selling
                 -- suspended: banned or unpaid

  -- Payout details
  payout_phone   VARCHAR(20)   NOT NULL DEFAULT '',  -- MTN/Airtel number for paying vendors

  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()

);

CREATE INDEX idx_vendor_user   ON users_vendorprofile (user_id);
CREATE INDEX idx_vendor_status ON users_vendorprofile (status);

COMMENT ON TABLE  users_vendorprofile            IS 'Extended profile for vendor accounts. 1-to-1 with users_user where role=vendor.';
COMMENT ON COLUMN users_vendorprofile.store_slug IS 'URL-safe store identifier. Slug for "TechEast Uganda" = "techeast-uganda".';
COMMENT ON COLUMN users_vendorprofile.plan       IS 'starter=free+8% commission, pro=UGX 80k/month+5% commission';
COMMENT ON COLUMN users_vendorprofile.status     IS 'pending=under review, active=approved, suspended=banned';


-- ============================================================
-- TABLE 3: products_category
-- ============================================================
-- Product categories. Hierarchical — a category can have
-- a parent category.
-- Example: Electronics (parent) → Phones (child)
-- ============================================================

CREATE TABLE products_category (

  id        SERIAL       PRIMARY KEY,
  name      VARCHAR(100) NOT NULL,
  slug      VARCHAR(100) NOT NULL UNIQUE,  -- URL-safe: "home-living"
  icon      VARCHAR(10)  NOT NULL DEFAULT '',   -- Emoji: 📱 🍳 ❄️
  is_active BOOLEAN      NOT NULL DEFAULT TRUE,

  -- Self-referential: allows sub-categories
  -- NULL = top-level category
  parent_id INTEGER REFERENCES products_category(id) ON DELETE SET NULL

);

CREATE INDEX idx_category_parent ON products_category (parent_id);
CREATE INDEX idx_category_active ON products_category (is_active);

COMMENT ON TABLE  products_category           IS 'Product categories. Hierarchical — parent_id allows sub-categories.';
COMMENT ON COLUMN products_category.slug      IS 'URL-safe name used in filter queries: GET /api/products/?category=home-living';
COMMENT ON COLUMN products_category.parent_id IS 'NULL = top-level. Set = sub-category. e.g. Electronics → Phones';


-- ============================================================
-- TABLE 4: products_product
-- ============================================================
-- Every product listed on Racks.
--
-- KEY DESIGN DECISIONS:
--
-- UUID primary key — safe in URLs, doesn't reveal product count
--
-- JSONB for attributes — product specs vary wildly:
--   TV: {screen: "43 inches", resolution: "4K", os: "Tizen"}
--   Blender: {power: "800W", capacity: "1.5L"}
--   Phone: {ram: "8GB", storage: "256GB", battery: "5000mAh"}
--   Instead of one column per spec (most would be empty),
--   JSONB stores whatever specs the product has.
--
-- promo_price + on_promo — HCI Principle 3 — Visibility:
--   Promotions system writes the discounted price here.
--   API always returns the correct current price without
--   the frontend doing any calculation.
--
-- stock_qty — HCI Principle 3 — Visibility:
--   Always shown on product pages and cards.
--   Dombelo showed no stock info at all.
-- ============================================================

CREATE TABLE products_product (

  id           UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Ownership
  vendor_id    INTEGER       REFERENCES users_vendorprofile(id) ON DELETE SET NULL,
  category_id  INTEGER       REFERENCES products_category(id)   ON DELETE SET NULL,

  -- Identity
  name         VARCHAR(255)  NOT NULL,
  slug         VARCHAR(255)  NOT NULL UNIQUE,  -- URL: /product/samsung-43-qled-tv
  description  TEXT          NOT NULL DEFAULT '',
  brand        VARCHAR(100)  NOT NULL DEFAULT '',

  -- ── Pricing ────────────────────────────────────────────────
  -- price      = normal selling price
  -- promo_price = discounted price set by the promotions system
  --              NULL when no active promotion applies
  -- on_promo   = TRUE when promo_price is active and shown to customers
  --
  -- The API returns current_price = promo_price if on_promo ELSE price
  -- Clients never calculate this themselves.
  price        NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  promo_price  NUMERIC(12,2) CHECK (promo_price >= 0),  -- NULL if no active promo
  on_promo     BOOLEAN       NOT NULL DEFAULT FALSE,

  -- ── Inventory ──────────────────────────────────────────────
  -- HCI Principle 3 — Visibility:
  -- Always show stock levels to customers.
  -- Dombelo showed no stock levels — users couldn't know if
  -- items were available before trying to add to cart.
  stock_qty    INTEGER       NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),

  -- ── Flexible data as JSONB ─────────────────────────────────
  -- attributes: product specifications
  --   {"screen": "43 inches", "resolution": "4K", "hdmi_ports": "3"}
  -- images: array of image URLs
  --   ["/media/products/tv-front.jpg", "/media/products/tv-side.jpg"]
  -- WHY JSONB over separate tables:
  --   Different products have completely different spec sets.
  --   JSONB avoids hundreds of mostly-empty columns.
  --   PostgreSQL JSONB is fully indexable and queryable.
  attributes  JSONB         NOT NULL DEFAULT '{}',
  images      JSONB         NOT NULL DEFAULT '[]',

  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()

);

-- Standard filters used in API queries
CREATE INDEX idx_product_category  ON products_product (category_id);
CREATE INDEX idx_product_brand     ON products_product (brand);
CREATE INDEX idx_product_on_promo  ON products_product (on_promo);
CREATE INDEX idx_product_active    ON products_product (is_active, stock_qty);
CREATE INDEX idx_product_created   ON products_product (created_at DESC);

-- GIN index makes JSONB attributes searchable
-- e.g. WHERE attributes @> '{"os": "Tizen"}'
CREATE INDEX idx_product_attrs     ON products_product USING GIN (attributes);

COMMENT ON TABLE  products_product            IS 'All products on Racks. JSONB columns store flexible specs and image lists.';
COMMENT ON COLUMN products_product.promo_price IS 'Set automatically by the promotions system when a promotion activates. NULL = no active promo.';
COMMENT ON COLUMN products_product.on_promo    IS 'TRUE when promo_price is active. API returns promo_price as current_price when this is TRUE.';
COMMENT ON COLUMN products_product.stock_qty   IS 'HCI P.3 — Visibility: always shown to users. 0 = out of stock button shown.';
COMMENT ON COLUMN products_product.attributes  IS 'Product specs as JSONB: {"screen": "43 inches", "resolution": "4K"}. Different per category.';
COMMENT ON COLUMN products_product.images      IS 'Array of image URLs as JSONB: ["/media/tv-front.jpg", "/media/tv-back.jpg"]';


-- ============================================================
-- TABLE 5: orders_cart
-- ============================================================
-- Persistent shopping cart saved to the database.
--
-- WHY SAVE THE CART TO THE DATABASE:
-- If we only stored the cart in the browser (localStorage),
-- it disappears when the user:
--   - Clears their browser data
--   - Switches devices
--   - Has a browser crash during checkout
--
-- HCI Principle 4 — Error Recovery:
-- Cart in the database survives everything.
-- ============================================================

CREATE TABLE orders_cart (

  id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID         REFERENCES users_user(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL DEFAULT '',  -- For guest (not logged in) carts

  -- Cart items as JSONB array:
  -- [
  --   {
  --     "product_id": "uuid",
  --     "name": "Samsung 43 TV",
  --     "price": 1450000,       ← price locked at time of adding
  --     "qty": 1,
  --     "image": "/media/...",
  --     "brand": "Samsung"
  --   }
  -- ]
  -- Price is locked when added so a promotion ending doesn't
  -- change the price mid-cart.
  items      JSONB        NOT NULL DEFAULT '[]',

  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()

);

CREATE INDEX idx_cart_user    ON orders_cart (user_id);
CREATE INDEX idx_cart_session ON orders_cart (session_id);

COMMENT ON TABLE  orders_cart        IS 'Persistent cart saved to DB. Survives browser close, device switch, crashes.';
COMMENT ON COLUMN orders_cart.items  IS 'Array of cart items as JSONB. Price is snapshotted at add-to-cart time.';


-- ============================================================
-- TABLE 6: promotions_promotion
-- ============================================================
-- Manages flash sales, clearance, brand weeks, and bundles.
--
-- HCI Principle 3 — Visibility:
--   The Celery scheduler activates/deactivates promotions at
--   exactly the right time, keeping the flash sale countdown
--   accurate.
-- ============================================================

CREATE TABLE promotions_promotion (

  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(200)  NOT NULL,

  -- Type of promotion
  promo_type      VARCHAR(30)   NOT NULL
                  CHECK (promo_type IN ('flash_sale', 'clearance', 'bundle', 'brand_week')),

  -- Current state
  -- draft → scheduled → live → ended
  status          VARCHAR(20)   NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'scheduled', 'live', 'paused', 'ended')),

  -- Discount amount
  discount_pct    NUMERIC(5,2)  CHECK (discount_pct BETWEEN 0 AND 100),

  -- What products does this promotion apply to?
  applies_to      VARCHAR(30)   NOT NULL DEFAULT 'all'
                  CHECK (applies_to IN ('all', 'category', 'brand', 'selected_skus')),
  category_slug   VARCHAR(100)  NOT NULL DEFAULT '',  -- If applies_to = 'category'
  brand_name      VARCHAR(100)  NOT NULL DEFAULT '',  -- If applies_to = 'brand'

  -- Bundle rules
  min_qty         INTEGER       NOT NULL DEFAULT 1,   -- e.g. buy 2+ to get discount

  -- Scheduling
  starts_at       TIMESTAMPTZ   NOT NULL,
  ends_at         TIMESTAMPTZ,  -- NULL = runs until manually stopped or stock out

  -- Auto-end when stock runs out
  auto_end_on_stockout BOOLEAN  NOT NULL DEFAULT FALSE,

  -- Progress tracking
  target_orders   INTEGER,      -- NULL = unlimited
  orders_count    INTEGER       NOT NULL DEFAULT 0,

  -- Who created it
  created_by_id   UUID          REFERENCES users_user(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()

);

CREATE INDEX idx_promo_status   ON promotions_promotion (status);
CREATE INDEX idx_promo_starts   ON promotions_promotion (starts_at);
CREATE INDEX idx_promo_type     ON promotions_promotion (promo_type, status);

COMMENT ON TABLE  promotions_promotion             IS 'Flash sales, clearance, brand weeks, bundles. Activated by Celery scheduler.';
COMMENT ON COLUMN promotions_promotion.status      IS 'Lifecycle: draft → scheduled → live → ended. Celery moves scheduled to live at starts_at.';
COMMENT ON COLUMN promotions_promotion.applies_to  IS 'all=all products, category=one category, brand=one brand, selected_skus=specific products';
COMMENT ON COLUMN promotions_promotion.ends_at     IS 'NULL = runs until manually stopped. Set = auto-ends at this datetime.';


-- ============================================================
-- TABLE 7: orders_order
-- ============================================================
-- THE MOST IMPORTANT TABLE FOR HCI PRINCIPLE 4.
--
-- THE DOMBELO PROBLEM:
--   When a MoMo payment failed on Dombelo, the user's cart
--   was wiped. They lost all their work and had to start over.
--   Pesapal crashed with a 500 error. No retry. No saved order.
--
-- THE RACKS SOLUTION — THE DRAFT PATTERN:
--   1. User submits checkout form
--   2. Order is created with draft=TRUE (saved NOW, before payment)
--   3. THEN we call Flutterwave
--   4a. Payment succeeds → webhook sets draft=FALSE, status='processing'
--   4b. Payment fails → order stays draft=TRUE
--              user sees "Your order is saved, try again"
--              cart is NOT wiped
--              user can retry payment from their orders page
--
-- This means:
--   - If Flutterwave times out → order saved
--   - If MoMo prompt is rejected → order saved
--   - If user closes the browser → order saved
--   - If Pesapal has a 500 error (like on Dombelo) → order saved
-- ============================================================

CREATE TABLE orders_order (

  id             UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID          REFERENCES users_user(id) ON DELETE SET NULL,

  -- Order lifecycle status
  -- This tracks where the physical item is
  status         VARCHAR(20)   NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'processing', 'dispatched', 'delivered', 'cancelled')),
                 -- pending    = order placed, not yet paid
                 -- processing = payment confirmed, being prepared
                 -- dispatched = handed to delivery rider
                 -- delivered  = customer received it
                 -- cancelled  = order cancelled

  -- Payment status is separate from order status
  -- An order moves through payment status independently
  payment_status VARCHAR(20)   NOT NULL DEFAULT 'unpaid'
                 CHECK (payment_status IN ('unpaid', 'paid', 'failed', 'refunded')),

  -- Snapshot of cart items at order time
  -- WHY SNAPSHOT: If a product's price changes or it's deleted later,
  -- the order still has the exact price the customer paid.
  -- Same format as cart items JSONB.
  items          JSONB         NOT NULL DEFAULT '[]',

  -- Pricing
  total_amount   NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
  delivery_fee   NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- Delivery details
  -- Stored as JSONB: {"line1": "Ntinda near Shell", "district": "Kampala"}
  delivery_address JSONB       NOT NULL DEFAULT '{}',
  district         VARCHAR(100) NOT NULL DEFAULT '',

  -- Payment details
  payment_method VARCHAR(50)   NOT NULL DEFAULT '',   -- 'momo', 'airtel', 'cod'
  payment_ref    VARCHAR(255)  NOT NULL DEFAULT '',   -- Flutterwave tx_ref

  -- ── THE CRITICAL FIELD ──────────────────────────────────────
  -- HCI Principle 4 — Error Recovery
  --
  -- draft=TRUE:  Order is saved, payment not yet confirmed.
  --              Preserves the order even if payment fails.
  -- draft=FALSE: Payment confirmed by Flutterwave webhook.
  --              Order is now active and being processed.
  --
  -- The order is created with draft=TRUE.
  -- It only becomes draft=FALSE when Flutterwave's webhook
  -- arrives at /api/payments/webhook/ with status='successful'.
  --
  -- Compare Dombelo: No draft system at all. Payment failure
  -- = complete data loss for the customer.
  draft          BOOLEAN       NOT NULL DEFAULT TRUE,

  -- Applied promotion (if any discount was used)
  promotion_id   UUID          REFERENCES promotions_promotion(id) ON DELETE SET NULL,

  notes          TEXT          NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()

);

CREATE INDEX idx_order_user       ON orders_order (user_id, created_at DESC);
CREATE INDEX idx_order_status     ON orders_order (status, created_at DESC);
CREATE INDEX idx_order_payment    ON orders_order (payment_status);
CREATE INDEX idx_order_draft      ON orders_order (draft);  -- quickly find unpaid/pending orders
CREATE INDEX idx_order_created    ON orders_order (created_at DESC);

COMMENT ON TABLE  orders_order             IS 'Customer orders. draft=TRUE means saved before payment. draft=FALSE means payment confirmed.';
COMMENT ON COLUMN orders_order.draft       IS 'HCI P.4 Error Recovery: TRUE=payment pending, FALSE=payment confirmed. Order preserved on payment failure.';
COMMENT ON COLUMN orders_order.items       IS 'Snapshot of cart at order time. Preserves prices even if products change later.';
COMMENT ON COLUMN orders_order.status      IS 'Physical journey: pending→processing→dispatched→delivered. WebSocket notifies user at each change.';
COMMENT ON COLUMN orders_order.payment_ref IS 'Flutterwave transaction reference (e.g. RK-ABCDEF123456). Used to match webhooks.';


-- ============================================================
-- TABLE 8: payments_payment
-- ============================================================
-- Records every payment attempt.
--
-- WHY SAVE FAILED PAYMENTS:
--   Failed payments are valuable data:
--   - How often does MoMo fail in Kampala vs Mbarara?
--   - Is Flutterwave having infrastructure issues?
--   - Which phone networks have the most failures?
--
-- We also need this table to match Flutterwave's webhook
-- with the correct order. When Flutterwave sends:
--   {"tx_ref": "RK-ABCDEF123456", "status": "successful"}
-- We look up the payment record by provider_ref to find
-- which order this payment was for.
-- ============================================================

CREATE TABLE payments_payment (

  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID         NOT NULL REFERENCES orders_order(id) ON DELETE CASCADE,

  -- Which payment service was used
  provider     VARCHAR(50)  NOT NULL DEFAULT 'flutterwave',
                             -- Could be: 'flutterwave', 'cod' (cash on delivery)

  -- Amount attempted
  amount       NUMERIC(12,2) NOT NULL,
  currency     VARCHAR(10)  NOT NULL DEFAULT 'UGX',

  -- Payment outcome
  status       VARCHAR(20)  NOT NULL DEFAULT 'initiated'
               CHECK (status IN ('initiated', 'pending', 'success', 'failed')),
               -- initiated = we called Flutterwave
               -- pending   = waiting for user to approve on phone
               -- success   = webhook confirmed payment
               -- failed    = payment rejected or timed out

  -- The Flutterwave transaction reference
  -- Format: RK-ABCDEF123456
  -- Used to match incoming webhooks to the correct payment
  provider_ref VARCHAR(255) NOT NULL DEFAULT '',

  -- The full webhook payload from Flutterwave
  -- Saved for debugging and reconciliation
  payload      JSONB        NOT NULL DEFAULT '{}',

  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()

);

CREATE INDEX idx_payment_order    ON payments_payment (order_id);
CREATE INDEX idx_payment_ref      ON payments_payment (provider_ref);  -- fast webhook matching
CREATE INDEX idx_payment_status   ON payments_payment (status);

COMMENT ON TABLE  payments_payment             IS 'Every payment attempt. Saved before calling Flutterwave so webhook can always be matched.';
COMMENT ON COLUMN payments_payment.provider_ref IS 'Flutterwave tx_ref (e.g. RK-ABCDEF123456). Used to match webhook to order.';
COMMENT ON COLUMN payments_payment.payload      IS 'Full Flutterwave webhook response. Saved for debugging payment failures.';
COMMENT ON COLUMN payments_payment.status       IS 'initiated→pending→success or initiated→pending→failed';


-- ============================================================
-- TABLE 9: delivery_deliveryzone
-- ============================================================
-- HCI Principle 3 — Visibility:
-- This table fixes the exact Dombelo failure we documented.
--
-- WHAT WE SAW ON DOMBELO:
--   We entered our address as Mbarara.
--   The cart showed "Delivery to Kiruhura: UShs 34,501".
--   Kiruhura and Mbarara are different districts.
--   The system changed our district silently with no explanation.
--
-- WHAT RACKS DOES:
--   The product page calls GET /api/products/{id}/delivery/?district=Mbarara
--   Django looks up Mbarara in this table and returns:
--   {
--     "covered": true,
--     "delivery_days": 3,
--     "delivery_fee": 20000,
--     "message": "Delivers to Mbarara in 3 days · UGX 20,000"
--   }
--   This is shown on the product page BEFORE checkout.
--   No surprises. No silent district changes.
--
-- HCI Principle 5 — Constraints:
--   The checkout district dropdown is populated from
--   WHERE is_covered = TRUE — so users cannot select
--   a district we don't deliver to.
-- ============================================================

CREATE TABLE delivery_deliveryzone (

  id            SERIAL       PRIMARY KEY,
  district      VARCHAR(100) NOT NULL UNIQUE,  -- e.g. "Kampala", "Mbarara", "Gulu"

  -- Whether Racks delivers here at all
  -- FALSE = we know about this district but don't cover it yet
  is_covered    BOOLEAN      NOT NULL DEFAULT FALSE,

  -- How long delivery takes (working days)
  delivery_days INTEGER      NOT NULL DEFAULT 3 CHECK (delivery_days > 0),

  -- Delivery fee in UGX
  -- 0 = free delivery (e.g. Kampala for all orders)
  delivery_fee  NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- Orders above this amount get free delivery (regardless of delivery_fee)
  -- e.g. free_above=200000 means orders over UGX 200,000 are free to Kampala
  free_above    NUMERIC(12,2) NOT NULL DEFAULT 200000,

  -- Optional notes for the admin panel
  notes         VARCHAR(255)  NOT NULL DEFAULT ''

);

CREATE INDEX idx_zone_covered  ON delivery_deliveryzone (is_covered);
CREATE INDEX idx_zone_district ON delivery_deliveryzone (district);

COMMENT ON TABLE  delivery_deliveryzone            IS 'Uganda delivery districts. HCI P.3: product pages show live delivery info. HCI P.5: checkout only shows covered districts.';
COMMENT ON COLUMN delivery_deliveryzone.is_covered IS 'FALSE = we know the district but do not deliver there yet. TRUE = deliveries available.';
COMMENT ON COLUMN delivery_deliveryzone.delivery_fee IS 'UGX fee. 0 = always free. Overridden to 0 for orders above free_above.';
COMMENT ON COLUMN delivery_deliveryzone.free_above   IS 'Orders above this UGX amount get free delivery regardless of delivery_fee.';


-- ============================================================
-- DEMO DATA — run this after schema.sql
-- This is what python manage.py seed_data creates
-- ============================================================

-- Delivery zones (Uganda districts)
INSERT INTO delivery_deliveryzone
  (district,    is_covered, delivery_days, delivery_fee, free_above, notes)
VALUES
  ('Kampala',   TRUE,  1,  0,     200000, 'Same-day delivery available'),
  ('Wakiso',    TRUE,  1,  5000,  200000, 'Covers Entebbe road, Nansana'),
  ('Mukono',    TRUE,  2,  8000,  300000, ''),
  ('Entebbe',   TRUE,  2,  10000, 300000, ''),
  ('Jinja',     TRUE,  2,  15000, 400000, ''),
  ('Mbarara',   TRUE,  3,  20000, 500000, 'SW Uganda hub'), -- Unlike Dombelo we correctly handle Mbarara!
  ('Gulu',      TRUE,  3,  25000, 500000, 'N Uganda hub'),
  ('Mbale',     TRUE,  3,  22000, 500000, 'E Uganda hub'),
  ('Fortportal',FALSE, 4,  30000, 600000, 'Coming soon'),
  ('Soroti',    FALSE, 4,  28000, 600000, 'Coming soon')
ON CONFLICT (district) DO NOTHING;

-- Categories
INSERT INTO products_category (name, slug, icon) VALUES
  ('Electronics',  'electronics',  '📱'),
  ('TVs & Audio',  'tvs-audio',    '📺'),
  ('Kitchen',      'kitchen',      '🍳'),
  ('Appliances',   'appliances',   '❄️'),
  ('Fashion',      'fashion',      '👔'),
  ('Computing',    'computing',    '💻'),
  ('Phones',       'phones',       '📱'),
  ('Home & Living','home-living',  '🛋️')
ON CONFLICT (slug) DO NOTHING;

-- Demo products
INSERT INTO products_product
  (name, slug, brand, category_id, price, stock_qty, description, attributes, images)
VALUES
  (
    'Samsung 43" QLED 4K Smart TV',
    'samsung-43-qled-4k',
    'Samsung',
    (SELECT id FROM products_category WHERE slug='tvs-audio'),
    1450000, 8,
    'Crystal-clear 4K display with Tizen smart OS. Built-in WiFi, Netflix, YouTube.',
    '{"screen": "43 inches", "resolution": "4K UHD", "os": "Tizen", "hdmi": "3 ports"}',
    '[]'
  ),
  (
    'LG 220L Double Door Refrigerator',
    'lg-220l-double-door-fridge',
    'LG',
    (SELECT id FROM products_category WHERE slug='appliances'),
    2100000, 5,
    'Energy-efficient double door fridge. Smart Inverter Compressor.',
    '{"capacity": "220L", "type": "Double Door", "inverter": "Yes", "energy_star": "A++"}',
    '[]'
  ),
  (
    'Tecno Spark 20 Pro+ 256GB',
    'tecno-spark-20-pro-256gb',
    'Tecno',
    (SELECT id FROM products_category WHERE slug='phones'),
    620000, 14,
    '6.78" FHD+ display, 64MP camera, 5000mAh battery.',
    '{"storage": "256GB", "ram": "8GB", "camera": "64MP", "battery": "5000mAh"}',
    '[]'
  ),
  (
    'Ramtons 4-Burner Gas Cooker',
    'ramtons-4-burner-gas-cooker',
    'Ramtons',
    (SELECT id FROM products_category WHERE slug='kitchen'),
    480000, 6,
    'Stainless steel body. Auto-ignition. Glass lid.',
    '{"burners": "4", "ignition": "Auto", "material": "Stainless Steel", "oven": "Yes"}',
    '[]'
  ),
  (
    'HP Laptop 15s Intel Core i5',
    'hp-laptop-15s-intel-i5',
    'HP',
    (SELECT id FROM products_category WHERE slug='computing'),
    1850000, 12,
    '15.6" FHD. 8GB RAM, 512GB SSD. Windows 11.',
    '{"processor": "Intel i5 12th Gen", "ram": "8GB", "storage": "512GB SSD", "os": "Windows 11"}',
    '[]'
  ),
  (
    'Hisense 32" Smart TV',
    'hisense-32-smart-tv',
    'Hisense',
    (SELECT id FROM products_category WHERE slug='tvs-audio'),
    680000, 9,
    'HD Ready VIDAA OS smart TV. WiFi, HDMI x2, USB x2.',
    '{"screen": "32 inches", "resolution": "HD Ready", "os": "VIDAA", "hdmi": "2 ports"}',
    '[]'
  ),
  (
    'Sony WH-1000XM5 Noise Cancelling Headphones',
    'sony-wh-1000xm5-headphones',
    'Sony',
    (SELECT id FROM products_category WHERE slug='electronics'),
    750000, 4,
    'Industry-leading noise cancellation. 30-hour battery. USB-C.',
    '{"type": "Over-ear", "anc": "Yes", "battery": "30 hours", "charging": "USB-C"}',
    '[]'
  ),
  (
    'Roch 2-in-1 Blender and Juicer',
    'roch-2-in-1-blender-juicer',
    'Roch',
    (SELECT id FROM products_category WHERE slug='kitchen'),
    96000, 20,
    '800W blender with juicer attachment. 1.5L jar.',
    '{"power": "800W", "capacity": "1.5L", "functions": "Blend, Juice, Grind"}',
    '[]'
  )
ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- SCHEMA SUMMARY
-- ============================================================
-- Run this to verify all tables were created correctly:

SELECT
  tablename                                      AS "Table",
  pg_size_pretty(pg_total_relation_size(quote_ident(tablename))) AS "Size"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
