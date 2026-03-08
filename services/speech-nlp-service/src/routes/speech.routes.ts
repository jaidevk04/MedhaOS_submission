import { Router, Request, Response } from 'express';
import multer from 'multer';
import { BhashiniService } from '../services/bhashini.service';
import { LanguageDetectionService } from '../services/language-detection.service';
import { CodeSwitchingService } from '../services/code-switching.service';
import { config } from '../config';

const router = Router();
const bhashiniService = new BhashiniService();
const languageDetectionService = new LanguageDetectionService();
const codeSwitchingService = new CodeSwitchingService();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.service.maxAudioSizeMB * 1024 * 1024, // Convert MB to bytes
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/flac', 'audio/ogg'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  },
});

/**
 * POST /api/speech/stt
 * Convert speech to text
 */
router.post('/stt', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const { sourceLanguage, audioFormat, sampleRate } = req.body;

    if (!sourceLanguage) {
      return res.status(400).json({ error: 'Source language is required' });
    }

    const result = await bhashiniService.speechToText({
      audioData: req.file.buffer,
      sourceLanguage,
      audioFormat: audioFormat || 'wav',
      sampleRate: sampleRate ? parseInt(sampleRate) : 16000,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('STT error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Speech-to-text conversion failed',
    });
  }
});

/**
 * POST /api/speech/tts
 * Convert text to speech
 */
router.post('/tts', async (req: Request, res: Response) => {
  try {
    const { text, targetLanguage, voice, speed } = req.body;

    if (!text || !targetLanguage) {
      return res.status(400).json({ error: 'Text and target language are required' });
    }

    const result = await bhashiniService.textToSpeech({
      text,
      targetLanguage,
      voice: voice || 'female',
      speed: speed || 1.0,
    });

    // Send audio as binary response
    res.set({
      'Content-Type': 'audio/wav',
      'Content-Length': result.audioData.length,
      'X-Processing-Time': result.processingTime.toString(),
    });

    res.send(result.audioData);
  } catch (error: any) {
    console.error('TTS error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Text-to-speech conversion failed',
    });
  }
});

/**
 * POST /api/speech/translate
 * Translate text between languages
 */
router.post('/translate', async (req: Request, res: Response) => {
  try {
    const { text, sourceLanguage, targetLanguage } = req.body;

    if (!text || !sourceLanguage || !targetLanguage) {
      return res.status(400).json({
        error: 'Text, source language, and target language are required',
      });
    }

    const result = await bhashiniService.translate({
      text,
      sourceLanguage,
      targetLanguage,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Translation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Translation failed',
    });
  }
});

/**
 * POST /api/speech/detect-language
 * Detect language from text
 */
router.post('/detect-language', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const result = await languageDetectionService.detectLanguage({ text });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Language detection error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Language detection failed',
    });
  }
});

/**
 * POST /api/speech/code-switching
 * Handle code-switching text (e.g., Hinglish)
 */
router.post('/code-switching', async (req: Request, res: Response) => {
  try {
    const { text, primaryLanguage, secondaryLanguage } = req.body;

    if (!text || !primaryLanguage || !secondaryLanguage) {
      return res.status(400).json({
        error: 'Text, primary language, and secondary language are required',
      });
    }

    const result = await codeSwitchingService.handleCodeSwitching({
      text,
      primaryLanguage,
      secondaryLanguage,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Code-switching error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Code-switching handling failed',
    });
  }
});

/**
 * POST /api/speech/stt-translate
 * Combined speech-to-text and translation
 */
router.post('/stt-translate', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const { sourceLanguage, targetLanguage, audioFormat } = req.body;

    if (!sourceLanguage || !targetLanguage) {
      return res.status(400).json({
        error: 'Source and target languages are required',
      });
    }

    const result = await bhashiniService.speechToTextWithTranslation(
      req.file.buffer,
      sourceLanguage,
      targetLanguage,
      audioFormat || 'wav'
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('STT+Translation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Speech-to-text with translation failed',
    });
  }
});

/**
 * GET /api/speech/supported-languages
 * Get list of supported languages
 */
router.get('/supported-languages', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      languages: config.service.supportedLanguages,
      defaultLanguage: config.service.defaultLanguage,
    },
  });
});

export default router;
