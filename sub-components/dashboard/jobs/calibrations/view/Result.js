import { Card } from '@mui/material';
import { useMemo } from 'react';
import CalibrationMassResult from './mass/CalibrationMassResult';

const Result = ({ calibration }) => {
  const category = useMemo(() => {
    if (!calibration.category) return null;
    return calibration.category?.toLowerCase();
  }, [calibration]);

  if (category === 'mass') {
    return <CalibrationMassResult calibration={calibration} category={category} />;
  }

  return (
    <Card className='shadow-none'>
      <Card.Body className='text-center mt-5'>
        <h4 className='mb-0'>Result for the selected category not yet suppoted</h4>
        <p>Module is under development</p>
      </Card.Body>
    </Card>
  );
};

export default Result;
