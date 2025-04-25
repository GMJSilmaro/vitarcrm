import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Form,
  Image,
  InputGroup,
  OverlayTrigger,
  Row,
  Spinner,
  Tooltip,
} from 'react-bootstrap';
import AvatarChooser from '../AvatarChooser';
import { Controller, useFormContext } from 'react-hook-form';
import { Eye, EyeSlash, Trash } from 'react-bootstrap-icons';
import { RequiredLabel } from '@/components/Form/RequiredLabel';
import { CATEGORY, GENDER, ROLES } from '@/schema/users';
import _ from 'lodash';
import { TooltipContent } from '@/components/common/ToolTipContent';
import Select from '@/components/Form/Select';
import { useRouter } from 'next/router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { useDebouncedCallback } from 'use-debounce';
import toast from 'react-hot-toast';

const PersonalForm = ({ data, isLoading, handleNext, setFile }) => {
  const router = useRouter();

  const [profilePicture, setProfilePicture] = useState('/images/avatar/NoProfile.png');
  const [isSelectedPredefinedAvatar, setIsSelectedPredefinedAvatar] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [categoriesOptions] = useState(CATEGORY.map((category) => ({ value: category, label: category.split(' ').map(word => _.capitalize(word)).join(' ') }))); //prettier-ignore
  const [rolesOptions] = useState(ROLES.map((role) => ({ value: role, label: _.startCase(role) }))); //prettier-ignore

  const [isWorkerIdUnique, setIsWorkerIdUnique] = useState(true);
  const [isCheckingWorkerId, setIsCheckingWorkerId] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isEmailUnique, setIsEmailUnique] = useState(true);

  const fileInputRef = useRef(null);

  const form = useFormContext();
  const formErrors = form.formState.errors;

  const hanadleIsWorkerIdUnique = useCallback(
    async (workerId) => {
      try {
        setIsCheckingWorkerId(true);

        if (data && workerId === data.workerId) {
          setIsCheckingWorkerId(false);
          return true;
        }

        const workerRef = query(collection(db, 'users'), where('workerId', '==', workerId));
        const workerDoc = await getDocs(workerRef);

        if (workerDoc.empty) {
          setIsCheckingWorkerId(false);
          return true;
        }

        setIsCheckingWorkerId(false);
        return false;
      } catch (error) {
        console.error('Error checking worker ID uniqueness:', error);
        return false;
      }
    },
    [data]
  );

  const handleIsEmailUnique = useCallback(
    async (email) => {
      try {
        setIsCheckingEmail(true);

        if (data && email === data.email) {
          setIsCheckingEmail(false);
          return true;
        }

        const workerRef = query(collection(db, 'users'), where('email', '==', email));
        const workerDoc = await getDocs(workerRef);

        if (workerDoc.empty) {
          setIsCheckingEmail(false);
          return true;
        }

        setIsCheckingEmail(false);
        return false;
      } catch (error) {
        console.error('Error checking email uniqueness:', error);
        return false;
      }
    },
    [data]
  );

  const handleWorkerIdChange = async (value) => {
    if (!value) return;
    const isUnique = await hanadleIsWorkerIdUnique(value);

    if (isUnique) {
      form.setValue('workerId', value);
      form.clearErrors('workerId');
      setIsWorkerIdUnique(true);
    } else {
      form.setError('workerId', { type: 'custom', message: 'This worker ID is already taken' });
      setIsWorkerIdUnique(false);
    }
  };

  const handleEmailChange = async (value) => {
    if (!value) return;
    const isUnique = await handleIsEmailUnique(value);

    if (isUnique) {
      form.setValue('email', value);
      form.clearErrors('email');
      setIsEmailUnique(true);
    } else {
      form.setError('email', { type: 'custom', message: 'This email is already taken' });
      setIsEmailUnique(false);
    }
  };

  const debounceHandleWorkerIdChange = useDebouncedCallback(handleWorkerIdChange, 1500);
  const debounceHandleEmailChange = useDebouncedCallback(handleEmailChange, 1500);

  //* set profile picture state if data exist
  useEffect(() => {
    if (!data) {
      form.setValue('profilePicture', '/images/avatar/NoProfile.png');
      return;
    }

    if (data && data.profilePicture) {
      setProfilePicture(data.profilePicture);
    }
  }, [data]);

  //* set roles if data exist
  useEffect(() => {
    if (data && rolesOptions.length > 0) {
      const role = rolesOptions.find((option) => option.value === data.role);
      form.setValue('role', role);
    }
  }, [data, rolesOptions]);

  //* set categories if data exist
  useEffect(() => {
    if (data && categoriesOptions.length > 0) {
      const categories = data.categories.map((category) =>
        categoriesOptions.find((option) => option.value === category)
      );
      form.setValue('categories', categories);
    }
  }, [data, categoriesOptions]);

  const handleRemoveImage = () => {
    setProfilePicture('/images/avatar/NoProfile.png');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    form.setValue('profilePicture', profilePicture);
  }, [profilePicture]);

  return (
    <Card className='shadow-none'>
      <Card.Body>
        <div>
          <h4 className='mb-0'>Personal Info</h4>
          <p className='text-muted fs-6'>Personal details about the user.</p>
        </div>

        <Row className='mb-4 row-gap-3'>
          <Col md={4}>
            <div className='d-flex align-items-center'>
              <div className='me-3'>
                <Image
                  src={profilePicture}
                  className='rounded-circle avatar avatar-xl'
                  alt='Profile Picture'
                  style={{ width: '120px', height: '120px' }}
                />
              </div>
              <div className='align-self-end d-flex gap-1'>
                <AvatarChooser
                  originalProfilePicture={profilePicture}
                  profilePicture={profilePicture}
                  setProfilePicture={setProfilePicture}
                  setFile={setFile}
                  setIsSelectedPredefinedAvatar={setIsSelectedPredefinedAvatar}
                />

                <Button className='py-1 px-2' size='small' onClick={handleRemoveImage}>
                  <Trash size={16} style={{ cursor: 'pointer' }} />
                </Button>
              </div>
            </div>
          </Col>

          <Form.Group className='d-flex flex-column gap-1' as={Col} md={4}>
            <Form.Label>Status</Form.Label>

            <Controller
              name='isActive'
              control={form.control}
              render={({ field }) => (
                <Form.Check
                  className='align-items-end'
                  type='switch'
                  id='isActive'
                  label='Active'
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              )}
            />

            <Controller
              xs={12}
              md={8}
              name='isFieldWorker'
              control={form.control}
              render={({ field }) => (
                <Form.Check
                  className='align-items-end'
                  type='switch'
                  id='isFieldWorker'
                  label='Field Worker'
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <Form.Label htmlFor='shortBio'>Short Bio</Form.Label>

            <Controller
              name='shortBio'
              control={form.control}
              render={({ field }) => (
                <Form.Control
                  {...field}
                  id='shortBio'
                  as='textarea'
                  placeholder='Enter Short Bio'
                  rows={3}
                  style={{ resize: 'none' }}
                />
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <RequiredLabel label='First Name' id='firstName' />

            <Controller
              name='firstName'
              control={form.control}
              render={({ field }) => (
                <>
                  <Form.Control
                    {...field}
                    id='firstName'
                    type='text'
                    placeholder='Enter First Name'
                  />

                  {formErrors && formErrors.firstName?.message && (
                    <Form.Text className='text-danger'>{formErrors.firstName?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <Form.Label htmlFor='lastName'>Middle Name</Form.Label>

            <Controller
              name='middleName'
              control={form.control}
              render={({ field }) => (
                <>
                  <Form.Control
                    {...field}
                    id='middleName'
                    type='text'
                    placeholder='Enter Last Name'
                  />
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <RequiredLabel label='Last Name' id='lastName' />

            <Controller
              name='lastName'
              control={form.control}
              render={({ field }) => (
                <>
                  <Form.Control
                    {...field}
                    id='lastName'
                    type='text'
                    placeholder='Enter Last Name'
                  />

                  {formErrors && formErrors.lastName?.message && (
                    <Form.Text className='text-danger'>{formErrors.lastName?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <RequiredLabel label='Password' id='password' />

            <Controller
              name='password'
              control={form.control}
              render={({ field }) => (
                <>
                  <InputGroup>
                    <Form.Control
                      {...field}
                      style={{ marginTop: '1px' }}
                      id='password'
                      type={showPassword ? 'text' : 'password'}
                      placeholder='Enter Password'
                    />
                    <InputGroup.Text
                      style={{ cursor: 'pointer' }}
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <EyeSlash /> : <Eye />}
                    </InputGroup.Text>
                  </InputGroup>

                  {formErrors && formErrors.password?.message && (
                    <Form.Text className='text-danger'>{formErrors.password?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <RequiredLabel label='Email' id='email' />

            <Controller
              name='email'
              control={form.control}
              render={({ field }) => (
                <div className='position-relative'>
                  <Form.Control
                    {...field}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      debounceHandleEmailChange(e.target.value);
                    }}
                    id='email'
                    type='text'
                    disabled={isCheckingEmail}
                    placeholder='Enter Last Name'
                  />

                  {isCheckingEmail && (
                    <div style={{ position: 'absolute', right: 16, top: 16 }}>
                      <Spinner className='me-2' animation='border' size='sm' /> Checking...
                    </div>
                  )}

                  {formErrors && formErrors.email?.message && (
                    <Form.Text className='text-danger'>{formErrors.email?.message}</Form.Text>
                  )}
                </div>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <RequiredLabel label='Gender' id='gender' />

            <Controller
              name='gender'
              control={form.control}
              render={({ field }) => (
                <div className='mt-3'>
                  {GENDER.map((gender) => (
                    <Form.Check
                      inline
                      label={_.startCase(gender)}
                      name='gender'
                      type='radio'
                      id={`inline-gender-${gender}`}
                      checked={field.value === gender}
                      onChange={() => field.onChange(gender)}
                    />
                  ))}

                  <div className='mt-1'>
                    {formErrors && formErrors.gender?.message && (
                      <Form.Text className='text-danger'>{formErrors.gender?.message}</Form.Text>
                    )}
                  </div>
                </div>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <RequiredLabel label='Worker Id' id='workerId' />

            <Controller
              name='workerId'
              control={form.control}
              render={({ field }) => (
                <>
                  <div className='position-relative'>
                    <Form.Control
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        debounceHandleWorkerIdChange(e.target.value);
                      }}
                      id='workerId'
                      type='text'
                      disabled={isCheckingWorkerId}
                      placeholder={'Enter Worker ID'}
                    />

                    {isCheckingWorkerId && (
                      <div style={{ position: 'absolute', right: 16, top: 16 }}>
                        <Spinner className='me-2' animation='border' size='sm' /> Checking...
                      </div>
                    )}

                    {formErrors && formErrors.workerId?.message && (
                      <Form.Text className='text-danger'>{formErrors.workerId?.message}</Form.Text>
                    )}
                  </div>
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <RequiredLabel label='Role' id='role' />
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  <TooltipContent
                    title='Role Search'
                    info={["Search by role's name", 'Required to proceed with user creation']}
                  />
                </Tooltip>
              }
            >
              <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
            </OverlayTrigger>

            <Controller
              name='role'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    inputId='role'
                    instanceId='role'
                    onChange={(option) => field.onChange(option)}
                    options={rolesOptions}
                    placeholder='Select role'
                    noOptionsMessage={() => 'No role found'}
                  />

                  {formErrors && formErrors.role?.message && (
                    <Form.Text className='text-danger'>{formErrors.role?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <RequiredLabel label='Assigned Categories' id='categories' />
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  <TooltipContent title='Category Search' info={['Search by category']} />
                </Tooltip>
              }
            >
              <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
            </OverlayTrigger>

            <Controller
              name='categories'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    inputId='categories'
                    instanceId='categories'
                    isMulti
                    onChange={(option) => field.onChange(option)}
                    options={categoriesOptions}
                    placeholder='Search by category'
                    noOptionsMessage={() => 'No category found'}
                  />

                  {formErrors && formErrors.categories?.message && (
                    <Form.Text className='text-danger'>{formErrors.categories?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <Form.Label htmlFor='dateOfBirth'>Date of Birth</Form.Label>

            <Controller
              name='dateOfBirth'
              control={form.control}
              render={({ field }) => (
                <>
                  <Form.Control
                    {...field}
                    id='dateOfBirth'
                    type='date'
                    placeholder='Enter Last Name'
                  />

                  {formErrors && formErrors.dateOfBirth?.message && (
                    <Form.Text className='text-danger'>{formErrors.dateOfBirth?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <Form.Label htmlFor='expirationDate'>Expiration Date</Form.Label>

            <Controller
              name='expirationDate'
              control={form.control}
              render={({ field }) => (
                <>
                  <Form.Control {...field} id='expirationDate' type='date' />

                  {formErrors && formErrors.expirationDate?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors.expirationDate?.message}
                    </Form.Text>
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
            variant='outline-danger'
            onClick={() => router.push('/workers')}
          >
            Cancel
          </Button>

          <Button
            disabled={isLoading}
            type='button'
            onClick={() => {
              if (!isWorkerIdUnique || !isEmailUnique) {
                toast.error('Please fix the errors in the form and try again.');
                return;
              }

              handleNext();
            }}
          >
            Next
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default PersonalForm;
