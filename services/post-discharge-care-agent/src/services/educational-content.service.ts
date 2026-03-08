import { v4 as uuidv4 } from 'uuid';
import {
  EducationalContent,
  Patient,
  DischargeData,
  ContentRecommendation,
} from '../types';

/**
 * Educational Content Management Service
 * Manages video content, multilingual delivery, and personalized recommendations
 */
export class EducationalContentService {
  // In-memory content library (in production, this would be in a database)
  private contentLibrary: Map<string, EducationalContent[]> = new Map();

  constructor() {
    this.initializeContentLibrary();
  }

  /**
   * Initialize content library with multilingual educational materials
   */
  private initializeContentLibrary(): void {
    // Cardiac care content
    const cardiacContent: EducationalContent[] = [
      {
        id: uuidv4(),
        title: 'Heart Health After Discharge',
        description: 'Learn about recovery after a cardiac event and how to maintain heart health',
        type: 'video',
        url: 'https://cdn.medhaos.com/videos/cardiac-recovery-en.mp4',
        language: 'en',
        duration: '5:30',
        thumbnailUrl: 'https://cdn.medhaos.com/thumbnails/cardiac-recovery.jpg',
        category: 'Recovery',
      },
      {
        id: uuidv4(),
        title: 'हृदय स्वास्थ्य - छुट्टी के बाद',
        description: 'हृदय रोग के बाद रिकवरी और स्वास्थ्य बनाए रखने के बारे में जानें',
        type: 'video',
        url: 'https://cdn.medhaos.com/videos/cardiac-recovery-hi.mp4',
        language: 'hi',
        duration: '5:30',
        thumbnailUrl: 'https://cdn.medhaos.com/thumbnails/cardiac-recovery.jpg',
        category: 'Recovery',
      },
      {
        id: uuidv4(),
        title: 'Cardiac Diet Guidelines',
        description: 'Nutrition tips for heart health and recovery',
        type: 'article',
        url: 'https://cdn.medhaos.com/articles/cardiac-diet-en.pdf',
        language: 'en',
        category: 'Nutrition',
      },
      {
        id: uuidv4(),
        title: 'हृदय के लिए आहार दिशानिर्देश',
        description: 'हृदय स्वास्थ्य और रिकवरी के लिए पोषण सुझाव',
        type: 'article',
        url: 'https://cdn.medhaos.com/articles/cardiac-diet-hi.pdf',
        language: 'hi',
        category: 'Nutrition',
      },
      {
        id: uuidv4(),
        title: 'Exercise After Heart Surgery',
        description: 'Safe exercise guidelines for cardiac patients',
        type: 'video',
        url: 'https://cdn.medhaos.com/videos/cardiac-exercise-en.mp4',
        language: 'en',
        duration: '6:45',
        thumbnailUrl: 'https://cdn.medhaos.com/thumbnails/cardiac-exercise.jpg',
        category: 'Exercise',
      },
    ];
    this.contentLibrary.set('cardiac', cardiacContent);

    // Diabetes management content
    const diabetesContent: EducationalContent[] = [
      {
        id: uuidv4(),
        title: 'Managing Diabetes at Home',
        description: 'Blood sugar monitoring and medication management',
        type: 'video',
        url: 'https://cdn.medhaos.com/videos/diabetes-management-en.mp4',
        language: 'en',
        duration: '7:15',
        thumbnailUrl: 'https://cdn.medhaos.com/thumbnails/diabetes-management.jpg',
        category: 'Disease Management',
      },
      {
        id: uuidv4(),
        title: 'घर पर मधुमेह का प्रबंधन',
        description: 'रक्त शर्करा निगरानी और दवा प्रबंधन',
        type: 'video',
        url: 'https://cdn.medhaos.com/videos/diabetes-management-hi.mp4',
        language: 'hi',
        duration: '7:15',
        thumbnailUrl: 'https://cdn.medhaos.com/thumbnails/diabetes-management.jpg',
        category: 'Disease Management',
      },
      {
        id: uuidv4(),
        title: 'Diabetic Diet Plan',
        description: 'Meal planning and carbohydrate counting',
        type: 'infographic',
        url: 'https://cdn.medhaos.com/infographics/diabetic-diet-en.png',
        language: 'en',
        category: 'Nutrition',
      },
      {
        id: uuidv4(),
        title: 'Foot Care for Diabetics',
        description: 'Preventing complications through proper foot care',
        type: 'video',
        url: 'https://cdn.medhaos.com/videos/diabetic-foot-care-en.mp4',
        language: 'en',
        duration: '4:20',
        thumbnailUrl: 'https://cdn.medhaos.com/thumbnails/diabetic-foot-care.jpg',
        category: 'Prevention',
      },
    ];
    this.contentLibrary.set('diabetes', diabetesContent);

    // Post-surgery care content
    const surgeryContent: EducationalContent[] = [
      {
        id: uuidv4(),
        title: 'Wound Care After Surgery',
        description: 'How to care for your surgical incision',
        type: 'video',
        url: 'https://cdn.medhaos.com/videos/wound-care-en.mp4',
        language: 'en',
        duration: '5:00',
        thumbnailUrl: 'https://cdn.medhaos.com/thumbnails/wound-care.jpg',
        category: 'Recovery',
      },
      {
        id: uuidv4(),
        title: 'सर्जरी के बाद घाव की देखभाल',
        description: 'अपने सर्जिकल चीरे की देखभाल कैसे करें',
        type: 'video',
        url: 'https://cdn.medhaos.com/videos/wound-care-hi.mp4',
        language: 'hi',
        duration: '5:00',
        thumbnailUrl: 'https://cdn.medhaos.com/thumbnails/wound-care.jpg',
        category: 'Recovery',
      },
      {
        id: uuidv4(),
        title: 'Pain Management at Home',
        description: 'Managing post-surgical pain safely',
        type: 'article',
        url: 'https://cdn.medhaos.com/articles/pain-management-en.pdf',
        language: 'en',
        category: 'Pain Management',
      },
    ];
    this.contentLibrary.set('surgery', surgeryContent);

    // General medication content
    const medicationContent: EducationalContent[] = [
      {
        id: uuidv4(),
        title: 'Medication Safety',
        description: 'How to take your medications correctly',
        type: 'infographic',
        url: 'https://cdn.medhaos.com/infographics/medication-safety-en.png',
        language: 'en',
        category: 'Medication',
      },
      {
        id: uuidv4(),
        title: 'दवा सुरक्षा',
        description: 'अपनी दवाएं सही तरीके से कैसे लें',
        type: 'infographic',
        url: 'https://cdn.medhaos.com/infographics/medication-safety-hi.png',
        language: 'hi',
        category: 'Medication',
      },
      {
        id: uuidv4(),
        title: 'Understanding Your Prescriptions',
        description: 'Reading and following prescription instructions',
        type: 'video',
        url: 'https://cdn.medhaos.com/videos/prescription-guide-en.mp4',
        language: 'en',
        duration: '4:30',
        thumbnailUrl: 'https://cdn.medhaos.com/thumbnails/prescription-guide.jpg',
        category: 'Medication',
      },
    ];
    this.contentLibrary.set('medication', medicationContent);

    // Hypertension content
    const hypertensionContent: EducationalContent[] = [
      {
        id: uuidv4(),
        title: 'Managing High Blood Pressure',
        description: 'Lifestyle changes and medication adherence',
        type: 'video',
        url: 'https://cdn.medhaos.com/videos/hypertension-management-en.mp4',
        language: 'en',
        duration: '6:00',
        thumbnailUrl: 'https://cdn.medhaos.com/thumbnails/hypertension-management.jpg',
        category: 'Disease Management',
      },
      {
        id: uuidv4(),
        title: 'उच्च रक्तचाप का प्रबंधन',
        description: 'जीवनशैली में बदलाव और दवा का पालन',
        type: 'video',
        url: 'https://cdn.medhaos.com/videos/hypertension-management-hi.mp4',
        language: 'hi',
        duration: '6:00',
        thumbnailUrl: 'https://cdn.medhaos.com/thumbnails/hypertension-management.jpg',
        category: 'Disease Management',
      },
    ];
    this.contentLibrary.set('hypertension', hypertensionContent);
  }

