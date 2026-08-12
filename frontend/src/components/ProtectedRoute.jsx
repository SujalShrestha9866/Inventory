import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// roles: optional array of allowed user_role values. Omit to allow any
// authenticated user.
export default function ProtectedRoute({ children, roles }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.user_role)) {
    return (
      <div className="empty-state">
        <h3>You don't have permission to view this page</h3>
        <p>This section is restricted to: {roles.join(', ')}</p>
      </div>
    );
  }

  return children;
}
