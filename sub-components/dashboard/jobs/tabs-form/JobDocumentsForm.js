import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Col, Row, Spinner } from 'react-bootstrap';
import {
  Download,
  Eye,
  FileEarmarkText,
  Save,
  Trash,
  Upload,
} from 'react-bootstrap-icons';
import { useFormContext } from 'react-hook-form';
import { delay, getFileFromBlobUrl } from '@/utils/common';
import toast from 'react-hot-toast';

const JobDocumentsForm = ({
  isAdmin,
  data,
  isLoading,
  handleNext,
  handlePrevious,
  toDuplicateJob,
  calibrations,
}) => {
  const fileInputRef = useRef(null);

  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false);
  const [isDeletingDocumentId, setIsDeletingDocumentId] = useState('');

  const form = useFormContext();

  const documents = useMemo(() => {
    const value = form.watch('documents');
    if (!value || (Array.isArray(value) && value.length < 1)) return [];
    return value;
  }, [JSON.stringify(form.watch('documents'))]);

  const jobId = useMemo(() => {
    const value = form.watch('jobId');
    if (!value) return '';
    return value;
  }, [form.watch('jobId')]);

  const handleDownload = async (documentFile) => {
    const res = await fetch(documentFile.url);

    if (!res.ok) {
      toast.error('Failed to download file');
      return;
    }

    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = documentFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl); //* Clean up
  };

  const handleDeleteDocument = useCallback(
    async (documentId) => {
      const document = documents.find((doc) => doc.id === documentId);
      if (!document) return;

      setIsDeletingDocumentId(documentId);
      await delay(1000);
      form.setValue('documents', documents.filter((doc) => doc.id !== documentId)); //prettier-ignore
      setIsDeletingDocumentId('');
      toast.success('Document deleted successfully');
    },
    [JSON.stringify(documents), data]
  );

  const handleDocumentsFileUpload = useCallback(
    async (e) => {
      try {
        const files = e.target.files;
        if (!files || !files.length || !jobId) return;

        setIsUploadingDocuments(true);

        await delay(1500);

        const documentToUpload = Array.from(files).map((file) => ({
          id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          url: URL.createObjectURL(file),
          type: file.type,
          size: file.size,
          uploadedAt: Timestamp.now(),
          path: `jobs/${jobId}/documents/${file.name}`,
        }));

        form.setValue('documents', [...documents, ...documentToUpload]); //prettier-ignore
        setIsUploadingDocuments(false);
        toast.success('Document uploaded successfully');
      } catch (err) {
        console.error(err);
        setIsUploadingDocuments(false);
      }
    },
    [jobId, JSON.stringify(documents)]
  );

  const handleView = async (document) => {
    try {
      window.open(document.url, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
      toast.error('Failed to view document');
    }
  };

  //* set document value
  useEffect(() => {
    //** set documents if data exist and no job request
    if (data && !form.getValues('jobRequestId')) {
      form.setValue('documents', data?.documents || []);
    }

    //* set documents if job request exist
    if (
      form.getValues('jobRequestId') &&
      form.getValues('jobRequestId')?.jobRequest
    ) {
      const jobRequest = form.getValues('jobRequestId')?.jobRequest;

      //* if CREATED, just based the selected customer equipments to job request
      //* if EDIT, based it to the existing job data because calibration items is enabled even there is a job request
      if (data) form.setValue('documents', data?.documents || []);
      else {
        const jobRequestDocuments = jobRequest?.documents || [];
        const jobId = form.getValues('jobId');

        if (!jobId) return;

        //* change the url path to the new path for job
        const newDocumentsPromises = jobRequestDocuments
          .map(async (docFile) => {
            try {
              const file = await getFileFromBlobUrl(docFile.url);

              return {
                ...docFile,
                url: URL.createObjectURL(file),
                path: `jobs/${jobId}/documents/${docFile.name}`,
              };
            } catch (err) {
              console.error('Failed to change the url path:', err);
              return null;
            }
          })
          .filter(Boolean);

        Promise.all(newDocumentsPromises).then((docFiles) => {
          form.setValue('documents', docFiles);
        });
      }
    }
  }, [data, JSON.stringify(form.watch('jobRequestId')), form.watch('jobId')]);

  //TODO: set documents if toDuplicateJob exists
  useEffect(() => {
    if (toDuplicateJob) {
      const jobDocuments = toDuplicateJob?.documents || [];

      console.log({ jobDocuments });

      const jobId = form.getValues('jobId');

      if (!jobId) return;

      //* change the url path to the new path for job
      const newDocumentsPromises = jobDocuments
        .map(async (docFile) => {
          try {
            const file = await getFileFromBlobUrl(docFile.url);

            return {
              ...docFile,
              url: URL.createObjectURL(file),
              path: `jobs/${jobId}/documents/${docFile.name}`,
            };
          } catch (err) {
            console.error('Failed to change the url path:', err);
            return null;
          }
        })
        .filter(Boolean);

      Promise.all(newDocumentsPromises).then((docFiles) => {
        form.setValue('documents', docFiles);
      });
    }
  }, [toDuplicateJob, form.watch('jobId')]);

  return (
    <Card className='shadow-none'>
      <Card.Body className='pb-0'>
        <div className='d-flex justify-content-between align-items-center'>
          <div>
            <h4 className='mb-0'>Documents</h4>
            <p className='text-muted fs-6 mb-0'>
              Upload and manage related document/s e.g (pdf, images)
            </p>
          </div>

          <div className='d-flex gap-2'>
            <input
              type='file'
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleDocumentsFileUpload}
              multiple
            />

            <Button
              variant='outline-primary'
              size='sm'
              onClick={() => fileInputRef.current?.click()}
              className='d-flex align-items-center gap-2'
              disabled={isUploadingDocuments || !!isDeletingDocumentId}
            >
              {isUploadingDocuments ? (
                <>
                  <Spinner size='sm' />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload
                </>
              )}
            </Button>
          </div>
        </div>

        <Row>
          <Col>
            {documents.length === 0 ? (
              <div className='py-5 h-100 d-flex justify-content-center align-items-center'>
                <div className='text-center '>
                  <FileEarmarkText size={48} className='text-muted mb-3' />
                  <h4 className='mb-0'>No Documents Yet</h4>
                  <p className='text-muted fs-6 mb-0'>
                    Upload related documents that will be useful for the job.
                  </p>
                </div>
              </div>
            ) : (
              <div
                className='my-5 px-3'
                style={{ maxHeight: '400px', overflow: 'auto' }}
              >
                {documents.map((doc, index) => (
                  <div
                    key={index}
                    className='py-3 d-flex align-items-center justify-content-between border border-top-0 border-start-0 border-end-0'
                  >
                    <div className='d-flex gap-1 align-items-center gap-3'>
                      <FileEarmarkText size={24} />

                      <div className='d-flex flex-column'>
                        <h6 className='mb-0'>{doc.name}</h6>
                        <small className='text-muted'>
                          Uploaded on{' '}
                          {format(doc.uploadedAt.toDate(), 'MMM d, yyyy')}
                        </small>
                      </div>
                    </div>

                    <div className='d-flex align-items-center gap-3'>
                      <Button
                        variant='link'
                        className='p-0 text-primary'
                        onClick={() => handleView(doc)}
                      >
                        <Eye size={16} />
                      </Button>
                      <Button
                        variant='link'
                        className='p-0 text-primary'
                        onClick={() => handleDownload(doc)}
                      >
                        <Download size={16} />
                      </Button>
                      {isDeletingDocumentId === doc.id ? (
                        <Spinner
                          animation='border'
                          size='sm'
                          className='me-2'
                        />
                      ) : (
                        <Button
                          variant='link'
                          className='p-0 text-danger'
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          <Trash size={16} />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Col>

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
              {calibrations?.data?.length > 0 ? (
                'Next'
              ) : (
                <>
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
                      {data ? 'Update' : 'Create'} {' Job'}
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default JobDocumentsForm;
