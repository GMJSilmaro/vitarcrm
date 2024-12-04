import React, { Fragment, useState } from 'react';
import { Card } from 'react-bootstrap';
import { GeeksSEO } from 'widgets';
import CalibrationLayout from './layouts/CalibrationLayout';
import FilterPanel from '@/components/dashboard/FilterPanel';
import DataTable from '@/components/dashboard/DataTable';
import { ThermometerHalf } from 'react-bootstrap-icons';
import toast from 'react-hot-toast';
import { temperatureData } from '@/mocks/calibration/temperatureData';
import { getCalibrationColumns } from '@/constants/calibrationColumns';
import { handleSearch as handleSearchUtil, handleClearFilters as handleClearFiltersUtil } from '@/utils/calibrationUtils';
import { useRouter } from 'next/router';
import CertificatePreview from './components/CertificatePreview';

const Temperature = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(temperatureData);
  const [totalRows, setTotalRows] = useState(temperatureData.length);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [showCertificate, setShowCertificate] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  
  const [filters, setFilters] = useState({
    searchTerm: '',
    tagId: '',
    type: '',
    make: '',
    certificateNo: ''
  });

  const filterFields = [
    {
      name: 'tagId',
      label: 'Tag ID',
      placeholder: 'Enter Tag ID',
      type: 'text',
      colSize: 6
    },
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'Reference', label: 'Reference' },
        { value: 'Working', label: 'Working' }
      ],
      colSize: 6
    },
    {
      name: 'make',
      label: 'Make',
      placeholder: 'Enter manufacturer',
      type: 'text',
      colSize: 6
    },
    {
      name: 'certificateNo',
      label: 'Certificate No',
      placeholder: 'Enter certificate number',
      type: 'text',
      colSize: 6
    }
  ];

  const handleSearchSubmit = async (searchFilters) => {
    setLoading(true);
    try {
      await handleSearchUtil(searchFilters, temperatureData, setData, setTotalRows);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFiltersClick = () => {
    handleClearFiltersUtil(setFilters, temperatureData, setData, setTotalRows);
  };

  const handleViewCertificate = (equipment) => {
    setSelectedEquipment(equipment);
    setShowCertificate(true);
  };

  return (
    <Fragment>
      <GeeksSEO title="Temperature Calibration | VITAR Group" />
      <CalibrationLayout 
        category="temperature"
      >
        <FilterPanel 
          filters={filters}
          setFilters={setFilters}
          onClear={handleClearFiltersClick}
          loading={loading}
          handleSearch={handleSearchSubmit}
          filterFields={filterFields}
          quickSearchPlaceholder="Search by Tag ID, Make, or Certificate No..."
        />
        
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-4">
            <DataTable 
              columns={getCalibrationColumns(router, handleViewCertificate)}
              data={data}
              loading={loading}
              currentPage={currentPage}
              perPage={perPage}
              totalRows={totalRows}
              onPageChange={setCurrentPage}
              onPerPageChange={setPerPage}
              emptyMessage="No temperature calibration equipment found"
              loadingMessage="Loading temperature calibration equipment..."
            />
          </Card.Body>
        </Card>

        {/* Certificate Modal */}
        {selectedEquipment && (
          <CertificatePreview
            show={showCertificate}
            onHide={() => setShowCertificate(false)}
            equipment={selectedEquipment}
            certificate={{
              certificateNo: selectedEquipment.certificateNo,
              labNumber: 'LAB-001',
              customerName: 'VITAR Group',
              customerAddress: '123 Calibration St.',
              calibrationDate: '2024-01-15',
              nextDueDate: '2025-01-15',
              results: [
                {
                  nominal: selectedEquipment.rangeMin,
                  standard: selectedEquipment.rangeMin,
                  uut: selectedEquipment.rangeMin,
                  error: '0.000',
                  uncertainty: '0.001',
                  status: 'Pass'
                },
                {
                  nominal: selectedEquipment.rangeMax,
                  standard: selectedEquipment.rangeMax,
                  uut: selectedEquipment.rangeMax,
                  error: '0.000',
                  uncertainty: '0.001',
                  status: 'Pass'
                }
              ],
              environmental: {
                temperature: '23.0',
                humidity: '45',
                pressure: '1013.25'
              },
              referenceStandards: [
                {
                  description: 'Reference Standard',
                  idNumber: 'RS-001',
                  certificateNo: 'NMIM-2023-001',
                  dueDate: '2024-12-31'
                }
              ]
            }}
          />
        )}
      </CalibrationLayout>
    </Fragment>
  );
};

export default Temperature; 