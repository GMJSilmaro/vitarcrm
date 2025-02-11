import { Dropdown } from 'react-bootstrap';
import { Toggles, Check, X } from 'react-bootstrap-icons';

const DataTableViewOptions = ({ table }) => {
  return (
    <Dropdown>
      <Dropdown.Toggle
        className='custom-dropdown d-flex align-items-center'
        size='sm'
        variant='light'
      >
        <Toggles size={18} className='me-2' />
        View
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.ItemText>Toggle Columns</Dropdown.ItemText>
        <Dropdown.Divider />
        {table
          .getAllColumns()
          .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide())
          .map((column) => {
            return (
              <Dropdown.Item
                className='text-capitalize'
                onClick={() => column.toggleVisibility(!column.getIsVisible())}
              >
                {column.getIsVisible() ? (
                  <Check size={18} className='me-2' />
                ) : (
                  <X size={18} className='me-2' />
                )}
                <span className='truncate'>{column.id}</span>
              </Dropdown.Item>
            );
          })}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default DataTableViewOptions;
