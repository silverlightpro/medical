
import React, { useMemo } from 'react';
import { HealthMetric, HealthIssue } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  metrics: HealthMetric[];
  issues: HealthIssue[];
  onMetricClick: (metricId: string) => void;
  onIssueClick: (issue: HealthIssue) => void;
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
    .map(m => ({ id: m.id, date: m.date, value: parseFloat(m.value.split('/')[0]) })) // Take first part of BP
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-30); // show last 30 points
};

const MetricCard: React.FC<{ title: string; metric: HealthMetric | null; defaultUnit: string, onMetricClick: (metricId: string) => void }> = ({ title, metric, defaultUnit, onMetricClick }) => (
  <div onClick={() => metric && onMetricClick(metric.id)} className={`bg-white p-4 rounded-lg shadow-md border border-base-200  flex flex-col justify-between h-full ${metric ? 'hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer' : 'cursor-default'}`}>
    <h3 className="text-sm font-medium text-base-500">{title}</h3>
    {metric ? (
      <div className="text-right">
        <p className="mt-1 text-3xl font-semibold text-base-800">{metric.value}</p>
        <p className="text-sm text-base-500">{metric.unit || defaultUnit}</p>
        <p className="text-xs text-base-400 mt-2">{new Date(metric.date).toLocaleDateString()}</p>
      </div>
    ) : (
      <div className="text-right">
        <p className="mt-1 text-3xl font-semibold text-base-300">-</p>
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


export const Dashboard: React.FC<DashboardProps> = ({ metrics, issues, onMetricClick, onIssueClick }) => {

  const KEY_METRICS_CONFIG = [
    { name: "Blood Pressure", unit: "mmHg" }, { name: "Heart Rate", unit: "bpm" },
    { name: "Oxygen Saturation", unit: "%" }, { name: "Respiratory Rate", unit: "breaths/min" },
    { name: "Body Temperature", unit: "°F" }, { name: "Pain Score", unit: "0-10" }
  ];

  const latestKeyMetrics = useMemo(() => {
    return KEY_METRICS_CONFIG
      .map(config => ({ ...config, metric: getLatestMetric(metrics, config.name) }));
  }, [metrics]);

  const chartData = useMemo(() => {
    const allMetricNames = [...new Set(metrics.filter(m => !m.category.startsWith("Lab Results")).map(m => m.name))];
    return allMetricNames
      .map(name => ({ name, history: getMetricHistory(metrics, name) }))
      .filter(chart => chart.history.length > 1)
      .sort((a,b) => b.history.length - a.history.length); // Show charts with more data first
  }, [metrics]);
  
  const activeIssues = useMemo(() => {
    return issues.filter(issue => issue.status === 'Active' || issue.status === 'Monitoring')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [issues]);

  return (
    <div className="space-y-8">
        <div>
            <h2 className="text-3xl font-bold text-base-900">Health Dashboard</h2>
            <p className="text-base-500 mt-1">Your health summary at a glance.</p>
        </div>

        {/* Key Vitals */}
        <div>
            <h3 className="text-xl font-semibold mb-4 text-primary-dark">Key Vitals</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {latestKeyMetrics.map(item => (
                    <MetricCard 
                        key={item.name}
                        title={item.name}
                        metric={item.metric}
                        defaultUnit={item.unit}
                        onMetricClick={onMetricClick}
                    />
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <h3 className="text-xl font-semibold text-primary-dark">Metric Trends</h3>
            {chartData.length > 0 ? (
                chartData.map((chart, index) => (
                    <TrendChart 
                        key={chart.name} 
                        title={chart.name} 
                        data={chart.history}
                        color={['#0284c7', '#0d9488', '#f59e0b', '#f97316', '#8b5cf6', '#ec4899'][index % 6]}
                        onMetricClick={onMetricClick}
                    />
                ))
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-md border border-base-200 text-center">
                <p className="text-base-500">Not enough data to display trends. Add at least two entries for a metric to see a chart.</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div>
                <h3 className="text-xl font-semibold mb-4 text-primary-dark">Active Issues & Diagnoses</h3>
                <div className="bg-white p-4 rounded-lg shadow-md border border-base-200">
                    {activeIssues.length > 0 ? (
                        <ul className="divide-y divide-base-200">
                            {activeIssues.map(issue => (
                                <li key={issue.id} className="py-3 px-2 -mx-2 rounded-md cursor-pointer hover:bg-base-100 transition-colors" onClick={() => onIssueClick(issue)}>
                                    <p className="font-semibold text-base-800">{issue.name}</p>
                                    <p className="text-xs text-base-500">
                                        Status: {issue.status}
                                        {issue.startDate && ` - Since: ${new Date(issue.startDate).toLocaleDateString()}`}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-base-500">No active issues being monitored.</p>
                        </div>
                    )}
                </div>
            </div>
          </div>
        </div>
    </div>
  )
};
