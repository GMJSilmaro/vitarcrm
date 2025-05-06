import { db, storage } from '@/firebase';
import { format } from 'date-fns';
import { arrayUnion, doc, Timestamp, updateDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useCallback, useRef, useState } from 'react';
import { Button, Card, Col, Image, Row, Spinner } from 'react-bootstrap';
import {
  Download,
  FileEarmark,
  FileEarmarkText,
  FileText,
  Trash,
  Upload,
} from 'react-bootstrap-icons';
import toast from 'react-hot-toast';

const Document = ({ user }) => {
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);

  const DocumentsfileInputRef = useRef(null);
  const SignaturefileInputRef = useRef(null);

  const [documents, setDocuments] = useState(() => {
    return user?.documents || [];
  });

  const [signature, setSignature] = useState(() => user?.signature || '');

  const handleDocumentsFileUpload = useCallback(
    async (e) => {
      if (!user) return;

      console.log({ user });

      const files = e.target.files;
      if (!files || !files.length) return;

      setIsUploadingDocuments(true);

      try {
        const uploadPromises = Array.from(files).map(async (file) => {
          //* Create a reference to the storage location
          const storageRef = ref(storage, `documents/${user.id}/${file.name}`);

          //* Upload the file
          await uploadBytes(storageRef, file);

          //* Get the download URL
          const downloadURL = await getDownloadURL(storageRef);

          //* Create document object
          const document = {
            id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            url: downloadURL,
            type: file.type,
            size: file.size,
            uploadedAt: Timestamp.now(),
            path: `documents/${user.id}/${file.name}`,
          };

          //* Update Firestore
          const userRef = doc(db, 'users', user.id);
          await updateDoc(userRef, { documents: arrayUnion(document) });

          return document;
        });

        const uploadedDocs = await Promise.all(uploadPromises);

        //* Update local state
        setDocuments((prev) => [...prev, ...uploadedDocs]);

        toast.success('Documents uploaded successfully');
        e.target.value = ''; // Reset file input
      } catch (error) {
        console.error('Error uploading documents:', error);
        toast.error('Failed to upload documents');
      } finally {
        setIsUploadingDocuments(false);
      }
    },
    [user]
  );

  const handleSignatureFileUpload = useCallback(
    async (e) => {
      if (!user) return;

      const files = e.target.files;
      if (!files || !files.length) return;

      const file = files[0];

      if (!file) return;

      try {
        setIsUploadingSignature(true);

        //* create storage ref
        const storageRef = ref(storage, `signatures/${user.id}}`);

        //* Upload the file
        await uploadBytes(storageRef, file);

        //* Get the download URL
        const downloadURL = await getDownloadURL(storageRef);

        //* update user doc
        const userRef = doc(db, 'users', user.id);
        await updateDoc(userRef, { signature: downloadURL });

        //* Update local state
        setSignature(downloadURL);

        toast.success('Signature uploaded successfully');
        setIsUploadingSignature(false);
        e.target.value = ''; // Reset file input
      } catch (error) {
        console.error('Error uploading documents:', error);
        toast.error('Failed to upload documents');
        setIsUploadingSignature(false);
      }
    },
    [user]
  );

  const handleDownload = async (document) => {
    try {
      window.open(document.url, '_blank');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  const handleDeleteDocument = async (documentId) => {
    const document = documents.find((doc) => doc.id === documentId);
    if (!document) return;

    try {
      //* Delete from Storage
      const storageRef = ref(storage, document.path);
      await deleteObject(storageRef);

      //* Delete from Firestore
      const userRef = doc(db, 'users', user.id);
      const updatedDocs = documents.filter((doc) => doc.id !== documentId);
      await updateDoc(userRef, { documents: updatedDocs });

      //* Update local state
      setDocuments(updatedDocs);

      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  return (
    <Card className='border-0 shadow-none'>
      <Card.Body>
        <Row>
          <Col lg={6}>
            <div className='d-flex justify-content-between align-items-center'>
              <div>
                <h4 className='mb-0'>Documents</h4>
                <p className='text-muted fs-6 mb-0'>Manage worker's documents and files</p>
              </div>
              <div className='d-flex gap-2'>
                <input
                  type='file'
                  ref={DocumentsfileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleDocumentsFileUpload}
                  multiple
                />

                <Button
                  variant='primary'
                  size='sm'
                  onClick={() => DocumentsfileInputRef.current?.click()}
                  className='d-flex align-items-center gap-2'
                  disabled={isUploadingDocuments}
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

            {documents.length === 0 ? (
              <div className='py-5 h-100 d-flex justify-content-center align-items-center'>
                <div className='text-center '>
                  <FileEarmarkText size={48} className='text-muted mb-3' />
                  <h4 className='mb-0'>No Documents Yet</h4>
                  <p className='text-muted fs-6 mb-0'>
                    Upload user documents like contracts, certificates, or ID
                  </p>
                </div>
              </div>
            ) : (
              <div className='my-5' style={{ maxHeight: '400px', overflow: 'auto' }}>
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
                        onClick={() => handleDownload(doc)}
                      >
                        <Download size={16} />
                      </Button>
                      <Button
                        variant='link'
                        className='p-0 text-danger'
                        onClick={() => handleDeleteDocument(doc.id)}
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Col>

          <Col lg={6}>
            <div className='d-flex justify-content-between align-items-center'>
              <div>
                <h4 className='mb-0'>Signature</h4>
                <p className='text-muted fs-6 mb-0'>Manage user signature.</p>
              </div>
              <div className='d-flex gap-2'>
                <input
                  type='file'
                  ref={SignaturefileInputRef}
                  accept='image/*'
                  style={{ display: 'none' }}
                  onChange={handleSignatureFileUpload}
                />

                <Button
                  variant='primary'
                  size='sm'
                  onClick={() => SignaturefileInputRef.current?.click()}
                  className='d-flex align-items-center gap-2'
                  disabled={isUploadingSignature}
                >
                  {isUploadingSignature ? (
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

            {!signature ? (
              <div className='py-5 h-100 d-flex justify-content-center align-items-center'>
                <div className='text-center'>
                  <FileText size={48} className='text-muted mb-3' />
                  <h4 className='mb-0'>No Signature Yet</h4>
                  <p className='text-muted fs-6 mb-0'>Upload user signature</p>
                </div>
              </div>
            ) : (
              <div className='d-flex justify-content-center align-items-center w-100 h-100 p-5'>
                <div
                  className='position-relative p-5 rounded'
                  style={{ border: 'dotted 6px #e2e8f0' }}
                >
                  <Image src={signature} alt='Signature' width={240} height={240} />
                </div>
              </div>
            )}
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default Document;
