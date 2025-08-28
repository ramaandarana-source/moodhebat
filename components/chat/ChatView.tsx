import React, { useRef, useEffect, useState } from 'react';
import type { ChatMessage } from '../../types';
import { ChatMessageDisplay } from './ChatMessageDisplay';
import { MenuIcon, SendIcon } from '../icons';
import { motion } from 'framer-motion';

interface ChatViewProps {
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
    isLoading: boolean;
    onDeleteMessage: (messageId: string) => void;
    onToggleSidebar: () => void;
    onSelectForPreview: (url: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ messages, onSendMessage, isLoading, onDeleteMessage, onToggleSidebar, onSelectForPreview }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${scrollHeight}px`;
        }
    }, [input]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading || !input.trim()) return;

        onSendMessage(input);
        setInput('');
    };

    return (
        <div className="relative flex flex-col h-full w-full bg-slate-950">
            <div className="absolute top-3 left-3 z-10 lg:hidden">
                 <button onClick={onToggleSidebar} className="p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-full backdrop-blur-sm">
                    <MenuIcon className="w-6 h-6" />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 sm:p-4 min-h-0">
                <div className="max-w-4xl mx-auto w-full space-y-6 pt-16 lg:pt-4">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center pt-16">
                           <motion.div 
                             initial={{ scale: 0, rotate: -180 }}
                             animate={{ scale: 1, rotate: 0 }}
                             transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
                             className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center border-4 border-slate-700"
                           >
                            <span className="text-7xl">🤬</span>
                           </motion.div>
                           <motion.h1 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-4xl font-bold text-slate-200 mt-6"
                           >
                            Halo!
                           </motion.h1>
                           <motion.p 
                             initial={{ opacity: 0, y: 10 }}
                             animate={{ opacity: 1, y: 0 }}
                             transition={{ delay: 0.5 }}
                             className="text-lg mt-2"
                           >
                            Ada yang bisa saya bantu hari ini?
                           </motion.p>
                        </div>
                    ) : (
                        messages.map(msg => <ChatMessageDisplay key={msg.id} message={msg} onDelete={onDeleteMessage} onSelectForPreview={onSelectForPreview} />)
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            
            <div className="flex-shrink-0 w-full p-2 sm:p-4 bg-slate-950">
                <div className="w-full max-w-4xl mx-auto">
                    {isLoading && messages.length > 0 && (
                        <div className="text-sm text-cyan-400 font-mono flex items-center gap-2 mb-2 px-2">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                            AI sedang mengetik...
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="relative w-full">
                        <div className="flex items-end w-full bg-slate-800/50 rounded-xl p-2 border border-slate-700/80">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Tanyakan apa saja"
                                rows={1}
                                className="flex-1 w-full max-h-48 mx-1 p-2 bg-transparent border-none focus:ring-0 focus:outline-none text-slate-100 placeholder-slate-500 resize-none"
                                required
                                disabled={isLoading}
                            />
                            <motion.button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                className="flex-shrink-0 w-10 h-10 bg-cyan-600 rounded-full flex items-center justify-center text-white hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed ml-1"
                                aria-label="Kirim Pesan"
                            >
                                <SendIcon className="w-5 h-5" />
                            </motion.button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};