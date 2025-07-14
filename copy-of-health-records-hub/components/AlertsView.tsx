
import React, { useState, useMemo } from 'react';
import { Alert } from '../types';
import { AlertTriangleIcon, BellIcon, XCircleIcon } from './Icons';

interface AlertsViewProps {
  alerts: Alert[];
  onDismiss: (alertId: string) => void;
  onNavigate: (link: Alert['linkTo']) => void;
}

const AlertRow: React.FC<{ alert: Alert, onDismiss: (id: string) => void, onNavigate: (link: any) => void }> = ({ alert, onDismiss, onNavigate }) => {
    const getLevelClasses = () => {
        switch (alert.level) {
            case 'Critical': return 'border-danger bg-red-50 text-danger-dark';
            case 'Warning': return 'border-accent bg-amber-50 text-amber-800';
            case 'Info': return 'border-primary bg-sky-50 text-primary-dark';
            default: return 'border-base-300 bg-base-100';
        }
    };
    
    const handleClick = () => {
        if(alert.linkTo) {
            onNavigate(alert.linkTo);
        }
    }

    return (
        <div className={`p-4 rounded-lg border-l-4 ${getLevelClasses()} flex items-start gap-4`}>
            <div className="flex-shrink-0 mt-1">
                <AlertTriangleIcon className="w-6 h-6" />
            </div>
            <div className={`flex-grow ${alert.linkTo ? 'cursor-pointer' : ''}`} onClick={handleClick}>
                <h4 className="font-bold">{alert.title}</h4>
                <p className="text-sm mt-1">{alert.message}</p>
                <p className="text-xs opacity-70 mt-2">{new Date(alert.date).toLocaleString()}</p>
            </div>
            {alert.status === 'new' && (
                 <button 
                    onClick={(e) => { e.stopPropagation(); onDismiss(alert.id); }} 
                    className="p-1 text-base-400 hover:text-danger rounded-full flex-shrink-0"
                    title="Dismiss alert"
                >
                    <XCircleIcon className="w-5 h-5" />
                </button>
            )}
        </div>
    );
};

export const AlertsView: React.FC<AlertsViewProps> = ({ alerts, onDismiss, onNavigate }) => {
    const [filter, setFilter] = useState<'new' | 'dismissed'>('new');

    const filteredAlerts = useMemo(() => {
        return alerts
            .filter(a => a.status === filter)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [alerts, filter]);
    
    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-base-200">
            <h2 className="text-2xl font-semibold mb-2 text-primary-dark flex items-center gap-2">
                <BellIcon className="w-7 h-7" />
                Alerts
            </h2>
            <p className="text-base-500 mb-6">Notifications about important changes in your health data.</p>
            
            <div className="border-b border-base-200 mb-6">
                <nav className="flex space-x-2">
                    <button 
                        onClick={() => setFilter('new')}
                        className={`py-2 px-4 font-medium text-sm rounded-t-lg transition-colors ${filter === 'new' ? 'border-b-2 border-primary text-primary bg-primary/10' : 'text-base-500 hover:text-base-700'}`}
                    >
                        New
                    </button>
                    <button 
                        onClick={() => setFilter('dismissed')}
                        className={`py-2 px-4 font-medium text-sm rounded-t-lg transition-colors ${filter === 'dismissed' ? 'border-b-2 border-primary text-primary bg-primary/10' : 'text-base-500 hover:text-base-700'}`}
                    >
                        Dismissed
                    </button>
                </nav>
            </div>
            
            <div className="space-y-4">
                {filteredAlerts.length > 0 ? (
                    filteredAlerts.map(alert => (
                        <AlertRow key={alert.id} alert={alert} onDismiss={onDismiss} onNavigate={onNavigate} />
                    ))
                ) : (
                    <div className="text-center py-12">
                        <p className="text-base-500">No {filter} alerts found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
