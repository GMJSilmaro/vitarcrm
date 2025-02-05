import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Nav,
  Tab,
  OverlayTrigger,
  Tooltip,
  Spinner,
  Modal,
} from 'react-bootstrap';
import {
  House,
  People,
  Plus,
  Save,
  X,
  Building,
  Phone,
  Envelope,
  FileText,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  ExclamationCircle,
  PencilFill,
} from 'react-bootstrap-icons';
import { useRouter } from 'next/router';
import ContentHeader from '@/components/dashboard/ContentHeader';
import { GeeksSEO } from 'widgets';
import { customerDataFetchers } from '@/utils/customers/dataFetchers';
import { db } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { getCookie } from 'cookies-next';
import { Toaster } from 'react-hot-toast';

const CustomAlertModal = ({
  show,
  handleClose,
  title,
  message,
  type = 'success',
  showActions = false,
}) => {
  const router = useRouter();

  const handleCreateAnother = () => {
    handleClose();
    window.location.reload();
  };

  const handleViewList = () => {
    handleClose();
    router.push('/customers');
  };

  return (
    <Modal show={show} onHide={handleClose} centered className='custom-alert-modal'>
      <Modal.Body className='text-center p-4'>
        <CheckCircle size={48} className='text-success mb-3' />
        <h5 className='mb-3'>{title}</h5>
        <p className='text-muted mb-4'>{message}</p>

        {showActions ? (
          <div className='d-flex justify-content-center gap-3'>
            <Button variant='outline-primary' onClick={handleCreateAnother} className='px-4'>
              Create Another
            </Button>
            <Button variant='primary' onClick={handleViewList} className='px-4'>
              View Customer List
            </Button>
          </div>
        ) : (
          <Button
            variant={type === 'success' ? 'success' : 'danger'}
            onClick={handleClose}
            className='px-4'
          >
            Close
          </Button>
        )}
      </Modal.Body>
    </Modal>
  );
};

