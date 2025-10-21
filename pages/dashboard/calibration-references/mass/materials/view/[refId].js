import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import { GeeksSEO } from '@/widgets';
import { format } from 'date-fns';
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

const MaterialDetails = () => {
  const router = useRouter();
  const { refId } = router.query;

  const [material, setMaterial] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  //* query material
  useEffect(() => {
    if (refId) {
      const materialDocRef = doc(db, 'jobCalibrationReferences', 'CR000005', 'data', refId);

      getDoc(materialDocRef)
        .then((doc) => {
          if (doc.exists()) {
            setMaterial({ id: doc.id, ...doc.data() });
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
          <Button onClick={() => router.push('/calibration-references/mass/materials')}>
            Back to Material List
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

  if (!material) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3>Reference Data not found</h3>
          <Link href='/calibration-references/mass/materials'>
            <Button variant='primary' className='mt-3'>
              Back to Material List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <GeeksSEO title={`View Details for CK #${material.id} - VITAR Group | Portal`} />

      <ContentHeader
        title={`View Details for CK #${material.id}`}
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
            link: '/calibration-references/mass/materials',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Mass',
            link: '/calibration-references/mass/materials',
            icon: <BoxSeamFill className='me-2' size={14} />,
          },
          {
            text: 'CK',
            link: '/calibration-references/mass/materials',
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
            onClick: () => router.push('/calibration-references/mass/materials'),
          },
        ]}
        dropdownItems={[
          {
            label: 'Edit Material',
            icon: PencilSquare,
            onClick: () =>
              router.push(`/calibration-references/mass/materials/edit-materials/${refId}`),
          },
        ]}
      />

      <Card>
        <Card.Body>
          <Card.Header className='bg-transparent border-0 pb-0'>
            <div className='d-flex justify-content-between align-items-center'>
              <div>
                <h4 className='mb-0'>Material</h4>
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
                  <td colSpan={5}>{material?.refId || ''}</td>
                </tr>
                <tr>
                  <th>Code</th>
                  <td colSpan={5}>{material?.code || ''}</td>
                </tr>
                <tr>
                  <th>Material</th>
                  <td colSpan={5}>{material?.material || ''}</td>
                </tr>
                <tr>
                  <th>
                    Density of Test Weight P<sub>t</sub> (kg m<sup>-3</sup>)
                  </th>
                  <td colSpan={5}>{material?.ptKgMn3 || ''}</td>
                </tr>
                <tr>
                  <th>
                    u(P<sub>t</sub>) (kg m<sup>-3</sup>)
                  </th>
                  <td colSpan={5}>{material?.uPtKgMn3 || ''}</td>
                </tr>

                <tr>
                  <th>Date</th>
                  <td colSpan={5}>
                    {material?.createdAt
                      ? format(material?.createdAt.toDate(), 'dd-MM-yyyy')
                      : 'N/A'}
                  </td>
                </tr>

                <tr>
                  <th>Created By</th>
                  <td colSpan={5}>{material?.createdBy?.displayName || 'N/A'}</td>
                </tr>

                <tr>
                  <th>Last Updated</th>
                  <td colSpan={5}>
                    {material?.updatedAt
                      ? format(material?.updatedAt.toDate(), 'dd-MM-yyyy')
                      : 'N/A'}
                  </td>
                </tr>

                <tr>
                  <th>Updated By</th>
                  <td colSpan={5}>{material?.updatedBy?.displayName || 'N/A'}</td>
                </tr>
              </tbody>
            </Table>
          </Card.Body>
        </Card.Body>
      </Card>
    </>
  );
};

export default MaterialDetails;
