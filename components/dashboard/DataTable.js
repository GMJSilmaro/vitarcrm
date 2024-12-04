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
  emptyMessage = "No records found",
  loadingMessage = "Loading records..."
}) => {
  console.log('DataTable Props:', { columns, data, loading }); // Debug log

  return (
    <div>
      <div className="table-responsive">
        <Table hover className="align-middle">
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
                <td colSpan={columns.length} className="text-center py-5">
                  <div className="text-muted">{loadingMessage}</div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-5">
                  <div className="text-muted">{emptyMessage}</div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((column, colIndex) => (
                    <td key={colIndex}>
                      {column.cell ? 
                        column.cell({ row: { original: row } }) : // Fix for cell render
                        row[column.accessorKey]} {/* Fix for data access */}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default DataTable; 