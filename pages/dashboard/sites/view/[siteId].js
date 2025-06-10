import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import AddressDetailsTab from '@/sub-components/dashboard/sites/view/AddressDetailsTab';
import BasicInfoTab from '@/sub-components/dashboard/sites/view/BasicInfoTab';
import SiteContacts from '@/sub-components/dashboard/sites/view/SiteContacts';
import { GeeksSEO } from '@/widgets';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Card, Spinner, Tab, Tabs } from 'react-bootstrap';
import {
  ArrowLeftShort,
  BuildingFill,
  EyeFill,
  HouseFill,
  PencilSquare,
} from 'react-bootstrap-icons';

const SiteDetails = () => {
  const router = useRouter();
  const { siteId } = router.query;

  const [site, setSite] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('0');

  //* query the site
  useEffect(() => {
    if (siteId) {
      const siteRef = doc(db, 'locations', siteId);

      getDoc(siteRef)
        .then((doc) => {
          if (doc.exists()) {
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
      <GeeksSEO title='View Site | VITAR- GROUP | CRM & Calibration | Portal' />

      <ContentHeader
        title={`View Details for Site #${site.id}`}
        description='View comprehensive site details including site basic information, address details & site contacts.'
        badgeText='Site Management'
        badgeText2='View Site'
        breadcrumbItems={[
          {
            icon: <HouseFill className='me-2' size={14} />,
            text: 'Dashboard',
            link: '/dashboard',
          },
          {
            icon: <BuildingFill className='me-2' size={14} />,
            text: 'Site',
            link: '/sites',
          },
          {
            icon: <EyeFill className='me-2' size={14} />,
            text: siteId,
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
            label: 'Edit Site',
            icon: PencilSquare,
            onClick: () => router.push(`/sites/edit-site/${siteId}`),
          },
        ]}
      />

      <Card>
        <Card.Body>
          <Tabs activeKey={activeTab} onSelect={setActiveTab}>
            <Tab eventKey='0' title='Basic Information'>
              <BasicInfoTab site={site} />
            </Tab>
            <Tab eventKey='1' title='Address Details'>
              <AddressDetailsTab site={site} />
            </Tab>
            <Tab eventKey='2' title='Site Contacts'>
              <SiteContacts site={site} />
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </>
  );
};

export default SiteDetails;
