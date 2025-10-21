import { format, isValid } from 'date-fns';
import { Card, Col, Row } from 'react-bootstrap';
import {
  BookmarkCheck,
  CalendarEvent,
  CardHeading,
  Clock,
  Hash,
  Percent,
  PersonFill,
  Rulers,
  Speedometer,
  Tag,
  WrenchAdjustableCircle,
} from 'react-bootstrap-icons';

const SummaryTab = ({ refEquipment }) => {
  return (
    <Card className='shadow-none'>
      <Card.Body className='pb-0'>
        <h5 className='mb-0'>Reference Equipment</h5>
        <small className='text-muted'>Reference Equipment Details</small>
      </Card.Body>

      <Card.Body className='pb-0'>
        <Row className='row-gap-3'>
          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <Hash size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Inventory ID:</div>
                <div className='text-primary-label fw-semibold'>
                  {refEquipment?.inventoryId || 'N/A'}
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
                <Tag size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Category:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {refEquipment?.category.toLowerCase() || 'N/A'}
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
                <Hash size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Tag ID:</div>
                <div className='text-primary-label fw-semibold'>{refEquipment?.tagId || 'N/A'}</div>
              </div>
            </div>
          </Col>

          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <WrenchAdjustableCircle size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Description ID:</div>
                <div className='text-primary-label fw-semibold'>
                  {refEquipment?.description || 'N/A'}
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
                <CardHeading size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Make:</div>
                <div className='text-primary-label fw-semibold'>{refEquipment?.make || 'N/A'}</div>
              </div>
            </div>
          </Col>

          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <CardHeading size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Model:</div>
                <div className='text-primary-label fw-semibold'>{refEquipment?.model || 'N/A'}</div>
              </div>
            </div>
          </Col>

          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <CardHeading size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Serial No.:</div>
                <div className='text-primary-label fw-semibold'>
                  {refEquipment?.serialNumber || 'N/A'}
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
                <Tag size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Type:</div>
                <div className='text-primary-label fw-semibold'>{refEquipment?.type || 'N/A'}</div>
              </div>
            </div>
          </Col>

          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <CardHeading size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Certificate No.:</div>
                <div className='text-primary-label fw-semibold'>
                  {refEquipment?.certificateNo || 'N/A'}
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
                <BookmarkCheck size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Traceability:</div>
                <div className='text-primary-label fw-semibold'>
                  {refEquipment?.traceability || 'N/A'}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>

      <Card.Body className='pt-3'>
        <hr />

        <Row className='pt-2 row-gap-3'>
          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <Speedometer size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Mininum Range:</div>
                <div className='text-primary-label fw-semibold'>
                  {refEquipment?.rangeMin || 'N/A'}
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
                <Percent size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Mininum Range %:</div>
                <div className='text-primary-label fw-semibold'>
                  {refEquipment?.rangeMinPercent || 'N/A'}
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
                <Speedometer size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Maximum Range:</div>
                <div className='text-primary-label fw-semibold'>
                  {refEquipment?.rangeMax || 'N/A'}
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
                <Percent size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Maximum Range %:</div>
                <div className='text-primary-label fw-semibold'>
                  {refEquipment?.rangeMaxPercent || 'N/A'}
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
                <Hash size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Uncertainty:</div>
                <div className='text-primary-label fw-semibold'>
                  {refEquipment?.uncertainty || 'N/A'}
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
                <Rulers size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Uncertainty Unit:</div>
                <div className='text-primary-label fw-semibold'>
                  {refEquipment?.uncertaintyUnit || 'N/A'}
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
                <Hash size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>K:</div>
                <div className='text-primary-label fw-semibold'>{refEquipment?.k || 'N/A'}</div>
              </div>
            </div>
          </Col>

          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <CalendarEvent size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Due Date:</div>
                <div className='text-primary-label fw-semibold'>
                  {refEquipment?.dueDate && isValid(new Date(refEquipment?.dueDate))
                    ? format(refEquipment.dueDate, 'dd/MM/yyyy')
                    : 'N/A'}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>

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
                  {refEquipment?.createdAt
                    ? format(refEquipment.createdAt.toDate(), 'dd/MM/yyyy')
                    : 'N/A'}
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
                  {refEquipment?.createdBy?.displayName || 'N/A'}
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
                  {refEquipment?.updatedAt
                    ? format(refEquipment.createdAt.toDate(), 'dd/MM/yyyy')
                    : 'N/A'}
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
                  {refEquipment?.updatedBy?.displayName || 'N/A'}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default SummaryTab;
