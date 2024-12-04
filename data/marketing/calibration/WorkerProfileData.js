import { v4 as uuid } from 'uuid';

export const WorkerStatsData = [
  {
    id: uuid(),
    title: 'This Week',
    value: 12,
    subtitle: 'Calibrations',
    icon: 'check-circle',
    color: 'success'
  },
  {
    id: uuid(),
    title: 'This Month',
    value: 48,
    subtitle: 'Total Tasks',
    icon: 'chart-line',
    color: 'primary'
  },
  {
    id: uuid(),
    title: 'Pending',
    value: 3,
    subtitle: 'Tasks',
    icon: 'clock',
    color: 'warning'
  },
  {
    id: uuid(),
    title: 'Overdue',
    value: 1,
    subtitle: 'Calibrations',
    icon: 'exclamation-triangle',
    color: 'danger'
  },
  {
    id: uuid(),
    title: 'Due Soon',
    value: 5,
    subtitle: 'Calibrations',
    icon: 'clock',
    color: 'info'
  },
  {
    id: uuid(),
    title: 'Critical',
    value: 8,
    subtitle: 'Instruments',
    icon: 'exclamation-triangle',
    color: 'warning'
  }
];

export const CalibrationPerformanceData = {
  uncertaintyCompliance: 97,
  documentationAccuracy: 99,
  tasksCompleted: 145,
  measurementAccuracy: '98.5%',
  nonConformities: 2,
  customerRating: 4.9
};

export const RecentCalibrationsData = [
  {
    id: uuid(),
    equipment: 'Pressure Gauge Calibration',
    description: 'Calibrated 5 pressure gauges for Production Line A',
    accuracy: '±0.1%',
    priority: 'High',
    date: '2024-03-15',
    nextDue: '2024-09-15',
    status: 'Completed'
  },
  {
    id: uuid(),
    equipment: 'Temperature Sensor Verification',
    description: 'Verification of critical temperature sensors in Lab 3',
    accuracy: '±0.5°C',
    priority: 'Medium',
    date: '2024-03-10',
    nextDue: 'Pending',
    status: 'In Progress'
  }
]; 