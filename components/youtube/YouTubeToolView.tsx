import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import type { YouTubeChannel } from '../../types';
import { getChannelDetails } from '../../services/youtubeService';
import { PlusIcon, TrashIcon, RefreshCwIcon, UserIcon, EyeIcon as ViewIcon, FilmIcon as VideoIcon } from '../icons';

const LS_CHANNELS_KEY = 'ryad-tools-youtube-channels';

const StatCard: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg">
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-700/50 rounded-full text-cyan-400">{icon}</div>
        <div>
            <p className="text-xs text-slate-400">{label}</p>
            <p className="text-lg font-semibold text-slate-100">{value}</p>
        </div>
    </div>
);

const ChannelCard: React.FC<{ channel: YouTubeChannel; onDelete: (id: string) => void }> = ({ channel, onDelete }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-gray-900/50 border border-slate-800 rounded-xl p-4 space-y-4"
    >
        <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
                <img src={channel.thumbnailUrl} alt={channel.title} className="w-16 h-16 rounded-full border-2 border-slate-700" />
                <div>
                    <h4 className="text-lg font-bold text-slate-100">{channel.title}</h4>
                    <p className="text-xs text-slate-500 font-mono">{channel.id}</p>
                </div>
            </div>
            <button onClick={() => onDelete(channel.id)} className="p-1.5 text-slate-500 hover:text-red-400">
                <TrashIcon className="w-5 h-5" />
            </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard label="Pelanggan" value={channel.subscriberCount} icon={<UserIcon className="w-5 h-5" />} />
            <StatCard label="Total Penayangan" value={channel.viewCount} icon={<ViewIcon className="w-5 h-5" />} />
            <StatCard label="Total Video" value={channel.videoCount} icon={<VideoIcon className="w-5 h-5" />} />
        </div>
    </motion.div>
);

export const YouTubeToolView: React.FC = () => {
    const [channelIds, setChannelIds] = useState<string[]>([]);
    const [newChannelId, setNewChannelId] = useState('');
    const [channelData, setChannelData] = useState<YouTubeChannel[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const savedIds = localStorage.getItem(LS_CHANNELS_KEY);
            if (savedIds) {
                setChannelIds(JSON.parse(savedIds));
            }
        } catch (e) {
            console.error("Gagal memuat ID channel:", e);
        }
    }, []);

    const fetchChannelData = useCallback(async () => {
        if (channelIds.length === 0) {
            setChannelData([]);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const data = await getChannelDetails(channelIds);
            setChannelData(data);
        } catch (err) {
            console.error(err);
             let message = "Terjadi kesalahan yang tidak diketahui.";
             if (err instanceof Error) {
                 if (err.message.includes("keyInvalid") || err.message.includes("API key not valid")) {
                     message = "Kunci API YouTube tidak valid atau salah.";
                 } else if (err.message === "YOUTUBE_API_KEY_NOT_SET") {
                     message = "Kunci API YouTube belum diatur.";
                 } else {
                     message = `Terjadi kesalahan: ${err.message}`;
                 }
             }
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [channelIds]);

    useEffect(() => {
        fetchChannelData();
    }, [fetchChannelData]);

    const handleAddChannel = () => {
        const trimmedId = newChannelId.trim();
        if (trimmedId && !channelIds.includes(trimmedId)) {
            const newIds = [...channelIds, trimmedId];
            setChannelIds(newIds);
            localStorage.setItem(LS_CHANNELS_KEY, JSON.stringify(newIds));
            setNewChannelId('');
        }
    };

    const handleDeleteChannel = (idToDelete: string) => {
        const newIds = channelIds.filter(id => id !== idToDelete);
        setChannelIds(newIds);
        localStorage.setItem(LS_CHANNELS_KEY, JSON.stringify(newIds));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddChannel();
        }
    };

    return (
        <div className="bg-gray-900/50 backdrop-blur-md border border-cyan-500/20 rounded-xl panel-glow p-6 lg:p-8 max-w-4xl mx-auto">
             <div className="flex items-center justify-between mb-6 border-b border-cyan-500/20 pb-4">
                 <h2 className="text-xl font-semibold text-slate-200">Statistik Channel YouTube</h2>
                 <button onClick={fetchChannelData} disabled={isLoading} className="p-2 text-slate-400 hover:text-white disabled:opacity-50">
                    <RefreshCwIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                 </button>
             </div>
             
             <div className="flex items-center gap-2 mb-8">
                <input 
                    type="text"
                    value={newChannelId}
                    onChange={e => setNewChannelId(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Masukkan ID Channel YouTube (diawali dengan UC...)"
                    className="flex-grow p-3 bg-gray-900/70 border border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-slate-100 placeholder-slate-500"
                />
                <button onClick={handleAddChannel} disabled={!newChannelId.trim()} className="flex-shrink-0 flex items-center gap-2 px-4 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors disabled:opacity-50">
                    <PlusIcon className="w-5 h-5" />
                    <span>Tambah</span>
                </button>
             </div>

             <div className="space-y-4">
                <AnimatePresence>
                    {isLoading && channelData.length === 0 && <p className="text-center text-cyan-400 font-mono">Memuat data...</p>}
                    {error && <p className="text-center text-red-400 font-mono bg-red-900/50 p-4 rounded-lg">{error}</p>}
                    {channelData.map(channel => (
                        <ChannelCard key={channel.id} channel={channel} onDelete={handleDeleteChannel} />
                    ))}
                    {!isLoading && !error && channelData.length === 0 && channelIds.length > 0 && <p className="text-center text-slate-500 font-mono">Tidak ada data channel yang ditemukan.</p>}
                    {!isLoading && channelIds.length === 0 && (
                        <div className="text-center text-slate-500 py-8">
                            <p>Tambahkan ID Channel untuk mulai melacak statistik.</p>
                             <button 
                                onClick={() => Swal.fire({
                                    title: 'Cara Menemukan ID Channel YouTube',
                                    html: `<div class="text-left text-slate-300 space-y-2">
                                        <p>1. Buka channel YouTube di browser.</p>
                                        <p>2. <strong>Klik kanan</strong> di mana saja & pilih <strong>"View Page Source"</strong>.</p>
                                        <p>3. Tekan <strong>Ctrl + F</strong> (atau Cmd + F) dan cari <strong>channel_id</strong>.</p>
                                        <p>4. Salin ID yang diawali dengan 'UC' dari dalam tanda kutip.</p>
                                    </div>`,
                                    icon: 'info',
                                    customClass: { popup: 'bg-slate-900 border border-cyan-500/20 rounded-xl panel-glow' }
                                })}
                                className="mt-4 text-cyan-400 hover:underline"
                             >
                                Bingung? Klik di sini untuk petunjuk.
                             </button>
                        </div>
                    )}
                </AnimatePresence>
             </div>
        </div>
    );
};
