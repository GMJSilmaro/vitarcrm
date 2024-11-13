import React from 'react';
import Link from 'next/link';
import { Button } from 'react-bootstrap';
import { FaPlus, FaBell, FaArrowLeft } from 'react-icons/fa';

const DashboardHeader = ({
  title,
  subtitle,
  infoText,
  breadcrumbs,
  badges,
  actionButtons,
  showBackButton = false,
  onBackClick,
}) => {
  return (
    <div
      style={{
        background: "linear-gradient(90deg, #FF0000 0%, #CC0000 100%)", // VITAR red gradient
        padding: "1.5rem 2rem",
        borderRadius: "0 0 24px 24px",
        marginTop: "-39px",
        marginLeft: "10px",
        marginRight: "10px",
        marginBottom: "20px",
      }}
    >
      <div className="d-flex justify-content-between align-items-start">
        <div className="d-flex flex-column">
          {/* Title and Subtitle Section */}
          <div className="mb-3">
            <h1 className="dashboard-title">{title}</h1>
            <p className="dashboard-subtitle">{subtitle}</p>
            
            {infoText && (
              <div className="info-banner">
                <i className="fe fe-info"></i>
                <span>{infoText}</span>
              </div>
            )}
          </div>

          {/* Badges Section */}
          {badges && badges.length > 0 && (
            <div className="d-flex align-items-center gap-2 mb-4">
              {badges.map((badge, index) => (
                <span
                  key={index}
                  className={`dashboard-badge ${badge.variant || ''}`}
                >
                  {badge.icon && <i className={badge.icon}></i>}
                  {badge.text}
                </span>
              ))}
            </div>
          )}

          {/* Breadcrumbs */}
          {breadcrumbs && (
            <nav className="dashboard-breadcrumbs">
              <div className="d-flex align-items-center">
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && (
                      <span className="breadcrumb-separator">/</span>
                    )}
                    {crumb.link ? (
                      <Link
                        href={crumb.link}
                        className="breadcrumb-link"
                      >
                        {crumb.icon && <i className={crumb.icon}></i>}
                        {crumb.text}
                      </Link>
                    ) : (
                      <span className="breadcrumb-current">
                        {crumb.icon && <i className={crumb.icon}></i>}
                        {crumb.text}
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </nav>
          )}
        </div>

        {/* Action Buttons */}
        <div className="d-flex gap-2">
          {showBackButton && (
            <Button
              variant="light"
              className="header-button"
              onClick={onBackClick}
            >
              <FaArrowLeft className="me-2" />
              Back
            </Button>
          )}
          {actionButtons?.map((button, index) => (
            <Button
              key={index}
              variant={button.variant || "light"}
              className="header-button"
              onClick={button.onClick}
            >
              {button.icon}
              {button.text}
            </Button>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .dashboard-title {
          font-size: 28px;
          font-weight: 600;
          color: #FFFFFF;
          letter-spacing: -0.02em;
          margin-bottom: 0.5rem;
          font-family: 'Inter', sans-serif;
        }

        .dashboard-subtitle {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 400;
          line-height: 1.5;
          margin-bottom: 0.5rem;
          font-family: 'Inter', sans-serif;
        }

        .info-banner {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
          background: rgba(255, 255, 255, 0.1);
          padding: 8px 12px;
          border-radius: 6px;
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dashboard-badge {
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 500;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'Inter', sans-serif;
        }

        .dashboard-badge.primary {
          background: #FFFFFF;
          color: #FF0000;
        }

        .dashboard-badge.secondary {
          background: rgba(255, 255, 255, 0.2);
          color: #FFFFFF;
        }

        .dashboard-breadcrumbs {
          font-size: 14px;
          font-weight: 500;
          font-family: 'Inter', sans-serif;
        }

        .breadcrumb-link {
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }

        .breadcrumb-link:hover {
          color: #FFFFFF;
          transform: translateY(-1px);
        }

        .breadcrumb-current {
          color: #FFFFFF;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .breadcrumb-separator {
          color: rgba(255, 255, 255, 0.7);
          margin: 0 8px;
        }

        .header-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          font-weight: 500;
          font-size: 14px;
          border-radius: 6px;
          transition: all 0.2s ease;
          font-family: 'Inter', sans-serif;
        }

        .header-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .header-button:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

export default DashboardHeader; 