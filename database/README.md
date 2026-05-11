# RACKS — Database

## Tables at a glance

| Table | Rows (demo) | Purpose |
|-------|------------|---------|
| users_user | 1 (admin) | All accounts |
| users_vendorprofile | 0 | Vendor store details |
| products_category | 8 | Product categories |
| products_product | 8 | All products |
| orders_cart | 0 | Persistent carts |
| orders_order | 0 | Orders (draft-first) |
| payments_payment | 0 | Payment attempts |
| promotions_promotion | 1 | Flash sales / deals |
| delivery_deliveryzone | 10 | Uganda districts |

---

## How Django creates these tables

You do NOT need to run schema.sql manually.
Django reads the models.py files and creates tables automatically:

    python manage.py makemigrations
    python manage.py migrate

schema.sql is provided so you can read and understand the
database structure without running Django.

---

## How to run schema.sql manually

Option 1 — SQL Shell (psql):
    \i C:/path/to/racks_school/database/schema.sql

Option 2 — Terminal:
    psql -U racks_user -d racks_db -f database/schema.sql

---

## The most important column in the entire database

orders_order.draft (BOOLEAN, default TRUE)

This single column is the fix for Dombelo's biggest HCI failure.

- draft=TRUE  → order saved, payment not yet confirmed
- draft=FALSE → Flutterwave webhook confirmed payment

The order is created with draft=TRUE BEFORE payment is called.
If payment fails for any reason, the order survives.
The user can retry without losing their cart.

Compare: Dombelo had no draft system.
Failed payment = cart wiped = user starts over.
