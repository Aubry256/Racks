# RACKS — School Project
## Full Local Setup Guide (Windows + VSCode)

---

## WHY THIS STACK?

### PostgreSQL over MySQL or SQLite
- SQLite is fine for prototypes but has no real concurrency — two users checking out
  at the same time can corrupt data. We need proper transactions for orders.
- MySQL is fine but PostgreSQL has better support for JSONB columns (we store
  cart items and product attributes as JSON) and better Django integration.
- PostgreSQL is what real Ugandan fintech platforms (including Flutterwave itself) use.

### Django over Node.js / Laravel / Spring
- Python is readable — your lecturer can follow the logic without knowing the language deeply.
- Django comes with an admin panel out of the box — instant database management UI.
- Django REST Framework is the cleanest way to build APIs in Python.
- Django Channels adds WebSockets (live order tracking, HCI Principle 2) without a
  separate server.

### Next.js over plain React or Vue
- Server-side rendering (SSR) means pages load fast even on 4G — Uganda context.
- API routes let us keep some logic server-side without a separate server.
- File-based routing means less configuration, more time building features.

### Flutterwave over Pesapal or DPO
- Flutterwave has the best Uganda MoMo (MTN + Airtel) support.
- Their test mode works perfectly locally — no real money needed for demo.
- We saw Pesapal crash with a 500 error during our Dombelo testing. Flutterwave
  is more reliable and has better error responses (HCI Principle 4 — Error Recovery).

---

## PREREQUISITES — install these first

1. Python 3.11+        → https://www.python.org/downloads/
   (tick "Add to PATH" during install)

2. Node.js 18+         → https://nodejs.org/ (LTS version)

3. PostgreSQL 16       → https://www.postgresql.org/download/windows/
   (remember the password you set for the postgres user)

4. Git                 → https://git-scm.com/download/win

5. VSCode              → https://code.visualstudio.com/
   Recommended extensions:
   - Python (Microsoft)
   - ES7+ React/Redux/React-Native snippets
   - Prettier
   - GitLens

---

## FOLDER STRUCTURE

```
racks_school/
├── backend/              Django REST API
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env
│   ├── racks_api/        Django project settings
│   ├── users/            User accounts & auth
│   ├── products/         Products & categories
│   ├── orders/           Cart & orders
│   ├── payments/         Flutterwave integration
│   ├── promotions/       Flash sales & promos
│   └── delivery/         Delivery zones
│
├── frontend/             Next.js web app
│   ├── package.json
│   ├── .env.local
│   ├── components/       Reusable UI components
│   ├── pages/            Next.js pages (auto-routing)
│   ├── lib/              Utilities (API client, hooks)
│   └── styles/           CSS tokens
│
└── README.md             This file
```

---

## STEP-BY-STEP LOCAL SETUP

### Step 1 — PostgreSQL database

Open "SQL Shell (psql)" from the Start menu.
Press Enter 4 times to accept defaults, then enter your postgres password.

```sql
CREATE DATABASE racks_db;
CREATE USER racks_user WITH PASSWORD 'racks2026';
GRANT ALL PRIVILEGES ON DATABASE racks_db TO racks_user;
ALTER USER racks_user CREATEDB;
\q
```

### Step 2 — Backend

Open VSCode. Open Terminal (Ctrl + `).

```bash
cd backend

# Create Python virtual environment
python -m venv venv

# Activate it (Windows)
venv\Scripts\activate

# Install all packages
pip install -r requirements.txt

# Create __init__.py files
type nul > racks_api\__init__.py
type nul > users\__init__.py
type nul > products\__init__.py
type nul > orders\__init__.py
type nul > payments\__init__.py
type nul > promotions\__init__.py
type nul > delivery\__init__.py

# Run database migrations
python manage.py makemigrations users products orders payments promotions delivery
python manage.py migrate

# Create admin user
python manage.py createsuperuser
# Email: admin@racks.ug
# Password: racks2026

# Seed demo data
python manage.py seed_data

# Start the server
python manage.py runserver
```

API is now running at: http://localhost:8000
Admin panel:           http://localhost:8000/admin

### Step 3 — Frontend

Open a NEW terminal tab in VSCode (click the + button).

```bash
cd frontend
npm install
npm run dev
```

Website is now running at: http://localhost:3000

---

## DEMO WALKTHROUGH (for presentation)

1. Open http://localhost:3000
   → Onboarding modal appears for first-time visitors (HCI P.6)
   → Homepage shows products with stock levels (HCI P.3)

2. Click any product
   → Delivery info shown for your district (HCI P.3)
   → "Add to Cart" stays on the page (HCI P.7 — not forced to checkout)

3. Go to Cart → Checkout
   → MoMo field only accepts valid Uganda numbers (HCI P.5)
   → Pay button disabled until form is complete (HCI P.5)
   → Order saved as draft before payment (HCI P.4)

4. Open http://localhost:8000/admin
   → Django admin panel — manage products, orders, promotions

5. Create a promotion at http://localhost:8000/admin
   → Flash sale appears on homepage within 60 seconds (Celery scheduler)

---
