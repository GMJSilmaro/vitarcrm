import { useRouter } from 'next/router';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';

export default function Unauthorized() {
  const router = useRouter();
  const { workerId, role } = useAuth();

  useEffect(() => {
    console.log('Unauthorized access:', {
      from: router.query.from,
      workerId,
      role,
      path: router.asPath,
    });
  }, [router, workerId, role]);

  const handleGoBack = () => {
    if (workerId) {
      router.push(`/user/${workerId}`);
    } else {
      router.push('/');
    }
  };

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
                <i
                  className='fas fa-exclamation-triangle text-warning'
                  style={{ fontSize: '3rem' }}
                ></i>
              </div>
              <h2 className='mb-4'>Access Denied</h2>
              <p className='text-muted mb-4'>
                Sorry, you don't have permission to access this page. Please contact your
                administrator if you believe this is an error.
              </p>
              <Button variant='primary' onClick={handleGoBack} className='px-4'>
                Go Back
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
