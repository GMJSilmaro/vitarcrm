import ContentHeader from '@/components/dashboard/ContentHeader';
import { GeeksSEO } from '@/widgets';
import { Card } from 'react-bootstrap';
import { CalendarWeekFill, PersonLinesFill } from 'react-bootstrap-icons';
import { FaHome } from 'react-icons/fa';
import JobWorkerTimelineCalendar from './JobWorkerTimelineCalendar';

const TechnicianSchedule = () => {
  return (
    <>
      <GeeksSEO title='Technician Schedules - VITAR Group | Portal' />

      <ContentHeader
        title="Technician's Dispatch"
        description='Manage and monitor field service schedules and assignments in real-time'
        infoText='Click or click & drag on any time slot to create a new job assignment for a technician'
        badgeText='Technician Management'
        badgeText2='Scheduling'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <FaHome className='me-2' style={{ fontSize: '14px' }} />,
          },
          {
            text: 'Technician',
            link: '/workers',
            icon: <PersonLinesFill className='me-2' style={{ fontSize: '14px' }} />,
          },
          {
            text: 'Schedule',
            link: '/schedule',
            icon: <CalendarWeekFill className='me-2' style={{ fontSize: '14px' }} />,
          },
        ]}
      />

      <Card>
        <Card.Body>
          <div style={{ height: '84vh' }}>
            <JobWorkerTimelineCalendar />
          </div>
        </Card.Body>
      </Card>
    </>
  );
};

export default TechnicianSchedule;
