//* Common Constants for calibration
export const CATEGORY = [
  'TEMPERATURE & HUMIDITY',
  'PRESSURE',
  'ELECTRICAL',
  'DIMENSIONAL',
  'VOLUMETRIC',
  'MASS',
];

export const STATUS = ['data-validation', 'cert-complete', 'data-rejected', 'data-resubmission'];
export const STATUS_COLOR = {
  'data-validation': 'success',
  'data-rejected': 'danger',
  'data-resubmission': 'warning',
  'cert-complete': 'purple',
};

export const PRINT_STATUS = ['printed', 'reprinted'];
export const PRINT_STATUS_COLOR = { printed: 'success', reprinted: 'warning' };

export const TRACEABILITY_TYPE = ['1', '2', '3'];
export const TRACEABILITY_MAP = {
  1: 'The measurement results included in this document are traceable to Malaysian national measurement standards maintained by the National Metrology Institute of Malaysia ( NMIM ). NMIM is a signatory to the CIPM MRA.',
  2: 'The measurement results included in this document are traceable to the SI system of units and/or to units of measurement realised at the National Metrology Institute of Malaysia ( NMIM ) and other recognised national metrology institutes.',
  3: "The measurement results included in this document are traceable to Malaysia's national standards through SAMM 109, 011 and 088 via calibration	Certificate No. as indicated below. Standards Malaysia is a signatory to the ILAC MRA.",
};
export const TRACEABILITY_COUNTRY = ['Malaysia', 'Singapore', 'Thailand'];
export const TRACEABILITY_CALIBRATION_LAB = [
    { value: 'nmim', name: 'NMIM', accreditationNo: '261', signatory: 'CIPM MRA' },
    { value: 'trescal', name: 'Trescal', accreditationNo: '011', signatory: 'ILAC MRA' },
    { value: 'sendi-mahir', name: 'Sendi Mahir', accreditationNo: '082', signatory: 'ILAC MRA' },
    { value: 'sst-shah-alam', name: 'SST Shah Alam', accreditationNo: '088' , signatory: 'ILAC MRA' },
    { value: 'vitar-segatec', name: 'Vitar - Segatec', accreditationNo: '109' , signatory: 'ILAC MRA' },
    { value: 'nimt', name: 'NIMT', accreditationNo: 'N/A' , signatory: 'ILAC MRA' },
    { value: 'nmc-singapore', name: 'NMC Singapore', accreditationNo: 'N/A' , signatory: 'ILAC MRA' },
  ]; // prettier-ignore
export const TRACEABILITY_ACCREDITATION_BODY = [
  'Standards Malaysia',
  'Singapore Accreditation Council ( SAC )',
  'National Standardization Council ( Thailand )',
];

export const DUE_DATE_REQUESTED = ['yes', 'no'];
export const DATE_RECEIVED_REQUESTED = ['yes', 'no'];
