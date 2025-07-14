import React, { useState, useEffect, useMemo } from 'react';
import { HealthProfile, HealthMetric, GeminiMetricExplanation } from '../types';
import { GeminiService } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { ArrowLeftIcon, EditIcon, BookOpenIcon, ArrowTrendingUpIcon, ClipboardDocumentListIcon, AlertTriangleIcon } from './Icons';
import { ChatInterface } from './ChatInterface';
import { Chat } from '@google/genai';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MetricDetailPageProps {
  metricId: string;
  healthProfile: HealthProfile;
  onBack: () => void;
  onEditMetric: (date: string, metric: HealthMetric) => void;
  onMetricUpdate: (metric: HealthMetric) => void;
}

const DetailSection: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactNode; }> = ({ title, children, icon }) => (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-base-200">
        <h3 className="text-lg font-semibold text-primary-dark flex items-center gap-3 border-b border-base-200 pb-3 mb-3">
          {icon}
          {title}
        </h3>
        <div className="prose prose-sm max-w-none text-base-700 space-y-2">{children}</div>
    </div>
);

const RangeIndicator: React.FC<{ valueStr: string; rangeStr: string }> = ({ valueStr, rangeStr }) => {
    const valueNum = parseFloat(valueStr.split('/')[0]); // Handle BP like 120/80 by taking 120
    const rangeMatch = rangeStr.match(/([\d.]+)\s*-\s*([\d.]+)/);

    if (isNaN(valueNum) || !rangeMatch) {
        return <p><strong className="font-semibold text-base-700">Normal Range:</strong> {rangeStr}</p>;
    }

    const [_, lowStr, highStr] = rangeMatch;
    const low = parseFloat(lowStr);
    const high = parseFloat(highStr);
    
    let status: 'Low' | 'Normal' | 'High' = 'Normal';
    if (valueNum < low) status = 'Low';
    if (valueNum > high) status = 'High';

    const getStatusColor = () => {
        if (status === 'Normal') return 'bg-green-500';
        if (status === 'Low') return 'bg-blue-500';
        if (status === 'High') return 'bg-red-500';
    }

    return (
        <div>
            <p className="text-sm font-medium text-base-600 mb-1">Status: {status}</p>
            <div className="w-full bg-base-200 rounded-full h-2.5">
                <div className={`h-2.5 rounded-full ${getStatusColor()}`} style={{ width: '33.33%', marginLeft: status === 'Normal' ? '33.33%' : status === 'High' ? '66.66%' : '0%' }}></div>
            </div>
            <div className="flex justify-between text-xs text-base-500 mt-1">
                <span>{low}</span>
                <span>{high}</span>
            </div>
             <p className="text-sm text-center mt-2"><strong className="font-semibold text-base-700">Normal Range:</strong> {rangeStr}</p>
        </div>
    );
};

