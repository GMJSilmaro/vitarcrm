import { format } from 'date-fns';
import { useMemo } from 'react';
import { Button, Card, Col, Row } from 'react-bootstrap';
import { Download, FileEarmarkText } from 'react-bootstrap-icons';

const Documents = ({ jobRequest }) => {
  const documents = useMemo(() => {
    const value = jobRequest?.documents;
    if (!value || (Array.isArray(value) && value.length < 1)) return [];
    return value;
  }, [jobRequest]);

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

  return (
    <Card className='border-0 shadow-none'>
      <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
        <div>
          <h4 className='mb-0'>Documents</h4>
          <p className='text-muted fs-6 mb-0'>Uploaded job request related documents.</p>
        </div>
      </Card.Header>

      <Card.Body>
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default Documents;
