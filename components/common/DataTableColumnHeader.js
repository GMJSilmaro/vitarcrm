import { Dropdown } from 'react-bootstrap';
import { ArrowDownShort, ArrowUpShort, ChevronExpand, EyeSlash, X } from 'react-bootstrap-icons';

const DataTableColumnHeader = ({ column, title, className, children }) => {
  return (
    <Dropdown className='w-100 d-flex justify-content-center align-content-center'>
      <Dropdown.Toggle
        className='custom-dropdown p-0 d-flex align-items-center bg-transparent border-0'
        size='sm'
        variant='light'
      >
        <span className='fs-6 fw-semibold'>{title ?? children}</span>
        {column.getCanSort() && column.getIsSorted() === 'desc' ? (
          <ArrowDownShort className='ms-2' size={17} />
        ) : column.getCanSort() && column.getIsSorted() === 'asc' ? (
          <ArrowUpShort className='ms-2' size={17} />
        ) : column.getCanSort() ? (
          <ChevronExpand className='ms-2' size={17} />
        ) : null}
      </Dropdown.Toggle>

      <Dropdown.Menu>
        {column.getCanSort() && (
          <>
            <Dropdown.Item onClick={() => column.toggleSorting(false)}>
              <ArrowDownShort className='me-2' size={17} />
              Asc
            </Dropdown.Item>
            <Dropdown.Item onClick={() => column.toggleSorting(true)}>
              <ArrowUpShort className='me-2' size={17} />
              Desc
            </Dropdown.Item>
            {column.getCanSort() && column.getCanHide() && <Dropdown.Divider />}
            <Dropdown.Item onClick={() => column.clearSorting()}>
              <X className='me-2' size={17} />
              Clear Sorting
            </Dropdown.Item>
          </>
        )}
        <Dropdown.Item onClick={() => column.toggleVisibility(false)}>
          <EyeSlash className='me-2' size={17} />
          Hide
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default DataTableColumnHeader;
