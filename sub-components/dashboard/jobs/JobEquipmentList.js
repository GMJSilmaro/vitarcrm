import React from 'react';
import { Badge, Button } from 'react-bootstrap';
import { Trash } from 'react-bootstrap-icons';

const JobEquipmentList = ({ data, handleRemoveEquipment, height, isAdmin }) => {
  return (
    <div
      className='d-flex flex-column rounded border border-primary px-2'
      style={{ minHeight: `${height}px`, maxHeight: `${height}px`, overflow: 'auto' }}
    >
      {data && data?.length < 1 && (
        <div
          className='d-flex justify-content-center align-align-items-center'
          style={{ minHeight: `${height - 2}px` }}
        >
          <div
            className='d-flex justify-content-center align-items-center'
            style={{ minHeight: 'fit-content' }}
          >
            <div className='text-center'>
              <h5 className='mb-1'>No Selected Equipment</h5>
              <p className='text-muted'>Please add at least one equipment to proceed</p>
            </div>
          </div>
        </div>
      )}

      {data &&
        data.length > 0 &&
        data.map((equipment, i) => (
          <div
            key={equipment.inventoryId}
            className={`d-flex p-3 justify-content-between align-items-center border-primary ${
              i === data.length - 1 ? '' : 'border-bottom'
            }`}
          >
            <div className='d-flex align-items-center gap-3'>
              <div>
                <div className='d-flex flex-column'>
                  <p className='mb-0'>
                    <strong className='pe-1'>TAGID:</strong>
                    <span className='text-muted'>{equipment?.tagId}</span>
                  </p>
                  <p className='mb-0'>
                    <strong className='pe-1'>DESCRIPTION:</strong>
                    <span className='text-muted'>{equipment?.description}</span>
                  </p>
                  <p className='mb-0'>
                    <strong className='pe-1'>MAKE:</strong>
                    <span className='text-muted'>{equipment?.make}</span>
                  </p>
                  <p className='mb-0'>
                    <strong className='pe-1'>MODEL:</strong>
                    <span className='text-muted'>{equipment?.model}</span>
                  </p>
                  <p className='mb-0'>
                    <strong className='pe-1'>SERIAL #:</strong>
                    <span className='text-muted'>{equipment?.serialNumber}</span>
                  </p>
                  <p className='mb-0'>
                    <strong className='pe-1'>TYPE:</strong>
                    <span className='text-muted'>{equipment?.type}</span>
                  </p>
                  <p className='mb-0'>
                    <strong className='pe-1'>TRACEABILITY:</strong>
                    <span className='text-muted'>{equipment?.traceability}</span>
                  </p>
                </div>

                <div className='d-flex align-items-center gap-2'>
                  <p className='mb-0'>
                    <strong className='pe-1'>CATEGORY: </strong>
                    {equipment?.category && (
                      <Badge className='text-capitalize' bg='primary'>
                        {equipment?.category}
                      </Badge>
                    )}
                  </p>
                  <p className='mb-0'>
                    <strong className='pe-1'>RANGE MIN / %: </strong>
                    {equipment?.rangeMin && equipment?.rangeMinPercent && (
                      <Badge className='text-capitalize' bg='secondary'>
                        {equipment?.rangeMin} / {equipment?.rangeMinPercent}
                      </Badge>
                    )}
                  </p>
                  <p className='mb-0'>
                    <strong className='pe-1'>RANGE MAX / %: </strong>
                    {equipment?.rangeMax && equipment?.rangeMaxPercent && (
                      <Badge className='text-capitalize' bg='danger'>
                        {equipment?.rangeMax} / {equipment?.rangeMaxPercent}
                      </Badge>
                    )}
                  </p>
                  <p className='mb-0'>
                    <strong className='pe-1'>CERT NO: </strong>
                    {equipment?.certificateNo && (
                      <Badge className='text-capitalize' bg='warning'>
                        {equipment?.certificateNo}
                      </Badge>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {isAdmin && (
              <Button
                className='p-2'
                variant='danger'
                size='sm'
                onClick={() => handleRemoveEquipment(equipment.inventoryId)}
              >
                <Trash size={18} />
              </Button>
            )}
          </div>
        ))}
    </div>
  );
};

export default JobEquipmentList;
