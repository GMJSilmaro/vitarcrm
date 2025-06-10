import React, { useState } from 'react';
import { Badge, Button, Dropdown, OverlayTrigger, Spinner } from 'react-bootstrap';
import Link from 'next/link';
import { InfoCircle, ThreeDotsVertical } from 'react-bootstrap-icons';

const ContentHeader = ({
  title,
  description,
  infoText,
  badgeText,
  badgeText2,
  customBadges = [],
  breadcrumbItems = [],
  actionButtons = [],
  dropdownItems = [],
  customStyles = {},
}) => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div>
      <div
        style={{
          background: 'linear-gradient(135deg, #305cde 0%, #1e40a6 100%)',
          padding: '1.5rem 2rem',
          borderRadius: '0 0 24px 24px',
          marginTop: '-31px',
          marginLeft: '10px',
          marginRight: '10px',
          marginBottom: '20px',
          ...customStyles,
        }}
      >
        <div className='d-flex justify-content-between flex-wrap align-items-start gap-2'>
          <div className='d-flex flex-column order-2 order-md-1'>
            {/* Title and Description Section */}
            <div className='mb-3'>
              <h1
                className='mb-2'
                style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#FFFFFF',
                  letterSpacing: '-0.02em',
                }}
              >
                {title}
              </h1>
              <p
                className='mb-2'
                style={{
                  fontSize: '16px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: '400',
                  lineHeight: '1.5',
                }}
              >
                {description}
              </p>
              {infoText && (
                <div
                  className='d-flex align-items-center gap-2'
                  style={{
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    marginTop: '8px',
                  }}
                >
                  <InfoCircle className='flex-flex-shrink-0' size={16} />
                  <span>{infoText}</span>
                </div>
              )}
            </div>

            {/* Badges Section */}
            <div className='d-flex align-items-center gap-2 mb-4 flex-wrap'>
              <span
                className='badge'
                style={{
                  background: '#FFFFFF',
                  color: '#305cde',
                  borderRadius: '6px',
                  fontWeight: '500',
                  fontSize: '14px',
                }}
              >
                {badgeText}
              </span>
              <span
                className='badge'
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontWeight: '500',
                  fontSize: '14px',
                }}
              >
                {badgeText2}
              </span>

              {customBadges &&
                customBadges.map((badge) => (
                  <Badge bg={badge.color} style={{ fontSize: '14px' }}>
                    {badge.label}
                  </Badge>
                ))}
            </div>

            {/* Breadcrumb */}
            {breadcrumbItems && (
              <nav style={{ fontSize: '14px', fontWeight: '500' }}>
                <div className='d-flex align-items-center flex-wrap'>
                  {breadcrumbItems.map((item, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && (
                        <span className='mx-2' style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          /
                        </span>
                      )}
                      {item.link ? (
                        <Link
                          href={item.link}
                          className='text-decoration-none d-flex align-items-center'
                          style={{
                            color:
                              index === breadcrumbItems.length - 1
                                ? '#FFFFFF'
                                : 'rgba(255, 255, 255, 0.7)',
                          }}
                        >
                          {item.icon}
                          <span>{item.text}</span>
                        </Link>
                      ) : (
                        <div className='d-flex align-items-center' style={{ color: '#FFFFFF' }}>
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
          <div className='d-flex gap-2 order-1 order-md-2 ms-auto mt-3 mt-md-0'>
            {actionButtons &&
              actionButtons.length > 0 &&
              actionButtons.map((button, index) => (
                <Button
                  key={index}
                  variant={button.variant}
                  onClick={(event) => button.onClick({ event, setIsLoading })}
                  disabled={isLoading || button?.disabled}
                  className='custom-action-button'
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                    border: button.variant.includes('outline') ? '1px solid' : 'none',
                    backgroundColor:
                      button.variant === 'danger'
                        ? '#1e40a6'
                        : button.variant === 'outline-primary'
                        ? 'transparent'
                        : button.variant === 'outline-secondary'
                        ? 'transparent'
                        : '#fff',
                    color: button.variant.includes('outline')
                      ? '#fff'
                      : button.variant === 'danger'
                      ? '#fff'
                      : '#212529',
                  }}
                >
                  {isLoading && <Spinner size='sm' animation='border' variant='primary' />}
                  {button.icon && !isLoading && button.icon}
                  {button.text}
                </Button>
              ))}

            {dropdownItems && dropdownItems.length > 0 && (
              <OverlayTrigger
                rootClose
                trigger='click'
                placement='left-start'
                overlay={
                  <Dropdown.Menu show style={{ zIndex: 999 }}>
                    {dropdownItems.map(({ label, icon: Icon, onClick, disabled }) => (
                      <Dropdown.Item
                        disabled={disabled || isLoading}
                        onClick={(event) => onClick({ event, setIsLoading })}
                      >
                        <Icon className='me-2' size={16} />
                        {label}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                }
              >
                <Button variant='light' className='p-2' size='sm' disabled={isLoading}>
                  {isLoading ? (
                    <Spinner animation='border' size='sm' />
                  ) : (
                    <ThreeDotsVertical size={16} />
                  )}
                </Button>
              </OverlayTrigger>
            )}
          </div>
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
