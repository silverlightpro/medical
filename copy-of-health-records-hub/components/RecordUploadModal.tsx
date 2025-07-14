
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { MedicalRecord, RecordType, GeminiExtractedData, HealthIssue, GeminiExtractedMetric, HealthMetric, GeminiDailyData } from '../types';
import { PdfService } from '../services/pdfService';
import { GeminiService } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { AlertTriangleIcon } from './Icons';

interface RecordUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dataArray: { record: Partial<MedicalRecord>, metrics: Partial<HealthMetric>[] }[], newDiagnosesToCreate: string[]) => Promise<void>;
  apiKeyAvailable: boolean;
  issues: HealthIssue[];
}

interface StagedRecordData {
    record: Partial<MedicalRecord>;
    metrics: GeminiExtractedMetric[];
    newPotentialDiagnoses: string[];
}

const workerCode = `
  self.onmessage = (e) => {
    const { file } = e.data;
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        self.postMessage({ type: 'progress', message: 'Extracting text from XML...' });
        const xmlText = event.target.result;

        // Use a regular expression to strip XML/HTML tags and get the content.
        // This is much more memory-efficient than DOMParser for large files and works in a worker.
        // It replaces tags with spaces and cleans up extra whitespace.
        const extractedText = xmlText
          .replace(/<[^>]+>/g, ' ')
          .replace(/\\s+/g, ' ')
          .trim();
        
        if (!extractedText) {
          self.postMessage({ type: 'error', message: 'Could not extract any text from the XML file.' });
          return;
        }
        
        self.postMessage({ type: 'progress', message: 'XML text extracted. Sending to AI...' });
        self.postMessage({ type: 'result', text: extractedText });

      } catch (err) {
        // Use err.message to provide a more descriptive error.
        self.postMessage({ type: 'error', message: 'An error occurred during XML parsing: ' + err.message });
      }
    };
    
    reader.onerror = () => {
        self.postMessage({ type: 'error', message: 'Failed to read the file.' });
    };
    
    reader.onprogress = (event) => {
        if (event.lengthComputable) {
            const percentLoaded = Math.round((event.loaded / event.total) * 100);
            self.postMessage({ type: 'progress', message: 'Reading file: ' + percentLoaded + '%' });
        }
    };

    reader.readAsText(file);
  };
`;


