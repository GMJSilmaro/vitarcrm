import React, { useEffect, useState } from 'react';
import UserLayoutHeader from './UserLayoutHeader';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import {
  Calendar,
  ExclamationCircle,
  ExclamationTriangleFill,
  FileText,
  Gear,
  House,
  Link,
  People,
  Plus,
  WrenchAdjustable,
} from 'react-bootstrap-icons';
import { Button, Card, Col, Container, Row } from 'react-bootstrap';
import Cookies from 'js-cookie';
import { db } from '@/firebase';

const TechnicianLayout = ({ children }) => {
  const { workerId } = useAuth();

  const router = useRouter();
  const pathname = router.asPath?.replace('/dashboard/user', '') || '';

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!router.isReady || !workerId) return;

    const uid = Cookies.get('uid');

    getDocs(
      query(
        collection(db, 'users'),
        where('workerId', '==', workerId),
        where('uid', '==', uid),
        limit(1)
      )
    )
      .then((snapshot) => {
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];

          const data = doc.data();

          if (data.uid !== uid) {
            router.push('/unauthorized');
            return;
          }

          setUser({ id: doc.id, ...data });
          setIsLoading(false);
          return;
        }

        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching user details:', err.message);
        setError(err.message);
        setIsLoading(false);
      });
  }, [router, workerId]);

  if (error) {
    return (
      <Container
        className='d-flex align-items-center justify-content-center'
        style={{ minHeight: '100vh' }}
      >
        <Row className='justify-content-center w-100'>
          <Col md={6}>
            <Card className='shadow-sm'>
              <Card.Body className='text-center p-5'>
                <div className='mb-4'>
                  <ExclamationTriangleFill size={80} className='text-danger' />
                </div>

                <h2 className='mb-4'>Unexpected Error Occured</h2>

                <p className='text-muted mb-4'>
                  Please try again later or contact the administrator.
                </p>

                <Button variant='primary' onClick={() => router.push('sign-in')} className='px-4'>
                  Go Back
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  if (!user && !isLoading) {
    return (
      <Container
        className='d-flex align-items-center justify-content-center'
        style={{ minHeight: '100vh' }}
      >
        <Row className='justify-content-center w-100'>
          <Col md={6}>
            <Card className='shadow-sm'>
              <Card.Body className='text-center p-5'>
                <div className='mb-4'>
                  <ExclamationTriangleFill size={80} className='text-danger' />
                </div>

                <h2 className='mb-4'>User Not Found</h2>

                <p className='text-muted mb-4'>
                  Please try again later or contact the administrator.
                </p>

                <Button variant='primary' onClick={() => router.push('sign-in')} className='px-4'>
                  Go Back
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <div className='flex-grow-1 h-100 d-flex flex-column'>
      <UserLayoutHeader user={user} />

      <main className='p-5 d-flex flex-column flex-grow-1 h-100'>
        <div className='d-flex mb-4 gap-3 flex-wrap align-content-center'>
          <Button
            className='shadow-sm'
            onClick={() => router.push(`/user/${workerId}`)}
            variant={pathname === `/${workerId}` ? 'primary' : 'light'}
          >
            <House size={16} className='me-2' />
            Dashboard
          </Button>

          <Button
            className='shadow-sm'
            onClick={() => router.push(`/user/${workerId}/schedule`)}
            variant={pathname === `/${workerId}/schedule` ? 'primary' : 'light'}
          >
            <Calendar size={16} className='me-2' />
            Schedule
          </Button>

          <Button className='shadow-sm' variant='light'>
            <FileText size={16} className='me-2' />
            Reports
          </Button>

          <Button className='shadow-sm' variant='light'>
            <Gear size={16} className='me-2' />
            Settings
          </Button>
        </div>

        <div className='flex-grow-1 d-flex flex-column'>{children}</div>
      </main>
    </div>
  );
};

export default TechnicianLayout;
