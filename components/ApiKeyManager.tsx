import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PlayIcon, EyeIcon, EyeOffIcon, YouTubeIcon } from './icons';

interface ApiKeyManagerProps {
    apiKey1: string;
    setApiKey1: (key: string) => void;
    apiKey2: string;
    setApiKey2: (key: string) => void;
    youtubeApiKey: string;
    setYoutubeApiKey: (key: string) => void;
    defaultApiKeyIndex: 0 | 1 | null;
    setDefaultApiKeyIndex: (index: 0 | 1) => void;
    disabled: boolean;
}

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({
    apiKey1, setApiKey1, apiKey2, setApiKey2, youtubeApiKey, setYoutubeApiKey,
    defaultApiKeyIndex, setDefaultApiKeyIndex,
    disabled
}) => {
    const [showKey1, setShowKey1] = useState(false);
    const [showKey2, setShowKey2] = useState(false);
    const [showKey3, setShowKey3] = useState(false);

    const KeyInput: React.FC<{
        value: string;
        onChange: (val: string) => void;
        show: boolean;
        toggleShow: () => void;
        onActivate: () => void;
        isActive: boolean;
        placeholder: string;
    }> = ({ value, onChange, show, toggleShow, onActivate, isActive, placeholder }) => (
        <div className="flex items-center gap-2">
            <div className="relative flex-grow">
                <input
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="w-full p-2 bg-slate-900/70 border border-slate-700 rounded-lg shadow-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-slate-100 placeholder-slate-500 pr-10"
                />
                <button
                    type="button"
                    onClick={toggleShow}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
                    aria-label={show ? "Sembunyikan Kunci" : "Tampilkan Kunci"}
                >
                    {show ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
            </div>
            <motion.button
                type="button"
                onClick={onActivate}
                disabled={disabled || !value.trim()}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`flex-shrink-0 flex items-center justify-center w-9 h-9 border rounded-lg transition-colors glow-transition disabled:opacity-50 ${isActive ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 active-glow' : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-cyan-500'}`}
                title="Jadikan sebagai API Key Default"
            >
                <PlayIcon className={`w-5 h-5 transition-transform ${isActive ? 'translate-x-0.5' : ''}`} />
            </motion.button>
        </div>
    );

    return (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 space-y-3">
             <h3 className="text-sm font-semibold text-slate-300 -mb-1">Manajemen Kunci API</h3>
            <KeyInput
                value={apiKey1}
                onChange={setApiKey1}
                show={showKey1}
                toggleShow={() => setShowKey1(!showKey1)}
                onActivate={() => setDefaultApiKeyIndex(0)}
                isActive={defaultApiKeyIndex === 0}
                placeholder="Tempelkan Gemini API Key #1"
            />
            <KeyInput
                value={apiKey2}
                onChange={setApiKey2}
                show={showKey2}
                toggleShow={() => setShowKey2(!showKey2)}
                onActivate={() => setDefaultApiKeyIndex(1)}
                isActive={defaultApiKeyIndex === 1}
                placeholder="Tempelkan Gemini API Key #2"
            />
             <div className="flex items-center gap-2">
                <div className="relative flex-grow">
                    <input
                        type={showKey3 ? 'text' : 'password'}
                        value={youtubeApiKey}
                        onChange={(e) => setYoutubeApiKey(e.target.value)}
                        placeholder="Tempelkan YouTube Data API Key"
                        disabled={disabled}
                        className="w-full p-2 bg-slate-900/70 border border-slate-700 rounded-lg shadow-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-slate-100 placeholder-slate-500 pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowKey3(!showKey3)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
                        aria-label={showKey3 ? "Sembunyikan Kunci" : "Tampilkan Kunci"}
                    >
                        {showKey3 ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                </div>
                <div
                    className={`flex-shrink-0 flex items-center justify-center w-9 h-9 border rounded-lg bg-slate-800 border-slate-600 text-red-500`}
                    title="Kunci API YouTube"
                >
                    <YouTubeIcon className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
};