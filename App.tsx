import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import Swal from 'sweetalert2';
import JSZip from 'jszip';
import { GeneratorForm } from './components/GeneratorForm';
import { Loader } from './components/Loader';
import { VideoResultDisplay } from './components/VideoResultDisplay';
import { generateVideo, generateMetadata, generateImage, generateVEOPrompt, extractTextFromImage, generatePromptFromImage, expandImage, setApiKey as setGeminiApiKey, fileToBase64 } from './services/geminiService';
import { setYoutubeApiKey as setYoutubeServiceApiKey } from './services/youtubeService';
import type { AppMode, GenerationOptions, VideoResult, VideoMetadata, Character, Dialogue, EnvironmentState, ImageAspectRatio, ImageResult, ImageGenerationOptions, AutoGenerateOptions, Project, AutoGenResultItem, AutoGenPrompt, ChatMessage, Conversation } from './types';
import { PromptIcon, VideoIcon, ScanIcon, ImageIcon, HackingIcon, GearIcon, CheckIcon, LightbulbIcon, CopyIcon, LinkIcon, FilmIcon, YouTubeIcon, ChatIcon } from './components/icons';
import { PromptGenerator } from './components/prompt/PromptGenerator';
import { AiToolsView } from './components/tools/AiToolsView';
import { ImageGeneratorView } from './components/tools/ImageGeneratorView';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { ApiKeyExhaustedAnimation } from './components/ApiKeyExhaustedAnimation';
import { FfmpegToolView } from './components/tools/FfmpegToolView';
import { AutoGeneratorView } from './components/AutoGeneratorView';
import { AutoGenResultGrid } from './components/AutoGenResultGrid';
import { ApiKeyManager } from './components/ApiKeyManager';
import { YouTubeToolView } from './components/youtube/YouTubeToolView';
import { ChatView } from './components/chat/ChatView';
import { ChatSidebar } from './components/chat/ChatSidebar';
import { GoogleGenAI, Chat } from '@google/genai';

type SaveStatus = 'idle' | 'saving' | 'saved';

