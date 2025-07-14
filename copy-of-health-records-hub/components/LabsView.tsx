
import React, { useMemo } from 'react';
import { MedicalRecord, HealthMetric, RecordType } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BeakerIcon } from './Icons';

interface LabsViewProps {
    records: MedicalRecord[];
    metrics: HealthMetric[];
    onMetricClick: (metricId: string) => void;
    onImageClick: (record: MedicalRecord) => void;
}

const getLatestMetric = (metrics: HealthMetric[], name: string): HealthMetric | null => {
  return metrics
    .filter(m => m.name.toLowerCase() === name.toLowerCase())
    .sort((a, b) => new Date(b.date + 'T' + (b.time || '00:00')).getTime() - new Date(a.date + 'T' + (a.time || '00:00')).getTime())[0] || null;
};

const getMetricHistory = (metrics: HealthMetric[], name: string): { id: string, date: string, value: number }[] => {
  const numericRegex = /^[0-9./]+$/;
  return metrics
    .filter(m => m.name.toLowerCase() === name.toLowerCase() && !isNaN(parseFloat(m.value)) && numericRegex.test(m.value.split('/')[0]))
    .map(m => ({ id: m.id, date: m.date, value: parseFloat(m.value.split('/')[0]) }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-30);
};

const MetricCard: React.FC<{ title: string; metric: HealthMetric | null; onMetricClick: (metricId: string) => void }> = ({ title, metric, onMetricClick }) => (
  <div onClick={() => metric && onMetricClick(metric.id)} className={`bg-white p-4 rounded-lg shadow-md border border-base-200 flex flex-col justify-between h-full ${metric ? 'hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer' : 'cursor-default'}`}>
    <h3 className="text-base font-medium text-base-500">{title}</h3>
    {metric ? (
      <div className="text-right">
        <p className="mt-1 text-4xl font-bold text-secondary-dark">{metric.value}</p>
        <p className="text-sm text-base-500">{metric.unit}</p>
        <p className="text-xs text-base-400 mt-2">{new Date(metric.date).toLocaleDateString()}</p>
      </div>
    ) : (
      <div className="text-right">
        <p className="mt-1 text-4xl font-bold text-base-300">-</p>
      </div>
    )}
  </div>
);

const TrendChart: React.FC<{ title: string; data: { id:string, date: string, value: number }[]; color: string, onMetricClick: (metricId: string) => void }> = ({ title, data, color, onMetricClick }) => {
  if (data.length < 2) return null;
  return (
    <div className="mb-6 bg-white p-4 rounded-lg shadow-md border border-base-200">
      <h4 className="text-lg font-semibold mb-4 text-base-800">{title} Trend</h4>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }} onClick={(e: any) => e && e.activePayload && e.activePayload[0] && onMetricClick(e.activePayload[0].payload.id)}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} fontSize={12} stroke="#64748b" />
          <YAxis fontSize={12} domain={['dataMin - 1', 'dataMax + 1']} stroke="#64748b" />
          <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}/>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 4, fill: color, cursor: 'pointer' }} activeDot={{ r: 8, cursor: 'pointer' }} name={title}/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const LabsView: React.FC<LabsViewProps> = ({ records, metrics, onMetricClick, onImageClick }) => {
    const labMetrics = useMemo(() => metrics.filter(m => m.category.startsWith('Lab Results')), [metrics]);
    const imagingRecords = useMemo(() => records.filter(r => r.recordType === RecordType.Imaging).sort((a,b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime()), [records]);

    const KEY_LAB_METRICS = ["WBC", "Hemoglobin", "Platelet Count", "Glucose", "Sodium", "Potassium"];

    const latestKeyLabMetrics = useMemo(() => {
        return KEY_LAB_METRICS.map(name => ({ name, metric: getLatestMetric(labMetrics, name) }));
    }, [labMetrics]);
    
    const labChartData = useMemo(() => {
        const labMetricNames = [...new Set(labMetrics.map(m => m.name))];
        return labMetricNames
          .map(name => ({ name, history: getMetricHistory(labMetrics, name) }))
          .filter(chart => chart.history.length > 1)
          .sort((a,b) => b.history.length - a.history.length);
    }, [labMetrics]);

    if (labMetrics.length === 0 && imagingRecords.length === 0) {
        return (
             <div className="bg-white p-6 rounded-lg shadow-md border border-base-200 text-center">
                <BeakerIcon className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2 text-primary-dark">Labs & Imaging</h2>
                <p className="text-base-500">No lab results or imaging records found.</p>
                <p className="text-sm text-base-400 mt-2">Upload a document and select the "Lab Result" or "Imaging" type to see it here.</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-base-900">Labs & Imaging</h2>
                <p className="text-base-500 mt-1">Review your lab results and medical images.</p>
            </div>

            {/* Key Lab Metrics */}
            <div>
                <h3 className="text-xl font-semibold mb-4 text-primary-dark">Key Lab Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {latestKeyLabMetrics.map(item => (
                        <MetricCard
                            key={item.name}
                            title={item.name}
                            metric={item.metric}
                            onMetricClick={onMetricClick}
                        />
                    ))}
                </div>
            </div>

            {/* Lab Trends */}
            {labChartData.length > 0 && (
                <div>
                    <h3 className="text-xl font-semibold mb-4 text-primary-dark">Lab Result Trends</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {labChartData.map((chart, index) => (
                            <TrendChart 
                                key={chart.name} 
                                title={chart.name} 
                                data={chart.history}
                                color={['#0d9488', '#f59e0b', '#0284c7', '#f97316', '#8b5cf6', '#ec4899'][index % 6]}
                                onMetricClick={onMetricClick}
                            />
                        ))}
                    </div>
                </div>
            )}
            
            {/* Imaging Gallery */}
            {imagingRecords.length > 0 && (
                <div>
                    <h3 className="text-xl font-semibold mb-4 text-primary-dark">Imaging Gallery</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {imagingRecords.map(record => (
                            <div key={record.id} onClick={() => onImageClick(record)} className="group cursor-pointer aspect-square bg-base-100 rounded-lg overflow-hidden relative shadow-md border border-transparent hover:border-primary transition-all">
                                <img src={record.fileDataUrl} alt={record.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 text-white text-xs backdrop-blur-sm">
                                    <p className="font-semibold truncate">{record.title}</p>
                                    <p className="opacity-80">{new Date(record.recordDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
