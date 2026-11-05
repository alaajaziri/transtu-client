import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homeFor } from '../utils/roles';
import { Spinner } from './ui';

/** <ProtectedRoute /> : connexion obligatoire.  <ProtectedRoute roles={['driver']} /> : + rôle obligatoire. */
export default function ProtectedRoute({ roles }) {
  const { isAuthenticated, booting, user } = useAuth();
  const loc = useLocation();
  if (booting) return <Spinner />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search, notice: 'Connectez-vous pour continuer.' }} />;
  }
  if (roles && !roles.includes(user?.role)) {
    return <Navigate to={user ? homeFor(user) : '/'} replace />;
  }
  return <Outlet />;
}
