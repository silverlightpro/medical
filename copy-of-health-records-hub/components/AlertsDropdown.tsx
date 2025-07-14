
import React, { useState, useRef, useEffect } from 'react';
import { Alert } from '../types';
import { BellIcon, AlertTriangleIcon, XCircleIcon } from './Icons';

interface AlertsDropdownProps {
  alerts: Alert[];
  onDismiss: (alertId: string) => void;
  onNavigate: (link: Alert['linkTo']) => void;
  onViewAll: () => void;
}

const AlertItem: React.FC<{ alert: Alert, onDismiss: (id: string) => void, onNavigate: (link: any) => void }> = ({ alert, onDismiss, onNavigate }) => {
    const getLevelClasses = () => {
        switch (alert.level) {
            case 'Critical': return 'border-danger bg-red-50';
            case 'Warning': return 'border-accent bg-amber-50';
            case 'Info': return 'border-primary bg-sky-50';
            default: return 'border-base-300 bg-base-100';
        }
    };
    
    const handleClick = () => {
        if(alert.linkTo) {
            onNavigate(alert.linkTo);
        }
    }

    return (
        <div className={`p-3 rounded-md border-l-4 ${getLevelClasses()}`}>
            <div className="flex justify-between items-start">
                <div onClick={handleClick} className={`flex-grow ${alert.linkTo ? 'cursor-pointer' : ''}`}>
                    <div className="flex items-center gap-2">
                         <AlertTriangleIcon className={`w-4 h-4 ${alert.level === 'Critical' ? 'text-danger' : alert.level === 'Warning' ? 'text-accent' : 'text-primary'}`} />
                        <h4 className="font-semibold text-sm text-base-800">{alert.title}</h4>
                    </div>
                    <p className="text-xs text-base-600 mt-1">{alert.message}</p>
                    <p className="text-xs text-base-400 mt-2">{new Date(alert.date).toLocaleString()}</p>
                </div>
                <button 
                    onClick={(e) => { e.stopPropagation(); onDismiss(alert.id); }} 
                    className="p-1 text-base-400 hover:text-danger rounded-full flex-shrink-0"
                    title="Dismiss alert"
                >
                    <XCircleIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}


export const AlertsDropdown: React.FC<AlertsDropdownProps> = ({ alerts, onDismiss, onNavigate, onViewAll }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const newAlerts = alerts.filter(a => a.status === 'new').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 rounded-full hover:bg-base-100 transition-colors" title={`${newAlerts.length} new alerts`}>
        <BellIcon className="w-6 h-6 text-base-700" />
        {newAlerts.length > 0 && (
          <span className="absolute top-0 right-0 block h-2.5 w-2.5 transform -translate-y-1/2 translate-x-1/2 rounded-full bg-danger ring-2 ring-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-2xl border border-base-200 z-50">
          <div className="p-3 border-b border-base-200">
            <h3 className="font-semibold text-base text-base-800">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto p-3 space-y-3">
            {newAlerts.length > 0 ? (
                newAlerts.map(alert => <AlertItem key={alert.id} alert={alert} onDismiss={onDismiss} onNavigate={(link) => { onNavigate(link); setIsOpen(false); }} />)
            ) : (
                <p className="text-center text-sm text-base-500 py-4">No new notifications.</p>
            )}
          </div>
          <div className="p-2 border-t border-base-200 text-center">
            <button onClick={() => { onViewAll(); setIsOpen(false); }} className="text-sm font-medium text-primary hover:underline">
              View All Alerts
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
