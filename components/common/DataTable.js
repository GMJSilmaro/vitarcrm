import { flexRender } from '@tanstack/react-table';
import { Spinner, Table } from 'react-bootstrap';
import DataTablePagination from './DataTablePagination';
import { getCommonPinningStyles } from '@/utils/datatable';

const DataTable = ({ table, pageSize, isShowFooter = false, children, isLoading, isError }) => {
  return (
    <div className='w-100 h-100'>
      <div className='mb-3'>{children}</div>

      <Table responsive className='text-center align-middle'>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  className='text-center'
                  key={header.id}
                  colSpan={header.colSpan}
                  style={{
                    ...getCommonPinningStyles({ column: header.column }),
                  }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody>
          {table.getRowModel()?.rows?.length === 0 && !isLoading && !isError && (
            <tr>
              <td colSpan={table.getAllColumns().length}>
                <div
                  className='d-flex justify-content-center align-items-center fs-6'
                  style={{ height: '100px' }}
                >
                  No data available
                </div>
              </td>
            </tr>
          )}

          {isLoading && (
            <tr>
              <td colSpan={table.getAllColumns().length}>
                <div
                  className='d-flex justify-content-center align-items-center'
                  style={{ height: '100px' }}
                >
                  <Spinner className='me-2' animation='border' size='sm' /> Loading...
                </div>
              </td>
            </tr>
          )}

          {isError && (
            <tr>
              <td colSpan={table.getAllColumns().length}>
                <div
                  className='d-flex justify-content-center align-items-center text-center py-5'
                  style={{ height: '100px' }}
                >
                  <div>
                    <h4 className='text-danger mb-0'>Error</h4>
                    <p className='text-muted fs-6'>Something went wrong. Please try again later.</p>
                  </div>
                </div>
              </td>
            </tr>
          )}

          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td
                  className='fs-6'
                  key={cell.id}
                  style={{ ...getCommonPinningStyles({ column: cell.column }) }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>

        {isShowFooter && (
          <tfoot>
            {table.getFooterGroups().map((footerGroup) => (
              <tr key={footerGroup.id}>
                {footerGroup.headers.map((footer) => (
                  <th key={footer.id} colSpan={footer.colSpan} style={{ width: footer.getSize() }}>
                    {footer.isPlaceholder
                      ? null
                      : flexRender(footer.column.columnDef.header, footer.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </tfoot>
        )}
      </Table>

      <DataTablePagination table={table} defaultPageSize={pageSize} />
    </div>
  );
};

export default DataTable;