  /**
   * Get personalized content recommendations based on patient profile and diagnosis
   */
  async getPersonalizedRecommendations(
    patient: Patient,
    dischargeData: DischargeData
  ): Promise<ContentRecommendation> {
    const recommendedContent: EducationalContent[] = [];
    const language = patient.language || 'en';

    // Extract relevant categories from diagnosis
    const categories = this.extractCategories(dischargeData.diagnosis, dischargeData.procedures);

    // Get content for each category
    for (const category of categories) {
      const categoryContent = this.contentLibrary.get(category) || [];
      
      // Filter by language
      const languageContent = categoryContent.filter(
        content => content.language === language
      );

      // If no content in patient's language, fallback to English
      if (languageContent.length === 0 && language !== 'en') {
        const englishContent = categoryContent.filter(
          content => content.language === 'en'
        );
        recommendedContent.push(...englishContent);
      } else {
        recommendedContent.push(...languageContent);
      }
    }

    // Always include general medication safety content
    const medicationContent = this.contentLibrary.get('medication') || [];
    const medicationLanguageContent = medicationContent.filter(
      content => content.language === language
    );
    recommendedContent.push(...medicationLanguageContent);

    // Remove duplicates
    const uniqueContent = this.removeDuplicates(recommendedContent);

    // Generate personalized message
    const personalizedMessage = this.generatePersonalizedMessage(
      patient,
      dischargeData,
      language
    );

    return {
      patientId: patient.id,
      diagnosis: dischargeData.diagnosis,
      language,
      recommendedContent: uniqueContent,
      personalizedMessage,
    };
  }

