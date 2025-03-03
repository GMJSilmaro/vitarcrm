import React from 'react';
import { Container } from 'react-bootstrap';
import { useRouter } from 'next/router';
import ContentHeader from '@/components/dashboard/ContentHeader';
import { House, Tools } from 'react-bootstrap-icons';

const CalibrationLayout = ({ children, category, title, description }) => {
  const router = useRouter();

  const formatCategoryName = (cat) => {
    if (!cat) return '';
    return cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
  };

  return (
    <>
      <ContentHeader
        title={title || `${formatCategoryName(category)} Calibration`}
        description={description || 'Welcome back to calibration management, Admin'}
        badgeText='Calibration Management'
        badgeText2={formatCategoryName(category)}
        breadcrumbItems={[
          {
            icon: <House className='me-2' size={14} />,
            text: 'Dashboard',
            link: '/dashboard',
          },
          {
            icon: <Tools className='me-2' size={14} />,
            text: 'Calibration',
            link: '/dashboard/calibration',
          },
          category && {
            text: `${formatCategoryName(category)} Calibration`,
          },
        ].filter(Boolean)}
        customStyles={{
          marginBottom: '2rem',
          textTransform: 'capitalize',
        }}
      />
      <Container fluid className='p-3'>
        {children}
      </Container>
    </>
  );
};

export default CalibrationLayout;
