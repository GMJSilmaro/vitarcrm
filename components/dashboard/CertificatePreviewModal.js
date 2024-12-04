import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { Download, Printer } from 'react-bootstrap-icons';

const CertificatePreviewModal = ({ show, onHide, certificateData }) => {
  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Certificate Preview</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="certificate-preview">
          <h4 className="text-center mb-4">Calibration Certificate</h4>
          <div className="certificate-details">
            <div className="row mb-3">
              <div className="col-4">Certificate No:</div>
              <div className="col-8">{certificateData.certificateNo}</div>
            </div>
            <div className="row mb-3">
              <div className="col-4">Equipment:</div>
              <div className="col-8">{certificateData.description}</div>
            </div>
            <div className="row mb-3">
              <div className="col-4">Tag ID:</div>
              <div className="col-8">{certificateData.tagId}</div>
            </div>
            {/* Add more certificate details */}
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>
          Close
        </Button>
        <Button variant="outline-primary" onClick={() => window.print()}>
          <Printer className="me-2" />
          Print
        </Button>
        <Button variant="primary" onClick={() => handleDownloadCertificate(certificateData)}>
          <Download className="me-2" />
          Download
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CertificatePreviewModal; 