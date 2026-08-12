# Inventory, Sales & Accounts Manager — Frontend

React + Vite frontend for the Express/Prisma backend in `backend.zip`. Talks to
every route in `app.js`: auth, categories, products, staff, party, inventory,
sales, purchase, payment, ledger, and expenses.

## Setup

```bash
npm install
cp .env.example .env   # set VITE_API_URL to your backend, e.g. http://localhost:3000
npm run dev
```

Log in with a `system_users` account (see the backend's `db/seed.js` for
creating an admin user).

## Folder structure

```
src/
  api/
    axios.js          Axios instance — attaches JWT, normalises errors, redirects on 401
    endpoints.js       One function per backend route, grouped by resource
  context/
    AuthContext.jsx    Login/logout, current user, token persisted in localStorage
  components/
    layout/            Sidebar, Topbar, DashboardLayout (the app shell)
    ui/                 Button, Modal, DataTable, FormField, Badge, ConfirmDialog,
                        EmptyState, CrudPage (generic list+form for simple resources)
    ProtectedRoute.jsx  Redirects to /login when signed out; can also gate by role
  pages/
    Login.jsx
    Dashboard.jsx
    categories/        Categories CRUD (via CrudPage)
    products/           Products — custom page (category dropdown, live stock column)
    staff/              Staff CRUD, Admin-only
    party/               Customers/suppliers CRUD
    inventory/           Stock levels + adjustment modal + per-product movement log
    sales/                List, multi-line create form, detail view with cancel
    purchase/             List, multi-line create form, detail view
    payment/              List + create (linked to a party and/or staff member)
    expenses/             Expenses CRUD
    ledger/               Party picker + running balance + entry history
  utils/
    format.js           Money/date formatting helpers
```

## Role-based UI

The JWT payload carries `user_role` (Admin / Manager / Cashier / Staff — set
per system user). The UI mirrors the backend's `authorise()` checks where they
exist:

- **Categories**: create/edit needs Admin or Manager; delete needs Admin.
- **Staff**: the whole section is Admin/Manager-only (route-level restriction).
- Everything else currently has no role restriction on the backend, so the UI
  doesn't add one either — see "Necessary features to add" below.

## Known backend issues you'll hit

I read through every controller while building this. A few will break the
corresponding frontend flows until fixed on the backend side — happy to patch
these if you want:

1. **`sales.controller.js` → `create`**: destructures `partyID` but then uses
   an undeclared `party_id` and an undeclared `sales_by` variable inside the
   handler. Creating a sale will throw a `ReferenceError`. Also, the
   `inventory_log.create` calls inside both `sales.controller.js` and
   `purchase.controller.js` use field names `quantity` / `transaction_type` /
   `reference`, but the Prisma schema defines `change_quantity` /
   `change_type` / `reason` — this will throw a Prisma validation error even
   once the variable bug above is fixed.
2. **`sales`/`purchase` ledger writes**: both pass `reference_type` into
   `tx.ledger.create`, but the `ledger` model has no `reference_type` column
   (it has `transaction_type`, which they never set). Credit sales/purchases
   will fail at the ledger-write step.
3. **`product.controller.js` → `del`**: reads the id from `req.body.id`
   instead of `req.params.id`, and references undefined `category`/`inventory`
   variables in the response payload. I pointed the frontend's delete call at
   `req.body` to match the current backend, but the response formatting will
   still throw.
4. **`party.controller.js` → `update`**: destructures `partyRoll` (not
   `partyRole`) and writes to a `party_roll` field that doesn't exist on the
   `party` model. I left role out of the edit form entirely to avoid hitting
   this — role is only set at creation time in the UI.
5. **`purchase.controller.js` → `getAll`**: responds with `success:false`
   even when the query succeeds (a stray typo). The frontend treats HTTP
   status, not the `success` flag, as the source of truth here so it isn't
   affected, but worth fixing for consistency.
6. **`staff.controller.js` → `create`**: requires `staffJoiningdate` (lowercase
   `d`) — the frontend sends that exact key to match.

## Necessary features to add (frontend side)

- **Role-based restrictions past Categories/Staff.** Sales cancellation,
  purchase entry, payments, and expense edits currently have no `authorise()`
  guard on the backend and no restriction in the UI. Once you decide who
  should be able to do what, add the check to the relevant route and mirror
  it with a `roles` prop on `ProtectedRoute` or a role check in the page.
- **Pagination/search.** Every list page currently fetches the full table.
  Fine for coursework-scale data; add `?page=`/`?q=` params on both ends
  before this holds real data.
- **Toast notifications.** Success/error feedback is currently just an inline
  banner at the top of a form or page — a shared toast would read better for
  actions like "sale recorded" or "adjustment saved".
- **Cost price / expiry on products.** Your requirements doc mentioned cost
  price and expiry date on the product itself, but the schema only stores
  expiry per purchase line (`purchase_item.expiry_date`) — matches what's
  built here. If you want a product-level cost price for margin reporting,
  that needs a schema change first.
- **Password change / user management screen.** There's no endpoint for
  creating additional `system_users` beyond the seed script — worth adding
  a controller + a settings page if more than one login is needed.