export const RecordUploadModal: React.FC<RecordUploadModalProps> = ({ isOpen, onClose, onSave, apiKeyAvailable, issues }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingMessage, setProcessingMessage] = useState('');
  
  const [stagedData, setStagedData] = useState<StagedRecordData[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [diagnosesToCreate, setDiagnosesToCreate] = useState<string[]>([]);


  const workerRef = useRef<Worker | null>(null);

  const handleGeminiAnalysis = useCallback(async (text: string, sourceFile: File, fileUrl?: string) => {
     if (!apiKeyAvailable) {
         setError("AI processing is unavailable. Please fill in the record details manually.");
         setStagedData([{
             record: {
                 fileName: sourceFile.name,
                 fileDataUrl: fileUrl,
                 extractedText: text,
                 recordDate: new Date().toISOString().split('T')[0],
                 recordType: RecordType.Other,
                 title: sourceFile.name.replace(/\.(pdf|xml)$/i, ''),
                 details: '',
                 associatedIssueIds: []
             },
             metrics: [],
             newPotentialDiagnoses: []
         }]);
         setIsProcessing(false);
         return;
      }

      setProcessingMessage("AI is analyzing the document...");
      const geminiResult: GeminiExtractedData = await GeminiService.analyzeMedicalText(text);
      
      if (geminiResult && geminiResult.length > 0) {
          geminiResult.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
          const newStagedData = geminiResult.map((dayData: GeminiDailyData) => {
              const potentialDiagnoses = dayData.recordInfo.diagnoses || [];
              const newPotentialDiagnoses = potentialDiagnoses.filter(d => !issues.some(i => i.name.toLowerCase() === d.toLowerCase()));
              return {
                  record: {
                      fileName: sourceFile.name,
                      fileDataUrl: fileUrl,
                      extractedText: text,
                      title: dayData.recordInfo.suggestedTitle || `${sourceFile.name.replace(/\.(pdf|xml)$/i, '')} - ${dayData.date}`,
                      recordDate: dayData.date,
                      geminiSummary: dayData.recordInfo.summary || '',
                      details: dayData.recordInfo.summary || '',
                      extractedDiagnoses: potentialDiagnoses,
                      extractedProcedures: dayData.recordInfo.procedures || [],
                      extractedKeyFindings: dayData.recordInfo.keyFindings || [],
                      recordType: (dayData.recordInfo.recordTypeSuggestion as RecordType) || RecordType.Other,
                      associatedIssueIds: [],
                  },
                  metrics: dayData.metrics || [],
                  newPotentialDiagnoses: newPotentialDiagnoses
              }
          });
          setStagedData(newStagedData);
          // Pre-select all new diagnoses to be created
          const allNewDiagnoses = new Set(newStagedData.flatMap(d => d.newPotentialDiagnoses));
          setDiagnosesToCreate(Array.from(allNewDiagnoses));
      } else {
         setError("AI processing failed or returned no data. Please fill manually.");
         setStagedData([{ record: { fileName: sourceFile.name, fileDataUrl: fileUrl, extractedText: text, recordDate: new Date().toISOString().split('T')[0], title: sourceFile.name.replace(/\.(pdf|xml)$/i, '') }, metrics: [], newPotentialDiagnoses: [] }]);
      }
  }, [apiKeyAvailable, issues]);


  const processFile = useCallback(async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setStagedData([]);
    
    try {
        if (file.type === 'application/pdf') {
            setProcessingMessage("Extracting text from PDF...");
            const fileDataUrl = await PdfService.fileToDataURL(file);
            const extractedText = await PdfService.extractTextFromFile(file);
            await handleGeminiAnalysis(extractedText, file, fileDataUrl);
            setIsProcessing(false);

        } else if (file.type === 'application/xml' || file.type === 'text/xml') {
            const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
            const workerUrl = URL.createObjectURL(workerBlob);
            workerRef.current = new Worker(workerUrl);

            workerRef.current.onmessage = async (e) => {
                const { type, message, text } = e.data;
                if (type === 'progress') {
                    setProcessingMessage(message);
                } else if (type === 'error') {
                    setError(message);
                    setIsProcessing(false);
                    if (workerRef.current) workerRef.current.terminate();
                } else if (type === 'result') {
                    await handleGeminiAnalysis(text, file);
                    setIsProcessing(false);
                    if (workerRef.current) workerRef.current.terminate();
                }
            };
            
            workerRef.current.onerror = (e) => {
                setError(`Worker error: ${e.message}`);
                setIsProcessing(false);
            };

            workerRef.current.postMessage({ file });

        } else {
            setError("Unsupported file type. Please upload a PDF or XML file.");
            setIsProcessing(false);
        }

    } catch (err) {
      console.error("Error processing file:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred during processing.");
      setIsProcessing(false);
    }
  }, [file, handleGeminiAnalysis]);
  
  const handleCurrentRecordChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setStagedData(prev => {
        const newData = [...prev];
        newData[currentStep].record = { ...newData[currentStep].record, [name]: value };
        return newData;
    });
  };
  
  const handleCurrentIssueChange = (issueId: string) => {
    setStagedData(prev => {
        const newData = [...prev];
        const currentIds = newData[currentStep].record.associatedIssueIds || [];
        if (currentIds.includes(issueId)) {
            newData[currentStep].record.associatedIssueIds = currentIds.filter(id => id !== issueId);
        } else {
            newData[currentStep].record.associatedIssueIds = [...currentIds, issueId];
        }
        return newData;
    });
  };
  
  const handleToggleDiagnosisToCreate = (diagnosisName: string) => {
    setDiagnosesToCreate(prev =>
        prev.includes(diagnosisName)
            ? prev.filter(d => d !== diagnosisName)
            : [...prev, diagnosisName]
    );
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (let i = 0; i < stagedData.length; i++) {
        const data = stagedData[i];
        if (!data.record.title?.trim() || !data.record.recordDate) {
            setError(`Record ${i + 1} of ${stagedData.length} is incomplete. Please provide a title and a date.`);
            setCurrentStep(i);
            return; 
        }
    }
    setError(null);
    setIsSaving(true);
    try {
        const dataToSave = stagedData.map(data => ({
            record: data.record,
            metrics: data.metrics.map(metric => ({ ...metric, date: data.record.recordDate }))
        }));
        await onSave(dataToSave, diagnosesToCreate);
        resetForm();
        onClose();
    } catch (err) {
        console.error("Failed to save records", err);
        setError("An error occurred while saving. Please try again.");
    } finally {
        setIsSaving(false);
    }
  };
  
  const resetForm = () => {
    setFile(null);
    setIsProcessing(false);
    setError(null);
    setStagedData([]);
    setCurrentStep(0);
    setDiagnosesToCreate([]);
    setProcessingMessage('');
    if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };
  
  const currentRecordData = stagedData.length > 0 ? stagedData[currentStep].record : null;
  const currentMetrics = stagedData.length > 0 ? stagedData[currentStep].metrics : [];
  const allNewPotentalDiagnoses = useMemo(() => {
    const all = new Set(stagedData.flatMap(d => d.newPotentialDiagnoses));
    return Array.from(all);
  }, [stagedData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-base-50 p-6 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <h2 className="text-2xl font-semibold mb-5 text-primary-dark flex-shrink-0">
          {stagedData.length > 1 ? `Review Record ${currentStep + 1} of ${stagedData.length}` : 'Upload New Medical Record'}
        </h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 border border-red-300 rounded-md flex items-center flex-shrink-0">
            <AlertTriangleIcon className="w-5 h-5 mr-2"/> {error}
          </div>
        )}

        <div className="overflow-y-auto pr-2 -mr-2 flex-grow">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {isProcessing ? (
                <div className="text-center my-4 flex flex-col items-center gap-4">
                    <LoadingSpinner /> 
                    <p className="text-base-500 font-medium">{processingMessage}</p>
                    <p className="text-xs text-base-400">Please keep this window open. Processing large files may take some time.</p>
                </div>
            ) : !currentRecordData ? (
                <div>
                  <label htmlFor="recordFile" className="block text-sm font-medium text-base-700 mb-1">Record File (PDF or XML)</label>
                  <input 
                    type="file" 
                    id="recordFile" 
                    accept="application/pdf,application/xml,text/xml"
                    onChange={(e) => setFile(e.target.files?.[0] || null)} 
                    className="w-full text-sm text-base-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors"
                  />
                  {file && (
                      <button 
                        type="button" 
                        onClick={processFile}
                        className="w-full bg-secondary hover:bg-secondary-dark text-white font-bold py-2 px-4 rounded-lg transition duration-150 mt-4"
                        disabled={isProcessing}
                      >
                        Process Record
                      </button>
                    )}
                </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-base-700">Title</label>
                    <input type="text" name="title" id="title" value={currentRecordData.title || ''} onChange={handleCurrentRecordChange} className="mt-1 block w-full bg-white border-base-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2" required />
                  </div>
                  <div>
                    <label htmlFor="recordDate" className="block text-sm font-medium text-base-700">Record Date</label>
                    <input type="date" name="recordDate" id="recordDate" value={currentRecordData.recordDate || ''} onChange={handleCurrentRecordChange} className="mt-1 block w-full bg-white border-base-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2" required />
                  </div>
                </div>
                <div>
                  <label htmlFor="recordType" className="block text-sm font-medium text-base-700">Record Type</label>
                  <select name="recordType" id="recordType" value={currentRecordData.recordType} onChange={handleCurrentRecordChange} className="mt-1 block w-full bg-white border-base-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2">
                    {Object.values(RecordType).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="details" className="block text-sm font-medium text-base-700">AI Summary / Details</label>
                  <textarea name="details" id="details" rows={4} value={currentRecordData.details || ''} onChange={handleCurrentRecordChange} className="mt-1 block w-full bg-white border-base-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2 whitespace-pre-wrap" placeholder="AI summary will appear here if available, or enter manually."></textarea>
                </div>
                 <div>
                  <label className="block text-sm font-medium text-base-700">Associate with Health Issue(s)</label>
                  <div className="mt-2 space-y-2 p-3 bg-white rounded-md border border-base-200">
                    {issues.length > 0 ? issues.map(issue => (
                      <label key={issue.id} className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-primary border-base-300 rounded focus:ring-primary"
                          checked={currentRecordData.associatedIssueIds?.includes(issue.id) || false}
                          onChange={() => handleCurrentIssueChange(issue.id)}
                        />
                        <span className="ml-2 text-sm text-base-700">{issue.name}</span>
                      </label>
                    )) : <p className="text-xs text-base-500">No health issues created yet.</p>}
                  </div>
                </div>
                {currentMetrics.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-base-700">Extracted Metrics for this Day</label>
                    <div className="mt-2 p-3 border border-base-200 rounded-md max-h-40 overflow-y-auto text-xs bg-white">
                        <ul className="list-disc list-inside space-y-1 pl-2">
                          {currentMetrics.map((metric, i) => (
                            <li key={i}><strong className="text-base-800">{metric.name}:</strong> <span className="text-secondary-dark">{metric.value} {metric.unit}</span> <em className="text-base-500">({metric.category})</em></li>
                          ))}
                        </ul>
                    </div>
                  </div>
                )}
                {allNewPotentalDiagnoses.length > 0 && currentStep === stagedData.length - 1 && (
                    <div>
                        <label className="block text-sm font-medium text-base-700">Create New Health Issues?</label>
                        <p className="text-xs text-base-500 mb-2">The AI found the following potential new diagnoses. Select the ones you'd like to add to the patient's profile.</p>
                        <div className="mt-2 space-y-2 p-3 bg-white rounded-md border border-base-200">
                            {allNewPotentalDiagnoses.map(diag => (
                                <label key={diag} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 text-primary border-base-300 rounded focus:ring-primary"
                                        checked={diagnosesToCreate.includes(diag)}
                                        onChange={() => handleToggleDiagnosisToCreate(diag)}
                                    />
                                    <span className="ml-2 text-sm text-base-700">{diag}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
              </>
            )}
          
            <div className="mt-6 flex justify-between space-x-3 pt-4 border-t border-base-200 flex-shrink-0">
              <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium text-base-700 bg-white hover:bg-base-100 rounded-md shadow-sm border border-base-300">
                Cancel
              </button>
              {stagedData.length > 0 && !isProcessing && (
                <div className="flex items-center gap-3">
                    {stagedData.length > 1 && (
                        <button type="button" onClick={() => setCurrentStep(p => p - 1)} disabled={currentStep === 0} className="px-4 py-2 text-sm font-medium text-base-700 bg-white hover:bg-base-100 rounded-md shadow-sm border border-base-300 disabled:opacity-50">
                            Previous
                        </button>
                    )}
                    {currentStep < stagedData.length - 1 ? (
                        <button type="button" onClick={() => setCurrentStep(p => p + 1)} className="px-4 py-2 text-sm font-medium text-white bg-secondary hover:bg-secondary-dark rounded-md shadow-sm">
                            Next
                        </button>
                    ) : (
                        <button 
                          type="submit" 
                          disabled={isSaving}
                          className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark flex items-center justify-center disabled:opacity-75"
                        >
                          {isSaving ? (
                            <>
                              <LoadingSpinner size="sm" color="text-white" />
                              <span className="ml-2">Saving...</span>
                            </>
                          ) : (
                            'Save All Records'
                          )}
                        </button>
                    )}
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
