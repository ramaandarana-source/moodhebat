import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import type { AutoGenResultItem } from '../types';
import { VideoResultDisplay } from './VideoResultDisplay';

const ResultCard: React.FC<{ item: AutoGenResultItem, index: number }> = ({ item, index }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <motion.div
      className="bg-gray-900/50 backdrop-blur-md border border-cyan-500/20 rounded-xl panel-glow p-4 flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <VideoResultDisplay
        ref={videoRef}
        result={item.result}
        metadata={item.metadata}
      />
    </motion.div>
  );
};

export const AutoGenResultGrid: React.FC<{ results: AutoGenResultItem[] }> = ({ results }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-center text-slate-200 border-b border-cyan-500/20 pb-4">
        Galeri Hasil Auto-Generate
      </h2>
      <div className="grid grid-cols-1 gap-6">
        {results.map((item, index) => (
          <ResultCard key={item.id} item={item} index={index} />
        ))}
      </div>
    </div>
  );
};