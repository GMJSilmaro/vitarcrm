import React, { useEffect, useState } from 'react';
import { Col, Row, Container, Spinner, Alert, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { 
  Facebook,
  Twitter,
  Github,
  Linkedin,
  MessageCircle,
  Youtube,
  Book,
  Phone,
  Video
} from 'lucide-react';


const FooterWithSocialIcons = () => {
  const currentYear = new Date().getFullYear();

  const title = "VITAR Group";
  const description = "VITAR Group's comprehensive CRM and Calibration Management System. Streamline your customer relationships and calibration processes with our integrated digital solution.";
  const keywords = "CRM System, Calibration Management, Equipment Calibration, Customer Relationship Management, Business Solutions, Digital Transformation, VITAR Group, Calibration Software, Asset Management";


  const socialLinks = [
    {
      name: 'LinkedIn',
      icon: Linkedin,
      href: 'https://www.linkedin.com/company/pixelcare-consulting-corporation'
    },
    {
      name: 'Facebook',
      icon: Facebook,
      href: 'https://facebook.com/pixelcareconsulting'
    },

    {
      name: 'WhatsApp',
      icon: Phone,
      href: 'https://web.whatsapp.com/send?phone=6594525848&text='
    },
    {
      name: 'YouTube',
      icon: Youtube,
      href: 'https://www.youtube.com/channel/UCuy8i19SmgQG-me8espY0Ag/videos?view=0&sort=p'
    },

    {
      name: 'Company Profile',
      icon: Book,
      href: 'https://heyzine.com/flip-book/3088ace65b.html#page/1'
    }
  ];


  return (
    <footer className="bg-white">
      <Container fluid>
        <Row className="py-4 border-top">
          <Col lg={{ span: 10, offset: 1 }}>
            <Row className="align-items-center">
              <Col lg={7} md={12} className="mb-3 mb-lg-0">
                <p className="mb-0 text-secondary">
                  CRM & Calibration Management System © {title} {currentYear}{' '}
                  All rights reserved | Powered by{' '}
                  <a 
                    href="https://pixelcareconsulting.com"
                    className="text-decoration-none link-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Pixelcare Consulting
                  </a>
                </p>
              </Col>
              
              <Col lg={5} md={12}>
                <div className="d-flex flex-wrap justify-content-lg-end justify-content-center gap-3">
                  {socialLinks.map((social) => (
                    <OverlayTrigger
                      key={social.name}
                      placement="top"
                      overlay={<Tooltip id={`tooltip-${social.name}`}>{`Visit our ${social.name}`}</Tooltip>}
                    >
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-secondary p-2 d-inline-flex align-items-center justify-content-center rounded-circle hover-icon"
                        aria-label={`Visit our ${social.name} page`}
                      >
                        <social.icon size={20} />
                      </a>
                    </OverlayTrigger>
                  ))}
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>

      <style jsx>{`
        .hover-icon {
          transition: all 0.3s ease;
        }
        .hover-icon:hover {
          transform: translateY(-3px);
          background: rgba(0, 0, 0, 0.05);
          color: #0d6efd;
        }
      `}</style>
    </footer>
  );
};

export default FooterWithSocialIcons;