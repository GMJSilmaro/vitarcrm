import ExcelUploader from '@/components/ExcelUploader';
import { useParams } from 'next/navigation';
import React from 'react';

const DataUploads = () => {
  const params = useParams();

  return (
    <div className='d-flex justify-content-center align-items-center' style={{ height: '89vh' }}>
      <ExcelUploader dataKey={params?.dataKey} prefix={params?.prefix} />
    </div>
  );
};

export default DataUploads;
