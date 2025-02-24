import { Form, OverlayTrigger, Tooltip } from 'react-bootstrap';

//TODO: Make this as FormLabel, has props of isRequired, label, id
export const RequiredLabel = ({ label, id }) => (
  <Form.Label htmlFor={id}>
    {label}
    <OverlayTrigger placement='top' overlay={<Tooltip>This field is required</Tooltip>}>
      <span className='text-danger' style={{ marginLeft: '4px', cursor: 'help' }}>
        *
      </span>
    </OverlayTrigger>
  </Form.Label>
);
