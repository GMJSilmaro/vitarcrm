import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Row, Col, Card, Form, Button, Alert, Nav, Tab, OverlayTrigger, Tooltip, Badge, Collapse, Spinner, Modal } from 'react-bootstrap';
import { House, People, Plus, Save, X, Building, Phone, Envelope, FileText, ChevronLeft, ChevronRight, CheckCircle, XCircle, ExclamationCircle } from 'react-bootstrap-icons';
import { useRouter } from 'next/router';
import ContentHeader from '@/components/dashboard/ContentHeader';
import { GeeksSEO } from 'widgets';
import axios from 'axios';
import { db } from '@/firebase';
import { 
  collection, 
  getDocs,
  query,
  where,
  doc,
  setDoc,
  serverTimestamp,
  arrayUnion,
  getDoc,
  limit,
  orderBy,
  startAt,
  endAt,
  addDoc,
  updateDoc
} from 'firebase/firestore';
import { dataFetchers } from '@/utils/dataFetchers';
import toast, { Toaster } from 'react-hot-toast';

import debounce from 'lodash/debounce';

import { getCookie } from 'cookies-next';


const API_ENDPOINT = 'https://www.apicountries.com/countries';

const CUSTOMERS_CACHE_KEY = 'vitar_customers_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

const CustomAlertModal = ({ show, handleClose, title, message, type = 'success', showActions = false }) => {
  const router = useRouter();
  const handleCreateAnother = () => {
    handleClose();
    window.location.reload();
  };

  const handleViewList = () => {
    handleClose();
    router.push('/dashboard/locations/list');
  };

  return (
    <Modal 
      show={show} 
      onHide={handleClose}
      centered
      className="custom-alert-modal"
    >
      <Modal.Body className="text-center p-4">
        <CheckCircle size={48} className="text-success mb-3" />
        <h5 className="mb-3">{title}</h5>
        <p className="text-muted mb-4">{message}</p>
        
        {showActions ? (
          <div className="d-flex justify-content-center gap-3">
            <Button 
              variant="outline-primary"
              onClick={handleCreateAnother}
              className="px-4"
            >
              Create Another
            </Button>
            <Button 
              variant="primary"
              onClick={handleViewList}
              className="px-4"
            >
              View Location List
            </Button>
          </div>
        ) : (
          <Button 
            variant={type === 'success' ? 'success' : 'danger'}
            onClick={handleClose}
            className="px-4"
          >
            Close
          </Button>
        )}
      </Modal.Body>
    </Modal>
  );
};

