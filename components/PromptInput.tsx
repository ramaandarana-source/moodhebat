import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { enhancePrompt, translatePrompt } from '../services/geminiService';
import { EnhanceIcon, TranslateIcon, SendIcon, MicrophoneIcon, HistoryIcon, BotIcon, ImageIcon, XIcon } from './icons';

// Types for Web Speech API
interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
}

type SpeechRecognitionErrorCode =
  | 'no-speech'
  | 'aborted'
  | 'audio-capture'
  | 'network'
  | 'not-allowed'
  | 'service-not-allowed'
  | 'bad-grammar'
  | 'language-not-supported';
  
interface SpeechRecognitionErrorEvent extends Event {
    readonly error: SpeechRecognitionErrorCode;
    readonly message: string;
}

interface SpeechRecognition extends EventTarget {
    grammars: any;
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    serviceURI: string;

    start(): void;
    stop(): void;
    abort(): void;

    onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}


declare global {
    interface Window {
        SpeechRecognition: { new(): SpeechRecognition; };
        webkitSpeechRecognition: { new(): SpeechRecognition; };
    }
}

interface PromptInputProps {
    value: string;
    onChange: (newValue: string | ((prev: string) => string)) => void;
    disabled: boolean;
    onSend: () => void;
    isSending?: boolean;
    onToggleHistory?: () => void;
    onFocusAutoGenerator?: () => void;
    imagePreview?: string | null;
    onImageChange?: (file: File | null) => void;
    onSelectForPreview?: (url: string) => void;
    placeholder?: string;
    heightClassName?: string;
}

