import { db } from '@/firebase';
import UserForm from '@/sub-components/dashboard/worker/UserForm';
import { GeeksSEO } from '@/widgets';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Card, Spinner } from 'react-bootstrap';

const EditProfile = () => {
  const router = useRouter();
  const { uid } = router.query;

  const [user, setUser] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  //* query user
  useEffect(() => {
    if (!uid) return;

    getDoc(doc(db, 'users', uid))
      .then((doc) => {
        if (doc.exists()) {
          setUser({
            id: doc.id,
            ...doc.data(),
          });
          setIsLoading(false);
        } else {
          setError('User not found');
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error(err.message);
        setError(err.message);
        setIsLoading(false);
      });
  }, [uid]);

  if (isLoading) {
    return (
      <div className='d-flex justify-content-center align-items-center' style={{ height: '100vh' }}>
        <Spinner animation='border' variant='primary' />
        <span className='ms-3'>Loading Worker...</span>
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
          <Button onClick={() => router.push('/workers')}>Back to Workers List</Button>
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
          <h3>Worker not found</h3>
          <Link href='/workers'>
            <Button variant='primary' className='mt-3'>
              Back to Worker List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <GeeksSEO title='Edit User - VITAR Group | Portal' />

      <Card className='shadow-sm'>
        <Card.Body>
          <UserForm data={user} isProfile />
        </Card.Body>
      </Card>
    </>
  );
};

export default EditProfile;
