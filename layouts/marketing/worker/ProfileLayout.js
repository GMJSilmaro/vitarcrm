// import node module libraries
import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router'
import { Container, Row, Col, Nav, Navbar } from 'react-bootstrap';

// import widget/custom components
import { ProfileCover } from 'widgets';

// Worker Menu Items
const WorkerMenu = [
  {
    id: 1,
    title: 'Worker List',
    link: '/user/list',
    icon: 'users'
  },
  {
    id: 2,
    title: 'Create Worker',
    link: '/user/create',
    icon: 'user-plus'
  }
];

// Account Settings Menu Items
const AccountSettingsMenu = [
  {
    id: 1,
    title: 'Edit Profile',
    link: '/account-settings/edit-profile',
    icon: 'settings'
  },
  {
    id: 2,
    title: 'Security',
    link: '/account-settings/security',
    icon: 'shield'
  },
  {
    id: 3,
    title: 'Social Profiles',
    link: '/account-settings/social-profiles',
    icon: 'user'
  },
  {
    id: 4,
    title: 'Notifications',
    link: '/account-settings/notifications',
    icon: 'bell'
  },
  {
    id: 5,
    title: 'Profile Privacy',
    link: '/account-settings/profile-privacy',
    icon: 'lock'
  }
];

const WorkerProfileLayout = (props) => {
  const location = useRouter();
  const { workerId } = location.query;
  const { worker } = props;

  useEffect(() => {
    document.body.className = 'bg-light';
  });

  const dashboardData = {
    avatar: '/images/avatar/avatar-1.jpg',
    name: 'Worker Profile',
    username: workerId || 'Worker ID',
    linkname: 'Dashboard',
    link: '/dashboard',
    verified: true,
    outlinebutton: true,
    level: 'Active',
  };

  return (
    <section className="pt-5 pb-5">
      <Container>
        {/* User info */}
        <ProfileCover dashboardData={dashboardData} />

        {/* Content */}
        <Row className="mt-0 mt-md-4">
          <Col lg={3} md={4} sm={12}>
            <Navbar
              expand="lg"
              className="navbar navbar-expand-md navbar-light shadow-sm mb-4 mb-lg-0 sidenav"
            >
              <Link
                href="#"
                className="d-xl-none d-lg-none d-md-none text-inherit fw-bold fs-5 float-start py-1">
                Menu
              </Link>
              <Navbar.Toggle
                aria-controls="basic-navbar-nav"
                className="p-0 focus-none border-0"
                label="Responsive Menu"
              >
                <span
                  className="navbar-toggler d-md-none icon-shape icon-sm rounded bg-primary p-0 text-white float-end"
                  data-bs-toggle="collapse"
                  data-bs-target="#sidenav"
                  aria-controls="sidenav"
                  aria-expanded="false"
                  aria-label="Toggle navigation"
                >
                  <span className="fe fe-menu"></span>
                </span>
              </Navbar.Toggle>

              <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="me-auto flex-column" as="ul" activeKey="0">
                  <Nav.Item className="navbar-header" as="li">
                    WORKERS
                  </Nav.Item>
                  {WorkerMenu.map((item, index) => (
                    <Nav.Item
                      as="li"
                      key={index}
                      className={`${item.link === location.pathname ? 'active' : ''}`}
                    >
                      <Link href={item.link} className="nav-link">
                        <i className={`fe fe-${item.icon} nav-icon`}></i>
                        {item.title}
                      </Link>
                    </Nav.Item>
                  ))}

                  {worker && (
                    <>
                      <Nav.Item className="navbar-header mt-4" as="li">
                        SKILLS & EXPERTISE
                      </Nav.Item>
                      {worker.skills?.map((skill, index) => (
                        <Nav.Item as="li" key={index}>
                          <span className="nav-link">
                            <i className="fe fe-check-circle nav-icon text-success"></i>
                            {skill}
                          </span>
                        </Nav.Item>
                      ))}

                      <Nav.Item className="navbar-header mt-4" as="li">
                        CERTIFICATIONS
                      </Nav.Item>
                      {worker.certifications?.map((cert, index) => (
                        <Nav.Item as="li" key={index}>
                          <span className="nav-link">
                            <span className="me-2">{cert.icon}</span>
                            {cert.name}
                            <small className="text-muted d-block">
                              Obtained in {cert.date}
                            </small>
                          </span>
                        </Nav.Item>
                      ))}
                    </>
                  )}

                  <Nav.Item className="navbar-header mt-4" as="li">
                    ACCOUNT SETTINGS
                  </Nav.Item>
                  {AccountSettingsMenu.map((item, index) => (
                    <Nav.Item
                      as="li"
                      key={index}
                      className={`${item.link === location.pathname ? 'active' : ''}`}
                    >
                      <Link href={item.link} className="nav-link">
                        <i className={`fe fe-${item.icon} nav-icon`}></i>
                        {item.title}
                      </Link>
                    </Nav.Item>
                  ))}
                </Nav>
              </Navbar.Collapse>
            </Navbar>
          </Col>

          <Col lg={9} md={8} sm={12}>
            {props.children}
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default WorkerProfileLayout; 