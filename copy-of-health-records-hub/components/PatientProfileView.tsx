
import React, { useState, useMemo } from 'react';
import { Patient } from '../types';

interface PatientProfileViewProps {
  patient: Patient;
  onSave: (patient: Patient) => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-base-200">
        <h3 className="text-lg font-semibold text-primary-dark border-b border-base-200 pb-2 mb-4">{title}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
            {children}
        </div>
    </div>
);

const InputField: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; placeholder?: string; }> = 
    ({ label, name, value, onChange, type = "text", placeholder }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-base-700">{label}</label>
        <input type={type} name={name} id={name} value={value} onChange={onChange} placeholder={placeholder} className="mt-1 block w-full bg-white border-base-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2" />
    </div>
);

export const PatientProfileView: React.FC<PatientProfileViewProps> = ({ patient, onSave }) => {
    const [profile, setProfile] = useState<Patient>(patient);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };
    
    const handleNestedChange = (e: React.ChangeEvent<HTMLInputElement>, section: 'emergencyContact' | 'stats') => {
        const { name, value } = e.target;
        setProfile(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [name]: value
            }
        }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(profile);
        alert("Profile saved successfully!");
    };
    
    const age = useMemo(() => {
        if (!profile.dateOfBirth) return 'N/A';
        const birthDate = new Date(profile.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age >= 0 ? age : 'N/A';
    }, [profile.dateOfBirth]);

    const bmi = useMemo(() => {
        const weightStr = profile.stats?.weight;
        const heightStr = profile.stats?.height;
        if (!weightStr || !heightStr) return 'N/A';

        let weight = parseFloat(weightStr);
        let height = parseFloat(heightStr);
        if (isNaN(weight) || isNaN(height) || height === 0) return 'N/A';

        if (profile.stats?.weightUnit === 'lbs') {
            weight = weight * 0.453592; // lbs to kg
        }
        if (profile.stats?.heightUnit === 'in') {
            height = height * 0.0254; // inches to meters
        } else {
             height = height / 100; // cm to meters
        }
        
        if (height <= 0) return 'N/A';
        const bmiValue = weight / (height * height);
        return bmiValue.toFixed(1);
    }, [profile.stats?.weight, profile.stats?.height, profile.stats?.weightUnit, profile.stats?.heightUnit]);


    return (
        <form onSubmit={handleSave} className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-primary-dark">Patient Profile</h2>
                <button type="submit" className="px-6 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-md shadow-sm">
                    Save Profile
                </button>
            </div>
            
            <Section title="Personal Information">
                <InputField label="First Name" name="firstName" value={profile.firstName} onChange={handleChange} />
                <InputField label="Middle Name" name="middleName" value={profile.middleName || ''} onChange={handleChange} />
                <InputField label="Last Name" name="lastName" value={profile.lastName} onChange={handleChange} />
                <InputField label="Suffix" name="suffix" value={profile.suffix || ''} onChange={handleChange} />
                <InputField label="Date of Birth" name="dateOfBirth" value={profile.dateOfBirth || ''} onChange={handleChange} type="date" />
                <div>
                    <label htmlFor="sex" className="block text-sm font-medium text-base-700">Sex (for personalization)</label>
                    <select
                        name="sex"
                        id="sex"
                        value={profile.sex || 'Prefer not to say'}
                        onChange={handleChange}
                        className="mt-1 block w-full bg-white border-base-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2"
                    >
                        <option value="Prefer not to say">Prefer not to say</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-base-700">Age</label>
                    <p className="mt-1 p-2 text-base-700">{age}</p>
                </div>
            </Section>

            <Section title="Contact Information">
                <InputField label="Address" name="address" value={profile.address || ''} onChange={handleChange} />
                <InputField label="City" name="city" value={profile.city || ''} onChange={handleChange} />
                <InputField label="State" name="state" value={profile.state || ''} onChange={handleChange} />
                <InputField label="Zip Code" name="zipCode" value={profile.zipCode || ''} onChange={handleChange} />
                <InputField label="Phone Number" name="phone" value={profile.phone || ''} onChange={handleChange} type="tel" />
                <InputField label="Email" name="email" value={profile.email || ''} onChange={handleChange} type="email" />
            </Section>
            
            <Section title="Emergency Contact">
                <InputField label="Full Name" name="name" value={profile.emergencyContact?.name || ''} onChange={(e) => handleNestedChange(e, 'emergencyContact')} />
                <InputField label="Phone Number" name="phone" value={profile.emergencyContact?.phone || ''} onChange={(e) => handleNestedChange(e, 'emergencyContact')} type="tel" />
                <InputField label="Email" name="email" value={profile.emergencyContact?.email || ''} onChange={(e) => handleNestedChange(e, 'emergencyContact')} type="email" />
            </Section>
            
            <Section title="Health Statistics">
                <div className="flex items-end gap-2">
                    <InputField label="Height" name="height" value={profile.stats?.height || ''} onChange={(e) => handleNestedChange(e, 'stats')} type="number" />
                    <select name="heightUnit" value={profile.stats?.heightUnit || 'in'} onChange={(e) => setProfile(p => ({ ...p, stats: { ...p.stats, heightUnit: e.target.value as any } }))} className="mb-1 block border-base-300 rounded-md shadow-sm p-2">
                        <option value="in">in</option>
                        <option value="cm">cm</option>
                    </select>
                </div>
                 <div className="flex items-end gap-2">
                    <InputField label="Weight" name="weight" value={profile.stats?.weight || ''} onChange={(e) => handleNestedChange(e, 'stats')} type="number" />
                    <select name="weightUnit" value={profile.stats?.weightUnit || 'lbs'} onChange={(e) => setProfile(p => ({ ...p, stats: { ...p.stats, weightUnit: e.target.value as any } }))} className="mb-1 block border-base-300 rounded-md shadow-sm p-2">
                        <option value="lbs">lbs</option>
                        <option value="kg">kg</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-base-700">BMI</label>
                    <p className="mt-1 p-2 text-base-700">{bmi}</p>
                </div>
                 <InputField label="Blood Type" name="bloodType" value={profile.stats?.bloodType || ''} onChange={(e) => handleNestedChange(e, 'stats')} placeholder="e.g. O+" />
            </Section>
        </form>
    );
};