const CreateLocations = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [isAddressesCollapsed, setIsAddressesCollapsed] = useState(false);
  // Add this state to track the latest customer ID
  const [latestLocationId, setLatestLocationId] = useState('S000000');

  // Replace the mock customers state with real Firebase fetching
  const [customers, setCustomers] = useState([]);

  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Add these at the top with other state declarations
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const [formCompletion, setFormCompletion] = useState({
    basic: 0,
    address: 0,
    contact: 0
  });

    // Move the contact loading state to component level
    const [contactLoading, setContactLoading] = useState(false);


   // Update formData to handle multiple contacts
   const [formData, setFormData] = useState({
    locationID: '',
  locationName: '',
  customerId: '',
  customerName: '',
  customerType: '',
  status: '',
  addresses: [{
    street1: '',
    street2: '',
    street3: '',
    city: '',
    postcode: '',
    country: '',
    isDefault: true,
    isBilling: false,
    isShipping: false
  }],
  additionalAddresses: [], // Same structure as addresses
  contacts: [{
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    isDefault: true
  }],
  operatingHours: '',
  notes: '',
  tags: []
  });

  // Add these state variables at the top with your other states
  const [availableContacts, setAvailableContacts] = useState([]);
  const [isAddingNewContact, setIsAddingNewContact] = useState(false);
  const [newContactData, setNewContactData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  // Function to generate next customer ID
  const generateNextLocationId = (currentId) => {
    const numericPart = parseInt(currentId.substring(1));
    const nextNumber = numericPart + 1;
    return `S${String(nextNumber).padStart(6, '0')}`;
  };
  
  // Update the location ID fetch
  useEffect(() => {
    const fetchLocationId = async () => {
      try {
        const nextId = await dataFetchers.getNextLocationId();
        setLatestLocationId(nextId);
        setFormData(prev => ({
          ...prev,
          locationID: nextId
        }));
      } catch (error) {
        setError('Failed to generate location ID');
      }
    };
  
    fetchLocationId();
  }, []);



  // Add these functions for contact management
  const handleAddContact = () => {
    setFormData(prev => ({
      ...prev,
      contacts: [
        ...prev.contacts,
        {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          isDefault: prev.contacts.length === 0
        }
      ]
    }));
  };

  const handleRemoveContact = (index) => {
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index)
    }));
  };


    // Function to calculate overall progress
    const calculateOverallProgress = () => {
      const tabWeights = {
        basic: 0.25,    // 34% weight
        address: 0.25,  // 33% weight
        contact: 0.50   // 33% weight
      };
  
      const weightedProgress = Object.entries(formCompletion).reduce((total, [tab, progress]) => {
        return total + (progress * tabWeights[tab]);
      }, 0);
      
  
      return Math.round(weightedProgress);
    };

  // Add these handler functions for address management
  const handleAddAddress = () => {
    setFormData(prev => ({
      ...prev,
      addresses: [
        ...prev.addresses,
        {
          street1: '',
          street2: '',
          street3: '',
          city: '',
          postcode: '',
          country: '',
          isDefault: false,
          isBilling: false,
          isShipping: false
        }
      ]
    }));
  };

  const handleRemoveAddress = (index) => {
    if (formData.addresses[index].isDefault) {
      return; // Prevent removing default address
    }
    
    setFormData(prev => ({
      ...prev,
      addresses: prev.addresses.filter((_, i) => i !== index)
    }));
  };

  const handleAddressChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      addresses: prev.addresses.map((address, i) => {
        if (i === index) {
          return {
            ...address,
            [field]: value
          };
        }
        return address;
      })
    }));
    
    // Update address progress
    const addressProgress = calculateAddressProgress();
    setFormCompletion(prev => ({
      ...prev,
      address: addressProgress
    }));
  };

    // Update your contact change handler
    const handleContactChange = (index, contactId) => {
      if (!contactId) return;
  
      const selectedContact = availableContacts.find(c => c.id === contactId);
      if (!selectedContact) return;
  
      setFormData(prev => ({
        ...prev,
        contacts: prev.contacts.map((contact, i) => 
          i === index ? {
            ...selectedContact,
            isDefault: contact.isDefault
          } : contact
        )
      }));

      const contactProgress = calculateContactProgress();
      setFormCompletion(prev => ({
        ...prev,
        contact: contactProgress
      }));
    };
  

  // Update the address progress calculation
  const calculateAddressProgress = () => {
    const requiredFields = ['street1', 'city', 'postcode', 'country'];
    let totalFields = formData.addresses.length * requiredFields.length;
    let filledFields = 0;

    formData.addresses.forEach(address => {
      requiredFields.forEach(field => {
        if (address[field] && address[field].trim() !== '') {
          filledFields++;
        }
      });
    });

    return Math.round((filledFields / totalFields) * 100);
  };

  
  // Function to calculate contact completion
  const calculateContactProgress = () => {
    if (formData.contacts.length === 0) return 0;

    const requiredFields = ['firstName', 'lastName', 'phone', 'email'];
    const totalFields = formData.contacts.length * requiredFields.length;
    let filledFields = 0;

    formData.contacts.forEach(contact => {
      requiredFields.forEach(field => {
        if (contact[field] && contact[field].trim() !== '') {
          filledFields++;
        }
      });
    });

    return Math.round((filledFields / totalFields) * 100);
  };


  // Add new state for countries
  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(true);


  
  // Add useEffect to fetch countries when component mounts
  // useEffect(() => {
  //   const fetchCountries = async () => {
  //     setLoadingCountries(true);
  //     try {
  //       // Use our Next.js API route instead of calling the external API directly
  //       const response = await axios.get('/api/countries');
        
  //       const sortedCountries = response.data
  //         .map(country => ({
  //           country: country.alpha2Code,
  //           name: country.name
  //         }))
  //         .sort((a, b) => a.name.localeCompare(b.name));
          
  //       setCountries(sortedCountries);
  //     } catch (error) {
  //       console.error('Error fetching countries:', error);
  //       setCountries([
  //         { code: 'US', name: 'United States' },
  //         { code: 'GB', name: 'United Kingdom' },
  //         { code: 'CA', name: 'Canada' },
  //         { code: 'AU', name: 'Australia' },
  //         { code: 'NZ', name: 'New Zealand' }
  //       ]);
  //     } finally {
  //       setLoadingCountries(false);
  //     }
  //   };

  //   fetchCountries();
  // }, []);

  useEffect(() => {
    const fetchCountries = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          '/api/countries',
          {
            timeout: 5000, // 5 second timeout
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data && Array.isArray(response.data)) {
          const sortedCountries = response.data
            .map(country => ({
              country: country.country || '',
              name: country.name
            }))
            .filter(country => country.country && country.name) // Remove any entries without codes or names
            .sort((a, b) => a.name.localeCompare(b.name));

          setCountries(sortedCountries);
          setError(null);
        } else {
          throw new Error('Invalid API response format');
        }
      } catch (error) {
        console.error('Error fetching countries:', error);
        // Set fallback countries
        const fallbackCountries = [
          { country: 'US', name: 'United States' },
          { country: 'GB', name: 'United Kingdom' },
          { country: 'CA', name: 'Canada' },
          { country: 'AU', name: 'Australia' },
          { country: 'NZ', name: 'New Zealand' },
          { country: 'DE', name: 'Germany' },
          { country: 'FR', name: 'France' },
          { country: 'IT', name: 'Italy' },
          { country: 'ES', name: 'Spain' },
          { country: 'JP', name: 'Japan' }
        ];
        setError('Unable to fetch countries. Using fallback data.');
        setCountries(fallbackCountries);
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, []);
  // Add new handler for billing/shipping toggles
  const handleAddressTypeChange = (index, field) => {
    setFormData(prev => ({
      ...prev,
      addresses: prev.addresses.map((address, i) => {
        if (i === index) {
          return {
            ...address,
            [field]: !address[field]
          };
        }
        return address;
      })
    }));
  };

  // Add state to track collapsed state for each address
  const [collapsedAddresses, setCollapsedAddresses] = useState({});

  
  // Function to calculate basic tab completion
  const calculateBasicTabProgress = () => {
    const requiredFields = {
      locationName: formData.locationName,
      customerId: formData.customerId,
    };

    const filledFields = Object.values(requiredFields).filter(value => 
      value && value.trim() !== ''
    ).length;

    return Math.round((filledFields / Object.keys(requiredFields).length) * 100);
  };


  const isFormComplete = () => {
    // Check basic information
    const basicComplete = formData.locationID && 
      formData.locationName && 
      formData.customerId;
  
    // Check address (at least one complete address required)
    const addressComplete = formData.addresses.some(address => 
      address.street1 && 
      address.postcode && 
      address.country
    );
  
    // Check contacts (at least one complete contact required)
    const contactComplete = formData.contacts.some(contact => 
      contact.firstName && 
      contact.lastName && 
      contact.phone && 
      contact.email
    );
  
    return basicComplete && addressComplete && contactComplete;
  };


 

    // Required field with asterisk tooltip
    const RequiredFieldWithTooltip = ({ label }) => (
      <Form.Label>
        {label}
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip>This field is required</Tooltip>}
        >
          <span
            className="text-danger"
            style={{ marginLeft: "4px", cursor: "help" }}
          >
            *
          </span>
        </OverlayTrigger>
      </Form.Label>
    );
  

  // Add these near your other handler functions
  const handleAddNewContact = () => {
    setIsAddingNewContact(true);
    setNewContactData({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      isDefault: availableContacts.length === 0
    });
  };

  const handleNewContactChange = (field, value) => {
    setNewContactData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Function to generate location ID
  const generateLocationId = async () => {
    try {
      const locationsRef = collection(db, 'locations');
      const q = query(locationsRef, orderBy('siteId', 'desc'), limit(1));
      const snapshot = await getDocs(q);
      
      let nextId = 'S000001'; // Default starting ID
      
      if (!snapshot.empty) {
        const lastId = snapshot.docs[0].data().siteId;
        const lastNumber = parseInt(lastId.replace('S', ''));
        nextId = `S${String(lastNumber + 1).padStart(6, '0')}`;
      }
      
      return nextId;
    } catch (error) {
      console.error('Error generating location ID:', error);
      return null;
    }
  };

  // Add contact ID generation
  const generateContactId = async (customerId) => {
    try {
      // Get the last contact ID from contacts collection
      const contactsRef = collection(db, 'contacts');
      const q = query(contactsRef, orderBy('contactId', 'desc'), limit(1));
      const snapshot = await getDocs(q);
      
      let nextId = 'CP00001'; // Default starting ID
      
      if (!snapshot.empty) {
        const lastId = snapshot.docs[0].data().contactId;
        // Extract the number from the last ID and increment
        const lastNumber = parseInt(lastId.replace('CP', ''));
        nextId = `CP${String(lastNumber + 1).padStart(5, '0')}`;
      }
      
      return nextId;
    } catch (error) {
      console.error('Error generating contact ID:', error);
      return null;
    }
  };

  // Add this function to check for duplicate contacts
  const isDuplicateContact = (email) => {
    return availableContacts.some(contact => 
      contact.email.toLowerCase() === email.toLowerCase()
    );
  };


  // Update the contact save handler
  const handleSaveContact = async () => {
    // Set loading state
    setLoading(true);
    setContactLoading(true);
    
    try {
      const uid = getCookie('uid');
      const email = getCookie('email');
      const displayName = getCookie('displayName') || getCookie('workerID') || 'Admin';

      
      if (!formData.customerId) {
        toast.error('Please select a customer first');
        return;
      }

      if (!newContactData.firstName || !newContactData.lastName || !newContactData.email) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Generate contact ID
      const contactId = await generateContactId(formData.customerId);
      if (!contactId) {
        throw new Error('Failed to generate contact ID');
      }

      // Create contact data structure to match location's contact structure
      const contactData = {
        contactId,
        firstName: newContactData.firstName,
        lastName: newContactData.lastName,
        email: newContactData.email.toLowerCase(),
        phone: newContactData.phone || '',
        customerId: formData.customerId,
        customerName: formData.customerName,
        isDefault: formData.contacts.length === 0,
        additionalInformation: {},
        createdAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        createdBy: {
          uid,
          email,
          displayName
        },
        updatedAt: serverTimestamp(),
        updatedBy: {
          uid,
          email,
          displayName
        }
      };

      // Save to contacts collection
      const contactsRef = doc(db, 'contacts', contactId);
      await setDoc(contactsRef, contactData);

      // Update customer's contacts array
      const customerRef = doc(db, 'customers', formData.customerId);
      await updateDoc(customerRef, {
        contacts: arrayUnion(contactId)
      });

      // Format contact for form data
      const newContact = {
        id: contactId,
        contactId,
        firstName: newContactData.firstName,
        lastName: newContactData.lastName,
        email: newContactData.email,
        phone: newContactData.phone || '',
        isDefault: formData.contacts.length === 0
      };

      // Update available contacts
      setAvailableContacts(prev => [...prev, newContact]);

      // Update form data contacts
      setFormData(prev => ({
        ...prev,
        contacts: [
          ...prev.contacts.slice(0, -1),
          newContact
        ]
      }));

      // Clear form and hide it
      setNewContactData({
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
      });
      setShowNewContactForm(false);
      toast.success('Contact saved successfully');
    } catch (error) {
      console.error('Error saving contact:', error);
      toast.error('Failed to save contact: ' + error.message);
    } finally {
      setLoading(false);
      setContactLoading(false);
    }
  };

  // Add this handler function
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Update progress after field change
    if (activeTab === 'basic') {
      const basicProgress = calculateBasicTabProgress();
      setFormCompletion(prev => ({
        ...prev,
        basic: basicProgress
      }));
    }
  };

  // Add this effect to update available contacts when customer changes
  useEffect(() => {
    const loadCustomerContacts = async () => {
      if (!selectedCustomer?.id) {
        setAvailableContacts([]);
        return;
      }

      try {
        // Fetch contacts from Firestore
        const contactsRef = collection(db, 'customers', selectedCustomer.id, 'contacts');
        const contactsSnapshot = await getDocs(contactsRef);
        
        const contacts = contactsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          isDefault: doc.data().isDefault || false
        }));

        setAvailableContacts(contacts);
      } catch (error) {
        console.error('Error loading contacts:', error);
        toast.error('Failed to load customer contacts');
        setAvailableContacts([]);
      }
    };

    loadCustomerContacts();
  }, [selectedCustomer?.id]);

  // Add these states for search functionality
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const dropdownRef = useRef(null);

  // Add this effect to handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Optimized search function
  const debouncedSearch = useCallback(
    debounce(async (searchValue) => {
      const searchTerm = searchValue.trim();
      
      if (!searchTerm) {
        setFilteredCustomers(customers);
        return;
      }

      // Create uppercase and lowercase versions for case-insensitive search
      const searchTermLower = searchTerm.toLowerCase();
      const searchTermUpper = searchTerm.toUpperCase();
      const searchTermCapitalized = searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1).toLowerCase();

      // Always search locally first
      const localResults = customers.filter(customer => 
        customer.customerName?.toLowerCase().includes(searchTermLower)
      );

      if (localResults.length > 0) {
        console.log('Local search results:', localResults);
        setFilteredCustomers(localResults);
        return;
      }

      // If no local results, query Firestore
      try {
        setIsLoadingCustomers(true);
        
        // Try multiple case variations
        const promises = [
          // Lowercase search
          getDocs(query(
            collection(db, 'customers'),
            orderBy('customerName'),
            startAt(searchTermLower),
            endAt(searchTermLower + '\uf8ff'),
            limit(10)
          )),
          // Uppercase search
          getDocs(query(
            collection(db, 'customers'),
            orderBy('customerName'),
            startAt(searchTermUpper),
            endAt(searchTermUpper + '\uf8ff'),
            limit(10)
          )),
          // Capitalized search
          getDocs(query(
            collection(db, 'customers'),
            orderBy('customerName'),
            startAt(searchTermCapitalized),
            endAt(searchTermCapitalized + '\uf8ff'),
            limit(10)
          ))
        ];

        const snapshots = await Promise.all(promises);
        console.log(`Firestore read triggered by search: ${searchTerm}`);

        // Combine and deduplicate results
        const results = snapshots
          .flatMap(snapshot => 
            snapshot.docs.map(doc => ({
              id: doc.id,
              customerId: doc.data().customerId,
              customerName: doc.data().customerName,
              status: doc.data().status,
              locations: doc.data().locations || []
            }))
          )
          .filter((item, index, self) => 
            index === self.findIndex((t) => t.id === item.id)
          );

        console.log('Firestore search results:', results);
        setFilteredCustomers(results);

      } catch (error) {
        console.error('Search error:', error);
        toast.error('Search failed');
      } finally {
        setIsLoadingCustomers(false);
      }
    }, 300),
    [customers]
  );

  // Load more function
  const loadMore = async () => {
    if (!lastDoc || isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      const nextQuery = query(
        collection(db, 'customers'),
        where('status', '==', 'active'),
        orderBy('customerName'),
        startAfter(lastDoc),
        limit(20)
      );

      const snapshot = await getDocs(nextQuery);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);

      const newResults = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setFilteredCustomers(prev => [...prev, ...newResults]);
      setHasMore(snapshot.docs.length === 20);
    } catch (error) {
      console.error('Load more error:', error);
      toast.error('Failed to load more results');
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Update the search handler
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(true);
    debouncedSearch(value);
  };

  // Also update the initial load effect to include the where clause
  useEffect(() => {
    const loadInitialCustomers = async () => {
      console.log('Loading initial customers...');
      setIsLoadingCustomers(true);
      try {
        const customersRef = collection(db, 'customers');
        const q = query(
          customersRef,
          where('status', '==', 'active'), // Only get active customers
          orderBy('customerName'),
          limit(10)
        );
        
        const snapshot = await getDocs(q);
        const loadedCustomers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log('Initial customers loaded:', loadedCustomers);
        setCustomers(loadedCustomers);
        setFilteredCustomers(loadedCustomers);
      } catch (error) {
        console.error('Error loading initial customers:', error);
        toast.error('Failed to load customers');
      } finally {
        setIsLoadingCustomers(false);
      }
    };

    loadInitialCustomers();
  }, []);

  // Update the handleCustomerSelect function
  const handleCustomerSelect = async (customer) => {
    toast.dismiss();
    
    setShowDropdown(false);
    setFilteredCustomers([]);
    setSearchTerm(customer.customerName);
    
    try {
      // Always generate a new location ID
      const locationId = await generateLocationId();
      
      // Fetch customer contacts
      const contacts = await fetchCustomerContacts(customer.id);
      setAvailableContacts(contacts);

      // Update form data with new location ID
      setFormData(prev => ({
        ...prev,
        locationID: locationId,
        customerId: customer.id,
        customerName: customer.customerName,
        customerType: customer.customerType || 'Standard',
        contacts: [{
          id: '',
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          isDefault: true
        }]
      }));

      toast.success(
        `${customer.customerName}\n(${customer.customerId})\n• ${contacts.length} contact${contacts.length !== 1 ? 's' : ''}\n• ${customer.status}`,
        { duration: 3000 }
      );

    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load customer data: ' + error.message);
    }
  };

  // Update the renderCustomerItem function
  const renderCustomerItem = (customer) => {
    const locationCount = customer.locations?.length || 0;

    return (
      <div
        key={customer.id}
        className="dropdown-item customer-item"
        onClick={() => handleCustomerSelect(customer)}
      >
        <div className="d-flex justify-content-between align-items-center w-100">
          <div className="d-flex align-items-center customer-info">
            <span className="customer-id me-2">
              {customer.customerId}
            </span>
            <span className="customer-name text-truncate">
              {customer.customerName}
            </span>
          </div>
          {locationCount > 0 && (
            <Badge 
              bg="info" 
              className="location-badge ms-2 flex-shrink-0"
            >
              {locationCount} {locationCount === 1 ? 'location' : 'locations'}
            </Badge>
          )}
        </div>
      </div>
    );
  };


  // Add this function to calculate form progress
  const calculateFormProgress = () => {
    let totalPoints = 0;
    let earnedPoints = 0;

    // Basic Information (30 points)
    const basicFields = {
      locationName: formData.locationName?.trim() || '',
      customerId: formData.customerId?.trim() || ''
    };
    totalPoints += 30;
    const basicFieldsFilled = Object.values(basicFields).filter(Boolean).length;
    earnedPoints += Math.round((basicFieldsFilled / Object.keys(basicFields).length) * 30);

    // Address Details (40 points)
    if (formData.addresses?.length > 0) {
      const requiredAddressFields = {
        street1: formData.addresses[0].street1?.trim() || '',
        postcode: formData.addresses[0].postcode?.trim() || '',
        country: formData.addresses[0].country?.trim() || ''
      };
      totalPoints += 40;
      const addressFieldsFilled = Object.values(requiredAddressFields).filter(Boolean).length;
      earnedPoints += Math.round((addressFieldsFilled / Object.keys(requiredAddressFields).length) * 40);
    }

    // Contact Details (30 points)
    if (formData.contacts?.length > 0) {
      const requiredContactFields = {
        firstName: formData.contacts[0].firstName?.trim() || '',
        lastName: formData.contacts[0].lastName?.trim() || '',
        email: formData.contacts[0].email?.trim() || ''
      };
      totalPoints += 30;
      const contactFieldsFilled = Object.values(requiredContactFields).filter(Boolean).length;
      earnedPoints += Math.round((contactFieldsFilled / Object.keys(requiredContactFields).length) * 30);
    }

    return Math.round((earnedPoints / totalPoints) * 100) || 0;
  };

  // Handle location save
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'success',
    showActions: false
  });

  // Add these handlers for search and contacts
  const handleSearchClick = () => {
    setShowDropdown(true);
    if (searchTerm) {
      debouncedSearch(searchTerm);
    } else {
      setFilteredCustomers(customers);
    }
  };

    // Handle tab change
    const handleTabChange = (newTab) => {
      // Calculate progress before changing tabs
      if (activeTab === 'basic') {
        const basicProgress = calculateBasicTabProgress();
        setFormCompletion(prev => ({
          ...prev,
          basic: basicProgress
        }));
      }
      setActiveTab(newTab);
    };
  

    // Update the Next button click handler
    const handleNextClick = () => {
      const tabs = ['basic', 'address', 'contact'];
      const currentIndex = tabs.indexOf(activeTab);
      
      // Update progress for current tab before moving to next
      if (activeTab === 'basic') {
        const basicProgress = calculateBasicTabProgress();
        setFormCompletion(prev => ({
          ...prev,
          basic: basicProgress
        }));
      }
      
      handleTabChange(tabs[currentIndex + 1]);
    };

  // Function to fetch customer contacts
  const fetchCustomerContacts = async (customerId) => {
    try {
      if (!customerId) return [];
      
      // Query contacts collection for this customer's contacts
      const contactsRef = collection(db, 'contacts');
      const q = query(contactsRef, where('customerId', '==', customerId));
      const contactsSnapshot = await getDocs(q);
      
      return contactsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return [];
    }
  };

  // Update contact section JSX
  const [showNewContactForm, setShowNewContactForm] = useState(false);

  // Update the contact selection rendering to filter out already selected contacts
  const renderContactOptions = (currentContactIndex) => {
    return availableContacts
      .filter(contact => {
        // Show if not selected in other contacts or is the current selection
        return !formData.contacts.some((selected, index) => 
          selected.id === contact.id && index !== currentContactIndex
        );
      })
      .map(contact => (
        <option key={contact.id} value={contact.id}>
          {`${contact.firstName} ${contact.lastName} - ${contact.email}`}
        </option>
      ));
  };

  const renderContactSection = () => {
    return (
      <div className="site-contacts mb-4">
        {formData.contacts.map((contact, index) => (
          <Card key={index} className="mb-3">
            <Card.Header className="bg-light">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  Contact {index + 1} {index === 0 && "(Default)"}
                </h6>
                {index !== 0 && (
                  <Button
                    variant="link"
                    className="text-danger p-0"
                    onClick={() => handleRemoveContact(index)}
                  >
                    <X size={20} />
                  </Button>
                )}
              </div>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <RequiredFieldWithTooltip label="Contact Details" />
                <Form.Control.Feedback type="info">
                  If there's an existing contact from the customer, it will appear here in the select.
                </Form.Control.Feedback>
                <Form.Control
                  as="select"
                  value={contact.id || ''}
                  onChange={(e) => handleContactChange(index, e.target.value)}
                  required={index === 0}
                  isInvalid={!contact.id}
                >
                  <option value="">Select a contact</option>
                  {renderContactOptions(index)}
                </Form.Control>
                <Form.Control.Feedback type="invalid">
                  Please select a contact.
                </Form.Control.Feedback>
           
              </Form.Group>

              {index === formData.contacts.length - 1 && (
                <div className="mt-3">
                  <Button
                    variant="link"
                    className="p-0 text-primary"
                    onClick={() => setShowNewContactForm(true)}
                  >
                    + New Contact
                  </Button>
                </div>
              )}

              {showNewContactForm && index === formData.contacts.length - 1 && (
                <div className="mt-3 p-3 border rounded bg-light">
                  <h6 className="mb-3">New Contact Details</h6>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>First Name *</Form.Label>
                        <Form.Control
                          type="text"
                          value={newContactData.firstName}
                          onChange={(e) => setNewContactData(prev => ({
                            ...prev,
                            firstName: e.target.value
                          }))}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Last Name *</Form.Label>
                        <Form.Control
                          type="text"
                          value={newContactData.lastName}
                          onChange={(e) => setNewContactData(prev => ({
                            ...prev,
                            lastName: e.target.value
                          }))}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Email *</Form.Label>
                        <Form.Control
                          type="email"
                          value={newContactData.email}
                          onChange={(e) => setNewContactData(prev => ({
                            ...prev,
                            email: e.target.value
                          }))}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Phone</Form.Label>
                        <Form.Control
                          type="tel"
                          value={newContactData.phone}
                          onChange={(e) => setNewContactData(prev => ({
                            ...prev,
                            phone: e.target.value
                          }))}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <div className="d-flex gap-2 justify-content-end">
                    <Button
                      variant="light"
                      size="sm"
                      onClick={() => {
                        setShowNewContactForm(false);
                        setNewContactData({
                          firstName: '',
                          lastName: '',
                          email: '',
                          phone: ''
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveContact}
                      disabled={loading || !newContactData.firstName || !newContactData.lastName || !newContactData.email}
                    >
                      {loading && (
                      <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                      )}
                      Save Contact
                    </Button>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        ))}

      </div>
    );
  };

  
  const handleSaveLocation = async () => {
    try {
      // Get user data from cookies
      const uid = getCookie('uid');
      const email = getCookie('email');
      const displayName = getCookie('displayName') || getCookie('workerID') || 'Admin';

      if (!uid || !email) {
        toast.error('Authentication data not found. Please login again.');
        router.push('/auth/signin');
        return;
      }

      // Validate required fields
      if (!isFormComplete()) {
        toast.error('Please fill in all required fields');
        return;
      }

      setLoading(true);

      const locationData = {
        siteId: formData.locationID,
        siteName: formData.locationName,
        customerId: formData.customerId,
        customerName: formData.customerName,
        status: formData.status,
        addresses: formData.addresses.map(addr => ({
          street1: addr.street1 || '',
          street2: addr.street2 || '',
          street3: addr.street3 || '',
          city: addr.city || '',
          postcode: addr.postcode || '',
          country: addr.country || '',
          isDefault: addr.isDefault || false,
          isBilling: addr.isBilling || false,
          isShipping: addr.isShipping || false
        })),
        additionalAddresses: formData.additionalAddresses?.map(addr => ({
          street1: addr.street1 || '',
          street2: addr.street2 || '',
          street3: addr.street3 || '',
          city: addr.city || '',
          postcode: addr.postcode || '',
          country: addr.country || '',
          isDefault: addr.isDefault || false,
          isBilling: addr.isBilling || false,
          isShipping: addr.isShipping || false
        })) || [],
        contacts: formData.contacts.map(contact => ({
          contactId: contact.contactId,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone || '',
          isDefault: contact.isDefault || false
        })),
        additionalInformation: {
          operatingHours: formData.operatingHours || '',
          notes: formData.notes || '',
          tags: formData.tags || []
        },
        createdAt: serverTimestamp(),
        createdBy: {
          uid,
          email,
          displayName
        },
        updatedAt: serverTimestamp(),
        updatedBy: {
          uid,
          email,
          displayName
        }
      };

      // Use siteId as document ID
      const locationRef = doc(db, 'locations', formData.locationID);
      await setDoc(locationRef, locationData);

      // Show success modal instead of simple toast
      setAlertConfig({
        title: 'Success!',
        message: `Location ${formData.locationName} (${formData.locationID}) has been successfully created. You can now view the location list or create another location.`,
        type: 'success',
        showActions: true
      });
      setShowAlert(true);

    } catch (error) {
      console.error('Error saving location:', error);
      setAlertConfig({
        title: 'Error',
        message: `Failed to save location: ${error.message}`,
        type: 'error',
        showActions: false
      });
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'white',
            color: '#333',
            padding: '8px 12px',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            fontSize: '14px',
            maxWidth: '300px'
          },
        }}
      />

      <GeeksSEO title="Create Location | VITAR Group" />
      
      <ContentHeader
        title="Create New Location"
        description="Add a new site or location to your network"
        infoText="Fill in the location details including address, contact information and operating hours. All fields marked with * are required."
        badgeText="Location Management"
        breadcrumbItems={[
          { 
            icon: <House className="me-2" size={14} />, 
            text: 'Dashboard', 
            link: '/dashboard' 
          },
          { 
            icon: <Building className="me-2" size={14} />, 
            text: 'Locations',
            link: '/dashboard/locations/list'
          },
          {
            icon: <Plus className="me-2" size={14} />,
            text: 'Create'
          }
        ]}
      />

      <Row>
      
        <Col md={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              {error && (
                <Alert variant="danger" className="mb-4">
                  {error}
                </Alert>
              )}

              <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
                <Row>
                  <Col md={3}>
                    <div className="sticky-top" style={{ top: '20px' }}>
                      <Nav variant="pills" className="flex-column">
                        <Nav.Item>
                          <Nav.Link 
                            eventKey="basic"
                            className="d-flex align-items-center gap-2 mb-2"
                          >
                            <Building size={18} />
                            <span>Basic Information</span>
                          </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                          <Nav.Link 
                            eventKey="address"
                            className="d-flex align-items-center gap-2 mb-2"
                          >
                            <House size={18} />
                            <span>Address Details</span>
                          </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                          <Nav.Link 
                            eventKey="contact"
                            className="d-flex align-items-center gap-2 mb-2"
                          >
                            <Phone size={18} />
                            <span>Site Contacts</span>
                          </Nav.Link>
                        </Nav.Item>
                      </Nav>

                      <div className="mt-4 p-3 bg-light rounded">
                        <h6 className="mb-2">Form Progress</h6>
                        <div className="progress" style={{ height: '8px' }}>
                          <div 
                            className="progress-bar bg-primary" 
                            role="progressbar" 
                            style={{ 
                              width: `${calculateFormProgress()}%`,
                              transition: 'width 0.3s ease-in-out'
                            }} 
                            aria-valuenow={calculateFormProgress()} 
                            aria-valuemin="0" 
                            aria-valuemax="100"
                          />
                        </div>
                        <small className="text-muted mt-2 d-block">
                          {calculateFormProgress()}% Complete
                        </small>
                        {calculateFormProgress() < 100 && (
                          <small className="text-danger mt-1 d-block">
                            Please fill in all required fields to continue
                          </small>
                        )}
                      </div>
                    </div>
                  </Col>

                  <Col md={9}>
                    <Tab.Content>
                      <Tab.Pane eventKey="basic">
                        <Card className="border-0 shadow-sm mb-4">
                          <Card.Body className="p-4">
                            <h5 className="mb-4">Basic Information</h5>
                            <Row>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <RequiredFieldWithTooltip label="Location ID" />
                                  <Form.Control
                                    type="text"
                                    name="locationID"
                                    value={formData.locationID}
                                    readOnly
                                    style={{ backgroundColor: '#f8f9fa' }}
                                  />
                                  <Form.Text className="text-muted">
                                    Auto-generated location ID
                                  </Form.Text>
                                </Form.Group>
                              </Col>

                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <RequiredFieldWithTooltip label="Site Name" />
                                  <Form.Control
                                    type="text"
                                    name="locationName"
                                    value={formData.locationName}
                                    onChange={handleChange}
                                  />
                                </Form.Group>
                              </Col>
                              
                              <Col md={6}>
                                <Form.Group className="mb-3 position-relative" ref={dropdownRef}>
                                  <RequiredFieldWithTooltip label="Customer" />
                                  <Form.Control
                                    type="text"
                                    placeholder="Search customers by name or ID..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    onClick={handleSearchClick}
                                    required
                                  />
                                  
                                  {showDropdown && (
                                    <div className="customer-dropdown" ref={dropdownRef}>
                                      {isLoadingCustomers ? (
                                        <div className="dropdown-item text-muted small">
                                          Loading...
                                        </div>
                                      ) : filteredCustomers.length > 0 ? (
                                        filteredCustomers.map(customer => renderCustomerItem(customer))
                                      ) : (
                                        <div className="dropdown-item text-muted small">
                                          No customers found
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </Form.Group>
                              </Col>

                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Customer Type</Form.Label>
                                  <Form.Control
                                    type="text"
                                    value={
                                      typeof selectedCustomer?.type === 'string' 
                                        ? selectedCustomer.type 
                                        : 'Standard'
                                    }
                                    readOnly
                                    style={{ backgroundColor: '#f8f9fa' }}
                                  />
                                  {typeof selectedCustomer?.contract === 'string' && (
                                    <Form.Text className="text-muted">
                                      Contract: {selectedCustomer.contract}
                                    </Form.Text>
                                  )}
                                </Form.Group>
                              </Col>

                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Status</Form.Label>
                                  <Form.Select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                  >
                                    <option value=""default>Select Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                  </Form.Select>
                                </Form.Group>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      </Tab.Pane>

                      <Tab.Pane eventKey="address">
                        <Card className="border-0 shadow-sm mb-4">
                          <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                              <div className="d-flex align-items-center gap-2">
                                <h5 className="mb-0">Address Details ({formData.addresses.length})</h5>
                              </div>
                              <Button
                                variant="btn btn-primary"
                                size="sm"
                                onClick={handleAddAddress}
                                disabled={!formData.customerId} // Disable if no customer selected
                              >
                                <Plus size={14} className="me-1" />
                                Add Address
                              </Button>
                            </div>

                            {formData.addresses.map((address, index) => (
                              <Card key={index} className="border mb-4">
                                <Card.Header className="bg-light">
                                  <div className="d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center gap-2">
                                      <h6 className="mb-0">
                                        {index === 0 ? 'Default Address' : `Additional Address ${index}`}
                                        {address.isDefault && (
                                          <Badge bg="primary" className="ms-2">Default</Badge>
                                        )}
                                      </h6>
                                      {(!selectedCustomer?.locations?.length || !address.isDefault) && (
                                        <div className="ms-3">
                                          <Form.Check
                                            inline
                                            type="switch"
                                            id={`billing-${index}`}
                                            label="Billing"
                                            checked={address.isBilling}
                                            onChange={() => handleAddressTypeChange(index, 'isBilling')}
                                          />
                                          <Form.Check
                                            inline
                                            type="switch"
                                            id={`shipping-${index}`}
                                            label="Shipping"
                                            checked={address.isShipping}
                                            onChange={() => handleAddressTypeChange(index, 'isShipping')}
                                          />
                                        </div>
                                      )}
                                    </div>
                                    {(!selectedCustomer?.locations?.length || !address.isDefault) && (
                                      <Button
                                        variant="link"
                                        className="text-danger p-0"
                                        onClick={() => handleRemoveAddress(index)}
                                      >
                                        <X size={20} />
                                      </Button>
                                    )}
                                  </div>
                                </Card.Header>
                                <Card.Body>
                                  <Row>
                                    <Col md={12}>
                                      <Form.Group className="mb-3">
                                        <RequiredFieldWithTooltip label="Street Address 1" />
                                        <Form.Control
                                          type="text"
                                          value={address.street1}
                                          onChange={(e) => handleAddressChange(index, 'street1', e.target.value)}
                                          readOnly={selectedCustomer?.locations?.length > 0 && address.isDefault}
                                          style={selectedCustomer?.locations?.length > 0 && address.isDefault ? { backgroundColor: '#f8f9fa' } : {}}
                                        />
                                      </Form.Group>
                                    </Col>

                                    <Col md={12}>
                                      <Form.Group className="mb-3">
                                        <Form.Label>Street Address 2</Form.Label>
                                        <Form.Control
                                          type="text"
                                          value={address.street2}
                                          onChange={(e) => handleAddressChange(index, 'street2', e.target.value)}
                                          readOnly={selectedCustomer?.locations?.length > 0 && address.isDefault}
                                          style={selectedCustomer?.locations?.length > 0 && address.isDefault ? { backgroundColor: '#f8f9fa' } : {}}
                                        />
                                      </Form.Group>
                                    </Col>

                                    <Col md={12}>
                                      <Form.Group className="mb-3">
                                        <Form.Label>Street Address 3</Form.Label>
                                        <Form.Control
                                          type="text"
                                          value={address.street3}
                                          onChange={(e) => handleAddressChange(index, 'street3', e.target.value)}
                                          readOnly={selectedCustomer?.locations?.length > 0 && address.isDefault}
                                          style={selectedCustomer?.locations?.length > 0 && address.isDefault ? { backgroundColor: '#f8f9fa' } : {}}
                                        />
                                      </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                      <Form.Group className="mb-3">
                                        <Form.Label>City</Form.Label>
                                        <Form.Control
                                          type="text"
                                          value={address.city}
                                          onChange={(e) => handleAddressChange(index, 'city', e.target.value)}
                                          readOnly={selectedCustomer?.locations?.length > 0 && address.isDefault}
                                          style={selectedCustomer?.locations?.length > 0 && address.isDefault ? { backgroundColor: '#f8f9fa' } : {}}
                                        />
                                      </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                      <Form.Group className="mb-3">
                                        <RequiredFieldWithTooltip label="Postal Code" />
                                        <Form.Control
                                          type="text"
                                          value={address.postcode}
                                          onChange={(e) => handleAddressChange(index, 'postcode', e.target.value)}
                                          // Always editable
                                        />
                                      </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                      <Form.Group className="mb-3">
                                        <RequiredFieldWithTooltip label="Country" />
                                        <Form.Select
                                          value={address.country}
                                          onChange={(e) => handleAddressChange(index, 'country', e.target.value)}
                                          // Always editable
                                        >
                                          <option value="">Select a country</option>
                                          {countries.map(country => (
                                            <option key={country.country} value={country.country}>
                                              {country.name}
                                            </option>
                                          ))}
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

                      <Tab.Pane eventKey="contact">
                        <Card className="border-0 shadow-sm mb-4">
                          <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                              <h5 className="mb-0">Site Contacts</h5>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={handleAddContact}
                              >
                                <Plus size={14} className="me-1" />
                                Add Additional Contact
                              </Button>
                            </div>
                            
                            {renderContactSection()}
                          </Card.Body>
                        </Card>
                      </Tab.Pane>
                    </Tab.Content>
                  </Col>
                </Row>
              </Tab.Container>

              {/* Form Actions */}
              <div className="d-flex justify-content-between mt-4">
                <Button
                  variant="outline-danger"
                  onClick={() => router.push('/dashboard/locations/list')}
                  disabled={loading}
                  className="d-flex align-items-center"
                >
                  <X size={14} className="me-2" />
                  Cancel
                </Button>

                <div className="d-flex gap-2">
                  {activeTab !== 'basic' && (
                    <Button
                      variant="outline-primary"
                      onClick={() => {
                        const tabs = ['basic', 'address', 'contact'];
                        const currentIndex = tabs.indexOf(activeTab);
                        setActiveTab(tabs[currentIndex - 1]);
                      }}
                      className="d-flex align-items-center"
                    >
                      <ChevronLeft size={14} className="me-2" />
                      Previous
                    </Button>
                  )}

                  {activeTab !== 'contact' ? (
                    <Button
                      variant="primary"
                      onClick={handleNextClick}
                      disabled={
                        (activeTab === 'basic' && formCompletion.basic < 100) ||
                        (activeTab === 'address' && formCompletion.address < 100)
                      }
                      className="d-flex align-items-center"
                    >
                      Next
                      <ChevronRight size={14} className="ms-2" />
                    </Button>
                  ) : (
                    <Button
                      variant="success"
                      onClick={handleSaveLocation}
                      disabled={loading || !isFormComplete()}
                      className="d-flex align-items-center"
                    >
                      {loading ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Save size={14} className="me-2" />
                          Create Location
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
export default CreateLocations;
