
import React, { useState, useEffect } from 'react';
import { HealthIssue } from '../types';
import { TrashIcon } from './Icons';

interface IssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (issue: HealthIssue) => void;
  onDelete?: (issueId: string) => void;
  initialData?: HealthIssue | null;
}

export const IssueModal: React.FC<IssueModalProps> = ({ isOpen, onClose, onSave, onDelete, initialData }) => {
  const [issue, setIssue] = useState<Partial<HealthIssue>>({
    name: '',
    status: 'Active',
    description: '',
  });

  useEffect(() => {
    if (initialData) {
      setIssue(initialData);
    } else {
      setIssue({
        name: '',
        status: 'Active',
        startDate: new Date().toISOString().split('T')[0],
        description: '',
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setIssue(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue.name) {
        alert("Please provide a name for the health issue.");
        return;
    }
    onSave({
      id: initialData?.id || crypto.randomUUID(),
      createdAt: initialData?.createdAt || new Date().toISOString(),
      ...issue,
    } as HealthIssue);
  };
  
  const handleDelete = () => {
    if (initialData && initialData.id && onDelete) {
        onDelete(initialData.id);
    }
  }


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-base-50 p-6 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center mb-5 pb-4 border-b border-base-200">
            <h2 className="text-2xl font-semibold text-primary-dark">{initialData ? 'Edit' : 'Add'} Health Issue</h2>
             {initialData && onDelete && (
                <button onClick={handleDelete} className="p-2 rounded-md hover:bg-red-100 transition-colors" title="Delete Issue">
                    <TrashIcon className="w-5 h-5 text-danger" />
                </button>
            )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-base-700">Issue Name</label>
            <input type="text" name="name" id="name" value={issue.name || ''} onChange={handleChange} className="mt-1 block w-full bg-white border-base-300 rounded-md shadow-sm p-2" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-base-700">Status</label>
              <select name="status" id="status" value={issue.status || 'Active'} onChange={handleChange} className="mt-1 block w-full bg-white border-base-300 rounded-md shadow-sm p-2">
                <option value="Active">Active</option>
                <option value="Resolved">Resolved</option>
                <option value="Monitoring">Monitoring</option>
              </select>
            </div>
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-base-700">Start Date (Optional)</label>
              <input type="date" name="startDate" id="startDate" value={issue.startDate || ''} onChange={handleChange} className="mt-1 block w-full bg-white border-base-300 rounded-md shadow-sm p-2" />
            </div>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-base-700">Description (Optional)</label>
            <textarea name="description" id="description" rows={3} value={issue.description || ''} onChange={handleChange} className="mt-1 block w-full bg-white border-base-300 rounded-md shadow-sm p-2"></textarea>
          </div>
          <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-base-200">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-base-700 bg-white hover:bg-base-100 rounded-md shadow-sm border border-base-300">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md shadow-sm">
              {initialData ? 'Save Changes' : 'Add Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
