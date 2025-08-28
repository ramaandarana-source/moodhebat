// Fix: Corrected the import path for the Google GenAI SDK.
import { GoogleGenAI, Type } from "@google/genai";
import type { GenerationOptions, VideoMetadata, Character, Dialogue, EnvironmentState, ImageGenerationOptions, ImageAspectRatio } from '../types';

let activeApiKey: string | null = null;

export const setApiKey = (key: string | null) => {
    activeApiKey = key && key.trim() ? key : null;
};

const getAi = (): GoogleGenAI => {
    const apiKey = activeApiKey;
    if (!apiKey) {
      throw new Error("API_KEY_NOT_SET");
    }
    return new GoogleGenAI({ apiKey });
};


export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = (reader.result as string).split(',')[1];
        if(result) {
            resolve(result);
        } else {
            reject(new Error("Gagal mengubah file ke base64."));
        }
    };
    reader.onerror = (error) => reject(error);
  });
};

export const generateVideo = async (
  options: GenerationOptions
): Promise<Blob> => {
  const ai = getAi();
  const imagePart = options.image
    ? {
        imageBytes: await fileToBase64(options.image),
        mimeType: options.image.type,
      }
    : undefined;

  let operation = await ai.models.generateVideos({
    model: 'veo-3.0-generate-preview',
    prompt: options.prompt,
    image: imagePart,
    config: {
      numberOfVideos: 1,
    },
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) {
    throw new Error("Generasi video gagal: Tautan unduhan tidak ditemukan.");
  }

  const response = await fetch(`${downloadLink}&key=${activeApiKey}`);
  if (!response.ok) {
    throw new Error(`Gagal mengunduh video: ${response.statusText}`);
  }
  
  return response.blob();
};

export const generateMetadata = async (prompt: string): Promise<VideoMetadata> => {
  const ai = getAi();
  const metadataPrompt = `
    Berdasarkan prompt video "${prompt}", buat metadata yang menarik dan teroptimasi untuk platform media sosial. Sediakan dalam format JSON terstruktur sebagai berikut:
    1.  Judul YouTube: Menarik, deskriptif, dan ramah SEO.
    2.  Judul TikTok: Singkat, tajam, dan menarik, cocok untuk format video vertikal.
    3.  Judul Instagram: Judul yang ringkas dan menarik secara visual untuk postingan atau Reel Instagram.
    4.  Judul Facebook: Judul yang sedikit lebih formal namun tetap menarik, cocok untuk feed Facebook.
    5.  Judul Shopee Affiliate: Judul yang berorientasi penjualan, mengajak, dan menyertakan kata kunci produk yang relevan.
    6.  Judul TikTok Affiliate: Judul yang mengikuti tren, singkat, dan memicu rasa ingin tahu, cocok untuk promosi produk di TikTok.
    7.  Daftar tag yang relevan (10-15 tag): Sertakan campuran kata kunci umum dan spesifik agar mudah ditemukan.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: metadataPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          youtubeTitle: { type: Type.STRING },
          tiktokTitle: { type: Type.STRING },
          instagramTitle: { type: Type.STRING },
          facebookTitle: { type: Type.STRING },
          shopeeAffiliateTitle: { type: Type.STRING },
          tiktokAffiliateTitle: { type: Type.STRING },
          tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ["youtubeTitle", "tiktokTitle", "instagramTitle", "facebookTitle", "shopeeAffiliateTitle", "tiktokAffiliateTitle", "tags"],
      },
    },
  });

  const jsonText = response.text.trim();
  return JSON.parse(jsonText) as VideoMetadata;
};

export const generateVEOPrompt = async (
    characters: Character[],
    dialogues: Dialogue[],
    environment: EnvironmentState
): Promise<{ indonesia: string, english: string, json: string }> => {
    const ai = getAi();
    
    const characterDescriptions = characters.map(c => {
        const ethnicity = c.ethnicity === 'Other' ? c.customEthnicity : c.ethnicity;
        return `- ${c.name}: Seorang ${c.gender} ${ethnicity} berusia ${c.age} tahun dengan rambut ${c.hair}, mengenakan ${c.outfit}. Suaranya ${c.voice}. Deskripsi: ${c.description}. Aksi: ${c.action}.`;
    }).join('\n');

    const dialogueScript = dialogues.map(d => {
        const character = characters.find(c => c.id === d.characterId);
        return `${character ? character.name : 'Tidak Dikenal'}: "${d.conversation}"`;
    }).join('\n');

    const promptData = {
        scene: {
            environment: environment.setting,
            lighting: environment.lighting,
            style: environment.style,
        },
        cinematography: {
            cameraAngle: environment.cameraAngle,
            cameraShot: environment.cameraShot,
        },
        characters: characters.map(c => ({
            name: c.name,
            details: {
                ethnicity: c.ethnicity === 'Other' ? c.customEthnicity : c.ethnicity,
                gender: c.gender,
                age: c.age,
                outfit: c.outfit,
                hair: c.hair,
                voice: c.voice,
            },
            description: c.description,
            action: c.action,
        })),
        dialogue: dialogues.map(d => {
             const character = characters.find(c => c.id === d.characterId);
             return { speaker: character ? character.name : 'Tidak Dikenal', line: d.conversation };
        })
    };

    const generationRequest = `
      Berdasarkan data terstruktur berikut, buat prompt video yang detail dan sinematik untuk model AI gaya VEO. Prompt harus berupa satu paragraf yang utuh yang dengan jelas mendeskripsikan adegan, karakter, aksi, dan pergerakan kamera.

      **Karakter:**
      ${characterDescriptions}

      **Dialog:**
      ${dialogueScript}

      **Latar & Sinematografi:**
      - Latar Tempat: ${environment.setting}
      - Pencahayaan: ${environment.lighting}
      - Sudut Kamera: ${environment.cameraAngle}
      - Tipe Shot Kamera: ${environment.cameraShot}
      - Gaya Keseluruhan: ${environment.style}

      Sekarang, sediakan dua versi prompt:
      1.  **Bahasa Indonesia:** Prompt sinematik yang hidup dalam Bahasa Indonesia.
      2.  **English:** Prompt sinematik yang hidup dalam Bahasa Inggris.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: generationRequest,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              indonesia: { type: Type.STRING, description: "Prompt sinematik akhir yang ditulis dalam Bahasa Indonesia." },
              english: { type: Type.STRING, description: "Prompt sinematik akhir yang ditulis dalam Bahasa Inggris." },
            },
            required: ["indonesia", "english"],
          }
        }
    });

    const jsonText = response.text.trim();
    const parsedResponse = JSON.parse(jsonText);

    return {
        indonesia: parsedResponse.indonesia,
        english: parsedResponse.english,
        json: JSON.stringify(promptData, null, 2),
    };
};

