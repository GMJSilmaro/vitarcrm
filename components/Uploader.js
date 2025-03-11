import {
  processExcelUploadLocations,
  processExcelUploadEquipment,
  processExcelUploadCustomerEquipments,
  processExcelUploadCalibrationCUSWD,
  processExcelUploadCalibrationMPE,
  processExcelUploadCalibrationCK,
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

//* calibration Correction, Uncertainty of the Standard Weight & Draft
const CALIBRATION_CUSWD_HEADER = [
  'Guid',
  'TagId',
  'Class',
  'Nominal_Value_G',
  'Current_Year_Error_MG',
  'Current_Year_Actual_Value_G',
  'E_Uncertainty_MG',
  'U_Cert_G',
  'U_Cert2_G2',
  'U_Cert4V_G4',
  'U_Inst_G',
  'U_Inst2_G2',
  'U_Inst4V_G4',
  'Pr_KG_MN3',
  'U_Pr_KG_MN3',
  'Last_Year_Error_MG',
  'Last_Year_Actual_Value_G',
  'Drift_G',
];

const CALIBRATION_MPE = ['Guid', 'Code', 'Weight', 'MPE', 'Uncertainty'];
const CALIBRATION_CK = ['Guid', 'DOF', 'Value'];

export const dataExcelParser = {
  locations: (file) => parseExcelFile(file, LOCATIONS_HEADERS),
  equipments: (file) => parseExcelFile(file, EQUIPMENT_HEADER),
  customerEquipments: (file) => parseExcelFile(file, CUSTOMER_EQUIPMENT_HEADER),

  jobCalibrationReferences_CR000001_data: (file) => {
    return parseExcelFile(file, CALIBRATION_CUSWD_HEADER, false);
  },
  jobCalibrationReferences_CR000002_data: (file) => {
    return parseExcelFile(file, CALIBRATION_MPE);
  },
  jobCalibrationReferences_CR000003_data: (file) => {
    return parseExcelFile(file, CALIBRATION_CK);
  },
};

export const dataProcessExcelUploader = {
  // locations: (data) => processExcelUploadLocations(data),
  // equipments: (prefix, dataKey, data, onProgress, onStat, startFromLastData) => {
  //   processExcelUploadEquipment(prefix, dataKey, data, onProgress, onStat, startFromLastData);
  // },

  //* correct implementation, above flacky need imporvement
  customerEquipments: (param) => processExcelUploadCustomerEquipments(param),
  jobCalibrationReferences_CR000001_data: (param) => processExcelUploadCalibrationCUSWD(param),
  jobCalibrationReferences_CR000002_data: (param) => processExcelUploadCalibrationMPE(param),
  jobCalibrationReferences_CR000003_data: (param) => processExcelUploadCalibrationCK(param),
};
