import { useRouter } from 'next/router';
import { Row, Col, Container } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import DefaultLayout from '../../../layouts/marketing/DefaultLayout';
import { RouteGuard } from '../../../components/RouteGuard';
import { WorkerStatsData, CalibrationPerformanceData, RecentCalibrationsData } from 'data/marketing/calibration/WorkerProfileData';

function WorkerProfile() {
  const { currentUser, isAdmin, workerId: currentWorkerId, loading: authLoading } = useAuth();
  const router = useRouter();
  const { workerId } = router.query;
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    // Don't process redirects until auth is loaded
    if (authLoading) return;

    // Redirect if not authenticated or trying to access another user's profile without admin rights
    if (!currentUser) {
      router.push('/login');
      return;
    }

    if (!isAdmin && workerId !== currentWorkerId) {
      router.push(`/dashboard/user/${currentWorkerId}`);
      return;
    }
    
    setPageLoading(false);
  }, [workerId, currentWorkerId, isAdmin, router, currentUser, authLoading]);

  if (authLoading || pageLoading) {
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
    <Container fluid>
      {/* Quick Stats Bar */}
      <Row className="bg-light border-bottom py-3 mb-4">
        <Col>
          <Container>
            <Row className="align-items-center">
              <Col xs="auto">
                <div className="d-flex align-items-center">
                  <div className="avatar avatar-lg me-3">
                    <img src="/images/avatar/default-avatar.png" alt="Profile" className="rounded-circle" />
                  </div>
                  <div>
                    <h4 className="mb-0">{currentUser?.name || 'Worker Name'}</h4>
                    <span className="text-muted">ID: {workerId}</span>
                  </div>
                </div>
              </Col>
              <Col>
                <div className="d-flex justify-content-end gap-2">
                  <div className="text-center px-3">
                    <h6 className="mb-0">Next Shift</h6>
                    <small className="text-muted">In 2 days</small>
                  </div>
                  <div className="text-center px-3 border-start">
                    <h6 className="mb-0">Certifications</h6>
                    <small className="text-muted">4 Active</small>
                  </div>
                  <div className="text-center px-3 border-start">
                    <h6 className="mb-0">Performance</h6>
                    <small className="text-success">98%</small>
                  </div>
                </div>
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>

      <Container>
        {/* Quick Menu */}
        <Row className="mb-4">
          <Col>
            <div className="d-flex gap-2 flex-wrap">
              <button className="btn btn-light">
                <i className="fe fe-calendar me-2"></i>
                Schedule
              </button>
              <button className="btn btn-light">
                <i className="fe fe-file-text me-2"></i>
                Reports
              </button>
              <button className="btn btn-light">
                <i className="fe fe-award me-2"></i>
                Certifications
              </button>
              <button className="btn btn-light">
                <i className="fe fe-message-square me-2"></i>
                Messages
              </button>
              <button className="btn btn-light">
                <i className="fe fe-settings me-2"></i>
                Settings
              </button>
            </div>
          </Col>
        </Row>

        {/* Existing Header Section - Updated */}
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="mb-0">Dashboard Overview</h2>
                <p className="text-muted mb-0">Welcome back! Here's what's happening with your work.</p>
              </div>
              <div>
                <button className="btn btn-outline-primary me-2">
                  <i className="fe fe-edit-2 me-2"></i>
                  Edit Profile
                </button>
                <button className="btn btn-primary">
                  <i className="fe fe-calendar me-2"></i>
                  View Schedule
                </button>
              </div>
            </div>
          </Col>
        </Row>

        {/* New Notifications Section */}
        <Row className="mb-4">
          <Col>
            <div className="bg-white rounded p-4">
              <h5 className="mb-3">Recent Notifications</h5>
              <div className="list-group list-group-flush">
                <div className="list-group-item d-flex align-items-center border-0">
                  <div className="bg-info-soft p-2 rounded me-3">
                    <i className="fe fe-bell text-info"></i>
                  </div>
                  <div className="flex-grow-1">
                    <p className="mb-0">New calibration assignment available</p>
                    <small className="text-muted">2 hours ago</small>
                  </div>
                  <button className="btn btn-sm btn-light">View</button>
                </div>
                <div className="list-group-item d-flex align-items-center border-0">
                  <div className="bg-warning-soft p-2 rounded me-3">
                    <i className="fe fe-clock text-warning"></i>
                  </div>
                  <div className="flex-grow-1">
                    <p className="mb-0">Certification renewal due in 30 days</p>
                    <small className="text-muted">1 day ago</small>
                  </div>
                  <button className="btn btn-sm btn-light">Review</button>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        {/* Existing Stats Overview */}
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
    </Container>
  );
}

export default function ProtectedWorkerProfile() {
  return (
    <RouteGuard>
      <WorkerProfile />
    </RouteGuard>
  );
}

ProtectedWorkerProfile.Layout = DefaultLayout;