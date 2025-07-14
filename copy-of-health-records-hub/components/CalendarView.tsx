
import React from 'react';
import { MedicalRecord, HealthMetric, CalendarDay } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface CalendarViewProps {
  date: Date;
  onDateChange: (newDate: Date) => void;
  onDayClick: (day: CalendarDay) => void;
  records: MedicalRecord[];
  metrics: HealthMetric[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ date, onDateChange, onDayClick, records, metrics }) => {
  const currentMonth = date.getMonth();
  const currentYear = date.getFullYear();

  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = () => new Date(currentYear, currentMonth, 1).getDay(); // 0 for Sunday, 1 for Monday, etc.

  const getCalendarDays = (): CalendarDay[] => {
    const days: CalendarDay[] = [];
    const numDays = daysInMonth(currentMonth, currentYear);
    const firstDay = firstDayOfMonth();
    const today = new Date();
    today.setHours(0,0,0,0); // Normalize today for comparison

    // Days from previous month
    const prevMonthDays = daysInMonth(currentMonth - 1, currentYear);
    for (let i = 0; i < firstDay; i++) {
      const dayDate = new Date(currentYear, currentMonth - 1, prevMonthDays - firstDay + 1 + i);
      const dateStr = dayDate.toISOString().split('T')[0];
      days.push({ 
        date: dayDate, 
        isCurrentMonth: false, 
        isToday: dayDate.getTime() === today.getTime(),
        records: records.filter(r => r.recordDate === dateStr),
        metrics: metrics.filter(v => v.date === dateStr)
      });
    }

    // Days of current month
    for (let i = 1; i <= numDays; i++) {
      const dayDate = new Date(currentYear, currentMonth, i);
      const dateStr = dayDate.toISOString().split('T')[0];
       days.push({ 
        date: dayDate, 
        isCurrentMonth: true, 
        isToday: dayDate.getTime() === today.getTime(),
        records: records.filter(r => r.recordDate === dateStr),
        metrics: metrics.filter(v => v.date === dateStr)
      });
    }

    // Days from next month
    const remainingCells = 7 - (days.length % 7);
    if (remainingCells < 7) { // Only add if not a full week already
        for (let i = 1; i <= remainingCells; i++) {
          const dayDate = new Date(currentYear, currentMonth + 1, i);
          const dateStr = dayDate.toISOString().split('T')[0];
          days.push({ 
            date: dayDate, 
            isCurrentMonth: false, 
            isToday: dayDate.getTime() === today.getTime(),
            records: records.filter(r => r.recordDate === dateStr),
            metrics: metrics.filter(v => v.date === dateStr)
          });
        }
    }
    return days;
  };

  const calendarDays = getCalendarDays();
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const prevMonth = () => {
    onDateChange(new Date(currentYear, currentMonth - 1, 1));
  };
  const nextMonth = () => {
    onDateChange(new Date(currentYear, currentMonth + 1, 1));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <button onClick={prevMonth} className="p-2 rounded-full hover:bg-base-100 transition-colors">
          <ChevronLeftIcon className="w-6 h-6 text-base-500" />
        </button>
        <h2 className="text-xl font-semibold text-primary-dark">
          {date.toLocaleString('default', { month: 'long' })} {currentYear}
        </h2>
        <button onClick={nextMonth} className="p-2 rounded-full hover:bg-base-100 transition-colors">
          <ChevronRightIcon className="w-6 h-6 text-base-500" />
        </button>
      </div>
      <div className="grid grid-cols-7 border-l border-t border-base-200">
        {weekdays.map(day => (
          <div key={day} className="py-2 text-center font-medium text-xs text-base-500 bg-base-100 border-r border-b border-base-200">{day}</div>
        ))}
        {calendarDays.map((day, index) => (
          <div
            key={index}
            onClick={() => onDayClick(day)}
            className={`p-2 h-24 sm:h-28 md:h-32 relative cursor-pointer transition-colors duration-150 border-r border-b border-base-200 group
              ${day.isCurrentMonth ? 'bg-white hover:bg-primary/5' : 'bg-base-100 text-base-400 hover:bg-base-200'}
              ${day.isToday ? 'bg-primary/10' : ''}
            `}
          >
            <span className={`text-xs sm:text-sm ${day.isToday ? 'font-bold text-primary': ''}`}>
              {day.date.getDate()}
            </span>
            <div className="absolute bottom-2 left-2 flex flex-col items-start space-y-1">
              {day.records.length > 0 && (
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-primary rounded-full" title={`${day.records.length} record(s)`}></span>
                </div>
              )}
              {day.metrics.length > 0 && (
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-rose-500 rounded-full" title={`${day.metrics.length} metric(s)`}></span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};