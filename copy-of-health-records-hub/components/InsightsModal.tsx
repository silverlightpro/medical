
import React, { useState, useEffect } from 'react';
import { HealthProfile, GeminiHealthInsights } from '../types';
import { GeminiService } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { SparklesIcon, AlertTriangleIcon } from './Icons';

interface InsightsModalProps {
    isOpen: boolean;
    onClose: () => void;
    healthProfile: HealthProfile;
}

const InsightSection: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div>
        <h3 className="text-lg font-semibold text-primary-dark mb-2">{title}</h3>
        {children}
    </div>
);

export const InsightsModal: React.FC<InsightsModalProps> = ({ isOpen, onClose, healthProfile }) => {
    const [insights, setInsights] = useState<GeminiHealthInsights | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            const fetchInsights = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const result = await GeminiService.getOverallHealthInsights(healthProfile);
                    if (result) {
                        setInsights(result);
                    } else {
                        setError("Could not generate health insights. The AI may not have been able to process the data.");
                    }
                } catch (e) {
                    console.error("Error fetching health insights:", e);
                    setError("An unexpected error occurred while generating insights.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchInsights();
        }
    }, [isOpen, healthProfile]);
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-base-50 p-6 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-5 pb-4 border-b border-base-200 flex-shrink-0">
                    <h2 className="text-2xl font-semibold text-primary-dark flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-accent" />
                        AI Health Insights
                    </h2>
                    <button onClick={onClose} className="text-2xl text-base-500 hover:text-base-800">&times;</button>
                </div>

                <div className="overflow-y-auto pr-2 -mr-2 flex-grow">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-64">
                            <LoadingSpinner size="lg" />
                            <p className="mt-4 text-base-500">Generating your health summary...</p>
                        </div>
                    )}
                    {error && (
                         <div className="p-4 bg-red-100 text-red-800 border border-red-300 rounded-md flex items-center">
                            <AlertTriangleIcon className="w-5 h-5 mr-3"/> 
                            <div>
                                <p className="font-bold">Error</p>
                                <p>{error}</p>
                            </div>
                        </div>
                    )}
                    {insights && (
                        <div className="space-y-6">
                            <InsightSection title="Overall Summary">
                                <p className="text-base-700">{insights.overallSummary}</p>
                            </InsightSection>
                            
                             {insights.notableTrends?.length > 0 && (
                                <InsightSection title="Notable Trends">
                                    <ul className="list-disc list-inside space-y-2 text-base-700">
                                        {insights.notableTrends.map((trend, i) => <li key={i}>{trend}</li>)}
                                    </ul>
                                </InsightSection>
                             )}

                             {insights.potentialConnections?.length > 0 && (
                                <InsightSection title="Potential Connections">
                                    <ul className="list-disc list-inside space-y-2 text-base-700">
                                        {insights.potentialConnections.map((connection, i) => <li key={i}>{connection}</li>)}
                                    </ul>
                                </InsightSection>
                            )}

                            {insights.questionsForDoctor?.length > 0 && (
                                <InsightSection title="Suggested Questions for Your Doctor">
                                     <div className="space-y-3">
                                        {insights.questionsForDoctor.map((question, i) => (
                                            <div key={i} className="p-3 bg-primary/10 border-l-4 border-primary rounded-r-md text-primary-dark font-medium">
                                                "{question}"
                                            </div>
                                        ))}
                                    </div>
                                </InsightSection>
                            )}
                            
                            <p className="text-xs text-center text-base-400 italic pt-4">Disclaimer: AI-generated content is for informational purposes only and is not medical advice. Always consult with a qualified healthcare professional for any health concerns.</p>
                        </div>
                    )}
                </div>

                <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-base-200 flex-shrink-0">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-base-700 bg-white hover:bg-base-100 rounded-md shadow-sm border border-base-300">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
