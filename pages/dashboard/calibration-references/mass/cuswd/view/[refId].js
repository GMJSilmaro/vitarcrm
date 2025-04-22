import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import { GeeksSEO } from '@/widgets';
import { format } from 'date-fns';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { Button, Card, Spinner, Table } from 'react-bootstrap';
import {
  ArrowLeftShort,
  BoxSeam,
  HouseDoorFill,
  InfoSquareFill,
  ListColumns,
  Table as TableIcon,
} from 'react-bootstrap-icons';

const CuswdDetails = () => {
  const router = useRouter();
  const { refId } = router.query;

  const [cuswd, setCuswd] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  //* query cuswd
  useEffect(() => {
    if (refId) {
      const cuswdDocRef = doc(db, 'jobCalibrationReferences', 'CR000001', 'data', refId);

      getDoc(cuswdDocRef)
        .then((doc) => {
          if (doc.exists()) {
            setCuswd({ id: doc.id, ...doc.data() });
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
          <Button onClick={() => router.push('/calibration-references/mass/cuswd')}>
            Back to CUSWD List
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

  if (!cuswd) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3>Reference Data not found</h3>
          <Link href='/calibration-references/mass/cuswd'>
            <Button variant='primary' className='mt-3'>
              Back to CUSWD List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <GeeksSEO
        title={`View Details for Correction, Uncertainty of the Standard Weight & Drift #${cuswd.id} - VITAR Group | Portal`}
      />

      <ContentHeader
        title={`View Details for Correction, Uncertainty of the Standard Weight & Drift #${cuswd.id}`}
        description='View comprehensive details of reference data'
        badgeText='Reference Data Management'
        badgeText2='References Data'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <HouseDoorFill className='me-2' style={{ fontSize: '14px' }} />,
          },
          {
            text: 'Calibration References',
            link: '/calibration-references/mass/cuswd',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Mass',
            link: '/calibration-references/mass/cuswd',
            icon: <BoxSeam className='me-2' size={14} />,
          },
          {
            text: 'CUSWD',
            link: '/calibration-references/mass/cuswd',
            icon: <TableIcon className='me-2' size={14} />,
          },
          ,
          {
            text: refId,
            icon: <InfoSquareFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back to CUSWD List`,
            icon: <ArrowLeftShort size={16} />,
            variant: 'light',
            onClick: () => router.push('/calibration-references/mass/cuswd'),
          },
        ]}
      />

      <Card>
        <Card.Body>
          <Card.Header className='bg-transparent border-0 pb-0'>
            <div className='d-flex justify-content-between align-items-center'>
              <div>
                <h4 className='mb-0'>Correction, Uncertainty of the Standard Weight & Drift</h4>
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
                  <td colSpan={5}>{cuswd?.refId || ''}</td>
                </tr>
                <tr>
                  <th>Tag ID</th>
                  <td colSpan={5}>{cuswd?.tagId || ''}</td>
                </tr>
                <tr>
                  <th>Class</th>
                  <td colSpan={5}>{cuswd?.class || ''}</td>
                </tr>
                <tr>
                  <th>Nominal Value</th>
                  <td colSpan={5}>{cuswd?.nominalValue || ''}</td>
                </tr>
                <tr>
                  <th>Current Year Error (mg)</th>
                  <td colSpan={5}>{cuswd?.currentYearError || ''}</td>
                </tr>
                <tr>
                  <th>Current Year Actual Value (g)</th>
                  <td colSpan={5}>{cuswd?.currentYearActualValue || ''}</td>
                </tr>
                <tr>
                  <th>Last Year Year Error (mg)</th>
                  <td colSpan={5}>{cuswd?.lastYearError || ''}</td>
                </tr>
                <tr>
                  <th>Last Year Actual Value (g)</th>
                  <td colSpan={5}>{cuswd?.lastYearActualValue || ''}</td>
                </tr>
                <tr>
                  <th>E. Uncertainty (mg)</th>
                  <td colSpan={5}>{cuswd?.eUncertainty || ''}</td>
                </tr>

                <tr>
                  <th>
                    <div className='d-flex justify-content-center align-items-center gap-1'>
                      <div>
                        U<sub>cert</sub>
                      </div>
                      <div>(g)</div>
                    </div>
                  </th>
                  <td colSpan={5}>{cuswd?.uCertg || ''}</td>
                </tr>
                <tr>
                  <th>
                    <div className='d-flex justify-content-center align-items-center gap-1'>
                      <div>
                        U
                        <sub>
                          cert<sup>2</sup>
                        </sub>
                      </div>
                      <div>
                        (g<sup>2</sup>)
                      </div>
                    </div>
                  </th>
                  <td colSpan={5}>{cuswd?.uCert2g2 || ''}</td>
                </tr>
                <tr>
                  <th>
                    <div className='d-flex justify-content-center align-items-center gap-1'>
                      <div>
                        U
                        <sub>
                          cert<sup>4</sup>
                        </sub>{' '}
                        / <small>V</small>
                      </div>
                      <div>
                        (g<sup>4</sup>)
                      </div>
                    </div>
                  </th>
                  <td colSpan={5}>{cuswd?.uCert4vG4 || ''}</td>
                </tr>
                <tr>
                  <th>
                    <div className='d-flex justify-content-center align-items-center gap-1'>
                      <div>
                        U<sub>inst</sub>
                      </div>
                      <div>(g)</div>
                    </div>
                  </th>
                  <td colSpan={5}>{cuswd?.uInstg || ''}</td>
                </tr>
                <tr>
                  <th>
                    <div className='d-flex justify-content-center align-items-center gap-1'>
                      <div>
                        U
                        <sub>
                          inst<sup>2</sup>
                        </sub>
                      </div>
                      <div>
                        (g<sup>2</sup>)
                      </div>
                    </div>
                  </th>
                  <td colSpan={5}>{cuswd?.uInst2g2 || ''}</td>
                </tr>
                <tr>
                  <th>
                    <div className='d-flex justify-content-center align-items-center gap-1'>
                      <div>
                        U
                        <sub>
                          inst<sup>4</sup>
                        </sub>{' '}
                        / <small>V</small>
                      </div>
                      <div>
                        (g<sup>4</sup>)
                      </div>
                    </div>
                  </th>
                  <td colSpan={5}>{cuswd?.uInst4vG4 || ''}</td>
                </tr>
                <tr>
                  <th>
                    <div className='d-flex justify-content-center align-items-center gap-1'>
                      <div>
                        P<sub>r</sub>
                      </div>
                      <div>
                        (kg m<sup>-3</sup>)
                      </div>
                    </div>
                  </th>
                  <td colSpan={5}>{cuswd?.prKgMn3 || ''}</td>
                </tr>
                <tr>
                  <th>
                    <div className='d-flex justify-content-center align-items-center gap-1'>
                      <div>
                        <sup>U</sup>(P<sub>r</sub>)
                      </div>
                      <div>
                        (kg m<sup>-3</sup>)
                      </div>
                    </div>
                  </th>
                  <td colSpan={5}>{cuswd?.uPrKgMn3 || ''}</td>
                </tr>
                <tr>
                  <th>
                    <div className='d-flex justify-content-center align-items-center gap-1'>
                      Drift (g)
                    </div>
                  </th>
                  <td colSpan={5}>{cuswd?.driftg || ''}</td>
                </tr>

                <tr>
                  <th>Date</th>
                  <td colSpan={5}>
                    {cuswd?.createdAt ? format(cuswd?.createdAt.toDate(), 'dd-MM-yyyy') : 'N/A'}
                  </td>
                </tr>

                <tr>
                  <th>Created At</th>
                  <td colSpan={5}>{cuswd?.createdBy?.displayName || 'N/A'}</td>
                </tr>

                <tr>
                  <th>Last Updated</th>
                  <td colSpan={5}>
                    {cuswd?.updatedAt ? format(cuswd?.updatedAt.toDate(), 'dd-MM-yyyy') : 'N/A'}
                  </td>
                </tr>

                <tr>
                  <th>Updated By</th>
                  <td colSpan={5}>{cuswd?.updatedBy?.displayName || 'N/A'}</td>
                </tr>
              </tbody>
            </Table>
          </Card.Body>
        </Card.Body>
      </Card>
    </>
  );
};

export default CuswdDetails;
