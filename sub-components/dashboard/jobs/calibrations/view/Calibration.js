import { Card } from '@mui/material';
import CalibrationMass from './mass/CalibrationMass';
import { useMemo } from 'react';

const Calibration = ({ calibration }) => {
  const category = useMemo(() => {
    if (!calibration.category) return null;
    return calibration.category?.toLowerCase();
  }, [calibration]);

  if (category === 'mass' || category === 'mechanical') {
    return <CalibrationMass calibration={calibration} category={category} />;
  }

  return (
    <Card className='shadow-none'>
      <Card.Body className='text-center mt-5'>
        <h4 className='mb-0'>Calibration Category not yet suppoted</h4>
        <p>Module is under development</p>
      </Card.Body>
    </Card>
  );
};

export default Calibration;
