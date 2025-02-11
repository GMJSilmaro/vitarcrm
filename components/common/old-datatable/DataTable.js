import React, { useState, useCallback, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Form, 
  Spinner,
  Badge
} from 'react-bootstrap';
import {
  ChevronLeft,
  ChevronRight,
  ListUl,
  Search,
  FilterCircle
} from 'react-bootstrap-icons';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender
} from '@tanstack/react-table';
import { TABLE_CONFIG } from 'constants/tableConfig';

const DataTable = ({
  data,
  columns,
  isLoading,
  totalRows,
  onSearch,
  onFilter,
  filterComponent: FilterComponent,
  tableTitle,
  tableDescription,
  actionButtons,
  defaultPageSize = TABLE_CONFIG.PAGE_SIZES.DEFAULT
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(defaultPageSize);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Load saved page size preference
  useEffect(() => {
    const savedPageSize = localStorage.getItem('tablePageSize');
    if (savedPageSize) {
      setPerPage(Number(savedPageSize));
    }
  }, []);

  // Table instance
  const table = useReactTable({
    data: data.slice((currentPage - 1) * perPage, currentPage * perPage),
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      pagination: {
        pageIndex: currentPage - 1,
        pageSize: perPage
      }
    },
    manualPagination: true,
    pageCount: Math.ceil(data.length / perPage),
  });

  // Pagination info component
  const PaginationInfo = () => {
    const start = ((currentPage - 1) * perPage) + 1;
    const end = Math.min(currentPage * perPage, totalRows);
    
    return (
      <div className="text-muted small">
        <ListUl size={14} className="me-2" />
        {isLoading ? (
          <small>Loading...</small>
        ) : (
          `Showing ${start} to ${end} of ${totalRows} entries`
        )}
      </div>
    );
  };

  // Page numbers generator
  const getPageNumbers = useCallback((current, total) => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    range.push(1);

    for (let i = current - delta; i <= current + delta; i++) {
      if (i > 1 && i < total) {
        range.push(i);
      }
    }

    if (total > 1) {
      range.push(total);
    }

    let l;
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
  }, []);

  // Handle page size change
  const handlePerRowsChange = useCallback((newPerPage) => {
    const currentTopRow = (currentPage - 1) * perPage;
    const newCurrentPage = Math.floor(currentTopRow / newPerPage) + 1;
    
    setPerPage(newPerPage);
    setCurrentPage(newCurrentPage);
    localStorage.setItem('tablePageSize', newPerPage);
  }, [currentPage, perPage]);

  // Handle search
  const handleSearch = useCallback((e) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(searchTerm);
    }
  }, [searchTerm, onSearch]);

  return (
    <div className="data-table">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          {tableTitle && <h5 className="mb-1">{tableTitle}</h5>}
          {tableDescription && <p className="text-muted small mb-0">{tableDescription}</p>}
        </div>
        <div className="d-flex gap-2">
          {actionButtons}
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-4">
        <div className="d-flex gap-3 align-items-center">
          <div className="flex-grow-1">
            <Form.Control
              type="search"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleSearch}
            />
          </div>
          {FilterComponent && (
            <Button
              variant="light"
              onClick={() => setShowFilters(!showFilters)}
              className="d-flex align-items-center"
            >
              <FilterCircle size={16} className="me-2" />
              Filters
              {showFilters && <Badge bg="primary" className="ms-2">Active</Badge>}
            </Button>
          )}
        </div>
        
        {FilterComponent && showFilters && (
          <div className="mt-3">
            <FilterComponent onFilter={onFilter} />
          </div>
        )}
      </div>

      {/* Table Controls */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center">
          <span className="text-muted me-2">Show:</span>
          <Form.Select
            size="sm"
            value={perPage}
            onChange={(e) => handlePerRowsChange(Number(e.target.value))}
            style={{ width: '80px' }}
            className="me-2"
          >
            {TABLE_CONFIG.PAGE_SIZES.OPTIONS.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </Form.Select>
          <span className="text-muted">entries</span>
        </div>
        <PaginationInfo />
      </div>

      {/* Table */}
      <div className="table-responsive">
        <Table hover>
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
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <div className="mt-2 text-muted">Loading data...</div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-5">
                  <div className="text-muted">
                    <div className="mb-2">No data found</div>
                    <small>Try adjusting your search criteria</small>
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="d-flex justify-content-end align-items-center mt-3">
        <div className="d-flex gap-2">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || isLoading}
          >
            <ChevronLeft size={14} className="me-1" />
            Previous
          </Button>
          <div className="d-flex align-items-center gap-1">
            {getPageNumbers(currentPage, Math.ceil(data.length / perPage))
              .map((page, index) => (
                page === '...' ? (
                  <span key={`dot-${index}`} className="px-2 text-muted">...</span>
                ) : (
                  <Button
                    key={page}
                    variant={currentPage === page ? "primary" : "outline-primary"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    disabled={isLoading}
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
            onClick={() => setCurrentPage(prev => 
              Math.min(Math.ceil(data.length / perPage), prev + 1)
            )}
            disabled={currentPage === Math.ceil(data.length / perPage) || isLoading}
          >
            Next
            <ChevronRight size={14} className="ms-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataTable; 