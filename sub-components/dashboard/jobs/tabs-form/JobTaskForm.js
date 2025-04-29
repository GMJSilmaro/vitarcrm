import { useEffect } from 'react';
import { Button, Card, Form, OverlayTrigger, Row, Table, Tooltip } from 'react-bootstrap';
import { Plus, Trash } from 'react-bootstrap-icons';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';

const TaskForm = ({ isLoading, handleNext, handlePrevious, toDuplicateJob }) => {
  const form = useFormContext();

  const formErrors = form.formState.errors;

  const { fields, append, remove } = useFieldArray({
    name: 'tasks',
    control: form.control,
  });

  const RequiredLabel = ({ label, id }) => (
    <Form.Label htmlFor={id}>
      {label}
      <OverlayTrigger placement='top' overlay={<Tooltip>This field is required</Tooltip>}>
        <span className='text-danger' style={{ marginLeft: '4px', cursor: 'help' }}>
          *
        </span>
      </OverlayTrigger>
    </Form.Label>
  );

  const handleAddTask = () => {
    append({
      name: '',
      description: '',
      isCompleted: false,
      isPriority: false,
    });
  };

  const handleRemoveTask = (index) => {
    remove(index);
  };

  //* set tasks if toDuplicateJob exists
  useEffect(() => {
    if (toDuplicateJob) {
      //* set tasks
      form.setValue('tasks', toDuplicateJob.tasks);
    }
  }, [toDuplicateJob]);

  return (
    <Card className='shadow-none'>
      <Card.Body className='pb-0'>
        <Row>
          <Form>
            <div className='d-flex justify-content-between align-items-center gap-2'>
              <div className='d-flex flex-column align-items-start gap-1'>
                <h4 className='mb-0'>Additional Instructions</h4>
                <p className='text-muted fs-6'>
                  List all the additional instructions needed for the job to guide the
                  individual/team during calibration.
                </p>
              </div>

              <Button
                variant='primary'
                onClick={handleAddTask}
                disabled={form.watch('jobRequestId')}
              >
                <Plus size={14} className='me-2' /> Add Additional Instruction
              </Button>
            </div>

            {fields.length === 0 ? (
              <div
                className='d-flex justify-content-center align-items-center mt-3'
                style={{ height: '200px' }}
              >
                <div className='text-center d-inline'>
                  <h4 className='mb-0'>No Additional Instructions added yet.</h4>
                  <p className='text-muted'>Click "Add Additional Instructions" to begin.</p>
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
                    <th className='text-center'>
                      <RequiredLabel label='Description' />
                    </th>
                    <th className='text-center'>Completed</th>
                    <th className='text-center'>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((_field, i) => (
                    <tr key={i}>
                      <td className='text-center'>
                        <Button
                          disabled={form.watch('jobRequestId')}
                          className='p-2'
                          variant='danger'
                          size='sm'
                          onClick={() => handleRemoveTask(i)}
                        >
                          <Trash size={18} />
                        </Button>
                      </td>
                      <td>
                        <Controller
                          key={_field.id}
                          name={`tasks.${i}.name`}
                          control={form.control}
                          render={({ field }) => (
                            <>
                              <Form.Control
                                disabled={form.watch('jobRequestId')}
                                className='d-flex align-items-center justify-content-center'
                                {...field}
                                type='text'
                                placeholder="Enter instruction's name"
                              />

                              {formErrors && formErrors.tasks?.[i]?.name?.message && (
                                <Form.Text className='text-danger'>
                                  {formErrors.tasks?.[i]?.name?.message}
                                </Form.Text>
                              )}
                            </>
                          )}
                        />
                      </td>
                      <td>
                        <Controller
                          key={_field.id}
                          name={`tasks.${i}.description`}
                          control={form.control}
                          render={({ field }) => (
                            <>
                              <Form.Control
                                disabled={form.watch('jobRequestId')}
                                className='d-flex align-items-center justify-content-center'
                                {...field}
                                as='textarea'
                                placeholder="Enter instruction's description"
                              />

                              {formErrors && formErrors.tasks?.[i]?.description?.message && (
                                <Form.Text className='text-danger'>
                                  {formErrors.tasks?.[i]?.description?.message}
                                </Form.Text>
                              )}
                            </>
                          )}
                        />
                      </td>
                      <td>
                        <Controller
                          key={_field.id}
                          name={`tasks.${i}.isCompleted`}
                          control={form.control}
                          render={({ field }) => (
                            <Form.Check
                              disabled={form.watch('jobRequestId')}
                              className='d-flex align-items-center justify-content-center'
                              {...field}
                              checked={field.value}
                              type='checkbox'
                            />
                          )}
                        />
                      </td>
                      <td>
                        <Controller
                          key={_field.id}
                          name={`tasks.${i}.isPriority`}
                          control={form.control}
                          render={({ field }) => (
                            <Form.Check
                              disabled={form.watch('jobRequestId')}
                              className='d-flex align-items-center justify-content-center'
                              {...field}
                              checked={field.value}
                              type='checkbox'
                            />
                          )}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Form>

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

export default TaskForm;
