import type { YouTubeChannel } from '../types';

let activeYoutubeApiKey: string | null = null;

export const setYoutubeApiKey = (key: string | null) => {
    activeYoutubeApiKey = key && key.trim() ? key : null;
};

const getApiKey = (): string => {
    if (!activeYoutubeApiKey) {
        throw new Error("YOUTUBE_API_KEY_NOT_SET");
    }
    return activeYoutubeApiKey;
};

export const getChannelDetails = async (channelIds: string[]): Promise<YouTubeChannel[]> => {
    if (channelIds.length === 0) return [];
    
    const apiKey = getApiKey();
    const ids = channelIds.join(',');
    const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${ids}&key=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
        const errorData = await response.json();
        console.error("YouTube API Error:", errorData);
        throw new Error(`Gagal mengambil detail channel: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    if (!data.items || data.items.length === 0) {
        return [];
    }

    return data.items.map((item: any) => ({
        id: item.id,
        title: item.snippet?.title || 'Unknown Title',
        subscriberCount: item.statistics?.subscriberCount ? Number(item.statistics.subscriberCount).toLocaleString('en-US') : 'N/A',
        viewCount: item.statistics?.viewCount ? Number(item.statistics.viewCount).toLocaleString('en-US') : 'N/A',
        videoCount: item.statistics?.videoCount ? Number(item.statistics.videoCount).toLocaleString('en-US') : 'N/A',
        thumbnailUrl: item.snippet?.thumbnails?.default?.url || '',
    }));
};
