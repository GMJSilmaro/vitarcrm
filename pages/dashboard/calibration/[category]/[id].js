import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Card, Row, Col, Button, Badge, Nav, Tab } from 'react-bootstrap';
import {
  FileText,
  Pencil,
  Calendar3,
  GraphUp,
  Tools,
  InfoCircle,
  ExclamationTriangle,
  Clock,
} from 'react-bootstrap-icons';

import {
  mechanicalData,
  pressureData,
  temperatureData,
  electricalData,
  dimensionalData,
  volumetricData,
} from '@/mocks/calibration/mechanicalData';
import CalibrationHistory from '@/components/dashboard/calibration/CalibrationHistory';
import CalibrationGraph from '@/components/dashboard/calibration/CalibrationGraph';
import CalibrationSchedule from '@/components/dashboard/calibration/CalibrationSchedule';
import { CategoryDetails } from '@/components/dashboard/calibration/sections';
import CalibrationDetailsLayout from '../layouts/CalibrationDetailsLayout';
import CertificatePreview from '@/components/dashboard/calibration/CertificatePreview';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { orderBy } from 'lodash';
import { db } from '@/firebase';

const CATEGORY_DATA_MAP = {
  mechanical: mechanicalData,
  pressure: pressureData,
  temperature: temperatureData,
  electrical: electricalData,
  dimensional: dimensionalData,
  volumetric: volumetricData,
};

const CalibrationDetails = () => {
  const router = useRouter();
  const { id, category } = router.query;
  const [loading, setLoading] = useState(true);
  const [equipment, setEquipment] = useState(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (category && id) {
      const q = query(
        collection(db, 'equipments'),
        where('category', '==', category.toUpperCase()),
        where('inventoryId', '==', id)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            setEquipment(snapshot.docs[0].data());
            setLoading(false);
          }
        },
        (err) => {
          setLoading(false);
          console.error(err.message);
        }
      );
      return () => unsubscribe();
    }
  }, [category, id]);

  console.log('equipment:', equipment);

  const renderDetailsComponent = useMemo(() => {
    if (!category || !equipment) return null;
    const DetailComponent = CategoryDetails[category.toUpperCase()];

    return DetailComponent ? <DetailComponent equipment={equipment} /> : null;
  }, [category, equipment]);

  if (loading) {
    return (
      <CalibrationDetailsLayout>
        <div className='text-center py-5'>
          <div className='spinner-border text-primary' role='status'>
            <span className='visually-hidden'>Loading...</span>
          </div>
        </div>
      </CalibrationDetailsLayout>
    );
  }

  if (error || !equipment) {
    return (
      <CalibrationDetailsLayout>
        <Card className='border-0 shadow-sm'>
          <Card.Body className='text-center py-5'>
            <div className='text-danger mb-3'>
              <ExclamationTriangle size={48} />
            </div>
            <h5>{error || 'Equipment not found'}</h5>
            <Button variant='outline-primary' className='mt-3' onClick={() => router.back()}>
              Go Back
            </Button>
          </Card.Body>
        </Card>
      </CalibrationDetailsLayout>
    );
  }

  return (
    <CalibrationDetailsLayout
      equipment={equipment}
      showCertificate={showCertificate}
      onHideCertificate={() => setShowCertificate(false)}
    >
      <Card className='border-0 shadow-sm'>
        <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
          <Nav variant='tabs'>
            <Nav.Item>
              <Nav.Link
                eventKey='details'
                active={activeTab === 'details'}
                onClick={() => setActiveTab('details')}
                className='d-flex align-items-center'
              >
                <InfoCircle className='me-2' />
                Details
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                eventKey='history'
                active={activeTab === 'history'}
                onClick={() => setActiveTab('history')}
                className='d-flex align-items-center'
              >
                <FileText className='me-2' />
                History
              </Nav.Link>
            </Nav.Item>

            <Nav.Item>
              <Nav.Link
                eventKey='schedule'
                active={activeTab === 'schedule'}
                onClick={() => setActiveTab('schedule')}
                className='d-flex align-items-center'
              >
                <Clock className='me-2' />
                Schedule
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Card.Header>

        <Card.Body className='p-4'>
          {activeTab === 'details' && renderDetailsComponent}
          {activeTab === 'history' && <CalibrationHistory equipment={equipment} />}
          {activeTab === 'trends' && <CalibrationGraph equipment={equipment} />}
          {activeTab === 'schedule' && <CalibrationSchedule equipment={equipment} />}
        </Card.Body>
      </Card>
      <CertificatePreview
        show={showCertificate}
        onHide={() => setShowCertificate(false)}
        equipment={equipment}
        category={category}
        certificate={{
          certificateNo: equipment.certificateNo,
          // ... other certificate data
        }}
      />
    </CalibrationDetailsLayout>
  );
};

export default CalibrationDetails;
