import toast from 'react-hot-toast';

export const handleSearch = async (searchFilters, data, setData, setTotalRows) => {
  try {
    // Mock API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Filter logic
    const filteredData = data.filter((item) => {
      return (
        (!searchFilters.tagId ||
          item.tagId.toLowerCase().includes(searchFilters.tagId.toLowerCase())) &&
        (!searchFilters.type || item.type === searchFilters.type) &&
        (!searchFilters.make ||
          item.make.toLowerCase().includes(searchFilters.make.toLowerCase())) &&
        (!searchFilters.certificateNo ||
          item.certificateNo.toLowerCase().includes(searchFilters.certificateNo.toLowerCase()))
      );
    });

    console.log({ data, filteredData });
    setData(filteredData);
    setTotalRows(filteredData.length);
    toast.success('Search completed');
    return filteredData;
  } catch (error) {
    console.error('Search error:', error);
    toast.error('Search failed');
    return [];
  }
};

export const handleClearFilters = (setFilters, initialData, setData, setTotalRows) => {
  setFilters({
    searchTerm: '',
    tagId: '',
    type: '',
    make: '',
    certificateNo: '',
  });
  setData(initialData);
  setTotalRows(initialData.length);
  toast.success('Filters cleared');
};

export const handleViewDetails = (router, row) => {
  router.push(`/dashboard/calibration/${row.category.toLowerCase()}/${row.inventoryId}`);
};

export const handleEdit = (router, row) => {
  router.push(`/dashboard/calibration/${row.category.toLowerCase()}/edit/${row.inventoryId}`);
};

export const handleDownloadCertificate = async (row) => {
  try {
    toast.loading('Preparing certificate download...');
    // Mock API call to get certificate
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // In real implementation, this would be an API call to get the certificate file
    toast.success('Certificate downloaded successfully');
  } catch (error) {
    console.error('Download error:', error);
    toast.error('Failed to download certificate');
  }
};

export const exportToExcel = async (data, filename) => {
  try {
    toast.loading('Preparing Excel export...');

    // Mock API call for Excel generation
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // In real implementation, this would use a library like xlsx to generate the file
    const blob = new Blob([JSON.stringify(data)], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast.success('Data exported successfully');
  } catch (error) {
    console.error('Export error:', error);
    toast.error('Failed to export data');
  }
};

export const validateCertificateNumber = (certificateNo) => {
  // Add validation logic for certificate numbers
  const pattern = /^(NMIM|SST|SSA)-[A-Z0-9-]+$/;
  return pattern.test(certificateNo);
};
