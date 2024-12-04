import { useRouter } from 'next/router';
import { Row, Col, Container } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DefaultLayout from '../../layouts/marketing/DefaultLayout';
import { RouteGuard } from '../../components/RouteGuard';
import { WorkerStatsData, CalibrationPerformanceData, RecentCalibrationsData } from 'data/marketing/calibration/WorkerProfileData';

function WorkerProfile() {
  const { currentUser, userRole } = useAuth();
  const router = useRouter();
  const { workerId } = router.query;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (loading) {
    return (
      <Container>
        <div className="text-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      {/* Header Section */}
      <Row className="mb-4 mt-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="mb-0">Worker Profile</h2>
            <div>
              <button className="btn btn-outline-primary me-2">Edit Profile</button>
              <button className="btn btn-primary">Schedule</button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Stats Overview */}
      <Row className="g-4">
        {WorkerStatsData.map((stat) => (
          <Col md={2} key={stat.id}>
            <div className="bg-white rounded p-4">
              <div className="d-flex align-items-center mb-3">
                <i className={`fe fe-${stat.icon} text-${stat.color} me-2`}></i>
                <span className="text-muted small">{stat.title}</span>
              </div>
              <h3 className="mb-1">{stat.value}</h3>
              <small className="text-muted">{stat.subtitle}</small>
            </div>
          </Col>
        ))}
      </Row>

      {/* Performance Overview */}
      <div className="bg-white rounded p-4 mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="mb-0">Calibration Performance</h4>
          <div className="progress-list">
            <div className="d-flex align-items-center mb-2">
              <div className="flex-grow-1">
                <h6>Uncertainty Compliance</h6>
                <div className="progress" style={{ height: '6px' }}>
                  <div 
                    className="progress-bar bg-success" 
                    style={{ width: `${CalibrationPerformanceData.uncertaintyCompliance}%` }}
                  ></div>
                </div>
              </div>
              <span className="ms-2">{CalibrationPerformanceData.uncertaintyCompliance}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Calibrations */}
      <div className="bg-white rounded p-4 mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="mb-0">Recent Calibrations</h4>
          <button className="btn btn-outline-primary btn-sm">View All</button>
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>Equipment</th>
                <th>Description</th>
                <th>Accuracy</th>
                <th>Priority</th>
                <th>Date</th>
                <th>Next Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {RecentCalibrationsData.map((item) => (
                <tr key={item.id}>
                  <td>{item.equipment}</td>
                  <td>{item.description}</td>
                  <td>
                    <span className="badge bg-info">{item.accuracy}</span>
                  </td>
                  <td>
                    <span className={`badge bg-${item.priority === 'High' ? 'danger' : 'warning'}`}>
                      {item.priority}
                    </span>
                  </td>
                  <td>{new Date(item.date).toLocaleDateString()}</td>
                  <td>{item.nextDue}</td>
                  <td>
                    <span className={`badge bg-${item.status === 'Completed' ? 'success' : 'warning'}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Container>
  );
}

export default function ProtectedWorkerProfile() {
  return (
    <RouteGuard requiredRole="worker">
      <WorkerProfile />
    </RouteGuard>
  );
}

// Change layout to DefaultLayout
ProtectedWorkerProfile.Layout = DefaultLayout; 