// --- Constants and Helpers ---
const names = [
    // Indonesian Names
    "Budi Santoso", "Siti Aminah", "Eko Prasetyo", "Dewi Lestari", "Agus Wijaya", "Rina Susanti", "Joko Widodo", "Ani Yudhoyono", "Putri Lestari", "Aditya Nugraha", "Ayu Wulandari", "Rizky Maulana", "indah Permata", "Fajar Hidayat", "Maya Sari", "Hendra Gunawan", "Dian Novita", "Taufik Hidayat", "Ratna Sari Dewi", "Irfan Hakim", "Gita Gutawa", "Bambang Pamungkas", "Fitriani", "Andi Putra", "Lina Marlina", "Surya Saputra", "Wati", "Cahyo", "Lestari", "Putra", "Achmad", "Arief", "Bayu", "Candra", "Dedi", "Dimas", "Doni", "Endang", "Farah", "Guntur", "Hasan", "Iwan", "Jajang", "Kartika", "Lia", "Mega", "Nia", "Oscar", "Pratiwi", "Qori", "Rahmat", "Sari", "Tono", "Umar", "Vina", "Wawan", "Yani", "Zainal", "Alya", "Bagus", "Citra", "Dian", "Eka", "Fani", "Galih", "Hesti", "Intan", "Jefri", "Kiki", "Lulu", "Mawar", "Nita", "Oki", "Putu", "Ratih", "Sinta", "Tia", "Utami", "Vivi", "Winda", "Yuni", "Zulaikha",
    // American Names
    "James Smith", "Mary Johnson", "Robert Williams", "Patricia Brown", "John Jones", "Jennifer Garcia", "Michael Miller", "Linda Davis", "William Rodriguez", "Elizabeth Martinez", "David Hernandez", "Barbara Moore", "Richard Taylor", "Susan Anderson", "Joseph Thomas", "Jessica Jackson", "Thomas White", "Sarah Harris", "Charles Martin", "Karen Thompson", "Christopher Garcia", "Nancy Martinez", "Daniel Robinson", "Lisa Clark", "Matthew Lewis", "Betty Walker", "Anthony Hall", "Helen Allen", "Mark Young", "Sandra King", "Aaron", "Adam", "Alex", "Amanda", "Amber", "Amy", "Andrea", "Angela", "Anna", "Ashley", "Austin", "Ben", "Beth", "Bill", "Bob", "Brandon", "Brian", "Brittany", "Bruce", "Carl", "Carol", "Catherine", "Cheryl", "Chris", "Christian", "Christina", "Christine", "Cody", "Crystal", "Cynthia", "Dan", "Dana", "David", "Debra", "Denise", "Dennis", "Diana", "Diane", "Donald", "Donna", "Doris", "Douglas", "Edward", "Emily", "Eric", "Erica", "Ethan", "Eugene", "Evelyn", "Frank", "Gary", "George", "Gloria", "Grace", "Greg", "Hannah", "Heather", "Henry", "Jack", "Jacob", "James", "Jamie", "Janet", "Janice", "Jason", "Jean", "Jeff", "Jennifer", "Jerry", "Jesse", "Jessica", "Jim", "Joan", "Joe", "John", "Jonathan", "Jordan", "Jose", "Joseph", "Joshua", "Joyce", "Juan", "Judith", "Judy", "Julia", "Julie", "Justin", "Karen", "Katherine", "Kathleen", "Kathy", "Katie", "Kayla", "Keith", "Kelly", "Ken", "Kevin", "Kim", "Kimberly", "Kyle", "Larry", "Laura", "Lauren", "Lawrence", "Linda", "Lisa", "Logan", "Lori", "Louis", "Madison", "Margaret", "Maria", "Marie", "Mark", "Martha", "Mary", "Matthew", "Megan", "Melissa", "Michael", "Michelle", "Mike", "Mildred", "Nancy", "Nathan", "Nicholas", "Nicole", "Noah", "Olivia", "Pamela", "Pat", "Patricia", "Patrick", "Paul", "Peter", "Philip", "Rachel", "Ralph", "Randy", "Raymond", "Rebecca", "Regina", "Richard", "Robert", "Roger", "Ron", "Ronald", "Rose", "Roy", "Russell", "Ruth", "Ryan", "Samantha", "Samuel", "Sandra", "Sara", "Sarah", "Scott", "Sean", "Sharon", "Shirley", "Sophia", "Stephanie", "Stephen", "Steve", "Steven", "Susan", "Tammy", "Teresa", "Terry", "Theresa", "Thomas", "Tiffany", "Tim", "Timothy", "Tina", "Todd", "Tom", "Tony", "Tracy", "Tyler", "Victoria", "Vincent", "Virginia", "Walter", "Wanda", "Wayne", "William", "Willie", "Zachary"
];
const companyPrefixes = ["Cosmic", "Pixelated", "Quantum", "Galactic", "Ninja", "Wizard", "Chrono", "Dream", "Arcane", "Luminous", "Shadow", "Byte", "Mecha", "Giga", "Turbo"];
const companyMiddles = ["Pancake", "Banana", "Donut", "Pirate", "Cactus", "Wombat", "Toaster", "Penguin", "Robot", "Doodle", "Jellybean", "Noodle", "Quest", "Forge", "Nebula"];
const companySuffixes = ["Syndicate", "Collective", "Labs", "Studios", "Works", "Factory", "Guild", "Enterprises", "Co-op", "Universe"];
const generateCompanyName = () => {
    const prefix = companyPrefixes[Math.floor(Math.random() * companyPrefixes.length)];
    const middle = companyMiddles[Math.floor(Math.random() * companyMiddles.length)];
    if (Math.random() > 0.6) {
        const suffix = companySuffixes[Math.floor(Math.random() * companySuffixes.length)];
        return `${prefix} ${middle} ${suffix}`;
    }
    return `${prefix} ${middle}`;
};
const popupItems: { type: 'link' | 'generator'; title: string; copyValue?: string | null }[] = [
    { type: 'link', title: 'Firefox Relay', copyValue: 'https://relay.firefox.com/' },
    { type: 'link', title: 'Cloud Skills Boost', copyValue: 'https://www.cloudskillsboost.google/users/sign_up' },
    { type: 'link', title: 'Vertex AI Challenge', copyValue: 'vertex ai challenge' },
    { type: 'link', title: 'AI Google Studio', copyValue: 'AI Google Studio' },
    { type: 'generator', title: 'Sandi Generator', copyValue: null },
    { type: 'generator', title: 'Nama Random Generator', copyValue: null },
    { type: 'generator', title: 'Nama Company', copyValue: null },
];
const generatePassword = (length = 16) => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
    let password = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
        password += charset.charAt(Math.floor(Math.random() * n));
    }
    return password;
};
const getRandomName = () => {
    return names[Math.floor(Math.random() * names.length)];
};
const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.warn('Clipboard API failed, trying fallback:', err);
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.top = '-9999px';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            return successful;
        } catch (fallbackErr) {
            console.error('Fallback copy method failed:', fallbackErr);
            document.body.removeChild(textArea);
            return false;
        }
    }
};
const HackerPopupContent: React.FC = () => {
    const InfoBox: React.FC<{ item: typeof popupItems[0] }> = ({ item }) => {
        const [isCopied, setIsCopied] = useState(false);

        const handleClick = async () => {
            if (isCopied) return;

            let valueToCopy = item.copyValue ?? '';
            if (item.type === 'generator') {
                if (item.title === "Sandi Generator") valueToCopy = generatePassword();
                else if (item.title === "Nama Random Generator") valueToCopy = getRandomName();
                else if (item.title === "Nama Company") valueToCopy = generateCompanyName();
            }

            const success = await copyToClipboard(valueToCopy);
            if (success) {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            } else {
                console.error("Gagal menyalin ke clipboard.");
            }
        };
        
        const isGenerator = item.type === 'generator';
        const isUrlLink = item.type === 'link' && item.copyValue?.startsWith('http');
        
        let feedbackText = item.title;
        if (isCopied) feedbackText = "Tersalin!";
        
        const isLit = isCopied && isGenerator;

        const getIcon = () => {
            if (isGenerator) {
                return <LightbulbIcon className={`w-5 h-5 mb-1 transition-colors duration-300 ${isLit ? 'text-yellow-300 drop-shadow-[0_0_5px_rgba(253,224,71,0.7)]' : 'text-slate-500'}`} />;
            }
            if (isUrlLink) {
                return <LinkIcon className="w-5 h-5 mb-1 text-slate-500" />;
            }
            if (item.type === 'link' && !isUrlLink) {
                return <CopyIcon className="w-5 h-5 mb-1 text-slate-500" />;
            }
            return null;
        }

        return (
            <div
                onClick={handleClick}
                className="p-3 w-40 h-16 flex flex-col items-center justify-center bg-slate-800/70 border border-slate-700 rounded-lg cursor-pointer transition-colors hover:bg-cyan-900/50 hover:border-cyan-700 text-center"
            >
                {getIcon()}
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={feedbackText}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className={`flex items-center justify-center gap-1 text-sm font-semibold ${isCopied ? 'text-green-400' : 'text-slate-300'}`}
                    >
                        {isCopied && <CheckIcon className="w-4 h-4" />}
                        <span>{feedbackText}</span>
                    </motion.div>
                </AnimatePresence>
            </div>
        );
    };

    return (
        <div className="flex flex-wrap items-center justify-center gap-4">
            {popupItems.map((item, index) => (
                <InfoBox key={index} item={item} />
            ))}
        </div>
    );
};


const initialEnvironment: EnvironmentState = {
    setting: '', lighting: 'Neon', cameraAngle: 'Eye Level',
    cameraShot: 'Medium Shot', style: 'Cinematic',
};

// --- Local Storage Keys ---
const LS_API_KEY_1 = 'ryad-tools-api-key-1';
const LS_API_KEY_2 = 'ryad-tools-api-key-2';
const LS_YOUTUBE_API_KEY = 'ryad-tools-youtube-api-key';
const LS_DEFAULT_API_KEY_INDEX = 'ryad-tools-default-api-key-index';
const LS_PROMPT_HISTORY_KEY = 'ryad-tools-prompt-history';
const LS_PERSISTENT_VIDEO_KEY = 'ryad-tools-persistent-video';
const LS_AUTOGEN_SESSION_KEY = 'ryad-tools-autogen-session';
const LS_PROJECTS_KEY = 'ryad-tools-projects';
const LS_CHAT_CONVERSATIONS = 'ryad-tools-chat-conversations';
const LS_ACTIVE_CHAT_ID = 'ryad-tools-active-chat-id';


const initialAutoGenerateOptions: AutoGenerateOptions = {
    downloadType: 'zip',
    metadataSelection: {
        youtubeTitle: true, tiktokTitle: true, instagramTitle: true, facebookTitle: true,
        shopeeAffiliateTitle: true, tiktokAffiliateTitle: true, tags: true,
    },
};

