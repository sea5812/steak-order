import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useTableAuth } from './hooks/useTableAuth';

const CustomerMenuPage = lazy(() => import('./pages/customer/MenuPage'));
const CustomerOrderListPage = lazy(() => import('./pages/customer/OrderListPage'));
const CustomerOrderHistoryPage = lazy(() => import('./pages/customer/OrderHistoryPage'));
const TableSetupPage = lazy(() => import('./pages/setup/TableSetupPage'));
const AdminLoginPage = lazy(() => import('./pages/admin/LoginPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const AdminMenuManagePage = lazy(() => import('./pages/admin/MenuManagePage'));
const AdminTableManagePage = lazy(() => import('./pages/admin/TableManagePage'));
const AdminAccountPage = lazy(() => import('./pages/admin/AccountPage'));

function LoadingSpinner() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: 'var(--color-accent)',
        fontFamily: 'var(--font-serif)',
        fontSize: '1.2rem',
      }}
    >
      Loading...
    </div>
  );
}

function CustomerRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, error } = useTableAuth();
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated || error) return <Navigate to="/setup" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error.message || String(error) };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            gap: '16px',
            color: 'var(--color-text-secondary)',
          }}
        >
          <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-accent)' }}>
            오류가 발생했습니다
          </h2>
          <p>페이지를 새로고침해주세요.</p>
          <p style={{ fontSize: '0.8rem', color: '#666', maxWidth: '400px', textAlign: 'center' }}>
            {this.state.errorMessage}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, errorMessage: '' })}
            style={{
              padding: '12px 24px',
              background: 'var(--color-accent)',
              color: '#000',
              borderRadius: 'var(--radius-md)',
              fontWeight: 500,
            }}
            data-testid="error-boundary-retry"
          >
            다시 시도
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Customer Routes */}
          <Route path="/" element={<CustomerRoute><CustomerMenuPage /></CustomerRoute>} />
          <Route path="/order-list" element={<CustomerRoute><CustomerOrderListPage /></CustomerRoute>} />
          <Route path="/orders" element={<CustomerRoute><CustomerOrderHistoryPage /></CustomerRoute>} />

          {/* Setup */}
          <Route path="/setup" element={<TableSetupPage />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
          <Route path="/admin/menus" element={<AdminRoute><AdminMenuManagePage /></AdminRoute>} />
          <Route path="/admin/tables" element={<AdminRoute><AdminTableManagePage /></AdminRoute>} />
          <Route path="/admin/accounts" element={<AdminRoute><AdminAccountPage /></AdminRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
