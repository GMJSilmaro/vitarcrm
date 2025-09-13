import { useMemo } from 'react';
import { Col, Row } from 'react-bootstrap';
import { LayoutWtf } from 'react-bootstrap-icons';

const OtherMeasurements = ({ calibration, rangeIndex }) => {
  const currentCalibrationData = useMemo(() => {
    return calibration?.data?.[rangeIndex];
  }, [JSON.stringify(calibration), rangeIndex]);

  return (
    <Row className='row-gap-3'>
      <Col md={4}>
        <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
          <div className='d-flex justify-content-center align-items-center flex-column w-100 gap-3'>
            <div
              className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
              style={{ width: '40px', height: '40px' }}
            >
              <LayoutWtf size={20} />
            </div>
            <div className='text-secondary fs-6'>Type of Balance:</div>
            <div className=' gap-5'>
              {currentCalibrationData?.typeOfBalance && (
                <img
                  src={`/images/balance-type-${currentCalibrationData?.typeOfBalance}.png`}
                  width={140}
                />
              )}
            </div>
          </div>
        </div>
      </Col>
    </Row>
  );
};

export default OtherMeasurements;
