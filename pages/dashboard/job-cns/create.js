'use client';

import { Container, Card } from 'react-bootstrap';
import { GeeksSEO } from 'widgets';
import ContentHeader from 'components/dashboard/ContentHeader';
import { useRouter } from 'next/router';
import {
  ArrowLeftShort,
  ChatLeftTextFill,
  EnvelopePaperFill,
  HouseDoorFill,
  PlusCircleFill,
} from 'react-bootstrap-icons';
import JobCnForm from '@/sub-components/dashboard/job-cns/JobCnForm';

const CreateJobCn = () => {
  const router = useRouter();

  return (
    <>
      <GeeksSEO title='Create Job Customer Notification - VITAR Group | Portal' />

      <ContentHeader
        title='Create New Job CN'
        description='Create a new job customer notification based on specific job'
        infoText='Complete all the required fields to create a job customer notification'
        badgeText='Job Customer Notification Management'
        badgeText2='New Job Customer Notification'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <HouseDoorFill className='me-2' size={14} />,
          },
          {
            text: 'Jobs CN',
            link: '/job-cns',
            icon: <ChatLeftTextFill className='me-2' size={14} />,
          },
          {
            text: 'Create Job Customer Notification',
            icon: <PlusCircleFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: 'Back',
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () => router.push(`/job-cns`),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <JobCnForm />
        </Card.Body>
      </Card>
    </>
  );
};

export default CreateJobCn;
