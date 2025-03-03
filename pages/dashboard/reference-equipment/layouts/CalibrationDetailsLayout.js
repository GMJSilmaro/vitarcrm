import React from 'react';
import { Container } from 'react-bootstrap';
import { useRouter } from 'next/router';
import ContentHeader from '@/components/dashboard/ContentHeader';
import CertificatePreview from '@/components/dashboard/calibration/CertificatePreview';
import { House, Tools } from 'react-bootstrap-icons';

const CalibrationDetailsLayout = ({ 
  children, 
  equipment,
  actions,
  showCertificate,
  onHideCertificate,
}) => {
  const router = useRouter();
  const { category } = router.query;

  const formatCategoryName = (cat) => {
    if (!cat) return '';
    return cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
  };

  return (
    <>
      <ContentHeader
        title={equipment?.description}
        description={`${formatCategoryName(category)} Equipment Details`}
        badgeText="NA"
        badgeText2={equipment?.category}
        breadcrumbItems={[
          { 
            icon: <House className="me-2" size={14} />, 
            text: 'Dashboard', 
            link: '/dashboard' 
          },
          { 
            icon: <Tools className="me-2" size={14} />, 
            text: 'Calibration',
            link: '/dashboard/calibration'
          },
          {
            text: `${formatCategoryName(category)} Calibration`,
            link: `/dashboard/calibration/${category}`
          },
          {
            text: equipment?.description
          }
        ].filter(Boolean)}
        infoText={equipment ? `Tag ID: ${equipment.tagId} | Certificate No: ${equipment.certificateNo}` : null}
        customStyles={{
          marginBottom: '2rem'
        }}
        actionButtons={actions}
      />
      <Container fluid className="p-3">
        {children}
      </Container>

      {/* Certificate Modal */}
      {equipment && (
        <CertificatePreview
          show={showCertificate}
          onHide={onHideCertificate}
          equipment={equipment}
          certificate={{
            certificateNo: equipment.certificateNo,
            // ... certificate data
          }}
        />
      )}
    </>
  );
};

export default CalibrationDetailsLayout; 