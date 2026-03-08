export interface SpeechToTextRequest {
  audioData: Buffer | string; // Base64 or Buffer
  sourceLanguage: string;
  audioFormat?: 'wav' | 'mp3' | 'flac' | 'ogg';
  sampleRate?: number;
}

export interface SpeechToTextResponse {
  transcription: string;
  confidence: number;
  detectedLanguage: string;
  duration: number;
  processingTime: number;
}

export interface TextToSpeechRequest {
  text: string;
  targetLanguage: string;
  voice?: 'male' | 'female';
  speed?: number; // 0.5 to 2.0
}

export interface TextToSpeechResponse {
  audioData: Buffer;
  audioFormat: string;
  duration: number;
  processingTime: number;
}

export interface LanguageDetectionRequest {
  text: string;
}

export interface LanguageDetectionResponse {
  detectedLanguage: string;
  confidence: number;
  alternativeLanguages: Array<{
    language: string;
    confidence: number;
  }>;
}

export interface TranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface TranslationResponse {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  processingTime: number;
}

export interface CodeSwitchingRequest {
  text: string;
  primaryLanguage: string;
  secondaryLanguage: string;
}

export interface CodeSwitchingResponse {
  segments: Array<{
    text: string;
    language: string;
    startIndex: number;
    endIndex: number;
  }>;
  primaryLanguage: string;
  secondaryLanguage: string;
  mixRatio: number; // Percentage of primary language
}

export interface BhashiniAPIRequest {
  pipelineTasks: Array<{
    taskType: string;
    config: {
      language: {
        sourceLanguage: string;
        targetLanguage?: string;
      };
      serviceId?: string;
      audioFormat?: string;
      samplingRate?: number;
    };
  }>;
  inputData: {
    audio?: Array<{
      audioContent: string;
    }>;
    input?: Array<{
      source: string;
    }>;
  };
}

export interface BhashiniAPIResponse {
  pipelineResponse: Array<{
    taskType: string;
    output?: Array<{
      source: string;
    }>;
    audio?: Array<{
      audioContent: string;
    }>;
    config?: {
      language: {
        sourceLanguage: string;
        targetLanguage?: string;
      };
    };
  }>;
}

export interface LanguageCode {
  code: string;
  name: string;
  nativeName: string;
  script: string;
}

export const SUPPORTED_LANGUAGES: Record<string, LanguageCode> = {
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', script: 'Devanagari' },
  en: { code: 'en', name: 'English', nativeName: 'English', script: 'Latin' },
  ta: { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', script: 'Tamil' },
  te: { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', script: 'Telugu' },
  kn: { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', script: 'Kannada' },
  ml: { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', script: 'Malayalam' },
  bn: { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', script: 'Bengali' },
  gu: { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', script: 'Gujarati' },
  mr: { code: 'mr', name: 'Marathi', nativeName: 'मराठी', script: 'Devanagari' },
  pa: { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', script: 'Gurmukhi' },
  or: { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', script: 'Odia' },
  as: { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', script: 'Bengali' },
  ur: { code: 'ur', name: 'Urdu', nativeName: 'اردو', script: 'Arabic' },
  sa: { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', script: 'Devanagari' },
  ks: { code: 'ks', name: 'Kashmiri', nativeName: 'कॉशुर', script: 'Devanagari' },
  ne: { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', script: 'Devanagari' },
  sd: { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي', script: 'Arabic' },
  kok: { code: 'kok', name: 'Konkani', nativeName: 'कोंकणी', script: 'Devanagari' },
  mai: { code: 'mai', name: 'Maithili', nativeName: 'मैथिली', script: 'Devanagari' },
  doi: { code: 'doi', name: 'Dogri', nativeName: 'डोगरी', script: 'Devanagari' },
  mni: { code: 'mni', name: 'Manipuri', nativeName: 'মৈতৈলোন্', script: 'Bengali' },
  sat: { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ', script: 'Ol Chiki' },
};
