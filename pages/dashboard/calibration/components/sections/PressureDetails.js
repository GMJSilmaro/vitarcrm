import React from 'react';
import { Row, Col, Table } from 'react-bootstrap';

const PressureDetails = ({ equipment }) => {
  return (
    <div>
      <Row>
        <Col md={6}>
          <h6 className="text-muted mb-3">Basic Information</h6>
          <Table borderless size="sm">
            <tbody>
              <tr>
                <td className="text-muted" style={{width: '150px'}}>Make:</td>
                <td>{equipment?.make || '-'}</td>
              </tr>
              <tr>
                <td className="text-muted">Model:</td>
                <td>{equipment?.model || '-'}</td>
              </tr>
              <tr>
                <td className="text-muted">Serial Number:</td>
                <td>{equipment?.serialNumber || 'N/A'}</td>
              </tr>
            </tbody>
          </Table>
        </Col>
        <Col md={6}>
          <h6 className="text-muted mb-3">Calibration Details</h6>
          <Table borderless size="sm">
            <tbody>
              <tr>
                <td className="text-muted" style={{width: '150px'}}>Range:</td>
                <td>{equipment?.rangeMin} to {equipment?.rangeMax} bar</td>
              </tr>
              <tr>
                <td className="text-muted">Type:</td>
                <td>{equipment?.type}</td>
              </tr>
              <tr>
                <td className="text-muted">Traceability:</td>
                <td>{equipment?.traceability}</td>
              </tr>
            </tbody>
          </Table>
        </Col>
      </Row>
    </div>
  );
};

export default PressureDetails; 