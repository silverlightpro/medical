
import React, { useState, useEffect } from 'react';
import { MedicalRecord, RecordType, HealthIssue } from '../types';
import { DownloadIcon, EditIcon, TrashIcon, FileTextIcon } from './Icons';

interface RecordDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: MedicalRecord;
  onSave: (record: MedicalRecord) => void;
  onDelete: (recordId: string) => void;
  issues: HealthIssue[];
}

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({ isOpen, onClose, record, onSave, onDelete, issues }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableRecord, setEditableRecord] = useState<MedicalRecord>(record);

  useEffect(() => {
    setEditableRecord(record);
    setIsEditing(false); // Reset editing state when record changes
  }, [record]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditableRecord(prev => ({ ...prev, [name]: value } as MedicalRecord));
  };
  
  const handleIssueChange = (issueId: string) => {
    setEditableRecord(prev => {
      const currentIds = prev.associatedIssueIds || [];
      if (currentIds.includes(issueId)) {
        return { ...prev, associatedIssueIds: currentIds.filter(id => id !== issueId) };
      } else {
        return { ...prev, associatedIssueIds: [...currentIds, issueId] };
      }
    });
  };

  const handleSave = () => {
    onSave(editableRecord);
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete(record.id);
  };

    const handleDownloadSummary = () => {
        let summaryText = `Health Record Summary\n`;
        summaryText += `=======================\n\n`;
        summaryText += `Title: ${record.title}\n`;
        summaryText += `Record Date: ${new Date(record.recordDate).toLocaleDateString()}\n`;
        summaryText += `Record Type: ${record.recordType}\n`;

        if (record.geminiSummary) {
            summaryText += `\nAI Summary:\n-----------\n${record.geminiSummary}\n`;
        }
        if (record.details) {
            summaryText += `\nUser Notes:\n-----------\n${record.details}\n`;
        }
        if (record.extractedDiagnoses && record.extractedDiagnoses.length > 0) {
            summaryText += `\nDiagnoses: ${record.extractedDiagnoses.join(', ')}\n`;
        }
        if (record.extractedProcedures && record.extractedProcedures.length > 0) {
            summaryText += `\nProcedures: ${record.extractedProcedures.join(', ')}\n`;
        }
        if (record.extractedKeyFindings && record.extractedKeyFindings.length > 0) {
            summaryText += `\nKey Findings: ${record.extractedKeyFindings.join(', ')}\n`;
        }
        if (record.associatedIssueIds && record.associatedIssueIds.length > 0) {
            const associatedIssueNames = record.associatedIssueIds
                .map(id => issues.find(i => i.id === id)?.name)
                .filter(Boolean);
            if (associatedIssueNames.length > 0) {
                summaryText += `\nAssociated Issues: ${associatedIssueNames.join(', ')}\n`;
            }
        }

        const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${record.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_summary.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-base-50 p-6 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-5 pb-4 border-b border-base-200 flex-shrink-0">
          <h2 className="text-2xl font-semibold text-primary-dark">Record Details</h2>
          <div className="flex items-center gap-2">
            {!isEditing && record.fileDataUrl && (
                 <a
                    href={record.fileDataUrl}
                    download={record.fileName}
                    className="inline-flex items-center gap-2 px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-secondary hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
                    title="Download Original File"
                >
                    <DownloadIcon className="w-4 h-4" />
                    <span>Original</span>
                </a>
            )}
             {!isEditing && (
                <button
                    onClick={handleDownloadSummary}
                    className="inline-flex items-center gap-2 px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-700"
                    title="Download Summary as Text"
                >
                    <FileTextIcon className="w-4 h-4" />
                    <span>Summary</span>
                </button>
            )}
            <button onClick={() => setIsEditing(!isEditing)} className={`p-2 rounded-md ${isEditing ? 'bg-base-200' : 'hover:bg-base-100'} transition-colors`} title={isEditing ? "Cancel Edit" : "Edit Record"}>
              <EditIcon className="w-5 h-5 text-base-700" />
            </button>
            <button onClick={handleDelete} className="p-2 rounded-md hover:bg-red-100 transition-colors" title="Delete Record">
              <TrashIcon className="w-5 h-5 text-danger" />
            </button>
          </div>
        </div>
        
        <div className="overflow-y-auto pr-2 -mr-2 flex-grow">
          {isEditing ? (
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-base-700">Title</label>
                  <input type="text" name="title" id="title" value={editableRecord.title} onChange={handleChange} className="mt-1 block w-full bg-white border-base-300 rounded-md shadow-sm p-2" />
                </div>
                <div>
                  <label htmlFor="recordDate" className="block text-sm font-medium text-base-700">Record Date</label>
                  <input type="date" name="recordDate" id="recordDate" value={editableRecord.recordDate} onChange={handleChange} className="mt-1 block w-full bg-white border-base-300 rounded-md shadow-sm p-2" />
                </div>
              </div>
              <div>
                <label htmlFor="recordType" className="block text-sm font-medium text-base-700">Record Type</label>
                <select name="recordType" id="recordType" value={editableRecord.recordType} onChange={handleChange} className="mt-1 block w-full bg-white border-base-300 rounded-md shadow-sm p-2">
                  {Object.values(RecordType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="geminiSummary" className="block text-sm font-medium text-base-700">AI Summary</label>
                <textarea name="geminiSummary" id="geminiSummary" rows={3} value={editableRecord.geminiSummary || ''} onChange={handleChange} className="mt-1 block w-full bg-white border-base-300 rounded-md shadow-sm p-2"></textarea>
              </div>
              <div>
                <label htmlFor="details" className="block text-sm font-medium text-base-700">Your Notes / Details</label>
                <textarea name="details" id="details" rows={3} value={editableRecord.details || ''} onChange={handleChange} className="mt-1 block w-full bg-white border-base-300 rounded-md shadow-sm p-2"></textarea>
              </div>
              <div>
                  <label className="block text-sm font-medium text-base-700">Associate with Health Issue(s)</label>
                  <div className="mt-2 space-y-2 p-3 bg-white rounded-md border border-base-200">
                    {issues.map(issue => (
                      <label key={issue.id} className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-primary border-base-300 rounded focus:ring-primary"
                          checked={editableRecord.associatedIssueIds?.includes(issue.id) || false}
                          onChange={() => handleIssueChange(issue.id)}
                        />
                        <span className="ml-2 text-sm text-base-700">{issue.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              {(editableRecord.extractedDiagnoses?.length || 0) > 0 && (
                  <div><strong className="text-sm text-base-600">Diagnoses:</strong> <span className="text-sm">{editableRecord.extractedDiagnoses?.join(', ')}</span></div>
              )}
              {(editableRecord.extractedProcedures?.length || 0) > 0 && (
                  <div><strong className="text-sm text-base-600">Procedures:</strong> <span className="text-sm">{editableRecord.extractedProcedures?.join(', ')}</span></div>
              )}
              {(editableRecord.extractedKeyFindings?.length || 0) > 0 && (
                  <div className="mb-4"><strong className="text-sm text-base-600">Key Findings:</strong> <span className="text-sm">{editableRecord.extractedKeyFindings?.join(', ')}</span></div>
              )}
            </form>
          ) : (
            <div className="space-y-4">
              <h3 className="text-xl font-medium text-base-900">{editableRecord.title}</h3>
              <p className="text-sm text-base-500 -mt-3">{new Date(editableRecord.recordDate).toLocaleDateString()} | {editableRecord.recordType}</p>
              
              {editableRecord.geminiSummary && (
                  <div className="p-4 bg-primary/10 border-l-4 border-primary rounded-r-md">
                      <h4 className="font-semibold text-sm text-primary-dark">AI Summary:</h4>
                      <p className="text-sm text-base-700 whitespace-pre-wrap mt-1">{editableRecord.geminiSummary}</p>
                  </div>
              )}
              {editableRecord.details && editableRecord.details !== editableRecord.geminiSummary && (
                   <div className="p-4 bg-base-100 border-l-4 border-base-300 rounded-r-md">
                      <h4 className="font-semibold text-sm text-base-800">Your Notes:</h4>
                      <p className="text-sm text-base-700 whitespace-pre-wrap mt-1">{editableRecord.details}</p>
                  </div>
              )}
              
              <div className="text-sm space-y-2 pt-2">
                {editableRecord.extractedDiagnoses && editableRecord.extractedDiagnoses.length > 0 && (
                    <p><strong className="text-base-600 font-medium">Diagnoses:</strong> {editableRecord.extractedDiagnoses.join(', ')}</p>
                )}
                {editableRecord.extractedProcedures && editableRecord.extractedProcedures.length > 0 && (
                    <p><strong className="text-base-600 font-medium">Procedures:</strong> {editableRecord.extractedProcedures.join(', ')}</p>
                )}
                {editableRecord.extractedKeyFindings && editableRecord.extractedKeyFindings.length > 0 && (
                    <p><strong className="text-base-600 font-medium">Key Findings:</strong> {editableRecord.extractedKeyFindings.join(', ')}</p>
                )}
                {editableRecord.associatedIssueIds && editableRecord.associatedIssueIds.length > 0 && (
                    <div>
                        <strong className="text-base-600 font-medium">Associated Issues:</strong>
                        <ul className="list-disc list-inside ml-1">
                            {editableRecord.associatedIssueIds.map(id => {
                                const issue = issues.find(i => i.id === id);
                                return issue ? <li key={id}>{issue.name}</li> : null;
                            })}
                        </ul>
                    </div>
                )}
              </div>
              <p className="text-xs text-base-400 pt-4">File: {editableRecord.fileName}</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end space-x-3 flex-shrink-0 pt-4 border-t border-base-200">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-base-700 bg-white hover:bg-base-100 rounded-md shadow-sm border border-base-300">
            Close
          </button>
          {isEditing && (
            <button 
              type="button" 
              onClick={handleSave} 
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md shadow-sm"
            >
              Save Changes
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
