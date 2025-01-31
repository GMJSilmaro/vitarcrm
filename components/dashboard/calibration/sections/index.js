import MechanicalDetails from './MechanicalDetails';
import PressureDetails from './PressureDetails';
import TemperatureDetails from './TemperatureDetails';
import ElectricalDetails from './ElectricalDetails';
import DimensionalDetails from './DimensionalDetails';
import VolumetricDetails from './VolumetricDetails';

export const CategoryDetails = {
  MECHANICAL: MechanicalDetails,
  PRESSURE: PressureDetails,
  'TEMPERATURE & HUMIDITY': TemperatureDetails,
  ELECTRICAL: ElectricalDetails,
  DIMENSIONAL: DimensionalDetails,
  VOLUMETRIC: VolumetricDetails,
};
