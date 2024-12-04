import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import { GeeksSEO } from 'widgets';
import CalibrationLayout from '../layouts/CalibrationLayout';
import { 
  mechanicalData, 
  temperatureData, 
  pressureData, 
  electricalData,
  dimensionalData,
  volumetricData 
} from '@/mocks/calibration/mechanicalData';
import toast from 'react-hot-toast';

const EditCalibration = () => {
  const router = useRouter();
  const { category, id } = router.query;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [equipment, setEquipment] = useState(null);

  // Form state
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
    traceability: ''
  });

  // Category-specific fields
  const getCategoryFields = () => {
    switch (category?.toLowerCase()) {
      case 'temperature':
        return [
          { name: 'sensorType', label: 'Sensor Type', type: 'select', 
            options: ['RTD', 'Thermocouple', 'Thermistor'] },
          { name: 'resolution', label: 'Resolution', type: 'text' },
          { name: 'stabilityTime', label: 'Stability Time (mins)', type: 'number' }
        ];
      case 'pressure':
        return [
          { name: 'pressureType', label: 'Pressure Type', type: 'select',
            options: ['Gauge', 'Absolute', 'Differential'] },
          { name: 'medium', label: 'Medium', type: 'select',
            options: ['Gas', 'Liquid'] }
        ];
      // Add more category-specific fields
      default:
        return [];
    }
  };

  useEffect(() => {
    if (category && id) {
      fetchEquipment();
    }
  }, [category, id]);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      let data;
      switch (category.toLowerCase()) {
        case 'mechanical': data = mechanicalData; break;
        case 'temperature': data = temperatureData; break;
        case 'pressure': data = pressureData; break;
        case 'electrical': data = electricalData; break;
        case 'dimensional': data = dimensionalData; break;
        case 'volumetric': data = volumetricData; break;
        default: throw new Error('Invalid category');
      }

      const found = data.find(item => item.inventoryId === id);
      if (!found) throw new Error('Equipment not found');
      
      setEquipment(found);
      setFormData(found);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      toast.error('Failed to load equipment details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Equipment updated successfully');
      router.push(`/dashboard/calibration/${category}/${id}`);
    } catch (error) {
      console.error('Error updating equipment:', error);
      toast.error('Failed to update equipment');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading equipment details...</p>
      </div>
    );
  }

  return (
    <CalibrationLayout
      title={`Edit ${category} Equipment`}
      description={`Edit details for ${equipment?.description} (${equipment?.tagId})`}
    >
      <Card className="border-0 shadow-sm">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
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

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Model</Form.Label>
                  <Form.Control
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Serial Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="serialNumber"
                    value={formData.serialNumber}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Range Information */}
            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Range (Min)</Form.Label>
                  <Form.Control
                    type="text"
                    name="rangeMin"
                    value={formData.rangeMin}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Range (Max)</Form.Label>
                  <Form.Control
                    type="text"
                    name="rangeMax"
                    value={formData.rangeMax}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Range (Min%)</Form.Label>
                  <Form.Control
                    type="text"
                    name="rangeMinPercent"
                    value={formData.rangeMinPercent}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Range (Max%)</Form.Label>
                  <Form.Control
                    type="text"
                    name="rangeMaxPercent"
                    value={formData.rangeMaxPercent}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Category-specific fields */}
            {getCategoryFields().map(field => (
              <Form.Group key={field.name} className="mb-3">
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
            ))}

            <div className="mt-4">
              <Button
                variant="secondary"
                onClick={() => router.back()}
                className="me-2"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </CalibrationLayout>
  );
};

export default EditCalibration; 