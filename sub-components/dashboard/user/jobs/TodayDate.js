import { format } from 'date-fns';
import { useEffect, useState } from 'react';

const TodayDate = () => {
  const [time, setTime] = useState(format(new Date(), 'PPPPp'));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(format(new Date(), 'PPPPp'));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className='d-flex align-items-center gap-3'>
      <span className='fw-bold' style={{ fontSize: 28, color: '#1e40a6' }}>
        {time}
      </span>
    </div>
  );
};

export default TodayDate;
