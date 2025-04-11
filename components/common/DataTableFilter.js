import { useEffect, useState } from 'react';
import { Badge, Button, Col, Form, Modal, Row } from 'react-bootstrap';
import { Funnel, X } from 'react-bootstrap-icons';

//* Filter Fields type
//* - label: string
//* - columnId: string
//* - type: 'text' | 'date' | 'date-range' | 'select' | 'multiselect'
//* - options?: Array<{ label: string, value: string }>
//* - placeholder?: string

//* table - react-table instance
//* filterFields - array of filter fields
//* children - optional component to add to the bottom of the filter card, can be custom filter components

// TODO: add date-range & multi select  filter type
const DataTableFilter = ({ table, filterFields, setColumnFilters, children }) => {
  const [show, setShow] = useState(false);
  const filterCount = table.getState().columnFilters?.length || 0;

  const getFilterFields = (field, table) => {
    const column = table.getColumn(field.columnId);
    const columnFilterValue = column?.getFilterValue();

    if (!column) {
      console.error(`Column with id of ${field.columnId} not found`);
      return null;
    }

    //* add filters type component here...
    switch (field.type) {
      case 'text':
        return (
          <FilterInput
            className='fs-5 py-2 px-3'
            size='sm'
            type='text'
            onChange={(value) => {
              setColumnFilters
                ? setColumnFilters((prev) => [...prev, { id: field.columnId, value }])
                : column.setFilterValue(value);
            }}
            value={columnFilterValue}
            {...field}
          />
        );

      case 'date':
        return (
          <FilterInput
            className='fs-5 py-2 px-3'
            size='sm'
            type='date'
            onChange={(value) => {
              setColumnFilters
                ? setColumnFilters((prev) => [...prev, { id: field.columnId, value }])
                : column.setFilterValue(value);
            }}
            value={columnFilterValue}
            {...field}
          />
        );

      case 'select':
        return (
          <FilterSelect
            className='fs-5 py-2 px-3'
            size='sm'
            onChange={(value) => {
              setColumnFilters
                ? setColumnFilters((prev) => [...prev, { id: field.columnId, value }])
                : column.setFilterValue(value);
            }}
            value={columnFilterValue}
            {...field}
          />
        );

      default:
        return null;
    }
  };

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  if (!table || !filterFields) return null;

  return (
    <>
      <Button
        variant='light'
        className='position-relative h-100 data-table-filter'
        size='sm'
        onClick={handleShow}
      >
        <Funnel className='me-2' size={18} />
        Filter
        {filterCount > 0 && (
          <Badge
            pill
            bg='info'
            className='ms-1 position-absolute'
            style={{ top: -7, right: -10, zIndex: 10 }}
          >
            {filterCount}
          </Badge>
        )}
      </Button>

      <Modal size='xl' centered show={show} onHide={handleClose} backdropClassName='bg-transparent'>
        <Modal.Header closeButton>
          <div>
            <h4 className='mb-0'>Advanced Filters</h4>
            <small className='text-muted'>Filter the table by column</small>
          </div>
        </Modal.Header>
        <Modal.Body>
          <Row className='row-gap-3'>
            {filterFields.map((field, i) => (
              <Col key={i} md={4}>
                {getFilterFields(field, table)}
              </Col>
            ))}
          </Row>

          {children}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant='primary'
            size='sm'
            onClick={() => (setColumnFilters ? setColumnFilters([]) : table.resetColumnFilters())}
          >
            <X size={18} className='me-1' /> Clear Filters
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

function FilterInput({
  table,
  columnId,
  label,
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue || '');
  }, [initialValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value]);

  return (
    <Form.Group controlId={columnId}>
      <Form.Label className='mb-1 fs-5' title={label}>
        {label}:
      </Form.Label>
      <Form.Control {...props} value={value} onChange={(e) => setValue(String(e.target.value))} />
    </Form.Group>
  );
}

function FilterSelect({
  table,
  columnId,
  options,
  label,
  value: initialValue,
  onChange,
  ...props
}) {
  return (
    <Form.Group controlId={columnId}>
      <Form.Label className='mb-1 fs-5' title={label}>
        {label}:
      </Form.Label>
      <Form.Select
        {...props}
        defaultValue={initialValue}
        value={String(initialValue || '')}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option, i) => (
          <option key={i} value={option.value}>
            {option.label}
          </option>
        ))}
      </Form.Select>
    </Form.Group>
  );
}

export default DataTableFilter;
