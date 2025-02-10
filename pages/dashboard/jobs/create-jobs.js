'use client';

import { Col, Container, Card } from 'react-bootstrap';
import { GeeksSEO } from 'widgets';
import ContentHeader from 'components/dashboard/ContentHeader';
import JobForm from '@/sub-components/dashboard/jobs/JobForm';

const CreateJobs = () => {
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
            icon: <i className='fe fe-home' style={{ marginRight: '8px' }} />,
          },
          {
            text: 'Jobs',
            link: '/jobs',
            icon: (
              <i className='fe fe-briefcase' style={{ marginRight: '8px' }} />
            ),
          },
          {
            text: 'Create Job',
            icon: (
              <i className='fe fe-plus-circle' style={{ marginRight: '8px' }} />
            ),
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
        customStyles={{
          background: 'linear-gradient(90deg, #305cde 0%, #1e40a6 100%)',
        }}
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
