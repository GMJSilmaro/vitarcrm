import React, { useState } from 'react';
import { Card, Form, Button, Row, Col } from 'react-bootstrap';
import { X as FeatherX, Search } from 'react-feather';

const TableFilter = ({
  fields,
  onFilter,
  onClear,
  loading
}) => {
  const [filters, setFilters] = useState({});

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApplyFilters = () => {
    onFilter(filters);
  };

  const handleClearFilters = () => {
    setFilters({});
    onClear();
  };

  return (
    <Card className="border-0 shadow-sm mb-4">
      <Card.Body>
        <Row>
          {fields.map(field => (
            <Col key={field.key} md={field.width || 6}>
              <Form.Group className="mb-3">
                <Form.Label className="small">{field.label}:</Form.Label>
                {field.type === 'select' ? (
                  <Form.Select
                    size="sm"
                    value={filters[field.key] || ''}
                    onChange={(e) => handleFilterChange(field.key, e.target.value)}
                  >
                    <option value="">{field.placeholder || `Select ${field.label}`}</option>
                    {field.options.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                ) : (
                  <Form.Control
                    size="sm"
                    type={field.type || 'text'}
                    value={filters[field.key] || ''}
                    onChange={(e) => handleFilterChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                  />
                )}
              </Form.Group>
            </Col>
          ))}
        </Row>
        <div className="d-flex justify-content-end gap-2">
          <Button
            variant="danger"
            size="sm"
            onClick={handleClearFilters}
            disabled={loading}
          >
            <FeatherX size={14} className="me-1" />
            Clear
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleApplyFilters}
            disabled={loading}
          >
            <Search size={14} className="me-1" />
            Apply Filters
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default TableFilter; 