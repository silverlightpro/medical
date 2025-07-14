
import React, { useState } from 'react';
import { MedicalRecord } from '../types';
import { ShareIcon, XCircleIcon } from './Icons';
import { ShareModal } from './ShareModal';

interface ImageViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    record: MedicalRecord;
    patientId: string;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ isOpen, onClose, record, patientId }) => {
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="absolute top-4 right-4 flex gap-4">
                     <button 
                        onClick={() => setIsShareModalOpen(true)} 
                        className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors" 
                        title="Share Image"
                    >
                        <ShareIcon className="w-6 h-6" />
                    </button>
                    <button 
                        onClick={onClose} 
                        className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors" 
                        title="Close Viewer"
                    >
                        <XCircleIcon className="w-8 h-8" />
                    </button>
                </div>

                <div className="max-w-full max-h-full flex flex-col items-center">
                    <img
                        src={record.fileDataUrl}
                        alt={record.title}
                        className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                    />
                    <div className="mt-4 text-center text-white bg-black/50 p-2 rounded-md">
                        <h3 className="font-bold text-lg">{record.title}</h3>
                        <p className="text-sm">{new Date(record.recordDate).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>
            <ShareModal 
                isOpen={isShareModalOpen} 
                onClose={() => setIsShareModalOpen(false)}
                recordId={record.id}
                patientId={patientId}
            />
        </>
    );
};
