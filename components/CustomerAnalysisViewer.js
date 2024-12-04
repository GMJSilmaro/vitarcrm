import React, { useState, useEffect } from 'react';
import { Card, Accordion, Badge } from 'react-bootstrap';
import { Building, CheckCircle, XCircle, ExclamationCircle } from 'react-bootstrap-icons';

const CustomerAnalysisViewer = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const updateLogs = () => {
      const customerLogs = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('customerUploadLogs')) {
          try {
            const log = JSON.parse(localStorage.getItem(key));
            customerLogs.push(log);
          } catch (e) {
            console.error('Error parsing log:', e);
          }
        }
      }
      setLogs(customerLogs.reverse()); // Show newest first
    };

    updateLogs();
    const interval = setInterval(updateLogs, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="mt-3">
      <Card.Header className="bg-light d-flex justify-content-between align-items-center">
        <h6 className="mb-0">
          <Building className="me-2" />
          Customer Upload Analysis
        </h6>
        <Badge bg="secondary">{logs.length} Records</Badge>
      </Card.Header>
      <Card.Body className="p-0">
        <Accordion>
          {logs.map((log, index) => (
            <Accordion.Item key={index} eventKey={index.toString()}>
              <Accordion.Header>
                <div className="d-flex align-items-center gap-2 flex-grow-1">
                  {log.status === 'success' && <CheckCircle className="text-success" />}
                  {log.status === 'skip' && <ExclamationCircle className="text-warning" />}
                  {log.status === 'error' && <XCircle className="text-danger" />}
                  <span>{log.customerName}</span>
                  <Badge bg={log.status === 'success' ? 'success' : log.status === 'skip' ? 'warning' : 'danger'} className="ms-2">
                    {log.status === 'success' ? 'Added' : log.status === 'skip' ? 'Existing' : 'Error'}
                  </Badge>
                </div>
              </Accordion.Header>
              <Accordion.Body>
                <div className="small">
                  {log.status === 'success' && (
                    <>
                      <div>Site ID: <Badge bg="info">{log.siteId}</Badge></div>
                      <div>Customer Name: <code>{log.customerName}</code></div>
                      <div className="text-success mt-1">Successfully added location</div>
                    </>
                  )}
                  {log.status === 'skip' && (
                    <>
                      <div>Existing Customer ID: <Badge bg="warning">{log.existingCustomerId}</Badge></div>
                      <div className="text-warning mt-1">Customer already exists in database</div>
                    </>
                  )}
                  {log.status === 'error' && (
                    <div className="text-danger">Error: {log.error}</div>
                  )}
                  <div className="mt-1 text-muted">
                    Processed at: {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      </Card.Body>
    </Card>
  );
};

export default CustomerAnalysisViewer;