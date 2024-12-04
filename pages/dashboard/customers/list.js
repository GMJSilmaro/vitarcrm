'use client'

import React, { Fragment, useMemo, useState, useEffect, useCallback, useRef } from 'react';
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
  Edit,
  Trash,
  Download
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
import { db } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { customerDataFetchers } from '@/utils/customers/dataFetchers';
import { customerCacheHelpers, CUSTOMER_CACHE_KEYS } from '@/utils/customers/cacheHelpers';

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

const FilterPanel = ({ filters, setFilters, onClear, loading, loadData }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tempFilters, setTempFilters] = useState(filters);

  useEffect(() => {
    // Sync tempFilters with filters whenever filters change
    setTempFilters(filters);
  }, [filters]);

  const handleFilterChange = (field, value) => {
    setTempFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleSearch = async () => {
    try {
      if (tempFilters.email && !validateEmailSearch(tempFilters.email)) {
        toast.error('Please enter a valid email address');
        return;
      }
      
      // Apply filters temporarily
      setFilters(tempFilters);
      
      // Load data and check results
      const customersList = await customerDataFetchers.fetchCustomers();
      const filteredCustomers = customersList.filter(customer => {
        const matchesCode = !tempFilters.customerCode || 
          customer.customerId?.toLowerCase().includes(tempFilters.customerCode.toLowerCase());
        
        const matchesName = !tempFilters.customerName || 
          customer.customerName?.toLowerCase().includes(tempFilters.customerName.toLowerCase());
        
        const matchesEmail = !tempFilters.email || 
          customer.customerContact?.email?.toLowerCase().includes(tempFilters.email.toLowerCase());
        
        const matchesPhone = !tempFilters.phone || 
          customer.customerContact?.phone?.includes(tempFilters.phone);
        
        return matchesCode && matchesName && matchesEmail && matchesPhone;
      });

      // If no results found, revert to previous filters
      if (filteredCustomers.length === 0) {
        toast.error('No results found. Reverting to previous search.');
        setFilters(filters); // Revert to previous filters
        setTempFilters(filters); // Also reset temp filters
        await loadData(); // Reload with previous filters
        return;
      }

      // If results found, keep the new filters and update data
      await loadData();
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search customers');
      // Revert filters on error
      setTempFilters(filters);
    }
  };

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
                    value={tempFilters.customerName}
                    onChange={(e) => handleFilterChange('customerName', e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Quick search by customer name..."
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
              onClick={handleSearch}
              disabled={loading}
              className="search-btn d-flex align-items-center"
            >
              <Search size={14} className="me-1" />
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
          <Row>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1" style={{ fontSize: '0.9rem' }}>Customer Code:</Form.Label>
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Enter numbers only (e.g. 0001)</Tooltip>}
                >
                  <Form.Control
                    size="sm"
                    type="text"
                    value={tempFilters.customerCode}
                    onChange={(e) => handleFilterChange('customerCode', e.target.value)}
                    placeholder="Enter customer code..."
                    style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                    onKeyPress={handleKeyPress}
                  />
                </OverlayTrigger>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1" style={{ fontSize: '0.9rem' }}>Customer Name:</Form.Label>
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Enter full or partial customer name</Tooltip>}
                >
                  <Form.Control
                    size="sm"
                    type="text"
                    value={tempFilters.customerName}
                    onChange={(e) => handleFilterChange('customerName', e.target.value)}
                    placeholder="Search by customer name..."
                    style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                    onKeyPress={handleKeyPress}
                  />
                </OverlayTrigger>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1" style={{ fontSize: '0.9rem' }}>Email:</Form.Label>
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Enter full email address (e.g., example@domain.com)</Tooltip>}
                >
                  <Form.Control
                    size="sm"
                    type="email"
                    value={tempFilters.email}
                    onChange={(e) => handleFilterChange('email', e.target.value)}
                    placeholder="Enter email address..."
                    style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        if (!validateEmailSearch(tempFilters.email)) {
                          alert('Please enter a valid email address (e.g., example@domain.com)');
                          return;
                        }
                        handleKeyPress(e);
                      }
                    }}
                  />
                </OverlayTrigger>
                {tempFilters.email && !validateEmailSearch(tempFilters.email) && (
                  <small className="text-danger d-block mt-1">
                    Please enter a valid email address
                  </small>
                )}
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1" style={{ fontSize: '0.9rem' }}>Phone:</Form.Label>
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Enter numbers only (e.g. +65 1234 5678)</Tooltip>}
                >
                  <Form.Control
                    size="sm"
                    type="text"
                    value={tempFilters.phone}
                    onChange={(e) => handleFilterChange('phone', e.target.value)}
                    placeholder="Enter phone number..."
                    style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                    onKeyPress={handleKeyPress}
                  />
                </OverlayTrigger>
              </Form.Group>
             
            </Col>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1" style={{ fontSize: '0.9rem' }}>Address Search:</Form.Label>
                <OverlayTrigger
                  placement="top"
                  overlay={
                    <Tooltip>
                      Search in primary and mailing addresses, including postal codes
                    </Tooltip>
                  }
                >
                  <Form.Control
                    size="sm"
                    type="text"
                    value={tempFilters.address}
                    onChange={(e) => handleFilterChange('address', e.target.value)}
                    placeholder="Search in addresses..."
                    style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                    onKeyPress={handleKeyPress}
                  />
                </OverlayTrigger>
                {tempFilters.address && (
                  <small className="text-muted d-block mt-1">
                    Searching in both primary and mailing addresses
                  </small>
                )}
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1" style={{ fontSize: '0.9rem' }}>Contract Status:</Form.Label>
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Filter customers by their contract status</Tooltip>}
                >
                  <Form.Select
                    size="sm"
                    value={tempFilters.contractStatus}
                    onChange={(e) => handleFilterChange('contractStatus', e.target.value)}
                    style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                    onKeyPress={handleKeyPress}
                  >
                    <option value="">All Contract Status</option>
                    <option value="Y">With Contract</option>
                    <option value="N">No Contract</option>
                  </Form.Select>
                </OverlayTrigger>
              </Form.Group>
              <Row className="align-items-end">
                <Col md={6}>
                  <Form.Group className="mb-2">
                    <Form.Label className="small mb-1" style={{ fontSize: '0.9rem' }}>Country:</Form.Label>
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip>Select customer's country</Tooltip>}
                    >
                      <Form.Select
                        size="sm"
                        value={tempFilters.country}
                        onChange={(e) => handleFilterChange('country', e.target.value)}
                        style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                        onKeyPress={handleKeyPress}
                      >
                        <option value="">All Countries</option>
                        <option value="SG">Singapore</option>
                      </Form.Select>
                    </OverlayTrigger>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-2">
                    <Form.Label className="small mb-1" style={{ fontSize: '0.9rem' }}>Status:</Form.Label>
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip>Filter by customer account status</Tooltip>}
                    >
                      <Form.Select
                        size="sm"
                        value={tempFilters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                        onKeyPress={handleKeyPress}
                      >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </Form.Select>
                    </OverlayTrigger>
                  </Form.Group>
                </Col>
              </Row>
            </Col>
          </Row>
        </div>
      </Card.Body>

    </Card>
  );
};

