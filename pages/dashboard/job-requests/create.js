'use client';

import { Container, Card } from 'react-bootstrap';
import { GeeksSEO } from 'widgets';
import ContentHeader from 'components/dashboard/ContentHeader';
import { useRouter } from 'next/router';
import {
  ArrowLeftShort,
  EnvelopePaperFill,
  HouseDoorFill,
  PlusCircleFill,
} from 'react-bootstrap-icons';
import JobRequestForm from '@/sub-components/dashboard/job-requests/JobRequestForm';

const CreateJobs = () => {
  const router = useRouter();

  return (
    <>
      <GeeksSEO title='Create Job Request - VITAR Group | Portal' />

      <ContentHeader
        title='Create New Job Request'
        description='Create a new job request for a job assignment'
        infoText='Complete all the required fields to create a job request'
        badgeText='Job Request Management'
        badgeText2='New Job Request'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <HouseDoorFill className='me-2' size={14} />,
          },
          {
            text: 'Jobs Requests',
            link: '/job-requests',
            icon: <EnvelopePaperFill className='me-2' size={14} />,
          },
          {
            text: 'Create Job Request',
            icon: <PlusCircleFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: 'Back',
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () => router.push(`/job-requests`),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <JobRequestForm />
        </Card.Body>
      </Card>
    </>
  );
};

export default CreateJobs;
