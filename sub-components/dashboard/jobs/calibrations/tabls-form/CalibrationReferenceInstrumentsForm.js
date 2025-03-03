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
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Form, Row } from 'react-bootstrap';
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

  const columns = useMemo(() => {
    return [
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
  }, []);

  const table = useReactTable({
    data: filterInstruments,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    filterFns: { globalSearch: globalSearchFilter },
    globalFilterFn: 'globalSearch',
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

  useEffect(() => {
    if (form.watch('category')?.value) {
      const currentInstruments = instruments.data;

      const filterInstruments = currentInstruments.filter((instrument) => {
        const selectedCategory = form.getValues('category.value')?.toLowerCase();

        if (!selectedCategory) return false;
        if (instrument.category === 'mechanical' && selectedCategory === 'mass') return true;
        if (instrument.category === selectedCategory) return true;
      });

      form.setValue('instruments', filterInstruments);
    }
  }, [form.watch('category'), instruments.data]);

  return (
    <Card className='shadow-none'>
      <Card.Body>
        <Row>
          <h4 className='mb-0'>Instruments</h4>
          <p className='text-muted fs-6'>
            The instruments/equipments listed below are based on the selected equipments in the job
            but filtered out based on the selected category.
          </p>

          <div className='mt-2'>
            <DataTable
              table={table}
              isLoading={job.isLoading || instruments.isLoading}
              isError={job.isError || instruments.isError}
            >
              <div className='d-flex justify-content-between'>
                <DataTableSearch table={table} />
              </div>
            </DataTable>
          </div>

          {formErrors && formErrors.instruments?.message && (
            <Form.Text className='text-danger'>{formErrors.instruments?.message}</Form.Text>
          )}
        </Row>

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
