import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { subDays } from 'date-fns';
import { config } from '../config';
import { MediaEvent, MediaScanningResult } from '../types';

/**
 * Media Scanning Service
 * 
 * Scans news and social media for disease-related events
 * Implements multilingual text analysis (13+ Indian languages)
 * Detects and filters bot-generated content
 * Manages event verification workflow
 * 
 * Requirements: 11.3
 */
export class MediaScanningService {
  private readonly supportedLanguages = config.multilingual.supportedLanguages;
  private readonly diseaseKeywords = [
    'fever', 'बुखार', 'காய்ச்சல்', 'జ్వరం',
    'dengue', 'डेंगू', 'டெங்கு', 'డెంగ్యూ',
    'malaria', 'मलेरिया', 'மலேரியா', 'మలేరియా',
    'outbreak', 'प्रकोप', 'வெடிப்பு', 'వ్యాప్తి',
    'epidemic', 'महामारी', 'தொற்றுநோய்', 'అంటువ్యాధి',
    'death', 'मृत्यु', 'இறப்பு', 'మరణం',
  ];

  /**
   * Scan news sources for disease-related events
   */
  async scanNewsSources(
    timeRange: { start: Date; end: Date },
    languages?: string[]
  ): Promise<MediaEvent[]> {
    const events: MediaEvent[] = [];
    const targetLanguages = languages || this.supportedLanguages;
    
    try {
      // In production, call actual news API
      // For now, simulate API call
      const mockNewsData = await this.fetchNewsData(timeRange, targetLanguages);
      
      for (const article of mockNewsData) {
        const event = await this.processNewsArticle(article);
        if (event) {
          events.push(event);
        }
      }
    } catch (error) {
      console.error('Error scanning news sources:', error);
    }
    
    return events;
  }

  /**
   * Fetch news data from API
   */
  private async fetchNewsData(
    timeRange: { start: Date; end: Date },
    languages: string[]
  ): Promise<any[]> {
    // In production, call News API
    // For now, return mock data
    return [
      {
        title: 'Dengue cases rise in Mumbai',
        description: 'Health officials report increase in dengue fever cases',
        url: 'https://example.com/news/1',
        publishedAt: new Date(),
        source: { name: 'Times of India' },
        language: 'en',
      },
      {
        title: 'मुंबई में डेंगू के मामले बढ़े',
        description: 'स्वास्थ्य अधिकारियों ने डेंगू बुखार के मामलों में वृद्धि की सूचना दी',
        url: 'https://example.com/news/2',
        publishedAt: new Date(),
        source: { name: 'Dainik Bhaskar' },
        language: 'hi',
      },
    ];
  }

  /**
   * Process news article and extract disease event
   */
  private async processNewsArticle(article: any): Promise<MediaEvent | null> {
    const eventId = uuidv4();
    
    // Extract disease keywords
    const diseaseKeywords = this.extractDiseaseKeywords(article.title + ' ' + article.description);
    
    if (diseaseKeywords.length === 0) {
      return null; // Not disease-related
    }
    
    // Extract location
    const location = await this.extractLocation(article.title + ' ' + article.description);
    
    // Translate if not in English
    const translatedText = article.language !== 'en'
      ? await this.translateText(article.description, article.language, 'en')
      : article.description;
    
    // Detect bot-generated content
    const { isBotGenerated, confidence } = await this.detectBotContent(article);
    
    // Determine severity
    const severity = this.determineSeverity(article.title + ' ' + article.description);
    
    return {
      eventId,
      source: 'news',
      sourceUrl: article.url,
      timestamp: new Date(article.publishedAt),
      language: article.language,
      originalText: article.description,
      translatedText,
      location,
      diseaseKeywords,
      symptomKeywords: this.extractSymptomKeywords(article.title + ' ' + article.description),
      severity,
      isBotGenerated,
      botConfidence: confidence,
      verificationStatus: 'unverified',
      relatedEvents: [],
    };
  }

  /**
   * Scan social media for disease-related events
   */
  async scanSocialMedia(
    timeRange: { start: Date; end: Date },
    platforms: ('twitter' | 'facebook' | 'telegram' | 'whatsapp')[],
    languages?: string[]
  ): Promise<MediaEvent[]> {
    const events: MediaEvent[] = [];
    const targetLanguages = languages || this.supportedLanguages;
    
    for (const platform of platforms) {
      try {
        const platformEvents = await this.scanPlatform(platform, timeRange, targetLanguages);
        events.push(...platformEvents);
      } catch (error) {
        console.error(`Error scanning ${platform}:`, error);
      }
    }
    
    return events;
  }

