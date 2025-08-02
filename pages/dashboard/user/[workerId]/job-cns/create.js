import PageHeader from '@/components/common/PageHeader';
import JobCnForm from '@/sub-components/dashboard/job-cns/JobCnForm';
import { GeeksSEO } from '@/widgets';
import { useRouter } from 'next/router';
import React from 'react';
import { Card } from 'react-bootstrap';
import { ArrowLeftShort } from 'react-bootstrap-icons';

const CreateJobCn = () => {
  const router = useRouter();
  const { jobId, workerId } = router.query;

  return (
    <>
      <GeeksSEO title='Create Job Customer Notification | VITAR Group | Portal' />

      <div className='d-flex flex-column row-gap-4'>
        <PageHeader
          title={`Create Job Customer Notification For Job #${jobId}`}
          subtitle='Create job customer notification based on specific job'
          actionButtons={[
            {
              text: 'Back',
              icon: <ArrowLeftShort size={20} />,
              variant: 'outline-primary',
              onClick: () => router.push(`/user/${workerId}/jobs/view/${jobId}`),
            },
          ]}
        />

        <Card className='shadow-sm'>
          <Card.Body>
            <JobCnForm isAdmin={false} />
          </Card.Body>
        </Card>
      </div>
    </>
  );
};

export default CreateJobCn;
