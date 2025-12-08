import {
  CalibrationWeightBalanceSchema,
  calibrationMassSchema as wbCalibrationMassSchema,
  calibrationMeasurementSchema as wbCalibrationMeasurementSchema,
} from './mass/weight-balance';
import {
  CalibrationStandardWeightSchema,
  calibrationMeasurementSchema as swCalibrationMeasurementSchema,
  calibrationMassSchema as swCalibrationMassSchema,
} from './mass/standard-weight';
import { calibrationReferenceInstrumentsSchema, calibrationSummarySchema } from './common-schema';

//* Category Variants Map
//* variant.value - is the value of the variant
//* variant.schemas - is the list of tabs schemas for the variant
//* variant.schema - is the main schema for the variant
export const CATEGORY_VARIANTS_MAP = {
  'TEMPERATURE & HUMIDITY': [],
  PRESSURE: [],
  ELECTRICAL: [],
  DIMENSIONAL: [],
  VOLUMETRIC: [],
  MASS: [
    {
      value: 'standard-weight',
      schema: CalibrationStandardWeightSchema,
      schemas: [
        calibrationSummarySchema,
        swCalibrationMeasurementSchema,
        calibrationReferenceInstrumentsSchema,
        swCalibrationMassSchema,
      ],
    },
    {
      value: 'weight-balance',
      schema: CalibrationWeightBalanceSchema,
      schemas: [
        calibrationSummarySchema,
        wbCalibrationMeasurementSchema,
        calibrationReferenceInstrumentsSchema,
        wbCalibrationMassSchema,
      ],
    },
  ],
};