// Modify the ViewCustomers component to use mock data
const ViewCustomers = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  const [perPage, setPerPage] = useState(TABLE_CONFIG.PAGE_SIZES.DEFAULT);
  const [initialLoad, setInitialLoad] = useState(true);
  const [filters, setFilters] = useState({
    customerCode: '',
    customerName: '',
    email: '',
    phone: '',
    contractStatus: '',
    country: '',
    status: '',
    address: '' 
  });



  const columnHelper = createColumnHelper()

  const columns = [
    columnHelper.accessor((row, index) => ((currentPage - 1) * perPage) + index + 1, {
      id: 'index',
      header: '#',
      size: 50,
    }),
    columnHelper.accessor('CardCode', {
      header: 'Code',
      size: 100,
      cell: info => (
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip>Click to copy customer code</Tooltip>}
        >
          <div 
            style={{fontWeight: 'bold', cursor: 'pointer'}} 
            onClick={() => {
              navigator.clipboard.writeText(info.row.original.CardCode);
              toast.success('Customer code copied!');
            }}
          >
            {info.row.original.CardCode}
          </div>
        </OverlayTrigger>
      )
    }),
    columnHelper.accessor('CardName', {
      header: 'Customer',
      size: 200,
      cell: info => {
        const customer = info.row.original;
       // console.log('Rendering customer:', customer); // Debug log
        return (
          <div className="d-flex align-items-center">
            <Building className="me-2 text-primary" size={14} />
            <span className="fw-bold">
              {customer.customerName || customer.CardName || 'No Name Available'}
            </span>
          </div>
        );
      }
    }),

    columnHelper.accessor('addresses', {
      header: 'Address Information',
      size: 300,
      cell: info => {
        const customer = info.row.original;
        const locations = customer.addresses || [];
        const defaultLocation = locations.find(loc => loc.isDefault) || locations[0];

        return (
          <div>
            {defaultLocation ? (
              <>
                {/* Site Name with Icon */}
                <div className="mb-2">
                  <div className="d-flex align-items-center">
                    <Building className="me-2 text-primary" size={14} />
                    <span className="fw-bold text-primary">
                      {defaultLocation.name || customer.CardName}
                    </span>
                  </div>
                </div>

                {/* Location Address */}
                <div className="text-muted small">
                  <div className="d-flex align-items-start">
                    <GeoAltFill className="me-2 mt-1 text-muted" size={12} />
                    <div>
                      {defaultLocation.street}
                    </div>
                  </div>
                </div>

                {/* Location Count */}
                <div className="d-flex align-items-center mt-1">
                  <Badge bg="light" text="dark" className="d-flex align-items-center">
                    <GeoAltFill className="me-1" size={10} />
                    {locations.length} Location{locations.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </>
            ) : (
              // No Address Indicator
              <div className="d-flex flex-column align-items-center py-2">
                <GeoAltFill className="text-muted mb-2" size={16} />
                <div className="text-muted small">
                  No Address Available
                </div>
                <Badge 
                  bg="warning" 
                  text="dark" 
                  className="mt-1"
                  style={{ fontSize: '0.7rem' }}
                >
                  Address Required | No Location Found
                </Badge>
              </div>
            )}
          </div>
        );
      }
    }),
    
    columnHelper.accessor('Phone1', {
      header: 'Phone',
      size: 100,
      cell: info => (
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip id={`tooltip-phone-${info.getValue()}`}>Click to call</Tooltip>}
        >
          <a href={`tel:${info.getValue()}`} className="text-decoration-none">
            <TelephoneFill className="me-2" />
            {info.getValue()}
          </a>
        </OverlayTrigger>
      )
    }),
    columnHelper.accessor('EmailAddress', {
      header: 'Email',
      size: 200,
      cell: info => (
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip id={`tooltip-email-${info.getValue()}`}>Click to send email</Tooltip>}
        >
          <a href={`mailto:${info.getValue()}`} className="text-decoration-none">
            <EnvelopeFill className="me-2" />
            {info.getValue()}
          </a>
        </OverlayTrigger>
      )
    }),
    columnHelper.accessor('U_ContractEndDate', {
      header: 'Contract Duration',
      size: 180,
      cell: info => {
        if (info.row.original.U_Contract !== 'Y' || !info.row.original.U_ContractStartDate || !info.row.original.U_ContractEndDate) {
          return '-';
        }
        const startDate = moment(info.row.original.U_ContractStartDate);
        const endDate = moment(info.row.original.U_ContractEndDate);
        const now = moment();
        const duration = moment.duration(endDate.diff(now));
        const months = Math.floor(duration.asMonths());
        const days = Math.floor(duration.asDays() % 30);
        const hours = Math.floor(duration.asHours() % 24);
        const minutes = Math.floor(duration.asMinutes() % 60);
        
        let durationText = '';
        if (months > 0) {
          durationText = `${months} month${months > 1 ? 's' : ''} left`;
        } else if (days > 0) {
          durationText = `${days} day${days > 1 ? 's' : ''} left`;
        } else if (hours > 0) {
          durationText = `${hours} hour${hours > 1 ? 's' : ''} left`;
        } else {
          durationText = `${minutes} minute${minutes > 1 ? 's' : ''} left`;
        }
        
        return (
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip id={`tooltip-duration-${info.getValue()}`}>
              Start: {startDate.format('DD/MM/YYYY')}
              <br />
              End: {endDate.format('DD/MM/YYYY')}
            </Tooltip>}
          >
            <span>
              <CalendarRange className="me-2" />
              {durationText}
            </span>
          </OverlayTrigger>
        );
      }
    }),
    columnHelper.accessor('U_Contract', {
      header: 'Contract',
      size: 130,
      cell: info => (
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip id={`tooltip-contract-${info.getValue()}`}>
            {info.getValue() === 'Y' ? 'This customer has a contract with us' : 'This customer does not have a contract with us'}
          </Tooltip>}
        >
          <div>
            <CurrencyExchange className="me-2 text-primary" size={14} />
            <Badge 
              bg={info.getValue() === 'Y' ? 'primary' : 'secondary'}
              style={{ 
                padding: '6px 12px',
                borderRadius: '6px',
                fontWeight: '500',
                fontSize: '14px'
              }}
            >
              {info.getValue() === 'Y' ? 'Yes' : 'No'}
            </Badge>
          </div>
        </OverlayTrigger>
      )
    }),

    columnHelper.accessor(() => null, {
      id: 'actions',
      header: 'Actions',
      size: 130,
      cell: info => (
        <div className="d-flex gap-2">
          <OverlayTrigger
            placement="left"
            overlay={
              <Tooltip>
                <div className="d-flex flex-column align-items-center">
                  <span className="mb-1">🚧 Feature Coming Soon</span>
                  <small className="text-muted">
                    View details functionality is currently unavailable
                  </small>
                </div>
              </Tooltip>
            }
          >
            <div className="d-inline-block"> {/* Wrapper div to handle disabled state */}
              <button
                disabled
                className="btn btn-primary btn-icon-text btn-sm"
                style={{ 
                  textDecoration: "none", 
                  cursor: "not-allowed",
                  opacity: 0.7 
                }}
              >
                <Eye size={14} className="icon-left" />
                View
              </button>
            </div>
          </OverlayTrigger>
        </div>
      )
    }),
  ]

    // Add at the top of your component
    useEffect(() => {
      // Setup real-time listeners when component mounts
      customerDataFetchers.setupRealtimeListeners();
      
      // Cleanup listeners when component unmounts
      return () => {
        customerDataFetchers.cleanupListeners();
      };
    }, []);
  
    // Add new state for search loading
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    

  const filteredData = useMemo(() => {
    return data.filter(customer => {
      // Customer Code filter
      const matchesCode = !filters.customerCode || 
        customer.CardCode?.toLowerCase().includes(filters.customerCode.toLowerCase());

      // Customer Name filter
      const matchesName = !filters.customerName || 
        customer.CardName?.toLowerCase().includes(filters.customerName.toLowerCase());

      // Email filter
      const matchesEmail = !filters.email || 
        customer.EmailAddress?.toLowerCase().includes(filters.email.toLowerCase());

      // Phone filter
      const matchesPhone = !filters.phone || 
        customer.Phone1?.includes(filters.phone);

      // Contract Status filter
      const matchesContract = !filters.contractStatus || 
        customer.U_Contract === filters.contractStatus;

      // Country filter (assuming it's in the addresses)
      const matchesCountry = !filters.country || 
        customer.addresses?.some(addr => addr.country === filters.country);

      // Status filter
      const matchesStatus = !filters.status || 
        customer.status === filters.status;

      // Address search
      const matchesAddress = !filters.address || 
        customer.addresses?.some(addr => 
          addr.street?.toLowerCase().includes(filters.address.toLowerCase()) ||
          addr.name?.toLowerCase().includes(filters.address.toLowerCase())
        );

      return matchesCode && matchesName && matchesEmail && matchesPhone && 
             matchesContract && matchesCountry && matchesStatus && matchesAddress;
    });
  }, [data, filters]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const customersList = await customerDataFetchers.fetchCustomers();
      
      // Apply filters only if they exist
      const filteredCustomers = customersList.filter(customer => {
        if (!filters.customerCode && 
            !filters.customerName && 
            !filters.email && 
            !filters.phone) {
          return true; // Show all data if no filters
        }

        const matchesCode = !filters.customerCode || 
          customer.customerId?.toLowerCase().includes(filters.customerCode.toLowerCase());
        
        const matchesName = !filters.customerName || 
          customer.customerName?.toLowerCase().includes(filters.customerName.toLowerCase());
        
        const matchesEmail = !filters.email || 
          customer.customerContact?.email?.toLowerCase().includes(filters.email.toLowerCase());
        
        const matchesPhone = !filters.phone || 
          customer.customerContact?.phone?.includes(filters.phone);
        
        return matchesCode && matchesName && matchesEmail && matchesPhone;
      });

      const mappedCustomers = filteredCustomers.map(customer => ({
        CardCode: customer.customerId || '',
        CardName: customer.customerName || '',
        customerName: customer.customerName || '',
        Phone1: customer.customerContact?.phoneNumber || customer.customerContact?.mobileNumber || '-',
        EmailAddress: customer.customerContact?.email || '-',
        U_Contract: customer.contract?.status === 'active' ? 'Y' : 'N',
        U_ContractStartDate: customer.contract?.startDate,
        U_ContractEndDate: customer.contract?.endDate,
        addresses: customer.locations?.map(location => ({
          type: 'billing',
          name: location.siteName,
          street: location.mainAddress,
          isDefault: location.isDefault,
          siteId: location.siteId
        })) || []
      }));

      setData(mappedCustomers);
      setTotalRows(mappedCustomers.length);
    } catch (error) {
      console.error('Error loading customers:', error);
      setError('Failed to load customers');
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Update the table configuration
  const table = useReactTable({
    data: filteredData,  // Use all filtered data
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(), // Add this
    state: {
      pagination: {
        pageIndex: currentPage - 1,
        pageSize: perPage  // Use perPage instead of hardcoded 10
      }
    },
    onPaginationChange: setPagination => {
      const newPagination = setPagination(table.getState().pagination);
      setCurrentPage(newPagination.pageIndex + 1);
      setPerPage(newPagination.pageSize);
    },
    manualPagination: false,  // Set to false to let the table handle pagination
    pageCount: Math.ceil(filteredData.length / perPage),
  });

  const handleViewDetails = (customer) => {
    console.log('Viewing customer:', customer); // Debug log
    localStorage.setItem('viewCustomerToast', customer.CardName);
    router.push(`/customers/view/${customer.CardCode}`);
  };

  const handleClearFilters = useCallback(() => {
    if (loading) return;
    
    setLoading(true);
    
    // Clear all filters in one go
    const clearedFilters = {
      customerCode: '',
      customerName: '',
      email: '',
      phone: '',
      contractStatus: '',
      country: '',
      status: '',
      address: ''
    };

    // Reset everything first
    setFilters(clearedFilters);
    setCurrentPage(1);
    
    // Then load fresh data
    customerDataFetchers.fetchCustomers()
      .then(customersList => {
        const mappedCustomers = customersList.map(customer => ({
          CardCode: customer.customerId || '',
          CardName: customer.customerName || '',
          customerName: customer.customerName || '',
          Phone1: customer.customerContact?.phoneNumber || customer.customerContact?.mobileNumber || '-',
          EmailAddress: customer.customerContact?.email || '-',
          U_Contract: customer.contract?.status === 'active' ? 'Y' : 'N',
          U_ContractStartDate: customer.contract?.startDate,
          U_ContractEndDate: customer.contract?.endDate,
          addresses: customer.locations?.map(location => ({
            type: 'billing',
            name: location.siteName,
            street: location.mainAddress,
            isDefault: location.isDefault,
            siteId: location.siteId
          })) || []
        }));

        setData(mappedCustomers);
        setTotalRows(mappedCustomers.length);
        toast.success('Filters cleared successfully');
      })
      .catch(error => {
        console.error('Error clearing filters:', error);
        toast.error('Failed to clear filters');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [setCurrentPage, setData, setFilters, setLoading, setTotalRows, loading]);

  // Add useEffect to load data on component mount
  useEffect(() => {
    // Clear the cache when component mounts
    customerCacheHelpers.clear(CUSTOMER_CACHE_KEYS.LIST);
    customerCacheHelpers.clear(CUSTOMER_CACHE_KEYS.PROCESSED_CUSTOMERS);
    loadData();
  }, []);

  // Add quick actions menu
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
        <Edit size={14} className="me-2" />
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
  const handleSearch = async (e) => {
    if (e.key === 'Enter') {
      setSearchLoading(true);
      try {
        const customersList = await customerDataFetchers.fetchCustomers();
        const filteredCustomers = customersList.filter(customer => {
          const searchLower = searchTerm.toLowerCase();
          return (
            (customer.customerId || '').toLowerCase().includes(searchLower) ||
            (customer.customerName || '').toLowerCase().includes(searchLower)
          );
        });

        setData(filteredCustomers);
        setTotalRows(filteredCustomers.length);
      } catch (error) {
        console.error('Search error:', error);
        toast.error('Failed to search customers');
      } finally {

        setSearchLoading(false);
      }
    }
  };

  // Update the search input in your JSX
  <div className="d-flex align-items-center">
    <div className="position-relative">
      <input
        type="text"
        className="form-control"
        placeholder="Search customers..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyPress={handleSearch}
      />
      {searchLoading && (
        <div className="position-absolute top-50 end-0 translate-middle-y me-2">
          <Spinner
            animation="border"
            size="sm"
            role="status"
            aria-hidden="true"
          />
        </div>
      )}
    </div>
    <Button 
      variant="primary" 
      className="ms-2"
      onClick={() => handleSearch({ key: 'Enter' })}
      disabled={searchLoading}
    >
      {searchLoading ? (
        <Spinner
          as="span"
          animation="border"
          size="sm"
          role="status"
          aria-hidden="true"
        />
      ) : (
        <Search size={18} />
      )}
    </Button>
  </div>

  // Update the table body rendering to use pagination
  {table.getRowModel().rows.map(row => (
    <tr key={row.id}>
      {row.getVisibleCells().map(cell => (
        <td key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  ))}

  // Update the pagination info display
  const PaginationInfo = () => {
    const { pageSize, pageIndex } = table.getState().pagination;
    const start = pageIndex * pageSize + 1;
    const end = Math.min((pageIndex + 1) * pageSize, filteredData.length);
    
    return (
      <div className="text-muted small">
        Showing {start} to {end} of {filteredData.length} entries
      </div>
    );
  };

  // Update handlePerRowsChange
  const handlePerRowsChange = useCallback((newPerPage) => {
    table.setPageSize(newPerPage);
  }, [table]);

  return (
    <Fragment>
      <GeeksSEO title="Customers | VITAR Group" />
      <Row>
        <Col lg={12} md={12} sm={12}>
            <ContentHeader
            title="Customers List"
            description="Comprehensive view of all your customer accounts, including contact details, service history, and account status"
            infoText="Easily search, filter, and manage customer profiles. Access key information like contact details, billing addresses, and account representatives. Track customer status and maintain accurate records for all your business relationships."
            badgeText="Customer Management"
            breadcrumbItems={[
              { 
                icon: <House className="me-2" size={14} />, 
                text: 'Dashboard', 
                link: '/dashboard' 
              },
              { 
                icon: <People className="me-2" size={14} />, 
                text: 'Customers' 
              }
            ]}
            actionButton={{
              icon: <FaPlus size={14} />,
              text: "Create New Customer",
              tooltip: "Start creating a new customer masterlist",
              variant: "light",
              onClick: () => router.push('/dashboard/customers/create')
            }}

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
                loadData={loadData}
              />
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              {error && <div className="alert alert-danger mb-4">{error}</div>}
              
              
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center">
                  <span className="text-muted me-2">Show:</span>
                  <div className="position-relative" style={{ width: '90px' }}>
                    <Form.Select
                      size="sm"
                      value={perPage}
                      onChange={(e) => handlePerRowsChange(Number(e.target.value))}
                      className="me-2"
                      disabled={loading}
                    >
                      {TABLE_CONFIG.PAGE_SIZES.OPTIONS.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </Form.Select>
                  </div>
                  <span className="text-muted">entries per page</span>
                </div>
                <div className="text-muted">
                  <ListUl size={14} className="me-2" />
                  {loading ? (
                    <small>Loading...</small>
                  ) : (
                    <PaginationInfo />
                  )}
                </div>
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
                              {filters.customerName || filters.customerCode || filters.email || filters.phone ? (
                                'Searching customers...'
                              ) : (
                                'Loading all customers...'
                              )}
                            </div>
                            <small className="text-muted mt-1">
                              Please wait a moment
                            </small>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <>
                        {table.getRowModel().rows.map(row => (
                          <tr key={row.id}>
                            {row.getVisibleCells().map(cell => (
                              <td key={cell.id}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </td>
                            ))}
                          </tr>
                        ))}
                        {filteredData.length === 0 && (
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
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="d-flex align-items-center gap-1">
                    {getPageNumbers(currentPage, Math.ceil(filteredData.length / 10)).map((page, index) => (
                      page === '...' ? (
                        <span key={`dot-${index}`} className="px-2 text-muted">...</span>
                      ) : (
                        <Button
                          key={page}
                          variant={currentPage === page ? "primary" : "outline-primary"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
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
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredData.length / 10), prev + 1))}
                    disabled={currentPage === Math.ceil(filteredData.length / 10)}
                  >
                    Next
                    <FeatherChevronRight size={14} className="ms-1" />
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
    color: '#dc3545',
    borderLeft: '6px solid #dc3545'
  },
  LOADING: {
    color: '#0d6efd',
    borderLeft: '6px solid #0d6efd'
  }
};
