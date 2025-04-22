export const prependZero = (num) => String(num).padStart(2, '0');

export const countDecimals = (value) => {
  if (Math.floor(value) === value) return 0;

  const str = value.toString();

  //* Scientific notation like 1e-9
  if (str.includes('e-')) return parseInt(str.split('e-')[1], 10);

  //* decimal notation
  if (str.includes('.')) return str.split('.')[1].length;

  return 0;
};
