import React, { useState } from 'react';
import { Modal, Nav, Tab, Button, Badge, Row, Col } from 'react-bootstrap';
import { 
  InfoCircle, 
  ClipboardData, 
  Calendar3, 
  GraphUp,
  FileText,
  Download,
  Share,
  Printer,
  Clock
} from 'react-bootstrap-icons';
import dynamic from 'next/dynamic';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import TemperatureSection from './sections/TemperatureSection';
import PressureSection from './sections/PressureSection';
import CalibrationHistory from './CalibrationHistory';
import CalibrationGraph from './CalibrationGraph';
import CertificatePreview from './CertificatePreview';

const ViewDetailsModal = ({ show, onHide, equipment }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [showHistory, setShowHistory] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);

  // Mock certificate data - in real app, this would come from API
  const certificateData = {
    certificateNo: equipment?.certificateNo,
    labNumber: 'LAB-001',
    customerName: 'VITAR Group',
    customerAddress: '123 Calibration St.',
    calibrationDate: '2024-01-15',
    nextDueDate: '2025-01-15',
    results: [
      {
        nominal: '20°C',
        standard: '20.002°C',
        uut: '20.005°C',
        error: '+0.003°C',
        uncertainty: '0.005°C',
        status: 'Pass'
      }
    ],
    environmental: {
      temperature: '23.0',
      humidity: '45',
      pressure: '1013.25'
    },
    referenceStandards: [
      {
        description: 'Reference Standard',
        idNumber: 'RS-001',
        certificateNo: 'NMIM-2023-001',
        dueDate: '2024-12-31'
      }
    ]
  };

  // Mock calibration history data
  const historyData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Error Trend',
        data: [0.001, 0.002, 0.0015, 0.0018, 0.002, 0.0022],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  const renderCategorySpecificSection = () => {
    switch (equipment?.category?.toLowerCase()) {
      case 'temperature':
        return <TemperatureSection equipment={equipment} />;
      case 'pressure':
        return <PressureSection equipment={equipment} />;
      // Add other category sections
      default:
        return null;
    }
  };

  const handleExport = async (format) => {
    try {
      switch (format) {
        case 'pdf':
          // Implementation
          break;
        case 'excel':
          // Implementation
          break;
        case 'csv':
          // Implementation
          break;
      }
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(`Failed to export as ${format.toUpperCase()}`);
    }
  };

  const handleShare = async () => {
    try {
      const shareData = {
        title: `Calibration Details - ${equipment.tagId}`,
        text: `View calibration details for ${equipment.description}`,
        url: window.location.href
      };
      
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
      }
    } catch (error) {
      toast.error('Failed to share');
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" fullscreen="lg-down">
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center">
          <span className="me-2">Equipment Details</span>
          <Badge bg="primary">{equipment.category}</Badge>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
          <div className="d-flex">
            <div className="border-end" style={{ width: '200px' }}>
              <Nav variant="pills" className="flex-column p-2">
                <Nav.Item>
                  <Nav.Link eventKey="details" className="d-flex align-items-center">
                    <InfoCircle className="me-2" />
                    Details
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="certificate" className="d-flex align-items-center">
                    <FileText className="me-2" />
                    Current Certificate
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="calibration" className="d-flex align-items-center">
                    <ClipboardData className="me-2" />
                    Calibration Data
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="history" className="d-flex align-items-center">
                    <Calendar3 className="me-2" />
                    History
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="trends" className="d-flex align-items-center">
                    <GraphUp className="me-2" />
                    Trends
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </div>

            <div className="flex-grow-1 p-3">
              <Tab.Content>
                <Tab.Pane eventKey="details">
                  {renderCategorySpecificSection()}
                </Tab.Pane>
                <Tab.Pane eventKey="certificate">
                  <div className="certificate-preview-container">
                    <CertificatePreview 
                      equipment={equipment}
                      certificate={certificateData}
                      embedded={true}
                    />
                  </div>
                </Tab.Pane>
                <Tab.Pane eventKey="calibration">
                  <CalibrationHistory equipment={equipment} />
                </Tab.Pane>
                <Tab.Pane eventKey="history">
                  <div className="p-3">
                    <h6>Calibration History</h6>
                    {/* Add calibration history component */}
                  </div>
                </Tab.Pane>
                <Tab.Pane eventKey="trends">
                  <CalibrationGraph equipment={equipment} />
                </Tab.Pane>
              </Tab.Content>
            </div>
          </div>
        </Tab.Container>
      </Modal.Body>
      <Modal.Footer>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={onHide}>
            Close
          </Button>
          <Button variant="outline-primary" onClick={() => handleExport('pdf')}>
            <Download className="me-1" /> Export PDF
          </Button>
          <Button variant="outline-primary" onClick={handleShare}>
            <Share className="me-1" /> Share
          </Button>
          <Button variant="primary" onClick={() => setShowCertificate(true)}>
            <FileText className="me-1" /> View Certificate
          </Button>
        </div>
      </Modal.Footer>

      <style jsx>{`
        .certificate-preview-container {
          height: calc(100vh - 250px);
          overflow-y: auto;
        }
      `}</style>
    </Modal>
  );
};

export default ViewDetailsModal; 