  /**
   * Extract relevant content categories from diagnosis and procedures
   */
  private extractCategories(diagnosis: string[], procedures: string[]): string[] {
    const categories: Set<string> = new Set();

    // Check diagnosis
    for (const diag of diagnosis) {
      const diagLower = diag.toLowerCase();
      
      if (diagLower.includes('cardiac') || diagLower.includes('heart') || diagLower.includes('myocardial')) {
        categories.add('cardiac');
      }
      if (diagLower.includes('diabetes') || diagLower.includes('diabetic')) {
        categories.add('diabetes');
      }
      if (diagLower.includes('hypertension') || diagLower.includes('blood pressure')) {
        categories.add('hypertension');
      }
    }

    // Check procedures
    for (const proc of procedures) {
      const procLower = proc.toLowerCase();
      
      if (procLower.includes('surgery') || procLower.includes('surgical')) {
        categories.add('surgery');
      }
    }

    return Array.from(categories);
  }

  /**
   * Remove duplicate content items
   */
  private removeDuplicates(content: EducationalContent[]): EducationalContent[] {
    const seen = new Set<string>();
    return content.filter(item => {
      if (seen.has(item.id)) {
        return false;
      }
      seen.add(item.id);
      return true;
    });
  }

  /**
   * Generate personalized message for the patient
   */
  private generatePersonalizedMessage(
    patient: Patient,
    _dischargeData: DischargeData,
    language: string
  ): string {
    const messages: Record<string, string> = {
      en: `Dear ${patient.name}, we've prepared educational materials to help you recover at home. These videos and articles are tailored to your condition and will guide you through your recovery journey.`,
      hi: `प्रिय ${patient.name}, हमने आपके घर पर ठीक होने में मदद के लिए शैक्षिक सामग्री तैयार की है। ये वीडियो और लेख आपकी स्थिति के अनुरूप हैं और आपकी रिकवरी यात्रा में आपका मार्गदर्शन करेंगे।`,
      ta: `அன்புள்ள ${patient.name}, வீட்டில் குணமடைய உதவும் கல்வி பொருட்களை நாங்கள் தயார் செய்துள்ளோம். இந்த வீடியோக்கள் மற்றும் கட்டுரைகள் உங்கள் நிலைக்கு ஏற்றவை.`,
      te: `ప్రియమైన ${patient.name}, ఇంట్లో కోలుకోవడానికి సహాయపడే విద్యా సామగ్రిని మేము సిద్ధం చేసాము. ఈ వీడియోలు మరియు వ్యాసాలు మీ పరిస్థితికి అనుగుణంగా ఉన్నాయి.`,
      bn: `প্রিয় ${patient.name}, আমরা আপনার বাড়িতে সুস্থ হতে সাহায্য করার জন্য শিক্ষামূলক উপকরণ প্রস্তুত করেছি। এই ভিডিও এবং নিবন্ধগুলি আপনার অবস্থার জন্য উপযুক্ত।`,
    };

    return messages[language] || messages['en'];
  }

