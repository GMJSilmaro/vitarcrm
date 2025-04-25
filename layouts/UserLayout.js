import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import React from 'react';
import TechnicianLayout from './TechnicianLayout';

const UserLayout = ({ children }) => {
  const { currentUser, role, workerId } = useAuth();
  const router = useRouter();

  if (!currentUser || !role || !workerId) {
    router.push('/authentication/sign-in');
    return;
  }

  if (role === 'admin' || role === 'supervisor' || role === 'sales') {
    router.push('/dashboard');
  }

  const renderLayoutByRole = (role) => {
    switch (role.toLowerCase()) {
      case 'technician':
        return <TechnicianLayout>{children}</TechnicianLayout>;
      default:
        return <>{children}</>;
    }
  };

  return renderLayoutByRole(role);
};

export default UserLayout;
