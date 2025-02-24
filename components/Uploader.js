import {
  processExcelUploadLocations,
  processExcelUploadEquipment,
  processExcelUploadCustomerEquipments,
} from '@/services/excelUploadService';
import { parseExcelFile } from '@/utils/excelParser';

const LOCATIONS_HEADERS = [
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
];

const EQUIPMENT_HEADER = [
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
];

const CUSTOMER_EQUIPMENT_HEADER = [
  'ID',
  'Customer_Name',
  'Equipment_Name',
  'Make',
  'Model',
  'Serial_Number',
  'Range_Min',
  'Range_Max',
  'UOM',
  'Notes',
];

export const dataExcelParser = {
  locations: (file) => parseExcelFile(file, LOCATIONS_HEADERS),
  equipments: (file) => parseExcelFile(file, EQUIPMENT_HEADER),
  customerEquipments: (file) => parseExcelFile(file, CUSTOMER_EQUIPMENT_HEADER),
};

export const dataProcessExcelUploader = {
  locations: (data) => processExcelUploadLocations(data),
  equipments: (prefix, dataKey, data, onProgress, onStat, startFromLastData) => {
    processExcelUploadEquipment(prefix, dataKey, data, onProgress, onStat, startFromLastData);
  },

  //* correct implementation, above flacky need imporvement
  customerEquipments: (prefix, dataKey, data, onProgress, onStat, lastDataId) => {
    processExcelUploadCustomerEquipments(prefix, dataKey, data, onProgress, onStat, lastDataId);
  },
};
