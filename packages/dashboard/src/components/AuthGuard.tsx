import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../utils/token';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
