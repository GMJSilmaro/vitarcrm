import _ from 'lodash';
import React, { useEffect, useMemo } from 'react';
import { Form } from 'react-bootstrap';

const DataTableSearch = ({ table }) => {
  const handleSearch = (e) => {
    table.setGlobalFilter(e.target.value);
  };

  //* debounce search
  const handleDebounceSearch = useMemo(() => {
    return _.debounce(handleSearch, 300);
  }, []);

  //* cleanup
  useEffect(() => {
    return () => handleDebounceSearch.cancel();
  }, []);

  return (
    <Form.Control
      className='fs-6 py-2 px-3'
      size='sm'
      type='text'
      placeholder='Search...'
      onChange={handleDebounceSearch}
      style={{ width: '320px' }}
    />
  );
};

export default DataTableSearch;
