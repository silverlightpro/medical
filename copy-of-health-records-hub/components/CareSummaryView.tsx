
import React, { useMemo } from 'react';
import { MedicalRecord, RecordType } from '../types';
import { FileTextIcon } from './Icons';

interface CareSummaryViewProps {
    records: MedicalRecord[];
    onRecordClick: (record: MedicalRecord) => void;
}

export const CareSummaryView: React.FC<CareSummaryViewProps> = ({ records, onRecordClick }) => {
    const careSummariesByDate = useMemo(() => {
        const careSummaryRecords = records
            .filter(r => r.recordType === RecordType.CareSummary)
            .sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime());

        return careSummaryRecords.reduce((acc, record) => {
            const date = record.recordDate;
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(record);
            return acc;
        }, {} as Record<string, MedicalRecord[]>);
    }, [records]);

    const sortedDates = Object.keys(careSummariesByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (sortedDates.length === 0) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md border border-base-200 text-center">
                <h2 className="text-xl font-semibold mb-4 text-primary-dark">Care Summaries</h2>
                <p className="text-base-500">No Care Summary records found.</p>
                <p className="text-sm text-base-400 mt-2">Upload a document and select the "Care Summary" type to see it here.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-base-200">
            <h2 className="text-2xl font-semibold mb-8 text-primary-dark">Care Summaries Timeline</h2>
            <div className="relative pl-6">
                {/* The timeline vertical bar */}
                <div className="absolute left-0 top-0 h-full w-0.5 bg-base-200 ml-[11px] -z-10"></div>
                
                {sortedDates.map(date => (
                    <div key={date} className="mb-8 relative">
                        {/* The timeline dot */}
                        <div className="absolute -left-1.5 top-1.5 w-6 h-6 bg-primary rounded-full border-4 border-white z-10"></div>
                        <div className="pl-8">
                            <h3 className="text-lg font-bold text-base-800 mb-4">
                                {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </h3>
                            <div className="space-y-4">
                                {careSummariesByDate[date].map(record => (
                                    <div 
                                        key={record.id} 
                                        className="p-4 border border-base-200 rounded-lg hover:bg-base-50 hover:shadow-sm transition-all duration-150 cursor-pointer"
                                        onClick={() => onRecordClick(record)}
                                    >
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <h4 className="font-semibold text-base text-base-800">{record.title || record.fileName}</h4>
                                                <p className="text-sm text-base-700 mt-2 line-clamp-3">{record.geminiSummary || record.details || 'No summary available.'}</p>
                                            </div>
                                            <FileTextIcon className="w-6 h-6 text-primary flex-shrink-0 ml-4 mt-1" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
