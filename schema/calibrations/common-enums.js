import { z } from 'zod';
import {
  CATEGORY,
  DATE_RECEIVED_REQUESTED,
  DUE_DATE_REQUESTED,
  TRACEABILITY_TYPE,
} from './common-constant';

//* Common Enums for calibration

export const dateReceivedRequested = z.enum(DATE_RECEIVED_REQUESTED, {
  message: 'Please select date received requested',
});

export const dueDateRequested = z.enum(DUE_DATE_REQUESTED, {
  message: 'Please select due date requested',
});

export const categoryEnum = z.enum(CATEGORY, {
  message: 'Please select a calibration category',
});

export const traceabilityTypeEnum = z.enum(TRACEABILITY_TYPE, {
  message: 'Please select a traceability type',
});
