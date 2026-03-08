import { CodeSwitchingRequest, CodeSwitchingResponse } from '../types';
import { LanguageDetectionService } from './language-detection.service';
import { BhashiniService } from './bhashini.service';

export class CodeSwitchingService {
  private languageDetection: LanguageDetectionService;
  private bhashini: BhashiniService;

  constructor() {
    this.languageDetection = new LanguageDetectionService();
    this.bhashini = new BhashiniService();
  }

  /**
   * Handle code-switching text (e.g., Hinglish, Tamlish)
   * Identifies language segments and provides unified translation
   */
  async handleCodeSwitching(request: CodeSwitchingRequest): Promise<CodeSwitchingResponse> {
    const { text, primaryLanguage, secondaryLanguage } = request;

    // Detect code-switching patterns
    const codeSwitchingResult = await this.languageDetection.detectCodeSwitching(text);

    if (!codeSwitchingResult.hasCodeSwitching) {
      // No code-switching detected, treat as single language
      return {
        segments: [
          {
            text,
            language: primaryLanguage,
            startIndex: 0,
            endIndex: text.length,
          },
        ],
        primaryLanguage,
        secondaryLanguage,
        mixRatio: 100,
      };
    }

    // Build segments with language identification
    const segments: Array<{
      text: string;
      language: string;
      startIndex: number;
      endIndex: number;
    }> = [];

    let currentIndex = 0;
    let primaryCount = 0;
    let secondaryCount = 0;

    for (const segment of codeSwitchingResult.segments) {
      const startIndex = text.indexOf(segment.text, currentIndex);
      const endIndex = startIndex + segment.text.length;

      const detectedLang = segment.language;
      const language = this.mapToRequestedLanguage(
        detectedLang,
        primaryLanguage,
        secondaryLanguage
      );

      segments.push({
        text: segment.text,
        language,
        startIndex,
        endIndex,
      });

      if (language === primaryLanguage) {
        primaryCount++;
      } else {
        secondaryCount++;
      }

      currentIndex = endIndex;
    }

    const totalCount = primaryCount + secondaryCount;
    const mixRatio = totalCount > 0 ? (primaryCount / totalCount) * 100 : 50;

    return {
      segments,
      primaryLanguage,
      secondaryLanguage,
      mixRatio,
    };
  }

  /**
   * Translate code-switched text to a target language
   */
  async translateCodeSwitchedText(
    text: string,
    primaryLanguage: string,
    secondaryLanguage: string,
    targetLanguage: string
  ): Promise<string> {
    // Handle code-switching
    const codeSwitchingResult = await this.handleCodeSwitching({
      text,
      primaryLanguage,
      secondaryLanguage,
    });

    // Translate each segment
    const translatedSegments: string[] = [];

    for (const segment of codeSwitchingResult.segments) {
      if (segment.language === targetLanguage) {
        // Already in target language
        translatedSegments.push(segment.text);
      } else {
        // Translate segment
        try {
          const translation = await this.bhashini.translate({
            text: segment.text,
            sourceLanguage: segment.language,
            targetLanguage,
          });
          translatedSegments.push(translation.translatedText);
        } catch (error) {
          console.error(`Translation failed for segment: ${segment.text}`, error);
          // Fallback to original text
          translatedSegments.push(segment.text);
        }
      }
    }

    return translatedSegments.join(' ');
  }

  /**
   * Normalize code-switched text to primary language
   */
  async normalizeCodeSwitchedText(
    text: string,
    primaryLanguage: string,
    secondaryLanguage: string
  ): Promise<string> {
    return this.translateCodeSwitchedText(
      text,
      primaryLanguage,
      secondaryLanguage,
      primaryLanguage
    );
  }

  /**
   * Map detected language to requested language pair
   */
  private mapToRequestedLanguage(
    detectedLanguage: string,
    primaryLanguage: string,
    secondaryLanguage: string
  ): string {
    // Simple heuristic: if detected language matches primary or secondary, use it
    // Otherwise, default to primary
    if (detectedLanguage === primaryLanguage || detectedLanguage === secondaryLanguage) {
      return detectedLanguage;
    }

    // Check if detected language is similar to primary or secondary
    // For example, 'en' might be detected as 'en-US' or 'en-GB'
    if (detectedLanguage.startsWith(primaryLanguage)) {
      return primaryLanguage;
    }
    if (detectedLanguage.startsWith(secondaryLanguage)) {
      return secondaryLanguage;
    }

    // Default to primary language
    return primaryLanguage;
  }

  /**
   * Get statistics about code-switching in text
   */
  async getCodeSwitchingStats(
    text: string,
    primaryLanguage: string,
    secondaryLanguage: string
  ): Promise<{
    totalWords: number;
    primaryLanguageWords: number;
    secondaryLanguageWords: number;
    mixRatio: number;
    switchPoints: number;
  }> {
    const result = await this.handleCodeSwitching({
      text,
      primaryLanguage,
      secondaryLanguage,
    });

    const primaryWords = result.segments.filter(
      (s) => s.language === primaryLanguage
    ).length;
    const secondaryWords = result.segments.filter(
      (s) => s.language === secondaryLanguage
    ).length;
    const totalWords = result.segments.length;

    // Count switch points (transitions between languages)
    let switchPoints = 0;
    for (let i = 1; i < result.segments.length; i++) {
      if (result.segments[i].language !== result.segments[i - 1].language) {
        switchPoints++;
      }
    }

    return {
      totalWords,
      primaryLanguageWords: primaryWords,
      secondaryLanguageWords: secondaryWords,
      mixRatio: result.mixRatio,
      switchPoints,
    };
  }
}
