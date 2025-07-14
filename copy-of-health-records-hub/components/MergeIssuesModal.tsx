
import React, { useState, useEffect } from 'react';
import { HealthIssue } from '../types';

interface MergeIssuesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMerge: (primaryIssueId: string, issueIdsToDelete: string[]) => void;
  issuesToMerge: HealthIssue[];
}

export const MergeIssuesModal: React.FC<MergeIssuesModalProps> = ({ isOpen, onClose, onMerge, issuesToMerge }) => {
  const [primaryIssueId, setPrimaryIssueId] = useState<string>('');

  useEffect(() => {
    if (issuesToMerge.length > 0) {
      setPrimaryIssueId(issuesToMerge[0].id);
    }
  }, [issuesToMerge]);

  const handleMerge = () => {
    if (!primaryIssueId) {
      alert("Please select a primary issue to merge into.");
      return;
    }
    const issueIdsToDelete = issuesToMerge
      .map(i => i.id)
      .filter(id => id !== primaryIssueId);
      
    onMerge(primaryIssueId, issueIdsToDelete);
  };

  if (!isOpen) return null;
  
  const primaryIssueName = issuesToMerge.find(i => i.id === primaryIssueId)?.name || 'the selected issue';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-base-50 p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-semibold text-primary-dark mb-4">Merge Health Issues</h2>
        
        <p className="text-sm text-base-700 mb-4">Select the primary issue to keep. All other selected issues will be deleted, and their associated records and metrics will be moved to the primary issue.</p>
        
        <div className="space-y-3 mb-6">
            {issuesToMerge.map(issue => (
                <label key={issue.id} className="flex items-center p-3 bg-white rounded-md border border-base-200 cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary transition-colors">
                    <input
                        type="radio"
                        name="primary-issue"
                        value={issue.id}
                        checked={primaryIssueId === issue.id}
                        onChange={(e) => setPrimaryIssueId(e.target.value)}
                        className="h-4 w-4 text-primary focus:ring-primary"
                    />
                    <span className="ml-3 font-medium text-base-800">{issue.name}</span>
                </label>
            ))}
        </div>
        
        <div className="p-3 bg-amber-100 text-amber-900 text-sm rounded-md border border-amber-200">
            <strong>Warning:</strong> The other {issuesToMerge.length - 1} issue(s) will be permanently deleted. This action cannot be undone. All data will be consolidated under "{primaryIssueName}".
        </div>
        
        <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-base-200">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-base-700 bg-white hover:bg-base-100 rounded-md shadow-sm border border-base-300">
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleMerge} 
            className="px-4 py-2 text-sm font-medium text-white bg-danger hover:bg-danger-dark rounded-md shadow-sm"
          >
            Confirm Merge
          </button>
        </div>
      </div>
    </div>
  );
};
