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
import { collection, getDocs, query, where, orderBy, limit, startAfter } from 'firebase/firestore';

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

const FilterPanel = ({ filters, setFilters, onClear, loading, handleSearch, setData, setTotalRows, initialData }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tempFilters, setTempFilters] = useState(filters);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef(null);

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
      handleSearchSubmit();
    }
  };

  const handleSearchSubmit = async () => {
    try {
      if (tempFilters.email && !validateEmailSearch(tempFilters.email)) {
        toast.error('Please enter a valid email address');
        return;
      }
      
      await handleSearch(tempFilters);

    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search customers');
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
              onClick={handleSearchSubmit}
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
  const [lastDoc, setLastDoc] = useState(null);
  const [firstDoc, setFirstDoc] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [initialData, setInitialData] = useState([]);

  const columnHelper = createColumnHelper()

  const columns = [
    columnHelper.accessor((row, index) => ((currentPage - 1) * perPage) + index + 1, {
      id: 'index',
      header: '#',
      size: 50,
    }),
    columnHelper.accessor('customerId', {
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
              navigator.clipboard.writeText(info.getValue());
              toast.success('Customer code copied!');
            }}
          >
            {info.getValue() || '-'}
          </div>
        </OverlayTrigger>
      )
    }),
    columnHelper.accessor('customerName', {
      header: 'Customer',
      size: 200,
      cell: info => (
        <div className="d-flex align-items-center">
          <Building className="me-2 text-primary" size={14} />
          <span className="fw-bold">
            {info.getValue() || 'No Name Available'}
          </span>
        </div>
      )
    }),
    columnHelper.accessor('locations', {
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
    }),
    columnHelper.accessor('customerContact', {
      header: 'Phone',
      size: 150,
      cell: info => {
        const contact = info.getValue();
        const phone = contact?.phoneNumber || contact?.mobileNumber;
        return phone ? (
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Click to call</Tooltip>}
          >
            <a href={`tel:${phone}`} className="text-decoration-none d-flex align-items-center">
              <TelephoneFill className="me-2 text-primary" size={14} />
              {phone}
            </a>
          </OverlayTrigger>
        ) : (
          <span className="text-muted">-</span>
        );
      }
    }),
    columnHelper.accessor('customerContact.email', {
      header: 'Email',
      size: 200,
      cell: info => {
        const email = info.getValue();
        return email ? (
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Click to send email</Tooltip>}
          >
            <a href={`mailto:${email}`} className="text-decoration-none d-flex align-items-center">
              <EnvelopeFill className="me-2 text-primary" size={14} />
              {email}
            </a>
          </OverlayTrigger>
        ) : (
          <span className="text-muted">-</span>
        );
      }
    }),
    columnHelper.accessor('contract', {
      header: 'Contract Duration',
      size: 180,
      cell: info => {
        const contract = info.getValue();
        if (!contract || contract.status !== 'active' || !contract.startDate || !contract.endDate) {
          return '-';
        }

        const startDate = moment(contract.startDate.toDate());
        const endDate = moment(contract.endDate.toDate());
        const now = moment();
        const duration = moment.duration(endDate.diff(now));
        
        let durationText = '';
        if (duration.asMonths() >= 1) {
          durationText = `${Math.floor(duration.asMonths())} month${Math.floor(duration.asMonths()) !== 1 ? 's' : ''} left`;
        } else if (duration.asDays() >= 1) {
          durationText = `${Math.floor(duration.asDays())} day${Math.floor(duration.asDays()) !== 1 ? 's' : ''} left`;
        } else {
          durationText = `${Math.floor(duration.asHours())} hour${Math.floor(duration.asHours()) !== 1 ? 's' : ''} left`;
        }

        return (
          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip>
                Start: {startDate.format('DD/MM/YYYY')}<br/>
                End: {endDate.format('DD/MM/YYYY')}
              </Tooltip>
            }
          >
            <div className="d-flex align-items-center">
              <CalendarRange className="me-2 text-primary" size={14} />
              {durationText}
            </div>
          </OverlayTrigger>
        );
      }
    }),
    
  ];

    // Add new state for search loading
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    

  const filteredData = useMemo(() => {
    return data.filter(customer => {
      // Customer Code filter
      const matchesCode = !filters.customerCode || 
        customer.customerId?.toLowerCase().includes(filters.customerCode.toLowerCase());

      // Customer Name filter
      const matchesName = !filters.customerName || 
        customer.customerName?.toLowerCase().includes('%' + filters.customerName.toLowerCase() + '%');

      // Email filter
      const matchesEmail = !filters.email || 
        (customer.customerContact?.email || '').toLowerCase().includes(filters.email.toLowerCase());

      // Phone filter
      const matchesPhone = !filters.phone || 
        (customer.customerContact?.phoneNumber || '').includes(filters.phone) ||
        (customer.customerContact?.mobileNumber || '').includes(filters.phone);

      // Contract Status filter
      const matchesContract = !filters.contractStatus || 
        customer.contract?.status === filters.contractStatus;

      // Country filter (assuming it's in the addresses)
      const matchesCountry = !filters.country || 
        customer.locations?.some(loc => loc.country === filters.country);

      // Status filter
      const matchesStatus = !filters.status || 
        customer.status === filters.status;

      // Address search
      const matchesAddress = !filters.address || 
        customer.locations?.some(loc => 
          (loc.streetAddress1 || '').toLowerCase().includes(filters.address.toLowerCase()) ||
          (loc.streetAddress2 || '').toLowerCase().includes(filters.address.toLowerCase()) ||
          (loc.streetAddress3 || '').toLowerCase().includes(filters.address.toLowerCase()) ||
          (loc.city || '').toLowerCase().includes(filters.address.toLowerCase())
        );

      return matchesCode && matchesName && matchesEmail && matchesPhone && 
             matchesContract && matchesCountry && matchesStatus && matchesAddress;
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

  // Update the pagination info component
  const PaginationInfo = () => {
    const start = ((currentPage - 1) * perPage) + 1;
    const end = Math.min(currentPage * perPage, filteredData.length);
    const total = filteredData.length;
    
    return (
      <div className="text-muted small me-3">
        <ListUl size={14} className="me-2" />
        Showing {start} to {end} of {total} entries
      </div>
    );
  };

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

  const handleViewDetails = (customer) => {
    console.log('Viewing customer:', customer); // Debug log
    localStorage.setItem('viewCustomerToast', customer.customerName);
    router.push(`/customers/view/${customer.customerId}`);
  };

  const handleClearFilters = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      // Reset all filters
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
      setFilters(clearedFilters);
      setCurrentPage(1);

      // Fetch fresh data with limit
      const customersRef = collection(db, 'customers');
      const clearQuery = query(
        customersRef,
        orderBy('customerId', 'asc'),
        limit(10)
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

  // Add useEffect for initial data load instead
  // useEffect(() => {
  //   const loadInitialData = async () => {
  //     setLoading(true);
  //     try {
  //       const customersRef = collection(db, 'customers');
  //       const initialQuery = query(
  //         customersRef,
  //         orderBy('customerId', 'asc'),
  //         limit(10)
  //       );
 
  //       const snapshot = await getDocs(initialQuery);
  //       const customers = snapshot.docs.map(doc => ({
  //         id: doc.id,
  //         ...doc.data()
  //       }));
 
  //       setData(customers);
  //       setTotalRows(customers.length);
  //       setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
  //       setFirstDoc(snapshot.docs[0]);
  //       setInitialLoad(false);
  //     } catch (error) {
  //       console.error('Error loading initial data:', error);
  //       toast.error('Failed to load customers');
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
 
  //   if (initialLoad) {
  //     loadInitialData();
  //   }
  // }, [initialLoad]);

  // Update the search input in your JSX
  // <div className="d-flex align-items-center">
  //   <div className="position-relative">
  //     <input
  //       type="text"
  //       className="form-control"
  //       placeholder="Search customers..."
  //       value={searchTerm}
  //       onChange={(e) => setSearchTerm(e.target.value)}
  //       onKeyPress={handleSearch}
  //     />
  //     {searchLoading && (
  //       <div className="position-absolute top-50 end-0 translate-middle-y me-2">
  //         <Spinner
  //           animation="border"
  //           size="sm"
  //           role="status"
  //           aria-hidden="true"
  //         />
  //       </div>
  //     )}
  //   </div>
  //   <Button 
  //     variant="primary" 
  //     className="ms-2"
  //     onClick={() => handleSearch({ key: 'Enter' })}
  //     disabled={searchLoading}
  //   >
  //     {searchLoading ? (
  //       <Spinner
  //         as="span"
  //         animation="border"
  //         size="sm"
  //         role="status"
  //         aria-hidden="true"
  //       />
  //     ) : (
  //       <Search size={18} />
  //     )}
  //   </Button>
  // </div>

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
          limit(10)
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
            // Try searching by siteId
            searchQuery = query(
              customersRef,
              where('customerId', '>=', searchTerm.toUpperCase()),
              where('customerId', '<=', searchTerm.toUpperCase() + '\uf8ff'),
              limit(10)
            );

            snapshot = await getDocs(searchQuery);
            totalReadCount += snapshot.docs.length;
            console.log(`📊 Firebase Reads for siteId search: ${snapshot.docs.length}`);

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
                  customer.customerType?.toLowerCase().includes(searchTermLower) ||
                  customer.customerStatus?.toLowerCase().includes(searchTermLower) ||
                  customer.address?.toLowerCase().includes(searchTermLower) ||
                  // Search in address fields
                  addresses.some(addr => 
                    addr.street?.toLowerCase().includes(searchTermLower) ||
                    addr.name?.toLowerCase().includes(searchTermLower)
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
          searchResults = searchResults.filter(location => {
            if (searchFilters.siteId && !location.siteId?.toLowerCase().includes(searchFilters.siteId.toLowerCase())) return false;
            if (searchFilters.siteName && !location.siteName?.toLowerCase().includes(searchFilters.siteName.toLowerCase())) return false;
            if (searchFilters.address && !(
              location.address1?.toLowerCase().includes(searchFilters.address.toLowerCase()) ||
              location.address2?.toLowerCase().includes(searchFilters.address.toLowerCase()) ||
              location.address3?.toLowerCase().includes(searchFilters.address.toLowerCase())
            )) return false;
            if (searchFilters.city && !location.city?.toLowerCase().includes(searchFilters.city.toLowerCase())) return false;
            if (searchFilters.country && !location.country?.toLowerCase().includes(searchFilters.country.toLowerCase())) return false;
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
      toast.error('Failed to search locations');
      // Reset the table on error
      setData([]);
      setTotalRows(0);
      setLastDoc(null);
      setFirstDoc(null);
    } finally {
      setLoading(false);
    }
  };

  // Add this useEffect for initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const customersRef = collection(db, 'customers');
        const initialQuery = query(
          customersRef,
          orderBy('customerId', 'asc'),
          limit(10)
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
        toast.error('Failed to load locations');
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
            description="Comprehensive view of all your customer accounts, including contact details, service history, and account status"
            infoText="Easily search, filter, and manage customer profiles. Access key information like contact details, billing addresses, and account representatives. Track customer status and maintain accurate records for all your business relationships."
            badgeText="Customer Management"
            badgeText2="Workforce"
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
            actionButtons={[  // Changed from actionButton to actionButtons array
              {
                text: "Create New Customer",
                icon: <FaPlus size={14} />,
                variant: "light",
                tooltip: "Start creating a new customer masterlist",
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
                              {filters.customerName || filters.customerCode || filters.email || filters.phone ? (
                                'Searching customers...'
                              ) : (
                                'Loading customers...'
                              )}
                            </div>
                            <small className="text-muted mt-1">Please wait a moment</small>
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
    color: '#dc3545',
    borderLeft: '6px solid #dc3545'
  },
  LOADING: {
    color: '#0d6efd',
    borderLeft: '6px solid #0d6efd'
  }
};
