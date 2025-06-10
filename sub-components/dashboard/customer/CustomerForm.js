import React, { useState, useEffect, useCallback } from 'react';
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
  Badge,
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
  Trash,
  HouseFill,
  PeopleFill,
  PlusCircleFill,
  PencilSquare,
  ArrowLeftShort,
  Eye,
} from 'react-bootstrap-icons';
import { useRouter } from 'next/router';
import ContentHeader from '@/components/dashboard/ContentHeader';
import { GeeksSEO } from 'widgets';
import { customerDataFetchers } from '@/utils/customers/dataFetchers';
import { db } from '@/firebase';
import {
  doc,
  setDoc,
  serverTimestamp,
  limit,
  query,
  collection,
  onSnapshot,
  deleteDoc,
  runTransaction,
  getDocs,
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import { getCookie } from 'cookies-next';
import { Toaster } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { isProd } from '@/constants/environment';
import Select from 'react-select';
import { useAuth } from '@/contexts/AuthContext';
import Swal from 'sweetalert2';

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
  const auth = useAuth();

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationOptions, setLocationOptions] = useState({ data: [], isLoading: true, isError: false }); //prettier-ignore

  const [toDeleteContact, setToDeleteContact] = useState([]);

  // Add this state to track the latest customer ID
  const [latestCustomerId, setLatestCustomerId] = useState('C000000');
  const [latestContactId, setLatestContactId] = useState('CP000000');

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

  const generateNextContactId = (currentId) => {
    const numericPart = parseInt(currentId.substring(2));
    const nextNumber = numericPart + 1;
    return `CP${String(nextNumber).padStart(5, '0')}`;
  };

  useEffect(() => {
    const constraints = [];

    if (!isProd) {
      const devQueryConstraint = [limit(100)];
      devQueryConstraint.forEach((constraint) => constraints.push(constraint));
    }

    const q = query(collection(db, 'locations'), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          setLocationOptions({
            data: snapshot.docs.map((doc) => {
              const data = doc.data();

              return {
                value: doc.id,
                label: `${data.siteId} - ${data.siteName}`,
                ...data,
              };
            }),
          });
        } else {
          setLocationOptions({ data: [], isLoading: false, isError: false });
        }
      },
      (err) => {
        console.error(err.message);
        setLocationOptions({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, []);

  //* query latest contactId
  useEffect(() => {
    const q = query(collection(db, 'contacts'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const lastDocId = snapshot.docs.pop().id;
          setLatestContactId(lastDocId);
        }
      },
      (err) => {
        console.error(err.message);
        toast.error(err.message);
      }
    );

    return () => unsubscribe();
  }, []);

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

    console.log({ data });

    // TODO get from contacts not from contactss
    if (data) {
      setFormData({
        ...data,
        ...(data?.contacts && Array.isArray(data.contacts)
          ? { contacts: data.contacts }
          : { contacts: [] }),
        locations: data?.locations && Array.isArray(data.locations) ? data.locations : [],
      });
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
    contacts: [
      {
        id: '',
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        isDefault: true,
        additionalInformation: {},
      },
    ],

    locations: [],

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
    const tabs = ['basic', 'contact', 'contract', 'location'];
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
        locations: formData.locations.map((location) => ({
          isDefault: location.isDefault,
          siteId: location.siteId,
          siteName: location.siteName,
          mainAddress: location.mainAddress,
        })),
        contract: formData.contract,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      let currentId = latestContactId;
      const contacts = [];

      const contactsPromises = formData.contacts.map((contact) => {
        if (!contact.id) {
          contact.id = generateNextContactId(currentId);
          currentId = contact.id;
        }

        contacts.push(contact.id);

        const { id, ...contactData } = contact;

        return setDoc(
          doc(db, 'contacts', contact.id),
          {
            ...contactData,
            customerId: formData.customerId,
            customerName: formData.customerName,
            status: 'active',
            ...(!data && { createdAt: serverTimestamp(), createdBy: auth.currentUser }),
            updatedAt: serverTimestamp(),
            updatedBy: auth.currentUser,
          },
          { merge: true }
        );
      });

      let deleteContactPromises = [];

      if (toDeleteContact.length > 0) {
        const customerRef = doc(db, 'customers', formData.customerId);

        deleteContactPromises = runTransaction(db, async (transaction) => {
          //* in transaction read operation comes first
          //* throw err inside transaction makes make transaction fail and does not write to db

          //* delete contact from locations
          const q = query(collection(db, 'locations'));

          try {
            getDocs(q)
              .then(async (snapshot) => {
                if (!snapshot.empty) {
                  snapshot.docs.forEach((doc) => {
                    const locationContacts = doc.data().contacts;
                    const filteredContacts = locationContacts?.filter((contactId) => !toDeleteContact.includes(contactId)); // prettier-ignore

                    if (
                      locationContacts &&
                      locationContacts.length > 0 &&
                      filteredContacts.length > 0
                    ) {
                      transaction.update(doc.ref, { contacts: filteredContacts });
                    }
                  });
                }
              })
              .catch((err) => {
                throw err;
              });

            //* delete contact
            toDeleteContact.forEach((contactId) => {
              const contactRef = doc(db, 'contacts', contactId);
              transaction.delete(contactRef);
            });

            //* update customer
            transaction.update(customerRef, { contacts: formData.contacts });
          } catch (err) {
            throw err;
          }
        });
      }

      console.log({ formData, customerData, contacts }); //

      await Promise.all([
        ...contactsPromises,
        setDoc(doc(db, 'customers', formData.customerId), { ...customerData, contacts }),
        customerDataFetchers.refreshCustomersCache(),
        deleteContactPromises,
      ]);

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
  const handleAddContact = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      contacts: [
        ...prev.contacts,
        {
          id: '',
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          isDefault: false,
          additionalInformation: {},
        },
      ],
    }));
  }, [latestContactId]);

  const handleRemmovedContact = (index, id) => {
    if (id) {
      Swal.fire({
        title: 'Are you sure?',
        text: 'This is a saved contact. Deleting it will permanently remove it from the customer. This action cannot be undone, and all data associated with this contact will be unlinked/removed',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, remove',
        cancelButtonText: 'Cancel',
        customClass: {
          confirmButton: 'btn btn-primary rounded',
          cancelButton: 'btn btn-secondary rounded',
        },
      }).then((data) => {
        if (data.isConfirmed) {
          setToDeleteContact((prev) => [...prev, id]);

          setFormData((prev) => ({
            ...prev,
            contacts: prev.contacts.filter((_, i) => i !== index),
          }));
        }
      });

      return;
    }

    setFormData((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index),
    }));
  };

  const handleContactChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      contacts: prev.contacts.map((contact, i) => {
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
    if (formData.contacts.length === 0) return 0;

    const requiredFields = ['firstName', 'lastName', 'phone', 'email'];
    const totalFields = formData.contacts.length * requiredFields.length;
    let filledFields = 0;

    formData.contacts.forEach((contact) => {
      requiredFields.forEach((field) => {
        if (contact[field] && contact[field].trim() !== '') {
          filledFields++;
        }
      });
    });

    return Math.round((filledFields / totalFields) * 100);
  };

  const handleAddLocation = useCallback(() => {
    if (!selectedLocation) return;

    const isExist = formData.locations.find(
      (location) => location.siteId === selectedLocation.value
    );

    if (isExist) {
      toast.error('Location already selected');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      locations: [
        ...prev.locations,
        {
          isDefault: prev.locations.length === 0 ? true : false,
          mainAddress: selectedLocation?.additionalInformation?.locationCoordinates?.mainAddress || 'N/A', // prettier-ignore
          siteId: selectedLocation.value,
          siteName: selectedLocation?.siteName || 'N/A',
        },
      ],
    }));
    setSelectedLocation(null);
  }, [selectedLocation]);

  const handleRemoveLocation = useCallback(
    (id) => {
      setFormData((prev) => ({
        ...prev,
        locations: prev.locations.filter((location) => location.siteId !== id),
      }));
    },
    [selectedLocation]
  );

  return (
    <>
      <GeeksSEO title='Create Customer | VITAR Group' />

      <ContentHeader
        title={data?.customerId ? 'Edit Customer' : 'Create New Customer'}
        description='Add a new customer to your business network'
        infoText='Fill in the customer details including contact information and addresses. All fields marked with * are required.'
        badgeText='Customer Management'
        badgeText2={data?.customerId ? 'Edit Customer' : 'New Customer'}
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/dashboard',
            icon: <HouseFill className='me-2' size={14} />,
          },
          {
            text: 'Customers',
            link: '/customers',
            icon: <PeopleFill className='me-2' size={14} />,
          },
          {
            icon: <PlusCircleFill className='me-2' size={14} />,
            text: data ? data.customerId : 'Create Customer',
          },
        ]}
        actionButtons={[
          {
            text: 'Back',
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () => router.push(`/customers`),
          },
        ]}
        dropdownItems={
          data?.customerId
            ? [
                {
                  label: 'View Customer',
                  icon: Eye,
                  onClick: () => router.push(`/customers/view/${data.customerId}`),
                },
              ]
            : []
        }
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
                        <Nav.Item>
                          <Nav.Link
                            eventKey='location'
                            className='d-flex align-items-center gap-2 mb-2'
                          >
                            <Building size={18} />
                            <span>Location List</span>
                          </Nav.Link>
                        </Nav.Item>
                      </Nav>

                      {/* <div className='mt-4 p-3 bg-light rounded'>
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
                      </div> */}
                    </div>
                  </Col>

                  <Col md={9}>
                    <Tab.Content className='h-100'>
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

                      <Tab.Pane eventKey='contact' className='h-100'>
                        <Card className='border-0 shadow-sm mb-4 h-100'>
                          <Card.Body className='p-4 h-100'>
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

                            {formData.contacts.length > 0 ? (
                              formData.contacts.map((contact, index) => (
                                <Card key={index} className='border mb-4'>
                                  <Card.Header className='bg-light d-flex justify-content-between align-items-center'>
                                    <h6 className='mb-0'>
                                      <span className='me-2'>Contact #{index + 1}</span>

                                      {contact.isDefault && (
                                        <Badge className='me-2' bg='primary'>
                                          Default
                                        </Badge>
                                      )}

                                      {!contact.id ? (
                                        <Badge className='me-2' bg='secondary'>
                                          Unsaved
                                        </Badge>
                                      ) : (
                                        <Badge className='me-2' bg='info'>
                                          Saved
                                        </Badge>
                                      )}
                                    </h6>
                                    {!contact.isDefault && (
                                      <Button
                                        variant='link'
                                        className='text-danger p-0'
                                        onClick={() => handleRemmovedContact(index, contact.id)}
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
                                              handleContactChange(
                                                index,
                                                'firstName',
                                                e.target.value
                                              )
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
                                    </Row>
                                  </Card.Body>
                                </Card>
                              ))
                            ) : (
                              <div className='text-center mt-5 h-100'>
                                <h5 className='mb-1'>No contact added yet.</h5>
                                <p className='text-muted'>Click "Add Contact" to begin.</p>
                              </div>
                            )}
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

                      <Tab.Pane eventKey='location'>
                        <Card className='border-0 shadow-sm mb-4'>
                          <Card.Body className='p-4'>
                            <div className='d-flex column-gap-3 w-100 align-items-center'>
                              <Select
                                className='w-100'
                                inputId='location'
                                instanceId='location'
                                value={selectedLocation}
                                onChange={(option) => {
                                  setSelectedLocation(option);
                                }}
                                options={locationOptions.data}
                                placeholder="Search by location's id or name"
                                isDisabled={locationOptions.isLoading}
                                noOptionsMessage={() => 'No locations found'}
                              />

                              <Button size='sm' onClick={() => handleAddLocation()}>
                                Add
                              </Button>
                            </div>

                            <div
                              className='mt-5 d-flex flex-column rounded border border-primary px-2'
                              style={{ minHeight: '300px', maxHeight: '460px', overflow: 'auto' }}
                            >
                              {formData?.locations &&
                                formData?.locations.map((location, i) => (
                                  <div
                                    key={location.siteId}
                                    className={`d-flex p-3 justify-content-between align-items-center border-primary ${
                                      i === formData.locations.length - 1 ? '' : 'border-bottom'
                                    }`}
                                  >
                                    <div className='d-flex align-items-center gap-3'>
                                      <div className='d-flex flex-column'>
                                        <p className='mb-0'>
                                          <strong className='pe-1'>ID:</strong>
                                          <span className='text-muted'>{location?.siteId}</span>
                                        </p>
                                        <p className='mb-0'>
                                          <strong className='pe-1'>NAME:</strong>
                                          <span className='text-muted'>{location?.siteName}</span>
                                        </p>
                                      </div>
                                    </div>

                                    <Button
                                      className='p-2'
                                      variant='danger'
                                      size='sm'
                                      onClick={() => handleRemoveLocation(location.siteId)}
                                    >
                                      <Trash size={18} />
                                    </Button>
                                  </div>
                                ))}
                            </div>
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
                        const tabs = ['basic', 'contact', 'contract', 'location'];
                        const currentIndex = tabs.indexOf(activeTab);
                        setActiveTab(tabs[currentIndex - 1]);
                      }}
                      className='d-flex align-items-center'
                    >
                      <ChevronLeft size={14} className='me-2' />
                      Previous
                    </Button>
                  )}

                  {activeTab !== 'location' ? (
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
