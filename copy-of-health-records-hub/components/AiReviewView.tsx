
import React, { useState, useMemo } from 'react';
import { GeminiReviewResult, HealthProfile, GeminiFinding } from '../types';
import { ArrowLeftIcon, AlertTriangleIcon, SparklesIcon } from './Icons';
import { ChatInterface } from './ChatInterface';
import { GeminiService } from '../services/geminiService';
import { Chat } from '@google/genai';

interface AiReviewViewProps {
    result: GeminiReviewResult;
    healthProfile: HealthProfile;
    onBack: () => void;
}

const FindingCard: React.FC<{ finding: GeminiFinding }> = ({ finding }) => {
    const getConcernColorClasses = () => {
        switch (finding.potentialConcernLevel) {
            case 'High': return 'border-danger bg-red-50 text-danger-dark';
            case 'Moderate': return 'border-accent bg-amber-50 text-amber-800';
            case 'Normal':
            default: return 'border-green-500 bg-green-50 text-green-800';
        }
    }
    
    return (
        <div className={`p-4 rounded-lg border-l-4 ${getConcernColorClasses()}`}>
            <p><strong className="font-semibold">Observation:</strong> {finding.observation}</p>
            <p className="mt-2"><strong className="font-semibold">Assessment:</strong> {finding.assessment}</p>
            {finding.reasoning && <p className="mt-2 text-sm italic">"{finding.reasoning}"</p>}
        </div>
    );
};

export const AiReviewView: React.FC<AiReviewViewProps> = ({ result, healthProfile, onBack }) => {
    const [chat, setChat] = useState<Chat | null>(null);

    useMemo(() => {
        const systemInstruction = `You are an AI health assistant. You have just completed a detailed review of several of the user's medical records. The user will now ask you questions about this review. Your primary context is the review you generated, but you also have the user's full health profile. Be empathetic, clear, and always remind the user to consult a healthcare professional for medical advice.

Here is the review you generated: ${JSON.stringify(result)}
    
And here is the patient's full health profile: ${JSON.stringify(healthProfile)}`;
        
        setChat(GeminiService.createChatSession(healthProfile, systemInstruction));

    }, [result, healthProfile]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                    <ArrowLeftIcon className="w-5 h-5" />
                    Back to All Records
                </button>
            </div>

            <header className="mb-8 p-6 bg-white rounded-lg shadow-md border border-base-200">
                <h2 className="text-3xl font-bold text-primary-dark flex items-center gap-3">
                    <SparklesIcon className="w-8 h-8 text-accent" />
                    AI Review Report
                </h2>
                <p className="text-base-700 mt-4">{result.overallAssessment}</p>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <main className="lg:col-span-2 space-y-6">
                   {result.individualRecordFindings.map(recordFinding => (
                       <div key={recordFinding.recordId} className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-base-200">
                           <h3 className="text-lg font-semibold text-base-800 border-b border-base-200 pb-3 mb-4">Record: {recordFinding.recordTitle}</h3>
                           {recordFinding.findings.length > 0 ? (
                               <div className="space-y-4">
                                   {recordFinding.findings.map((finding, index) => <FindingCard key={index} finding={finding} />)}
                               </div>
                           ) : (
                               <p className="text-base-500">No specific findings or abnormalities noted in this record.</p>
                           )}
                       </div>
                   ))}
                   
                   {result.crossRecordConnections.length > 0 && (
                        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-base-200">
                           <h3 className="text-lg font-semibold text-base-800 border-b border-base-200 pb-3 mb-4">Cross-Record Connections</h3>
                           <div className="space-y-3">
                                {result.crossRecordConnections.map((connection, index) => (
                                    <div key={index} className="p-3 bg-primary/10 border-l-4 border-primary rounded-r-md">
                                        <p className="font-semibold text-primary-dark">{connection.observation}</p>
                                        <p className="text-sm text-base-700 mt-1">{connection.implication}</p>
                                        <p className="text-sm font-medium text-secondary-dark mt-2">Suggestion: {connection.recommendation}</p>
                                    </div>
                                ))}
                           </div>
                       </div>
                   )}

                   {result.questionsForDoctor.length > 0 && (
                        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-base-200">
                           <h3 className="text-lg font-semibold text-base-800 border-b border-base-200 pb-3 mb-4">Suggested Questions for Your Doctor</h3>
                           <ul className="list-decimal list-inside space-y-2 text-base-700 font-medium">
                               {result.questionsForDoctor.map((q, i) => <li key={i}>{q}</li>)}
                           </ul>
                       </div>
                   )}
                   
                   <p className="text-xs text-center text-base-400 italic pt-4">Disclaimer: AI-generated content is for informational purposes only and is not medical advice. Consult with a healthcare professional.</p>

                </main>
                <aside className="lg:col-span-1">
                     <div className="sticky top-24">
                        <h2 className="text-2xl font-bold text-base-900 mb-4">Chat About this Review</h2>
                        {chat ? <ChatInterface chat={chat} /> : <div className="text-center text-base-500 p-4 bg-white rounded-lg shadow-md border border-base-200">Chat is unavailable.</div>}
                    </div>
                </aside>
            </div>
        </div>
    );
};