  /**
   * Get all content for a specific category and language
   */
  async getContentByCategory(
    category: string,
    language: string = 'en'
  ): Promise<EducationalContent[]> {
    const categoryContent = this.contentLibrary.get(category) || [];
    
    // Filter by language
    let filteredContent = categoryContent.filter(
      content => content.language === language
    );

    // Fallback to English if no content in requested language
    if (filteredContent.length === 0 && language !== 'en') {
      filteredContent = categoryContent.filter(
        content => content.language === 'en'
      );
    }

    return filteredContent;
  }

  /**
   * Get content by ID
   */
  async getContentById(contentId: string): Promise<EducationalContent | null> {
    for (const [, contents] of this.contentLibrary) {
      const content = contents.find(c => c.id === contentId);
      if (content) {
        return content;
      }
    }
    return null;
  }

  /**
   * Search content by title or description
   */
  async searchContent(
    query: string,
    language: string = 'en'
  ): Promise<EducationalContent[]> {
    const results: EducationalContent[] = [];
    const queryLower = query.toLowerCase();

    for (const [, contents] of this.contentLibrary) {
      const matches = contents.filter(content => {
        const titleMatch = content.title.toLowerCase().includes(queryLower);
        const descMatch = content.description.toLowerCase().includes(queryLower);
        const langMatch = content.language === language;
        
        return (titleMatch || descMatch) && langMatch;
      });
      results.push(...matches);
    }

    return results;
  }

  /**
   * Get all available categories
   */
  async getAvailableCategories(): Promise<string[]> {
    return Array.from(this.contentLibrary.keys());
  }

  /**
   * Get all supported languages
   */
  async getSupportedLanguages(): Promise<string[]> {
    const languages = new Set<string>();
    
    for (const [, contents] of this.contentLibrary) {
      contents.forEach(content => languages.add(content.language));
    }

    return Array.from(languages);
  }

  /**
   * Track content view (for analytics)
   */
  async trackContentView(
    patientId: string,
    contentId: string,
    duration?: number
  ): Promise<void> {
    // In production, this would log to analytics database
    console.log('Content view tracked:', {
      patientId,
      contentId,
      duration,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get content recommendations by type
   */
  async getContentByType(
    type: 'video' | 'article' | 'infographic',
    language: string = 'en'
  ): Promise<EducationalContent[]> {
    const results: EducationalContent[] = [];

    for (const [, contents] of this.contentLibrary) {
      const matches = contents.filter(
        content => content.type === type && content.language === language
      );
      results.push(...matches);
    }

    return results;
  }

  /**
   * Add new content to library (admin function)
   */
  async addContent(
    category: string,
    content: EducationalContent
  ): Promise<EducationalContent> {
    const categoryContent = this.contentLibrary.get(category) || [];
    categoryContent.push(content);
    this.contentLibrary.set(category, categoryContent);
    
    console.log('Content added:', content.id);
    return content;
  }

  /**
   * Update existing content (admin function)
   */
  async updateContent(
    contentId: string,
    updates: Partial<EducationalContent>
  ): Promise<EducationalContent | null> {
    for (const [category, contents] of this.contentLibrary) {
      const index = contents.findIndex(c => c.id === contentId);
      if (index !== -1) {
        contents[index] = { ...contents[index], ...updates };
        this.contentLibrary.set(category, contents);
        console.log('Content updated:', contentId);
        return contents[index];
      }
    }
    return null;
  }

  /**
   * Delete content (admin function)
   */
  async deleteContent(contentId: string): Promise<boolean> {
    for (const [category, contents] of this.contentLibrary) {
      const index = contents.findIndex(c => c.id === contentId);
      if (index !== -1) {
        contents.splice(index, 1);
        this.contentLibrary.set(category, contents);
        console.log('Content deleted:', contentId);
        return true;
      }
    }
    return false;
  }
}
