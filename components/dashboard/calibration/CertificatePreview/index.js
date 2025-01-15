import React, { useRef } from 'react';
import { Modal, Row, Col, Table, Image, Button } from 'react-bootstrap';
import { Download, Printer, Share } from 'react-bootstrap-icons';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const CertificatePreview = ({ show, onHide, equipment, certificate }) => {
  const certificateRef = useRef(null);

  const handleDownloadPDF = async () => {
    try {
      const element = certificateRef.current;
      const pdf = await generateCertificatePDF(element);
      pdf.save(`${equipment.tagId}_certificate.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const handleShare = async () => {
    try {
      const shareData = {
        title: `Calibration Certificate - ${equipment.tagId}`,
        text: `Certificate No: ${certificate.certificateNo}`,
        url: window.location.href
      };
      
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share');
    }
  };

  const renderQRCode = () => {
    if (typeof window === 'undefined') return null;
    
    return (
      <div className="qr-code">
        <QRCode 
          value={`${window.location.origin}/verify/${certificate.certificateNo}`} 
          size={80}
          level="H"
          includeMargin={true}
        />
      </div>
    );
  };

  const renderWatermark = () => (
    <div className="certificate-watermark">
      <div className="watermark-text">CALIBRATION CERTIFICATE</div>
      {renderQRCode()}
    </div>
  );

  const CertificateContent = () => (
    <div className="certificate-container">
      {/* Header */}
      <div className="text-center mb-4 certificate-header">
        <Row>
          <Col md={3}>
            <Image src="/images/VITARLOGONEW.jpg" alt="Company Logo" height={60} />
          </Col>
          <Col md={6} className="text-center">
            <h4 className="mb-0">{equipment.category.toUpperCase()} CALIBRATION CERTIFICATE</h4>
            <div className="certificate-number mt-2">
              Certificate No: {certificate.certificateNo}
            </div>
          </Col>
          <Col md={3} className="text-end">
            <div className="accreditation-info">
              <small>NMIM Accredited</small>
              <div>Lab No: {certificate.labNumber}</div>
            </div>
          </Col>
        </Row>
      </div>

      {/* Customer Information */}
      <div className="section mb-4">
        <h6 className="section-title">Customer Information</h6>
        <Row>
          <Col md={6}>
            <div className="info-item">
              <span className="label">Customer:</span>
              <span className="value">{certificate.customerName}</span>
            </div>
            <div className="info-item">
              <span className="label">Address:</span>
              <span className="value">{certificate.customerAddress}</span>
            </div>
          </Col>
          <Col md={6}>
            <div className="info-item">
              <span className="label">Date of Calibration:</span>
              <span className="value">
                {format(new Date(certificate.calibrationDate), 'dd MMM yyyy')}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Next Due Date:</span>
              <span className="value">
                {format(new Date(certificate.nextDueDate), 'dd MMM yyyy')}
              </span>
            </div>
          </Col>
        </Row>
      </div>

      {/* Equipment Information */}
      <div className="section mb-4">
        <h6 className="section-title">Equipment Under Calibration</h6>
        <Row>
          <Col md={6}>
            <div className="info-item">
              <span className="label">Description:</span>
              <span className="value">{equipment.description}</span>
            </div>
            <div className="info-item">
              <span className="label">Manufacturer:</span>
              <span className="value">{equipment.make}</span>
            </div>
            <div className="info-item">
              <span className="label">Model:</span>
              <span className="value">{equipment.model}</span>
            </div>
          </Col>
          <Col md={6}>
            <div className="info-item">
              <span className="label">Serial Number:</span>
              <span className="value">{equipment.serialNumber}</span>
            </div>
            <div className="info-item">
              <span className="label">ID Number:</span>
              <span className="value">{equipment.tagId}</span>
            </div>
            <div className="info-item">
              <span className="label">Range:</span>
              <span className="value">{`${equipment.rangeMin} to ${equipment.rangeMax}`}</span>
            </div>
          </Col>
        </Row>
      </div>

      {/* Calibration Results */}
      <div className="section mb-4">
        <h6 className="section-title">Calibration Results</h6>
        <Table bordered size="sm" className="mt-3">
          <thead>
            <tr>
              <th>Nominal Value</th>
              <th>Standard Reading</th>
              <th>UUT Reading</th>
              <th>Error</th>
              <th>Uncertainty</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {certificate.results.map((result, index) => (
              <tr key={index}>
                <td>{result.nominal}</td>
                <td>{result.standard}</td>
                <td>{result.uut}</td>
                <td>{result.error}</td>
                <td>±{result.uncertainty}</td>
                <td>{result.status}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Environmental Conditions */}
      <div className="section mb-4">
        <h6 className="section-title">Environmental Conditions</h6>
        <Row>
          <Col md={4}>
            <div className="info-item">
              <span className="label">Temperature:</span>
              <span className="value">{certificate.environmental.temperature} °C</span>
            </div>
          </Col>
          <Col md={4}>
            <div className="info-item">
              <span className="label">Humidity:</span>
              <span className="value">{certificate.environmental.humidity} %RH</span>
            </div>
          </Col>
          <Col md={4}>
            <div className="info-item">
              <span className="label">Pressure:</span>
              <span className="value">{certificate.environmental.pressure} hPa</span>
            </div>
          </Col>
        </Row>
      </div>

      {/* Reference Standards */}
      <div className="section mb-4">
        <h6 className="section-title">Reference Standards Used</h6>
        <Table bordered size="sm" className="mt-3">
          <thead>
            <tr>
              <th>Description</th>
              <th>ID Number</th>
              <th>Certificate No.</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            {certificate.referenceStandards.map((std, index) => (
              <tr key={index}>
                <td>{std.description}</td>
                <td>{std.idNumber}</td>
                <td>{std.certificateNo}</td>
                <td>{format(new Date(std.dueDate), 'dd MMM yyyy')}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Signatures */}
      <div className="section mt-5">
        <Row>
          <Col md={6}>
            <div className="signature-box">
              <div className="signature-line"></div>
              <div className="signature-name">Calibrated By</div>
              <div className="signature-title">Technical Officer</div>
            </div>
          </Col>
          <Col md={6}>
            <div className="signature-box">
              <div className="signature-line"></div>
              <div className="signature-name">Approved By</div>
              <div className="signature-title">Quality Manager</div>
            </div>
          </Col>
        </Row>
      </div>

      
    </div>
  );

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Certificate Preview</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <CertificateContent />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Button variant="outline-primary" onClick={() => window.print()}>
          <Printer className="me-2" />
          Print
        </Button>
        <Button variant="primary" onClick={handleDownloadPDF}>
          <Download className="me-2" />
          Download PDF
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CertificatePreview; 