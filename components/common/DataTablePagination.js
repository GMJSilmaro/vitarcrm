import { useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import {
  ChevronDoubleLeft,
  ChevronDoubleRight,
  ChevronLeft,
  ChevronRight,
} from 'react-bootstrap-icons';
import Select from 'react-select';

const DataTablePagination = ({ table, defaultPageSize, pageSize = [5, 10, 25, 50, 100] }) => {
  const paginationSizeOptions = pageSize.map((size) => ({ value: size, label: size }));
  const [selectedPageSize, setSelectedPageSize] = useState(paginationSizeOptions[1]);

  const page = table.getState().pagination.pageIndex + 1;
  const pageCount = table.getPageCount() || 0;
  const totalRows = table.getPrePaginationRowModel()?.rows?.length || 0;

  useEffect(() => {
    if (defaultPageSize) {
      const defaultValue = paginationSizeOptions.find((p) => p.value === defaultPageSize);
      if (defaultValue) {
        setSelectedPageSize(defaultValue);
        table.setPageSize(defaultValue.value);
      }
    }
  }, [defaultPageSize]);

  if (totalRows === 0) return null;

  return (
    <div className='d-flex justify-content-between align-items-center column-gap-3'>
      <div className='d-flex align-items-center column-gap-3'>
        <Select
          value={selectedPageSize}
          onChange={(option) => {
            table.setPageSize(option.value);
            setSelectedPageSize(option);
          }}
          options={paginationSizeOptions}
          noOptionsMessage={() => 'No page size options found'}
          theme={(theme) => ({
            ...theme,
            colors: {
              ...theme.colors,
              primary: '#1e40a6',
              primary75: '#4b66b8',
              primary50: '#8fa0d3',
              primary25: '#d2d9ed',
            },
          })}
        />
        <div className='text-muted fw-medium'>
          <span className='pe-1'>
            Page {page} of {pageCount}
          </span>
          <span>of {totalRows} entries</span>
        </div>
      </div>

      <div className='d-flex align-items-center column-gap-3'>
        <div className='d-flex align-items-center column-gap-2'>
          <span>Go to page:</span>

          <Form.Control
            size='sm'
            type='number'
            min={1}
            max={table.getPageCount()}
            defautValue={table.getState().pagination.pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              table.setPageIndex(page);
            }}
            style={{ width: '60px', height: '40px' }}
          />
        </div>
        <div className='d-flex align-items-center column-gap-2'>
          <Button
            className='p-2'
            variant='light'
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronDoubleLeft size={17} />
          </Button>
          <Button
            className='p-2'
            variant='light'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft size={17} />
          </Button>
          <Button
            className='p-2'
            variant='light'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight size={17} />
          </Button>
          <Button
            className='p-2'
            variant='light'
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronDoubleRight size={17} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataTablePagination;
