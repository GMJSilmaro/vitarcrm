import React from 'react';
import { Table, Spinner, Form, Button } from 'react-bootstrap';
import { ChevronLeft, ChevronRight } from 'react-bootstrap-icons';

const DataTable = ({
  columns,
  data,
  loading,
  currentPage,
  perPage,
  totalRows,
  onPageChange,
  onPerPageChange,
  emptyMessage = 'No records found',
  loadingMessage = 'Loading records...',
}) => {
  const totalPages = Math.ceil(totalRows / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const paginatedData = data.slice(startIndex, startIndex + perPage);

  const getPagination = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1, 2, 3);
      if (currentPage > 4) pages.push('...');
      if (currentPage >= 4 && currentPage <= totalPages - 3) pages.push(currentPage);
      if (currentPage < totalPages - 3) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div>
      <div className='table-responsive'>
        <Table striped bordered hover responsive className='align-middle'>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={index}>{column.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className='text-center py-5'>
                  <Spinner animation='border' role='status' />
                  <div className='text-muted mt-2'>{loadingMessage}</div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className='text-center py-5'>
                  <div className='text-muted'>{emptyMessage}</div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((column, colIndex) => (
                    <td key={colIndex}>
                      {column.cell
                        ? column.cell({ row: { original: row } })
                        : row[column.accessorKey]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className='d-flex justify-content-between align-items-center mt-3'>
        <div>
          <Form.Select value={perPage} onChange={(e) => onPerPageChange(Number(e.target.value))}>
            {[5, 10, 25, 50].map((size) => (
              <option key={size} value={size}>
                {size} per page
              </option>
            ))}
          </Form.Select>
        </div>
        <div className='d-flex gap-2'>
          <div className='d-flex align-items-center mr-2'>
            <small className='text-muted'>
              Showing {startIndex + 1} to {Math.min(startIndex + perPage, totalRows)} of {totalRows}{' '}
              entries
            </small>
          </div>
          <Button
            variant='outline-secondary'
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <ChevronLeft />
          </Button>
          {getPagination().map((page, index) =>
            typeof page === 'number' ? (
              <Button
                key={index}
                variant={page === currentPage ? 'primary' : 'outline-secondary'}
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            ) : (
              <span key={index} className='mx-2'>
                {page}
              </span>
            )
          )}
          <Button
            variant='outline-secondary'
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
