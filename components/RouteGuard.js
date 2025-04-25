import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export function RouteGuard({ children }) {
  const { currentUser, role, workerId } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Don't run authorization check until router is ready
    if (!router.isReady) return;

    async function checkAuthorization() {
      console.log('Auth state:', {
        currentUser,
        role,
        workerId,
        path: router.pathname,
      });

      // If no user, redirect to sign-in
      if (!currentUser) {
        router.push('/authentication/sign-in');
        return;
      }

      const path = router.asPath;
      console.log('Checking authorization for path:', path, { role, workerId });

      // Define admin-only paths
      const adminPaths = ['/', '/dashboard', '/dashboard/overview'];

      if (role === 'admin' || role === 'supervisor' || role === 'sales') {
        // If admin is trying to access user dashboard, redirect to admin dashboard
        if (path.startsWith('/user/')) {
          router.push('/');
          return;
        }
        setAuthorized(true);
        return;
      }

      // Non-admin user access rules
      if (role !== 'admin') {
        // If trying to access admin paths, redirect to user dashboard
        if (adminPaths.includes(path)) {
          router.push(`/user/${workerId}`);
          return;
        }

        // Handle user dashboard access
        if (path.startsWith('/user/')) {
          const targetWorkerId = router.query.workerId;
          // Allow access only to their own dashboard
          if (targetWorkerId && targetWorkerId !== workerId) {
            router.push(`/user/${workerId}`);
            return;
          }
          setAuthorized(true);
          return;
        }

        // For any other path, redirect to user's dashboard
        router.push(`/user/${workerId}`);
        return;
      }

      setAuthorized(true);
    }

    checkAuthorization();
  }, [currentUser, router.isReady, router.pathname, router.query.workerId, workerId]);

  // Show nothing while checking authorization
  if (!router.isReady) {
    return null;
  }

  return authorized ? children : null;
}