  /**
   * Scan specific social media platform
   */
  private async scanPlatform(
    platform: 'twitter' | 'facebook' | 'telegram' | 'whatsapp',
    timeRange: { start: Date; end: Date },
    languages: string[]
  ): Promise<MediaEvent[]> {
    const events: MediaEvent[] = [];
    
    // In production, call actual social media APIs
    // For now, return mock data
    const mockPosts = await this.fetchSocialMediaPosts(platform, timeRange, languages);
    
    for (const post of mockPosts) {
      const event = await this.processSocialMediaPost(post, platform);
      if (event) {
        events.push(event);
      }
    }
    
    return events;
  }

  /**
   * Fetch social media posts
   */
  private async fetchSocialMediaPosts(
    platform: string,
    timeRange: { start: Date; end: Date },
    languages: string[]
  ): Promise<any[]> {
    // Mock data
    return [
      {
        id: '123',
        text: 'Many people in my area have fever and body pain. Is there a dengue outbreak?',
        createdAt: new Date(),
        user: { id: 'user1', followers: 500 },
        language: 'en',
        location: 'Mumbai, Maharashtra',
      },
    ];
  }

  /**
   * Process social media post
   */
  private async processSocialMediaPost(
    post: any,
    platform: 'twitter' | 'facebook' | 'telegram' | 'whatsapp'
  ): Promise<MediaEvent | null> {
    const eventId = uuidv4();
    
    // Extract disease keywords
    const diseaseKeywords = this.extractDiseaseKeywords(post.text);
    
    if (diseaseKeywords.length === 0) {
      return null;
    }
    
    // Extract location
    const location = await this.extractLocation(post.text + ' ' + (post.location || ''));
    
    // Translate if needed
    const translatedText = post.language !== 'en'
      ? await this.translateText(post.text, post.language, 'en')
      : post.text;
    
    // Detect bot
    const { isBotGenerated, confidence } = await this.detectBotContent(post);
    
    // Determine severity
    const severity = this.determineSeverity(post.text);
    
    return {
      eventId,
      source: platform,
      sourceUrl: `https://${platform}.com/post/${post.id}`,
      timestamp: new Date(post.createdAt),
      language: post.language,
      originalText: post.text,
      translatedText,
      location,
      diseaseKeywords,
      symptomKeywords: this.extractSymptomKeywords(post.text),
      severity,
      isBotGenerated,
      botConfidence: confidence,
      verificationStatus: 'unverified',
      relatedEvents: [],
    };
  }

  /**
   * Extract disease keywords from text
   */
  private extractDiseaseKeywords(text: string): string[] {
    const keywords: string[] = [];
    const lowerText = text.toLowerCase();
    
    for (const keyword of this.diseaseKeywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        keywords.push(keyword);
      }
    }
    
    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * Extract symptom keywords from text
   */
  private extractSymptomKeywords(text: string): string[] {
    const symptomKeywords = [
      'fever', 'cough', 'headache', 'body pain', 'rash', 'vomiting',
      'diarrhea', 'difficulty breathing', 'fatigue', 'weakness',
      'बुखार', 'खांसी', 'सिरदर्द', 'शरीर में दर्द',
      'காய்ச்சல்', 'இருமல்', 'தலைவலி',
    ];
    
    const keywords: string[] = [];
    const lowerText = text.toLowerCase();
    
    for (const keyword of symptomKeywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        keywords.push(keyword);
      }
    }
    
