import React, { useState } from 'react';
import { Card, Row, Col, Button, Form, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FilterCircle, ChevronDown, ChevronUp } from 'react-bootstrap-icons';
import { Search } from 'react-feather';

const FilterPanel = ({ 
  filters, 
  setFilters, 
  onClear, 
  loading, 
  handleSearch,
  filterFields = [],
  quickSearchPlaceholder = "Quick search..."
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tempFilters, setTempFilters] = useState(filters);

  const handleFilterChange = (field, value) => {
    setTempFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearchSubmit = async () => {
    try {
      await handleSearch(tempFilters);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search records');
    }
  };

  return (
    <Card className="border-0 shadow-sm mb-4">
      <Card.Body className="p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="d-flex align-items-center flex-grow-1">
            <OverlayTrigger
              placement="right"
              overlay={<Tooltip>Click to {isExpanded ? 'collapse' : 'expand'} search filters</Tooltip>}
            >
              <div 
                className="d-flex align-items-center" 
                style={{ cursor: 'pointer' }}
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <FilterCircle size={16} className="me-2 text-primary" />
                <h6 className="mb-0 me-2">Filter</h6>
                {isExpanded ? (
                  <ChevronUp size={16} className="text-muted" />
                ) : (
                  <ChevronDown size={16} className="text-muted" />
                )}
              </div>
            </OverlayTrigger>

            {!isExpanded && (
              <div className="ms-4 flex-grow-1" style={{ maxWidth: '300px' }}>
                <Form.Control
                  size="sm"
                  type="text"
                  placeholder={quickSearchPlaceholder}
                  value={tempFilters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="d-flex gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={onClear}
              disabled={loading}
            >
              Clear
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSearchSubmit}
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </div>

        <div style={{ 
          maxHeight: isExpanded ? '1000px' : '0',
          overflow: 'hidden',
          transition: 'all 0.3s ease-in-out',
          opacity: isExpanded ? 1 : 0
        }}>
          <Row className="mt-3">
            {filterFields.map((field, index) => (
              <Col md={field.colSize || 6} key={index}>
                <Form.Group className="mb-3">
                  <Form.Label>{field.label}</Form.Label>
                  {field.type === 'select' ? (
                    <Form.Select
                      value={tempFilters[field.name]}
                      onChange={(e) => handleFilterChange(field.name, e.target.value)}
                    >
                      <option value="">{field.placeholder || `All ${field.label}`}</option>
                      {field.options.map((option, idx) => (
                        <option key={idx} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Form.Select>
                  ) : (
                    <Form.Control
                      type={field.type || 'text'}
                      placeholder={field.placeholder}
                      value={tempFilters[field.name]}
                      onChange={(e) => handleFilterChange(field.name, e.target.value)}
                    />
                  )}
                </Form.Group>
              </Col>
            ))}
          </Row>
        </div>
      </Card.Body>
    </Card>
  );
};

export default FilterPanel; 