import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Form, Button } from 'react-bootstrap';
import { LoggingService } from '@/services/loggingService';

const UploadLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState({
    type: '',
    startDate: '',
    endDate: ''
  });

  const loadLogs = async () => {
    const logs = await LoggingService.getLogs(filter);
    setLogs(logs);
  };

  useEffect(() => {
    loadLogs();
  }, [filter]);

  const getStatusBadge = (type) => {
    switch (type) {
      case 'row_success':
        return <Badge bg="success">Success</Badge>;
      case 'row_error':
        return <Badge bg="danger">Error</Badge>;
      case 'upload_start':
        return <Badge bg="primary">Start</Badge>;
      case 'upload_complete':
        return <Badge bg="info">Complete</Badge>;
      default:
        return <Badge bg="secondary">{type}</Badge>;
    }
  };

  return (
    <Card>
      <Card.Header>
        <h5>Upload Logs</h5>
        <div className="d-flex gap-3">
          <Form.Select 
            value={filter.type}
            onChange={(e) => setFilter({...filter, type: e.target.value})}
          >
            <option value="">All Types</option>
            <option value="upload_start">Upload Start</option>
            <option value="row_success">Success</option>
            <option value="row_error">Error</option>
            <option value="upload_complete">Complete</option>
          </Form.Select>
          <Button variant="secondary" onClick={() => LoggingService.clearLogs()}>
            Clear Logs
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        <Table responsive>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Type</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr key={index}>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
                <td>{getStatusBadge(log.type)}</td>
                <td>
                  <pre className="mb-0">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
};

export default UploadLogs; 