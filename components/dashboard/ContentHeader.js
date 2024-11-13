import React from 'react';
import { Button } from 'react-bootstrap';
import Link from 'next/link';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

const ContentHeader = ({
  title,
  description,
  infoText,
  badgeText,
  badgeText2,
  breadcrumbItems = [],
  actionButton, 
  customStyles = {},
}) => {
  return (
    <div className="dashboard-header">
      <div
        style={{
          background: "linear-gradient(135deg, #E31837 0%, #C41230 100%)",
          padding: "1.5rem 2rem",
          borderRadius: "0 0 24px 24px",
          marginTop: "-39px",
          marginLeft: "10px",
          marginRight: "10px",
          marginBottom: "20px",
          ...customStyles
        }}
      >
        <div className="d-flex justify-content-between align-items-start">
          <div className="d-flex flex-column">
            {/* Title and Description Section */}
            <div className="mb-3">
              <h1 
                className="mb-2" 
                style={{ 
                  fontSize: '28px',
                  fontWeight: '600',
                  color: '#FFFFFF',
                  letterSpacing: '-0.02em'
                }}
              >
                {title}
              </h1>
              <p 
                className="mb-2" 
                style={{ 
                  fontSize: '16px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: '400',
                  lineHeight: '1.5'
                }}
              >
                {description}
              </p>
              {infoText && (
                <div 
                  className="d-flex align-items-center gap-2"
                  style={{
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    marginTop: '8px'
                  }}
                >
                  <i className="fe fe-info" style={{ fontSize: '16px' }}></i>
                  <span>{infoText}</span>
                </div>
              )}
            </div>

            {/* Badges Section */}
            <div className="d-flex align-items-center gap-2 mb-4">
              <span 
                className="badge" 
                style={{ 
                  background: '#FFFFFF',
                  color: '#E31837',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontWeight: '500',
                  fontSize: '14px'
                }}
              >
                {badgeText}
              </span>
              <span 
                className="badge" 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontWeight: '500',
                  fontSize: '14px'
                }}
              >
                {badgeText2}
              </span>
            </div>

            {/* Breadcrumb */}
            {breadcrumbItems && (
              <nav style={{ fontSize: '14px', fontWeight: '500' }}>
                <div className="d-flex align-items-center">
                  {breadcrumbItems.map((item, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && (
                        <span className="mx-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>/</span>
                      )}
                      {item.link ? (
                        <Link 
                          href={item.link}
                          className="text-decoration-none d-flex align-items-center" 
                          style={{ color: index === breadcrumbItems.length - 1 ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)' }}
                        >
                          {item.icon}
                          <span>{item.text}</span>
                        </Link>
                      ) : (
                        <div className="d-flex align-items-center" style={{ color: '#FFFFFF' }}>
                          {item.icon}
                          <span>{item.text}</span>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </nav>
            )}
          </div>

          {/* Action Button - Enhanced styling */}
          {actionButton && (
            <div>
              {actionButton.tooltip ? (
                <OverlayTrigger
                  placement="left"
                  overlay={
                    <Tooltip 
                      id="button-tooltip" 
                      className="custom-tooltip"
                    >
                      {actionButton.tooltip}
                    </Tooltip>
                  }
                >
                  <div 
                    className={`d-inline-block button-wrapper ${actionButton.disabled ? 'disabled' : ''}`}
                  >
                    <Button 
                      variant={actionButton.variant || "light"}
                      className="custom-button"
                      style={{
                        border: 'none', 
                        borderRadius: '8px',
                        padding: '10px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        backgroundColor: '#fff',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      onClick={actionButton.onClick}
                      disabled={actionButton.disabled}
                    >
                      {actionButton.icon}
                      <span>{actionButton.text}</span>
                    </Button>
                  </div>
                </OverlayTrigger>
              ) : (
                <Button 
                  variant={actionButton.variant || "light"}
                  onClick={actionButton.onClick}
                  style={{
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    backgroundColor: '#fff'
                  }}
                >
                  {actionButton.icon}
                  <span>{actionButton.text}</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentHeader;