import { RequiredLabel } from '@/components/Form/RequiredLabel';
import React from 'react';
import { Button, Card, Form, Row, Spinner, Table } from 'react-bootstrap';
import { Plus, Save, Trash } from 'react-bootstrap-icons';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';

const SkillsForm = ({ data, isLoading, handleNext, handlePrevious }) => {
  const form = useFormContext();
  const formErrors = form.formState.errors;

  const { fields, append, remove } = useFieldArray({
    name: 'skills',
    control: form.control,
  });

  const handleAddSkill = () => {
    append('');
  };

  const handleRemoveSkill = (index) => {
    remove(index);
  };

  return (
    <Card className='shadow-none'>
      <Card.Body className='pb-0'>
        <Row>
          <div className='d-flex justify-content-between align-items-center gap-2'>
            <div className='d-flex flex-column align-items-start gap-1'>
              <h4 className='mb-0'>Skills</h4>
              <p className='text-muted fs-6'>List all the users skills.</p>
            </div>

            <Button variant='outline-primary' onClick={handleAddSkill}>
              <Plus size={14} className='me-2' /> Add Skill
            </Button>
          </div>

          {fields.length === 0 ? (
            <div
              className='d-flex justify-content-center align-items-center mt-3'
              style={{ height: '200px' }}
            >
              <div className='text-center d-inline'>
                <h4 className='mb-0'>No skill added yet.</h4>
                <p className='text-muted'>Click "Add skill" to begin.</p>
              </div>
            </div>
          ) : (
            <Table striped bordered hover className='mt-3'>
              <thead>
                <tr>
                  <th className='text-center'>Action</th>
                  <th className='text-center'>
                    <RequiredLabel label='Name' />
                  </th>
                </tr>
              </thead>

              <tbody>
                {fields.map((_field, i) => (
                  <tr key={i}>
                    <td className='text-center'>
                      <Button
                        className='p-2'
                        variant='danger'
                        size='sm'
                        onClick={() => handleRemoveSkill(i)}
                      >
                        <Trash size={18} />
                      </Button>
                    </td>
                    <td>
                      <Controller
                        key={_field.id}
                        name={`skills.${i}`}
                        control={form.control}
                        render={({ field }) => (
                          <>
                            <Form.Control
                              className='d-flex align-items-center justify-content-center'
                              {...field}
                              type='text'
                              placeholder='Enter skill'
                            />

                            {formErrors && formErrors.skills?.[i]?.message && (
                              <Form.Text className='text-danger'>
                                {formErrors.skills?.[i]?.message}
                              </Form.Text>
                            )}
                          </>
                        )}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
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

          <Button type='button' onClick={handleNext} disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner
                  as='span'
                  animation='border'
                  size='sm'
                  role='status'
                  aria-hidden='true'
                  className='me-2'
                />
                {data ? 'Updating' : 'Creating'}...
              </>
            ) : (
              <>
                <Save size={14} className='me-2' />
                {data ? 'Update' : 'Create'} {'User'}
              </>
            )}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default SkillsForm;