export const analyzePrompt = async (prompt: string): Promise<{ accuracyScore: number, suggestion: string }> => {
    const ai = getAi();
    if (prompt.trim().length < 10) {
        return { accuracyScore: 0, suggestion: "Prompt terlalu pendek untuk dianalisis." };
    }

    const analysisRequest = `
      Bertindak sebagai ahli rekayasa prompt untuk model AI generator video. Analisis prompt berikut: "${prompt}".
      
      Tugas Anda adalah:
      1. Berikan 'accuracyScore' antara 0 dan 100 yang mewakili seberapa efektif dan detail prompt ini untuk menghasilkan video sinematik berkualitas tinggi. Pertimbangkan penggunaan kata kunci sinematik (pencahayaan, sudut kamera, gaya), deskripsi detail, dan kejelasan.
      2. Berikan 'suggestion' singkat (maksimal 15 kata) dalam Bahasa Indonesia untuk meningkatkan prompt ini.
      
      Hanya berikan output dalam format JSON yang valid.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: analysisRequest,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    accuracyScore: { type: Type.NUMBER, description: "Skor dari 0-100." },
                    suggestion: { type: Type.STRING, description: "Saran perbaikan singkat dalam Bahasa Indonesia." },
                },
                required: ["accuracyScore", "suggestion"],
            }
        }
    });
    
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};

export const extractTextFromImage = async (imageFile: File): Promise<string> => {
    const ai = getAi();
    const imagePart = {
      inlineData: {
        mimeType: imageFile.type,
        data: await fileToBase64(imageFile),
      },
    };
    const extractionPrompt = "You are an Optical Character Recognition (OCR) tool. Your only task is to accurately extract any and all text from the provided image. If there is no text, respond with 'Tidak ada teks yang terdeteksi dalam gambar.'. Do not describe the image. Provide only the extracted text.";
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, { text: extractionPrompt }] },
    });
    return response.text.trim();
};

export const generatePromptFromImage = async (imageFile: File): Promise<string> => {
    const ai = getAi();
    const imagePart = {
      inlineData: {
        mimeType: imageFile.type,
        data: await fileToBase64(imageFile),
      },
    };
    const descriptionPrompt = "Analyze the provided image and generate a single, cohesive paragraph that is a ready-to-use, cinematic, and descriptive prompt in English for an AI image generator. IMPORTANT: Your entire response must ONLY be the prompt text itself. Do not include titles, headings, analysis, explanations, or any markdown formatting. If the image is not analyzable, your entire response should only be 'Gambar tidak dapat dianalisis.'";
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, { text: descriptionPrompt }] },
    });
    return response.text.trim();
};

export const expandImage = async (imageFile: File, aspectRatio: ImageAspectRatio): Promise<string> => {
    const ai = getAi();

    // Step 1: Generate a description of the image.
    const descriptionPrompt = await generatePromptFromImage(imageFile);

    if (descriptionPrompt === "Gambar tidak dapat dianalisis.") {
        throw new Error("Gambar tidak dapat dianalisis untuk diperluas.");
    }
    
    // Step 2: Create a new prompt for expansion.
    const expansionPrompt = `
        Based on the following description, recreate and expand the image, showing much more of the surrounding scene and environment. The original description is the central focus of a larger, wider picture. Maintain the original art style and mood.

        Original description: "${descriptionPrompt}"
    `;

    // Step 3: Generate the new image.
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: expansionPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: aspectRatio,
        },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error("Gagal memperluas gambar.");
    }

    return response.generatedImages[0].image.imageBytes; // returns base64 string
};

export const describeImageForPrompt = async (imageFile: File): Promise<string> => {
    const ai = getAi();
    const imagePart = {
        inlineData: {
            mimeType: imageFile.type,
            data: await fileToBase64(imageFile),
        },
    };
    const descriptionPrompt = "Analyze the person's face in this image. Provide a concise but detailed text description focusing ONLY on their facial features, bone structure, eye color, hairstyle, and any defining inherent characteristics. Your description must be very stable and reliable. EXPLICITLY IGNORE their clothing, pose, expression, and the background. The goal is to capture their core facial identity so their face can be used in a completely different scene. Provide only the description as a cohesive text.";
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: descriptionPrompt }] },
    });
    return response.text.trim();
};


export const generateImage = async (options: ImageGenerationOptions): Promise<string[]> => {
  const ai = getAi();
  const { prompt, aspectRatio, numberOfImages, style, referenceImage } = options;

  let characterDescription = '';
  if (referenceImage) {
      characterDescription = await describeImageForPrompt(referenceImage);
  }
  
  const finalPrompt = [characterDescription, prompt, style].filter(Boolean).join(', ');

  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: finalPrompt,
    config: {
      numberOfImages: numberOfImages,
      outputMimeType: 'image/png',
      aspectRatio: aspectRatio,
    },
  });

  if (!response.generatedImages || response.generatedImages.length === 0) {
    throw new Error("Generasi gambar gagal: Tidak ada gambar yang dikembalikan.");
  }

  const base64Images: string[] = response.generatedImages.map(img => img.image.imageBytes);
  return base64Images;
};

export const enhancePrompt = async (prompt: string): Promise<string> => {
    const ai = getAi();
    const enhanceRequest = `Bertindak sebagai ahli rekayasa prompt profesional. Sempurnakan prompt berikut untuk model AI generator gambar/video. Tambahkan detail teknis dan sinematik yang relevan (seperti komposisi, pencahayaan, gaya visual, detail lensa) untuk meningkatkan kualitas output. Hindari bahasa yang terlalu puitis atau berlebihan. Kembalikan hanya prompt yang telah disempurnakan. Prompt Asli: "${prompt}"`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: enhanceRequest,
    });
    return response.text.trim();
};

export const translatePrompt = async (prompt: string): Promise<string> => {
    const ai = getAi();
    const translateRequest = `Deteksi bahasa dari prompt berikut (antara Bahasa Indonesia dan Inggris). Jika Bahasa Indonesia, terjemahkan ke Bahasa Inggris. Jika Bahasa Inggris, terjemahkan ke Bahasa Indonesia. Kembalikan hanya teks yang sudah diterjemahkan. Prompt: "${prompt}"`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: translateRequest,
    });
    return response.text.trim();
};

export const translateAllPrompts = async (prompts: string[]): Promise<string[]> => {
    const ai = getAi();
    if (prompts.length === 0) return [];

    const translationRequest = `
    Translate each prompt in the following JSON array from its original language (likely Indonesian) to English.
    Return a JSON object with a single key "translations" which contains an array of the translated English strings.
    The order of the translated prompts must match the original order.
    Provide ONLY the JSON object as your response.

    Input Prompts:
    ${JSON.stringify(prompts)}
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: translationRequest,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    translations: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                },
                required: ["translations"]
            }
        }
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    
    if (Array.isArray(result.translations) && result.translations.length === prompts.length) {
        return result.translations;
    } else {
        throw new Error("Terjemahan gagal atau jumlah prompt yang dikembalikan tidak cocok.");
    }
};