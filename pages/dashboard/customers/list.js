'use client'

import React, { Fragment, useMemo, useState, useEffect, useCallback, useRef, memo } from 'react';
import { Col, Row, Card, Button, OverlayTrigger, Tooltip, Badge, Breadcrumb, Placeholder, Spinner, Form, Collapse, Modal, DropdownButton, Dropdown } from 'react-bootstrap';
import { useRouter } from 'next/router';
import { 
  Eye, 
  EnvelopeFill, 
  TelephoneFill, 
  GeoAltFill, 
  CurrencyExchange, 
  HouseFill, 
  CalendarRange, 
  CheckCircleFill,
  XLg,
  ChevronLeft, 
  ChevronRight,
  FilterCircle,
  Calendar,
  ListUl,
  House,
  People,
  Building,
  PencilSquare,
  Trash,
  Download,
  XCircle
} from 'react-bootstrap-icons';
import { GeeksSEO, PageHeading } from 'widgets'
import moment from 'moment';
import { 
  Search, 
  Filter as FeatherFilter,
  ChevronDown, 
  ChevronUp,
  ChevronRight as FeatherChevronRight,
  X as FeatherX
} from 'react-feather';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table'
import toast from 'react-hot-toast';
import { TABLE_CONFIG } from 'constants/tableConfig';
import Link from 'next/link';
import { FaPlus } from 'react-icons/fa';
import ContentHeader from '@/components/dashboard/ContentHeader';
import { collection, getDocs, query, where, onSnapshot, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '@/firebase';

// Add this utility function at the top of your file, before the ViewCustomers component
const getPageNumbers = (currentPage, totalPages) => {
  const delta = 2;
  const range = [];
  const rangeWithDots = [];
  let l;

  // Always show first page
  range.push(1);

  // Calculate range based on current page
  for (let i = currentPage - delta; i <= currentPage + delta; i++) {
    if (i > 1 && i < totalPages) {
      range.push(i);
    }
  }

  // Always show last page
  if (totalPages > 1) {
    range.push(totalPages);
  }

  // Add dots where needed
  for (let i of range) {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l !== 1) {
        rangeWithDots.push('...');
      }
    }
    rangeWithDots.push(i);
    l = i;
  }

  return rangeWithDots;
};


