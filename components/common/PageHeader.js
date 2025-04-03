import React from 'react';

const PageHeader = ({ title, subtitle, action, children }) => {
  return (
    <div
      className='d-flex flex-column justify-content-center row-gap-3 p-5 rounded-4'
      style={{
        background: 'linear-gradient(135deg, #305cde 0%, #1e40a6 100%)',
      }}
    >
      <div className='d-flex justify-content-between align-items-start my-2'>
        <div>
          <h2 className='mb-0 text-white'>{title}</h2>
          <p className='text-white-50 mb-0'>{subtitle}</p>
        </div>

        {action}
      </div>

      {children}
    </div>
  );
};

export default PageHeader;
