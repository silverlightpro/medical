
import { HealthMetric, MedicalRecord, Alert } from '../types';

// Define thresholds for critical alerts. This can be expanded.
const CRITICAL_THRESHOLDS: { [key: string]: { high?: number; low?: number } } = {
  'Heart Rate': { high: 130, low: 45 },
  'Oxygen Saturation': { low: 90 },
  'Respiratory Rate': { high: 30, low: 8 },
  'Systolic Blood Pressure': { high: 180, low: 90 },
  'Diastolic Blood Pressure': { high: 120, low: 60 },
  'Blood Glucose': { high: 300, low: 60 },
};

export const AlertService = {
  /**
   * Generates alerts for a newly added health metric.
   * @param metric - The new metric that was added.
   * @returns An array of Alert objects.
   */
  generateAlertsForNewMetric: (metric: HealthMetric): Alert[] => {
    const alerts: Alert[] = [];
    const thresholds = CRITICAL_THRESHOLDS[metric.name];
    const valueNum = parseFloat(metric.value.split('/')[0]); // Handle BP

    if (thresholds && !isNaN(valueNum)) {
      if (thresholds.high && valueNum > thresholds.high) {
        alerts.push({
          id: '', // Will be set by HealthDataService
          patientId: metric.patientId,
          level: 'Critical',
          status: 'new',
          title: `Critically High ${metric.name}`,
          message: `Value of ${metric.value} ${metric.unit} is above the critical threshold of ${thresholds.high}.`,
          date: new Date().toISOString(),
          linkTo: { view: 'metricDetail', metricId: metric.id },
        });
      }
      if (thresholds.low && valueNum < thresholds.low) {
        alerts.push({
          id: '',
          patientId: metric.patientId,
          level: 'Critical',
          status: 'new',
          title: `Critically Low ${metric.name}`,
          message: `Value of ${metric.value} ${metric.unit} is below the critical threshold of ${thresholds.low}.`,
          date: new Date().toISOString(),
          linkTo: { view: 'metricDetail', metricId: metric.id },
        });
      }
    }

    // Special handling for Blood Pressure
    if (metric.name === 'Blood Pressure' && metric.value.includes('/')) {
        const parts = metric.value.split('/');
        const systolic = parseFloat(parts[0]);
        const diastolic = parseFloat(parts[1]);
        const systolicThresholds = CRITICAL_THRESHOLDS['Systolic Blood Pressure'];
        const diastolicThresholds = CRITICAL_THRESHOLDS['Diastolic Blood Pressure'];
        
        if (systolicThresholds && !isNaN(systolic)) {
            if (systolicThresholds.high && systolic > systolicThresholds.high) {
                 alerts.push({ id: '', patientId: metric.patientId, level: 'Critical', status: 'new', title: `Critically High Blood Pressure`, message: `Systolic value of ${systolic} is above the critical threshold of ${systolicThresholds.high}.`, date: new Date().toISOString(), linkTo: { view: 'metricDetail', metricId: metric.id }});
            }
             if (systolicThresholds.low && systolic < systolicThresholds.low) {
                 alerts.push({ id: '', patientId: metric.patientId, level: 'Critical', status: 'new', title: `Critically Low Blood Pressure`, message: `Systolic value of ${systolic} is below the critical threshold of ${systolicThresholds.low}.`, date: new Date().toISOString(), linkTo: { view: 'metricDetail', metricId: metric.id }});
            }
        }
    }


    return alerts;
  },

  /**
   * Generates alerts for a newly added medical record.
   * @param record - The new record that was added.
   * @returns An array of Alert objects.
   */
  generateAlertsForNewRecord: (record: MedicalRecord): Alert[] => {
    const alerts: Alert[] = [];

    if (record.extractedDiagnoses && record.extractedDiagnoses.length > 0) {
      record.extractedDiagnoses.forEach(diagnosis => {
        alerts.push({
          id: '',
          patientId: record.patientId,
          level: 'Info',
          status: 'new',
          title: 'New Diagnosis Identified',
          message: `A new diagnosis of "${diagnosis}" was found in the record "${record.title}".`,
          date: new Date().toISOString(),
          linkTo: { view: 'recordDetail', recordId: record.id },
        });
      });
    }

    return alerts;
  },
};
