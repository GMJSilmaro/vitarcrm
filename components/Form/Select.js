import { forwardRef } from 'react';
import ReactSelect from 'react-select';

//* custom react select component
const Select = forwardRef((props, ref) => {
  const selectCustomStyles = {
    control: (base, state) => ({
      ...base,
      paddingTop: '6px',
      paddingBottom: '6px',
      borderColor: state.isFocused ? '#1e40a6' : '#e2e8f0',
      backgroundColor: state.isFocused ? 'white' : '#f8fafc',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(53, 150, 220, 0.1)' : 'none',
      transform: 'translateY(-1px)',
      ':hover': {
        borderColor: '#e2e8f0',
      },
    }),
    multiValue: (styles, { data }) => ({
      ...styles,
      backgroundColor: '#edf2ff',
      borderRadius: '4px',
    }),
    multiValueLabel: (styles, { data }) => ({
      ...styles,
      color: '#1e293b',
    }),
    multiValueRemove: (styles, { data }) => ({
      ...styles,
      ':hover': {
        backgroundColor: '#f8d4d4',
        borderRadius: '4px',
        color: '#dc2626',
      },
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
          primary25: '#edf2ff',
        },
      })}
    />
  );
});

export default Select;
