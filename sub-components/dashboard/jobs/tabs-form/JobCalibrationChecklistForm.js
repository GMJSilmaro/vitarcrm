import DataTable from '@/components/common/DataTable';
import DataTableColumnHeader from '@/components/common/DataTableColumnHeader';
import DataTableFilter from '@/components/common/DataTableFilter';
import DataTableSearch from '@/components/common/DataTableSearch';
import DataTableViewOptions from '@/components/common/DataTableViewOptions';
import Select from '@/components/Form/Select';
import { db } from '@/firebase';
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { collection, getDocs, query } from 'firebase/firestore';
import React, { use, useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Form, Row } from 'react-bootstrap';

import { Controller, useFormContext } from 'react-hook-form';

const JobCalibrationChecklistForm = ({
  data,
  isLoading,
  handleNext,
  handlePrevious,
  toDuplicateJob,
}) => {
  const form = useFormContext();
  const formErrors = form.formState.errors;

  const [usersOptions, setUsersOptions] = useState({ data: [], isLoading: true, isError: false }); //prettier-ignore

  const columnHelper = createColumnHelper();

  const checkListEquipments = useMemo(() => {
    const value = form.getValues('checklistEquipments') || [];

    if (!value || (Array.isArray(value) && value.length < 1)) return [];
    return value;
  }, [JSON.stringify(form.watch('checklistEquipments'))]);

  const columns = useMemo(() => {
    return [
      columnHelper.accessor('index', {
        id: 'index',
        header: ({ column }) => <DataTableColumnHeader column={column} title='#' />,
        enableSorting: false,
        size: 50,
        cell: ({ row, table }) => (
          <div>
            {(table.getSortedRowModel()?.flatRows?.findIndex((flatRow) => flatRow.id === row.id) ||
              0) + 1}
          </div>
        ),
      }),
      columnHelper.accessor('description', {
        id: 'equipment',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Equipment' />,
      }),
      columnHelper.accessor('tagId', {
        id: 'equipment id',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Equipment ID' />,
      }),
      columnHelper.accessor('nominalValue', {
        id: 'nominal value',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Nominal Value' />,
        cell: ({ row }) => {
          const index = row.index;

          return (
            <Controller
              name={`checklistEquipments.${index}.nominalValue`}
              control={form.control}
              render={({ field }) => (
                <>
                  <Form.Control
                    className='text-center'
                    {...field}
                    onChange={(e) => field.onChange(e.target.value)}
                    type='text'
                  />
                </>
              )}
            />
          );
        },
      }),
      columnHelper.accessor('acceptance', {
        id: 'acceptance',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Acceptance' />,
        cell: ({ row }) => {
          const index = row.index;

          return (
            <Controller
              name={`checklistEquipments.${index}.acceptance`}
              control={form.control}
              render={({ field }) => (
                <>
                  <Form.Control
                    className='text-center'
                    {...field}
                    onChange={(e) => field.onChange(e.target.value)}
                    type='text'
                  />
                </>
              )}
            />
          );
        },
      }),
      columnHelper.accessor('resultBefore', {
        id: 'result before',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Result Before' />,
        cell: ({ row }) => {
          const index = row.index;

          return (
            <Controller
              name={`checklistEquipments.${index}.resultBefore`}
              control={form.control}
              render={({ field }) => (
                <>
                  <Form.Control
                    className='text-center'
                    {...field}
                    onChange={(e) => field.onChange(e.target.value)}
                    type='text'
                  />
                </>
              )}
            />
          );
        },
      }),
      columnHelper.accessor('resultAfter', {
        id: 'result after',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Result After' />,
        cell: ({ row }) => {
          const index = row.index;

          return (
            <Controller
              name={`checklistEquipments.${index}.resultAfter`}
              control={form.control}
              render={({ field }) => (
                <>
                  <Form.Control
                    className='text-center'
                    {...field}
                    onChange={(e) => field.onChange(e.target.value)}
                    type='text'
                  />
                </>
              )}
            />
          );
        },
      }),
    ];
  }, []);

  const filterFields = useMemo(() => {
    return [
      {
        label: 'Equipment',
        columnId: 'equipment',
        type: 'text',
        placeholder: 'Search by equipment...',
      },
      {
        label: 'Equipment ID',
        columnId: 'equipment id',
        type: 'text',
        placeholder: 'Search by equipment ID...',
      },
      {
        label: 'Nominal Value',
        columnId: 'nominal value',
        type: 'text',
        placeholder: 'Search by nominal value...',
      },
      {
        label: 'Acceptance',
        columnId: 'acceptance',
        type: 'text',
        placeholder: 'Search by acceptance...',
      },
      {
        label: 'Result Before',
        columnId: 'result before',
        type: 'text',
        placeholder: 'Search by result before...',
      },
      {
        label: 'Result After',
        columnId: 'result after',
        type: 'text',
        placeholder: 'Search by result after...',
      },
    ];
  });

  const table = useReactTable({
    data: checkListEquipments,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const takenByOptions = useMemo(() => {
    if (usersOptions.data.length > 0) {
      const workers = form.getValues('workers') || [];
      const workersUids = workers.map((worker) => worker.uid);
      return usersOptions.data.filter((user) => workersUids.includes(user.uid));
    }
    return [];
  }, [JSON.stringify(usersOptions), JSON.stringify(form.watch('workers'))]);

  const verifiedByOptions = useMemo(() => {
    if (usersOptions.data.length > 0) {
      return usersOptions.data.filter(
        (user) => user.role === 'supervisor' || user.role === 'admin'
      );
    }
    return [];
  }, [JSON.stringify(usersOptions)]);

  //* query users
  useEffect(() => {
    const q = query(collection(db, 'users'));

    getDocs(q)
      .then((snapshot) => {
        if (!snapshot.empty) {
          const userData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

          setUsersOptions({
            data: userData.map((user) => ({
              uid: user.id,
              id: user.workerId,
              name: user.fullName,
              value: user.id,
              label: user.fullName,
              role: user.role,
            })),
            isLoading: false,
            isError: false,
          });
        }
      })
      .catch((err) => {
        console.error(err.message);
        setUsersOptions({ data: [], isLoading: false, isError: true });
      });
  }, []);

  //* set checklistEquipments
  useEffect(() => {
    if (!data) {
      const refEquipments = form.getValues('equipments') || [];

      const checklistEquipments = refEquipments.map((eq) => ({
        id: eq.inventoryId,
        tagId: eq.tagId,
        description: eq.description,
        nominalValue: '',
        acceptance: '',
        resultBefore: '',
        resultAfter: '',
      }));

      form.setValue('takenByBefore', '');
      form.setValue('takenByAfter', '');
      form.setValue('verifiedByBefore', '');
      form.setValue('verifiedByAfter', '');
      form.setValue('checklistEquipments', checklistEquipments);
    } else {
      const checklistEquipments = data?.checklistEquipments || [];
      const refEquipments = form.getValues('equipments') || [];

      if (usersOptions.data.length > 0) {
        const selectedTakenByBefore = usersOptions.data.find(user => user.value === data?.takenByBefore) || ''; //prettier-ignore
        const selectedTakenByAfter = usersOptions.data.find(user => user.value === data?.takenByAfter) || ''; //prettier-ignore
        const selectedVerifiedByBefore = usersOptions.data.find(user => user.value === data?.verifiedByBefore) || ''; //prettier-ignore
        const selectedVerifiedByAfter = usersOptions.data.find(user => user.value === data?.verifiedByAfter) || ''; //prettier-ignore

        form.setValue('takenByBefore', selectedTakenByBefore);
        form.setValue('takenByAfter', selectedTakenByAfter);
        form.setValue('verifiedByBefore', selectedVerifiedByBefore);
        form.setValue('verifiedByAfter', selectedVerifiedByAfter);
      }

      if (checklistEquipments?.length < 1) {
        const checklistEquipments = refEquipments.map((eq) => ({
          id: eq.inventoryId,
          tagId: eq.tagId,
          description: eq.description,
          nominalValue: '',
          acceptance: '',
          resultBefore: '',
          resultAfter: '',
        }));

        form.setValue('checklistEquipments', checklistEquipments);
        return;
      }

      const currentChecklistEquipments = refEquipments.map((eq) => {
        const checklistEquipment = checklistEquipments.find((ce) => ce.id === eq.inventoryId);

        if (checklistEquipment) return checklistEquipment;

        return {
          id: eq.inventoryId,
          tagId: eq.tagId,
          description: eq.description,
          nominalValue: '',
          acceptance: '',
          resultBefore: '',
          resultAfter: '',
        };
      });

      form.setValue('checklistEquipments', currentChecklistEquipments);
    }
  }, [JSON.stringify(form.watch('equipments')), usersOptions]);

  //* set data if toDuplicateJob exists
  useEffect(() => {
    if (toDuplicateJob) {
      const checklistEquipments = toDuplicateJob?.checklistEquipments || [];
      const refEquipments = toDuplicateJob?.equipments || [];

      if (usersOptions.data.length > 0) {
        const selectedTakenByBefore = usersOptions.data.find(user => user.value === toDuplicateJob?.takenByBefore) || ''; //prettier-ignore
        const selectedTakenByAfter = usersOptions.data.find(user => user.value === toDuplicateJob?.takenByAfter) || ''; //prettier-ignore
        const selectedVerifiedByBefore = usersOptions.data.find(user => user.value === toDuplicateJob?.verifiedByBefore) || ''; //prettier-ignore
        const selectedVerifiedByAfter = usersOptions.data.find(user => user.value === toDuplicateJob?.verifiedByAfter) || ''; //prettier-ignore

        form.setValue('takenByBefore', selectedTakenByBefore);
        form.setValue('takenByAfter', selectedTakenByAfter);
        form.setValue('verifiedByBefore', selectedVerifiedByBefore);
        form.setValue('verifiedByAfter', selectedVerifiedByAfter);
      }

      if (checklistEquipments?.length < 1) {
        const checklistEquipments = refEquipments.map((eq) => ({
          id: eq.inventoryId,
          tagId: eq.tagId,
          description: eq.description,
          nominalValue: '',
          acceptance: '',
          resultBefore: '',
          resultAfter: '',
        }));

        form.setValue('checklistEquipments', checklistEquipments);
        return;
      }

      const currentChecklistEquipments = refEquipments.map((eq) => {
        const checklistEquipment = checklistEquipments.find((ce) => ce.id === eq.inventoryId);

        if (checklistEquipment) return checklistEquipment;

        return {
          id: eq.inventoryId,
          tagId: eq.tagId,
          description: eq.description,
          nominalValue: '',
          acceptance: '',
          resultBefore: '',
          resultAfter: '',
        };
      });

      form.setValue('checklistEquipments', currentChecklistEquipments);
    }
  }, [toDuplicateJob, JSON.stringify(usersOptions)]);

  return (
    <Card className='shadow-none'>
      <Card.Body className='pb-0'>
        <Row className='mb-3 row-gap-3'>
          <Form.Group as={Col} md={6}>
            <Form.Label>Date</Form.Label>
            <Form.Control
              required
              type='text'
              value={format(new Date(), 'dd-MM-yyyy')}
              readOnly
              disabled
            />
          </Form.Group>

          <Form.Group as={Col} md={6}>
            <Form.Label>Customer</Form.Label>
            <Form.Control
              required
              type='text'
              value={form.watch('customer.name')}
              readOnly
              disabled
            />
          </Form.Group>
        </Row>

        <hr className='my-4' />
        <h4 className='mb-0'>Reference Equipment</h4>
        <p className='text-muted fs-6'>
          Details about reference equipment with their respective nominal value, acceptance and
          before & after calibration results.
        </p>

        <Row>
          <Col>
            <DataTable table={table}>
              <div className='d-flex flex-column row-gap-3 flex-lg-row justify-content-lg-between'>
                <DataTableSearch table={table} />

                <div className='d-flex align-items-center gap-2'>
                  <DataTableFilter table={table} filterFields={filterFields} />
                  <DataTableViewOptions table={table} />
                </div>
              </div>
            </DataTable>
          </Col>
        </Row>

        <hr className='my-4' />
        <h4 className='mb-0'>Taken By</h4>
        <p className='text-muted fs-6'>
          Details about checklist's taken by before and after calibration.
        </p>

        <Row className='mb-3 row-gap-3'>
          <Form.Group as={Col} md={6}>
            <Form.Label>Before</Form.Label>

            <Controller
              name='takenByBefore'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    inputId='takenByBefore'
                    instanceId='takenByBefore'
                    onChange={(option) => field.onChange(option)}
                    options={takenByOptions}
                    isLoading={usersOptions.isLoading}
                    placeholder={
                      usersOptions.isLoading ? 'Loading users...' : "Search by users' name"
                    }
                    isDisabled={usersOptions.isLoading}
                    noOptionsMessage={() =>
                      usersOptions.isLoading ? 'Loading...' : 'No users found'
                    }
                  />

                  {formErrors && formErrors.customer?.message && (
                    <Form.Text className='text-danger'>{formErrors.customer?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={6}>
            <Form.Label>After</Form.Label>

            <Controller
              name='takenByAfter'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    inputId='takenByAfter'
                    instanceId='takenByAfter'
                    onChange={(option) => field.onChange(option)}
                    options={takenByOptions}
                    isLoading={usersOptions.isLoading}
                    placeholder={
                      usersOptions.isLoading ? 'Loading users...' : "Search by users' name"
                    }
                    isDisabled={usersOptions.isLoading}
                    noOptionsMessage={() =>
                      usersOptions.isLoading ? 'Loading...' : 'No users found'
                    }
                  />

                  {formErrors && formErrors.customer?.message && (
                    <Form.Text className='text-danger'>{formErrors.customer?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>
        </Row>

        <hr className='my-4' />
        <h4 className='mb-0'>Verified By Lab In-charge</h4>
        <p className='text-muted fs-6'>
          Details about checklist's verified by lab in-charge before and after calibration.
        </p>

        <Row className='mb-3 row-gap-3'>
          <Form.Group as={Col} md={6}>
            <Form.Label>Before</Form.Label>

            <Controller
              name='verifiedByBefore'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    inputId='verifiedByBefore'
                    instanceId='verifiedByBefore'
                    onChange={(option) => field.onChange(option)}
                    options={verifiedByOptions}
                    isLoading={usersOptions.isLoading}
                    placeholder={
                      usersOptions.isLoading ? 'Loading users...' : "Search by users' name"
                    }
                    isDisabled={usersOptions.isLoading}
                    noOptionsMessage={() =>
                      usersOptions.isLoading ? 'Loading...' : 'No users found'
                    }
                  />

                  {formErrors && formErrors.customer?.message && (
                    <Form.Text className='text-danger'>{formErrors.customer?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={6}>
            <Form.Label>After</Form.Label>

            <Controller
              name='verifiedByAfter'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    inputId='verifiedByAfter'
                    instanceId='verifiedByAfter'
                    onChange={(option) => field.onChange(option)}
                    options={verifiedByOptions}
                    isLoading={usersOptions.isLoading}
                    placeholder={
                      usersOptions.isLoading ? 'Loading users...' : "Search by users' name"
                    }
                    isDisabled={usersOptions.isLoading}
                    noOptionsMessage={() =>
                      usersOptions.isLoading ? 'Loading...' : 'No users found'
                    }
                  />

                  {formErrors && formErrors.customer?.message && (
                    <Form.Text className='text-danger'>{formErrors.customer?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>
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

export default JobCalibrationChecklistForm;
