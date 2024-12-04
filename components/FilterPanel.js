import React, { useState } from 'react';
import { Form, Button, OverlayTrigger, Tooltip, Badge } from 'react-bootstrap';
import { Filter, ChevronDown, ChevronUp, Search, X } from 'react-feather';

const FilterPanel = ({ filters, setFilters, onClear, loading, loadData, onInputChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleInputChange = (field, value) => {
    onInputChange(field, value);
  };

  const handleSearch = () => {
    loadData();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSearch();
    }
  };

  const handleClear = () => {
    onClear();
  };

  // Common input styles
  const inputStyles = {
    fontSize: '0.9rem',
    padding: '0.5rem 0.75rem',
    height: 'auto'
  };

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="d-flex align-items-center flex-grow-1">
          <OverlayTrigger
            placement="right"
            overlay={(props) => (
              <Tooltip id="filter-tooltip" {...props}>
                Click to {isExpanded ? 'collapse' : 'expand'} search filters
              </Tooltip>
            )}
          >
            <div 
              className="d-flex align-items-center" 
              style={{ cursor: 'pointer' }}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Filter size={16} className="me-2 text-primary" />
              <h6 className="mb-0 me-2" style={{ fontSize: '1rem' }}>
                Filter
                {Object.values(filters).filter(value => value !== '').length > 0 && (
                  <Badge 
                    bg="primary" 
                    className="ms-2"
                    style={{ 
                      fontSize: '0.75rem',
                      verticalAlign: 'middle',
                      borderRadius: '12px',
                      padding: '0.25em 0.6em'
                    }}
                  >
                    {Object.values(filters).filter(value => value !== '').length}
                  </Badge>
                )}
              </h6>
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
                value={filters.search || ''}
                onChange={(e) => handleInputChange('search', e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Quick search..."
                style={inputStyles}
              />
            </div>
          )}
        </div>

        <div>
          <Button 
            variant="outline-danger" 
            size="sm"
            onClick={handleClear}
            className="me-2"
            disabled={loading}
          >
            <X size={14} className="me-1" />
            Clear
          </Button>
          
          <Button 
            variant="primary" 
            size="sm"
            onClick={handleSearch}
            disabled={loading}
          >
            <Search size={14} className="me-1" />
            Search
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3">
          <Form>
            <div className="row">
              <div className="col-md-4">
                <Form.Group className="mb-2">
                  <Form.Label className="small">Location Name</Form.Label>
                  <Form.Control
                    size="sm"
                    type="text"
                    value={filters.siteName || ''}
                    onChange={(e) => handleInputChange('siteName', e.target.value)}
                    placeholder="Search by location name"
                    style={inputStyles}
                  />
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-2">
                  <Form.Label className="small">Customer</Form.Label>
                  <Form.Control
                    size="sm"
                    type="text"
                    value={filters.customer || ''}
                    onChange={(e) => handleInputChange('customer', e.target.value)}
                    placeholder="Search by customer"
                    style={inputStyles}
                  />
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-2">
                  <Form.Label className="small">Status</Form.Label>
                  <Form.Select
                    size="sm"
                    value={filters.status || ''}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    style={inputStyles}
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </div>
            </div>
          </Form>
        </div>
      )}
    </div>
  );
};

export default FilterPanel; 