'use client';

import { Row, Col, Container, Card } from 'react-bootstrap';
import { GeeksSEO } from 'widgets'
import AddNewJobs from 'sub-components/dashboard/jobs/CreateJobs';
import toast from 'react-hot-toast';
import Link from 'next/link';
import ContentHeader from 'components/dashboard/ContentHeader';

// Validation helper function
const validateJobForm = (formData) => {
  const requiredFields = {
    // Basic Job Info
    jobName: 'Job Name',
    jobDescription: 'Job Description',
    priority: 'Priority Level',
    
    // Scheduling
    startDate: 'Start Date',
    endDate: 'End Date',
    startTime: 'Start Time',
    endTime: 'End Time',
    
    // Customer Info
    customerID: 'Customer',
    
    // Location
    'location.locationName': 'Location Name',
    'location.address.streetAddress': 'Street Address',
    'location.address.city': 'City',
    'location.address.stateProvince': 'State/Province',
    'location.address.postalCode': 'Postal Code',
    
    // Workers
    assignedWorkers: 'Assigned Workers',
    
    // Contact
    'contact.contactID': 'Contact Person',
    'jobContactType.code': 'Job Contact Type',

    // Tasks (new addition)
    'taskList': 'Tasks'
  };

  const missingFields = [];
  
  // Check regular fields
  Object.entries(requiredFields).forEach(([field, label]) => {
    const value = field.includes('.') ? 
      field.split('.').reduce((obj, key) => obj?.[key], formData) : 
      formData[field];
      
    if (!value || (Array.isArray(value) && value.length === 0)) {
      missingFields.push(label);
    }
  });

  // Special validation for tasks
  if (formData.taskList && formData.taskList.length === 0) {
    missingFields.push('Please add at least 1 task to proceed');
  } else if (formData.taskList) {
    formData.taskList.forEach((task, index) => {
      if (!task.taskName?.trim()) {
        missingFields.push(`Task ${index + 1}: Task Name is required`);
      }
      if (!task.assignedTo) {
        missingFields.push(`Task ${index + 1}: Assigned Worker is required`);
      }
    });
  }

  return missingFields;
};

const CreateJobs = () => {
  return (
    <Container>
      <GeeksSEO title="Create Job | SAS&ME - SAP B1 | Portal" />
      <Row>
        <Col lg={12} md={12} sm={12}>
          <ContentHeader
            title="Create New Job"
            description="Streamline your workflow by creating detailed job assignments with tasks, schedules, and assigned workers"
            infoText="Complete all required fields including job details, scheduling, and worker assignments"
            badgeText="Job Management"
            badgeText2="New Job"
            breadcrumbItems={[
              {
                text: 'Dashboard',
                link: '/',
                icon: <i className="fe fe-home" style={{ marginRight: '8px' }} />
              },
              {
                text: 'Jobs',
                link: '/jobs',
                icon: <i className="fe fe-briefcase" style={{ marginRight: '8px' }} />
              },
              {
                text: 'Create Job',
                icon: <i className="fe fe-plus-circle" style={{ marginRight: '8px' }} />
              }
            ]}
            actionButton={{
              text: 'Back to Jobs',
              icon: <i className="fe fe-arrow-left" />,
              variant: 'light',
              tooltip: 'Return to jobs list',
              onClick: () => router.push('/jobs')
            }}
            customStyles={{
              background: "linear-gradient(90deg, #305cde 0%, #1e40a6 100%)"
            }}
          />
        </Col>
      </Row>

      <div className="border-bottom pb-1 mb-4 d-flex align-items-center justify-content-between">
           
      </div>  
      <Col xl={12} lg={12} md={12} sm={12}>
      
        <Card className="shadow-sm">
          <Card.Body>
            <AddNewJobs validateJobForm={validateJobForm} />
          </Card.Body>
        </Card>
      </Col>
      <style jsx global>{`
        .breadcrumb-link:hover {
          color: #ffffff !important;
          transform: translateY(-1px);
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
        }
      `}</style>
    </Container>
  )
}

export default CreateJobs;