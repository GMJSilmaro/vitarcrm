import Checkbox from '@/components/common/Checkbox';
import DataTable from '@/components/common/DataTable';
import DataTableColumnHeader from '@/components/common/DataTableColumnHeader';
import DataTableSearch from '@/components/common/DataTableSearch';
import { db } from '@/firebase';
import { fuzzyFilter, globalSearchFilter } from '@/utils/datatable';
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { collection, getDocs } from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Card, Form, Row } from 'react-bootstrap';
import { useFormContext } from 'react-hook-form';

const CalibrationReferenceInstrumentsForm = ({
  job,
  data,
  isLoading,
  handleNext,
  handlePrevious,
}) => {
  const isMounted = useRef(false);

  const form = useFormContext();
  const formErrors = form.formState.errors;

  const [instruments, setInstruments] = useState({ data: [], isLoading: true, isError: false });

  const filterInstruments = useMemo(() => {
    const values = form.getValues('instruments');
    if (!values) return [];
    return values;
  }, [form.watch('instruments')]);

  const columnHelper = createColumnHelper();

  const selectedInstruments = useMemo(() => {
    return form.getValues('cocInstruments')?.length || 0;
  }, [JSON.stringify(form.watch('cocInstruments'))]);

  const handleSelectRow = useCallback(
    (row) => {
      row.toggleSelected();

      console.log({ row });

      //* handle form change
      const current = form.getValues('cocInstruments') || [];
      const newArray = [...current];
      const index = current.findIndex((instrument) => instrument === row.id);

      if (index > -1) newArray.splice(index, 1);
      else newArray.push(row.id);

      form.setValue('cocInstruments', newArray);
    },
    [JSON.stringify(form.watch('cocInstruments'))]
  );

  const handleSelectAllRow = useCallback(
    (table) => {
      const isAllSelected = table.getIsAllRowsSelected();

      //* handle form change
      if (isAllSelected) {
        //*  remove selected instruments
        table.toggleAllRowsSelected();
        form.setValue('cocInstruments', []);
      } else {
        //* select all instruments
        table.toggleAllRowsSelected();
        form.setValue('cocInstruments', instruments.data.map((instrument) => instrument.id)); //prettier-ignore
      }
    },
    [JSON.stringify(instruments.data)]
  );

  const getIsAllRowsSelected = useCallback(() => {
    const cocInstruments = form.getValues('cocInstruments') || [];

    if (!cocInstruments || cocInstruments?.length < 1) return false;

    return instruments.data.every((instrument) => cocInstruments.includes(instrument.id)); //prettier-ignore
  }, [JSON.stringify(form.watch('cocInstruments')), JSON.stringify(instruments.data)]);

  const getIsSomeRowsSelected = useCallback(() => {
    const cocInstruments = form.getValues('cocInstruments') || [];

    if (!cocInstruments || cocInstruments?.length < 1) return false;

    return instruments.data.some((instrument) => cocInstruments.includes(instrument.id)); //prettier-ignore
  }, [JSON.stringify(form.watch('cocInstruments')), JSON.stringify(instruments.data)]);

  const columns = useMemo(() => {
    return [
      columnHelper.accessor('select', {
        header: ({ table }) => {
          return (
            <Checkbox
              {...{
                checked: getIsAllRowsSelected(),
                indeterminate: getIsSomeRowsSelected(),
                onChange: () => {
                  handleSelectAllRow(table); //prettier-ignore
                },
              }}
            />
          );
        },
        cell: ({ row }) => {
          return (
            <div className='px-1'>
              <Checkbox
                {...{
                  checked: row.getIsSelected(),
                  indeterminate: row.getIsSomeSelected(),
                  onChange: () => {
                    handleSelectRow(row);
                  },
                }}
              />
            </div>
          );
        },
        enableSorting: false,
      }),
      columnHelper.accessor('tagId', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='ID No' />,
      }),
      columnHelper.accessor('description', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Description' />,
      }),
      columnHelper.accessor('serialNumber', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Serial No.' />,
      }),
      columnHelper.accessor('certificateNo', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Cert No.' />,
      }),
      columnHelper.accessor('traceability', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Traceability' />,
      }),
      columnHelper.accessor('Due Date', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Due Date' />,
        cell: ({ row }) => {
          const dueDate = row.original.dueDate;
          if (!dueDate) return <div>-</div>;
          return <div>{format(new Date(dueDate), 'dd-MM-yyyy')}</div>;
        },
      }),
    ];
  }, [JSON.stringify(form.watch('cocInstruments')), JSON.stringify(instruments.data)]);

  const table = useReactTable({
    data: filterInstruments,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    filterFns: { globalSearch: globalSearchFilter },
    globalFilterFn: 'globalSearch',
    initialState: {},
    getRowId: (row) => row.id,
  });

  // //* query equipments
  useEffect(() => {
    if (!job.data) return;

    getDocs(collection(db, 'equipments'))
      .then((snapshot) => {
        if (!snapshot.empty && !isMounted.current) {
          isMounted.current = true;

          const selectedEquipments = job?.data?.equipments?.length > 0 ? job.data.equipments : [];
          const selectedEquipmentIds = selectedEquipments.map((equipment) => equipment.id);

          const instruments = snapshot.docs
            .filter((instrument) => selectedEquipmentIds?.includes(instrument.id))
            .map((doc) => {
              const data = doc.data();

              return {
                id: doc.id,
                tagId: data.tagId,
                description: data.description,
                category: data.category?.toLowerCase() || '',
                make: data.make,
                model: data.model,
                serialNumber: data.serialNumber,
                traceability: data.traceability,
                certificateNo: data.certificateNo,
                dueDate: undefined, //TODO: due date not yet available in the equipment's property
              };
            });

          setInstruments({ data: instruments, isLoading: false, isError: false });
        } else setInstruments({ data: [], isLoading: false, isError: false });
      })
      .catch((err) => {
        console.error(err.message);
        setInstruments({ data: [], isLoading: false, isError: true });
      });

    return () => (isMounted.current = false);
  }, [job.data, data]);

  //* set instruments and filter out based on category
  useEffect(() => {
    if (form.watch('category')?.value) {
      const currentInstruments = instruments.data;

      const filterInstruments = currentInstruments.filter((instrument) => {
        const selectedCategory = form.getValues('category.value')?.toLowerCase();

        if (!selectedCategory) return false;
        if (instrument.category === selectedCategory) return true;
        return false;
      });

      form.setValue('instruments', filterInstruments);
    }
  }, [form.watch('category'), instruments.data]);

  //* set selected coc instruments
  useEffect(() => {
    if (data && instruments.data.length > 0 && table) {
      const currentCocInstruments = data?.cocInstruments?.length > 0 ? data?.cocInstruments : [];

      //* set form value
      form.setValue('cocInstruments', currentCocInstruments);
    }
  }, [data, instruments.data, table]);

  useEffect(() => {
    const currentCocInstruments = form.getValues('cocInstruments')?.length > 0 ? form.getValues('cocInstruments') : []; // prettier-ignore

    //* set row selection
    table.setRowSelection(currentCocInstruments.reduce((acc, id) => ({ ...acc, [id]: true }), {})); // prettier-ignore
  }, [JSON.stringify(form.watch('cocInstruments'))]);

  return (
    <Card className='shadow-none'>
      <Card.Body>
        <h4 className='mb-0'>Instrument</h4>
        <p className='text-muted fs-6'>
          The instruments/equipments listed below are based on the selected equipments in the job
          but filtered out based on the selected category. Select at least 1 instruments you want to
          be included in the COC.
        </p>

        <div className='mt-2'>
          <DataTable
            table={table}
            isLoading={job.isLoading || instruments.isLoading}
            isError={job.isError || instruments.isError}
          >
            <div className='d-flex flex-column row-gap-3 flex-lg-row justify-content-lg-between'>
              <DataTableSearch table={table} />

              <div className='rounded border' style={{ padding: '8px 16px' }}>
                <span className='me-2'>Selected:</span> <Badge>{selectedInstruments}</Badge>
              </div>
            </div>
          </DataTable>
        </div>

        {formErrors && formErrors.instruments?.message && (
          <Form.Text className='text-danger'>{formErrors.instruments?.message}</Form.Text>
        )}

        {formErrors && formErrors.cocInstruments?.message && (
          <Form.Text className='text-danger'>{formErrors.cocInstruments?.message}</Form.Text>
        )}

        <div className='mt-4 d-flex justify-content-between align-items-center'>
          <Button
            disabled={isLoading}
            type='button'
            variant='outline-primary'
            onClick={handlePrevious}
          >
            Previous
          </Button>

          <Button disabled={isLoading} type='button' onClick={handleNext}>
            Next
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default CalibrationReferenceInstrumentsForm;
