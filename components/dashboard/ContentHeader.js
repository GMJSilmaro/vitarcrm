import React from 'react';
import { Button } from 'react-bootstrap';
import Link from 'next/link';

const ContentHeader = ({
  title,
  description,
  infoText,
  badgeText,
  badgeText2,
  breadcrumbItems = [],
  actionButtons = [],
  customStyles = {},
}) => {
  return (
    <div className="dashboard-header">
      <div
        style={{
          background: "linear-gradient(135deg, #305cde 0%, #1e40a6 100%)",
          padding: "1.5rem 2rem",
          borderRadius: "0 0 24px 24px",
          marginTop: "-31px",
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
                  color: '#305cde',
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

          {/* Action Buttons - Simplified */}
          {actionButtons && actionButtons.length > 0 && (
            <div className="d-flex gap-2">
              {actionButtons.map((button, index) => (
                <Button
                  key={index}
                  variant={button.variant}
                  onClick={button.onClick}
                  className="custom-action-button"
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                    border: button.variant.includes('outline') ? '1px solid' : 'none',
                    backgroundColor: button.variant === 'danger' ? '#1e40a6' : 
                                   button.variant === 'outline-primary' ? 'transparent' : 
                                   button.variant === 'outline-secondary' ? 'transparent' : '#fff',
                    color: button.variant.includes('outline') ? '#fff' : 
                          button.variant === 'danger' ? '#fff' : '#212529'
                  }}
                >
                  {button.icon && button.icon}
                  {button.text}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .custom-action-button {
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .custom-action-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
        }

        .custom-action-button:active {
          transform: translateY(0);
        }

        /* Specific button styles */
        .custom-action-button.btn-outline-secondary {
          border-color: rgba(255, 255, 255, 0.6);
          color: #fff;
        }

        .custom-action-button.btn-outline-secondary:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        .custom-action-button.btn-outline-primary {
          border-color: rgba(255, 255, 255, 0.8);
          color: #fff;
        }

        .custom-action-button.btn-outline-primary:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        .custom-action-button.btn-danger {
          background-color: #1e40a6;
          border: none;
        }

        .custom-action-button.btn-danger:hover {
          background-color: #c82333;
        }
      `}</style>
    </div>
  );
};

export default ContentHeader;