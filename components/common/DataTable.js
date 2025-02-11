import { flexRender } from '@tanstack/react-table';
import { Table } from 'react-bootstrap';
import DataTablePagination from './DataTablePagination';

const DataTable = ({ table, isShowFooter = false, children }) => {
  return (
    <div className='w-w-100'>
      <div className='mb-3'>{children}</div>
      <Table responsive>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} colSpan={header.colSpan} style={{ width: header.getSize() }}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
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
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} style={{ width: cell.column.getSize() }}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
      <DataTablePagination table={table} />
    </div>
  );
};

export default DataTable;
