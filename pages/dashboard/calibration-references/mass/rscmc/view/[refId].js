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

const RSCMCDetails = () => {
  const router = useRouter();
  const { refId } = router.query;

  const [rscmc, setRscmc] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  //* query rscmc
  useEffect(() => {
    if (refId) {
      const rscmcDocRef = doc(db, 'jobCalibrationReferences', 'CR000006', 'data', refId);

      getDoc(rscmcDocRef)
        .then((doc) => {
          if (doc.exists()) {
            setRscmc({ id: doc.id, ...doc.data() });
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
          <Button onClick={() => router.push('/calibration-references/mass/rscmc')}>
            Back to RSCMC List
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

  if (!rscmc) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3>Reference Data not found</h3>
          <Link href='/calibration-references/mass/rscmc'>
            <Button variant='primary' className='mt-3'>
              Back to RSCMC List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <GeeksSEO title={`View Details for RSCMC #${rscmc.id} - VITAR Group | Portal`} />

      <ContentHeader
        title={`View Details for RSCMC #${rscmc.id}`}
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
            link: '/calibration-references/mass/rscmc',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Mass',
            link: '/calibration-references/mass/rscmc',
            icon: <BoxSeamFill className='me-2' size={14} />,
          },
          {
            text: 'RSCMC',
            link: '/calibration-references/mass/rscmc',
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
            onClick: () => router.push('/calibration-references/mass/rscmc'),
          },
        ]}
        dropdownItems={[
          {
            label: 'Edit RSCMC',
            icon: PencilSquare,
            onClick: () => router.push(`/calibration-references/mass/rscmc/edit-rscmc/${refId}`),
          },
        ]}
      />

      <Card>
        <Card.Body>
          <Card.Header className='bg-transparent border-0 pb-0'>
            <div className='d-flex justify-content-between align-items-center'>
              <div>
                <h4 className='mb-0'>Reported Scope CMC (g)</h4>
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
                  <td colSpan={5}>{rscmc?.refId || ''}</td>
                </tr>
                <tr>
                  <th>Nominal Value</th>
                  <td colSpan={5}>{rscmc?.nominalValue || ''}</td>
                </tr>
                <tr>
                  <th>Value</th>
                  <td colSpan={5}>{rscmc?.value || ''}</td>
                </tr>

                <tr>
                  <th>Date</th>
                  <td colSpan={5}>
                    {rscmc?.createdAt ? format(rscmc?.createdAt.toDate(), 'dd-MM-yyyy') : 'N/A'}
                  </td>
                </tr>

                <tr>
                  <th>Created By</th>
                  <td colSpan={5}>{rscmc?.createdBy?.displayName || 'N/A'}</td>
                </tr>

                <tr>
                  <th>Last Updated</th>
                  <td colSpan={5}>
                    {rscmc?.updatedAt ? format(rscmc?.updatedAt.toDate(), 'dd-MM-yyyy') : 'N/A'}
                  </td>
                </tr>

                <tr>
                  <th>Updated By</th>
                  <td colSpan={5}>{rscmc?.updatedBy?.displayName || 'N/A'}</td>
                </tr>
              </tbody>
            </Table>
          </Card.Body>
        </Card.Body>
      </Card>
    </>
  );
};

export default RSCMCDetails;
