import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { generateCertificatePDF } from './pdfGenerator';

export const exportData = async (data, format, filename) => {
  try {
    switch (format.toLowerCase()) {
      case 'pdf':
        const pdf = await generateCertificatePDF(data);
        pdf.save(`${filename}.pdf`);
        break;

      case 'excel':
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(excelBlob, `${filename}.xlsx`);
        break;

      case 'csv':
        const csvContent = data.map(row => Object.values(row).join(',')).join('\n');
        const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(csvBlob, `${filename}.csv`);
        break;

      default:
        throw new Error('Unsupported format');
    }
    return true;
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
}; 