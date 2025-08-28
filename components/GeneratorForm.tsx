import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GenerationOptions, AspectRatio, Resolution } from '../types';
import { AspectRatioWideIcon, AspectRatioTallIcon, SoundOnIcon, SoundOffIcon, TrashIcon, XIcon, HistoryIcon } from './icons';
import { PromptInput } from './PromptInput';

interface GeneratorFormProps {
  onGenerate: (options: GenerationOptions) => void;
  disabled: boolean;
  prompt: string;
  onPromptChange: (newPrompt: string) => void;
  image: File | null;
  imagePreview: string | null;
  onImageChange: (file: File | null) => void;
  onSelectForPreview: (url: string) => void;
  promptHistory: string[];
  onSelectFromHistory: (prompt: string) => void;
  onDeleteHistoryItem: (index: number) => void;
  onClearHistory: () => void;
  isAutoGenerating: boolean;
  onFocusAutoGenerator?: () => void;
}

const SettingsButton: React.FC<{
    onClick: () => void;
    isActive: boolean;
    children: React.ReactNode;
    title: string;
    disabled: boolean;
}> = ({ onClick, isActive, children, title, disabled }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`flex-1 flex items-center justify-center p-2 rounded-md border transition-colors bg-transparent glow-transition ${
            isActive ? 'border-cyan-500 text-cyan-300 bg-cyan-500/10 active-glow' : 'border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-slate-500'
        }`}
    >
        {children}
    </button>
);

const HistoryPanel: React.FC<{
    history: string[];
    onSelect: (prompt: string) => void;
    onDelete: (index: number) => void;
    onClear: () => void;
    onClose: () => void;
}> = ({ history, onSelect, onDelete, onClear, onClose }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-20 rounded-2xl flex flex-col"
        >
            <div className="flex justify-between items-center p-4 border-b border-slate-700">
                <h3 className="font-semibold text-lg">Riwayat Prompt</h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700"><XIcon className="w-5 h-5"/></button>
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-2">
                {history.length === 0 ? (
                    <p className="text-slate-500 text-center">Tidak ada riwayat.</p>
                ) : (
                    history.map((item, index) => (
                        <div key={index} className="group flex items-center justify-between p-2 rounded-md hover:bg-slate-800">
                            <p onClick={() => onSelect(item)} className="text-sm cursor-pointer truncate flex-1">{item}</p>
                            <button onClick={() => onDelete(index)} className="ml-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>
            {history.length > 0 && (
                 <div className="p-4 border-t border-slate-700">
                    <button onClick={onClear} className="w-full text-center text-sm text-red-400 hover:text-red-300">Bersihkan Riwayat</button>
                </div>
            )}
        </motion.div>
    );
};


export const GeneratorForm: React.FC<GeneratorFormProps> = ({
  onGenerate, disabled, prompt, onPromptChange, image, imagePreview, onImageChange, onSelectForPreview,
  promptHistory, onSelectFromHistory, onDeleteHistoryItem, onClearHistory, isAutoGenerating, onFocusAutoGenerator
}) => {
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [sound, setSound] = useState<boolean>(true);
  const [resolution, setResolution] = useState<Resolution>('1080p');
  const [showHistory, setShowHistory] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (prompt.trim()) {
      onGenerate({ prompt, aspectRatio, sound, resolution, image });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
            <PromptInput
                value={prompt}
                onChange={onPromptChange}
                disabled={disabled}
                onSend={handleSubmit}
                isSending={disabled && !isAutoGenerating}
                onToggleHistory={() => setShowHistory(true)}
                onFocusAutoGenerator={onFocusAutoGenerator}
                imagePreview={imagePreview}
                onImageChange={onImageChange}
                onSelectForPreview={onSelectForPreview}
            />
            <AnimatePresence>
                {showHistory && (
                    <HistoryPanel
                        history={promptHistory}
                        onSelect={(p) => { onSelectFromHistory(p); setShowHistory(false); }}
                        onDelete={onDeleteHistoryItem}
                        onClear={() => { onClearHistory(); setShowHistory(false); }}
                        onClose={() => setShowHistory(false)}
                    />
                )}
            </AnimatePresence>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Aspek Rasio</label>
                <div className="flex gap-2">
                    <SettingsButton onClick={() => setAspectRatio('16:9')} isActive={aspectRatio === '16:9'} title="16:9 Wide" disabled={disabled}><AspectRatioWideIcon className="w-6 h-6"/></SettingsButton>
                    <SettingsButton onClick={() => setAspectRatio('9:16')} isActive={aspectRatio === '9:16'} title="9:16 Tall" disabled={disabled}><AspectRatioTallIcon className="w-6 h-6"/></SettingsButton>
                </div>
            </div>
            
            <div>
                 <label className="block text-sm font-medium text-slate-300 mb-2">Resolusi & Suara</label>
                <div className="flex gap-2">
                    <SettingsButton onClick={() => setSound(!sound)} isActive={sound} title={sound ? 'Suara Aktif' : 'Suara Mati'} disabled={disabled}>
                        {sound ? <SoundOnIcon className="w-6 h-6"/> : <SoundOffIcon className="w-6 h-6"/>}
                    </SettingsButton>
                    <SettingsButton onClick={() => setResolution('720p')} isActive={resolution === '720p'} title="720p" disabled={disabled}><span className="font-semibold">720p</span></SettingsButton>
                    <SettingsButton onClick={() => setResolution('1080p')} isActive={resolution === '1080p'} title="1080p" disabled={disabled}><span className="font-semibold">1080p</span></SettingsButton>
                </div>
            </div>
        </div>
    </form>
  );
};
