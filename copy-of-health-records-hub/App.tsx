
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MedicalRecord, HealthMetric, HealthIssue, CalendarDay, HealthProfile, Patient, RecordType, Alert, GeminiReviewResult } from './types';
import { HealthDataService } from './services/healthDataService';
import { AlertService } from './services/alertService';
import { LOCAL_STORAGE_ACTIVE_PATIENT_KEY } from './constants';

import { RecordUploadModal } from './components/RecordUploadModal';
import { RecordDetailModal } from './components/RecordDetailModal';
import { MetricFormModal } from './components/MetricFormModal';
import { IssueModal } from './components/IssueModal';
import { CalendarView } from './components/CalendarView';
import { Dashboard } from './components/Dashboard';
import { MetricDetailPage } from './components/MetricDetailPage';
import { InsightsModal } from './components/InsightsModal';
import { CareSummaryView } from './components/CareSummaryView';
import { PatientFormModal } from './components/PatientFormModal';
import { PatientProfileView } from './components/PatientProfileView';
import { LabsView } from './components/LabsView';
import { SharedRecordViewer } from './components/SharedRecordViewer';
import { ImageViewerModal } from './components/ImageViewerModal';
import { AlertsDropdown } from './components/AlertsDropdown';
import { AlertsView } from './components/AlertsView';
import { AiReviewView } from './components/AiReviewView';
import { LoadingSpinner } from './components/LoadingSpinner';
import { GeminiService } from './services/geminiService';
import { MergeIssuesModal } from './components/MergeIssuesModal';

import { PlusCircleIcon, HeartIcon, ListChecksIcon, LayoutDashboardIcon, SparklesIcon, SearchIcon, UserIcon, BeakerIcon, FileTextIcon, ClipboardDocumentListIcon, CalendarIcon, IconProps, BellIcon, TrashIcon, EditIcon } from './components/Icons';

type View = 'dashboard' | 'calendar' | 'records' | 'care-summary' | 'labs' | 'metrics' | 'issues' | 'profile' | 'metricDetail' | 'alerts';

interface ViewState {
  view: View;
  metricId?: string;
  recordId?: string;
  previousView?: View;
}

