import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Col, Modal, Row, Spinner } from 'react-bootstrap';
import { Download, Eye, FileEarmarkText, Save, Trash, Upload } from 'react-bootstrap-icons';
import { useFormContext } from 'react-hook-form';
import { delay } from '@/utils/common';
import toast from 'react-hot-toast';

const JobRequestDocumentsForm = ({ data, isLoading, handleNext, handlePrevious }) => {
  const fileInputRef = useRef(null);

  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false);
  const [isDeletingDocumentId, setIsDeletingDocumentId] = useState('');

  const form = useFormContext();

  const documents = useMemo(() => {
    const value = form.watch('documents');
    if (!value || (Array.isArray(value) && value.length < 1)) return [];
    return value;
  }, [JSON.stringify(form.watch('documents'))]);

  const jobRequestId = useMemo(() => {
    const value = form.watch('jobRequestId');
    if (!value) return '';
    return value;
  }, [form.watch('jobRequestId')]);

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
        if (!files || !files.length || !jobRequestId) return;

        setIsUploadingDocuments(true);

        await delay(1500);

        const documentToUpload = Array.from(files).map((file) => ({
          id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          url: URL.createObjectURL(file),
          type: file.type,
          size: file.size,
          uploadedAt: Timestamp.now(),
          path: `job-requests/${jobRequestId}/documents/${file.name}`,
        }));

        form.setValue('documents', [...documents, ...documentToUpload]); //prettier-ignore
        setIsUploadingDocuments(false);
        toast.success('Document uploaded successfully');
      } catch (err) {
        console.error(err);
        setIsUploadingDocuments(false);
      }
    },
    [jobRequestId, JSON.stringify(documents)]
  );

  const handleView = async (document) => {
    try {
      window.open(document.url, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
      toast.error('Failed to view document');
    }
  };

  //* set documents if data exist
  useEffect(() => {
    if (data && data?.documents && Array.isArray(data.documents)) {
      form.setValue('documents', data.documents);
    }
  }, [data]);

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
              <div className='my-5 px-3' style={{ maxHeight: '400px', overflow: 'auto' }}>
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
                          Uploaded on {format(doc.uploadedAt.toDate(), 'MMM d, yyyy')}
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
                        <Spinner animation='border' size='sm' className='me-2' />
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
                  {data ? 'Update' : 'Create'} {' Job Request'}
                </>
              )}
            </Button>
          </div>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default JobRequestDocumentsForm;