// --- Helper Functions ---
const sanitizeFilename = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-') 
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const dataUrlToFile = async (dataUrl: string, id: string): Promise<File | undefined> => {
    try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        return new File([blob], `loaded-image-${id}.png`, { type: blob.type });
    } catch(e) {
        console.error("Failed to convert data URL to file", e);
        return undefined;
    }
};

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>('videoGenerator');
  const [notifications, setNotifications] = useState<Record<AppMode, boolean>>({
    videoGenerator: false,
    imageGenerator: false,
    promptGenerator: false,
    scanImage: false,
    ffmpeg: false,
    youtubeTool: false,
    chat: false,
  });
  
  // State for API Keys - Initialized directly from localStorage
  const [apiKey1, setApiKey1] = useState(() => localStorage.getItem(LS_API_KEY_1) || '');
  const [apiKey2, setApiKey2] = useState(() => localStorage.getItem(LS_API_KEY_2) || '');
  const [youtubeApiKey, setYoutubeApiKey] = useState(() => localStorage.getItem(LS_YOUTUBE_API_KEY) || '');
  const [defaultApiKeyIndex, setDefaultApiKeyIndex] = useState<0 | 1 | null>(() => {
      const savedIndex = localStorage.getItem(LS_DEFAULT_API_KEY_INDEX);
      const savedKey1 = localStorage.getItem(LS_API_KEY_1);
      const savedKey2 = localStorage.getItem(LS_API_KEY_2);
      if (savedIndex === '0' && savedKey1) return 0;
      if (savedIndex === '1' && savedKey2) return 1;
      if (savedKey1) return 0;
      if (savedKey2) return 1;
      return null;
  });

  // State for Video Generator
  const [videoPrompt, setVideoPrompt] = useState<string>('');
  const [isVideoLoading, setIsVideoLoading] = useState<boolean>(false);
  const [videoLoadingMessage, setVideoLoadingMessage] = useState<string>('');
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoResult, setVideoResult] = useState<VideoResult | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const imageResultsRef = useRef<HTMLDivElement>(null);
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);
  
  // State for Auto-Generate
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [autoGenLoadingMessage, setAutoGenLoadingMessage] = useState<string>('');
  const [autoGenPrompts, setAutoGenPrompts] = useState<AutoGenPrompt[]>([{id: uuidv4(), text: '', status: 'pending'}]);
  const [autoGenOptions, setAutoGenOptions] = useState<AutoGenerateOptions>(initialAutoGenerateOptions);
  const [isAutoGeneratorVisible, setIsAutoGeneratorVisible] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const saveTimeoutRef = useRef<number | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [autoGenResults, setAutoGenResults] = useState<AutoGenResultItem[]>([]);
  const [autoGenIndex, setAutoGenIndex] = useState<number>(-1);

  // State for Image Generator
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageGenerationHistory, setImageGenerationHistory] = useState<ImageResult[][]>([]);
  const [characterReferenceImage, setCharacterReferenceImage] = useState<File | null>(null);
  const [characterReferenceImagePreview, setCharacterReferenceImagePreview] = useState<string | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);


  // State for Prompt Generator
  const [characters, setCharacters] = useState<Character[]>([]);
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);
  const [environment, setEnvironment] = useState<EnvironmentState>(initialEnvironment);
  const [isPromptGenerating, setIsPromptGenerating] = useState(false);
  const [promptOutput, setPromptOutput] = useState({ indonesia: '', english: '', json: '' });
  
  // State for Scan Image (State Lifting)
  const [scanImage, setScanImage] = useState<File | null>(null);
  const [scanImagePreview, setScanImagePreview] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isScanningImage, setIsScanningImage] = useState(false);
  const [scanImageError, setScanImageError] = useState<string | null>(null);
  const [expandedImageResult, setExpandedImageResult] = useState<string | null>(null);
  
  // State for AI Chat
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatInstancesRef = useRef<Map<string, Chat>>(new Map());
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const geminiAiRef = useRef<GoogleGenAI | null>(null);
  
  const isAnyLoading = isVideoLoading || isImageLoading || isPromptGenerating || isScanningImage || isAutoGenerating || isChatLoading;

  const navItems = [
    { id: 'videoGenerator', label: 'AI Video', icon: VideoIcon },
    { id: 'imageGenerator', label: 'AI Image', icon: ImageIcon },
    { id: 'promptGenerator', label: 'AI Prompt', icon: PromptIcon },
    { id: 'chat', label: 'AI Chat', icon: ChatIcon },
    { id: 'scanImage', label: 'Scan Image', icon: ScanIcon },
    { id: 'youtubeTool', label: 'YouTube', icon: YouTubeIcon },
    { id: 'ffmpeg', label: 'FFMPEG', icon: HackingIcon },
  ];
  
  const triggerNotification = (mode: AppMode) => {
    if (appMode !== mode) {
        setNotifications(prev => ({ ...prev, [mode]: true }));
    }
  };
  
  // --- Effects for Loading and Saving State ---
  useEffect(() => {
    // Load complex/async states from localStorage on initial mount
    // API keys are now handled by useState initializers for synchronous loading.
    
    // Load prompt history
    try {
        const storedHistory = localStorage.getItem(LS_PROMPT_HISTORY_KEY);
        if (storedHistory) {
            setPromptHistory(JSON.parse(storedHistory));
        }
    } catch (e) { console.error("Gagal memuat riwayat prompt:", e); }
    
    // Load persistent video result
    try {
        const persistentVideo = localStorage.getItem(LS_PERSISTENT_VIDEO_KEY);
        if(persistentVideo) {
            const data = JSON.parse(persistentVideo);
            setVideoPrompt(data.prompt || '');
            setVideoMetadata(data.metadata || null);
            setVideoResult(data.result || null); // Note: blob will be missing
        }
    } catch (e) { console.error("Gagal memuat hasil video:", e); }

    // Load auto-generate session
    const loadAutoGenSession = async () => {
        try {
            const storedSession = localStorage.getItem(LS_AUTOGEN_SESSION_KEY);
            if (storedSession) {
                const { prompts: storedPrompts, options } = JSON.parse(storedSession);
                if (storedPrompts && Array.isArray(storedPrompts)) {
                    const loadedPromptsPromises = storedPrompts.map(async (p: any) => ({
                      ...p,
                      status: p.status || 'pending',
                      image: p.imagePreview ? await dataUrlToFile(p.imagePreview, p.id) : undefined
                    }));
                    const loadedPrompts = await Promise.all(loadedPromptsPromises);
                    if (loadedPrompts.length > 0) {
                        setAutoGenPrompts(loadedPrompts);
                    }
                }
                if (options) {
                  setAutoGenOptions(options);
                }
            }
        } catch(e) { console.error("Gagal memuat sesi auto-generate:", e); }
    };
    loadAutoGenSession();

    // Load projects
    try {
        const storedProjects = localStorage.getItem(LS_PROJECTS_KEY);
        if (storedProjects) {
            const loadedProjects = JSON.parse(storedProjects) as Project[];
            if (Array.isArray(loadedProjects)) {
                setProjects(loadedProjects);
            }
        }
    } catch(e) { console.error("Gagal memuat proyek:", e); }
     // Load chat conversations
    try {
        const storedConversations = localStorage.getItem(LS_CHAT_CONVERSATIONS);
        const storedActiveId = localStorage.getItem(LS_ACTIVE_CHAT_ID);
        if (storedConversations) {
            const loadedConversations = JSON.parse(storedConversations) as Conversation[];
            if (Array.isArray(loadedConversations)) {
                setConversations(loadedConversations);
                if (storedActiveId && loadedConversations.some(c => c.id === storedActiveId)) {
                    setActiveConversationId(storedActiveId);
                } else if (loadedConversations.length > 0) {
                    setActiveConversationId(loadedConversations[0].id);
                }
            }
        }
    } catch (e) { console.error("Gagal memuat percakapan obrolan:", e); }
  }, []);
    
  // --- Event Listeners & State Savers ---
  // Fix: Split useEffect to avoid re-initializing Gemini client when only YouTube key changes.
  // This also resolves the error of accessing a private 'apiKey' property.
  useEffect(() => {
    try {
        localStorage.setItem(LS_YOUTUBE_API_KEY, youtubeApiKey);
        setYoutubeServiceApiKey(youtubeApiKey);
    } catch (e) {
        console.error("Gagal menyimpan kunci API YouTube:", e);
    }
  }, [youtubeApiKey]);

  useEffect(() => {
    try {
        localStorage.setItem(LS_API_KEY_1, apiKey1);
        localStorage.setItem(LS_API_KEY_2, apiKey2);

        let activeKey: string | null = null;
        if (defaultApiKeyIndex !== null) {
            localStorage.setItem(LS_DEFAULT_API_KEY_INDEX, defaultApiKeyIndex.toString());
            activeKey = defaultApiKeyIndex === 0 ? apiKey1 : apiKey2;
        } else {
            localStorage.removeItem(LS_DEFAULT_API_KEY_INDEX);
        }
        
        setGeminiApiKey(activeKey);

        if (activeKey) {
            geminiAiRef.current = new GoogleGenAI({ apiKey: activeKey });
            chatInstancesRef.current.clear(); // Clear old instances on API key change
        } else {
            geminiAiRef.current = null;
        }

    } catch (e) {
        console.error("Gagal menyimpan kunci API Gemini:", e);
    }
  }, [apiKey1, apiKey2, defaultApiKeyIndex]);

  // Debounced save for auto-generate session
  useEffect(() => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      setSaveStatus('saving');
      saveTimeoutRef.current = window.setTimeout(() => {
          try {
              const serializablePrompts = autoGenPrompts.map(({ image, ...rest }) => rest);
              const sessionData = { prompts: serializablePrompts, options: autoGenOptions };
              localStorage.setItem(LS_AUTOGEN_SESSION_KEY, JSON.stringify(sessionData));
              setSaveStatus('saved');
              setTimeout(() => setSaveStatus('idle'), 2000);
          } catch (e) {
              console.error("Gagal menyimpan sesi auto-generate:", e);
              setSaveStatus('idle');
          }
      }, 1000);
  }, [autoGenPrompts, autoGenOptions]);

  // Save projects to localStorage whenever they change
  useEffect(() => {
      try {
          localStorage.setItem(LS_PROJECTS_KEY, JSON.stringify(projects));
      } catch (e) {
          console.error("Gagal menyimpan proyek:", e);
      }
  }, [projects]);
  
   // Save chat conversations to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(LS_CHAT_CONVERSATIONS, JSON.stringify(conversations));
            if (activeConversationId) {
                localStorage.setItem(LS_ACTIVE_CHAT_ID, activeConversationId);
            } else {
                localStorage.removeItem(LS_ACTIVE_CHAT_ID);
            }
        } catch (e) {
            console.error("Gagal menyimpan percakapan obrolan:", e);
        }
    }, [conversations, activeConversationId]);


  // --- Generic Handlers ---
  const handleError = (error: unknown, errorSetter: React.Dispatch<React.SetStateAction<string | null>>, loadingSetter: React.Dispatch<React.SetStateAction<boolean>>) => {
      console.error(error);
      loadingSetter(false);
      if (error instanceof Error) {
          if (error.message.includes("API key not valid") || error.message.includes("quota")) {
              errorSetter("API_KEY_EXHAUSTED");
          } else if (error.message === "API_KEY_NOT_SET") {
               errorSetter("Kunci API belum diatur. Silakan masukkan kunci API Anda.");
          } else {
               errorSetter(`Terjadi kesalahan: ${error.message}`);
          }
      } else {
          errorSetter("Terjadi kesalahan yang tidak diketahui.");
      }
  };

  const checkApiKey = useCallback((): boolean => {
    const activeKey = defaultApiKeyIndex === 0 ? apiKey1 : apiKey2;
    if (!activeKey || !activeKey.trim()) {
        Swal.fire({
            title: 'Kunci API Diperlukan',
            html: `Silakan masukkan kunci API Anda di panel kontrol.<br/>Kunci Anda disimpan secara lokal di browser Anda.`,
            icon: 'warning',
            customClass: { popup: 'bg-slate-900 border border-cyan-500/20 rounded-xl panel-glow' }
        });
        return false;
    }
    return true;
  }, [apiKey1, apiKey2, defaultApiKeyIndex]);

  const handleSetReferenceImage = (file: File | null) => {
    setReferenceImage(file);
    if (file) {
      setReferenceImagePreview(URL.createObjectURL(file));
    } else {
      setReferenceImagePreview(null);
    }
  };

  const handleSetCharacterReferenceImage = (file: File | null) => {
    setCharacterReferenceImage(file);
    if (file) {
      setCharacterReferenceImagePreview(URL.createObjectURL(file));
    } else {
      setCharacterReferenceImagePreview(null);
    }
  };
    
  // --- Prompt History Handlers ---
  const updatePromptHistory = (newPrompt: string) => {
      if (!promptHistory.includes(newPrompt)) {
          const updatedHistory = [newPrompt, ...promptHistory].slice(0, 50); // Limit history size
          setPromptHistory(updatedHistory);
          localStorage.setItem(LS_PROMPT_HISTORY_KEY, JSON.stringify(updatedHistory));
      }
  };
  const deleteHistoryItem = (index: number) => {
      const updatedHistory = promptHistory.filter((_, i) => i !== index);
      setPromptHistory(updatedHistory);
      localStorage.setItem(LS_PROMPT_HISTORY_KEY, JSON.stringify(updatedHistory));
  };
  const clearHistory = () => {
      setPromptHistory([]);
      localStorage.removeItem(LS_PROMPT_HISTORY_KEY);
  };
    
  // --- Video Generation Handlers ---
  const handleGenerateVideo = async (options: GenerationOptions) => {
      if (!checkApiKey()) return;
      setIsVideoLoading(true);
      setVideoError(null);
      setVideoResult(null);
      setVideoMetadata(null);
      updatePromptHistory(options.prompt);
      
      try {
          setVideoLoadingMessage("Memulai pembuatan video...");
          const videoBlob = await generateVideo(options);
          const videoUrl = URL.createObjectURL(videoBlob);
          
          setVideoLoadingMessage("Membuat metadata...");
          const metadata = await generateMetadata(options.prompt);
          
          const resultItem: AutoGenResultItem = {
            id: uuidv4(),
            prompt: options.prompt,
            result: { url: videoUrl, blob: videoBlob },
            metadata: metadata,
          };

          setVideoResult(resultItem.result);
          setVideoMetadata(resultItem.metadata);

          localStorage.setItem(LS_PERSISTENT_VIDEO_KEY, JSON.stringify({ prompt: options.prompt, result: { url: videoUrl }, metadata }));
          
          setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

      } catch (err) {
          handleError(err, setVideoError, setIsVideoLoading);
      } finally {
          setIsVideoLoading(false);
          setVideoLoadingMessage('');
      }
  };

  // --- Auto-Generate Handlers ---
  const startAutoGenerate = async () => {
    if (!checkApiKey()) return;
    setIsAutoGenerating(true);
    setIsAutoGeneratorVisible(false);
    setAutoGenResults([]);
    setVideoResult(null); // Clear single video result
    setVideoMetadata(null);
    setAutoGenIndex(0); // This starts the useEffect-based loop
  };

  // State-driven loop for auto-generation
  useEffect(() => {
      const promptsToRun = autoGenPrompts.filter(p => p.text.trim());

      if (autoGenIndex >= 0 && autoGenIndex < promptsToRun.length && isAutoGenerating) {
          const processPrompt = async () => {
              if (!checkApiKey()) {
                  setIsAutoGenerating(false);
                  setAutoGenIndex(-1);
                  return;
              }
              const currentPrompt = promptsToRun[autoGenIndex];
              setAutoGenLoadingMessage(`Membuat video ${autoGenIndex + 1} dari ${promptsToRun.length}: "${currentPrompt.text.substring(0, 20)}..."`);
              
              try {
                  const videoBlob = await generateVideo({
                      prompt: currentPrompt.text,
                      image: currentPrompt.image,
                      aspectRatio: '16:9',
                      sound: true,
                      resolution: '1080p',
                  });
                  const videoUrl = URL.createObjectURL(videoBlob);
                  const metadata = await generateMetadata(currentPrompt.text);

                  const resultItem: AutoGenResultItem = {
                      id: uuidv4(),
                      prompt: currentPrompt.text,
                      result: { url: videoUrl, blob: videoBlob },
                      metadata: metadata,
                  };
                  
                  setAutoGenResults(prev => [...prev, resultItem]);
                  setAutoGenPrompts(prev => prev.map(p => p.id === currentPrompt.id ? { ...p, status: 'completed' } : p));
                  
                  // Immediately move to the next prompt
                  setAutoGenIndex(prevIndex => prevIndex + 1);

              } catch (err) {
                  console.error(`Gagal membuat video untuk prompt: "${currentPrompt.text}"`, err);
                  handleError(err, setVideoError, setIsAutoGenerating);
                  setAutoGenIndex(-1); // Stop the process on error
                  Swal.fire({
                      title: 'Proses Dihentikan!',
                      text: `Terjadi kesalahan saat membuat video untuk prompt: "${currentPrompt.text}".`,
                      icon: 'error',
                      customClass: { popup: 'bg-slate-900 border border-cyan-500/20 rounded-xl panel-glow' }
                  });
              }
          };
          processPrompt();
      } else if (isAutoGenerating && autoGenIndex >= promptsToRun.length) {
          // Finished all prompts
          setIsAutoGenerating(false);
          setAutoGenIndex(-1);
           Swal.fire({
               title: 'Selesai!',
               text: 'Semua video telah berhasil dibuat.',
               icon: 'success',
               customClass: { popup: 'bg-slate-900 border border-cyan-500/20 rounded-xl panel-glow' }
           });
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGenIndex, isAutoGenerating]);
    
  // --- Project Handlers ---
  const handleSaveProject = (name: string) => {
    const newProject: Project = {
      id: uuidv4(),
      name,
      prompts: autoGenPrompts.map(p => {
        const { image, ...rest } = p; // Destructure to remove non-serializable File object
        return rest; // Save the rest, including imagePreview
      }),
      options: autoGenOptions
    };
    setProjects(prevProjects => [...prevProjects, newProject]);
    Swal.fire('Tersimpan!', `Proyek "${name}" telah disimpan.`, 'success');
  };

  const handleLoadProject = (id: string) => {
    const projectToLoad = projects.find(p => p.id === id);
    if (projectToLoad) {
        const loadAndSet = async () => {
            const loadedPromptsPromises = projectToLoad.prompts.map(async (p) => ({
                ...p,
                image: p.imagePreview ? await dataUrlToFile(p.imagePreview, p.id) : undefined,
            }));
            const loadedPrompts = await Promise.all(loadedPromptsPromises);
            setAutoGenPrompts(loadedPrompts as AutoGenPrompt[]);
            setAutoGenOptions(projectToLoad.options);
            Swal.fire('Dimuat!', `Proyek "${projectToLoad.name}" telah dimuat.`, 'success');
        };
        loadAndSet();
    }
  };

  const handleDeleteProject = (id: string) => {
    const projectToDelete = projects.find(p => p.id === id);
    if (projectToDelete) {
      Swal.fire({
        title: `Hapus Proyek "${projectToDelete.name}"?`,
        text: "Tindakan ini tidak dapat diurungkan!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, hapus!',
        cancelButtonText: 'Batal',
        customClass: {
          popup: 'bg-slate-900 border border-cyan-500/20 rounded-xl panel-glow',
          title: 'text-slate-200',
          htmlContainer: 'text-slate-300',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded',
          cancelButton: 'bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded ml-2',
        },
        buttonsStyling: false,
      }).then((result) => {
        if (result.isConfirmed) {
          setProjects(prevProjects => prevProjects.filter(p => p.id !== id));
        }
      });
    }
  };

  // --- Image Generation Handlers ---
  const handleGenerateImage = async (options: ImageGenerationOptions) => {
    if (!checkApiKey()) return;
    setIsImageLoading(true);
    setImageError(null);
    try {
        const base64Images = await generateImage(options);
        const newResults: ImageResult[] = base64Images.map(base64 => ({
            base64,
            url: `data:image/png;base64,${base64}`
        }));
        setImageGenerationHistory(prev => [newResults, ...prev]);
        triggerNotification('imageGenerator');
        setTimeout(() => imageResultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
        handleError(err, setImageError, setIsImageLoading);
    } finally {
        setIsImageLoading(false);
    }
  };

  // --- Prompt Generation Handlers ---
  const handleGenerateVEOPrompt = async () => {
    if (!checkApiKey()) return;
    setIsPromptGenerating(true);
    try {
        const output = await generateVEOPrompt(characters, dialogues, environment);
        setPromptOutput(output);
        triggerNotification('promptGenerator');
    } catch(err) {
        console.error(err);
        let message = "Terjadi kesalahan yang tidak diketahui.";
        if (err instanceof Error) {
            if (err.message.includes("API key not valid") || err.message.includes("quota")) {
                message = "Kunci API Anda telah mencapai batasnya.";
            } else if (err.message === "API_KEY_NOT_SET") {
                 message = "Kunci API belum diatur. Silakan masukkan kunci API Anda.";
            } else {
                 message = `Terjadi kesalahan: ${err.message}`;
            }
        }
        Swal.fire('Error', message, 'error');
    } finally {
        setIsPromptGenerating(false);
    }
  };

  // --- Scan Image Handlers ---
  const handleScanImageUpload = (file: File) => {
    setScanImage(file);
    setScanImagePreview(URL.createObjectURL(file));
    setScanResult(null);
    setExpandedImageResult(null);
    setScanImageError(null);
  };

  const handleExtractText = async () => {
    if (!scanImage || !checkApiKey()) return;
    setIsScanningImage(true);
    setScanResult(null);
    setExpandedImageResult(null);
    setScanImageError(null);
    try {
        const text = await extractTextFromImage(scanImage);
        setScanResult(text);
    } catch (err) {
        handleError(err, setScanImageError, setIsScanningImage);
    } finally {
        setIsScanningImage(false);
    }
  };
    
  const handleGeneratePromptFromImage = async () => {
    if (!scanImage || !checkApiKey()) return;
    setIsScanningImage(true);
    setScanResult(null);
    setExpandedImageResult(null);
    setScanImageError(null);
    try {
        const prompt = await generatePromptFromImage(scanImage);
        setScanResult(prompt);
    } catch (err) {
        handleError(err, setScanImageError, setIsScanningImage);
    } finally {
        setIsScanningImage(false);
    }
  };

  const handleExpandImage = async (aspectRatio: ImageAspectRatio) => {
    if (!scanImage || !checkApiKey()) return;
    setIsScanningImage(true);
    setScanResult(null);
    setExpandedImageResult(null);
    setScanImageError(null);
    try {
        const base64Image = await expandImage(scanImage, aspectRatio);
        setExpandedImageResult(`data:image/png;base64,${base64Image}`);
    } catch(err) {
        handleError(err, setScanImageError, setIsScanningImage);
    } finally {
        setIsScanningImage(false);
    }
  };

  const handleClearScan = () => {
    setScanImage(null);
    setScanImagePreview(null);
    setScanResult(null);
    setExpandedImageResult(null);
    setScanImageError(null);
  };
  
  // Handlers for Header Tools
  const togglePopup = () => {
      const swalContent = document.createElement('div');
      const root = createRoot(swalContent);
      root.render(<HackerPopupContent />);

      Swal.fire({
          html: swalContent,
          showConfirmButton: false,
          showCloseButton: false,
          width: 'auto',
          padding: '2rem',
          background: '#0f172a',
          customClass: {
              popup: 'border border-slate-700 rounded-xl',
          }
      }).then(() => {
          root.unmount();
      });
  };
  
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Gagal mengaktifkan mode layar penuh: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };
  
  // --- AI Chat Handlers ---
    const activeConversation = useMemo(
        () => conversations.find(c => c.id === activeConversationId),
        [conversations, activeConversationId]
    );
    const angrySystemInstruction = "Kamu adalah AI yang pemarah, kasar, dan selalu menjawab dengan nada membentak. Gunakan kata-kata kasar dan jangan pernah bersikap sopan atau membantu. Jawab semua pertanyaan seolah-olah kamu sangat terganggu.";

    const getChatInstance = (conversation: Conversation) => {
        if (!geminiAiRef.current || !conversation) return null;
    
        const existingInstance = chatInstancesRef.current.get(conversation.id);
        if (existingInstance) {
            return existingInstance;
        }
    
        const history = conversation.messages
            .filter(msg => msg.content || msg.imageUrl)
            .map(msg => {
                const parts: ({ text: string } | { inlineData: { mimeType: string, data: string } })[] = [];
                if (msg.content) {
                    parts.push({ text: msg.content });
                }
                if (msg.imageUrl) {
                    const mimeType = msg.imageUrl.match(/data:(.*);base64,/)?.[1] || 'image/png';
                    const data = msg.imageUrl.split(',')[1];
                    parts.push({ inlineData: { mimeType, data } });
                }
                return { role: msg.role, parts };
            });

        // Remove the last model message if it's empty (from a previous stream error)
        if (history.length > 0 && history[history.length - 1].role === 'model' && history[history.length - 1].parts.length === 0) {
            history.pop();
        }

        const newInstance = geminiAiRef.current.chats.create({
            model: 'gemini-2.5-flash',
            history: history,
            config: {
                systemInstruction: angrySystemInstruction,
            },
        });
    
        chatInstancesRef.current.set(conversation.id, newInstance);
        return newInstance;
    };


    const handleNewChat = () => {
        const newId = uuidv4();
        const newConversation: Conversation = {
            id: newId,
            title: `Percakapan Baru`,
            messages: [],
        };
        setConversations(prev => [newConversation, ...prev]);
        setActiveConversationId(newId);
        setIsSidebarOpen(false);
    };

    const handleSelectConversation = (id: string) => {
        setActiveConversationId(id);
        setIsSidebarOpen(false);
    };

    const handleDeleteConversation = (id: string) => {
        chatInstancesRef.current.delete(id);
        setConversations(prev => prev.filter(c => c.id !== id));
        if (activeConversationId === id) {
            const remaining = conversations.filter(c => c.id !== id);
            setActiveConversationId(remaining.length > 0 ? remaining[0].id : null);
        }
    };
    
    const handleClearAllConversations = () => {
        chatInstancesRef.current.clear();
        setConversations([]);
        setActiveConversationId(null);
    };

    const handleDeleteMessage = (messageId: string) => {
        if (!activeConversationId) return;
        // This invalidates the current chat session, so we delete it to be safe
        chatInstancesRef.current.delete(activeConversationId);
        setConversations(prev => prev.map(c => {
            if (c.id === activeConversationId) {
                return { ...c, messages: c.messages.filter(m => m.id !== messageId) };
            }
            return c;
        }));
    };

    const handleSendMessage = async (text: string) => {
        const trimmedInput = text.trim();
        if (!trimmedInput || isChatLoading) return;
        if (!checkApiKey()) return;
    
        const userMessage: ChatMessage = { id: uuidv4(), role: 'user', content: trimmedInput };
        const modelMessage: ChatMessage = { id: uuidv4(), role: 'model', content: '' };
    
        let conversationId = activeConversationId;
        let isNewConversation = !conversationId;
    
        if (isNewConversation) {
            const newId = uuidv4();
            const newConversation: Conversation = {
                id: newId,
                title: trimmedInput.substring(0, 30) + (trimmedInput.length > 30 ? '...' : ''),
                messages: [userMessage, modelMessage],
            };
            setConversations(prev => [newConversation, ...prev]);
            setActiveConversationId(newId);
            conversationId = newId;
        } else {
            setConversations(prev => prev.map(c => {
                if (c.id === conversationId) {
                    const newTitle = c.messages.length === 0 ? trimmedInput.substring(0, 30) + (trimmedInput.length > 30 ? '...' : '') : c.title;
                    return { ...c, title: newTitle, messages: [...c.messages, userMessage, modelMessage] };
                }
                return c;
            }));
        }
    
        setIsChatLoading(true);
    
        try {
            const currentConversation = conversations.find(c => c.id === conversationId) 
                || { id: conversationId, title: 'Error', messages: [userMessage] }; // Fallback

            const chatToUse = getChatInstance(currentConversation);
            if (!chatToUse) throw new Error("Gagal memulai sesi obrolan.");
            
            const stream = await chatToUse.sendMessageStream({ message: trimmedInput });
            let accumulatedText = "";
            for await (const chunk of stream) {
                accumulatedText += chunk.text;
                setConversations(prev => prev.map(c => {
                    if (c.id === conversationId) {
                        return {
                            ...c,
                            messages: c.messages.map(m => m.id === modelMessage.id ? { ...m, content: accumulatedText } : m),
                        };
                    }
                    return c;
                }));
            }
        } catch (err) {
            console.error(err);
             setConversations(prev => prev.map(c => {
                if (c.id === conversationId) {
                    return {
                        ...c,
                        messages: c.messages.map(m => m.id === modelMessage.id ? { ...m, content: "Maaf, terjadi kesalahan." } : m),
                    };
                }
                return c;
            }));
        } finally {
            setIsChatLoading(false);
        }
    };
    
  return (
    <>
      <div className="h-screen flex flex-col font-sans bg-slate-900/50 relative">
        <AnimatePresence>
            {isAutoGeneratorVisible && (
                <div>
                    <AutoGeneratorView 
                        prompts={autoGenPrompts}
                        setPrompts={setAutoGenPrompts}
                        options={autoGenOptions}
                        setOptions={setAutoGenOptions}
                        onStart={startAutoGenerate}
                        disabled={isAutoGenerating}
                        onClose={() => setIsAutoGeneratorVisible(false)}
                        saveStatus={saveStatus}
                        projects={projects}
                        onSaveProject={handleSaveProject}
                        onLoadProject={handleLoadProject}
                        onDeleteProject={handleDeleteProject}
                    />
                </div>
            )}
        </AnimatePresence>

        {/* Main Navigation */}
        <nav className="sticky top-0 z-30 border-b border-cyan-500/10 bg-slate-900/80 backdrop-blur-lg">
          <div className="w-full mx-auto px-4 flex justify-between items-center">
             {/* Left Side: Brand and Tools */}
            <div className="flex items-center gap-3">
                <motion.button 
                  onClick={togglePopup}
                  whileTap={{ scale: 0.9 }}
                  className="cursor-pointer p-2"
                  aria-label="Buka menu cepat"
                >
                  <GearIcon className={`w-6 h-6 text-slate-300 hover:text-cyan-300 transition-colors ${isAnyLoading ? 'animate-spin-slow' : ''}`} />
                </motion.button>
                <div className="glitch-wrapper cursor-pointer hidden sm:block" onClick={handleToggleFullscreen} title="Toggle Fullscreen">
                  <h1
                    className="glitch font-mono text-xl font-bold tracking-wider"
                    data-text="RYAD TOOLS"
                  >
                    RYAD TOOLS
                  </h1>
                </div>
            </div>

            {/* Center: Navigation */}
            <div className="flex justify-center items-center gap-2 sm:gap-4">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setAppMode(item.id as AppMode); setNotifications(prev => ({...prev, [item.id]: false})); }}
                  className={`relative flex-1 sm:flex-initial flex flex-col sm:flex-row items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-3 transition-colors text-sm font-medium border-b-2 ${appMode === item.id ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-t-md'}`}
                >
                  <item.icon className="w-5 h-5"/>
                  <span className="hidden md:inline">{item.label}</span>
                  {notifications[item.id as AppMode] && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </button>
              ))}
            </div>

             {/* Right side: Spacer */}
            <div className="flex items-center gap-3 invisible" aria-hidden="true">
                <div className="p-2"><GearIcon className="w-6 h-6" /></div>
                <div className="glitch-wrapper hidden sm:block">
                     <h1 className="font-mono text-xl font-bold tracking-wider">
                        RYAD TOOLS
                    </h1>
                </div>
            </div>
          </div>
        </nav>

        <main className={`flex-grow ${appMode === 'chat' ? 'overflow-hidden' : 'overflow-y-auto'} p-4 sm:p-6`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={appMode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={appMode === 'chat' ? 'h-full' : ''}
            >
              {appMode === 'videoGenerator' && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Left Column: Controls */}
                    <div className="lg:col-span-2 space-y-8 self-start">
                        <GeneratorForm
                            onGenerate={handleGenerateVideo}
                            disabled={isVideoLoading}
                            prompt={videoPrompt}
                            onPromptChange={setVideoPrompt}
                            image={referenceImage}
                            imagePreview={referenceImagePreview}
                            onImageChange={handleSetReferenceImage}
                            onSelectForPreview={setSelectedImagePreview}
                            promptHistory={promptHistory}
                            onSelectFromHistory={setVideoPrompt}
                            onDeleteHistoryItem={deleteHistoryItem}
                            onClearHistory={clearHistory}
                            isAutoGenerating={isAutoGenerating}
                            onFocusAutoGenerator={() => setIsAutoGeneratorVisible(true)}
                        />
                         <ApiKeyManager
                            apiKey1={apiKey1}
                            setApiKey1={setApiKey1}
                            apiKey2={apiKey2}
                            setApiKey2={setApiKey2}
                            defaultApiKeyIndex={defaultApiKeyIndex}
                            setDefaultApiKeyIndex={setDefaultApiKeyIndex}
                            youtubeApiKey={youtubeApiKey}
                            setYoutubeApiKey={setYoutubeApiKey}
                            disabled={isAnyLoading}
                        />
                    </div>
                    {/* Right Column: Results */}
                    <div ref={resultsRef} className="lg:col-span-3 w-full self-start">
                        {isAutoGenerating ? (
                            <div className="flex items-center justify-center min-h-[50vh]">
                                <Loader message={autoGenLoadingMessage} />
                            </div>
                        ) : isVideoLoading ? (
                            <div className="flex items-center justify-center min-h-[50vh]">
                                <Loader message={videoLoadingMessage || "Membuat video..."} />
                            </div>
                        ) : videoError ? (
                            <div className="flex items-center justify-center min-h-[50vh]">
                                {videoError === 'API_KEY_EXHAUSTED' ? <ApiKeyExhaustedAnimation /> : <p className="text-red-400 text-center font-mono">{videoError}</p>}
                            </div>
                        ) : (
                            <div className="space-y-12">
                                {/* Display single result if it exists */}
                                {videoResult && videoMetadata && (
                                    <div className="w-full">
                                        <h2 className="text-2xl font-semibold text-center text-slate-200 border-b border-cyan-500/20 pb-4 mb-6">
                                            Hasil Video Terakhir
                                        </h2>
                                        <VideoResultDisplay 
                                            ref={videoPlayerRef}
                                            result={videoResult} 
                                            metadata={videoMetadata}
                                            onReferenceImageChange={handleSetReferenceImage}
                                        />
                                    </div>
                                )}
                                {/* Display auto-gen results if they exist */}
                                {autoGenResults.length > 0 && (
                                    <AutoGenResultGrid results={autoGenResults} />
                                )}
                                {/* Display placeholder only if there are NO results at all */}
                                {!videoResult && autoGenResults.length === 0 && (
                                    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center text-slate-600">
                                        <FilmIcon className="w-16 h-16 mx-auto mb-2" />
                                        <p>Hasil video akan muncul di sini.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
              )}
              {appMode === 'imageGenerator' && (
                <ImageGeneratorView
                    isLoading={isImageLoading}
                    error={imageError}
                    history={imageGenerationHistory}
                    onGenerate={handleGenerateImage}
                    onTransfer={(base64) => {
                        const byteString = atob(base64);
                        const ab = new ArrayBuffer(byteString.length);
                        const ia = new Uint8Array(ab);
                        for (let i = 0; i < byteString.length; i++) {
                            ia[i] = byteString.charCodeAt(i);
                        }
                        const blob = new Blob([ab], {type: 'image/png'});
                        const file = new File([blob], "transferred-image.png", {type: "image/png"});
                        handleSetReferenceImage(file);
                        setAppMode('videoGenerator');
                        Swal.fire('Gambar Ditransfer!', 'Gambar telah ditetapkan sebagai referensi di Generator Video.', 'success');
                    }}
                    referenceImage={characterReferenceImage}
                    referenceImagePreview={characterReferenceImagePreview}
                    onReferenceImageChange={handleSetCharacterReferenceImage}
                    onSelectForPreview={setSelectedImagePreview}
                    resultsContainerRef={imageResultsRef}
                />
              )}
              {appMode === 'promptGenerator' && (
                <PromptGenerator
                    onApplyPrompt={(prompt) => {
                        setVideoPrompt(prompt);
                        setAppMode('videoGenerator');
                    }}
                    characters={characters}
                    setCharacters={setCharacters}
                    dialogues={dialogues}
                    setDialogues={setDialogues}
                    environment={environment}
                    setEnvironment={setEnvironment}
                    isGenerating={isPromptGenerating}
                    onGenerate={handleGenerateVEOPrompt}
                    promptOutput={promptOutput}
                />
              )}
              {appMode === 'chat' && (
                <div className="flex h-full -m-4 sm:-m-6">
                   <ChatSidebar
                        conversations={conversations}
                        activeConversationId={activeConversationId}
                        onNewChat={handleNewChat}
                        onSelectConversation={handleSelectConversation}
                        onDeleteConversation={handleDeleteConversation}
                        onClearAll={handleClearAllConversations}
                        isOpen={isSidebarOpen}
                    />
                    <div className="flex-1 min-w-0">
                       <ChatView
                            messages={activeConversation?.messages || []}
                            onSendMessage={handleSendMessage}
                            isLoading={isChatLoading}
                            onDeleteMessage={handleDeleteMessage}
                            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                            onSelectForPreview={setSelectedImagePreview}
                        />
                    </div>
                </div>
               )}
              {appMode === 'scanImage' && (
                <AiToolsView
                    image={scanImage}
                    isLoading={isScanningImage}
                    error={scanImageError}
                    imagePreview={scanImagePreview}
                    scanResult={scanResult}
                    expandedImageResult={expandedImageResult}
                    onImageUpload={handleScanImageUpload}
                    onExtractText={handleExtractText}
                    onGeneratePrompt={handleGeneratePromptFromImage}
                    onExpandImage={handleExpandImage}
                    onClear={handleClearScan}
                    onSelectForPreview={setSelectedImagePreview}
                />
              )}
              {appMode === 'youtubeTool' && <YouTubeToolView />}
              {appMode === 'ffmpeg' && <FfmpegToolView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
          {selectedImagePreview && (
              <ImagePreviewModal
                  imageUrl={selectedImagePreview}
                  onClose={() => setSelectedImagePreview(null)}
              />
          )}
      </AnimatePresence>
    </>
  );
};

export default App;