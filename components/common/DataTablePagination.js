import { useState } from 'react';
import { Button } from 'react-bootstrap';
import {
  ChevronDoubleLeft,
  ChevronDoubleRight,
  ChevronLeft,
  ChevronRight,
} from 'react-bootstrap-icons';
import Select from 'react-select';

const DataTablePagination = ({ table, pageSize = [10, 25, 50, 100] }) => {
  const paginationSizeOptions = pageSize.map((size) => ({ value: size, label: size }));
  const [selectedPageSize, setSelectedPageSize] = useState(paginationSizeOptions[0]);

  return (
    <div className='d-flex justify-content-between align-items-center column-gap-3'>
      <Select
        value={selectedPageSize}
        onChange={(option) => {
          table.setPageSize(option.value);
          setSelectedPageSize(option);
        }}
        options={paginationSizeOptions}
        noOptionsMessage={() => 'No page size options found'}
      />
      <div className='d-flex align-items-center column-gap-3'>
        <div className='text-muted fw-medium'>
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className='d-flex align-items-center column-gap-2'>
          <Button
            className='p-2'
            variant='light'
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronDoubleLeft size={18} />
          </Button>
          <Button
            className='p-2'
            variant='light'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft size={18} />
          </Button>
          <Button
            className='p-2'
            variant='light'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight size={18} />
          </Button>
          <Button
            className='p-2'
            variant='light'
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronDoubleRight size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataTablePagination;
