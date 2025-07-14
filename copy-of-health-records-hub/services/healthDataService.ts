
import { MedicalRecord, HealthMetric, HealthIssue, Patient, SharedRecord, ShareComment, Alert } from '../types';
import { 
    LOCAL_STORAGE_RECORDS_KEY, 
    LOCAL_STORAGE_METRICS_KEY, 
    LOCAL_STORAGE_ISSUES_KEY,
    LOCAL_STORAGE_PATIENTS_KEY,
    LOCAL_STORAGE_SHARED_RECORDS_KEY,
    LOCAL_STORAGE_SHARED_COMMENTS_KEY,
    LOCAL_STORAGE_ALERTS_KEY,
} from '../constants';

const getFromLocalStorage = <T,>(key: string): T[] => {
  const data = localStorage.getItem(key);
  if (!data) {
    return [];
  }
  try {
    const parsedData = JSON.parse(data);
    // Ensure we always return an array, even if stored data is not
    return Array.isArray(parsedData) ? parsedData : [];
  } catch (error) {
    console.error(`Error parsing localStorage data for key "${key}". Corrupted data will be cleared.`, error);
    // If parsing fails, remove the corrupted item to prevent future errors
    localStorage.removeItem(key);
    return [];
  }
};

const saveToLocalStorage = <T,>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const HealthDataService = {
  // Patients
  getAllPatients: (): Patient[] => getFromLocalStorage<Patient>(LOCAL_STORAGE_PATIENTS_KEY),
  addPatient: (patient: Patient): Patient => {
    const patients = HealthDataService.getAllPatients();
    const newPatient = { ...patient, id: patient.id || crypto.randomUUID(), createdAt: new Date().toISOString() };
    saveToLocalStorage<Patient>(LOCAL_STORAGE_PATIENTS_KEY, [...patients, newPatient]);
    return newPatient;
  },
  updatePatient: (updatedPatient: Patient): Patient | null => {
    let patients = HealthDataService.getAllPatients();
    const index = patients.findIndex(p => p.id === updatedPatient.id);
    if (index > -1) {
      patients[index] = updatedPatient;
      saveToLocalStorage<Patient>(LOCAL_STORAGE_PATIENTS_KEY, patients);
      return updatedPatient;
    }
    return null;
  },
  getPatientById: (patientId: string): Patient | undefined => {
    return HealthDataService.getAllPatients().find(p => p.id === patientId);
  },

  // Medical Records
  getAllRecords: (): MedicalRecord[] => getFromLocalStorage<MedicalRecord>(LOCAL_STORAGE_RECORDS_KEY),
  addRecord: (record: MedicalRecord): MedicalRecord => {
    const records = HealthDataService.getAllRecords();
    const newRecord = { ...record, id: record.id || crypto.randomUUID(), createdAt: new Date().toISOString() };
    saveToLocalStorage<MedicalRecord>(LOCAL_STORAGE_RECORDS_KEY, [...records, newRecord]);
    return newRecord;
  },
  updateRecord: (updatedRecord: MedicalRecord): MedicalRecord | null => {
    let records = HealthDataService.getAllRecords();
    const index = records.findIndex(r => r.id === updatedRecord.id);
    if (index > -1) {
      records[index] = updatedRecord;
      saveToLocalStorage<MedicalRecord>(LOCAL_STORAGE_RECORDS_KEY, records);
      return updatedRecord;
    }
    return null;
  },
  deleteRecord: (recordId: string): void => {
    let records = HealthDataService.getAllRecords();
    records = records.filter(r => r.id !== recordId);
    saveToLocalStorage<MedicalRecord>(LOCAL_STORAGE_RECORDS_KEY, records);
  },
  getRecordById: (recordId: string): MedicalRecord | undefined => {
    return HealthDataService.getAllRecords().find(r => r.id === recordId);
  },

  // Health Metrics
  getAllMetrics: (): HealthMetric[] => getFromLocalStorage<HealthMetric>(LOCAL_STORAGE_METRICS_KEY),
  addMetric: (metric: HealthMetric): HealthMetric => {
    const metrics = HealthDataService.getAllMetrics();
    const newMetric = { ...metric, id: metric.id || crypto.randomUUID(), createdAt: new Date().toISOString() };
    saveToLocalStorage<HealthMetric>(LOCAL_STORAGE_METRICS_KEY, [...metrics, newMetric]);
    return newMetric;
  },
  updateMetric: (updatedMetric: HealthMetric): HealthMetric | null => {
    let metrics = HealthDataService.getAllMetrics();
    const index = metrics.findIndex(v => v.id === updatedMetric.id);
    if (index > -1) {
      metrics[index] = updatedMetric;
      saveToLocalStorage<HealthMetric>(LOCAL_STORAGE_METRICS_KEY, metrics);
      return updatedMetric;
    }
    return null;
  },
  deleteMetric: (metricId: string): void => {
    let metrics = HealthDataService.getAllMetrics();
    metrics = metrics.filter(v => v.id !== metricId);
    saveToLocalStorage<HealthMetric>(LOCAL_STORAGE_METRICS_KEY, metrics);
  },
  getMetricById: (metricId: string): HealthMetric | undefined => {
    return HealthDataService.getAllMetrics().find(v => v.id === metricId);
  },

  // Health Issues
  getAllIssues: (): HealthIssue[] => getFromLocalStorage<HealthIssue>(LOCAL_STORAGE_ISSUES_KEY),
  addIssue: (issue: HealthIssue): HealthIssue => {
    const issues = HealthDataService.getAllIssues();
    const newIssue = { ...issue, id: issue.id || crypto.randomUUID(), createdAt: new Date().toISOString() };
    saveToLocalStorage<HealthIssue>(LOCAL_STORAGE_ISSUES_KEY, [...issues, newIssue]);
    return newIssue;
  },
  updateIssue: (updatedIssue: HealthIssue): HealthIssue | null => {
    let issues = HealthDataService.getAllIssues();
    const index = issues.findIndex(i => i.id === updatedIssue.id);
    if (index > -1) {
      issues[index] = updatedIssue;
      saveToLocalStorage<HealthIssue>(LOCAL_STORAGE_ISSUES_KEY, issues);
      return updatedIssue;
    }
    return null;
  },
  deleteIssue: (issueId: string): void => {
    let issues = HealthDataService.getAllIssues();
    issues = issues.filter(i => i.id !== issueId);
    saveToLocalStorage<HealthIssue>(LOCAL_STORAGE_ISSUES_KEY, issues);
  },
  getIssueById: (issueId: string): HealthIssue | undefined => {
    return HealthDataService.getAllIssues().find(i => i.id === issueId);
  },
  mergeIssues: (primaryIssueId: string, issueIdsToDelete: string[], patientId: string): void => {
    const allRecords = HealthDataService.getAllRecords();
    const allMetrics = HealthDataService.getAllMetrics();
    const allIssues = HealthDataService.getAllIssues();
    
    const issueIdsToDeleteSet = new Set(issueIdsToDelete);

    const updatedRecords = allRecords.map(record => {
      if (record.patientId === patientId && record.associatedIssueIds?.some(id => issueIdsToDeleteSet.has(id))) {
        const newAssociatedIds = new Set(record.associatedIssueIds || []);
        issueIdsToDeleteSet.forEach(id => newAssociatedIds.delete(id));
        newAssociatedIds.add(primaryIssueId);
        return { ...record, associatedIssueIds: Array.from(newAssociatedIds) };
      }
      return record;
    });

    const updatedMetrics = allMetrics.map(metric => {
      if (metric.patientId === patientId && metric.associatedIssueIds?.some(id => issueIdsToDeleteSet.has(id))) {
        const newAssociatedIds = new Set(metric.associatedIssueIds || []);
        issueIdsToDeleteSet.forEach(id => newAssociatedIds.delete(id));
        newAssociatedIds.add(primaryIssueId);
        return { ...metric, associatedIssueIds: Array.from(newAssociatedIds) };
      }
      return metric;
    });
    
    const remainingIssues = allIssues.filter(issue => !issueIdsToDeleteSet.has(issue.id));

    saveToLocalStorage<MedicalRecord>(LOCAL_STORAGE_RECORDS_KEY, updatedRecords);
    saveToLocalStorage<HealthMetric>(LOCAL_STORAGE_METRICS_KEY, updatedMetrics);
    saveToLocalStorage<HealthIssue>(LOCAL_STORAGE_ISSUES_KEY, remainingIssues);
  },

  // Sharing
  getAllSharedRecords: (): SharedRecord[] => getFromLocalStorage<SharedRecord>(LOCAL_STORAGE_SHARED_RECORDS_KEY),
  addSharedRecord: (recordId: string, patientId: string): SharedRecord => {
    const sharedRecords = HealthDataService.getAllSharedRecords();
    const newSharedRecord: SharedRecord = {
      recordId,
      patientId,
      accessKey: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    saveToLocalStorage<SharedRecord>(LOCAL_STORAGE_SHARED_RECORDS_KEY, [...sharedRecords, newSharedRecord]);
    return newSharedRecord;
  },
  getSharedRecordByKey: (accessKey: string): SharedRecord | undefined => {
    return HealthDataService.getAllSharedRecords().find(sr => sr.accessKey === accessKey);
  },

  getAllShareComments: (): ShareComment[] => getFromLocalStorage<ShareComment>(LOCAL_STORAGE_SHARED_COMMENTS_KEY),
  addShareComment: (comment: Omit<ShareComment, 'id' | 'createdAt'>): ShareComment => {
    const comments = HealthDataService.getAllShareComments();
    const newComment: ShareComment = {
      ...comment,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    saveToLocalStorage<ShareComment>(LOCAL_STORAGE_SHARED_COMMENTS_KEY, [...comments, newComment]);
    return newComment;
  },
  getCommentsForSharedRecord: (sharedRecordId: string): ShareComment[] => {
    return HealthDataService.getAllShareComments().filter(c => c.sharedRecordId === sharedRecordId);
  },
  
  // Alerts
  getAllAlerts: (): Alert[] => getFromLocalStorage<Alert>(LOCAL_STORAGE_ALERTS_KEY),
  addAlert: (alert: Omit<Alert, 'id' | 'date'>): Alert => {
    const alerts = HealthDataService.getAllAlerts();
    const newAlert = { ...alert, id: crypto.randomUUID(), date: new Date().toISOString() };
    saveToLocalStorage<Alert>(LOCAL_STORAGE_ALERTS_KEY, [...alerts, newAlert]);
    return newAlert;
  },
  updateAlert: (updatedAlert: Alert): Alert | null => {
    let alerts = HealthDataService.getAllAlerts();
    const index = alerts.findIndex(a => a.id === updatedAlert.id);
    if (index > -1) {
      alerts[index] = updatedAlert;
      saveToLocalStorage<Alert>(LOCAL_STORAGE_ALERTS_KEY, alerts);
      return updatedAlert;
    }
    return null;
  },
};
