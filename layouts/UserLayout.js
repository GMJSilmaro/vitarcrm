import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import React from 'react';
import TechnicianLayout from './TechnicianLayout';

const UserLayout = ({ children }) => {
  const { currentUser, userRole, workerId, isAdmin } = useAuth();
  const router = useRouter();

  if (!currentUser || !userRole || !workerId) {
    router.push('/authentication/sign-in');
    return;
  }

  if (isAdmin) {
    router.push('/dashboard');
  }

  const renderLayoutByRole = (role) => {
    switch (role.toLowerCase()) {
      case 'worker':
        return <TechnicianLayout>{children}</TechnicianLayout>;
      default:
        return <>{children}</>;
    }
  };

  return renderLayoutByRole(userRole);
};

export default UserLayout;
