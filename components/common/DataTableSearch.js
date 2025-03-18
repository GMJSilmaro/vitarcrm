import _ from 'lodash';
import React, { useEffect, useMemo, useRef } from 'react';
import { Form } from 'react-bootstrap';

const DataTableSearch = ({ table, isGlobalSearch = true, columnId }) => {
  const inputRef = useRef(null);
  const column = columnId ? table.getColumn(columnId) : null;

  const handleSearch = (e) => {
    if (isGlobalSearch) {
      table.setGlobalFilter(e.target.value);
      return;
    }

    if (!columnId) return;
    column && column.setFilterValue(e.target.value);
  };

  //* debounce search
  const handleDebounceSearch = useMemo(() => {
    return _.debounce(handleSearch, 300);
  }, []);

  //* cleanup
  useEffect(() => {
    return () => handleDebounceSearch.cancel();
  }, []);

  useEffect(() => {
    if (column) {
      //* clear  the input field if the filter value is undefined
      const filterValue = column.getFilterValue();
      if (filterValue === undefined) inputRef.current.value = '';
    }
  }, [column?.getFilterValue()]);

  return (
    <Form.Control
      ref={inputRef}
      className='fs-5 py-2 px-3'
      size='sm'
      type='text'
      placeholder='Search...'
      onChange={handleDebounceSearch}
      style={{ width: '320px' }}
    />
  );
};

export default DataTableSearch;
