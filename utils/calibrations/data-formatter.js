import * as math from 'mathjs';

export const formatToDicimalString = (value, dicimalPlaces = 4) => {
  if (typeof value === 'string') return '';
  if (value === undefined || value === null) return '';
  if (isNaN(value)) return '';
  return value.toFixed(dicimalPlaces);
};

export function formatScientific(value, precision = 4) {
  if (value === undefined || value === null) return '';
  if (isNaN(value)) return '';

  let formatted = math.format(math.bignumber(value), { notation: 'exponential', precision });
  formatted = formatted.replace('e', 'E'); //* Convert 'e' to 'E'

  //* Ensure exponent always has at least two digits (E-02, E+03, etc.)
  formatted = formatted.replace(/E([+-]?)(\d)$/, (match, sign, exp) => `E${sign}${exp.padStart(2, '0')}`); // prettier-ignore

  return formatted;
}

export const getArrayActualValues = (values) => {
  let actualValues;

  if (values) {
    if (Array.isArray(values) && values.length > 0) actualValues = values.filter(Boolean);
    if (actualValues.length < 1) actualValues = [0];
    return actualValues;
  }

  return (actualValues = [0]);
};
