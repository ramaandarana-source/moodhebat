import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AutoGenResultItem } from '../../types';
import { YouTubeIcon, CopyIcon, CheckIcon, DownloadIcon } from '../icons';

interface YouTubeUploadViewProps {
    videos: AutoGenResultItem[];
}

const copyToClipboard = async (text: string) => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        return false;
    }
};

const CopyButton: React.FC<{ onCopy: () => void; isCopied: boolean; }> = ({ onCopy, isCopied }) => {
    return (
        <button
            onClick={onCopy}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-300"
        >
            <AnimatePresence mode="wait" initial={false}>
                {isCopied ? (
                    <motion.span key="check" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1 text-green-400">
                        <CheckIcon className="w-3 h-3" /> Tersalin
                    </motion.span>
                ) : (
                    <motion.span key="copy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1">
                        <CopyIcon className="w-3 h-3" /> Salin
                    </motion.span>
                )}
            </AnimatePresence>
        </button>
    );
};

export const YouTubeUploadView: React.FC<YouTubeUploadViewProps> = ({ videos }) => {
    const [selectedVideo, setSelectedVideo] = useState<AutoGenResultItem | null>(null);
    const [editedTitle, setEditedTitle] = useState('');
    const [editedDescription, setEditedDescription] = useState('');
    const [editedTags, setEditedTags] = useState('');

    const [copiedStates, setCopiedStates] = useState({ title: false, description: false, tags: false });

    useEffect(() => {
        if (selectedVideo) {
            setEditedTitle(selectedVideo.metadata.youtubeTitle);
            
            const descriptionParts = [
                selectedVideo.metadata.shopeeAffiliateTitle,
                selectedVideo.metadata.tiktokAffiliateTitle,
                selectedVideo.metadata.instagramTitle,
                selectedVideo.metadata.facebookTitle,
            ].filter(Boolean);
            setEditedDescription(descriptionParts.join('\n\n'));

            setEditedTags(selectedVideo.metadata.tags.join(', '));
        }
    }, [selectedVideo]);

    const handleCopyToClipboard = (field: 'title' | 'description' | 'tags') => {
        let textToCopy = '';
        if (field === 'title') textToCopy = editedTitle;
        else if (field === 'description') textToCopy = editedDescription;
        else if (field === 'tags') textToCopy = editedTags;
        
        copyToClipboard(textToCopy);
        setCopiedStates(prev => ({ ...prev, [field]: true }));
        setTimeout(() => setCopiedStates(prev => ({ ...prev, [field]: false })), 2000);
    };

    const handleCopyAllAndOpen = () => {
        const fullText = `Title:\n${editedTitle}\n\nDescription:\n${editedDescription}\n\nTags:\n${editedTags}`;
        copyToClipboard(fullText);
        window.open('https://studio.youtube.com/upload', '_blank');
    };

    const commonInputClasses = "w-full p-3 bg-gray-900/70 border border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-slate-100 placeholder-slate-500";

    return (
        <div className="bg-gray-900/50 backdrop-blur-md border border-cyan-500/20 rounded-xl panel-glow p-6 lg:p-8">
            <h2 className="text-xl font-semibold mb-6 border-b border-cyan-500/20 pb-4 text-slate-200 flex items-center gap-3">
                <YouTubeIcon className="w-7 h-7" /> Asisten Unggah YouTube
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Video Library */}
                <div className="lg:col-span-1">
                    <h3 className="text-lg font-semibold text-slate-300 mb-4">Galeri Video</h3>
                    <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                        {videos.length === 0 ? (
                             <p className="text-slate-500 text-center">Belum ada video yang dibuat. Buat video di tab 'AI Video'.</p>
                        ) : (
                            videos.map(video => (
                                <div
                                    key={video.id}
                                    onClick={() => setSelectedVideo(video)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedVideo?.id === video.id ? 'bg-cyan-900/50 border-cyan-500' : 'bg-slate-800/50 border-slate-700 hover:border-cyan-700'}`}
                                >
                                    <video src={video.result.url} className="w-full h-24 object-cover rounded-md bg-black" preload="metadata" muted />
                                    <p className="text-sm text-slate-200 mt-2 line-clamp-2">{video.prompt}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Upload Assistant */}
                <div className="lg:col-span-2">
                     <AnimatePresence mode="wait">
                        {selectedVideo ? (
                            <motion.div key={selectedVideo.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <div className="aspect-video bg-black rounded-lg overflow-hidden relative group">
                                    <video src={selectedVideo.result.url} controls className="w-full h-full" />
                                    <a href={selectedVideo.result.url} download={`${selectedVideo.metadata.youtubeTitle}.mp4`} className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-cyan-500" title="Unduh Video">
                                        <DownloadIcon className="w-5 h-5"/>
                                    </a>
                                </div>
                                
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-medium text-slate-300">Judul</label>
                                        <CopyButton onCopy={() => handleCopyToClipboard('title')} isCopied={copiedStates.title} />
                                    </div>
                                    <input type="text" value={editedTitle} onChange={e => setEditedTitle(e.target.value)} className={commonInputClasses} />
                                </div>

                                <div>
                                     <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-medium text-slate-300">Deskripsi</label>
                                        <CopyButton onCopy={() => handleCopyToClipboard('description')} isCopied={copiedStates.description} />
                                    </div>
                                    <textarea value={editedDescription} onChange={e => setEditedDescription(e.target.value)} rows={6} className={commonInputClasses}></textarea>
                                </div>

                                <div>
                                     <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-medium text-slate-300">Tags</label>
                                        <CopyButton onCopy={() => handleCopyToClipboard('tags')} isCopied={copiedStates.tags} />
                                    </div>
                                    <input type="text" value={editedTags} onChange={e => setEditedTags(e.target.value)} className={commonInputClasses} />
                                </div>
                                
                                <motion.button
                                    onClick={handleCopyAllAndOpen}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full relative inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-lg text-white bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900"
                                >
                                    Salin Info & Buka YouTube
                                </motion.button>

                            </motion.div>
                        ) : (
                             <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-center text-slate-500 min-h-[50vh]">
                                <YouTubeIcon className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                                <p className="text-lg">Pilih video dari galeri untuk memulai.</p>
                             </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};