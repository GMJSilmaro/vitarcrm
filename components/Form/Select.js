import { forwardRef } from 'react';
import ReactSelect from 'react-select';

//* custom react select component
const Select = forwardRef((props, ref) => {
  const selectCustomStyles = {
    control: (base) => ({
      ...base,
      paddingTop: '6px',
      paddingBottom: '6px',
    }),
  };

  return (
    <ReactSelect
      {...props}
      ref={ref}
      styles={selectCustomStyles}
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
  );
});

export default Select;
