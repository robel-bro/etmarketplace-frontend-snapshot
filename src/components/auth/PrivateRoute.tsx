// src/components/auth/PrivateRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
}

/**
 * Convert any role representation to a set of normalized role strings.
 * Handles:
 *  - user.roles: string[] | string (comma-separated)
 *  - user.role: string
 *  - user.role_mask: number
 *  - boolean flags: user.is_admin, user.is_sub_admin, user.is_seller
 */
function getUserRoles(user: any): Set<string> {
  const roles = new Set<string>();

  const normalize = (r: string) => {
    const role = r.toLowerCase().trim();
    if (role === 'subadmin' || role === 'staff' || role === 'sub-admin') return 'sub_admin';
    if (role === 'superadmin' || role === 'super_admin') return 'admin';
    return role;
  };

  // From array
  if (Array.isArray(user?.roles)) {
    user.roles.forEach((r: any) => roles.add(normalize(String(r))));
  }
  // From string (comma separated)
  else if (typeof user?.roles === 'string') {
    user.roles.split(',').forEach((r: string) => roles.add(normalize(r)));
  }

  // From singular role
  if (typeof user?.role === 'string') {
    roles.add(normalize(user.role));
  }

  // From role_mask (bitmask)
  const mask = user?.role_mask || 0;
  const maskMap: Record<string, number> = {
    customer: 1,
    seller: 2,
    admin: 4,
    sub_admin: 8,
    company: 16,
  };
  Object.entries(maskMap).forEach(([role, bit]) => {
    if (mask & bit) roles.add(role);
  });

  // Boolean flags
  if (user?.is_admin) roles.add('admin');
  if (user?.is_sub_admin || user?.is_subadmin) roles.add('sub_admin');
  if (user?.is_seller) roles.add('seller');
  if (user?.is_company) roles.add('company');

  // Fallback: if no roles found but user exists, add 'customer'
  if (roles.size === 0) roles.add('customer');

  return roles;
}

const PrivateRoute = ({ children, requiredRole }: PrivateRouteProps) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const userRoles = getUserRoles(user);

    // Debug log (remove after testing)
    console.log('[PrivateRoute] user roles:', [...userRoles], 'required:', allowed);

    const hasAccess = allowed.some(role => userRoles.has(role.toLowerCase()));

    if (!hasAccess) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default PrivateRoute;