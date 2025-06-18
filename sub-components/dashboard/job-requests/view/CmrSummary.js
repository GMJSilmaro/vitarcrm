import { format } from 'date-fns';
import { useMemo } from 'react';
import { Button, Card, Table } from 'react-bootstrap';
import { Download, Printer } from 'react-bootstrap-icons';

const CmrSummary = ({ jobRequest, customer, contact, location, customerEquipments }) => {
  const address = useMemo(() => {
    if (location.isLoading) return '';

    const locationData = location.data;

    if (!locationData) return '';

    const defaultAddress = locationData?.addresses?.find((a) => a.isDefault);
    if (!defaultAddress) return '';

    const fields = [
      defaultAddress?.street1,
      defaultAddress?.street2,
      defaultAddress?.street3,
      defaultAddress?.city,
      defaultAddress?.province,
      defaultAddress?.postalCode,
      defaultAddress?.country,
    ];

    return fields.filter(Boolean).join(' ');
  }, [location.data, location.isLoading]);

  const telFax = useMemo(() => {
    return contact?.phone || '';
  }, [contact]);

  const pic = useMemo(() => {
    if (!contact) return '';

    const fname = contact?.firstName || '';
    const lname = contact?.lastName || '';
    return `${fname ?? ''}${lname ?? ''}`;
  }, [contact]);

  if (customer.isLoading || location.isLoading || customerEquipments.isLoading) {
    return (
      <Card className='border-0 shadow-none'>
        <Card.Body
          className='d-flex justify-content-center align-items-center'
          style={{ height: '70vh' }}
        >
          <Spinner animation='border' variant='primary' />
          <span className='ms-3'>Loading CMR...</span>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className='border-0 shadow-none'>
      <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
        <div>
          <h4 className='mb-0'>Calibration & Measurement Requisition</h4>
          <p className='text-muted fs-6 mb-0'>
            Initial data of CMR based on the job request details.
          </p>
        </div>
      </Card.Header>

      <Card.Body>
        <Table className='w-75 mx-auto text-center fs-6 align-middle mt-3 mb-5' bordered responsive>
          <tbody>
            <tr>
              <th>JR No.</th>
              <td colSpan={6} className='fs-4 fw-bold'>
                {jobRequest.id}
              </td>
            </tr>
            <tr>
              <th>Date</th>
              <td colSpan={6}>{format(jobRequest.createdAt.toDate(), 'dd MMMM yyyy')}</td>
            </tr>

            <tr>
              <td></td>
              <td colSpan={6} className='fs-4 fw-bold'>
                Company
              </td>
            </tr>

            <tr>
              <th>Customer</th>
              <td colSpan={6}>{customer?.data?.customerName || ''}</td>
            </tr>
            <tr>
              <th>Address</th>
              <td colSpan={6}>{address}</td>
            </tr>
            <tr>
              <th>Tel / Fax</th>
              <td colSpan={6}>{telFax || ''}</td>
            </tr>
            <tr>
              <th>P.I.C</th>
              <td colSpan={6}>{pic || ''}</td>
            </tr>

            <tr>
              <td></td>
              <td colSpan={6} className='fs-4 fw-bold'>
                Equipment Requested
              </td>
            </tr>

            <tr>
              <th>Equipment</th>
              <th>Category</th>
              <th>Make</th>
              <th>Model</th>
              <th>Serial No.</th>
              <th>
                Calibration Points /<br />
                Range
              </th>
              <th>Tolerance</th>
            </tr>

            {(customerEquipments.data.length < 1 &&
              !customerEquipments.isLoading &&
              !customerEquipments.isError) ||
              (customerEquipments.length < 1 && (
                <tr>
                  <td colSpan={6}>
                    <div
                      className='d-flex justify-content-center align-items-center fs-6'
                      style={{ height: '100px' }}
                    >
                      No data available
                    </div>
                  </td>
                </tr>
              ))}

            {customerEquipments.isError && (
              <tr>
                <td colSpan={6}>
                  <div
                    className='d-flex justify-content-center align-items-center text-center py-5'
                    style={{ height: '100px' }}
                  >
                    <div>
                      <h4 className='text-danger mb-0'>Error</h4>
                      <p className='text-muted fs-6'>
                        Something went wrong. Please try again later.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {customerEquipments.data.length > 0 &&
              customerEquipments.data
                .sort((a, b) => {
                  if (!a?.description || !b?.description) return 0;
                  return a?.description?.localeCompare(b?.description);
                })
                .map((equipment, i) => {
                  const rangeMin = equipment?.rangeMin ?? '';
                  const rangeMax = equipment?.rangeMax ?? '';
                  const unit = equipment?.uom || '';
                  const range = String(rangeMin) && String(rangeMax) ? `${rangeMin}${unit} - ${rangeMax}${unit}` : ''; // prettier-ignore

                  return (
                    <tr key={`${equipment.id}-${i}`}>
                      <td>{equipment?.description || ''}</td>
                      <td className='text-capitalize'>
                        {equipment?.category ? equipment?.category.toLowerCase() : ''}
                      </td>
                      <td>{equipment?.make || ''}</td>
                      <td>{equipment?.model || ''}</td>
                      <td>{equipment?.serialNumber || ''}</td>
                      <td>{range}</td>
                      <td>{equipment?.tolerance || ''}</td>
                    </tr>
                  );
                })}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
};

export default CmrSummary;
