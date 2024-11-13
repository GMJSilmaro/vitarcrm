import React from 'react';
import { Button } from 'react-bootstrap';
import { FaBell, FaPlus } from 'react-icons/fa';

const DashboardHeader = ({
  title,
  subtitle,
  userName,
  onWhatsNewClick,
  onCreateClick,
  FilterComponent,
  currentFilter,
  onFilterChange,
  customStyles = {},
}) => {
  return (
    <div className="dashboard-header">
      <div
        style={{
          background: "linear-gradient(135deg, #E31837 0%, #C41230 100%)",
          padding: "1.5rem 2rem",
          borderRadius: "0 0 24px 24px",
          marginTop: "-40px",
          marginBottom: "20px",
          ...customStyles
        }}
      >
        <div className="d-flex flex-column gap-4">
          {/* Header Content */}
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h1 className="h3 text-white fw-bold mb-1">
                {title}
              </h1>
              <p className="mb-0 text-white">
                {subtitle}{" "}
                <span className="fw-medium">
                  {userName || "NA"}
                </span>{" "}
                👋
              </p>
            </div>

            {/* Action Buttons */}
            <div className="d-flex gap-3 align-items-center">
              <Button
                onClick={onWhatsNewClick}
                className="whats-new-button"
                variant="outline-light"
              >
                <FaBell size={16} />
                <span>What's New</span>
              </Button>

              <Button
                onClick={onCreateClick}
                className="create-job-button"
                variant="light"
              >
                <FaPlus size={16} />
                <span>Create Job</span>
              </Button>
            </div>
          </div>

          {/* Filter Buttons */}
          {FilterComponent && (
            <div className="d-flex justify-content-between align-items-center">
              <FilterComponent
                currentFilter={currentFilter}
                onFilterChange={onFilterChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader; 