import DataTable from '@/components/common/DataTable';
import DataTableColumnHeader from '@/components/common/DataTableColumnHeader';
import DataTableViewOptions from '@/components/common/DataTableViewOptions';
import { db } from '@/firebase';
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { orderBy } from 'lodash';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Row, Spinner } from 'react-bootstrap';
import {
  Building,
  Clock,
  Envelope,
  ExclamationCircleFill,
  Eye,
  Geo,
  Map,
  Person,
  PersonFill,
  PersonVcard,
  Phone,
  Signpost,
} from 'react-bootstrap-icons';

const SummaryTab = ({ job, customer, contact, location }) => {
  const renderError = () => {
    return (
      <div
        className='d-flex flex-column justify-content-center align-items-center fs-6 py-2'
        style={{ height: '200px' }}
      >
        <ExclamationCircleFill className='text-danger mb-2' size={32} />
        <h5 className='text-danger'>Something went wrong. Please try again Later</h5>
      </div>
    );
  };

  const defaultLocation = useMemo(() => {
    if (location.data) {
      const locationData = location.data;

      if (locationData?.addresses && locationData?.addresses?.length > 0) {
        const defaultAddress = locationData?.addresses?.find((address) => address?.isDefault);
        return defaultAddress;
      }
    }

    return undefined;
  }, [location.data]);

  // console.log({ job, customer, location });

  return (
    <Card className='border-0 shadow-none'>
      <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
        <div className='d-flex justify-content-between align-items-center'>
          <div>
            <h5 className='mb-0'>Customer Details</h5>
            <small className='text-muted'>Basic customer details</small>
          </div>
        </div>
      </Card.Header>

      {customer.isLoading ? (
        <div
          className='d-flex justify-content-center align-items-center fs-6 py-2'
          style={{ height: '200px' }}
        >
          <Spinner size='sm' className='me-2' animation='border' variant='primary' /> Loading
          Customer Details...
        </div>
      ) : (
        <>
          <Card.Body className='pt-4'>
            <Row className='row-gap-3'>
              <Col className='d-flex flex-column gap-3'>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <Person size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Customer:</div>
                    <div className='text-primary-label fw-semibold'>
                      {customer?.data?.customerName}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card.Body>

          <Card.Header className='bg-transparent border-0 pb-0'>
            <div className='d-flex justify-content-between align-items-center'>
              <div>
                <h5 className='mb-0'>Contact Details</h5>
                <small className='text-muted'>Basic contact details</small>
              </div>
            </div>
          </Card.Header>

          <Card.Body>
            <Row>
              <Col md={3}>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <PersonVcard size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>First Name:</div>
                    <div className='text-primary-label fw-semibold'>
                      {contact?.firstName || 'N/A'}
                    </div>
                  </div>
                </div>
              </Col>
              <Col md={3}>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <PersonVcard size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Last Name:</div>
                    <div className='text-primary-label fw-semibold'>
                      {contact?.lastName || 'N/A'}
                    </div>
                  </div>
                </div>
              </Col>
              <Col md={3}>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <Envelope size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Email:</div>
                    <div className='text-primary-label fw-semibold'>{contact?.email || 'N/A'}</div>
                  </div>
                </div>
              </Col>
              <Col md={3}>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <Phone size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Phone:</div>
                    <div className='text-primary-label fw-semibold'>{contact?.phone || 'N/A'}</div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </>
      )}

      {customer.isError && renderError()}

      {location.isLoading ? (
        <div
          className='d-flex justify-content-center align-items-center fs-6 py-2'
          style={{ height: '200px' }}
        >
          <Spinner size='sm' className='me-2' animation='border' variant='primary' /> Loading
          Location Details...
        </div>
      ) : (
        <>
          <Card.Header className='bg-transparent border-0 pb-0'>
            <div className='d-flex justify-content-between align-items-center'>
              <div>
                <h5 className='mb-0'>Location Details</h5>
                <small className='text-muted'>Basic location details.</small>
              </div>
            </div>
          </Card.Header>

          <Card.Body>
            <Row className='row-gap-3'>
              <Col md={4}>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <Building size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Location:</div>
                    <div className='text-primary-label fw-semibold'>
                      {location.data.siteName || 'N/A'}
                    </div>
                  </div>
                </div>
              </Col>

              <Col md={4}>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <Geo size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Longitude:</div>
                    <div className='text-primary-label fw-semibold'>
                      {defaultLocation?.longitude || 'N/A'}
                    </div>
                  </div>
                </div>
              </Col>

              <Col md={4}>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <Geo size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Latitude:</div>
                    <div className='text-primary-label fw-semibold'>
                      {defaultLocation?.latitude || 'N/A'}
                    </div>
                  </div>
                </div>
              </Col>

              <Col md={4}>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <Signpost size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Street Address #1:</div>
                    <div className='text-primary-label fw-semibold'>
                      {defaultLocation?.street1 || 'N/A'}
                    </div>
                  </div>
                </div>
              </Col>

              <Col md={4}>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <Signpost size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Street Address #2:</div>
                    <div className='text-primary-label fw-semibold'>
                      {defaultLocation?.street2 || 'N/A'}
                    </div>
                  </div>
                </div>
              </Col>

              <Col md={4}>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <Signpost size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Street Address #3:</div>
                    <div className='text-primary-label fw-semibold'>
                      {defaultLocation?.street3 || 'N/A'}
                    </div>
                  </div>
                </div>
              </Col>

              <Col md={4}>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <Map size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>City:</div>
                    <div className='text-primary-label fw-semibold'>
                      {defaultLocation?.city || 'N/A'}
                    </div>
                  </div>
                </div>
              </Col>

              <Col md={4}>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <Map size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Posttal Code:</div>
                    <div className='text-primary-label fw-semibold'>
                      {defaultLocation?.postalCode || 'N/A'}
                    </div>
                  </div>
                </div>
              </Col>

              <Col md={4}>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <Map size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Province:</div>
                    <div className='text-primary-label fw-semibold'>
                      {defaultLocation?.province || 'N/A'}
                    </div>
                  </div>
                </div>
              </Col>

              <Col md={4}>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <Map size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Country:</div>
                    <div className='text-primary-label fw-semibold'>
                      {defaultLocation?.country || 'N/A'}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </>
      )}

      <Card.Header className='bg-transparent border-0 pb-0'>
        <div className='d-flex justify-content-between align-items-center'>
          <div>
            <h5 className='mb-0'>Record Details</h5>
            <small className='text-muted'>
              Details about who created or updated the record and when it was modified.
            </small>
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        <Row className='row-gap-3'>
          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <Clock size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Date:</div>
                <div className='text-primary-label fw-semibold'>
                  {job?.createdAt ? format(job.createdAt.toDate(), 'dd/MM/yyyy') : 'N/A'}
                </div>
              </div>
            </div>
          </Col>
          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <PersonFill size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Created By:</div>
                <div className='text-primary-label fw-semibold'>
                  {job?.createdBy?.displayName || 'N/A'}
                </div>
              </div>
            </div>
          </Col>
          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <Clock size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Last Updated:</div>
                <div className='text-primary-label fw-semibold'>
                  {job?.updatedAt ? format(job.createdAt.toDate(), 'dd/MM/yyyy') : 'N/A'}
                </div>
              </div>
            </div>
          </Col>
          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <PersonFill size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Updated By:</div>
                <div className='text-primary-label fw-semibold'>
                  {job?.updatedBy?.displayName || 'N/A'}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>

      {location.isError && renderError()}
    </Card>
  );
};

export default SummaryTab;
