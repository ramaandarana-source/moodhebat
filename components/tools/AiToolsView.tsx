import React from 'react';
import { ImageTextReader } from './ImageTextReader';
import type { ImageAspectRatio } from '../../types';

interface AiToolsViewProps {
    image: File | null;
    isLoading: boolean;
    error: string | null;
    imagePreview: string | null;
    scanResult: string | null;
    expandedImageResult: string | null;
    onImageUpload: (file: File) => void;
    onExtractText: () => void;
    onGeneratePrompt: () => void;
    onExpandImage: (aspectRatio: ImageAspectRatio) => void;
    onClear: () => void;
    onSelectForPreview: (url: string) => void;
}

export const AiToolsView: React.FC<AiToolsViewProps> = (props) => {
    return (
        <div className="bg-gray-900/50 backdrop-blur-md border border-cyan-500/20 rounded-xl panel-glow p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 border-b border-cyan-500/20 pb-4">
                <h2 className="text-xl font-semibold text-slate-200">Scan Image</h2>
            </div>
            <ImageTextReader {...props} />
        </div>
    );
};