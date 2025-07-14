
import React, { useState } from 'react';
import { HealthDataService } from '../services/healthDataService';
import { LoadingSpinner } from './LoadingSpinner';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    recordId: string;
    patientId: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, recordId, patientId }) => {
    const [note, setNote] = useState('');
    const [recipientEmail, setRecipientEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState('');

    const handleGenerateLink = async () => {
        setIsLoading(true);
        setCopySuccess('');
        try {
            const sharedRecord = HealthDataService.addSharedRecord(recordId, patientId);
            
            if (note.trim()) {
                HealthDataService.addShareComment({
                    sharedRecordId: sharedRecord.accessKey,
                    author: 'sender',
                    text: note.trim()
                });
            }

            const url = `${window.location.origin}${window.location.pathname}?shareKey=${sharedRecord.accessKey}`;
            setGeneratedUrl(url);

        } catch (error) {
            console.error("Error generating share link", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const copyToClipboard = () => {
        if (!generatedUrl) return;
        navigator.clipboard.writeText(generatedUrl).then(() => {
            setCopySuccess('Copied!');
            setTimeout(() => setCopySuccess(''), 2000);
        }, (err) => {
            setCopySuccess('Failed to copy');
            console.error('Could not copy text: ', err);
        });
    };

    const handleClose = () => {
        setGeneratedUrl(null);
        setNote('');
        setRecipientEmail('');
        setIsLoading(false);
        setCopySuccess('');
        onClose();
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[60]">
            <div className="bg-base-50 p-6 rounded-lg shadow-xl w-full max-w-lg">
                <h2 className="text-2xl font-semibold mb-5 text-primary-dark">Share Imaging Record</h2>
                
                {!generatedUrl ? (
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="recipientEmail" className="block text-sm font-medium text-base-700">Recipient's Email (for your reference)</label>
                            <input
                                type="email"
                                id="recipientEmail"
                                value={recipientEmail}
                                onChange={e => setRecipientEmail(e.target.value)}
                                className="mt-1 block w-full bg-white border-base-300 rounded-md shadow-sm p-2"
                                placeholder="doctor@example.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="note" className="block text-sm font-medium text-base-700">Add a note (optional)</label>
                            <textarea
                                id="note"
                                rows={3}
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                className="mt-1 block w-full bg-white border-base-300 rounded-md shadow-sm p-2"
                                placeholder="e.g., 'Please take a look at this scan from my recent visit.'"
                            />
                        </div>
                        <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-base-200">
                            <button onClick={handleClose} className="px-4 py-2 text-sm font-medium text-base-700 bg-white hover:bg-base-100 rounded-md shadow-sm border border-base-300">
                                Cancel
                            </button>
                            <button
                                onClick={handleGenerateLink}
                                disabled={isLoading}
                                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md shadow-sm disabled:opacity-50"
                            >
                                {isLoading ? <LoadingSpinner size="sm" /> : 'Generate Share Link'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-base-700">A unique, private link has been generated. Share this link with the recipient.</p>
                        <div className="relative">
                            <input type="text" value={generatedUrl} readOnly className="w-full bg-base-100 border-base-300 rounded-md p-2 pr-20" />
                            <button onClick={copyToClipboard} className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-semibold text-white bg-secondary hover:bg-secondary-dark rounded-md">
                                {copySuccess || 'Copy'}
                            </button>
                        </div>
                        <p className="text-xs text-base-500">This link provides access only to this specific image and its comments. It does not grant access to any other part of the patient's record.</p>
                         <div className="mt-6 flex justify-end">
                            <button onClick={handleClose} className="px-4 py-2 text-sm font-medium text-base-700 bg-white hover:bg-base-100 rounded-md shadow-sm border border-base-300">
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
