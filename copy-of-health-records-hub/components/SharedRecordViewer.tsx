
import React, { useState, useEffect, useRef } from 'react';
import { HealthDataService } from '../services/healthDataService';
import { MedicalRecord, ShareComment, SharedRecord, Patient } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { SendIcon } from './Icons';

interface SharedRecordViewerProps {
    accessKey: string;
}

export const SharedRecordViewer: React.FC<SharedRecordViewerProps> = ({ accessKey }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [record, setRecord] = useState<MedicalRecord | null>(null);
    const [patient, setPatient] = useState<Patient | null>(null);
    const [comments, setComments] = useState<ShareComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const commentsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadSharedData = () => {
            const sharedInfo = HealthDataService.getSharedRecordByKey(accessKey);
            if (!sharedInfo) {
                setError("This sharing link is invalid or has expired.");
                setIsLoading(false);
                return;
            }
            
            const fullRecord = HealthDataService.getRecordById(sharedInfo.recordId);
            const patientInfo = HealthDataService.getPatientById(sharedInfo.patientId);
            
            if (!fullRecord || !patientInfo) {
                setError("The requested record could not be found.");
                setIsLoading(false);
                return;
            }
            
            setRecord(fullRecord);
            setPatient(patientInfo);
            setComments(HealthDataService.getCommentsForSharedRecord(accessKey).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
            setIsLoading(false);
        };
        
        loadSharedData();
    }, [accessKey]);

    useEffect(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [comments]);
    
    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        const addedComment = HealthDataService.addShareComment({
            sharedRecordId: accessKey,
            author: 'recipient',
            text: newComment.trim(),
        });
        
        setComments(prev => [...prev, addedComment]);
        setNewComment('');
        setIsSubmitting(false);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-base-100">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-base-500">Loading shared record...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-base-100">
                <p className="text-red-600 text-lg font-semibold">{error}</p>
            </div>
        );
    }
    
    if (!record || !patient) return null;

    return (
        <div className="min-h-screen bg-base-100 flex flex-col md:flex-row">
            <main className="flex-grow bg-base-800 flex items-center justify-center p-4 md:w-2/3">
                 <img
                    src={record.fileDataUrl}
                    alt={record.title}
                    className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                />
            </main>
            <aside className="w-full md:w-1/3 bg-white flex flex-col h-screen">
                <div className="p-4 border-b border-base-200">
                    <h2 className="text-xl font-bold text-primary-dark">{record.title}</h2>
                    <p className="text-sm text-base-500">Patient: {patient.firstName} {patient.lastName}</p>
                    <p className="text-xs text-base-400">Record Date: {new Date(record.recordDate).toLocaleDateString()}</p>
                </div>
                <div className="flex-grow p-4 overflow-y-auto space-y-4">
                    {comments.map(comment => (
                        <div key={comment.id} className={`flex ${comment.author === 'recipient' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-3 rounded-lg ${comment.author === 'recipient' ? 'bg-secondary text-white' : 'bg-base-100 text-base-800'}`}>
                                <p className="text-sm whitespace-pre-wrap">{comment.text}</p>
                                <p className="text-xs opacity-70 mt-1 text-right">{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={commentsEndRef} />
                </div>
                <div className="p-4 border-t border-base-200">
                    <form onSubmit={handleCommentSubmit} className="flex items-center gap-2">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Type your response..."
                            rows={1}
                            className="flex-grow w-full px-3 py-2 text-sm border-base-300 bg-white rounded-lg focus:ring-primary focus:border-primary transition-colors resize-none"
                            disabled={isSubmitting}
                            aria-label="Comment input"
                        />
                        <button
                            type="submit"
                            disabled={isSubmitting || !newComment.trim()}
                            className="p-2 bg-primary hover:bg-primary-dark text-white rounded-full shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Send comment"
                        >
                           {isSubmitting ? <LoadingSpinner size="sm"/> : <SendIcon className="w-5 h-5" />}
                        </button>
                    </form>
                </div>
            </aside>
        </div>
    );
};
