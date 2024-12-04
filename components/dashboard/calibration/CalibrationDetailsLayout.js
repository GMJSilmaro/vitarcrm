import React from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import { Tools, Calendar3, PersonFill } from 'react-bootstrap-icons';

const CalibrationDetailsLayout = ({ children, equipment, certificates }) => {
  return (
    <div className="calibration-details">
      {/* Equipment Summary Card */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <Row>
            <Col md={6}>
              <h5 className="mb-4">Equipment Information</h5>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="label">Equipment ID:</span>
                  <span className="value">{equipment.inventoryId}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Tag ID:</span>
                  <span className="value">{equipment.tagId}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Category:</span>
                  <span className="value">{equipment.category}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Description:</span>
                  <span className="value">{equipment.description}</span>
                </div>
              </div>
            </Col>
            <Col md={6}>
              <h5 className="mb-4">Technical Details</h5>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="label">Make:</span>
                  <span className="value">{equipment.make}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Model:</span>
                  <span className="value">{equipment.model}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Serial Number:</span>
                  <span className="value">{equipment.serialNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Type:</span>
                  <span className="value">{equipment.type}</span>
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Range Information */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <h5 className="mb-4">Range Information</h5>
          <Row>
            <Col md={6}>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="label">Range (Min):</span>
                  <span className="value">{equipment.rangeMin}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Range (Max):</span>
                  <span className="value">{equipment.rangeMax}</span>
                </div>
              </div>
            </Col>
            <Col md={6}>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="label">Range (Min%):</span>
                  <span className="value">{equipment.rangeMinPercent}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Range (Max%):</span>
                  <span className="value">{equipment.rangeMaxPercent}</span>
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Certification Information */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <h5 className="mb-4">Certification Information</h5>
          <div className="details-grid">
            <div className="detail-item">
              <span className="label">Current Certificate:</span>
              <span className="value">
                <Badge bg="primary">{equipment.certificateNo}</Badge>
              </span>
            </div>
            <div className="detail-item">
              <span className="label">Traceability:</span>
              <span className="value">{equipment.traceability}</span>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Additional Content */}
      {children}

      <style jsx>{`
        .details-grid {
          display: grid;
          gap: 1rem;
        }
        .detail-item {
          display: grid;
          grid-template-columns: 140px 1fr;
          gap: 1rem;
          align-items: center;
        }
        .label {
          color: #6c757d;
          font-weight: 500;
        }
        .value {
          font-weight: 400;
        }
      `}</style>
    </div>
  );
};

export default CalibrationDetailsLayout; 