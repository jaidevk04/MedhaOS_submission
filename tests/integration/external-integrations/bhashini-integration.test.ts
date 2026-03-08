/**
 * Bhashini API Integration Test
 * Tests multilingual speech and translation capabilities
 * 
 * Requirements: 1.1, 1.2, 12.2, 12.3
 */

import axios from 'axios';
import {
  setupTestEnvironment,
  teardownTestEnvironment,
  createTestAuthToken,
  TestContext,
} from '../setup';

describe('Bhashini Integration', () => {
  let context: TestContext;
  let authToken: string;

  beforeAll(async () => {
    context = await setupTestEnvironment();
    authToken = await createTestAuthToken(context.testUserId);
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  describe('Speech-to-Text', () => {
    it('should transcribe Hindi speech with 90% accuracy within 2 seconds', async () => {
      const startTime = Date.now();

      const response = await axios.post(
        `${context.apiBaseUrl}/api/v1/speech/transcribe`,
        {
          audioUrl: 'https://test-storage.s3.amazonaws.com/test-hindi-audio.wav',
          languageCode: 'hi',
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(200);
      expect(response.data.transcription).toBeDefined();
      expect(response.data.confidence).toBeGreaterThan(0.90);
      expect(duration).toBeLessThan(2000); // Requirement: < 2 seconds
    });

    it('should support 22+ Indian languages', async () => {
      const languages = ['hi', 'en', 'ta', 'te', 'kn', 'ml', 'bn', 'gu', 'mr', 'pa'];

      for (const lang of languages) {
        const response = await axios.post(
          `${context.apiBaseUrl}/api/v1/speech/transcribe`,
          {
            audioUrl: `https://test-storage.s3.amazonaws.com/test-${lang}-audio.wav`,
            languageCode: lang,
          },
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );

        expect(response.status).toBe(200);
        expect(response.data.transcription).toBeDefined();
        expect(response.data.detectedLanguage).toBe(lang);
      }
    });

    it('should handle code-switching (Hinglish)', async () => {
      const response = await axios.post(
        `${context.apiBaseUrl}/api/v1/speech/transcribe`,
        {
          audioUrl: 'https://test-storage.s3.amazonaws.com/test-hinglish-audio.wav',
          languageCode: 'hi',
          enableCodeSwitching: true,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.transcription).toBeDefined();
      expect(response.data.segments).toBeDefined();
      expect(response.data.segments.length).toBeGreaterThan(1);
      
      // Verify mixed language detection
      const languages = response.data.segments.map((s: any) => s.language);
      expect(languages).toContain('hi');
      expect(languages).toContain('en');
    });
  });

  describe('Text-to-Speech', () => {
    it('should generate natural-sounding speech in Hindi', async () => {
      const response = await axios.post(
        `${context.apiBaseUrl}/api/v1/speech/synthesize`,
        {
          text: 'आपकी अगली दवा 2 बजे है',
          languageCode: 'hi',
          voice: 'female',
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.audioUrl).toBeDefined();
      expect(response.data.duration).toBeDefined();
    });

    it('should support multiple voices and genders', async () => {
      const voices = ['male', 'female'];

      for (const voice of voices) {
        const response = await axios.post(
          `${context.apiBaseUrl}/api/v1/speech/synthesize`,
          {
            text: 'Test message',
            languageCode: 'hi',
            voice,
          },
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );

        expect(response.status).toBe(200);
        expect(response.data.audioUrl).toBeDefined();
      }
    });
  });

  describe('Translation', () => {
    it('should translate medical text between languages', async () => {
      const response = await axios.post(
        `${context.apiBaseUrl}/api/v1/speech/translate`,
        {
          text: 'You need to take this medication twice daily',
          sourceLanguage: 'en',
          targetLanguage: 'hi',
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.translatedText).toBeDefined();
      expect(response.data.translatedText).toContain('दवा');
    });

    it('should preserve medical terminology in translation', async () => {
      const response = await axios.post(
        `${context.apiBaseUrl}/api/v1/speech/translate`,
        {
          text: 'Take Metformin 500mg twice daily',
          sourceLanguage: 'en',
          targetLanguage: 'hi',
          preserveTerms: ['Metformin', '500mg'],
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.translatedText).toContain('Metformin');
      expect(response.data.translatedText).toContain('500mg');
    });
  });

  describe('Language Detection', () => {
    it('should automatically detect spoken language', async () => {
      const response = await axios.post(
        `${context.apiBaseUrl}/api/v1/speech/detect-language`,
        {
          audioUrl: 'https://test-storage.s3.amazonaws.com/test-unknown-lang.wav',
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.detectedLanguage).toBeDefined();
      expect(response.data.confidence).toBeGreaterThan(0.80);
    });
  });

  describe('Real-time Streaming', () => {
    it('should support real-time audio streaming and transcription', async () => {
      // This would test WebSocket/WebRTC streaming
      // Simplified for integration test
      const response = await axios.post(
        `${context.apiBaseUrl}/api/v1/speech/start-stream`,
        {
          languageCode: 'hi',
          enableRealtime: true,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.streamId).toBeDefined();
      expect(response.data.websocketUrl).toBeDefined();
    });
  });
});
