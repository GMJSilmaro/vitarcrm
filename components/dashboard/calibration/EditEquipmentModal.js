import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Tab, Nav } from 'react-bootstrap';
import { 
  InfoCircle, 
  Tools, 
  ClipboardData, 
  Shield 
} from 'react-bootstrap-icons';
import toast from 'react-hot-toast';

const EditEquipmentModal = ({ show, onHide, equipment, onSave }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    description: '',
    make: '',
    model: '',
    serialNumber: '',
    type: '',
    rangeMin: '',
    rangeMax: '',
    rangeMinPercent: '',
    rangeMaxPercent: '',
    certificateNo: '',
    traceability: '',
    // Category specific fields
    ...equipment
  });

  useEffect(() => {
    if (equipment) {
      setFormData(equipment);
    }
  }, [equipment]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSave(formData);
      toast.success('Equipment updated successfully');
      onHide();
    } catch (error) {
      toast.error('Failed to update equipment');
    }
  };

  const getCategoryFields = () => {
    switch (equipment?.category?.toLowerCase()) {
      case 'temperature':
        return [
          { name: 'sensorType', label: 'Sensor Type', type: 'select', 
            options: ['RTD', 'Thermocouple', 'Thermistor'] },
          { name: 'resolution', label: 'Resolution', type: 'text' },
          { name: 'stabilityTime', label: 'Stability Time (mins)', type: 'number' }
        ];
      // Add other categories
      default:
        return [];
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" fullscreen="lg-down">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Equipment</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
            <div className="d-flex">
              <div className="border-end" style={{ width: '200px' }}>
                <Nav variant="pills" className="flex-column p-2">
                  <Nav.Item>
                    <Nav.Link eventKey="basic" className="d-flex align-items-center">
                      <InfoCircle className="me-2" />
                      Basic Info
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="technical" className="d-flex align-items-center">
                      <Tools className="me-2" />
                      Technical Details
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="calibration" className="d-flex align-items-center">
                      <ClipboardData className="me-2" />
                      Calibration
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="certification" className="d-flex align-items-center">
                      <Shield className="me-2" />
                      Certification
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </div>

              <div className="flex-grow-1 p-3">
                <Tab.Content>
                  <Tab.Pane eventKey="basic">
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Description</Form.Label>
                          <Form.Control
                            type="text"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Make</Form.Label>
                          <Form.Control
                            type="text"
                            name="make"
                            value={formData.make}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    {/* Add more basic fields */}
                  </Tab.Pane>

                  <Tab.Pane eventKey="technical">
                    <Row>
                      {getCategoryFields().map(field => (
                        <Col md={6} key={field.name}>
                          <Form.Group className="mb-3">
                            <Form.Label>{field.label}</Form.Label>
                            {field.type === 'select' ? (
                              <Form.Select
                                name={field.name}
                                value={formData[field.name] || ''}
                                onChange={handleChange}
                              >
                                <option value="">Select {field.label}</option>
                                {field.options.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </Form.Select>
                            ) : (
                              <Form.Control
                                type={field.type}
                                name={field.name}
                                value={formData[field.name] || ''}
                                onChange={handleChange}
                              />
                            )}
                          </Form.Group>
                        </Col>
                      ))}
                    </Row>
                  </Tab.Pane>

                  {/* Add other tab panes */}
                </Tab.Content>
              </div>
            </div>
          </Tab.Container>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Save Changes
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default EditEquipmentModal; 