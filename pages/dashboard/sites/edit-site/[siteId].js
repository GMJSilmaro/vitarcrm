import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import SiteForm from '@/sub-components/dashboard/sites/SiteForm';
import { GeeksSEO } from '@/widgets';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Card, Spinner } from 'react-bootstrap';
import { ArrowLeftShort, BuildingFill, Eye, HouseFill, PencilFill } from 'react-bootstrap-icons';

const EditSite = () => {
  const router = useRouter();
  const { siteId } = router.query;

  const [site, setSite] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  //* query the site
  useEffect(() => {
    if (siteId) {
      const siteRef = doc(db, 'locations', siteId);

      getDoc(siteRef)
        .then((doc) => {
          if (doc.exists) {
            const data = doc.data();

            setSite({
              id: doc.id,
              ...data,
            });

            setIsLoading(false);
          } else {
            setError('Site not found');
            setIsLoading(false);
          }
        })
        .catch((err) => {
          setError(err.message || 'Error fetching site');
          setIsLoading(false);
        });
    }
  }, [siteId]);

  if (isLoading) {
    return (
      <div className='d-flex justify-content-center align-items-center' style={{ height: '100vh' }}>
        <Spinner animation='border' variant='primary' />
        <span className='ms-3'>Loading Site...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3 className='text-danger'>Error</h3>
          <p className='text-muted'>{error}</p>
          <button className='btn btn-primary' onClick={() => router.push('/sites')}>
            Back to Site List
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <GeeksSEO title='Edit Site | VITAR- GROUP | CRM & Calibration | Portal' />

      <ContentHeader
        title='Edit Site'
        description="Update site's basic information, address details and contact details"
        badgeText='Site Management'
        badgeText2='Edit Site'
        breadcrumbItems={[
          {
            icon: <HouseFill className='me-2' size={14} />,
            text: 'Dashboard',
            link: '/dashboard',
          },
          {
            icon: <BuildingFill className='me-2' size={14} />,
            text: 'Sites',
            link: '/sites',
          },
          {
            icon: <PencilFill className='me-2' size={14} />,
            text: site ? site.id : 'Create',
          },
        ]}
        actionButtons={[
          {
            text: 'Back',
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () => router.push('/sites'),
          },
        ]}
        dropdownItems={[
          {
            label: 'View Site',
            icon: Eye,
            onClick: () => router.push(`/sites/view/${siteId}`),
          },
        ]}
      />

      <Card>
        <Card.Body>
          <SiteForm data={site} />
        </Card.Body>
      </Card>
    </>
  );
};

export default EditSite;
