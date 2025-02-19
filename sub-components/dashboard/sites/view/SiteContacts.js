import { db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Badge, Card, Col, Row } from 'react-bootstrap';
import { Exclamation } from 'react-bootstrap-icons';

const SiteContacts = ({ site }) => {
  const [contacts, setContacts] = useState({ data: [], isLoading: true, isError: false });

  useEffect(() => {
    if (!site || site?.contacts?.length < 1) return;

    const contactPromises = site.contacts.map((contactId) => {
      const contactRef = doc(db, 'contacts', contactId);
      return getDoc(contactRef);
    });

    Promise.all(contactPromises)
      .then((docsSnapshots) => {
        if (docsSnapshots.length > 0) {
          let contacts = [];

          for (const doc of docsSnapshots) {
            if (doc.exists()) contacts.push({ id: doc.id, ...doc.data() });
            else continue;
          }

          setContacts({
            data: contacts,
            isLoading: false,
            isError: false,
          });
        } else {
          setContacts({ data: [], isLoading: false, isError: false });
        }
      })
      .catch((err) => {
        console.error(err.message);
        setContacts({ data: [], isLoading: false, isError: true });
      });
  }, []);

  return (
    <Row>
      <Col lg={8}>
        <Card className='border-0 shadow-none mb-4'>
          <Card.Body>
            <div>
              <div
                className='d-flex flex-column gap-4 overflow-auto'
                style={{ maxHeight: '800px' }}
              >
                {contacts.data.length < 1 && (
                  <div className='text-center py-5'>
                    <Exclamation size={80} className='text-muted' />
                    <h6>No Contacts Available</h6>
                    <p className='text-muted small'>Add contacts to the site</p>
                  </div>
                )}

                {contacts.data.map((contact, i) => (
                  <div>
                    <h5 className='text-primary-label mb-2 fs-5'>Contact #{i + 1}</h5>

                    <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100'>
                      <div
                        className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                        style={{ width: '40px', height: '40px' }}
                      >
                        <i className='fe fe-phone'></i>
                      </div>

                      <Row className='w-100 row-gap-3'>
                        <Col lg={6}>
                          <div className='text-secondary fs-6'>First Name</div>
                          <div className='text-primary-label fw-semibold'>{contact.firstName}</div>
                        </Col>

                        <Col lg={6}>
                          <div className='text-secondary fs-6'>Last Name</div>
                          <div className='text-primary-label fw-semibold'>{contact.lastName}</div>
                        </Col>

                        <Col lg={6}>
                          <div className='text-secondary fs-6'>Phone</div>
                          <div className='text-primary-label fw-semibold'>{contact.phone}</div>
                        </Col>

                        <Col lg={6}>
                          <div className='text-secondary fs-6'>Email</div>
                          <div className='text-primary-label fw-semibold'>{contact.email}</div>
                        </Col>
                      </Row>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>

      <Col lg={4}>
        <Card className='my-4 bg-light-subtle rounded border border-light-subtle w-100'>
          <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
            <h5 className='mb-0'>Contact Overview</h5>
          </Card.Header>
          <Card.Body>
            <div className='text-center mb-4'>
              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: '600',
                  color: '#305cde',
                }}
              >
                {contacts.data.length > 0 ? contacts.data.length : 0}
              </div>
              <div className='text-muted' style={{ fontSize: '16px' }}>
                Total Contacts
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default SiteContacts;
