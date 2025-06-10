import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import Document from '@/sub-components/dashboard/worker/view/DocumentSignature';
import Overview from '@/sub-components/dashboard/worker/view/Overview';
import { GeeksSEO } from '@/widgets';
import { doc, getDoc } from 'firebase/firestore';

import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Badge, Button, Card, Image, Spinner, Tab, Tabs } from 'react-bootstrap';
import {
  ArrowLeftShort,
  Envelope,
  EyeFill,
  HouseDoorFill,
  Pencil,
  PencilSquare,
  PeopleFill,
  Telephone,
} from 'react-bootstrap-icons';

const UserDetails = () => {
  const router = useRouter();
  const { uid } = router.query;

  const [user, setUser] = useState();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('0');

  //* query user
  useEffect(() => {
    if (uid) {
      const userRef = doc(db, 'users', uid);

      getDoc(userRef)
        .then((doc) => {
          if (doc.exists()) {
            setUser({ id: doc.id, ...doc.data() });
            setIsLoading(false);
          } else {
            setError('Reference Data not found');
            setIsLoading(false);
          }
        })
        .catch((err) => {
          setError(err.message || 'Error fetching user data');
          setIsLoading(false);
        });
    }
  }, [uid]);

  if (isLoading) {
    return (
      <div className='d-flex justify-content-center align-items-center' style={{ height: '100vh' }}>
        <Spinner animation='border' variant='primary' />
        <span className='ms-3'>Loading User Details...</span>
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
          <Button className='btn btn-primary' onClick={() => router.push('/jobs')}>
            Back to Job User List
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3>User not found</h3>
          <Link href='/jobs'>
            <Button variant='primary' className='mt-3'>
              Back to User List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <GeeksSEO title={`View Details for ${user.fullName} Calibration | VITAR Group`} />

      <ContentHeader
        title={`View Details for ${user.fullName}`}
        description='View comprehensive details of the technician including personal info, contacts, skills & experties, assignments and performance history'
        badgeText='Technician Management'
        badgeText2='View Technician'
        breadcrumbItems={[
          {
            icon: <HouseDoorFill className='me-2' size={14} />,
            text: 'Dashboard',
            link: '/dashboard',
          },
          {
            text: 'Technicians',
            link: '/workers',
            icon: <PeopleFill className='me-2' size={14} />,
          },
          {
            icon: <EyeFill className='me-2' size={14} />,
            text: uid,
          },
        ]}
        actionButtons={[
          {
            text: `Back`,
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () => router.push(`/workers`),
          },
        ]}
        dropdownItems={[
          {
            label: 'Edit Technician',
            icon: PencilSquare,
            onClick: () => router.push(`/workers/edit-workers/${uid}`),
          },
        ]}
      />

      <Card className='border-0 shadow-sm mb-4'>
        <Card.Body className='p-4'>
          <div className='d-flex align-items-center gap-4'>
            <div className='position-relative'>
              <Image
                src={user.profilePicture || '/images/avatar/default-avatar.png'}
                alt={user.fullName}
                width={120}
                height={120}
                className='rounded-circle'
                style={{
                  objectFit: 'cover',
                  border: '4px solid #fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              />
              <span
                className={`position-absolute ${user.isOnline ? 'bg-success' : 'bg-secondary'}`}
                style={{
                  bottom: 5,
                  right: 5,
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: '3px solid #fff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              />
            </div>

            <div className='flex-grow-1'>
              <div className='d-flex justify-content-between align-items-start'>
                <div>
                  <h3 className='mb-1' style={{ fontSize: '1.75rem', fontWeight: '600' }}>
                    {user.fullName}{' '}
                    <span className='text-muted' style={{ fontSize: '0.90rem' }}>
                      #{user.workerId}
                    </span>
                  </h3>
                  <div className='d-flex align-items-center gap-2 mb-2'>
                    <div className='d-flex gap-2'>
                      {user.role === 'admin' && (
                        <Badge
                          bg='purple'
                          className='px-3 py-2'
                          style={{ fontSize: '0.75rem', fontWeight: '500' }}
                        >
                          Admin
                        </Badge>
                      )}

                      {user.role !== 'admin' && (
                        <Badge
                          bg='primary'
                          className='px-3 py-2 text-capitalize'
                          style={{ fontSize: '0.75rem', fontWeight: '500' }}
                        >
                          {user.role}
                        </Badge>
                      )}

                      {user.isFieldWorker && (
                        <Badge
                          bg='warning'
                          text='dark'
                          className='px-3 py-2'
                          style={{ fontSize: '0.75rem', fontWeight: '500' }}
                        >
                          Field Worker
                        </Badge>
                      )}
                      <Badge
                        bg={user.isActive ? 'success' : 'danger'}
                        className='px-3 py-2'
                        style={{ fontSize: '0.75rem', fontWeight: '500' }}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <div className='d-flex gap-4 mt-3'>
                    <div className='d-flex align-items-center text-muted'>
                      <Envelope size={18} className='me-2' />
                      {user.email}
                    </div>
                    <div className='d-flex align-items-center text-muted'>
                      <Telephone size={18} className='me-2' />
                      {user.primaryPhone}
                    </div>
                  </div>
                </div>
                <Button
                  variant='outline-primary'
                  className='d-flex align-items-center gap-2'
                  onClick={() => router.push(`/workers/edit-workers/${user.id}`)}
                  style={{
                    padding: '0.625rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Pencil size={16} />
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <Tabs activeKey={activeTab} onSelect={setActiveTab}>
            <Tab eventKey='0' title='Overview'>
              <Overview user={user} />
            </Tab>

            <Tab eventKey='1' title='Job Assignments'></Tab>

            <Tab eventKey='2' title='Documents & Signature'>
              <Document user={user} />
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </>
  );
};

export default UserDetails;