const App: React.FC = () => {
  // Check for shared link on initial load
  const [shareKey, setShareKey] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('shareKey');
  });

  // All data from storage
  const [allRecords, setAllRecords] = useState<MedicalRecord[]>([]);
  const [allMetrics, setAllMetrics] = useState<HealthMetric[]>([]);
  const [allIssues, setAllIssues] = useState<HealthIssue[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [allAlerts, setAllAlerts] = useState<Alert[]>([]);
  
  // Active patient and view state
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [viewState, setViewState] = useState<ViewState>({ view: 'dashboard' });

  // State for modals
  const [isRecordUploadModalOpen, setIsRecordUploadModalOpen] = useState(false);
  const [isRecordDetailModalOpen, setIsRecordDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  
  const [isMetricFormModalOpen, setIsMetricFormModalOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<HealthMetric | null>(null);
  const [metricDate, setMetricDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<HealthIssue | null>(null);
  const [isMergeIssuesModalOpen, setIsMergeIssuesModalOpen] = useState(false);
  
  const [isInsightsModalOpen, setIsInsightsModalOpen] = useState(false);
  const [isPatientFormModalOpen, setIsPatientFormModalOpen] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [selectedImageRecord, setSelectedImageRecord] = useState<MedicalRecord | null>(null);
  
  // Search and filter
  const [filterIssueId, setFilterIssueId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Bulk actions and AI Review state
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [aiReviewResult, setAiReviewResult] = useState<GeminiReviewResult | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Issue Management state
  const [isIssueMergeMode, setIsIssueMergeMode] = useState(false);
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([]);

  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  
  const loadData = useCallback(() => {
    setPatients(HealthDataService.getAllPatients());
    setAllRecords(HealthDataService.getAllRecords());
    setAllMetrics(HealthDataService.getAllMetrics());
    setAllIssues(HealthDataService.getAllIssues());
    setAllAlerts(HealthDataService.getAllAlerts());
  }, []);

  useEffect(() => {
    if (shareKey) return; // Don't load main app if viewing a shared record
    
    if (!process.env.API_KEY) {
      setApiKeyError("Gemini API Key (process.env.API_KEY) is not configured. AI-powered features will be disabled.");
    }
    loadData();
    const allPatients = HealthDataService.getAllPatients();
    const lastActiveId = localStorage.getItem(LOCAL_STORAGE_ACTIVE_PATIENT_KEY);
    if (lastActiveId && allPatients.some(p => p.id === lastActiveId)) {
        setActivePatientId(lastActiveId);
    } else if (allPatients.length > 0) {
        setActivePatientId(allPatients[0].id);
    }
  }, [loadData, shareKey]);

  // DERIVED STATE for the active patient
  const { records, metrics, issues, activePatient, alerts } = useMemo(() => {
    if (!activePatientId) return { records: [], metrics: [], issues: [], activePatient: null, alerts: [] };
    return {
        records: allRecords.filter(r => r.patientId === activePatientId),
        metrics: allMetrics.filter(m => m.patientId === activePatientId),
        issues: allIssues.filter(i => i.patientId === activePatientId),
        activePatient: patients.find(p => p.id === activePatientId) || null,
        alerts: allAlerts.filter(a => a.patientId === activePatientId),
    };
  }, [activePatientId, allRecords, allMetrics, allIssues, patients, allAlerts]);
  
  const healthProfile: HealthProfile = useMemo(() => ({ patient: activePatient, records, metrics, issues }), [activePatient, records, metrics, issues]);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentViewDate, setCurrentViewDate] = useState<Date>(new Date());
  
  const handlePatientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    if (value === "add_new") {
        setIsPatientFormModalOpen(true);
    } else {
        setActivePatientId(value);
        localStorage.setItem(LOCAL_STORAGE_ACTIVE_PATIENT_KEY, value);
        setViewState({ view: 'dashboard' }); // Go to dashboard on patient switch
    }
  };

  const handlePatientSave = (patient: Patient) => {
    const newPatient = HealthDataService.addPatient(patient);
    loadData();
    setActivePatientId(newPatient.id);
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_PATIENT_KEY, newPatient.id);
    setIsPatientFormModalOpen(false);
  };
  
  const handlePatientProfileSave = (patient: Patient) => {
    HealthDataService.updatePatient(patient);
    loadData();
  };

  const handleRecordDataSave = async (dataArray: { record: Partial<MedicalRecord>; metrics: Partial<HealthMetric>[] }[], newDiagnosesToCreate: string[]): Promise<void> => {
    if (!activePatientId) return;

    dataArray.forEach(data => {
        const { record: partialRecord, metrics: partialMetrics } = data;

        const newRecord: MedicalRecord = {
            id: partialRecord.id || crypto.randomUUID(),
            patientId: activePatientId,
            fileName: partialRecord.fileName || 'Unknown File',
            recordDate: partialRecord.recordDate || new Date().toISOString().split('T')[0],
            recordType: partialRecord.recordType || RecordType.Other,
            title: partialRecord.title || 'Untitled Record',
            details: partialRecord.details || '',
            createdAt: partialRecord.createdAt || new Date().toISOString(),
            fileDataUrl: partialRecord.fileDataUrl,
            extractedText: partialRecord.extractedText,
            geminiSummary: partialRecord.geminiSummary,
            procedureDate: partialRecord.procedureDate,
            extractedDiagnoses: partialRecord.extractedDiagnoses,
            extractedProcedures: partialRecord.extractedProcedures,
            extractedKeyFindings: partialRecord.extractedKeyFindings,
            associatedIssueIds: partialRecord.associatedIssueIds || [],
        };

        const savedRecord = HealthDataService.addRecord(newRecord);
        const recordAlerts = AlertService.generateAlertsForNewRecord(savedRecord);
        recordAlerts.forEach(alert => HealthDataService.addAlert(alert));

        partialMetrics.forEach(metric => {
            if (!metric.name || !metric.value || !metric.category) return; // Skip incomplete metrics

            const newMetric: HealthMetric = {
                id: crypto.randomUUID(),
                patientId: activePatientId,
                date: savedRecord.recordDate,
                time: metric.time || new Date().toTimeString().substring(0, 5),
                name: metric.name,
                value: metric.value,
                unit: metric.unit || '',
                category: metric.category,
                notes: metric.notes,
                associatedIssueIds: savedRecord.associatedIssueIds,
                createdAt: new Date().toISOString(),
            };
            const savedMetric = HealthDataService.addMetric(newMetric);
            const metricAlerts = AlertService.generateAlertsForNewMetric(savedMetric);
            metricAlerts.forEach(alert => HealthDataService.addAlert(alert));
        });
    });
    
    if (newDiagnosesToCreate.length > 0) {
        newDiagnosesToCreate.forEach(diagnosisName => {
            HealthDataService.addIssue({
                id: crypto.randomUUID(),
                patientId: activePatientId,
                name: diagnosisName,
                status: 'Active',
                startDate: new Date().toISOString().split('T')[0],
                createdAt: new Date().toISOString(),
            });
        });
    }

    loadData();
  };

  const handleMetricSave = (metric: HealthMetric) => {
    if (!activePatientId) return;
    const metricWithPatient = { ...metric, patientId: activePatientId };
    
    let savedMetric;
    if (allMetrics.find(v => v.id === metric.id)) {
      savedMetric = HealthDataService.updateMetric(metricWithPatient);
    } else {
      savedMetric = HealthDataService.addMetric(metricWithPatient);
      // Only generate alerts for brand new metrics to avoid spam on edits
      const metricAlerts = AlertService.generateAlertsForNewMetric(savedMetric);
      metricAlerts.forEach(alert => HealthDataService.addAlert(alert));
    }
    
    loadData();
    setIsMetricFormModalOpen(false);
    setSelectedMetric(null);
  };

  const handleMetricUpdate = (metric: HealthMetric) => {
    HealthDataService.updateMetric(metric);
    loadData();
  };

  const handleIssueSave = (issue: HealthIssue) => {
    if (!activePatientId) return;
    const issueWithPatient = { ...issue, patientId: activePatientId };
     if (allIssues.find(i => i.id === issue.id)) {
      HealthDataService.updateIssue(issueWithPatient);
    } else {
      HealthDataService.addIssue(issueWithPatient);
    }
    loadData();
    setIsIssueModalOpen(false);
    setSelectedIssue(null);
  };
  
    const handleMergeIssues = (primaryIssueId: string, issueIdsToDelete: string[]) => {
      if (!activePatientId) return;
      HealthDataService.mergeIssues(primaryIssueId, issueIdsToDelete, activePatientId);
      loadData();
      setIsMergeIssuesModalOpen(false);
      setIsIssueMergeMode(false);
      setSelectedIssueIds([]);
    };

  const handleDismissAlert = (alertId: string) => {
    const alert = allAlerts.find(a => a.id === alertId);
    if(alert) {
      HealthDataService.updateAlert({ ...alert, status: 'dismissed' });
      loadData();
    }
  };
  
  const handleNavigateToAlertLink = (link?: Alert['linkTo']) => {
    if (!link) return;
    if (link.view === 'metricDetail') {
      setViewState({ view: 'metricDetail', metricId: link.metricId });
    }
    if (link.view === 'recordDetail') {
        const record = allRecords.find(r => r.id === link.recordId);
        if(record) openRecordDetail(record);
    }
  };

  const openRecordDetail = (record: MedicalRecord) => { 
    if (record.recordType === RecordType.Imaging) {
        setSelectedImageRecord(record);
        setIsImageViewerOpen(true);
    } else {
        setSelectedRecord(record); 
        setIsRecordDetailModalOpen(true); 
    }
  };
  const openMetricForm = (date?: string, metric?: HealthMetric) => { setMetricDate(date || new Date().toISOString().split('T')[0]); setSelectedMetric(metric || null); setIsMetricFormModalOpen(true); };
  const openIssueForm = (issue?: HealthIssue) => { setSelectedIssue(issue || null); setIsIssueModalOpen(true); };
  
  const handleRecordSave = (record: MedicalRecord) => {
     if (allRecords.find(r => r.id === record.id)) { HealthDataService.updateRecord(record); } 
     else { HealthDataService.addRecord(record); }
     loadData();
     setIsRecordDetailModalOpen(false);
  }

  const handleDeleteRecord = (recordId: string) => { if (window.confirm("Are you sure?")) { HealthDataService.deleteRecord(recordId); loadData(); setIsRecordDetailModalOpen(false); setSelectedRecord(null); } };
  const handleDeleteMetric = (metricId: string) => { if (window.confirm("Are you sure?")) { HealthDataService.deleteMetric(metricId); loadData(); setIsMetricFormModalOpen(false); setSelectedMetric(null); } };
  const handleDeleteIssue = (issueId: string) => {
    if (window.confirm("Are you sure? This action is permanent and will not delete associated records or metrics.")) {
      HealthDataService.deleteIssue(issueId);
      loadData();
      // Ensure modal is closed if the action was initiated from there
      if (selectedIssue?.id === issueId) {
        setIsIssueModalOpen(false);
        setSelectedIssue(null);
      }
    }
  };


  const onDayClick = (day: CalendarDay) => { setSelectedDate(day.date); };
  const handleViewMetricDetail = (metricId: string) => { setViewState(prev => ({ view: 'metricDetail', metricId: metricId, previousView: prev.view, })); };
  const handleBack = () => { setViewState(prev => ({ view: prev.previousView || 'dashboard', })); };

  // --- Bulk Record Actions ---
  const handleToggleRecordSelection = (recordId: string) => {
      setSelectedRecordIds(prev =>
          prev.includes(recordId) ? prev.filter(id => id !== recordId) : [...prev, recordId]
      );
  };
  
  const handleSelectAllRecords = () => {
    if (selectedRecordIds.length === filteredRecords.length) {
      setSelectedRecordIds([]);
    } else {
      setSelectedRecordIds(filteredRecords.map(r => r.id));
    }
  };

  const handleDeleteSelectedRecords = () => {
      if (window.confirm(`Are you sure you want to delete ${selectedRecordIds.length} selected record(s)?`)) {
          selectedRecordIds.forEach(id => HealthDataService.deleteRecord(id));
          loadData();
          setSelectedRecordIds([]);
      }
  };
  
    const handleToggleIssueSelection = (issueId: string) => {
      setSelectedIssueIds(prev =>
        prev.includes(issueId) ? prev.filter(id => id !== issueId) : [...prev, issueId]
      );
    };

  const handleStartAiReview = async () => {
      if (selectedRecordIds.length === 0) return;
      
      const recordsToReview = allRecords.filter(r => selectedRecordIds.includes(r.id));
      setIsReviewing(true);
      setReviewError(null);
      setAiReviewResult(null);

      try {
          const result = await GeminiService.reviewRecordsForAbnormalities(recordsToReview, healthProfile);
          if (result) {
              setAiReviewResult(result);
          } else {
              setReviewError("The AI review could not be completed. Please try again.");
          }
      } catch (error) {
          console.error("AI Review Error:", error);
          setReviewError("An unexpected error occurred during the AI review.");
      } finally {
          setIsReviewing(false);
      }
  };
  // -------------------------

  const filteredData = useMemo(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const doFilter = <T extends { [key: string]: any }>(items: T[], keys: (keyof T)[]) => {
        if (!searchTerm && !filterIssueId) return items;
        return items.filter(item => {
            const issueMatch = !filterIssueId || item.associatedIssueIds?.includes(filterIssueId);
            if (!issueMatch) return false;
            if (!searchTerm) return true;
            return keys.some(key => {
                const value = item[key];
                return value && typeof value === 'string' && value.toLowerCase().includes(lowercasedSearchTerm);
            });
        });
    };
    return { 
        filteredRecords: doFilter(records, ['title', 'fileName', 'geminiSummary', 'details', 'recordType']),
        filteredMetrics: doFilter(metrics, ['name', 'value', 'unit', 'notes', 'category']),
        filteredIssues: doFilter(issues, ['name', 'description', 'status']),
     };
  }, [records, metrics, issues, searchTerm, filterIssueId]);

  const { filteredRecords, filteredMetrics, filteredIssues } = filteredData;
  const recordsForSelectedDate = records.filter(r => r.recordDate === selectedDate.toISOString().split('T')[0]);
  const metricsForSelectedDate = metrics.filter(v => v.date === selectedDate.toISOString().split('T')[0]);

  // If a shareKey is present, render only the viewer.
  if (shareKey) {
    return <SharedRecordViewer accessKey={shareKey} />;
  }

  // UI RENDER LOGIC
  if (patients.length === 0 && !isPatientFormModalOpen) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-base-50 p-8 text-center">
            <LayoutDashboardIcon className="w-16 h-16 text-primary mb-4" />
            <h1 className="text-3xl font-bold text-base-800">Welcome to Health Records Hub</h1>
            <p className="text-base-500 mt-2 max-w-md">To get started, please add a patient profile. You can manage health records for yourself or others.</p>
            <button onClick={() => setIsPatientFormModalOpen(true)} className="mt-8 bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg shadow-sm transition duration-150 ease-in-out flex items-center">
                <UserIcon className="w-5 h-5 mr-2" /> Add Your First Patient
            </button>
            {isPatientFormModalOpen && <PatientFormModal isOpen={true} onClose={() => {}} onSave={handlePatientSave} />}
        </div>
    );
  }

  const renderContent = () => {
    if (!activePatientId) {
        return <div className="text-center p-8"><p className="text-base-500">Please select a patient from the dropdown above.</p></div>
    }
    switch (viewState.view) {
        case 'metricDetail': return <MetricDetailPage metricId={viewState.metricId!} healthProfile={healthProfile} onBack={handleBack} onEditMetric={openMetricForm} onMetricUpdate={handleMetricUpdate} />;
        case 'dashboard': return <Dashboard metrics={metrics} issues={issues} onMetricClick={handleViewMetricDetail} onIssueClick={openIssueForm} />;
        case 'alerts': return <AlertsView alerts={alerts} onDismiss={handleDismissAlert} onNavigate={handleNavigateToAlertLink} />;
        case 'calendar': return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-lg shadow-md border border-base-200"><CalendarView date={currentViewDate} onDateChange={setCurrentViewDate} onDayClick={onDayClick} records={records} metrics={metrics} /></div>
                <div className="lg:col-span-1 bg-white p-4 sm:p-6 rounded-lg shadow-md border border-base-200">
                  <h3 className="text-lg font-semibold mb-4 text-primary-dark">Entries for {selectedDate.toLocaleDateString()}</h3>
                  <div className="space-y-4">{recordsForSelectedDate.length === 0 && metricsForSelectedDate.length === 0 ? <p className="text-base-500 text-center py-4">No entries for this date.</p> : <>
                    {recordsForSelectedDate.length > 0 && <div><h4 className="font-semibold mb-2 text-base-700">Records:</h4><ul className="space-y-2 text-sm">{recordsForSelectedDate.map(r => <li key={r.id} onClick={() => openRecordDetail(r)} className="cursor-pointer hover:bg-base-100 p-2 rounded-md"><p className="font-medium">{r.title}</p><p className="text-xs text-base-500">{r.recordType}</p></li>)}</ul></div>}
                    {metricsForSelectedDate.length > 0 && <div><h4 className="font-semibold mb-2 text-base-700">Metrics:</h4><ul className="space-y-2 text-sm">{metricsForSelectedDate.map(v => <li key={v.id} onClick={() => handleViewMetricDetail(v.id)} className="cursor-pointer hover:bg-base-100 p-2 rounded-md"><span className="font-medium">{v.name}:</span> {v.value} {v.unit || ''}</li>)}</ul></div>}
                  </>}</div>
                </div>
              </div>
            );
        case 'records':
            if (isReviewing) {
                return <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-md border border-base-200"><LoadingSpinner size="lg" /><p className="mt-4 text-base-500">AI is reviewing records...</p></div>;
            }
            if (reviewError) {
                return <div className="p-4 bg-red-100 text-red-800 border border-red-300 rounded-md"><h3>Error</h3><p>{reviewError}</p><button onClick={() => setReviewError(null)} className="mt-2 text-sm font-bold">Back to Records</button></div>;
            }
            if (aiReviewResult) {
                return <AiReviewView result={aiReviewResult} healthProfile={healthProfile} onBack={() => { setAiReviewResult(null); setSelectedRecordIds([]); }} />;
            }
            return (
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-base-200">
                    <h2 className="text-xl font-semibold mb-4 text-primary-dark">Medical Records</h2>
                    {selectedRecordIds.length > 0 && (
                        <div className="bg-primary/10 p-3 rounded-lg mb-4 flex items-center justify-between gap-4">
                            <p className="text-sm font-medium text-primary-dark">{selectedRecordIds.length} record(s) selected.</p>
                            <div className="flex items-center gap-2">
                                <button onClick={handleStartAiReview} disabled={!!apiKeyError} className="px-3 py-1.5 text-sm font-semibold text-white bg-accent hover:bg-accent-hover rounded-md shadow-sm disabled:opacity-50" title={apiKeyError ? apiKeyError : "Review selected records with AI"}>
                                    <SparklesIcon className="w-4 h-4 inline-block mr-1" /> Review with AI
                                </button>
                                <button onClick={handleDeleteSelectedRecords} className="p-2 text-danger hover:bg-red-100 rounded-full" title="Delete Selected">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                    {filteredRecords.length === 0 ? <p className="text-base-500">No records found.</p> : (
                        <ul className="divide-y divide-base-200">
                            <li className="p-4 font-semibold flex items-center gap-4">
                                <input type="checkbox" onChange={handleSelectAllRecords} checked={filteredRecords.length > 0 && selectedRecordIds.length === filteredRecords.length} className="h-4 w-4 text-primary border-base-300 rounded focus:ring-primary"/>
                                <div>Select All</div>
                            </li>
                            {filteredRecords.sort((a,b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime()).map(record => (
                                <li key={record.id} className={`p-4 flex items-start gap-4 transition-colors ${selectedRecordIds.includes(record.id) ? 'bg-primary/5' : 'hover:bg-base-50'}`}>
                                    <input type="checkbox" checked={selectedRecordIds.includes(record.id)} onChange={() => handleToggleRecordSelection(record.id)} className="mt-1 h-4 w-4 text-primary border-base-300 rounded focus:ring-primary"/>
                                    <div className="flex-grow cursor-pointer" onClick={() => openRecordDetail(record)}>
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-semibold">{record.title}</h3>
                                            <p className="text-sm text-base-500">{new Date(record.recordDate).toLocaleDateString()} - {record.recordType}</p>
                                        </div>
                                        <p className="text-sm text-base-700 mt-2 line-clamp-2">{record.geminiSummary || record.details || 'No summary.'}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            );
        case 'care-summary': return <CareSummaryView records={filteredRecords} onRecordClick={openRecordDetail} />;
        case 'labs': return <LabsView records={filteredRecords} metrics={filteredMetrics} onMetricClick={handleViewMetricDetail} onImageClick={(record) => {setSelectedImageRecord(record); setIsImageViewerOpen(true);}} />;
        case 'metrics': return (
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-base-200">
                <h2 className="text-xl font-semibold mb-4 text-primary-dark">All Health Metrics</h2>
                {filteredMetrics.length === 0 ? (
                    <p className="text-base-500">No metrics found.</p>
                ) : (
                    <ul className="divide-y divide-base-200">
                        {filteredMetrics.sort((a, b) => new Date(b.date + 'T' + (b.time || '00:00')).getTime() - new Date(a.date + 'T' + (a.time || '00:00')).getTime()).map(metric => (
                            <li key={metric.id} className="p-4 hover:bg-base-50 cursor-pointer" onClick={() => handleViewMetricDetail(metric.id)}>
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <h3 className="font-semibold text-base-800">{metric.name}</h3>
                                        <p className="text-xs text-base-500 bg-base-100 px-2 py-0.5 rounded-full inline-block mt-1">{metric.category}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-lg font-medium text-secondary-dark">{metric.value} <span className="text-base font-normal text-base-500">{metric.unit}</span></p>
                                        <p className="text-sm text-base-500">{new Date(metric.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                {metric.notes && <p className="text-sm text-base-600 mt-2 pt-2 border-t border-base-100 italic">"{metric.notes}"</p>}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        );
        case 'issues': return (
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-base-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-primary-dark">Health Issues</h2>
                <div className="flex items-center gap-2">
                    {isIssueMergeMode && selectedIssueIds.length > 1 && (
                        <button 
                            onClick={() => setIsMergeIssuesModalOpen(true)} 
                            className="px-3 py-1.5 text-sm font-semibold text-white bg-secondary hover:bg-secondary-dark rounded-md shadow-sm"
                        >
                            Merge Selected ({selectedIssueIds.length})
                        </button>
                    )}
                    <button 
                        onClick={() => { setIsIssueMergeMode(prev => !prev); setSelectedIssueIds([]); }} 
                        className={`px-3 py-1.5 text-sm font-medium rounded-md ${isIssueMergeMode ? 'bg-base-200 text-base-800' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                    >
                        {isIssueMergeMode ? 'Cancel' : 'Merge Issues'}
                    </button>
                </div>
              </div>
              {filteredIssues.length === 0 ? <p className="text-base-500">No issues tracked.</p> : (
                  <ul className="divide-y divide-base-200">
                      {filteredIssues.sort((a,b) => a.name.localeCompare(b.name)).map(issue => (
                          <li key={issue.id} className={`p-4 flex items-center gap-4 transition-colors ${selectedIssueIds.includes(issue.id) ? 'bg-secondary/10' : ''}`}>
                              {isIssueMergeMode && (
                                <input 
                                    type="checkbox" 
                                    checked={selectedIssueIds.includes(issue.id)} 
                                    onChange={() => handleToggleIssueSelection(issue.id)} 
                                    className="h-4 w-4 text-secondary border-base-300 rounded focus:ring-secondary"
                                />
                              )}
                              <div className="flex-grow">
                                  <h3 className="font-semibold text-base-800">{issue.name}</h3>
                                  <p className="text-sm text-base-500">Status: {issue.status} {issue.startDate ? `(since ${new Date(issue.startDate).toLocaleDateString()})` : ''}</p>
                              </div>
                              {!isIssueMergeMode && (
                                  <div className="flex items-center gap-2">
                                      <button onClick={() => openIssueForm(issue)} className="p-2 rounded-md hover:bg-base-100" title="Edit Issue"><EditIcon className="w-5 h-5 text-base-600" /></button>
                                      <button onClick={() => handleDeleteIssue(issue.id)} className="p-2 rounded-md hover:bg-red-100" title="Delete Issue"><TrashIcon className="w-5 h-5 text-danger" /></button>
                                  </div>
                              )}
                          </li>
                      ))}
                  </ul>
              )}
            </div>
        );
        case 'profile': return activePatient ? <PatientProfileView patient={activePatient} onSave={handlePatientProfileSave} /> : null;
        default: return null;
    }
  }

  const navItems: { id: View; label: string; icon: React.FC<IconProps> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
    { id: 'alerts', label: 'Alerts', icon: BellIcon },
    { id: 'labs', label: 'Labs', icon: BeakerIcon },
    { id: 'records', label: 'Records', icon: FileTextIcon },
    { id: 'care-summary', label: 'Care Summary', icon: ClipboardDocumentListIcon },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'metrics', label: 'Metrics', icon: HeartIcon },
    { id: 'issues', label: 'Issues', icon: ListChecksIcon },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-base-50 flex flex-col">
      <header className="bg-white text-base-800 p-4 border-b border-base-200 sticky top-0 z-40">
        <div className="container mx-auto flex justify-between items-center max-w-7xl gap-4">
          <h1 className="text-xl font-bold flex items-center gap-2 text-primary-dark shrink-0"><LayoutDashboardIcon /> Health Hub</h1>
          
          <div className="flex-1 flex items-center justify-start gap-4">
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-500" />
              <select onChange={handlePatientChange} value={activePatientId || ''} className="pl-10 pr-4 py-2 text-base font-semibold border-transparent bg-base-100 rounded-lg focus:ring-primary focus:border-primary focus:bg-white transition-colors appearance-none">
                {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                <option value="add_new" className="font-medium text-primary-dark">-- Add New Patient --</option>
              </select>
            </div>
            <div className="relative flex-grow max-w-md">
              <input type="search" placeholder="Search this patient's records..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 text-sm border-base-300 bg-base-100 rounded-lg focus:ring-primary focus:border-primary focus:bg-white transition-colors" />
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-400" />
            </div>
          </div>

          <div className="space-x-2 flex items-center shrink-0">
            <AlertsDropdown 
              alerts={alerts} 
              onDismiss={handleDismissAlert} 
              onNavigate={handleNavigateToAlertLink} 
              onViewAll={() => setViewState({ view: 'alerts' })} 
            />
            <button onClick={() => setIsInsightsModalOpen(true)} disabled={!!apiKeyError} className="bg-accent hover:bg-accent-hover text-white font-semibold py-2 px-4 rounded-lg shadow-sm" title={apiKeyError ? apiKeyError : "Get AI Health Insights"} ><SparklesIcon className="w-5 h-5" /></button>
            <button onClick={() => setIsRecordUploadModalOpen(true)} disabled={!!apiKeyError} className="bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg shadow-sm" title={apiKeyError ? apiKeyError : "Upload Record"}><PlusCircleIcon className="w-5 h-5" /></button>
            <button onClick={() => openMetricForm()} className="bg-secondary hover:bg-secondary-dark text-white font-semibold py-2 px-4 rounded-lg shadow-sm"><HeartIcon className="w-5 h-5" /></button>
            <button onClick={() => openIssueForm()} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm"><ListChecksIcon className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      {apiKeyError && <div className="container mx-auto max-w-7xl mt-4"><div className="bg-amber-100 border-l-4 border-accent text-amber-800 p-4 rounded-r-lg"><p>{apiKeyError}</p></div></div>}

      <main className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl flex-grow">
        {viewState.view !== 'metricDetail' && (
            <div className="mb-6 border-b border-base-200">
                <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto">
                    {navItems.map(tab => {
                        const IconComponent = tab.icon;
                        const newAlertCount = tab.id === 'alerts' ? alerts.filter(a => a.status === 'new').length : 0;
                        return (
                            <button key={tab.id} onClick={() => { setViewState({ view: tab.id }); setFilterIssueId(null); setAiReviewResult(null); setSelectedRecordIds([]); setIsIssueMergeMode(false); setSelectedIssueIds([]); }} className={`py-2 px-3 sm:px-4 font-medium text-sm rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap relative ${viewState.view === tab.id ? 'border-b-2 border-primary text-primary bg-primary/10' : 'text-base-500 hover:text-base-700'}`}>
                                <IconComponent className="w-4 h-4" /> 
                                {tab.label}
                                {newAlertCount > 0 && (
                                  <span className="ml-1.5 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-danger rounded-full">{newAlertCount}</span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>
        )}
        
        {['records', 'metrics', 'issues', 'care-summary', 'labs'].includes(viewState.view) && !aiReviewResult && (
            <div className="mb-6 max-w-sm"><label htmlFor="issueFilter" className="block text-sm font-medium text-base-700 mb-1">Filter by Health Issue</label><select id="issueFilter" value={filterIssueId || ""} onChange={(e) => setFilterIssueId(e.target.value || null)} className="mt-1 block w-full pl-3 pr-10 py-2 border-base-300 bg-white rounded-md shadow-sm sm:text-sm"><option value="">All Issues</option>{issues.map(issue => <option key={issue.id} value={issue.id}>{issue.name}</option>)}</select></div>
        )}

        {renderContent()}
      </main>

      <footer className="bg-base-800 text-base-200 text-center p-4 text-sm mt-8">© {new Date().getFullYear()} Health Records Hub.</footer>

      {isRecordUploadModalOpen && <RecordUploadModal isOpen={isRecordUploadModalOpen} onClose={() => setIsRecordUploadModalOpen(false)} onSave={handleRecordDataSave} apiKeyAvailable={!apiKeyError} issues={issues} />}
      {isRecordDetailModalOpen && selectedRecord && <RecordDetailModal isOpen={isRecordDetailModalOpen} onClose={() => { setIsRecordDetailModalOpen(false); setSelectedRecord(null); }} record={selectedRecord} onSave={handleRecordSave} onDelete={handleDeleteRecord} issues={issues} />}
      {isMetricFormModalOpen && <MetricFormModal isOpen={isMetricFormModalOpen} onClose={() => { setIsMetricFormModalOpen(false); setSelectedMetric(null); }} onSave={handleMetricSave} onDelete={selectedMetric ? handleDeleteMetric : undefined} initialData={selectedMetric} date={metricDate} issues={issues} />}
      {isIssueModalOpen && <IssueModal isOpen={isIssueModalOpen} onClose={() => { setIsIssueModalOpen(false); setSelectedIssue(null); }} onSave={handleIssueSave} onDelete={selectedIssue ? handleDeleteIssue : undefined} initialData={selectedIssue} />}
      {isMergeIssuesModalOpen && <MergeIssuesModal isOpen={isMergeIssuesModalOpen} onClose={() => setIsMergeIssuesModalOpen(false)} onMerge={handleMergeIssues} issuesToMerge={issues.filter(i => selectedIssueIds.includes(i.id))} />}
      {isInsightsModalOpen && <InsightsModal isOpen={isInsightsModalOpen} onClose={() => setIsInsightsModalOpen(false)} healthProfile={healthProfile} />}
      {isPatientFormModalOpen && <PatientFormModal isOpen={isPatientFormModalOpen} onClose={() => setIsPatientFormModalOpen(false)} onSave={handlePatientSave} />}
      {isImageViewerOpen && selectedImageRecord && activePatient && (
        <ImageViewerModal 
            isOpen={isImageViewerOpen} 
            onClose={() => { setIsImageViewerOpen(false); setSelectedImageRecord(null); }}
            record={selectedImageRecord}
            patientId={activePatient.id}
        />
      )}
    </div>
  );
};

export default App;
