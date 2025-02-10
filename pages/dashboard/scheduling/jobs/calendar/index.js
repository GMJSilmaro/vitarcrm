import React from 'react';
import { Card, Col, Row } from 'react-bootstrap';
import { FaHome, FaPlus } from 'react-icons/fa';

import { GeeksSEO } from '@/widgets';
import ContentHeader from '@/components/dashboard/ContentHeader';
import JobCalendar from './JobCalendar';
import { CalendarWeekFill } from 'react-bootstrap-icons';
import { useRouter } from 'next/router';

const JobSchedule = () => {
  const router = useRouter();

  return (
    <>
      <GeeksSEO title='Worker Schedules - VITAR Group | Portal' />

      <ContentHeader
        title='Job Calendar'
        description='View and manage all job schedules in an interactive calendar view'
        infoText='Double-click on any date to create a new job assignment'
        badgeText='Schedule Management'
        badgeText2='Calendar View'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <FaHome className='me-2' style={{ fontSize: '14px' }} />,
          },
          {
            text: 'Calendar',
            link: '/dashboard/scheduling/jobs/calendar',
            icon: <CalendarWeekFill className='me-2' style={{ fontSize: '14px' }} />,
          },
        ]}
        actionButtons={[
          {
            text: 'Create New Job',
            icon: <FaPlus size={16} />,
            variant: 'light',
            href: '/jobs/create',
            tooltip: 'Create a new job schedule',
            onClick: () => router.push('/jobs/create'),
          },
        ]}
      />

      <Card>
        <Card.Body>
          <div style={{ height: '84vh' }}>
            <JobCalendar />
          </div>
        </Card.Body>
      </Card>
    </>
  );
};

export default JobSchedule;
