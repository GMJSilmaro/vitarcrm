import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import { GeeksSEO } from '@/widgets';
import { format, isValid } from 'date-fns';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Card, Spinner, Table } from 'react-bootstrap';
import {
  ArrowLeftShort,
  BoxSeamFill,
  Eye,
  EyeFill,
  HouseDoorFill,
  ListColumns,
  PencilSquare,
  Table as TableIcon,
} from 'react-bootstrap-icons';

const EnvironmentalDetails = () => {
  const router = useRouter();
  const { refId } = router.query;

  const [environmental, setEnvironmental] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  //* query environmental
  useEffect(() => {
    if (refId) {
      const environmentalDocRef = doc(db, 'jobCalibrationReferences', 'CR000007', 'data', refId);

      getDoc(environmentalDocRef)
        .then((doc) => {
          if (doc.exists()) {
            setEnvironmental({ id: doc.id, ...doc.data() });
            setIsLoading(false);
          } else {
            setError('Reference Data not found');
            setIsLoading(false);
          }
        })
        .catch((err) => {
          setError(err.message || 'Error fetching reference data');
          setIsLoading(false);
        });
    }
  }, [refId]);

  if (error) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3 className='text-danger'>Error</h3>
          <p className='text-muted'>{error}</p>
          <Button onClick={() => router.push('/calibration-references/mass/environmental')}>
            Back to Environmental List
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='d-flex justify-content-center align-items-center' style={{ height: '100vh' }}>
        <Spinner animation='border' variant='primary' />
        <span className='ms-3'>Loading Reference Data...</span>
      </div>
    );
  }

  if (!environmental) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3>Reference Data not found</h3>
          <Link href='/calibration-references/mass/environmental'>
            <Button variant='primary' className='mt-3'>
              Back to Environmental List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <GeeksSEO
        title={`View Details for Environmental #${environmental.id} - VITAR Group | Portal`}
      />

      <ContentHeader
        title={`View Details for Environmental #${environmental.id}`}
        description='View comprehensive details of reference data'
        badgeText='Calibration References Data Management'
        badgeText2='View Reference Data'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <HouseDoorFill className='me-2' style={{ fontSize: '14px' }} />,
          },
          {
            text: 'Calibration References',
            link: '/calibration-references/mass/environmental',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Mass',
            link: '/calibration-references/mass/environmental',
            icon: <BoxSeamFill className='me-2' size={14} />,
          },
          {
            text: 'Environmental',
            link: '/calibration-references/mass/environmental',
            icon: <TableIcon className='me-2' size={14} />,
          },
          ,
          {
            text: refId,
            icon: <EyeFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back`,
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () => router.push('/calibration-references/mass/environmental'),
          },
        ]}
        dropdownItems={[
          {
            label: 'Edit Environmental',
            icon: PencilSquare,
            onClick: () =>
              router.push(`/calibration-references/mass/environmental/edit-environmental/${refId}`),
          },
        ]}
      />

      <Card>
        <Card.Body>
          <Card.Header className='bg-transparent border-0 pb-0'>
            <div className='d-flex justify-content-between align-items-center'>
              <div>
                <h4 className='mb-0'>Environmental</h4>
                <p className='text-muted fs-6 mb-0'>Details about the reference data.</p>
              </div>
            </div>
          </Card.Header>

          <Card.Body>
            <Table
              className='w-75 mx-auto text-center fs-6 align-middle mt-3 mb-5'
              bordered
              responsive
            >
              <tbody>
                <tr>
                  <th>Reference ID</th>
                  <td colSpan={5}>{environmental?.refId || ''}</td>
                </tr>
                <tr>
                  <th>Code</th>
                  <td colSpan={5}>{environmental?.code || ''}</td>
                </tr>
                <tr>
                  <th>Description</th>
                  <td colSpan={5}>{environmental?.description || ''}</td>
                </tr>
                <tr>
                  <th>U</th>
                  <td colSpan={5}>{environmental?.u || ''}</td>
                </tr>
                <tr>
                  <th>Unit</th>
                  <td colSpan={5}>{environmental?.unit || ''}</td>
                </tr>
                <tr>
                  <th>Due Date</th>
                  <td colSpan={5}>
                    {environmental?.dueDate && isValid(new Date(environmental?.dueDate))
                      ? format(environmental?.dueDate, 'dd-MM-yyyy')
                      : 'N/A'}
                  </td>
                </tr>

                <tr>
                  <th>Date</th>
                  <td colSpan={5}>
                    {environmental?.createdAt
                      ? format(environmental?.createdAt.toDate(), 'dd-MM-yyyy')
                      : 'N/A'}
                  </td>
                </tr>

                <tr>
                  <th>Created By</th>
                  <td colSpan={5}>{environmental?.createdBy?.displayName || 'N/A'}</td>
                </tr>

                <tr>
                  <th>Last Updated</th>
                  <td colSpan={5}>
                    {environmental?.updatedAt
                      ? format(environmental?.updatedAt.toDate(), 'dd-MM-yyyy')
                      : 'N/A'}
                  </td>
                </tr>

                <tr>
                  <th>Updated By</th>
                  <td colSpan={5}>{environmental?.updatedBy?.displayName || 'N/A'}</td>
                </tr>
              </tbody>
            </Table>
          </Card.Body>
        </Card.Body>
      </Card>
    </>
  );
};

export default EnvironmentalDetails;
