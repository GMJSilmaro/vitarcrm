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

//* Global search filter
export const globalSearchFilter = (row, columnId, filterValue) => {
  const searchTerm = String(filterValue).toLowerCase();
  const rowValue = row.getValue(columnId);
  return rowValue !== undefined ? String(rowValue).toLowerCase().includes(searchTerm) : false;
};

export const dateFilter = (rowDateValue, filterDateValue) => {
  if (!isValid(rowDateValue) || !isValid(filterDateValue)) return false;
  return isSameDay(rowDateValue, filterDateValue);
};

dateFilter.autoRemove = (filterValue) => !filterValue;

export const dateSort = (a, b) => {
  if (!isValid(a) || !isValid(b)) return 1;
  return compareAsc(a, b);
};

export function getCommonPinningStyles({ column }) {
  const isPinned = column.getIsPinned();

  return {
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    position: isPinned ? 'sticky' : undefined,
    width: column.getSize(),
    background: isPinned ? 'white' : 'transparent',
    zIndex: isPinned ? 1 : 0,
  };
}
