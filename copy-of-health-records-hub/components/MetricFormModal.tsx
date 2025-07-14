
import React, { useState, useEffect } from 'react';
import { HealthMetric, HealthIssue, MetricCategory } from '../types';
import { TrashIcon } from './Icons';

interface MetricFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (metric: HealthMetric) => void;
  onDelete?: (metricId: string) => void;
  initialData?: HealthMetric | null;
  date: string; // YYYY-MM-DD
  issues: HealthIssue[];
}

const metricCategories: MetricCategory[] = [
  "Vital Signs",
  "General Observations",
  "Measurements",
  "Lab Results - CBC",
  "Lab Results - BMP",
  "Lab Results - CMP",
  "Lab Results - Lipids",
  "Lab Results - Coagulation",
  "Lab Results - Cardiac",
  "Lab Results - Urinalysis",
  "Lab Results - Blood Gas",
  "Lab Results - Specialized",
  "Pulmonary Function",
  "Imaging Findings",
  "Other"
];

export const MetricFormModal: React.FC<MetricFormModalProps> = ({ isOpen, onClose, onSave, onDelete, initialData, date, issues }) => {
  const [metric, setMetric] = useState<Partial<HealthMetric>>({
    date: date,
    time: new Date().toTimeString().substring(0,5), // HH:MM
    name: '',
    value: '',
    unit: '',
    category: 'Vital Signs',
    notes: '',
    associatedIssueIds: []
  });


  useEffect(() => {
    if (initialData) {
      setMetric(initialData);
    } else {
      setMetric({
        date: date,
        time: new Date().toTimeString().substring(0,5),
        name: '',
        value: '',
        unit: '',
        category: 'Vital Signs',
        notes: '',
        associatedIssueIds: []
      });
    }
  }, [initialData, date, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setMetric(prev => ({ ...prev, [name]: value }));
  };
  
  const handleIssueChange = (issueId: string) => {
    setMetric(prev => {
      const currentIds = prev.associatedIssueIds || [];
      if (currentIds.includes(issueId)) {
        return { ...prev, associatedIssueIds: currentIds.filter(id => id !== issueId) };
      } else {
        return { ...prev, associatedIssueIds: [...currentIds, issueId] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!metric.name || !metric.value || !metric.category) {
        alert("Please fill in name, value, and category for the metric.");
        return;
    }
    
    onSave({
      id: initialData?.id || crypto.randomUUID(),
      createdAt: initialData?.createdAt || new Date().toISOString(),
      ...metric,
    } as HealthMetric);
  };

  const handleDelete = () => {
    if (initialData && initialData.id && onDelete) {
        onDelete(initialData.id);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-base-50 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-5 pb-4 border-b border-base-200 flex-shrink-0">
            <h2 className="text-2xl font-semibold text-primary-dark">{initialData ? 'Edit' : 'Add'} Health Metric</h2>
            {initialData && onDelete && (
                <button onClick={handleDelete} className="p-2 rounded-md hover:bg-red-100 transition-colors" title="Delete Metric">
                    <TrashIcon className="w-5 h-5 text-danger" />
                </button>
            )}
        </div>
        
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-grow pr-2 -mr-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-base-700">Date</label>
              <input type="date" name="date" id="date" value={metric.date || ''} onChange={handleChange} className="mt-1 block w-full bg-white border-base-300 rounded-md shadow-sm p-2" required />
            </div>
            <div>
              <label htmlFor="time" className="block text-sm font-medium text-base-700">Time</label>
              <input type="time" name="time" id="time" value={metric.time || ''} onChange={handleChange} className="mt-1 block w-full bg-white border-base-300 rounded-md shadow-sm p-2" />
            </div>
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-base-700">Category</label>
            <select name="category" id="category" value={metric.category} onChange={handleChange} className="mt-1 block w-full bg-white border-base-300 rounded-md shadow-sm p-2" required>
              {metricCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
              <label htmlFor="name" className="block text-sm font-medium text-base-700">Metric Name</label>
              <input type="text" name="name" id="name" value={metric.name || ''} onChange={handleChange} className="mt-1 block w-full bg-white border-base-300 rounded-md shadow-sm p-2" placeholder="e.g., Heart Rate, Glucose" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="value" className="block text-sm font-medium text-base-700">Value</label>
              <input type="text" name="value" id="value" value={metric.value || ''} onChange={handleChange} className="mt-1 block w-full bg-white border-base-300 rounded-md shadow-sm p-2" placeholder="e.g., 120/80" required />
            </div>
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-base-700">Unit</label>
              <input type="text" name="unit" id="unit" value={metric.unit || ''} onChange={handleChange} className="mt-1 block w-full bg-white border-base-300 rounded-md shadow-sm p-2" placeholder="e.g., bpm, mg/dL" />
            </div>
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-base-700">Notes</label>
            <textarea name="notes" id="notes" rows={2} value={metric.notes || ''} onChange={handleChange} className="mt-1 block w-full bg-white border-base-300 rounded-md shadow-sm p-2"></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-base-700">Associate with Health Issue(s)</label>
            <div className="mt-2 space-y-2 p-3 bg-white rounded-md border border-base-200">
                {issues.length > 0 ? issues.map(issue => (
                <label key={issue.id} className="flex items-center">
                    <input
                    type="checkbox"
                    className="h-4 w-4 text-primary border-base-300 rounded focus:ring-primary"
                    checked={metric.associatedIssueIds?.includes(issue.id) || false}
                    onChange={() => handleIssueChange(issue.id)}
                    />
                    <span className="ml-2 text-sm text-base-700">{issue.name}</span>
                </label>
                )) : <p className="text-xs text-base-500">No health issues created yet.</p>}
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-base-200 flex-shrink-0">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-base-700 bg-white hover:bg-base-100 rounded-md shadow-sm border border-base-300">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md shadow-sm">
              {initialData ? 'Save Changes' : 'Add Metric'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};