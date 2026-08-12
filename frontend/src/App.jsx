import {
    createBrowserRouter,
    createRoutesFromElements,
    Route,
    RouterProvider,
} from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CategoriesPage from './pages/categories/CategoriesPage';
import ProductsPage from './pages/products/ProductsPage';
import StaffPage from './pages/staff/StaffPage';
import PartyPage from './pages/party/PartyPage';
import InventoryPage from './pages/inventory/InventoryPage';
import InventoryLogsPage from './pages/inventory/InventoryLogsPage';
import SalesPage from './pages/sales/SalesPage';
import SalesFormPage from './pages/sales/SalesFormPage';
import SalesDetailPage from './pages/sales/SalesDetailPage';
import PurchasePage from './pages/purchase/PurchasePage';
import PurchaseFormPage from './pages/purchase/PurchaseFormPage';
import PurchaseDetailPage from './pages/purchase/PurchaseDetailPage';
import PaymentPage from './pages/payment/PaymentPage';
import ExpensesPage from './pages/expenses/ExpensesPage';
import LedgerPage from './pages/ledger/LedgerPage';
import UsersPage from './pages/users/UsersPage';

const router = createBrowserRouter(
    createRoutesFromElements(
        <>
            {/* Login */}
            <Route path="/login" element={<Login />} />

            {/* Protected dashboard */}
            <Route
                element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }
            >
                <Route
                    path="/"
                    element={<Dashboard />}
                    handle={{ title: 'Dashboard' }}
                />

                <Route
                    path="/categories"
                    element={<CategoriesPage />}
                    handle={{ title: 'Categories' }}
                />

                <Route
                    path="/products"
                    element={<ProductsPage />}
                    handle={{ title: 'Products' }}
                />

                <Route
                    path="/inventory"
                    element={<InventoryPage />}
                    handle={{ title: 'Inventory' }}
                />

                <Route
                    path="/inventory/:productId/logs"
                    element={<InventoryLogsPage />}
                    handle={{ title: 'Stock log' }}
                />

                <Route
                    path="/sales"
                    element={<SalesPage />}
                    handle={{ title: 'Sales' }}
                />

                <Route
                    path="/sales/new"
                    element={<SalesFormPage />}
                    handle={{ title: 'New sale' }}
                />

                <Route
                    path="/sales/:id"
                    element={<SalesDetailPage />}
                    handle={{ title: 'Sale detail' }}
                />

                <Route
                    path="/purchase"
                    element={<PurchasePage />}
                    handle={{ title: 'Purchases' }}
                />

                <Route
                    path="/purchase/new"
                    element={<PurchaseFormPage />}
                    handle={{ title: 'New purchase' }}
                />

                <Route
                    path="/purchase/:id"
                    element={<PurchaseDetailPage />}
                    handle={{ title: 'Purchase detail' }}
                />

                <Route
                    path="/payment"
                    element={<PaymentPage />}
                    handle={{ title: 'Payments' }}
                />

                <Route
                    path="/ledger"
                    element={<LedgerPage />}
                    handle={{ title: 'Ledger' }}
                />

                <Route
                    path="/expenses"
                    element={<ExpensesPage />}
                    handle={{ title: 'Expenses' }}
                />

                <Route
                    path="/staff"
                    element={
                        <ProtectedRoute roles={['Admin', 'Manager']}>
                            <StaffPage />
                        </ProtectedRoute>
                    }
                    handle={{ title: 'Staff' }}
                />


                <Route
                    path="/party"
                    element={<PartyPage />}
                    handle={{ title: 'Parties' }}
                />
                <Route
                    path="/users"
                    element={
                        <ProtectedRoute roles={['Admin']}>
                            <UsersPage />
                        </ProtectedRoute>
                    }
                    handle={{ title: 'User accounts' }}
                />

            </Route>


            {/* 404 */}
            <Route
                path="*"
                element={
                    <div className="empty-state">
                        <h3>Page not found</h3>
                    </div>
                }
            />
        </>
    )
);

export default function App() {
    return <RouterProvider router={router} />;
}