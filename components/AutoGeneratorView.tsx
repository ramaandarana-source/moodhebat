import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import Swal from 'sweetalert2';
import type { AutoGenerateOptions, MetadataSelection, Project, AutoGenPrompt } from '../types';
import { BotIcon, XIcon, PlusIcon, TrashIcon, CheckIcon, SaveIcon, DownloadIcon, UploadIcon, ImageIcon, TranslateIcon } from './icons';
import { translateAllPrompts } from '../services/geminiService';

type SaveStatus = 'idle' | 'saving' | 'saved';

const metadataFields: { key: keyof MetadataSelection; label: string }[] = [
    { key: 'youtubeTitle', label: 'Judul YouTube' },
    { key: 'tiktokTitle', label: 'Judul TikTok' },
    { key: 'instagramTitle', label: 'Judul Instagram' },
    { key: 'facebookTitle', label: 'Judul Facebook' },
    { key: 'shopeeAffiliateTitle', label: 'Shopee Aff.' },
    { key: 'tiktokAffiliateTitle', label: 'TikTok Aff.' },
    { key: 'tags', label: 'Hashtags' },
];

const ToggleButton = ({ active, onClick, children, disabled }: { active: boolean, onClick: () => void, children: React.ReactNode, disabled: boolean }) => (
    <motion.button
        type="button"
        onClick={onClick}
        disabled={disabled}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded-md transition-colors bg-transparent disabled:opacity-50 glow-transition ${active ? 'border-cyan-500 text-cyan-300 bg-cyan-500/10 active-glow' : 'border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-slate-500'}`}
    >
        {children}
    </motion.button>
);

const ImageUploaderForPrompt: React.FC<{
    prompt: AutoGenPrompt;
    onImageChange: (id: string, file: File | null) => void;
    disabled: boolean;
}> = ({ prompt, onImageChange, disabled }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onImageChange(prompt.id, file);
    };

    return (
        <div className="mt-2">
            {prompt.imagePreview ? (
                <div className="relative group w-24 h-24">
                    <img src={prompt.imagePreview} alt="Pratinjau" className="w-full h-full object-cover rounded-lg" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <button
                            type="button"
                            onClick={() => onImageChange(prompt.id, null)}
                            disabled={disabled}
                            className="p-1.5 bg-black/70 rounded-full text-white hover:bg-red-500 transition-colors"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <input
                        type="file"
                        accept="image/*"
                        ref={inputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={disabled}
                    />
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={disabled}
                        className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
                    >
                        <ImageIcon className="w-4 h-4" />
                        Gambar Referensi
                    </button>
                </>
            )}
        </div>
    );
};


interface AutoGeneratorViewProps {
    prompts: AutoGenPrompt[];
    setPrompts: React.Dispatch<React.SetStateAction<AutoGenPrompt[]>>;
    options: AutoGenerateOptions;
    setOptions: React.Dispatch<React.SetStateAction<AutoGenerateOptions>>;
    onStart: () => void;
    disabled: boolean;
    onClose: () => void;
    saveStatus: SaveStatus;
    projects: Project[];
    onSaveProject: (name: string) => void;
    onLoadProject: (id: string) => void;
    onDeleteProject: (id: string) => void;
    isInline?: boolean;
}

export const AutoGeneratorView: React.FC<AutoGeneratorViewProps> = ({ 
    prompts, setPrompts, options, setOptions, onStart, disabled, onClose, saveStatus,
    projects, onSaveProject, onLoadProject, onDeleteProject, isInline = false
}) => {
    const [lastAddedPromptId, setLastAddedPromptId] = useState<string | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    
    const handleOptionChange = <K extends keyof AutoGenerateOptions>(key: K, value: AutoGenerateOptions[K]) => {
        setOptions(prev => ({ ...prev, [key]: value }));
    };

    const handleMetadataSelectionChange = (key: keyof MetadataSelection) => {
        setOptions(prev => ({
            ...prev,
            metadataSelection: {
                ...prev.metadataSelection,
                [key]: !prev.metadataSelection[key],
            }
        }));
    };

    const addPrompt = () => {
        const newId = uuidv4();
        setPrompts(prev => [...prev, { id: newId, text: '', status: 'pending' }]);
        setLastAddedPromptId(newId);
    };

    const removePrompt = (id: string) => setPrompts(prompts.filter(p => p.id !== id));
    
    const updatePromptText = (id: string, text: string) => {
        setPrompts(prompts.map(p => p.id === id ? { ...p, text, status: 'pending' } : p));
    };

    const handleImageChangeForPrompt = (id: string, file: File | null) => {
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const previewUrl = reader.result as string;
                setPrompts(prompts.map(p => p.id === id ? { ...p, image: file, imagePreview: previewUrl, status: 'pending' } : p));
            };
            reader.readAsDataURL(file);
        } else {
            setPrompts(prompts.map(p => p.id === id ? { ...p, image: undefined, imagePreview: undefined, status: 'pending' } : p));
        }
    };
    
    const handleStart = () => {
        const validPrompts = prompts.filter(p => p.text.trim());
        if (validPrompts.length > 0) {
            onStart();
        }
    };

    const handleSaveProjectClick = () => {
        Swal.fire({
            title: 'Masukkan Nama Proyek',
            input: 'text',
            inputPlaceholder: 'Konten Afiliasi Minggu Ini...',
            showCancelButton: true,
            confirmButtonText: 'Simpan Proyek',
            cancelButtonText: 'Batal',
            customClass: {
                popup: 'bg-slate-900 border border-cyan-500/20 rounded-xl panel-glow',
                title: 'text-slate-200',
                input: 'w-[90%] mx-auto bg-slate-800 border border-slate-600 text-slate-100 rounded-lg focus:ring-cyan-500 focus:border-cyan-500',
                confirmButton: 'bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded',
                cancelButton: 'bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded',
            },
            buttonsStyling: false,
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                onSaveProject(result.value);
            }
        });
    };
    
    const handleExport = () => {
        const textToExport = prompts
            .map(p => p.text.trim())
            .filter(Boolean)
            .join('\n\n');
    
        if (!textToExport) {
            Swal.fire({
                title: 'Tidak Ada Prompt',
                text: 'Tidak ada prompt untuk diekspor.',
                icon: 'info',
                customClass: { popup: 'bg-slate-900 border border-cyan-500/20 rounded-xl panel-glow' }
            });
            return;
        }
    
        const blob = new Blob([textToExport], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'prompt-list.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt,text/plain';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
    
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                const importedPrompts = text
                    .split(/\n\s*\n/) // Split by one or more blank lines
                    .map(p => p.trim())
                    .filter(Boolean)
                    .map(p => ({ id: uuidv4(), text: p, status: 'pending' as const }));
    
                if (importedPrompts.length > 0) {
                    Swal.fire({
                        title: 'Impor Prompt',
                        text: `Menemukan ${importedPrompts.length} prompt. Ini akan menggantikan daftar Anda saat ini. Lanjutkan?`,
                        icon: 'question',
                        showCancelButton: true,
                        confirmButtonText: 'Ya, Ganti Daftar',
                        cancelButtonText: 'Batal',
                        customClass: {
                           popup: 'bg-slate-900 border border-cyan-500/20 rounded-xl panel-glow',
                           confirmButton: 'bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded',
                           cancelButton: 'bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded',
                        },
                         buttonsStyling: false,
                    }).then((result) => {
                        if (result.isConfirmed) {
                            setPrompts(importedPrompts);
                             Swal.fire({
                                title:'Berhasil!',
                                text:'Daftar prompt telah diimpor.',
                                icon:'success',
                                customClass: { popup: 'bg-slate-900 border border-cyan-500/20 rounded-xl panel-glow' }
                            });
                        }
                    });
                } else {
                    Swal.fire({
                       title:'Tidak Ada Prompt',
                       text:'File yang dipilih tidak berisi prompt yang valid.',
                       icon:'warning',
                       customClass: { popup: 'bg-slate-900 border border-cyan-500/20 rounded-xl panel-glow' }
                    });
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };
    
    const handleTranslateAll = async () => {
        const promptsToTranslate = prompts.map(p => p.text.trim()).filter(Boolean);
        if (promptsToTranslate.length === 0) {
            Swal.fire('Tidak Ada Prompt', 'Tidak ada prompt untuk diterjemahkan.', 'info');
            return;
        }
    
        setIsTranslating(true);
        try {
            const translatedTexts = await translateAllPrompts(promptsToTranslate);
            let translatedIndex = 0;
            const newPrompts = prompts.map(p => {
                if (p.text.trim() && translatedIndex < translatedTexts.length) {
                    return { ...p, text: translatedTexts[translatedIndex++] };
                }
                return p;
            });
            setPrompts(newPrompts);
            Swal.fire({
                title: 'Berhasil!',
                text: 'Semua prompt telah diterjemahkan ke Bahasa Inggris.',
                icon: 'success',
                customClass: { popup: 'bg-slate-900 border border-cyan-500/20 rounded-xl panel-glow' }
            });
        } catch (err) {
            console.error("Translation error:", err);
            let message = "Terjadi kesalahan yang tidak diketahui.";
            if (err instanceof Error) {
                 if (err.message.includes("API key not valid") || err.message.includes("quota")) {
                    message = "Kunci API Anda telah mencapai batasnya.";
                } else {
                     message = err.message;
                }
            }
            Swal.fire({
                title: 'Gagal',
                text: message,
                icon: 'error',
                customClass: { popup: 'bg-slate-900 border border-cyan-500/20 rounded-xl panel-glow' }
            });
        } finally {
            setIsTranslating(false);
        }
    };

    const PanelContent = (
         <div className={`bg-gray-900/80 backdrop-blur-md h-full flex flex-col ${isInline ? 'border border-cyan-500/20 rounded-xl panel-glow' : 'border-r-2 border-cyan-500/50'}`}>
            {/* Header */}
            <div className="p-6 flex justify-between items-center border-b border-slate-800 flex-shrink-0 pt-8 pb-4">
                <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold text-slate-200 flex items-center gap-3">
                        <BotIcon className="w-7 h-7"/>Auto-Generate
                    </h3>
                    <AnimatePresence>
                        {saveStatus === 'saved' && (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="flex items-center gap-1 text-sm text-green-400 font-mono"
                            >
                                <CheckIcon className="w-4 h-4" />
                                <span>Disimpan</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                {!isInline && <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-200" aria-label="Tutup"><XIcon className="w-6 h-6" /></button>}
            </div>

            {/* Main Content Area */}
            <div className="flex-grow flex flex-col min-h-0">
                {/* Scrollable Content */}
                <div className="flex-grow overflow-y-auto p-6 space-y-8">
                    {/* Projects */}
                    <section>
                        <h4 className="text-lg text-slate-300 mb-4 font-semibold">Proyek</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {projects.length === 0 ? (
                                <p className="text-slate-500 text-sm text-center">Belum ada proyek.</p>
                            ) : (
                                projects.map(proj => (
                                    <div key={proj.id} className="group flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors">
                                        <button type="button" onClick={() => onLoadProject(proj.id)} disabled={disabled} className="text-left text-base text-slate-300 truncate flex-1 disabled:cursor-not-allowed">
                                            {proj.name}
                                        </button>
                                        <button type="button" onClick={() => onDeleteProject(proj.id)} disabled={disabled} className="ml-4 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed flex-shrink-0">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                    
                    {/* Prompts */}
                    <section>
                         <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg text-slate-300 font-semibold">Daftar Prompt</h4>
                            <button onClick={handleTranslateAll} disabled={disabled || isTranslating} title="Terjemahkan Semua Prompt ke Bahasa Inggris" className="p-2 text-slate-400 hover:text-cyan-300 disabled:opacity-50">
                                {isTranslating ? <div className="w-5 h-5 border-2 border-slate-400 border-t-cyan-400 rounded-full animate-spin"></div> : <TranslateIcon className="w-5 h-5"/>}
                            </button>
                        </div>
                        <div className="space-y-4">
                            {prompts.map((item, index) => (
                                <div key={item.id} className="flex items-start gap-3">
                                    <span className="font-mono text-slate-400 pt-3">{index + 1}.</span>
                                    <div className="relative w-full">
                                        <textarea
                                            ref={el => {
                                                if (item.id === lastAddedPromptId && el) {
                                                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                    el.focus();
                                                    setLastAddedPromptId(null);
                                                }
                                            }}
                                            value={item.text}
                                            onChange={(e) => updatePromptText(item.id, e.target.value)}
                                            placeholder="Tulis prompt di sini..."
                                            disabled={disabled}
                                            rows={3}
                                            className="w-full p-3 pr-12 bg-slate-800/50 border border-slate-700 rounded-lg shadow-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-base text-slate-100 placeholder-slate-500 resize-y" />
                                        <button type="button" onClick={() => removePrompt(item.id)} disabled={disabled} className="absolute top-3 right-3 p-1 disabled:cursor-not-allowed">
                                            <TrashIcon className={`w-5 h-5 transition-colors ${item.status === 'completed' ? 'text-green-500' : 'text-slate-500 hover:text-red-400'}`} />
                                        </button>
                                        <ImageUploaderForPrompt
                                            prompt={item}
                                            onImageChange={handleImageChangeForPrompt}
                                            disabled={disabled}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Options */}
                    <section>
                        <h4 className="text-lg text-slate-300 mb-4 font-semibold">Opsi</h4>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Tipe Unduhan</label>
                                <div className="flex gap-2">
                                    <ToggleButton active={options.downloadType === 'zip'} onClick={() => handleOptionChange('downloadType', 'zip')} disabled={disabled}>.zip</ToggleButton>
                                    <ToggleButton active={options.downloadType === 'mp4'} onClick={() => handleOptionChange('downloadType', 'mp4')} disabled={disabled}>.mp4</ToggleButton>
                                </div>
                            </div>
                            
                            {options.downloadType === 'zip' && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Sertakan Metadata</label>
                                    <div className="space-y-2">
                                        {metadataFields.map(field => (
                                            <label key={field.key} className="flex items-center gap-3 cursor-pointer text-slate-300">
                                                <input type="checkbox" checked={!!options.metadataSelection[field.key]} onChange={() => handleMetadataSelectionChange(field.key)} disabled={disabled} className="w-4 h-4 bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-600 focus:ring-2 rounded" />
                                                <span>{field.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Footer with Actions */}
                <div className="p-6 mt-auto border-t border-slate-800 flex-shrink-0 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                         <button type="button" onClick={handleImport} disabled={disabled} className="w-full justify-center flex items-center gap-2 text-sm bg-transparent border border-cyan-800 text-cyan-400 px-4 py-2 rounded-lg hover:bg-cyan-500/10 disabled:opacity-50">
                            <UploadIcon className="w-5 h-5"/>Impor Teks
                        </button>
                         <button type="button" onClick={handleExport} disabled={disabled} className="w-full justify-center flex items-center gap-2 text-sm bg-transparent border border-cyan-800 text-cyan-400 px-4 py-2 rounded-lg hover:bg-cyan-500/10 disabled:opacity-50">
                            <DownloadIcon className="w-5 h-5"/>Ekspor Teks
                        </button>
                    </div>
                     <button type="button" onClick={addPrompt} disabled={disabled} className="w-full text-center justify-center flex items-center gap-2 text-sm bg-cyan-500/20 text-cyan-300 px-4 py-2 rounded-lg hover:bg-cyan-500/40 disabled:opacity-50">
                        <PlusIcon className="w-5 h-5"/>Tambah Prompt
                    </button>
                    <button
                        type="button"
                        onClick={handleSaveProjectClick}
                        disabled={disabled || prompts.length === 0}
                        className="w-full text-center justify-center flex items-center gap-2 text-sm bg-transparent border border-cyan-500 text-cyan-300 px-4 py-2 rounded-lg hover:bg-cyan-500/20 disabled:opacity-50"
                    >
                        <SaveIcon className="w-5 h-5" />Simpan Proyek
                    </button>
                    <motion.button onClick={handleStart} disabled={disabled || prompts.every(p => !p.text.trim())}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full relative inline-flex justify-center items-center px-4 py-2 text-sm font-bold rounded-lg shadow-lg border-2 border-transparent bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-100 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed action-glow glow-transition"
                    >
                        Mulai ({prompts.filter(p => p.text.trim()).length} Video)
                    </motion.button>
                </div>
            </div>
        </div>
    );

    if (isInline) {
        return <div className="h-full">{PanelContent}</div>
    }

    return (
        <motion.div 
            className="fixed top-0 left-0 h-full w-full max-w-md z-[60]"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            onClick={(e) => e.stopPropagation()}
        >
            {PanelContent}
        </motion.div>
    );
};