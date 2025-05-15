import { TooltipContent } from '@/components/common/ToolTipContent';
import { RequiredLabel } from '@/components/Form/RequiredLabel';
import Select from '@/components/Form/Select';
import { equipmentSchema } from '@/schema/job';
import { collection, onSnapshot, query } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Col, Form, OverlayTrigger, Row, Tooltip } from 'react-bootstrap';
import { Controller, useForm, useFormContext } from 'react-hook-form';
import JobEquipmentList from '../JobEquipmentList';
import { zodResolver } from '@hookform/resolvers/zod';
import { db } from '@/firebase';
import toast from 'react-hot-toast';

const JobReferenceEquipmentForm = ({
  data,
  isLoading,
  handleNext,
  handlePrevious,
  toDuplicateJob,
  isAdmin,
}) => {
  const form = useFormContext();

  const formErrors = form.formState.errors;

  const [equipmentsOptions, setEquipmentsOptions] = useState({ data: [], isLoading: true, isError: false }); //prettier-ignore

  const equipmentForm = useForm({
    mode: 'onChange',
    resolver: zodResolver(equipmentSchema),
  });

  const equipments = useMemo(() => {
    return form.getValues('equipments');
  }, [form.watch('equipments')]);

  const formatEquipmentOptionLabel = (data) => {
    const currentEquipments = form.getValues('equipments') || [];
    const isAvailable = data?.qty > 0;

    const getLabel = (data) => {
      if (!data) return '';

      let label = '';
      if (data?.inventoryId) label += `${data.inventoryId} - `;
      if (data?.tagId) label += `${data.tagId} - `;
      if (data?.description) label += `${data.description}`;

      return label;
    };

    return (
      <div className='d-flex justify-content-between align-items-center gap-2 text-capitalize'>
        <span>{getLabel(data)}</span>
        <span className='d-flex column-gap-2'>
          <Badge bg={isAvailable ? 'success' : 'danger'}>
            {isAvailable ? 'Available' : 'Unavailable'}{' '}
          </Badge>

          <Badge bg='primary'>{data.category}</Badge>
          <Badge bg='warning'>{data.certificateNo}</Badge>
        </span>
      </div>
    );
  };

  const handleAddEquipment = () => {
    equipmentForm.trigger('equipment');
    const data = equipmentForm.getValues('equipment');
    if (!data) return;

    const currentEquipments = form.getValues('equipments');

    const isExist = currentEquipments.find(
      (equipment) => equipment.inventoryId === data.inventoryId
    );

    const isAvailable = data?.qty > 0;

    if (isExist) {
      toast.error('Equipment already selected');
      return;
    }

    if (!isAvailable) {
      toast.error('Equipment is not available');
      return;
    }

    form.setValue('equipments', [...equipments, data]);
    form.clearErrors('equipments');
    equipmentForm.setValue('equipment', null);
  };

  const handleRemoveEquipment = (id) => {
    form.setValue(
      'equipments',
      equipments.filter((equipment) => equipment.inventoryId !== id)
    );
  };

  //* query equipments
  useEffect(() => {
    const q = query(collection(db, 'equipments'));

    const unsubscribe = onSnapshot(
      q,
      (snapshop) => {
        if (!snapshop.empty) {
          setEquipmentsOptions({
            data: snapshop.docs.map((doc) => {
              const data = doc.data();

              return {
                value: doc.id,
                label:  `${data?.inventoryId || ''} - ${data?.tagId || ''} - ${data?.description || '' } - ${data?.category || ''} - ${data?.certificateNo || ''}`, //prettier-ignore
                ...data,
              };
            }),
          });
        } else {
          setEquipmentsOptions({ data: [], isLoading: false, isError: false });
        }
      },
      (err) => {
        console.error(err.message);
        setEquipmentsOptions({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, []);

  //* set equipments if data exist
  useEffect(() => {
    if (data && equipmentsOptions.data.length > 0) {
      const equipmentsIds = data.equipments.map((equipment) => equipment.id);

      //* selected equipments
      const equipments = equipmentsOptions.data.filter((equipment) =>
        equipmentsIds.includes(equipment.value)
      );

      //* set form values
      form.setValue('equipments', equipments);
    }
  }, [data, equipmentsOptions]);

  //* set data if toDuplicateJob exists
  useEffect(() => {
    if (toDuplicateJob) {
      //* set selected equipment (equipments)
      if (equipmentsOptions.data.length > 0) {
        const equipmentsIds = toDuplicateJob.equipments.map((equipment) => equipment.id);

        //* selected equipments
        const equipments = equipmentsOptions.data.filter(
          (equipment) => equipmentsIds.includes(equipment.value) && equipment.qty > 0
        );

        //* set form values
        form.setValue('equipments', equipments);
      }
    }
  }, [toDuplicateJob, equipmentsOptions]);

  return (
    <Card className='shadow-none'>
      <Card.Body className='pb-0'>
        <h4 className='mb-0'>Reference Equipment</h4>
        <p className='text-muted fs-6'>Details about the equipment needed for the job.</p>

        <Row className='mb-3 gap-0 align-items-center'>
          <Form.Group as={Col} md='12'>
            <RequiredLabel label='Equipments' id='equipment' />
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  <TooltipContent
                    title='Equipments Search'
                    info={[
                      "Search by equipment's tag id, inventory id or description, category or certificate no.",
                      'Required to proceed with job creation',
                    ]}
                  />
                </Tooltip>
              }
            >
              <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
            </OverlayTrigger>

            <Controller
              name='equipment'
              control={equipmentForm.control}
              render={({ field }) => (
                <>
                  <div className='d-flex gap-2 w-100 align-items-center'>
                    <Select
                      className='w-100'
                      {...field}
                      inputId='equipment'
                      instanceId='equipment'
                      onChange={(option) => {
                        field.onChange(option);
                        form.clearErrors('equipments');

                        handleAddEquipment();
                      }}
                      formatOptionLabel={formatEquipmentOptionLabel}
                      options={equipmentsOptions.data}
                      isDisabled={
                        !isAdmin || equipmentsOptions.isLoading || equipmentsOptions.length < 1
                      }
                      placeholder="Search by equipment's tag id, inventory id or description, category or certificate no."
                      noOptionsMessage={() => 'No equipments found'}
                    />
                  </div>

                  {equipmentForm.formState.errors &&
                    equipmentForm.formState.errors.equipment?.message && (
                      <Form.Text className='text-danger'>
                        {equipmentForm.formState.errors.equipment?.message}
                      </Form.Text>
                    )}
                </>
              )}
            />
          </Form.Group>
        </Row>

        <JobEquipmentList
          isAdmin={isAdmin}
          height={426}
          data={form.watch('equipments')}
          handleRemoveEquipment={handleRemoveEquipment}
        />

        <Row>
          {formErrors && formErrors.equipments?.message && (
            <Form.Text className='text-danger'>{formErrors.equipments?.message}</Form.Text>
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
        </Row>
      </Card.Body>
    </Card>
  );
};

export default JobReferenceEquipmentForm;
