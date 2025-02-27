'use client';

import { Container, Card } from 'react-bootstrap';
import { GeeksSEO } from 'widgets';
import ContentHeader from 'components/dashboard/ContentHeader';
import JobForm from '@/sub-components/dashboard/jobs/JobForm';
import { useRouter } from 'next/router';
import {
  BriefcaseFill,
  House,
  HouseDoorFill,
  PlusCircle,
  PlusCircleFill,
} from 'react-bootstrap-icons';

const CreateJobs = () => {
  const router = useRouter();

  return (
    <Container>
      <GeeksSEO title='Create Job | SAS&ME - SAP B1 | Portal' />

      <ContentHeader
        title='Create New Job'
        description='Streamline your workflow by creating detailed job assignments with tasks, schedules, and assigned workers'
        infoText='Complete all required fields including job details, scheduling, and worker assignments'
        badgeText='Job Management'
        badgeText2='New Job'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <HouseDoorFill className='me-2' size={14} />,
          },
          {
            text: 'Jobs',
            link: '/jobs',
            icon: <BriefcaseFill className='me-2' size={14} />,
          },
          {
            text: 'Create Job',
            icon: <PlusCircleFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: 'Back to Jobs',
            icon: <i className='fe fe-arrow-left' />,
            variant: 'light',
            tooltip: 'Return to jobs list',
            onClick: () => router.push('/jobs'),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <JobForm />
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CreateJobs;