export const MetricDetailPage: React.FC<MetricDetailPageProps> = ({ metricId, healthProfile, onBack, onEditMetric, onMetricUpdate }) => {
  const [metric, setMetric] = useState<HealthMetric | null>(null);
  const [explanation, setExplanation] = useState<GeminiMetricExplanation | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const metricHistory = useMemo(() => {
    if (!metric) return [];
    const numericRegex = /^[0-9./]+$/;
    return healthProfile.metrics
        .filter(m => m.name === metric.name && !isNaN(parseFloat(m.value)) && numericRegex.test(m.value.split('/')[0]))
        .map(m => ({
            id: m.id,
            date: m.date,
            value: parseFloat(m.value.split('/')[0]),
            fullValue: m.value
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-30);
  }, [metric, healthProfile.metrics]);

  useEffect(() => {
    const foundMetric = healthProfile.metrics.find(m => m.id === metricId);
    if (!foundMetric) {
      setError("Metric not found.");
      setIsLoading(false);
      return;
    }
    setMetric(foundMetric);

    const fetchExplanationAndChat = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const chatSession = GeminiService.createChatSession(healthProfile);
        if (chatSession) {
          setChat(chatSession);
        }
        
        const explanationResult = await GeminiService.getMetricExplanation(foundMetric, healthProfile);
        if (explanationResult) {
          setExplanation(explanationResult);
          const updatedMetric = { ...foundMetric, explanation: JSON.stringify(explanationResult) };
          onMetricUpdate(updatedMetric);
        } else {
          setError("Could not load AI-powered explanation for this metric.");
        }

      } catch (e) {
        console.error(e);
        setError("An error occurred while fetching metric details.");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (foundMetric.explanation) {
      try {
        setExplanation(JSON.parse(foundMetric.explanation));
        setChat(GeminiService.createChatSession(healthProfile)); // Init chat even with cached data
        setIsLoading(false);
      } catch (e) {
        console.error("Failed to parse cached explanation, fetching new one.", e);
        fetchExplanationAndChat();
      }
    } else if (healthProfile.patient) {
      fetchExplanationAndChat();
    }
  }, [metricId, healthProfile, onMetricUpdate]);

  if (!metric) {
    return (
      <div className="text-center p-8">
        <p className="text-base-500">{error || 'Metric data could not be loaded.'}</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
            <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                <ArrowLeftIcon className="w-5 h-5" />
                Back
            </button>
             <button onClick={() => onEditMetric(metric.date, metric)} className="p-2 rounded-md hover:bg-base-100 transition-colors" title="Edit Metric">
              <EditIcon className="w-5 h-5 text-base-700" />
            </button>
        </div>
        
        <header className="mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-base-800">{metric.name}</h2>
            <p className="text-sm text-base-500 mt-1">{new Date(metric.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {metric.time}</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <main className="lg:col-span-2 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md border border-base-200 flex flex-col justify-center text-center">
                        <p className="text-sm text-base-500">Current Value</p>
                        <div className="my-2 text-5xl font-bold text-secondary-dark">
                            {metric.value}
                            <span className="text-2xl text-base-500 ml-2">{metric.unit}</span>
                        </div>
                        {explanation?.normalRange && <RangeIndicator valueStr={metric.value} rangeStr={explanation.normalRange} />}
                    </div>
                    <div className="md:col-span-3 bg-white p-4 sm:p-6 rounded-lg shadow-md border border-base-200">
                        <h3 className="text-base font-semibold text-base-800 mb-2">Historical Trend</h3>
                        {metricHistory.length > 1 ? (
                            <ResponsiveContainer width="100%" height={150}>
                                <LineChart data={metricHistory} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="date" tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} fontSize={12} stroke="#64748b" />
                                    <YAxis fontSize={12} domain={['dataMin - 1', 'dataMax + 1']} stroke="#64748b" />
                                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }} formatter={(value, name, props) => [props.payload.fullValue, 'Value']} />
                                    <Line type="monotone" dataKey="value" stroke="rgb(13 148 136)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} name="Value" />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-center text-sm text-base-500">Not enough data for a trend chart.</div>
                        )}
                    </div>
               </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-48 bg-white rounded-lg shadow-md border border-base-200">
                        <LoadingSpinner />
                        <p className="mt-3 text-base-500">Loading AI Analysis...</p>
                    </div>
                ) : error && !explanation ? (
                    <div className="bg-red-100 border-l-4 border-danger text-danger-dark p-4 rounded-r-lg">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                    </div>
                ) : explanation ? (
                    <>
                        <DetailSection title="Description" icon={<BookOpenIcon className="w-6 h-6 text-primary" />}>
                           <p>{explanation.description}</p>
                        </DetailSection>
                        <DetailSection title="Potential Causes for Deviation" icon={<AlertTriangleIcon className="w-6 h-6 text-amber-500" />}>
                           <p>{explanation.causesForDeviation}</p>
                        </DetailSection>
                        <DetailSection title="Personalized Impact Analysis" icon={<ClipboardDocumentListIcon className="w-6 h-6 text-purple-600" />}>
                           <p>{explanation.patientSpecificImpact}</p>
                        </DetailSection>
                        <DetailSection title="General Improvement Plan" icon={<ArrowTrendingUpIcon className="w-6 h-6 text-green-600" />}>
                           <p>{explanation.improvementPlan}</p>
                        </DetailSection>
                        <p className="text-xs text-center text-base-400 italic">Disclaimer: AI-generated content is for informational purposes only and is not medical advice. Consult with a healthcare professional.</p>
                    </>
                ) : null}
            </main>
            <aside className="lg:col-span-1">
                 <h2 className="text-2xl font-bold text-base-900 mb-4">Chat with AI Assistant</h2>
                 {chat ? <ChatInterface chat={chat} /> : <div className="text-center text-base-500 p-4 bg-white rounded-lg shadow-md border border-base-200">Chat is unavailable.</div>}
            </aside>
        </div>

    </div>
  );
};