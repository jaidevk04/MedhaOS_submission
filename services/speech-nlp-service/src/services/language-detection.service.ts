import { LanguageDetectionRequest, LanguageDetectionResponse, SUPPORTED_LANGUAGES } from '../types';

export class LanguageDetectionService {
  /**
   * Detect language from text using character-based heuristics
   * This is a simple implementation - in production, use a proper language detection library
   */
  async detectLanguage(request: LanguageDetectionRequest): Promise<LanguageDetectionResponse> {
    const text = request.text.trim();

    if (!text) {
      return {
        detectedLanguage: 'en',
        confidence: 0.5,
        alternativeLanguages: [],
      };
    }

    const scores: Record<string, number> = {};

    // Check for script-specific characters
    for (const [code, lang] of Object.entries(SUPPORTED_LANGUAGES)) {
      scores[code] = this.calculateLanguageScore(text, lang.script);
    }

    // Sort by score
    const sortedLanguages = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .filter(([, score]) => score > 0);

    if (sortedLanguages.length === 0) {
      return {
        detectedLanguage: 'en',
        confidence: 0.5,
        alternativeLanguages: [],
      };
    }

    const [detectedCode, detectedScore] = sortedLanguages[0];
    const totalScore = sortedLanguages.reduce((sum, [, score]) => sum + score, 0);
    const confidence = totalScore > 0 ? detectedScore / totalScore : 0.5;

    const alternativeLanguages = sortedLanguages
      .slice(1, 4)
      .map(([code, score]) => ({
        language: code,
        confidence: totalScore > 0 ? score / totalScore : 0,
      }));

    return {
      detectedLanguage: detectedCode,
      confidence,
      alternativeLanguages,
    };
  }

  /**
   * Calculate language score based on script
   */
  private calculateLanguageScore(text: string, script: string): number {
    let score = 0;

    switch (script) {
      case 'Devanagari':
        // Hindi, Marathi, Sanskrit, Nepali, etc.
        score = this.countCharactersInRange(text, 0x0900, 0x097F);
        break;
      case 'Tamil':
        score = this.countCharactersInRange(text, 0x0B80, 0x0BFF);
        break;
      case 'Telugu':
        score = this.countCharactersInRange(text, 0x0C00, 0x0C7F);
        break;
      case 'Kannada':
        score = this.countCharactersInRange(text, 0x0C80, 0x0CFF);
        break;
      case 'Malayalam':
        score = this.countCharactersInRange(text, 0x0D00, 0x0D7F);
        break;
      case 'Bengali':
        // Bengali, Assamese
        score = this.countCharactersInRange(text, 0x0980, 0x09FF);
        break;
      case 'Gujarati':
        score = this.countCharactersInRange(text, 0x0A80, 0x0AFF);
        break;
      case 'Gurmukhi':
        // Punjabi
        score = this.countCharactersInRange(text, 0x0A00, 0x0A7F);
        break;
      case 'Odia':
        score = this.countCharactersInRange(text, 0x0B00, 0x0B7F);
        break;
      case 'Arabic':
        // Urdu, Sindhi
        score = this.countCharactersInRange(text, 0x0600, 0x06FF);
        break;
      case 'Ol Chiki':
        // Santali
        score = this.countCharactersInRange(text, 0x1C50, 0x1C7F);
        break;
      case 'Latin':
        // English
        score = this.countCharactersInRange(text, 0x0041, 0x007A);
        break;
      default:
        score = 0;
    }

    return score;
  }

  /**
   * Count characters in a Unicode range
   */
  private countCharactersInRange(text: string, start: number, end: number): number {
    let count = 0;
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code >= start && code <= end) {
        count++;
      }
    }
    return count;
  }

  /**
   * Detect code-switching (mixing of languages)
   */
  async detectCodeSwitching(text: string): Promise<{
    hasCodeSwitching: boolean;
    languages: string[];
    segments: Array<{ text: string; language: string }>;
  }> {
    const words = text.split(/\s+/);
    const segments: Array<{ text: string; language: string }> = [];
    const detectedLanguages = new Set<string>();

    for (const word of words) {
      const detection = await this.detectLanguage({ text: word });
      if (detection.confidence > 0.6) {
        segments.push({
          text: word,
          language: detection.detectedLanguage,
        });
        detectedLanguages.add(detection.detectedLanguage);
      }
    }

    return {
      hasCodeSwitching: detectedLanguages.size > 1,
      languages: Array.from(detectedLanguages),
      segments,
    };
  }
}