const CustomerForm = ({ data }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');

  // Add this state to track the latest customer ID
  const [latestCustomerId, setLatestCustomerId] = useState('C000000');

  // Get user info from cookies
  const userEmail = getCookie('userEmail');
  const userId = getCookie('userId');
  const workerId = getCookie('workerId');

  // Function to generate next customer ID
  const generateNextCustomerId = (currentId) => {
    const numericPart = parseInt(currentId.substring(1));
    const nextNumber = numericPart + 1;
    return `C${String(nextNumber).padStart(6, '0')}`;
  };

  useEffect(() => {
    const fetchLatestCustomerId = async () => {
      try {
        const nextId = await customerDataFetchers.getNextCustomerId();

        setFormData((prev) => ({
          ...prev,
          customerId: nextId,
        }));
      } catch (error) {
        console.error('Error fetching customer ID:', error);
        setFormData((prev) => ({
          ...prev,
          customerId: 'C000001',
        }));
      }
    };

    if (data) {
      console.log('aaaaa');
      setFormData({
        ...data,
        ...(data?.customerContact && Array.isArray(data.customerContact)
          ? { customerContact: data.customerContact }
          : {
              customerContact: [
                {
                  firstName: '',
                  lastName: '',
                  phone: '',
                  email: '',
                  role: '',
                  isDefault: true, // First contact is default
                },
              ],
            }),
      });

      console.log('customerContact', data?.customerContact && Array.isArray(data.customerContact));
    } else fetchLatestCustomerId();
  }, [data]);

  // Update formData to handle multiple contacts
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    tinNumber: '',
    brnNumber: '',
    status: 'active',

    // Change single contact to contacts array
    customerContact: [
      {
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        role: '',
        isDefault: true, // First contact is default
      },
    ],

    contract: {
      status: 'N',
      startDate: '',
      endDate: '',
    },
  });

  // Add state to track form completion
  const [formCompletion, setFormCompletion] = useState({
    basic: 0,
    contact: 0,
    contract: 0,
  });

  // Function to calculate basic tab completion
  const calculateBasicTabProgress = () => {
    const requiredFields = {
      customerName: formData.customerName,
      status: formData.status,
    };

    const filledFields = Object.values(requiredFields).filter(
      (value) => value && value.trim() !== ''
    ).length;

    return Math.round((filledFields / Object.keys(requiredFields).length) * 100);
  };

  // Function to update progress when fields change
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.split('.').length > 1) {
      if (name === 'contract.status' && value === 'N') {
        setFormData((prev) => ({
          ...prev,
          contract: {
            status: 'N',
            startDate: null,
            endDate: null,
          },
        }));
      } else {
        //* support 2nd level nested field
        const fieldName = name.split('.')[0];
        const subFieldName = name.split('.')[1];

        setFormData((prev) => ({
          ...prev,
          [fieldName]: {
            ...prev[fieldName],
            [subFieldName]: value,
          },
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Update basic tab progress whenever fields change
    const basicProgress = calculateBasicTabProgress();
    setFormCompletion((prev) => ({
      ...prev,
      basic: basicProgress,
    }));
  };

  // Function to calculate overall progress
  const calculateOverallProgress = () => {
    const tabWeights = {
      basic: 0.25, // 25% weight
      contact: 0.25, // 25% weight
      contract: 0.5, // 25% weight
    };

    const weightedProgress = Object.entries(formCompletion).reduce((total, [tab, progress]) => {
      return total + progress * tabWeights[tab];
    }, 0);

    return Math.round(weightedProgress);
  };

  // Handle tab change
  const handleTabChange = (newTab) => {
    // Calculate progress before changing tabs
    if (activeTab === 'basic') {
      const basicProgress = calculateBasicTabProgress();
      setFormCompletion((prev) => ({
        ...prev,
        basic: basicProgress,
      }));
    }
    setActiveTab(newTab);
  };

  // Update the Next button click handler
  const handleNextClick = () => {
    const tabs = ['basic', 'contact', 'contract'];
    const currentIndex = tabs.indexOf(activeTab);

    // Update progress for current tab before moving to next
    if (activeTab === 'basic') {
      const basicProgress = calculateBasicTabProgress();
      setFormCompletion((prev) => ({
        ...prev,
        basic: basicProgress,
      }));
    }

    handleTabChange(tabs[currentIndex + 1]);
  };

  // Form validation
  const validateForm = () => {
    const errors = {};

    // Customer ID validation
    if (!/^[A-Z0-9]+$/.test(formData.customerId)) {
      errors.customerId = 'Customer ID must contain only uppercase letters and numbers';
    }

    // TIN Number validation (if provided)
    if (formData.TINNumber && !/^\d+$/.test(formData.TINNumber)) {
      errors.TINNumber = 'TIN Number must contain only numbers';
    }

    // BRN Number validation (if provided)
    if (formData.BRNNumber && !/^\d+$/.test(formData.BRNNumber)) {
      errors.BRNNumber = 'BRN Number must contain only numbers';
    }

    // Phone number validation
    if (!/^\+?[\d\s-]+$/.test(formData.contactPhone)) {
      errors.contactPhone = 'Please enter a valid phone number';
    }

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      errors.contactEmail = 'Please enter a valid email address';
    }

    return errors;
  };

  // Add these state variables
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'success',
  });
  // Update the handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const customerData = {
        customerId: formData.customerId,
        customerName: formData.customerName.trim(),
        status: formData.status,
        tinNumber: formData.tinNumber?.trim() || '',
        brnNumber: formData.brnNumber?.trim() || '',
        customerContact: formData.customerContact.map((contact) => ({
          firstName: contact.firstName.trim(),
          lastName: contact.lastName.trim(),
          phone: contact.phone.trim(),
          email: contact.email.trim(),
          isDefault: contact.isDefault,
          role: contact.role.trim(),
        })),
        contract: formData.contract,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.log({ formData, customerData }); //

      await setDoc(doc(db, 'customers', formData.customerId), customerData);
      await customerDataFetchers.refreshCustomersCache();

      // Simple success toast
      toast.success(`Customer ${data ? 'updated' : 'created'} successfully!`);
      // Show modal with options
      setAlertConfig({
        title: 'Success!',
        message: `Your customer, ${formData.customerName}, with ID ${
          formData.customerId
        } has been successfully ${
          data ? 'updated' : 'created'
        }. You can now view the customer list or create another customer.`,
        type: 'success',
        showActions: true, // Add this to control showing action buttons
      });
      setShowAlert(true);
    } catch (err) {
      console.error('Error creating customer:', err);
      setAlertConfig({
        title: 'Error',
        message: `Failed to create customer: ${err.message}`,
        type: 'error',
        showActions: false,
      });
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  // Required field with asterisk tooltip
  const RequiredFieldWithTooltip = ({ label }) => (
    <Form.Label>
      {label}
      <OverlayTrigger placement='top' overlay={<Tooltip>This field is required</Tooltip>}>
        <span className='text-danger' style={{ marginLeft: '4px', cursor: 'help' }}>
          *
        </span>
      </OverlayTrigger>
    </Form.Label>
  );

  // Optional field with question mark tooltip
  const OptionalFieldWithTooltip = ({ label, tooltipText }) => (
    <Form.Label>
      {label}
      <OverlayTrigger
        placement='top'
        overlay={
          <Tooltip>
            <div className='text-start'>{tooltipText}</div>
          </Tooltip>
        }
      >
        <i
          className='fe fe-help-circle text-muted ms-1'
          style={{ cursor: 'pointer', fontSize: '14px' }}
        >
          ?
        </i>
      </OverlayTrigger>
    </Form.Label>
  );

  // Regular field without any tooltip
  const RegularField = ({ label }) => <Form.Label>{label}</Form.Label>;

  // Update the progress bar styles
  const progressBarStyles = {
    backgroundColor: '#f8d7da', // Light red background
    height: '8px',
    borderRadius: '4px',
    overflow: 'hidden',
    marginTop: '8px',
  };

  const progressFillStyles = {
    backgroundColor: '#1e40a6', // Bootstrap red
    height: '100%',
    width: '0%',
    borderRadius: '4px',
    transition: 'width 0.3s ease-in-out',
  };

  // Add these functions for contact management
  const handleAddContact = () => {
    setFormData((prev) => ({
      ...prev,
      customerContact: [
        ...prev.customerContact,
        {
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          isDefault: false,
          role: '',
        },
      ],
    }));
  };

  const handleRemoveContact = (index) => {
    setFormData((prev) => ({
      ...prev,
      customerContact: prev.customerContact.filter((_, i) => i !== index),
    }));
  };

  const handleContactChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      customerContact: prev.customerContact.map((contact, i) => {
        if (i === index) {
          return {
            ...contact,
            [field]: value,
          };
        }
        return contact;
      }),
    }));

    // Update contact progress
    const contactProgress = calculateContactProgress();
    setFormCompletion((prev) => ({
      ...prev,
      contact: contactProgress,
    }));
  };

  // Function to calculate contact completion
  const calculateContactProgress = () => {
    if (formData.customerContact.length === 0) return 0;

    const requiredFields = ['firstName', 'lastName', 'phone', 'email'];
    const totalFields = formData.customerContact.length * requiredFields.length;
    let filledFields = 0;

    formData.customerContact.forEach((contact) => {
      requiredFields.forEach((field) => {
        if (contact[field] && contact[field].trim() !== '') {
          filledFields++;
        }
      });
    });

    return Math.round((filledFields / totalFields) * 100);
  };

  return (
    <>
      <GeeksSEO title='Create Customer | VITAR Group' />

      <ContentHeader
        title='Create New Customer'
        description='Add a new customer to your business network'
        infoText='Fill in the customer details including contact information and addresses. All fields marked with * are required.'
        badgeText='Customer Management'
        breadcrumbItems={[
          {
            icon: <House className='me-2' size={14} />,
            text: 'Dashboard',
            link: '/dashboard',
          },
          {
            icon: <People className='me-2' size={14} />,
            text: 'Customers',
            link: '/dashboard/customers/list',
          },
          {
            icon: <PencilFill className='me-2' size={14} />,
            text: data ? data.customerId : 'Create',
          },
        ]}
      />

      <Row>
        <Col md={12}>
          <Card className='border-0 shadow-sm'>
            <Card.Body className='p-4'>
              {error && (
                <Alert variant='danger' className='mb-4'>
                  {error}
                </Alert>
              )}

              <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
                <Row>
                  <Col md={3}>
                    <div className='sticky-top' style={{ top: '20px' }}>
                      <Nav variant='pills' className='flex-column'>
                        <Nav.Item>
                          <Nav.Link
                            eventKey='basic'
                            className='d-flex align-items-center gap-2 mb-2'
                          >
                            <Building size={18} />
                            <span>Basic Information</span>
                          </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                          <Nav.Link
                            eventKey='contact'
                            className='d-flex align-items-center gap-2 mb-2'
                          >
                            <Phone size={18} />
                            <span>Contact Details</span>
                          </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                          <Nav.Link
                            eventKey='contract'
                            className='d-flex align-items-center gap-2 mb-2'
                          >
                            <FileText size={18} />
                            <span>Contract Information</span>
                          </Nav.Link>
                        </Nav.Item>
                      </Nav>

                      <div className='mt-4 p-3 bg-light rounded'>
                        <h6 className='mb-2'>Form Progress</h6>
                        <div style={progressBarStyles}>
                          <div
                            style={{
                              ...progressFillStyles,
                              width: `${calculateOverallProgress()}%`,
                            }}
                          />
                        </div>
                        <small className='text-muted mt-2 d-block'>
                          {calculateOverallProgress()}% Complete
                        </small>
                      </div>
                    </div>
                  </Col>

                  <Col md={9}>
                    <Tab.Content>
                      <Tab.Pane eventKey='basic'>
                        <Card className='border-0 shadow-sm mb-4'>
                          <Card.Body className='p-4'>
                            <h5 className='mb-4'>Basic Information</h5>
                            <Row>
                              <Col md={6}>
                                <Form.Group className='mb-3'>
                                  <RequiredFieldWithTooltip label='Customer ID' />
                                  <Form.Control
                                    type='text'
                                    name='customerId'
                                    value={formData.customerId}
                                    readOnly
                                    style={{ backgroundColor: '#f8f9fa' }}
                                  />
                                  <Form.Text className='text-muted'>
                                    Auto-generated customer ID
                                  </Form.Text>
                                </Form.Group>
                              </Col>

                              <Col md={6}>
                                <Form.Group className='mb-3'>
                                  <RequiredFieldWithTooltip label='Customer Name' />
                                  <Form.Control
                                    type='text'
                                    name='customerName'
                                    value={formData.customerName}
                                    onChange={handleChange}
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group className='mb-3'>
                                  <Form.Label>TIN Number</Form.Label>
                                  <OverlayTrigger
                                    placement='right'
                                    overlay={
                                      <Tooltip id='tin-tooltip'>
                                        <div className='text-start'>
                                          <strong>Tax Identification Number:</strong>
                                          <br />
                                          • Optional field
                                          <br />• Used for tax documentation
                                        </div>
                                      </Tooltip>
                                    }
                                  >
                                    <i
                                      className='fe fe-help-circle text-muted ms-1'
                                      style={{ cursor: 'pointer' }}
                                    ></i>
                                  </OverlayTrigger>
                                  <Form.Control
                                    type='text'
                                    name='tinNumber'
                                    value={formData.tinNumber}
                                    onChange={handleChange}
                                  />
                                </Form.Group>
                              </Col>

                              <Col md={6}>
                                <Form.Group className='mb-3'>
                                  <Form.Label>BRN Number</Form.Label>
                                  <OverlayTrigger
                                    placement='right'
                                    overlay={
                                      <Tooltip id='tin-tooltip'>
                                        <div className='text-start'>
                                          <strong>Business Registration Number:</strong>
                                          <br />
                                          • Optional field
                                          <br />• Used for tax documentation
                                        </div>
                                      </Tooltip>
                                    }
                                  >
                                    <i
                                      className='fe fe-help-circle text-muted ms-1'
                                      style={{ cursor: 'pointer' }}
                                    ></i>
                                  </OverlayTrigger>
                                  <Form.Control
                                    type='text'
                                    name='brnNumber'
                                    value={formData.brnNumber}
                                    onChange={handleChange}
                                  />
                                </Form.Group>
                              </Col>

                              <Col md={6}>
                                <Form.Group className='mb-3'>
                                  <RequiredFieldWithTooltip label='Status' />
                                  <Form.Select
                                    name='status'
                                    value={formData.status}
                                    onChange={handleChange}
                                  >
                                    <option value='active'>Active</option>
                                    <option value='inactive'>Inactive</option>
                                  </Form.Select>
                                </Form.Group>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      </Tab.Pane>

                      <Tab.Pane eventKey='contact'>
                        <Card className='border-0 shadow-sm mb-4'>
                          <Card.Body className='p-4'>
                            <div className='d-flex justify-content-between align-items-center mb-4'>
                              <h5 className='mb-0'>Contact Information</h5>
                              <Button
                                variant='outline-primary'
                                size='sm'
                                onClick={handleAddContact}
                              >
                                <Plus size={14} className='me-1' />
                                Add Contact
                              </Button>
                            </div>

                            {formData.customerContact.map((contact, index) => (
                              <Card key={index} className='border mb-4'>
                                <Card.Header className='bg-light d-flex justify-content-between align-items-center'>
                                  <h6 className='mb-0'>
                                    Contact {index + 1} {contact.isDefault && '(Default)'}
                                  </h6>
                                  {!contact.isDefault && (
                                    <Button
                                      variant='link'
                                      className='text-danger p-0'
                                      onClick={() => handleRemoveContact(index)}
                                    >
                                      <X size={20} />
                                    </Button>
                                  )}
                                </Card.Header>
                                <Card.Body>
                                  <Row>
                                    <Col md={6}>
                                      <Form.Group className='mb-3'>
                                        <RequiredFieldWithTooltip label='First Name' />
                                        <Form.Control
                                          type='text'
                                          value={contact.firstName}
                                          onChange={(e) =>
                                            handleContactChange(index, 'firstName', e.target.value)
                                          }
                                          required
                                        />
                                      </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                      <Form.Group className='mb-3'>
                                        <RequiredFieldWithTooltip label='Last Name' />
                                        <Form.Control
                                          type='text'
                                          value={contact.lastName}
                                          onChange={(e) =>
                                            handleContactChange(index, 'lastName', e.target.value)
                                          }
                                          required
                                        />
                                      </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                      <Form.Group className='mb-3'>
                                        <RequiredFieldWithTooltip label='Phone' />
                                        <Form.Control
                                          type='tel'
                                          value={contact.phone}
                                          onChange={(e) =>
                                            handleContactChange(index, 'phone', e.target.value)
                                          }
                                          required
                                        />
                                      </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                      <Form.Group className='mb-3'>
                                        <RequiredFieldWithTooltip label='Email' />
                                        <Form.Control
                                          type='email'
                                          value={contact.email}
                                          onChange={(e) =>
                                            handleContactChange(index, 'email', e.target.value)
                                          }
                                          required
                                        />
                                      </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                      <Form.Group className='mb-3'>
                                        <RequiredFieldWithTooltip label='Role' />
                                        <Form.Select
                                          value={contact.role}
                                          onChange={(e) =>
                                            handleContactChange(index, 'role', e.target.value)
                                          }
                                          required
                                        >
                                          <option value=''>Select Role</option>
                                          <option value='Director'>Director</option>
                                          <option value='Manager'>Manager</option>
                                          <option value='Supervisor'>Supervisor</option>
                                          <option value='Administrator'>Administrator</option>
                                          <option value='Coordinator'>Coordinator</option>
                                          <option value='Other'>Other</option>
                                        </Form.Select>
                                      </Form.Group>
                                    </Col>
                                  </Row>
                                </Card.Body>
                              </Card>
                            ))}
                          </Card.Body>
                        </Card>
                      </Tab.Pane>

                      <Tab.Pane eventKey='contract'>
                        <Card className='border-0 shadow-sm mb-4'>
                          <Card.Body className='p-4'>
                            <h5 className='mb-4'>Contract Details</h5>
                            <Row>
                              <Col md={4}>
                                <Form.Group className='mb-3'>
                                  <RequiredFieldWithTooltip label='Status' />
                                  <Form.Select
                                    name='contract.status'
                                    value={formData.contract.status}
                                    onChange={handleChange}
                                  >
                                    <option value='N'>No Contract</option>
                                    <option value='Y'>Has Contract</option>
                                  </Form.Select>
                                </Form.Group>
                              </Col>
                              {formData.contract.status === 'Y' && (
                                <>
                                  <Col md={4}>
                                    <Form.Group className='mb-3'>
                                      <RequiredFieldWithTooltip label='Contract Start Date' />
                                      <Form.Control
                                        type='date'
                                        name='contract.startDate'
                                        value={formData.contract.startDate}
                                        onChange={handleChange}
                                        required={formData.contract === 'Y'}
                                      />
                                    </Form.Group>
                                  </Col>
                                  <Col md={4}>
                                    <Form.Group className='mb-3'>
                                      <RequiredFieldWithTooltip label='Contract End Date' />
                                      <Form.Control
                                        type='date'
                                        name='contract.endDate'
                                        value={formData.contract.endDate}
                                        onChange={handleChange}
                                        required={formData.contract === 'Y'}
                                      />
                                    </Form.Group>
                                  </Col>
                                </>
                              )}
                            </Row>
                          </Card.Body>
                        </Card>
                      </Tab.Pane>
                    </Tab.Content>
                  </Col>
                </Row>
              </Tab.Container>

              {/* Form Actions */}
              <div className='d-flex justify-content-between mt-4'>
                <Button
                  variant='outline-danger'
                  onClick={() => router.push('/dashboard/customers/list')}
                  disabled={loading}
                  className='d-flex align-items-center'
                >
                  <X size={14} className='me-2' />
                  Cancel
                </Button>

                <div className='d-flex gap-2'>
                  {activeTab !== 'basic' && (
                    <Button
                      variant='outline-primary'
                      onClick={() => {
                        const tabs = ['basic', 'contact', 'contract'];
                        const currentIndex = tabs.indexOf(activeTab);
                        setActiveTab(tabs[currentIndex - 1]);
                      }}
                      className='d-flex align-items-center'
                    >
                      <ChevronLeft size={14} className='me-2' />
                      Previous
                    </Button>
                  )}

                  {activeTab !== 'contract' ? (
                    <Button
                      variant='primary'
                      onClick={handleNextClick}
                      disabled={activeTab === 'basic' && calculateBasicTabProgress() < 100}
                      className='d-flex align-items-center'
                    >
                      Next
                      <ChevronRight size={14} className='ms-2' />
                    </Button>
                  ) : (
                    <Button
                      variant='success'
                      onClick={handleSubmit}
                      disabled={loading}
                      className='d-flex align-items-center'
                    >
                      {loading ? (
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
                          {data ? 'Update Customer' : 'Create Customer'}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Toaster
        position='top-right'
        toastOptions={{
          duration: 3000,
          style: {
            background: '#ffffff',
            color: '#1f2937',
            padding: '16px',
            borderRadius: '4px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          },
        }}
      />

      <CustomAlertModal
        show={showAlert}
        handleClose={() => setShowAlert(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        showActions={alertConfig.showActions}
      />
    </>
  );
};

export default CustomerForm;
