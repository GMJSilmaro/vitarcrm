import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

export function titleCase(str) {
  return str
    .toLowerCase()
    .split(' ')
    .map(function (word) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

export async function getFileFromBlobUrl(url) {
  const res = await axios.get(url, { responseType: 'blob' });
  const blob = res.data;

  return new File([blob], uuidv4(), { type: blob.type });
}
