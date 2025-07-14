
import React, { useState, useEffect } from 'react';
import { Patient } from '../types';

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Patient) => void;
  initialData?: Patient | null;
}

export const PatientFormModal: React.FC<PatientFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [patient, setPatient] = useState<Partial<Patient>>({
    firstName: '',
    lastName: '',
  });

  useEffect(() => {
    if (initialData) {
      setPatient(initialData);
    } else {
      setPatient({ firstName: '', lastName: '' });
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPatient(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient.firstName || !patient.lastName) {
        alert("Please provide a first and last name for the patient.");
        return;
    }
    onSave({
      id: initialData?.id || crypto.randomUUID(),
      createdAt: initialData?.createdAt || new Date().toISOString(),
      ...patient,
    } as Patient);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-base-50 p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-semibold mb-5 text-primary-dark">{initialData ? 'Edit' : 'Add New'} Patient</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-base-700">First Name</label>
              <input type="text" name="firstName" id="firstName" value={patient.firstName || ''} onChange={handleChange} className="mt-1 block w-full bg-white border-base-300 rounded-md shadow-sm p-2" required />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-base-700">Last Name</label>
              <input type="text" name="lastName" id="lastName" value={patient.lastName || ''} onChange={handleChange} className="mt-1 block w-full bg-white border-base-300 rounded-md shadow-sm p-2" required />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-base-200">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-base-700 bg-white hover:bg-base-100 rounded-md shadow-sm border border-base-300">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md shadow-sm">
              {initialData ? 'Save Changes' : 'Add Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