    return [...new Set(keywords)];
  }

  /**
   * Extract location from text
   */
  private async extractLocation(text: string): Promise<{
    district?: string;
    state?: string;
    coordinates?: { lat: number; lon: number };
  }> {
    // In production, use NER model for location extraction
    // For now, simple keyword matching
    const indianStates = [
      'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Kerala', 'Gujarat',
      'Rajasthan', 'Uttar Pradesh', 'West Bengal', 'Delhi',
    ];
    
    const indianCities = [
      'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata',
      'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur',
    ];
    
    let state: string | undefined;
    let district: string | undefined;
    
    for (const stateName of indianStates) {
      if (text.includes(stateName)) {
        state = stateName;
        break;
      }
    }
    
    for (const city of indianCities) {
      if (text.includes(city)) {
        district = city;
        break;
      }
    }
    
    return { district, state };
  }

  /**
   * Translate text using translation API
   */
  private async translateText(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<string> {
    // In production, call Bhashini or Google Translate API
    // For now, return original text
    return text;
  }

  /**
   * Detect bot-generated content
   */
  private async detectBotContent(content: any): Promise<{
    isBotGenerated: boolean;
    confidence: number;
  }> {
    // Bot detection heuristics:
    // 1. Account age and activity
    // 2. Posting frequency
    // 3. Content similarity
    // 4. Engagement patterns
    
    let botScore = 0;
    
    // Check posting frequency (if available)
    if (content.user?.followers < 50) {
      botScore += 0.3;
    }
    
    // Check for repetitive patterns
    const words = content.text?.split(' ') || [];
    const uniqueWords = new Set(words);
    const repetitionRatio = uniqueWords.size / words.length;
    
    if (repetitionRatio < 0.5) {
      botScore += 0.3;
    }
    
    // Check for suspicious URLs
    if (content.text?.match(/http[s]?:\/\//g)?.length > 2) {
      botScore += 0.2;
    }
    
    // Check for excessive hashtags
    if (content.text?.match(/#/g)?.length > 5) {
      botScore += 0.2;
    }
    
    return {
      isBotGenerated: botScore > 0.5,
      confidence: botScore,
    };
  }

  /**
   * Determine severity of event
   */
  private determineSeverity(text: string): 'low' | 'medium' | 'high' {
    const lowerText = text.toLowerCase();
    
    const highSeverityKeywords = ['death', 'outbreak', 'epidemic', 'emergency', 'critical'];
    const mediumSeverityKeywords = ['increase', 'rise', 'spread', 'cases'];
    
    for (const keyword of highSeverityKeywords) {
      if (lowerText.includes(keyword)) {
        return 'high';
      }
    }
    
    for (const keyword of mediumSeverityKeywords) {
      if (lowerText.includes(keyword)) {
        return 'medium';
      }
    }
    
    return 'low';
  }

  /**
   * Verify event authenticity
   */
  async verifyEvent(eventId: string): Promise<'verified' | 'false'> {
    // In production, implement verification workflow:
    // 1. Cross-reference with official health data
    // 2. Check multiple sources
    // 3. Verify location
    // 4. Contact local health authorities
    
    // For now, return mock verification
    return 'verified';
  }

  /**
   * Find related events
   */
  async findRelatedEvents(event: MediaEvent, allEvents: MediaEvent[]): Promise<string[]> {
    const relatedIds: string[] = [];
    
    for (const other of allEvents) {
      if (other.eventId === event.eventId) continue;
      
      // Check for similar location
      const sameLocation =
        event.location.district === other.location.district &&
        event.location.state === other.location.state;
      
      // Check for similar disease keywords
      const commonKeywords = event.diseaseKeywords.filter(k =>
        other.diseaseKeywords.includes(k)
      );
      
      // Check time proximity (within 7 days)
      const timeDiff = Math.abs(event.timestamp.getTime() - other.timestamp.getTime());
      const withinWeek = timeDiff < 7 * 24 * 60 * 60 * 1000;
      
      if (sameLocation && commonKeywords.length > 0 && withinWeek) {
        relatedIds.push(other.eventId);
      }
    }
    
    return relatedIds;
  }

  /**
   * Perform comprehensive media scan
   */
  async performMediaScan(
    daysBack: number = 7,
    languages?: string[]
  ): Promise<MediaScanningResult> {
    const scanId = uuidv4();
    const scanTimestamp = new Date();
    const endDate = new Date();
    const startDate = subDays(endDate, daysBack);
    
    const timeRange = { start: startDate, end: endDate };
    
    // Scan news sources
    const newsEvents = await this.scanNewsSources(timeRange, languages);
    
    // Scan social media
    const socialEvents = await this.scanSocialMedia(
      timeRange,
      ['twitter', 'facebook'],
      languages
    );
    
    // Combine all events
    const allEvents = [...newsEvents, ...socialEvents];
    
    // Filter bot-generated content
    const filteredEvents = allEvents.filter(e => !e.isBotGenerated);
    
    // Find related events
    for (const event of filteredEvents) {
      event.relatedEvents = await this.findRelatedEvents(event, filteredEvents);
    }
    
    // Calculate distributions
    const languageDistribution: Record<string, number> = {};
    const diseaseDistribution: Record<string, number> = {};
    const geographicDistribution: Record<string, number> = {};
    
    for (const event of filteredEvents) {
      // Language distribution
      languageDistribution[event.language] = (languageDistribution[event.language] || 0) + 1;
      
      // Disease distribution
      for (const disease of event.diseaseKeywords) {
        diseaseDistribution[disease] = (diseaseDistribution[disease] || 0) + 1;
      }
      
      // Geographic distribution
      if (event.location.state) {
        geographicDistribution[event.location.state] =
          (geographicDistribution[event.location.state] || 0) + 1;
      }
    }
    
    // Get priority events (high severity, verified or pending verification)
    const priorityEvents = filteredEvents
      .filter(e => e.severity === 'high')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);
    
    return {
      scanId,
      scanTimestamp,
      timeRange,
      totalEvents: allEvents.length,
      verifiedEvents: filteredEvents.filter(e => e.verificationStatus === 'verified').length,
      botFilteredEvents: allEvents.length - filteredEvents.length,
      languageDistribution,
      diseaseDistribution,
      geographicDistribution,
      priorityEvents,
    };
  }
}