const PromptIconButton: React.FC<{
    onClick: () => void;
    isLoading: boolean;
    disabled: boolean;
    title: string;
    children: React.ReactNode;
    className?: string;
}> = ({ onClick, isLoading, disabled, title, children, className = '' }) => (
    <motion.button
        type="button"
        onClick={onClick}
        disabled={disabled || isLoading}
        whileTap={{ scale: 0.9 }}
        title={title}
        className={`flex items-center justify-center p-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-slate-400 hover:bg-slate-700/50 hover:text-cyan-400 ${className}`}
    >
        <AnimatePresence mode="wait" initial={false}>
            {isLoading ? (
                <motion.div
                    key="loading"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                >
                    <div className="w-5 h-5 flex items-center justify-center">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    key="icon"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="flex items-center"
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    </motion.button>
);


export const PromptInput: React.FC<PromptInputProps> = ({
    value,
    onChange,
    disabled,
    onSend,
    isSending,
    onToggleHistory,
    onFocusAutoGenerator,
    imagePreview,
    onImageChange,
    onSelectForPreview,
    placeholder = "Jelaskan video Anda",
    heightClassName = "h-56",
}) => {
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const finalTranscriptRef = useRef<string>('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const cleanup = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.onresult = null;
            recognitionRef.current.onerror = null;
            recognitionRef.current.onend = null;
            recognitionRef.current.abort();
            recognitionRef.current = null;
        }
        setIsRecording(false);
    }, []);
    
    useEffect(() => {
        return () => cleanup();
    }, [cleanup]);
    
    const handleVoiceInput = () => {
        if (isRecording) {
            recognitionRef.current?.stop();
        } else {
            const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognitionAPI) {
                setError("Pengenalan suara tidak didukung oleh browser ini.");
                return;
            }

            navigator.mediaDevices.getUserMedia({ audio: true })
              .then(() => {
                  setIsRecording(true);
                  setError(null);
                  finalTranscriptRef.current = '';

                  recognitionRef.current = new SpeechRecognitionAPI();
                  const recognition = recognitionRef.current;
                  recognition.lang = 'id-ID';
                  recognition.interimResults = false;
                  recognition.continuous = true;

                  recognition.onresult = (event: SpeechRecognitionEvent) => {
                      let transcript = '';
                      for (let i = event.resultIndex; i < event.results.length; ++i) {
                          transcript += event.results[i][0].transcript + ' ';
                      }
                      finalTranscriptRef.current += transcript;
                  };

                  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
                      console.error("Kesalahan pengenalan suara:", event.error, event.message);
                      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') setError("Akses mikrofon ditolak.");
                      else if (event.error !== 'aborted') setError("Terjadi kesalahan perekaman.");
                      cleanup();
                  };

                  recognition.onend = () => {
                      const newTranscript = finalTranscriptRef.current.trim();
                      if (newTranscript) {
                          onChange(prev => (prev ? `${prev.trim()} ${newTranscript}` : newTranscript).trim());
                      }
                      cleanup();
                  };
                  
                  recognition.start();
              })
              .catch(err => {
                  console.error("Gagal mendapatkan media:", err);
                  setError("Akses mikrofon tidak diizinkan.");
                  cleanup();
              });
        }
    };

    const handleEnhance = async () => {
        if (!value.trim()) {
            return;
        }
        setIsEnhancing(true);
        setError(null);
        try {
            const enhanced = await enhancePrompt(value);
            onChange(enhanced);
        } catch (err) {
            console.error("Gagal meningkatkan prompt:", err);
            setError("Gagal meningkatkan prompt.");
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleTranslate = async () => {
        if (!value.trim()) {
           return;
        }
        setIsTranslating(true);
        setError(null);
        try {
            const translated = await translatePrompt(value);
            onChange(translated);
        } catch (err) {
            console.error("Gagal menerjemahkan prompt:", err);
            setError("Gagal menerjemahkan prompt.");
        } finally {
            setIsTranslating(false);
        }
    };

    const processFile = useCallback((file: File | null) => {
        if (file && file.type.startsWith('image/')) {
            if (onImageChange) onImageChange(file);
        } else if (file === null) {
            if (onImageChange) onImageChange(null);
        }
    }, [onImageChange]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        processFile(e.currentTarget.files?.[0] ?? null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
    };
    
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled) return;
        const file = e.dataTransfer.files?.[0] ?? null;
        processFile(file);
    };

    useEffect(() => {
        const handleGlobalPaste = (e: ClipboardEvent) => {
          if (disabled || imagePreview || !onImageChange) return;
          const file = Array.from(e.clipboardData?.items ?? []).find(item => item.type.startsWith('image/'))?.getAsFile();
          if (file) {
            e.preventDefault();
            processFile(file);
          }
        };
        document.addEventListener('paste', handleGlobalPaste);
        return () => document.removeEventListener('paste', handleGlobalPaste);
    }, [disabled, imagePreview, processFile, onImageChange]);
    
    const removeImage = () => {
        if (onImageChange) onImageChange(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
    }
    
    return (
        <div className="w-full">
            <div 
                className={`w-full bg-slate-800/50 border border-slate-700 rounded-2xl shadow-lg transition-colors focus-within:border-cyan-500 flex flex-col ${isDragging ? 'border-cyan-500' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input type="file" accept="image/*" onChange={handleImageChange} ref={fileInputRef} className="hidden" disabled={disabled} />

                {/* Top section with textarea and image */}
                <div className={`flex items-start p-4 flex-grow ${heightClassName}`}>
                    {/* Image Upload/Preview Area */}
                    {onImageChange && onSelectForPreview && (
                        <div className="flex-shrink-0 mr-4">
                            <AnimatePresence>
                                {imagePreview ? (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="relative group w-20 h-20"
                                    >
                                        <img src={imagePreview} alt="Pratinjau referensi" onClick={() => onSelectForPreview(imagePreview)} className="w-full h-full object-cover rounded-lg cursor-pointer shadow-md" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                            <button type="button" onClick={removeImage} className="p-1.5 bg-black/70 rounded-full text-white hover:bg-red-500 transition-colors" aria-label="Hapus Gambar">
                                                <XIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.button 
                                        type="button" 
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={disabled}
                                        className="w-20 h-20 border-2 border-dashed border-slate-600 rounded-lg flex flex-col items-center justify-center text-slate-500 hover:border-cyan-500 hover:text-cyan-400 transition-colors disabled:opacity-50"
                                    >
                                        <ImageIcon className="w-5 h-5 mb-1" />
                                        <span className="text-xs font-semibold">Tambahkan foto</span>
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                    
                    {/* Textarea */}
                    <textarea
                        id="prompt-input"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className={`w-full h-full bg-transparent border-none focus:ring-0 focus:outline-none text-slate-100 placeholder-slate-500 resize-none text-base`}
                        required
                        disabled={disabled}
                    />
                </div>

                {/* Toolbar */}
                <div className="flex-shrink-0 px-4 pb-3 flex justify-between items-center">
                    {/* Left Icons */}
                    <div className="flex items-center gap-1 bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-1">
                        <PromptIconButton onClick={handleEnhance} isLoading={isEnhancing} disabled={disabled || !value.trim()} title="Tingkatkan Prompt"><EnhanceIcon className="w-5 h-5" /></PromptIconButton>
                        <PromptIconButton onClick={handleTranslate} isLoading={isTranslating} disabled={disabled || !value.trim()} title="Terjemahkan Prompt"><TranslateIcon className="w-5 h-5" /></PromptIconButton>
                        {onToggleHistory && <PromptIconButton onClick={onToggleHistory} isLoading={false} disabled={disabled} title="Riwayat Prompt"><HistoryIcon className="w-5 h-5" /></PromptIconButton>}
                        {onFocusAutoGenerator && <div><PromptIconButton onClick={onFocusAutoGenerator} isLoading={false} disabled={disabled} title="Buka Auto-Generate"><BotIcon className="w-5 h-5" /></PromptIconButton></div>}
                    </div>
                    {/* Right Icons */}
                    <div className="flex items-center gap-2">
                        <PromptIconButton onClick={handleVoiceInput} isLoading={false} disabled={disabled} title={isRecording ? "Hentikan Perekaman" : "Mulai Perekaman"} className={`bg-slate-900/50 border border-slate-700/50 rounded-full !p-3 ${isRecording ? '!bg-red-600/80 !text-white' : ''}`}>
                            <MicrophoneIcon className="w-5 h-5" />
                        </PromptIconButton>
                        {onSend && 
                            <motion.button 
                                type="submit"
                                onClick={onSend}
                                disabled={disabled || isSending || !value.trim()}
                                whileTap={{ scale: 0.95 }}
                                className="w-12 h-12 flex items-center justify-center bg-cyan-500 rounded-full text-white hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-400 disabled:opacity-50 transition-all"
                                aria-label="Buat Video"
                            >
                                {isSending ? <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : <SendIcon className="w-6 h-6" />}
                            </motion.button>
                        }
                    </div>
                </div>
            </div>
            {error && <p className="mt-1 text-xs text-red-400 font-mono text-right">{error}</p>}
        </div>
    );
};