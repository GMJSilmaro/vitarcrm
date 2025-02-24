import { useState, useEffect } from 'react';
import { parseExcelFile } from '../utils/excelParser';
import { Alert, Button, ProgressBar, Card, Badge } from 'react-bootstrap';
import { resumeUpload } from '@/services/excelUploadService';
import { dataExcelParser, dataProcessExcelUploader } from './Uploader';

const ExcelUploader = ({ dataKey, prefix }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState(null);
  const [canResume, setCanResume] = useState(false);

  useEffect(() => {
    const lastDataId = localStorage.getItem(`lastProcessed${dataKey}`);
    setCanResume(!!lastDataId);
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      setError('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setProgress(0);
      setStats(null);

      const data = await dataExcelParser[dataKey](file);

      await dataProcessExcelUploader[dataKey](
        prefix,
        dataKey,
        data,
        (progress) => setProgress(progress),
        (stats) => setStats(stats)
      );
    } catch (error) {
      console.error('Upload error:', error);
      setError(`Upload error: ${error.message}`);
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const handleResume = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await parseExcelFile(file);

      await resumeUpload(
        prefix,
        dataKey,
        data,
        (progress) => setProgress(progress),
        (stats) => setStats(stats)
      );
    } catch (error) {
      setError(`Resume error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!dataKey) return null;

  return (
    <Card className='mb-3'>
      <Card.Header className='text-center'>
        <h5 className='text-capitalize mb-0'>
          {dataKey} Master List Upload | Prefix: {prefix}
        </h5>
        <p className='text-muted mb-0' style={{ fontSize: '11px' }}>
          Linear data uplaod only
        </p>
      </Card.Header>
      <Card.Body>
        <div className='mb-3'>
          <input
            type='file'
            accept='.xlsx,.xls'
            onChange={handleFileUpload}
            className='d-none'
            id='fileUpload'
            disabled={loading}
          />
          <label htmlFor='fileUpload' style={{ display: 'block', width: '100%' }}>
            <Button
              className='text-capitalize w-100'
              variant='primary'
              as='span'
              disabled={loading}
            >
              {loading ? 'Processing...' : `Upload ${dataKey} List`}
            </Button>
          </label>
        </div>

        {loading && (
          <div className='mb-3'>
            <ProgressBar now={progress} label={`${progress}%`} animated />
            {stats && (
              <div className='mt-2 small'>
                <p className='mb-1'>Processing: {stats.currentItem}</p>
                <div className='d-flex gap-2'>
                  {stats.customersSuccess > 0 && (
                    <Badge bg='success'>Customers Added: {stats.customersSuccess}</Badge>
                  )}
                  {stats.locationsSuccess > 0 && (
                    <Badge bg='success'>Locations Added: {stats.locationsSuccess}</Badge>
                  )}
                  {stats.customerEquipmentsSuccess > 0 && (
                    <Badge bg='success'>
                      Customer Equipments Added: {stats.customerEquipmentsSuccess}
                    </Badge>
                  )}
                  {stats.errors > 0 && <Badge bg='danger'>Errors: {stats.errors}</Badge>}
                  <Badge bg='info'>Total Processed: {stats.processed}</Badge>
                </div>
              </div>
            )}
          </div>
        )}

        {error && <Alert variant='danger'>{error}</Alert>}

        {stats && stats.status === 'completed' && (
          <Alert variant='success'>
            Upload completed successfully!
            <div className='mt-2'>
              <Badge bg='success' className='me-2'>
                {dataKey} Added: {stats[`${dataKey}Success`]}
              </Badge>
              {stats.errors > 0 && (
                <Badge bg='danger' className='me-2'>
                  Errors: {stats.errors}
                </Badge>
              )}
              <Badge bg='info'>Total Processed: {stats.total}</Badge>
            </div>
          </Alert>
        )}

        {canResume && (
          <Button variant='secondary' onClick={handleResume} disabled={loading} className='ms-2'>
            Resume Upload
          </Button>
        )}
      </Card.Body>
    </Card>
  );
};

export default ExcelUploader;
