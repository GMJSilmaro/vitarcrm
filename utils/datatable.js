import { rankItem } from '@tanstack/match-sorter-utils';
import { compareItems } from '@tanstack/match-sorter-utils';
import { sortingFns } from '@tanstack/react-table';
import { compareAsc, isSameDay, isValid } from 'date-fns';

export const fuzzyFilter = (row, columnId, filterValue, addMeta) => {
  //* Rank the item
  const itemRank = rankItem(row.getValue(columnId), filterValue);

  //* Store the itemRank info
  addMeta({ itemRank });

  //* Return if the item should be filtered in/out
  return itemRank.passed;
};

export const fuzzySort = (rowA, rowB, columnId) => {
  let dir = 0;

  //* Only sort by rank if the column has ranking information
  if (rowA.columnFiltersMeta[columnId]) {
    dir = compareItems(
      rowA.columnFiltersMeta[columnId]?.itemRank,
      rowB.columnFiltersMeta[columnId]?.itemRank
    );
  }

  //* Provide an alphanumeric fallback for when the item ranks are equal
  return dir === 0 ? sortingFns.alphanumeric(rowA, rowB, columnId) : dir;
};

export const dateFilter = (rowDateValue, filterDateValue) => {
  if (!isValid(rowDateValue) || !isValid(filterDateValue)) return false;
  return isSameDay(rowDateValue, filterDateValue);
};

dateFilter.autoRemove = (filterValue) => !filterValue;

export const dateSort = (rowDateValue, filterDateValue) => {
  if (!isValid(rowDateValue) || !isValid(filterDateValue)) return 1;
  return compareAsc(rowDateValue, filterDateValue);
};