const FilterPanel = ({ 
  filters, 
  setFilters, 
  onClear, 
  loading, 
  handleSearch, 
  setData, 
  setTotalRows,
  initialData 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tempFilters, setTempFilters] = useState(filters);
  const searchTimeoutRef = useRef(null); // Add this for debouncing

  const handleFilterChange = (field, value) => {
    const newTempFilters = {
      ...tempFilters,
      [field]: value
    };
    setTempFilters(newTempFilters);
    
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // If it's a quick search and not expanded, trigger search after a delay
    if (field === 'quickSearch' && !isExpanded && value.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch(newTempFilters);
      }, 500); // 500ms debounce
    }
  };

  const handleKeyPress = async (e) => {
    if (e.key === 'Enter' && !loading) {
      e.preventDefault();
      // Clear any existing timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      await handleSearch(tempFilters);
    }
  };

  const handleSearchClick = async () => {
    if (!loading) {
      // Clear any existing timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      await handleSearch(tempFilters);
    }
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleClear = () => {
    if (loading) return; // Prevent double clicks
    
    // Call the parent's onClear
    if (onClear) {
      onClear();
    }
  };

  return (
    <Card className="border-0 shadow-sm mb-4">
      <Card.Body className="p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="d-flex align-items-center flex-grow-1">
            <OverlayTrigger
              placement="right"
              overlay={<Tooltip>Click to {isExpanded ? 'collapse' : 'expand'} search for customers</Tooltip>}
            >
              <div 
                className="d-flex align-items-center" 
                style={{ cursor: 'pointer' }}
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <FilterCircle size={16} className="me-2 text-primary" />
                <h6 className="mb-0 me-2" style={{ fontSize: '1rem' }}>
                  Filter
                  {Object.values(tempFilters).filter(value => value !== '').length > 0 && (
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
                      {Object.values(tempFilters).filter(value => value !== '').length}
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

            {/* Quick search when collapsed */}
            {!isExpanded && (
              <div className="ms-4 flex-grow-1" style={{ maxWidth: '300px' }}>
                <Form.Group className="mb-0">
                  <Form.Control
                    size="sm"
                    type="text"
                    value={tempFilters.quickSearch || ''}
                    onChange={(e) => handleFilterChange('quickSearch', e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Quick search by Customer Name..."
                    style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                  />
                </Form.Group>
              </div>
            )}
          </div>

          <div className="d-flex justify-content-end align-items-center gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={handleClear}
              disabled={loading}
              className="clear-btn d-flex align-items-center"
            >
              <FeatherX size={14} className="me-1" />
              Clear
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSearchClick}
              disabled={loading}
              className="search-btn d-flex align-items-center"
            >
              <Search size={14} className="me-1" />
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </div>

        {/* Expanded filter panel */}
        <div style={{ 
          maxHeight: isExpanded ? '1000px' : '0',
          overflow: 'hidden',
          transition: 'all 0.3s ease-in-out',
          opacity: isExpanded ? 1 : 0
        }}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">Customer ID:</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={tempFilters.customerId}
                  onChange={(e) => handleFilterChange('customerId', e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Enter customer ID..."
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">Customer Name:</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={tempFilters.customerName}
                  onChange={(e) => handleFilterChange('customerName', e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Search by customer name..."
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">Customer Type:</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={tempFilters.customerType}
                  onChange={(e) => handleFilterChange('customerType', e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Search in customer type..."
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">City:</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={tempFilters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Enter city..."
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">Country:</Form.Label>
                <Form.Select
                  size="sm"
                  value={tempFilters.country}
                  onChange={(e) => handleFilterChange('country', e.target.value)}
                  onKeyDown={handleKeyPress}
                >
                  <option value="">All Countries</option>
                  <option value="MY">Malaysia</option>
                  <option value="SG">Singapore</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </div>
      </Card.Body>
    </Card>
  );
};

// Add this new component for the addresses modal
const AddressesModal = ({ show, onHide, addresses, defaultAddress, billtoDefault, shiptoDefault }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(3); // Default to 3 items
  

  // Simplified page size options
  const pageSizeOptions = [3, 5, 10];

  // Filter and split addresses
  const filteredAddresses = useMemo(() => {
    const filtered = addresses.filter(address => {
      const matchesSearch = searchTerm === '' || 
        Object.values(address).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const matchesType = filterType === 'all' || 
        (filterType === 'billing' && address.AddressType === 'bo_BillTo') ||
        (filterType === 'shipping' && address.AddressType === 'bo_ShipTo');

      return matchesSearch && matchesType;
    });

    return {
      billing: filtered.filter(addr => addr.AddressType === 'bo_BillTo'),
      shipping: filtered.filter(addr => addr.AddressType === 'bo_ShipTo')
    };
  }, [addresses, searchTerm, filterType]);

  // Calculate if we should show both columns or just one
  const showBillingOnly = filterType === 'billing' || (filterType === 'all' && filteredAddresses.shipping.length === 0);
  const showShippingOnly = filterType === 'shipping' || (filterType === 'all' && filteredAddresses.billing.length === 0);
  const showBothColumns = !showBillingOnly && !showShippingOnly;

  // Calculate pagination based on visible content
  const totalPages = Math.ceil(
    Math.max(
      showBillingOnly ? filteredAddresses.billing.length : 0,
      showShippingOnly ? filteredAddresses.shipping.length : 0,
      showBothColumns ? Math.max(filteredAddresses.billing.length, filteredAddresses.shipping.length) : 0
    ) / itemsPerPage
  );

  // Get current page items
  const getCurrentPageItems = (items) => {
    const start = (currentPage - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  };

  const AddressTable = ({ addresses, type, billtoDefault, shiptoDefault }) => {
    console.log('AddressTable Props:', {
      type,
      billtoDefault,
      shiptoDefault,
      addresses: addresses.map(a => ({
        AddressName: a.AddressName,
        AddressType: a.AddressType,
        isDefault: type === 'shipping' ? 
          a.AddressName === shiptoDefault : 
          a.AddressName === billtoDefault
      }))
    });

    return (
      <div className="table-responsive" onClick={(e) => e.stopPropagation()}>
        <table className="table table-hover">
          <thead>
            <tr>
              <th>
                {type === 'billing' ? (
                  <div className="d-flex align-items-center">
                    <CurrencyExchange className="me-2" size={14} />
                    Building
                  </div>
                ) : (
                  <div className="d-flex align-items-center">
                    <GeoAltFill className="me-2" size={14} />
                    Building
                  </div>
                )}
              </th>
              <th>Address</th>
              <th>Default</th>
            </tr>
          </thead>
          <tbody>
            {addresses.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center py-4">
                  <div className="text-muted">
                    {type === 'billing' ? (
                      <div className="d-flex align-items-center justify-content-center">
                        <CurrencyExchange className="me-2" size={14} />
                        No billing addresses found
                      </div>
                    ) : (
                      <div className="d-flex align-items-center justify-content-center">
                        <GeoAltFill className="me-2" size={14} />
                        No shipping addresses found
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              getCurrentPageItems(addresses).map((address, index) => (
                <tr key={index}>
                  <td>
                    <div className="d-flex align-items-center">
                      {type === 'billing' ? (
                        <CurrencyExchange className="me-2 text-primary" size={14} />
                      ) : (
                        <GeoAltFill className="me-2 text-primary" size={14} />
                      )}
                      <span className="fw-bold text-primary">
                        {address.AddressName || '-'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="text-wrap" style={{ maxWidth: '200px' }}>
                      <HouseFill className="me-2 text-muted" size={14} />
                      {[
                        address.BuildingFloorRoom && address.BuildingFloorRoom !== address.AddressName ? address.BuildingFloorRoom : null,
                        address.Street,
                        address.ZipCode,
                        address.Country === 'SG' ? 'Singapore' : address.Country
                      ].filter(Boolean).join(', ')}
                    </div>
                  </td>
                  <td>
                    {type === 'billing' && address.AddressName === billtoDefault && (
                      <Badge bg="primary" className="d-flex align-items-center" style={{ width: 'fit-content' }}>
                        <CheckCircleFill className="me-1" size={12} />
                        Default
                      </Badge>
                    )}
                    {type === 'shipping' && address.AddressName === shiptoDefault && (
                      <Badge bg="primary" className="d-flex align-items-center" style={{ width: 'fit-content' }}>
                        <CheckCircleFill className="me-1" size={12} />
                        Default
                      </Badge>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="xl" 
      onClick={(e) => e.stopPropagation()}
    >
      <Modal.Header closeButton onClick={(e) => e.stopPropagation()}>
        <Modal.Title>
          <Search size={18} className="me-2" />
          All Addresses
        </Modal.Title>
      </Modal.Header>
      <Modal.Body onClick={(e) => e.stopPropagation()}>
        {/* Search and Filter Controls */}
        <div className="mb-3">
          <Row className="g-2">
            <Col md={8}>
              <Form.Group>
                <div className="position-relative">
                  <Form.Control
                    type="text"
                    placeholder="Search addresses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    size="sm"
                  />
                  <Search 
                    size={14} 
                    className="position-absolute" 
                    style={{ 
                      top: '50%', 
                      right: '10px', 
                      transform: 'translateY(-50%)',
                      color: '#6c757d'
                    }}
                  />
                </div>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Select 
                size="sm"
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Types</option>
                <option value="billing">Billing Only</option>
                <option value="shipping">Shipping Only</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <div className="d-flex align-items-center">
                <small className="text-muted me-2">Show:</small>
                <Form.Select
                  size="sm"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{ width: '70px' }}
                >
                  {pageSizeOptions.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </Form.Select>
              </div>
            </Col>
          </Row>
        </div>

        {/* Results Summary */}
        <div className="mb-3 text-muted small d-flex align-items-center">
          <FilterCircle size={14} className="me-2" />
          Found {filteredAddresses.billing.length} billing and {filteredAddresses.shipping.length} shipping addresses
        </div>

        {/* Dynamic Content */}
        <Row>
          {getCurrentPageItems(filteredAddresses.billing).length > 0 && (filterType === 'all' || filterType === 'billing') && (
            <Col md={6} className="border-end">
              <h6 className="mb-3 d-flex align-items-center">
                <CurrencyExchange className="me-2" />
                Billing Addresses
                <Badge bg="secondary" className="ms-2">
                  {filteredAddresses.billing.length}
                </Badge>
              </h6>
              <AddressTable 
                addresses={filteredAddresses.billing} 
                type="billing"
                billtoDefault={billtoDefault}
                shiptoDefault={shiptoDefault}
              />
            </Col>
          )}

          {(filterType === 'all' || filterType === 'shipping') && (
            <Col md={getCurrentPageItems(filteredAddresses.billing).length > 0 ? 6 : 12}>
              <h6 className="mb-3 d-flex align-items-center">
                <GeoAltFill className="me-2" />
                Shipping Addresses
                <Badge bg="secondary" className="ms-2">
                  {filteredAddresses.shipping.length}
                </Badge>
              </h6>
              <AddressTable 
                addresses={filteredAddresses.shipping}
                type="shipping"
                billtoDefault={billtoDefault}
                shiptoDefault={shiptoDefault}
              />
            </Col>
          )}

          {filteredAddresses.billing.length === 0 && filteredAddresses.shipping.length === 0 && (
            <Col md={12}>
              <div className="text-center py-4 text-muted">
                <Search size={20} className="mb-2" />
                <p>No addresses found matching your search criteria</p>
              </div>
            </Col>
          )}
        </Row>

        {/* Updated Pagination Info */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-4">
            <div className="text-muted small">
              <ListUl size={14} className="me-2" />
              {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, Math.max(filteredAddresses.billing.length, filteredAddresses.shipping.length))} of {Math.max(filteredAddresses.billing.length, filteredAddresses.shipping.length)}
            </div>
            <div className="d-flex align-items-center">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="me-2"
              >
                <ChevronLeft size={14} className="me-1" />
                Previous
              </Button>
              <div className="mx-3 d-flex align-items-center">
                <Calendar size={14} className="me-2" />
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <FeatherChevronRight size={14} className="ms-1" />
              </Button>
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer onClick={(e) => e.stopPropagation()}>
        <Button variant="secondary" onClick={(e) => {
          e.stopPropagation();
          onHide();
        }}>
          <XLg size={14} className="me-1" />
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Update the TableRow component to remove click functionality
const TableRow = memo(({ row }) => {
  return (
    <tr>
      {row.getVisibleCells().map(cell => (
        <td key={`${row.original.customerId}_${cell.column.id}`}>
          {flexRender(
            cell.column.columnDef.cell,
            cell.getContext()
          )}
        </td>
      ))}
    </tr>
  );
});

TableRow.displayName = 'TableRow';

const ViewCustomers = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  const [perPage, setPerPage] = useState(TABLE_CONFIG.PAGE_SIZES.DEFAULT);
  const [initialLoad, setInitialLoad] = useState(true);
  const [initialData, setInitialData] = useState([]);
  const [filters, setFilters] = useState({
    quickSearch: '',
    customerId: '',
    customerName: '',
    address: '',
    city: '',
    country: '',
    status: '',
    customerType: '',
    customerStatus: '',
    locations: '',
  });

  // Add state for last document (for pagination)
  const [lastDoc, setLastDoc] = useState(null);
  const [firstDoc, setFirstDoc] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const columns = useMemo(() => [
    {
      accessorKey: 'index',
      header: '#',
      size: 50,
      cell: info => {
        const rowIndex = info.row.index;
        const pageIndex = table.getState().pagination.pageIndex;
        const pageSize = table.getState().pagination.pageSize;
        const displayIndex = rowIndex + (pageIndex * pageSize) + 1;
        return (
          <div className="d-flex align-items-center">
            <span className="text-primary">{displayIndex}</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'customerId',
      header: 'Customer ID',
      size: 100,
      cell: info => (
        <div className="d-flex align-items-center">
          <Building className="me-2" size={14} />
          <span className="text-primary">{info.getValue()}</span>
        </div>
      )
    },
    {
      accessorKey: 'customerName',
      header: 'Customer Name',
      size: 200,
    },
    {
      accessorKey: 'locations',
      header: 'Address Information',
      size: 300,
      cell: info => {
        const locations = info.getValue() || [];
        const defaultLocation = locations.find(loc => loc.isDefault) || locations[0];

        if (!defaultLocation) {
          return (
            <div className="d-flex flex-column align-items-center py-2">
              <GeoAltFill className="text-warning mb-2" size={16} />
              <Badge 
                bg="warning" 
                text="dark"
                className="d-flex align-items-center gap-1"
              >
                <XLg size={10} />
                Address Required | No Location Found
              </Badge>
            </div>
          );
        }

        return (
          <div>
            {/* Site Name */}
            <div className="mb-2">
              <div className="d-flex align-items-center">
                <Building className="me-2 text-primary" size={14} />
                <span className="fw-bold text-primary">
                  {defaultLocation.siteName}
                </span>
              </div>
            </div>

            {/* Address */}
            <div className="text-muted small">
              <div className="d-flex align-items-start">
                <GeoAltFill className="me-2 mt-1" size={12} />
                <div>
                  {defaultLocation.mainAddress || 'No Address Available'}
                </div>
              </div>
            </div>

            {/* Location Count */}
            {locations.length > 1 && (
              <div className="mt-1">
                <Badge bg="info" className="d-flex align-items-center" style={{ width: 'fit-content' }}>
                  <GeoAltFill className="me-1" size={10} />
                  {locations.length} Location{locations.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 100,
    }
  ], []);


  const filteredData = useMemo(() => {
    return data.filter(customer => {
      // Customer ID filter
      const matchesCustomerId = !filters.customerId || 
        customer.customerId?.toLowerCase().includes(filters.customerId.toLowerCase());

      // Site Name filter
      const matchesCustomerName = !filters.customerName || 
        customer.customerName?.toLowerCase().includes('%' + filters.customerName.toLowerCase() + '%');

      // Address filter (check all address fields)
      const matchesAddress = !filters.address || (
        (customer.streetAddress1?.toLowerCase().includes(filters.address.toLowerCase()) ||
        customer.streetAddress2?.toLowerCase().includes(filters.address.toLowerCase()) ||
        customer.streetAddress3?.toLowerCase().includes(filters.address.toLowerCase()))
      );

      // City filter
      const matchesCity = !filters.city || 
        customer.city?.toLowerCase().includes(filters.city.toLowerCase());

      // Country filter
      const matchesCountry = !filters.country || 
        customer.country === filters.country;

      // Status filter
      const matchesStatus = !filters.status || 
        customer.status === filters.status;

      return matchesCustomerId && matchesCustomerName && matchesAddress && 
             matchesCity && matchesCountry && matchesStatus;
    });
  }, [data, filters]);

  

  // Optimize the table configuration
  const table = useReactTable({
    data: filteredData.slice((currentPage - 1) * perPage, currentPage * perPage), // Paginate the data
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      pagination: {
        pageIndex: currentPage - 1, // Convert 1-based to 0-based index
        pageSize: perPage
      }
    },
    manualPagination: true,
    pageCount: Math.ceil(filteredData.length / perPage) // Calculate total pages
  });

  // Add pagination change handler
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Update the getPageNumbers function to use filteredData length
  const pageNumbers = getPageNumbers(currentPage, Math.ceil(filteredData.length / perPage));

  const handleViewDetails = (customer) => {
    console.log('Viewing customer:', customer);
    router.push(`/dashboard/customers/view/${customer.customerId}`);
  };

  const handleClearFilters = async () => {
    setLoading(true);
    try {
      // Reset all filters
      const clearedFilters = {
        quickSearch: '',
        customerId: '',
        customerName: '',
        address: '',
        city: '',
        country: '',
        status: ''
      };
      setFilters(clearedFilters);
      setCurrentPage(1);

      // Fetch fresh data with limit
      const customersRef = collection(db, 'customers');
      const clearQuery = query(
        customersRef,
        orderBy('customerId', 'asc'),
      );

      const snapshot = await getDocs(clearQuery);
      const customers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setData(customers);
      setTotalRows(customers.length);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setFirstDoc(snapshot.docs[0]);
      
      toast.success('Filters cleared successfully');
    } catch (error) {
      console.error('Error clearing filters:', error);
      toast.error('Failed to clear filters');
    } finally {
      setLoading(false);
    }
  };

  // Add this customStyles object near the top of your file
  const customStyles = {
    table: {
      style: {
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        width: "100%",
        tableLayout: "fixed",
      },
    },
    headRow: {
      style: {
        backgroundColor: "#f8fafc",
        borderTopLeftRadius: "8px",
        borderTopRightRadius: "8px",
        borderBottom: "1px solid #e2e8f0",
        minHeight: "52px",
      },
    },
    headCells: {
      style: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#475569",
        paddingLeft: "16px",
        paddingRight: "16px",
      },
    },
    cells: {
      style: {
        fontSize: "14px",
        color: "#64748b",
        paddingLeft: "16px",
        paddingRight: "16px",
        paddingTop: "12px",
        paddingBottom: "12px",
      },
    },
    rows: {
      style: {
        minHeight: "60px",
        "&:hover": {
          backgroundColor: "#f1f5f9",
          cursor: "pointer",
          transition: "all 0.2s",
        },
      },
    },
    pagination: {
      style: {
        borderTop: "1px solid #e2e8f0",
        minHeight: "56px",
      },
      pageButtonsStyle: {
        borderRadius: "4px",
        height: "32px",
        padding: "4px 8px",
        margin: "0 4px",
      },
    },
  };


  const QuickActions = ({ customer }) => (
    <DropdownButton
      size="sm"
      variant="light"
      title="Actions"
    >
      <Dropdown.Item onClick={() => handleViewDetails(customer)}>
        <Eye size={14} className="me-2" />
        View Details
      </Dropdown.Item>
      <Dropdown.Item onClick={() => handleEditCustomer(customer)}>
        <PencilSquare size={14} className="me-2" />
        Edit
      </Dropdown.Item>
      <Dropdown.Divider />
      <Dropdown.Item 
        className="text-danger"
        onClick={() => handleDeleteCustomer(customer)}
      >
        <Trash size={14} className="me-2" />
        Delete
      </Dropdown.Item>
    </DropdownButton>
  );

  
  // Add search handler
  const PaginationInfo = () => (
    <div className="text-muted small">
      Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, totalRows)} of {totalRows} entries
    </div>
  );


  // Add this function to handle per page changes
  const handlePerRowsChange = async (newPerPage) => {
    setLoading(true);
    try {
      setPerPage(newPerPage);
      setCurrentPage(1); // Reset to first page when changing items per page
      
      // Fetch fresh data with new limit if using server-side pagination
      const customersRef = collection(db, 'customers');
      const newQuery = query(
        customersRef,
        orderBy('customerId', 'asc'),
        limit(newPerPage)
      );

      const snapshot = await getDocs(newQuery);
      const customers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setData(customers);
      setTotalRows(customers.length);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setFirstDoc(snapshot.docs[0]);
      
    } catch (error) {
      console.error('Error changing page size:', error);
      toast.error('Failed to update page size');
    } finally {
      setLoading(false);
    }
  };

  // Update the entries per page dropdown
  const EntriesPerPage = () => (
    <div className="d-flex align-items-center">
      <span className="text-muted me-2">Show:</span>
      <Form.Select
        size="sm"
        value={perPage}
        onChange={(e) => handlePerRowsChange(Number(e.target.value))}
        style={{ width: '80px' }}
        disabled={loading}
      >
        <option value={5}>5</option>
        <option value={10}>10</option>
        <option value={25}>25</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
      </Form.Select>
      <span className="text-muted ms-2">entries</span>
    </div>
  );



  // Update the FilterPanel's handleSearch function to work with direct data
  const handleSearch = async (searchFilters) => {
    console.log('🔍 Starting search with filters:', searchFilters);
    setLoading(true);
    
    let searchResults = [];
    let lastDocument = null;
    let firstDocument = null;
    let totalReadCount = 0;

    try {
      const customersRef = collection(db, 'customers');
      
      if (searchFilters.quickSearch) {
        const searchTerm = searchFilters.quickSearch;
        console.log('🔎 Performing quick search for:', searchTerm);
        
        // First try searching by city
        let searchQuery = query(
          customersRef,
          where('customerName', '==', searchTerm),
          limit(999)
        );

        let snapshot = await getDocs(searchQuery);
        totalReadCount += snapshot.docs.length;
        console.log(`📊 Firebase Reads for city search: ${snapshot.docs.length}`);

        searchResults = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        if (searchResults.length === 0) {
          // Try searching by siteName
          searchQuery = query(
            customersRef,
            where('customerName', '>=', searchTerm),
            where('customerName', '<=', searchTerm + '\uf8ff'),
            limit(999)
          );

          snapshot = await getDocs(searchQuery);
          totalReadCount += snapshot.docs.length;
          console.log(`📊 Firebase Reads for siteName search: ${snapshot.docs.length}`);

          searchResults = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          if (searchResults.length === 0) {
            // Try searching by customerId
            searchQuery = query(
              customersRef,
              where('customerId', '>=', searchTerm.toUpperCase()),
              where('customerId', '<=', searchTerm.toUpperCase() + '\uf8ff'),
              limit(10)
            );

            snapshot = await getDocs(searchQuery);
            totalReadCount += snapshot.docs.length;
            console.log(`📊 Firebase Reads for customerId search: ${snapshot.docs.length}`);

            searchResults = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));

            if (searchResults.length === 0) {
              // If still no results, get all documents and filter in memory
              console.log('🔍 Performing full collection search');
              searchQuery = query(
                customersRef,
                limit(10) // Increase limit for full search
              );

              snapshot = await getDocs(searchQuery);
              totalReadCount += snapshot.docs.length;
              console.log(`📊 Firebase Reads for full search: ${snapshot.docs.length}`);

              searchResults = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              })).filter(customer => {
                const searchTermLower = searchTerm.toLowerCase();
                const addresses = customer.locations || [];
                
                return (
                  customer.customerName?.toLowerCase().includes(searchTermLower) ||
                  customer.customerId?.toLowerCase().includes(searchTermLower) ||
                  // Search in address fields
                  addresses.some(addr => 
                    addr.streetAddress1?.toLowerCase().includes(searchTermLower) ||
                    addr.streetAddress2?.toLowerCase().includes(searchTermLower) ||
                    addr.streetAddress3?.toLowerCase().includes(searchTermLower) ||
                    addr.city?.toLowerCase().includes(searchTermLower) ||
                    addr.country?.toLowerCase().includes(searchTermLower)
                  )
                );
              });
            }
          }
        }

        if (searchResults.length > 0) {
          lastDocument = snapshot.docs[snapshot.docs.length - 1];
          firstDocument = snapshot.docs[0];
        }
      } else {
        // Detailed filters
        console.log('🔍 Performing detailed filter search');
        let searchQuery = query(
          customersRef,
          limit(10)
        );

        const snapshot = await getDocs(searchQuery);
        totalReadCount += snapshot.docs.length;
        console.log(`📊 Firebase Reads for detailed search: ${totalReadCount}`);

        searchResults = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Apply filters in memory
        if (Object.values(searchFilters).some(filter => filter)) {
          searchResults = searchResults.filter(customer => {
            if (searchFilters.customerId && !customer.customerId?.toLowerCase().includes(searchFilters.customerId.toLowerCase())) return false;
            if (searchFilters.customerName && !customer.customerName?.toLowerCase().includes(searchFilters.customerName.toLowerCase())) return false;
            if (searchFilters.address && !(
              customer.streetAddress1?.toLowerCase().includes(searchFilters.address.toLowerCase()) ||
              customer.streetAddress2?.toLowerCase().includes(searchFilters.address.toLowerCase()) ||
              customer.streetAddress3?.toLowerCase().includes(searchFilters.address.toLowerCase())
            )) return false;
            if (searchFilters.city && !customer.city?.toLowerCase().includes(searchFilters.city.toLowerCase())) return false;
            if (searchFilters.country && !customer.country?.toLowerCase().includes(searchFilters.country.toLowerCase())) return false;
            return true;
          });
        }

        if (searchResults.length > 0) {
          lastDocument = snapshot.docs[snapshot.docs.length - 1];
          firstDocument = snapshot.docs[0];
        }
      }

      console.log(`✅ Search completed. Total reads: ${totalReadCount}`);

      // Only update state once at the end
      if (searchResults.length === 0) {
        console.log('❌ No results found');
        toast.error('No results found');
        // Reset the table
        setData([]);
        setTotalRows(0);
        setLastDoc(null);
        setFirstDoc(null);
      } else {
        // Batch update all state changes
        console.log(`📊 Updating table with ${searchResults.length} results`);
        setData(searchResults);
        setTotalRows(searchResults.length);
        setLastDoc(lastDocument);
        setFirstDoc(firstDocument);
      }

    } catch (error) {
      console.error('🚨 Search error:', error);
      toast.error('Failed to search customers');
      // Reset the table on error
      setData([]);
      setTotalRows(0);
      setLastDoc(null);
      setFirstDoc(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const customersRef = collection(db, 'customers');
        const initialQuery = query(
          customersRef,
          orderBy('customerId', 'asc'),
          //limit(10)
        );

        const snapshot = await getDocs(initialQuery);
        const customers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setData(customers);
        setTotalRows(customers.length);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setFirstDoc(snapshot.docs[0]);
        setInitialLoad(false);
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast.error('Failed to load customers');
      } finally {
        setLoading(false);
      }
    };

    if (initialLoad) {
      loadInitialData();
    }
  }, [initialLoad]);

  return (
    <Fragment>
      <GeeksSEO title="Customers | VITAR Group" />
      <Row>
        <Col lg={12} md={12} sm={12}>
            <ContentHeader
            title="Customers List"
            description="Manage and track all your customers in one centralized dashboard"
            infoText="Track customer details, addresses, and customer-specific information"
            badgeText="Customer Management"
            badgeText2="Customers"
            breadcrumbItems={[
              {
                icon: <House className="me-2" size={14} />,
                text: 'Dashboard',
                link: '/dashboard'
              },
              {
                icon: <Building className="me-2" size={14} />,
                text: 'Customers'
              }
            ]}
            actionButtons={[
              {
                text: "Create New Customer",
                icon: <FaPlus size={14} />,
                variant: "light",
                tooltip: "Add a new customer",
                onClick: () => router.push('/dashboard/customers/create')
              }
            ]}
          />
        </Col>
      </Row>
      <Row>
        
        <Col md={12} xs={12} className="mb-5">
        <FilterPanel 
                filters={filters}
                setFilters={setFilters}
                onClear={handleClearFilters}
                loading={loading}
                handleSearch={handleSearch}
                setData={setData}
                setTotalRows={setTotalRows}
                initialData={initialData}
              />
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              {error && <div className="alert alert-danger mb-4">{error}</div>}
              
              
              <div className="d-flex justify-content-between align-items-center mb-3">
                <EntriesPerPage />
                <PaginationInfo />
              </div>

              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <th 
                            key={header.id}
                            style={{
                              width: header.getSize(),
                              cursor: header.column.getCanSort() ? 'pointer' : 'default',
                            }}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={columns.length} className="text-center py-5">
                          <div className="d-flex flex-column align-items-center">
                            <Spinner 
                              animation="border" 
                              variant="primary" 
                              className="mb-2"
                              style={{ width: '2rem', height: '2rem' }}
                            />
                            <div className="text-muted">
                              {filters.quickSearch ? 'Searching customers...' : 'Loading customers...'}
                            </div>
                            <small className="text-muted mt-1">Please wait a moment</small>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <>
                        {table.getRowModel().rows.map(row => (
                          <TableRow key={`row_${row.original.customerId}`} row={row} />
                        ))}
                        {data.length === 0 && (
                          <tr>
                            <td colSpan={columns.length} className="text-center py-4">
                              <div className="text-muted">
                                <div className="mb-2">No customers found</div>
                                <small>Try adjusting your search criteria</small>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="d-flex justify-content-end mt-3">
                <PaginationInfo />
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                  >
                    <ChevronLeft size={14} className="me-1" />
                    Previous
                  </Button>
                  <div className="d-flex align-items-center gap-1">
                    {pageNumbers.map((page, index) => (
                      page === '...' ? (
                        <span key={`dot-${index}`} className="px-2 text-muted">...</span>
                      ) : (
                        <Button
                          key={page}
                          variant={currentPage === page ? "primary" : "outline-primary"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          disabled={loading}
                          style={{ minWidth: '32px' }}
                        >
                          {page}
                        </Button>
                      )
                    ))}
                  </div>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === Math.ceil(filteredData.length / perPage) || loading}
                  >
                    Next
                    <ChevronRight size={14} className="ms-1" />
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <div className="Toaster">
        
      </div>
      <style jsx global>{`
     
      /* Create Button Style */
      .create-customer-button {
        background-color: #ffffff;
        color: #4171F5;
        transition: all 0.2s ease;
      }

      .create-customer-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
      }

      .create-customer-button:active {
        transform: translateY(0);
      }

      /* Card Animations */
      .card {
        transition: all 0.2s ease;
      }

      .card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }

      /* Table Row Hover Effects */
      .table-row-hover:hover {
        background-color: #f1f5f9;
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      /* Tooltip Styles */
      .tooltip-inner {
        max-width: 300px;
        padding: 8px 12px;
        background-color: #1e293b;
        border-radius: 6px;
        font-size: 12px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }

      .tooltip.show {
        opacity: 1;
      }

      /* Navigation Button Styles */
      .prev-btn,
      .next-btn {
        transition: all 0.2s ease;
      }

      .prev-btn:hover,
      .next-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .prev-btn:active,
      .next-btn:active {
        transform: translateY(0);
      }

      /* Button wrapper styles */
      .button-wrapper {
        position: relative;
        transition: all 0.3s ease;
      }

      .button-wrapper.disabled {
        cursor: not-allowed;
      }

      .button-wrapper.disabled::before {
        content: "?";
        position: absolute;
        right: -20px;
        top: 50%;
        transform: translateY(-50%);
        width: 16px;
        height: 16px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        opacity: 0;
        transition: all 0.3s ease;
      }

      .button-wrapper.disabled:hover::before {
        opacity: 1;
        right: -24px;
      }

      .button-wrapper.disabled .custom-button {
        opacity: 0.7;
        transform: scale(0.99);
        box-shadow: none;
      }

      .custom-button {
        transition: all 0.3s ease !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
      }

      .custom-button:not(:disabled):hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1) !important;
      }

      .custom-tooltip {
        opacity: 0;
        transition: all 0.3s ease !important;
      }

      .custom-tooltip.show {
        opacity: 1 !important;
      }
    `}</style>
    </Fragment>
  )
}

export default ViewCustomers

// Helper function to format SAP address
const formatSAPAddress = (address) => {
    if (!address) return '-';
    
    // Format according to SAP B1 address display format
    let formattedAddress = '';
    
    // Building/Floor/Room + Address Name 2 (if exists)
    if (address.BuildingFloorRoom) {
      formattedAddress = address.BuildingFloorRoom;
      if (address.AddressName2) {
        formattedAddress += ` ${address.AddressName2}`;
      }
    }
    
    // Add Street and other components
    const additionalParts = [
      address.Street && `${address.Street}`,
      address.ZipCode,
      address.Country === 'SG' ? 'Singapore' : 
      address.Country === 'GB' ? 'United Kingdom' : 
      address.Country === 'US' ? 'United States' : 
      address.Country
    ].filter(Boolean);
    
    if (additionalParts.length > 0) {
      formattedAddress += formattedAddress ? `, ${additionalParts.join(', ')}` : additionalParts.join(', ');
    }
    
    return formattedAddress;
  };
  

// Country flag component
const CountryFlag = ({ country }) => {
  switch (country) {
    case 'SG':
      return <SGFlag />;
    case 'GB':
      return <GBFlag />;
    case 'US':
      return <USFlag />;
    default:
      return null;
  }
};

// Add this utility function at the top with your other utility functions
const copyAddressToClipboard = (address, e) => {
  e.stopPropagation(); // Prevent cell collapse
  
  // Format address for copying
  const formattedAddress = [
    address.AddressName,
    address.BuildingFloorRoom && address.BuildingFloorRoom !== address.AddressName ? address.BuildingFloorRoom : null,
    address.Street,
    address.ZipCode,
    address.Country === 'SG' ? 'Singapore' : address.Country
  ].filter(Boolean).join(', ');

  navigator.clipboard.writeText(formattedAddress).then(() => {
    // You could use a toast notification here instead of alert
    alert('Address copied to clipboard!');
  }).catch(err => {
    console.error('Failed to copy address: ', err);
    alert('Failed to copy address');
  });
};

// Add a new validation function
const validateEmailSearch = (email) => {
  if (!email) return true; // Empty is valid
  
  // Basic email format check
  const emailRegex = /^[a-zA-Z0-9.]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// Add these toast style constants at the top of your file
const TOAST_STYLES = {
  BASE: {
    background: '#fff',
    padding: '16px',
    borderRadius: '4px',
    maxWidth: '400px'
  },
  SUCCESS: {
    color: '#28a745',
    borderLeft: '6px solid #28a745'
  },
  WARNING: {
    color: '#856404',
    borderLeft: '6px solid #ffc107'
  },
  ERROR: {
    color: '#1e40a6',
    borderLeft: '6px solid #1e40a6'
  },
  LOADING: {
    color: '#0d6efd',
    borderLeft: '6px solid #0d6efd'
  }
};