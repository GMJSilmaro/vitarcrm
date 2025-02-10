import * as XLSX from 'xlsx';

export const parseExcelFileLocations = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
          header: [
            'Site_ID',
            'Site_name',
            'Customer_ID',
            'Customer_name',
            'Street_1',
            'Street_2',
            'Street_3',
            'Postcode',
            'City',
            'Province',
            'Country',
          ],
          range: 1,
        });

        console.log('Parsed Excel data:', jsonData);
        return resolve(jsonData);
      } catch (error) {
        reject(new Error('Failed to parse Excel file: ' + error.message));
      }
    };

    reader.onerror = (error) => {
      reject(new Error('Failed to read file: ' + error.message));
    };

    reader.readAsArrayBuffer(file);
  });
};

export const parseExcelFileTemperature = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
          header: [
            'Inventory_ID',
            'Category',
            'Description',
            'Tag_ID',
            'Make',
            'Model',
            'Serial_Number',
            'Type',
            'Range_(Min)',
            'Range_(Max)',
            'Range_(Min%)',
            'Range_(Max%)',
            'Certificate_No',
            'Traceability',
          ],
          range: 1,
          defval: '',
        });

        console.log('Parsed Excel data:', jsonData);
        return resolve(jsonData);
      } catch (error) {
        reject(new Error('Failed to parse Excel file: ' + error.message));
      }
    };

    reader.onerror = (error) => {
      reject(new Error('Failed to read file: ' + error.message));
    };

    reader.readAsArrayBuffer(file);
  });
};

// dynamic
export const parseExcelFile = (file, header) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
          header,
          range: 1,
          defval: '',
        });

        console.log('Parsed Excel data:', jsonData);
        return resolve(jsonData);
      } catch (error) {
        reject(new Error('Failed to parse Excel file: ' + error.message));
      }
    };

    reader.onerror = (error) => {
      reject(new Error('Failed to read file: ' + error.message));
    };

    reader.readAsArrayBuffer(file);
  });
};
