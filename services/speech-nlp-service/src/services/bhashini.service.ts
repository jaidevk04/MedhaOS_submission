import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import { config } from '../config';
import {
  SpeechToTextRequest,
  SpeechToTextResponse,
  TextToSpeechRequest,
  TextToSpeechResponse,
  TranslationRequest,
  TranslationResponse,
  BhashiniAPIRequest,
  BhashiniAPIResponse,
} from '../types';

export class BhashiniService {
  private client: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: config.bhashini.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Authenticate with Bhashini API
   */
  private async authenticate(): Promise<string> {
    if (this.authToken) {
      return this.authToken;
    }

    try {
      // Bhashini uses API key-based authentication
      this.authToken = config.bhashini.apiKey;
      return this.authToken;
    } catch (error) {
      console.error('Bhashini authentication failed:', error);
      throw new Error('Failed to authenticate with Bhashini API');
    }
  }

  /**
   * Speech-to-Text conversion using Bhashini
   */
  async speechToText(request: SpeechToTextRequest): Promise<SpeechToTextResponse> {
    const startTime = Date.now();

    try {
      await this.authenticate();

      // Convert audio to base64 if it's a Buffer
      const audioContent = Buffer.isBuffer(request.audioData)
        ? request.audioData.toString('base64')
        : request.audioData;

      const bhashiniRequest: BhashiniAPIRequest = {
        pipelineTasks: [
          {
            taskType: 'asr', // Automatic Speech Recognition
            config: {
              language: {
                sourceLanguage: request.sourceLanguage,
              },
              audioFormat: request.audioFormat || 'wav',
              samplingRate: request.sampleRate || 16000,
            },
          },
        ],
        inputData: {
          audio: [
            {
              audioContent,
            },
          ],
        },
      };

      const response = await this.client.post<BhashiniAPIResponse>(
        '/compute',
        bhashiniRequest,
        {
          headers: {
            'Authorization': this.authToken,
            'ulcaApiKey': config.bhashini.apiKey,
            'userID': config.bhashini.userId,
          },
        }
      );

      const asrOutput = response.data.pipelineResponse.find(
        (task) => task.taskType === 'asr'
      );

      if (!asrOutput || !asrOutput.output || asrOutput.output.length === 0) {
        throw new Error('No transcription output from Bhashini');
      }

      const transcription = asrOutput.output[0].source;
      const processingTime = Date.now() - startTime;

      return {
        transcription,
        confidence: 0.9, // Bhashini doesn't provide confidence scores directly
        detectedLanguage: request.sourceLanguage,
        duration: 0, // Would need to calculate from audio
        processingTime,
      };
    } catch (error) {
      console.error('Bhashini STT error:', error);
      throw new Error(`Speech-to-text conversion failed: ${error}`);
    }
  }

  /**
   * Text-to-Speech conversion using Bhashini
   */
  async textToSpeech(request: TextToSpeechRequest): Promise<TextToSpeechResponse> {
    const startTime = Date.now();

    try {
      await this.authenticate();

      const bhashiniRequest: BhashiniAPIRequest = {
        pipelineTasks: [
          {
            taskType: 'tts', // Text-to-Speech
            config: {
              language: {
                sourceLanguage: request.targetLanguage,
              },
              serviceId: request.voice === 'female' ? 'ai4bharat-tts-female' : 'ai4bharat-tts-male',
            },
          },
        ],
        inputData: {
          input: [
            {
              source: request.text,
            },
          ],
        },
      };

      const response = await this.client.post<BhashiniAPIResponse>(
        '/compute',
        bhashiniRequest,
        {
          headers: {
            'Authorization': this.authToken,
            'ulcaApiKey': config.bhashini.apiKey,
            'userID': config.bhashini.userId,
          },
        }
      );

      const ttsOutput = response.data.pipelineResponse.find(
        (task) => task.taskType === 'tts'
      );

      if (!ttsOutput || !ttsOutput.audio || ttsOutput.audio.length === 0) {
        throw new Error('No audio output from Bhashini');
      }

      const audioContent = ttsOutput.audio[0].audioContent;
      const audioBuffer = Buffer.from(audioContent, 'base64');
      const processingTime = Date.now() - startTime;

      return {
        audioData: audioBuffer,
        audioFormat: 'wav',
        duration: 0, // Would need to calculate from audio
        processingTime,
      };
    } catch (error) {
      console.error('Bhashini TTS error:', error);
      throw new Error(`Text-to-speech conversion failed: ${error}`);
    }
  }

  /**
   * Translate text between languages using Bhashini
   */
  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    const startTime = Date.now();

    try {
      await this.authenticate();

      const bhashiniRequest: BhashiniAPIRequest = {
        pipelineTasks: [
          {
            taskType: 'translation',
            config: {
              language: {
                sourceLanguage: request.sourceLanguage,
                targetLanguage: request.targetLanguage,
              },
            },
          },
        ],
        inputData: {
          input: [
            {
              source: request.text,
            },
          ],
        },
      };

      const response = await this.client.post<BhashiniAPIResponse>(
        '/compute',
        bhashiniRequest,
        {
          headers: {
            'Authorization': this.authToken,
            'ulcaApiKey': config.bhashini.apiKey,
            'userID': config.bhashini.userId,
          },
        }
      );

      const translationOutput = response.data.pipelineResponse.find(
        (task) => task.taskType === 'translation'
      );

      if (!translationOutput || !translationOutput.output || translationOutput.output.length === 0) {
        throw new Error('No translation output from Bhashini');
      }

      const translatedText = translationOutput.output[0].source;
      const processingTime = Date.now() - startTime;

      return {
        translatedText,
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage,
        confidence: 0.9,
        processingTime,
      };
    } catch (error) {
      console.error('Bhashini translation error:', error);
      throw new Error(`Translation failed: ${error}`);
    }
  }

  /**
   * Combined STT + Translation pipeline
   */
  async speechToTextWithTranslation(
    audioData: Buffer | string,
    sourceLanguage: string,
    targetLanguage: string,
    audioFormat?: string
  ): Promise<{ original: SpeechToTextResponse; translated: TranslationResponse }> {
    // First, convert speech to text
    const sttResult = await this.speechToText({
      audioData,
      sourceLanguage,
      audioFormat: audioFormat as any,
    });

    // Then translate if needed
    if (sourceLanguage !== targetLanguage) {
      const translationResult = await this.translate({
        text: sttResult.transcription,
        sourceLanguage,
        targetLanguage,
      });

      return {
        original: sttResult,
        translated: translationResult,
      };
    }

    return {
      original: sttResult,
      translated: {
        translatedText: sttResult.transcription,
        sourceLanguage,
        targetLanguage,
        confidence: sttResult.confidence,
        processingTime: 0,
      },
    };
  }
}
