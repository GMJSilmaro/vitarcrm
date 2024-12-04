import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { validateWorkerAccess } from '../utils/middlewareClient';

export function RouteGuard({ children, requiredRole }) {
  const { currentUser, userRole, workerId } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function checkAuthorization() {
      if (!currentUser) {
        router.push('/sign-in');
        return;
      }

      // Normalize roles for comparison
      const normalizedRole = userRole?.toLowerCase();
      const requiredNormalizedRole = requiredRole?.toLowerCase();

      if (requiredRole && normalizedRole !== requiredNormalizedRole) {
        console.log('Role mismatch:', { 
          required: requiredNormalizedRole, 
          current: normalizedRole 
        });
        router.push('/unauthorized');
        return;
      }

      // For worker profile routes
      if (router.pathname.startsWith('/user/')) {
        const targetWorkerId = router.query.workerId;
        const isAdmin = normalizedRole === 'admin';
        const isSupervisor = normalizedRole === 'supervisor';
        const isOwnProfile = targetWorkerId === workerId;

        if (!isAdmin && !isSupervisor && !isOwnProfile) {
          console.log('Unauthorized profile access:', {
            targetWorkerId,
            currentWorkerId: workerId,
            role: normalizedRole
          });
          router.push('/unauthorized');
          return;
        }
      }

      setAuthorized(true);
    }

    checkAuthorization();
  }, [currentUser, userRole, router, requiredRole, workerId]);

  return authorized ? children : null;
} 