import { useAuth } from '@/contexts/AuthContext';

import {
  customerEquipmentSchema,
  documentsSchema,
  jobRequestSchema,
  STATUS,
  summarySchema,
  taskSchema,
  tasksSchema,
} from '@/schema/job-request';
import { useRouter } from 'next/router';
import React, { useCallback, useMemo, useState } from 'react';
import { Form, Tab, Tabs } from 'react-bootstrap';
import { FormProvider, useForm } from 'react-hook-form';
import JobRequestSummaryForm from './tabs-form/JobRequestSummaryForm';
import { getFormDefaultValues } from '@/utils/zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import JobRequestCustomerEquipmentForm from './tabs-form/JobRequestCustomerEquipment';
import JobRequestTaskForm from './tabs-form/JobRequestTaskForm';
import FormDebug from '@/components/Form/FormDebug';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, storage } from '@/firebase';
import { useNotifications } from '@/hooks/useNotifications';
import JobRequestDocumentsForm from './tabs-form/JobRequestDocumentsForm';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { getFileFromBlobUrl } from '@/utils/common';

const JobRequestForm = ({ data }) => {
  const auth = useAuth();
  const router = useRouter();
  const notifications = useNotifications();

  const [activeKey, setActiveKey] = useState('0');

  const tabsLength = 3;
  const tabSchema = [summarySchema, customerEquipmentSchema, tasksSchema, documentsSchema];

  const [isLoading, setIsLoading] = useState(false);

  const schema = useMemo(() => {
    return tabSchema[Number(activeKey)] ?? summarySchema;
  }, [activeKey]);

  const form = useForm({
    mode: 'onChange',
    defaultValues: {
      ...getFormDefaultValues(schema),
      ...data,
      ...(!data && { status: STATUS[0] }),
      customerEquipments: [],
      documents: [],
    },
    resolver: zodResolver(schema),
  });

  const handleNext = useCallback(async () => {
    const isValid = await form.trigger();

    if (!isValid) {
      toast.error('Please fix the errors in the form and try again.', { position: 'top-right' });
      return;
    }

    if (Number(activeKey) <= tabSchema.length - 1) {
      const nextActiveKey = String(Number(activeKey) + 1);
      setActiveKey(nextActiveKey);

      if (Number(activeKey) === tabSchema.length - 1) {
        const parseData = jobRequestSchema.safeParse(form.getValues());

        if (parseData.success) {
          handleSubmit(parseData.data);
        } else toast.error('Failed to parse data. Please try again later.');
      }
    }
  }, [activeKey]);

  const handlePrevious = useCallback(() => {
    if (Number(activeKey) > 0) handleOnSelect(activeKey - 1);
  }, [activeKey]);

  const handleSubmit = useCallback(
    async (formData) => {
      try {
        setIsLoading(true);

        let docFiles = [];
        const isResubmit = data && data?.status === 'request-resubmit';

        //* upload documents
        if (formData?.documents && Array.isArray(formData?.documents ?? [])) {
          const uploadPromises = formData.documents
            .map(async (docFile) => {
              if (!docFile.url.startsWith('blob:')) return docFile;

              //* only upload if url is blob url
              try {
                //* Create a reference to the storage location
                const storageRef = ref(storage, docFile.path);

                //* get file from url
                const file = await getFileFromBlobUrl(docFile.url);

                //* Upload the file
                await uploadBytes(storageRef, file);

                //* Get the download URL
                const downloadURL = await getDownloadURL(storageRef);

                //* Update document file
                return {
                  ...docFile,
                  url: downloadURL,
                };
              } catch (err) {
                console.error(err, `Error uploading document: ${docFile.name}`, err);
                return null;
              }
            })
            .filter(Boolean);

          const newFileIds = formData?.documents?.map((docFile) => docFile.id) || [];
          const toDeleteFiles = data?.documents?.filter((docFile) => !newFileIds.includes(docFile.id)) || []; // prettier-ignore

          const deletePromises = toDeleteFiles
            .map(async (docFile) => {
              try {
                //* Delete from Storage
                const storageRef = ref(storage, docFile.path);
                await deleteObject(storageRef);
              } catch (err) {
                console.error(err, `Error deleting document: ${docFile.name}`, err);
                return null;
              }
            })
            .filter(Boolean);

          docFiles = await Promise.all(uploadPromises);
          await Promise.all(deletePromises);
        }

        await setDoc(
          doc(db, 'jobRequests', formData.jobRequestId),
          {
            ...formData,
            ...(isResubmit && { status: 'request-resubmission' }),
            documents: docFiles,
            supervisor: { id: formData.supervisor.id, name: formData.supervisor.name },
            ...(!data && { createdAt: serverTimestamp(), createdBy: auth.currentUser }),
            updatedAt: serverTimestamp(),
            updatedBy: auth.currentUser,
          },
          { merge: true }
        );

        //* create notification for admin and supervisor when created a job request
        if (!data) {
          await notifications.create({
            module: 'job-request',
            target: ['admin', 'supervisor'],
            title: 'New job request created',
            message: `A new job request (#${formData.jobRequestId}) has been created by ${auth.currentUser.displayName} for ${formData.customer.name}.`,
            data: {
              redirectUrl: `/job-requests/view/${formData.jobRequestId}`,
            },
          });
        } else {
          await notifications.create({
            module: 'job-request',
            target: ['admin', 'supervisor'],
            title: 'Job request updated',
            message: `Job request (#${formData.jobRequestId}) has been updated by ${auth.currentUser.displayName}${isResubmit ? ' and changed status to "Request Resubmission."' : '.'}`, // prettier-ignore
            data: {
              redirectUrl: `/job-requests/view/${formData.jobRequestId}`,
            },
          });
        }

        //* create notification for assigned supervisor
        if (formData?.supervisor?.uid) {
          await notifications.create({
            module: 'job-request',
            target: [formData.supervisor.uid],
            title: `You are assigned as a supervisor`,
            message: `Job request (#${formData.jobRequestId}) has been assigned to you by ${auth.currentUser.displayName}.`,
            data: {
              redirectUrl: `/job-requests/view/${formData.jobRequestId}`,
            },
          });
        }

        toast.success(`Job Request ${data ? 'updated' : 'created'} successfully.`, {
          position: 'top-right',
        });

        setIsLoading(false);

        setTimeout(() => {
          window.location.assign(`/job-requests/view/${formData.jobRequestId}`);
        }, 1500);
      } catch (error) {
        console.error('Error submitting job request:', error);
        toast.error('Something went wrong. Please try again later.');
        setIsLoading(false);
        setActiveKey((prev) => prev - 1);
      }
    },
    [data]
  );

  const handleOnSelect = async (key) => {
    const isValid = await form.trigger();
    if (!isValid && activeKey !== key) {
      toast.error('Please fix the errors in the form and try again.', { position: 'top-right' });
      return;
    }

    setActiveKey(key);
  };

  return (
    <>
      {/* <FormDebug form={form} /> */}

      <FormProvider {...form}>
        <Form>
          <Tabs
            id='job-request-tab'
            activeKey={activeKey > tabsLength ? tabsLength : activeKey}
            onSelect={handleOnSelect}
          >
            <Tab eventKey='0' title='Summary'>
              <JobRequestSummaryForm data={data} isLoading={isLoading} handleNext={handleNext} />
            </Tab>

            <Tab eventKey='1' title='Calibration Items'>
              <JobRequestCustomerEquipmentForm
                data={data}
                isLoading={isLoading}
                handleNext={handleNext}
                handlePrevious={handlePrevious}
              />
            </Tab>

            <Tab eventKey='2' title='Additional Instructions'>
              <JobRequestTaskForm
                data={data}
                isLoading={isLoading}
                handleNext={handleNext}
                handlePrevious={handlePrevious}
              />
            </Tab>

            <Tab eventKey='3' title='Documents'>
              <JobRequestDocumentsForm
                data={data}
                isLoading={isLoading}
                handleNext={handleNext}
                handlePrevious={handlePrevious}
              />
            </Tab>
          </Tabs>
        </Form>
      </FormProvider>
    </>
  );
};

export default JobRequestForm;
