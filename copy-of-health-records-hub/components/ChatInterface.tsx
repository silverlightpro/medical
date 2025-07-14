
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Chat } from '@google/genai';
import { SendIcon } from './Icons';
import { LoadingSpinner } from './LoadingSpinner';

interface ChatInterfaceProps {
    chat: Chat;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ chat }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        // A slight delay to allow the DOM to update before scrolling.
        setTimeout(scrollToBottom, 100);
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const stream = await chat.sendMessageStream({ message: input });
            
            let modelResponse = '';
            setMessages(prev => [...prev, { role: 'model', text: '' }]); // Add empty model message

            for await (const chunk of stream) {
                modelResponse += chunk.text;
                // Update the last message in the array with the new text
                setMessages(prev => prev.map((msg, index) => 
                    index === prev.length - 1 ? { ...msg, text: modelResponse } : msg
                ));
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md border border-base-200 flex flex-col h-[70vh] max-h-[800px]">
            <div className="p-4 border-b border-base-200">
                <h3 className="font-semibold text-base-800">Ask about this metric</h3>
                <p className="text-xs text-base-500">Your health history is provided as context.</p>
            </div>
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
                {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${message.role === 'user' ? 'bg-primary text-white' : 'bg-base-100 text-base-800'}`}>
                            <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                     <div className="flex justify-start">
                         <div className="max-w-[80%] p-3 rounded-lg bg-base-100 text-base-800">
                            <LoadingSpinner size="sm" color="text-base-500" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-base-200">
                <form onSubmit={handleSend} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your question..."
                        className="flex-grow w-full px-3 py-2 text-sm border-base-300 bg-white rounded-lg focus:ring-primary focus:border-primary transition-colors"
                        disabled={isLoading}
                        aria-label="Chat input"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="p-2 bg-primary hover:bg-primary-dark text-white rounded-full shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Send message"
                    >
                        <SendIcon className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};
