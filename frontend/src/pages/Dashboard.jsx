import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import {
  categoryApi,
  productApi,
  partyApi,
  inventoryApi,
  salesApi,
  purchaseApi,
} from '../api/endpoints';

import { formatMoney, formatDate } from '../utils/format';


// ============================================================
// DATE HELPERS
// ============================================================

function getLocalDate(offset = 0) {
  const date = new Date();

  date.setDate(date.getDate() + offset);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}


function getDateLabel(offset) {
  const date = new Date();

  date.setDate(date.getDate() + offset);

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
  });
}


// ============================================================
// SALE HELPERS
// ============================================================

function getSaleCustomer(sale) {
  return (
      sale?.party?.party_name ||
      sale?.party_name ||
      'Walk-in customer'
  );
}


function getSaleTotal(sale) {
  return Number(
      sale?.total_amount ??
      sale?.total ??
      0
  );
}


// ============================================================
// PURCHASE HELPERS
// ============================================================

function getPurchaseTotal(purchase) {
  return Number(
      purchase?.total_amount ??
      purchase?.total ??
      0
  );
}


// ============================================================
// DASHBOARD
// ============================================================

export default function Dashboard() {
  const { user } = useAuth();

  // ==========================================================
  // STATE
  // ==========================================================

  const [data, setData] = useState({
    categories: [],
    products: [],
    parties: [],
    inventory: [],

    // Today's data
    salesToday: [],
    purchasesToday: [],

    // All-time data
    allSales: [],
    allPurchases: [],

    // Chart
    weeklySales: [],

    // Recent sales
    recentSales: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


  // ==========================================================
  // LOAD DASHBOARD
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError('');

        const today = getLocalDate();
        const sevenDaysAgo = getLocalDate(-6);

        /*
         * We load:
         *
         * 1. Categories
         * 2. Products
         * 3. Parties
         * 4. Inventory
         * 5. Today's sales
         * 6. Today's purchases
         * 7. All sales
         * 8. All purchases
         * 9. Last 7 days sales
         */

        const results = await Promise.allSettled([

          // --------------------------------------------------
          // Categories
          // --------------------------------------------------

          categoryApi.list(),


          // --------------------------------------------------
          // Products
          // --------------------------------------------------

          productApi.list(),


          // --------------------------------------------------
          // Parties
          // --------------------------------------------------

          partyApi.list(),


          // --------------------------------------------------
          // Inventory
          // --------------------------------------------------

          inventoryApi.list(),


          // --------------------------------------------------
          // TODAY'S SALES
          // --------------------------------------------------

          salesApi.list({
            start_date: today,
            end_date: today,
          }),


          // --------------------------------------------------
          // TODAY'S PURCHASES
          // --------------------------------------------------

          purchaseApi.list({
            start_date: today,
            end_date: today,
          }),


          // --------------------------------------------------
          // ALL SALES
          // --------------------------------------------------

          salesApi.list(),


          // --------------------------------------------------
          // ALL PURCHASES
          // --------------------------------------------------

          purchaseApi.list(),


          // --------------------------------------------------
          // LAST 7 DAYS SALES
          // --------------------------------------------------

          salesApi.list({
            start_date: sevenDaysAgo,
            end_date: today,
          }),
        ]);


        if (!mounted) return;


        // ====================================================
        // RESULTS
        // ====================================================

        const [
          categories,
          products,
          parties,
          inventory,
          salesToday,
          purchasesToday,
          allSales,
          allPurchases,
          weeklySales,
        ] = results;


        // ====================================================
        // CHECK IF EVERYTHING FAILED
        // ====================================================

        if (
            results.every(
                (result) => result.status === 'rejected'
            )
        ) {
          setError(
              'Could not connect to the backend. Check your API server and VITE_API_URL.'
          );
        }


        // ====================================================
        // SAVE DATA
        // ====================================================

        setData({

          // --------------------------------------------------
          // Categories
          // --------------------------------------------------

          categories:
              categories.status === 'fulfilled' &&
              Array.isArray(categories.value)
                  ? categories.value
                  : [],


          // --------------------------------------------------
          // Products
          // --------------------------------------------------

          products:
              products.status === 'fulfilled' &&
              Array.isArray(products.value)
                  ? products.value
                  : [],


          // --------------------------------------------------
          // Parties
          // --------------------------------------------------

          parties:
              parties.status === 'fulfilled' &&
              Array.isArray(parties.value)
                  ? parties.value
                  : [],


          // --------------------------------------------------
          // Inventory
          // --------------------------------------------------

          inventory:
              inventory.status === 'fulfilled' &&
              Array.isArray(inventory.value)
                  ? inventory.value
                  : [],


          // --------------------------------------------------
          // Today's Sales
          // --------------------------------------------------

          salesToday:
              salesToday.status === 'fulfilled' &&
              Array.isArray(salesToday.value)
                  ? salesToday.value
                  : [],


          // --------------------------------------------------
          // Today's Purchases
          // --------------------------------------------------

          purchasesToday:
              purchasesToday.status === 'fulfilled' &&
              Array.isArray(purchasesToday.value)
                  ? purchasesToday.value
                  : [],


          // --------------------------------------------------
          // All Sales
          // --------------------------------------------------

          allSales:
              allSales.status === 'fulfilled' &&
              Array.isArray(allSales.value)
                  ? allSales.value
                  : [],


          // --------------------------------------------------
          // All Purchases
          // --------------------------------------------------

          allPurchases:
              allPurchases.status === 'fulfilled' &&
              Array.isArray(allPurchases.value)
                  ? allPurchases.value
                  : [],


          // --------------------------------------------------
          // Weekly Sales
          // --------------------------------------------------

          weeklySales:
              weeklySales.status === 'fulfilled' &&
              Array.isArray(weeklySales.value)
                  ? weeklySales.value
                  : [],


          // --------------------------------------------------
          // Recent Sales
          // --------------------------------------------------

          recentSales:
              salesToday.status === 'fulfilled' &&
              Array.isArray(salesToday.value)
                  ? salesToday.value.slice(0, 5)
                  : [],
        });


      } catch (err) {

        console.error(
            'Dashboard loading error:',
            err
        );

        if (mounted) {
          setError(
              'Could not load dashboard data.'
          );
        }

      } finally {

        if (mounted) {
          setLoading(false);
        }
      }
    }


    loadDashboard();


    return () => {
      mounted = false;
    };

  }, []);


  // ==========================================================
  // LOW STOCK
  // ==========================================================

  const lowStockProducts = useMemo(() => {

    return data.inventory
        .filter(
            (item) =>
                Number(item.remaining_quantity) <= 5
        )
        .sort(
            (a, b) =>
                Number(a.remaining_quantity) -
                Number(b.remaining_quantity)
        )
        .slice(0, 5);

  }, [data.inventory]);


  // ==========================================================
  // TODAY'S SALES
  // ==========================================================

  const todaySales = useMemo(() => {

    return data.salesToday.reduce(
        (total, sale) =>
            total + getSaleTotal(sale),
        0
    );

  }, [data.salesToday]);


  // ==========================================================
  // TODAY'S PURCHASES
  // ==========================================================

  const todayPurchases = useMemo(() => {

    return data.purchasesToday.reduce(
        (total, purchase) =>
            total + getPurchaseTotal(purchase),
        0
    );

  }, [data.purchasesToday]);


  // ==========================================================
  // TOTAL SALES
  // ==========================================================

  const totalSales = useMemo(() => {

    return data.allSales.reduce(
        (total, sale) =>
            total + getSaleTotal(sale),
        0
    );

  }, [data.allSales]);


  // ==========================================================
  // TOTAL PURCHASES
  // ==========================================================

  const totalPurchases = useMemo(() => {

    return data.allPurchases.reduce(
        (total, purchase) =>
            total + getPurchaseTotal(purchase),
        0
    );

  }, [data.allPurchases]);


  // ==========================================================
  // WEEKLY SALES
  // ==========================================================

  const weeklySales = useMemo(() => {

    const days = [];

    for (let i = -6; i <= 0; i++) {

      const date = getLocalDate(i);


      const total = data.weeklySales

          .filter((sale) => {

            if (!sale?.sales_date) {
              return false;
            }


            const saleDate =
                new Date(sale.sales_date);


            const year =
                saleDate.getFullYear();


            const month =
                String(
                    saleDate.getMonth() + 1
                ).padStart(2, '0');


            const day =
                String(
                    saleDate.getDate()
                ).padStart(2, '0');


            const formattedDate =
                `${year}-${month}-${day}`;


            return formattedDate === date;

          })


          .reduce(
              (sum, sale) =>
                  sum + getSaleTotal(sale),
              0
          );


      days.push({

        date,

        label: getDateLabel(i),

        value: total,

      });
    }


    return days;

  }, [data.weeklySales]);


  // ==========================================================
  // MAXIMUM SALES FOR CHART
  // ==========================================================

  const maxSales = Math.max(
      ...weeklySales.map(
          (item) => item.value
      ),
      1
  );


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

      <div className="dashboard">


        {/* ======================================================
          HEADER
      ====================================================== */}

        <section className="dashboard-hero">

          <div>

            <div className="eyebrow">
              BUSINESS OVERVIEW
            </div>


            <h1>
              Good morning, {user?.name || 'there'}
            </h1>


            <p>
              Here's what's happening with your business today.
            </p>

          </div>


          <div className="dashboard-actions">

            <Link
                to="/sales/new"
                className="btn btn-primary dashboard-primary-action"
            >

              <span>＋</span>

              New Sale

            </Link>


            <Link
                to="/purchase/new"
                className="btn dashboard-secondary-action"
            >

              <span>＋</span>

              Purchase

            </Link>

          </div>

        </section>


        {/* ======================================================
          ERROR
      ====================================================== */}

        {error && (

            <div className="error-banner">

              <strong>
                Connection problem:
              </strong>{' '}

              {error}

            </div>

        )}


        {/* ======================================================
          STAT CARDS
      ====================================================== */}

        <section className="dashboard-stat-grid">


          {/* ====================================================
            TODAY'S SALES
        ==================================================== */}

          <div className="dashboard-stat-card stat-sales">

            <div className="dashboard-stat-top">

              <div className="dashboard-stat-icon">
                $
              </div>

              <span className="stat-live">
              TODAY
            </span>

            </div>


            <div className="dashboard-stat-value">

              {loading
                  ? '—'
                  : formatMoney(todaySales)}

            </div>


            <div className="dashboard-stat-label">
              Today's Sales
            </div>


            <div className="dashboard-stat-meta">

              {data.salesToday.length}{' '}

              transaction
              {data.salesToday.length !== 1
                  ? 's'
                  : ''}

            </div>

          </div>


          {/* ====================================================
            TOTAL PURCHASES
        ==================================================== */}

          <div className="dashboard-stat-card stat-purchases">

            <div className="dashboard-stat-top">

              <div className="dashboard-stat-icon">
                ↗
              </div>

              <span className="stat-live">
              ALL TIME
            </span>

            </div>


            <div className="dashboard-stat-value">

              {loading
                  ? '—'
                  : formatMoney(totalPurchases)}

            </div>


            <div className="dashboard-stat-label">
              Total Purchases
            </div>


            <div className="dashboard-stat-meta">

              {data.allPurchases.length}{' '}

              purchase
              {data.allPurchases.length !== 1
                  ? 's'
                  : ''}

            </div>

          </div>


          {/* ====================================================
            TOTAL SALES
        ==================================================== */}

          <div className="dashboard-stat-card stat-products">

            <div className="dashboard-stat-top">

              <div className="dashboard-stat-icon">
                $
              </div>

              <span className="stat-live">
              ALL TIME
            </span>

            </div>


            <div className="dashboard-stat-value">

              {loading
                  ? '—'
                  : formatMoney(totalSales)}

            </div>


            <div className="dashboard-stat-label">
              Total Sales
            </div>


            <div className="dashboard-stat-meta">

              {data.allSales.length}{' '}

              transaction
              {data.allSales.length !== 1
                  ? 's'
                  : ''}

            </div>

          </div>


          {/* ====================================================
            LOW STOCK
        ==================================================== */}

          <div className="dashboard-stat-card stat-warning">

            <div className="dashboard-stat-top">

              <div className="dashboard-stat-icon">
                !
              </div>

              <span className="stat-live warning">
              ATTENTION
            </span>

            </div>


            <div className="dashboard-stat-value">

              {loading
                  ? '—'
                  : lowStockProducts.length}

            </div>


            <div className="dashboard-stat-label">
              Low Stock Items
            </div>


            <div className="dashboard-stat-meta">
              Stock level ≤ 5
            </div>

          </div>

        </section>


        {/* ======================================================
          MAIN GRID
      ====================================================== */}

        <section className="dashboard-main-grid">


          {/* ====================================================
            SALES CHART
        ==================================================== */}

          <div className="dashboard-card dashboard-chart-card">

            <div className="dashboard-card-header">

              <div>

                <div className="card-kicker">
                  PERFORMANCE
                </div>


                <h2>
                  Sales Overview
                </h2>


                <p>
                  Sales activity during the last 7 days
                </p>

              </div>


              <Link
                  to="/sales"
                  className="text-link"
              >
                View all →
              </Link>

            </div>


            <div className="sales-chart">


              {/* Y AXIS */}

              <div className="chart-y">

              <span>
                {formatMoney(maxSales)}
              </span>

                <span>
                {formatMoney(maxSales * 0.75)}
              </span>

                <span>
                {formatMoney(maxSales * 0.5)}
              </span>

                <span>
                {formatMoney(maxSales * 0.25)}
              </span>

                <span>
                0
              </span>

              </div>


              <div className="chart-content">


                {/* CHART LINES */}

                <div className="chart-lines">

                  <span />
                  <span />
                  <span />
                  <span />
                  <span />

                </div>


                {/* CHART BARS */}

                <div className="chart-bars">

                  {weeklySales.map((day) => {

                    const height =
                        day.value === 0
                            ? 4
                            : Math.max(
                                (day.value / maxSales) *
                                100,
                                8
                            );


                    return (

                        <div
                            className="chart-column"
                            key={day.date}
                        >

                          <div className="chart-bar-wrapper">

                            <div
                                className="chart-bar"
                                style={{
                                  height: `${height}%`,
                                }}
                                title={`${day.label}: ${formatMoney(
                                    day.value
                                )}`}
                            />

                          </div>


                          <span className="chart-label">

                        {day.label}

                      </span>

                        </div>

                    );

                  })}

                </div>

              </div>

            </div>

          </div>


          {/* ====================================================
            QUICK ACTIONS
        ==================================================== */}

          <div className="dashboard-card quick-actions-card">

            <div className="dashboard-card-header">

              <div>

                <div className="card-kicker">
                  SHORTCUTS
                </div>


                <h2>
                  Quick Actions
                </h2>


                <p>
                  Common business tasks
                </p>

              </div>

            </div>


            <div className="quick-action-list">


              {/* NEW SALE */}

              <Link
                  to="/sales/new"
                  className="quick-action"
              >

              <span className="quick-icon green">
                $
              </span>


                <span className="quick-content">

                <strong>
                  New Sale
                </strong>

                <small>
                  Create a customer sale
                </small>

              </span>


                <span className="quick-arrow">
                →
              </span>

              </Link>


              {/* NEW PURCHASE */}

              <Link
                  to="/purchase/new"
                  className="quick-action"
              >

              <span className="quick-icon blue">
                +
              </span>


                <span className="quick-content">

                <strong>
                  New Purchase
                </strong>

                <small>
                  Record supplier stock
                </small>

              </span>


                <span className="quick-arrow">
                →
              </span>

              </Link>


              {/* PRODUCTS */}

              <Link
                  to="/products"
                  className="quick-action"
              >

              <span className="quick-icon purple">
                ◈
              </span>


                <span className="quick-content">

                <strong>
                  Manage Products
                </strong>

                <small>
                  Add or update products
                </small>

              </span>


                <span className="quick-arrow">
                →
              </span>

              </Link>


              {/* PARTIES */}

              <Link
                  to="/party"
                  className="quick-action"
              >

              <span className="quick-icon orange">
                ♙
              </span>


                <span className="quick-content">

                <strong>
                  Manage Parties
                </strong>

                <small>
                  Customers and suppliers
                </small>

              </span>


                <span className="quick-arrow">
                →
              </span>

              </Link>

            </div>

          </div>

        </section>


        {/* ======================================================
          LOWER GRID
      ====================================================== */}

        <section className="dashboard-bottom-grid">


          {/* ====================================================
            RECENT SALES
        ==================================================== */}

          <div className="dashboard-card">

            <div className="dashboard-card-header">

              <div>

                <div className="card-kicker">
                  TRANSACTIONS
                </div>


                <h2>
                  Recent Sales
                </h2>


                <p>
                  Today's latest sales
                </p>

              </div>


              <Link
                  to="/sales"
                  className="text-link"
              >
                View all →
              </Link>

            </div>


            {data.recentSales.length === 0 ? (

                <div className="dashboard-empty">

                  <div className="empty-icon">
                    $
                  </div>


                  <strong>
                    No sales today
                  </strong>


                  <span>
                Sales recorded today will appear here.
              </span>

                </div>

            ) : (

                <div className="recent-list">

                  {data.recentSales.map((sale) => {

                    const customer =
                        getSaleCustomer(sale);


                    const status =
                        String(
                            sale?.status ||
                            'ACTIVE'
                        ).toUpperCase();


                    return (

                        <Link
                            to={`/sales/${sale.sales_id}`}
                            className="recent-row"
                            key={sale.sales_id}
                        >


                          <div className="recent-main">

                            <div className="recent-avatar">

                              {customer
                                  .charAt(0)
                                  .toUpperCase()}

                            </div>


                            <div>

                              <strong>
                                {customer}
                              </strong>


                              <span>
                          {formatDate(
                              sale.sales_date
                          )}
                        </span>

                            </div>

                          </div>


                          <div className="recent-side">

                            <strong>

                              {formatMoney(
                                  getSaleTotal(sale)
                              )}

                            </strong>


                            <span
                                className={`status-pill ${
                                    status === 'CANCELLED'
                                        ? 'danger'
                                        : String(
                                            sale.sales_type
                                        ).toLowerCase() ===
                                        'credit'
                                            ? 'warning'
                                            : 'success'
                                }`}
                            >

                        {status === 'CANCELLED'
                            ? 'Cancelled'
                            : sale.sales_type ||
                            'Cash'}

                      </span>

                          </div>

                        </Link>

                    );

                  })}

                </div>

            )}

          </div>


          {/* ====================================================
            LOW STOCK
        ==================================================== */}

          <div className="dashboard-card">

            <div className="dashboard-card-header">

              <div>

                <div className="card-kicker">
                  INVENTORY
                </div>


                <h2>
                  Low Stock
                </h2>


                <p>
                  Products that need attention
                </p>

              </div>


              <Link
                  to="/inventory"
                  className="text-link"
              >
                Inventory →
              </Link>

            </div>


            {lowStockProducts.length === 0 ? (

                <div className="dashboard-empty success-empty">

                  <div className="empty-icon success">
                    ✓
                  </div>


                  <strong>
                    Inventory looks good
                  </strong>


                  <span>
                No products are currently low on stock.
              </span>

                </div>

            ) : (

                <div className="stock-list">

                  {lowStockProducts.map((item) => {

                    const quantity =
                        Number(
                            item.remaining_quantity
                        );


                    const productName =
                        item.product?.product_name ||
                        item.product_name ||
                        'Product';


                    return (

                        <div
                            className="stock-row"
                            key={
                                item.product_id ||
                                productName
                            }
                        >


                          <div className="stock-main">

                            <div className="stock-product-icon">
                              ◈
                            </div>


                            <div>

                              <strong>
                                {productName}
                              </strong>


                              <span>
                          Stock remaining
                        </span>

                            </div>

                          </div>


                          <div
                              className={`stock-quantity ${
                                  quantity <= 2
                                      ? 'critical'
                                      : ''
                              }`}
                          >

                            <strong>
                              {quantity}
                            </strong>


                            <span>
                        units
                      </span>

                          </div>

                        </div>

                    );

                  })}

                </div>

            )}

          </div>

        </section>


        {/* ======================================================
          BUSINESS SUMMARY
      ====================================================== */}

        <section className="dashboard-summary-grid">


          {/* PRODUCTS */}

          <Link
              to="/products"
              className="summary-mini-card"
          >

          <span className="summary-mini-icon">
            ◈
          </span>


            <span>

            <strong>
              {data.products.length}
            </strong>


            <small>
              Products
            </small>

          </span>


            <span className="summary-arrow">
            →
          </span>

          </Link>


          {/* PARTIES */}

          <Link
              to="/party"
              className="summary-mini-card"
          >

          <span className="summary-mini-icon">
            ♙
          </span>


            <span>

            <strong>
              {data.parties.length}
            </strong>


            <small>
              Parties
            </small>

          </span>


            <span className="summary-arrow">
            →
          </span>

          </Link>


          {/* CATEGORIES */}

          <Link
              to="/categories"
              className="summary-mini-card"
          >

          <span className="summary-mini-icon">
            #
          </span>


            <span>

            <strong>
              {data.categories.length}
            </strong>


            <small>
              Categories
            </small>

          </span>


            <span className="summary-arrow">
            →
          </span>

          </Link>


          {/* LEDGER */}

          <Link
              to="/ledger"
              className="summary-mini-card"
          >

          <span className="summary-mini-icon">
            ≡
          </span>


            <span>

            <strong>
              Ledger
            </strong>


            <small>
              View balances
            </small>

          </span>


            <span className="summary-arrow">
            →
          </span>

          </Link>

        </section>

      </div>

  );
}