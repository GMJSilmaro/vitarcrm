import { Button, Form, OverlayTrigger, Row, Table, Tooltip } from 'react-bootstrap';
import { Plus, Trash } from 'react-bootstrap-icons';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';

const TaskForm = ({ isLoading, handleNext }) => {
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

  // console.log({ errors: formErrors });

  return (
    <Row>
      <Form>
        {/* <div className='mb-4'> {JSON.stringify(form.watch(), null, 2)}</div> */}

        <div className='d-flex justify-content-between align-items-center gap-2'>
          <div className='d-flex flex-column align-items-start gap-1'>
            <RequiredLabel label='Task Name' id='taskName' />

            {formErrors && formErrors.tasks?.message && (
              <Form.Text className='text-danger mt-0'>{formErrors.tasks?.message}</Form.Text>
            )}
          </div>

          <Button variant='primary' onClick={handleAddTask}>
            <Plus size={14} className='me-2' /> Add Task
          </Button>
        </div>

        {fields.length === 0 ? (
          <div className='text-center mt-3'>
            <h5 className='mb-1'>No task added yet.</h5>
            <p className='text-muted'>Click "Add Task" to begin.</p>
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
                <th className='text-center'>Task Complete</th>
                <th className='text-center'>Priority Task</th>
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
                            className='d-flex align-items-center justify-content-center'
                            {...field}
                            type='text'
                            placeholder='Enter task name'
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
                            className='d-flex align-items-center justify-content-center'
                            {...field}
                            as='textarea'
                            placeholder='Enter task description'
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

      <div className='mt-2 d-flex justify-content-end align-items-center'>
        <Button disabled={isLoading} type='button' className='mt-2' onClick={handleNext}>
          Next
        </Button>
      </div>
    </Row>
  );
};

export default TaskForm;
