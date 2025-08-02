import React, { useState } from 'react';
import { Badge, Button, Dropdown, OverlayTrigger, Spinner } from 'react-bootstrap';
import { ThreeDotsVertical } from 'react-bootstrap-icons';

const PageHeader = ({
  title,
  subtitle,
  action,
  children,
  customBadges = [],
  dropdownItems = [],
  actionButtons = [],
}) => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div
      className='d-flex flex-column justify-content-center row-gap-3 py-4 px-5 rounded-4'
      style={{
        background: 'linear-gradient(135deg, #305cde 0%, #1e40a6 100%)',
      }}
    >
      <div className='d-flex justify-content-between flex-wrap align-items-start gap-2'>
        <div className='d-flex flex-column justify-content-center gap-2'>
          <div>
            <h2 className='mb-0 text-white'>{title}</h2>
            <p className='text-white-50 mb-0'>{subtitle}</p>
          </div>

          <div className='d-flex align-items-center gap-2 mb-3 flex-wrap'>
            {customBadges &&
              customBadges.map(({ icon: Icon, color, label }) => (
                <Badge
                  className='d-flex align-items-center'
                  bg={color}
                  style={{ fontSize: '14px' }}
                >
                  {Icon && <Icon className='me-2' size={12} />} {label}
                </Badge>
              ))}
          </div>
        </div>

        <div className='d-flex gap-2'>
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

      {children}
    </div>
  );
};

export default PageHeader;
