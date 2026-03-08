/**
 * Specialty Routing Service
 * Classifies patient conditions to appropriate medical specialties
 * and matches with available facilities
 */

import { TriageSession } from '../types';

export interface SpecialtyClassification {
  primarySpecialty: string;
  alternativeSpecialties: string[];
  confidence: number;
  reasoning: string[];
}

export interface FacilityMatch {
  facilityId: string;
  facilityName: string;
  distance: number; // kilometers
  estimatedTravelTime: number; // minutes
  hasSpecialty: boolean;
  availabilityStatus: 'available' | 'limited' | 'full';
  currentWaitTime: number; // minutes
  matchScore: number; // 0-100
}

export interface RoutingRecommendation {
  classification: SpecialtyClassification;
  recommendedFacilities: FacilityMatch[];
  urgencyLevel: 'critical' | 'urgent' | 'semi_urgent' | 'non_urgent';
}

/**
 * Specialty classification based on symptoms and clinical presentation
 */
export class SpecialtyRoutingService {
  private specialtyKeywords: Map<string, string[]>;
  private specialtyPriority: Map<string, number>;

  constructor() {
    this.specialtyKeywords = new Map();
    this.specialtyPriority = new Map();
    this.initializeSpecialtyMappings();
  }

  /**
   * Initialize specialty keyword mappings
   */
  private initializeSpecialtyMappings(): void {
    this.specialtyKeywords = new Map([
      ['Cardiology', [
        'chest pain', 'heart', 'cardiac', 'palpitation', 'angina',
        'myocardial', 'arrhythmia', 'hypertension', 'blood pressure',
        'coronary', 'heart attack', 'cardiovascular'
      ]],
      ['Pulmonology', [
        'breath', 'breathing', 'respiratory', 'cough', 'lung',
        'asthma', 'copd', 'pneumonia', 'bronchitis', 'dyspnea',
        'wheezing', 'chest congestion', 'shortness of breath'
      ]],
      ['Neurology', [
        'headache', 'migraine', 'seizure', 'stroke', 'consciousness',
        'paralysis', 'numbness', 'tingling', 'dizziness', 'vertigo',
        'confusion', 'memory', 'tremor', 'weakness', 'neurological'
      ]],
      ['Gastroenterology', [
        'abdominal', 'stomach', 'nausea', 'vomiting', 'diarrhea',
        'constipation', 'gastric', 'intestinal', 'liver', 'hepatic',
        'digestive', 'bowel', 'gi', 'gastrointestinal'
      ]],
      ['Orthopedics', [
        'bone', 'fracture', 'joint', 'arthritis', 'sprain', 'strain',
        'musculoskeletal', 'back pain', 'neck pain', 'limb', 'trauma',
        'injury', 'dislocation', 'ligament'
      ]],
      ['Emergency Medicine', [
        'trauma', 'accident', 'injury', 'bleeding', 'unconscious',
        'severe pain', 'critical', 'life threatening', 'emergency',
        'acute', 'sudden onset'
      ]],
      ['Nephrology', [
        'kidney', 'renal', 'urinary', 'dialysis', 'urine', 'urination',
        'bladder', 'nephritis', 'proteinuria', 'hematuria'
      ]],
      ['Endocrinology', [
        'diabetes', 'thyroid', 'hormone', 'endocrine', 'glucose',
        'insulin', 'metabolic', 'pituitary', 'adrenal'
      ]],
      ['Dermatology', [
        'skin', 'rash', 'dermatitis', 'eczema', 'psoriasis', 'acne',
        'lesion', 'wound', 'burn', 'itching', 'dermatological'
      ]],
      ['Ophthalmology', [
        'eye', 'vision', 'sight', 'ocular', 'ophthalmic', 'blind',
        'visual', 'retina', 'cataract', 'glaucoma'
      ]],
      ['ENT', [
        'ear', 'nose', 'throat', 'hearing', 'sinus', 'tonsil',
        'pharyngitis', 'laryngitis', 'otitis', 'rhinitis', 'ent'
      ]],
      ['Obstetrics & Gynecology', [
        'pregnancy', 'pregnant', 'obstetric', 'gynecological', 'menstrual',
        'vaginal', 'uterine', 'ovarian', 'prenatal', 'labor', 'delivery'
      ]],
      ['Pediatrics', [
        'child', 'infant', 'pediatric', 'newborn', 'baby', 'toddler',
        'adolescent', 'childhood'
      ]],
      ['Psychiatry', [
        'mental', 'psychiatric', 'depression', 'anxiety', 'psychosis',
        'bipolar', 'schizophrenia', 'psychological', 'suicidal'
      ]],
      ['Oncology', [
        'cancer', 'tumor', 'malignancy', 'oncology', 'chemotherapy',
        'radiation', 'metastasis', 'carcinoma', 'lymphoma', 'leukemia'
      ]],
      ['Infectious Disease', [
        'infection', 'infectious', 'fever', 'sepsis', 'viral', 'bacterial',
        'fungal', 'parasitic', 'communicable', 'contagious'
      ]],
      ['General Medicine', [
        'general', 'internal medicine', 'primary care', 'routine',
        'checkup', 'consultation'
      ]]
    ]);

    // Priority for critical specialties (higher = more urgent)
    this.specialtyPriority = new Map([
      ['Emergency Medicine', 100],
      ['Cardiology', 95],
      ['Neurology', 90],
      ['Pulmonology', 85],
      ['Trauma Surgery', 95],
      ['Gastroenterology', 70],
      ['Nephrology', 75],
      ['Infectious Disease', 80],
      ['Obstetrics & Gynecology', 85],
      ['Pediatrics', 80],
      ['Orthopedics', 65],
      ['Endocrinology', 60],
      ['Dermatology', 50],
      ['Ophthalmology', 55],
      ['ENT', 55],
      ['Psychiatry', 70],
      ['Oncology', 75],
      ['General Medicine', 40]
    ]);
  }

  /**
   * Classify patient to appropriate specialty
   */
  classifySpecialty(session: TriageSession): SpecialtyClassification {
    const scores = new Map<string, number>();
    const reasoning: string[] = [];

    // Combine symptoms and responses for analysis
    const clinicalText = this.extractClinicalText(session);
    const lowerText = clinicalText.toLowerCase();

    // Score each specialty based on keyword matches
    for (const [specialty, keywords] of this.specialtyKeywords.entries()) {
      let score = 0;
      const matchedKeywords: string[] = [];

      for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          score += 1;
          matchedKeywords.push(keyword);
        }
      }

      if (score > 0) {
        scores.set(specialty, score);
        if (matchedKeywords.length > 0) {
          reasoning.push(`${specialty}: matched keywords - ${matchedKeywords.slice(0, 3).join(', ')}`);
        }
      }
    }

    // Apply urgency-based specialty prioritization
    if (session.urgencyScore && session.urgencyScore >= 70) {
      // High urgency cases should consider Emergency Medicine
      const emergencyScore = scores.get('Emergency Medicine') || 0;
      scores.set('Emergency Medicine', emergencyScore + 5);
      reasoning.push('High urgency score suggests Emergency Medicine evaluation');
    }

    // Age-based specialty considerations
    const age = this.extractAge(session);
    if (age !== null) {
      if (age < 18) {
        const pediatricScore = scores.get('Pediatrics') || 0;
        scores.set('Pediatrics', pediatricScore + 3);
        reasoning.push('Pediatric patient - Pediatrics specialty prioritized');
      } else if (age > 65) {
        // Elderly patients may need specialized geriatric care
        reasoning.push('Elderly patient - comprehensive assessment recommended');
      }
    }

    // Gender-based specialty considerations
    const gender = this.extractGender(session);
    if (gender === 'female') {
      const gynecologyKeywords = ['menstrual', 'pregnancy', 'vaginal', 'breast'];
      if (gynecologyKeywords.some(kw => lowerText.includes(kw))) {
        const obgynScore = scores.get('Obstetrics & Gynecology') || 0;
        scores.set('Obstetrics & Gynecology', obgynScore + 2);
      }
    }

    // Sort specialties by score
    const sortedSpecialties = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1]);

    // Determine primary and alternative specialties
    let primarySpecialty = 'General Medicine';
    const alternativeSpecialties: string[] = [];
    let confidence = 0.5;

    if (sortedSpecialties.length > 0) {
      primarySpecialty = sortedSpecialties[0][0];
      const primaryScore = sortedSpecialties[0][1];
      
      // Calculate confidence based on score separation
      if (sortedSpecialties.length > 1) {
        const secondaryScore = sortedSpecialties[1][1];
        const scoreDifference = primaryScore - secondaryScore;
        confidence = Math.min(0.95, 0.6 + (scoreDifference * 0.1));
        
        // Add alternative specialties
        for (let i = 1; i < Math.min(3, sortedSpecialties.length); i++) {
          alternativeSpecialties.push(sortedSpecialties[i][0]);
        }
      } else {
        confidence = 0.75;
      }

      // Boost confidence for clear matches
      if (primaryScore >= 5) {
        confidence = Math.min(0.95, confidence + 0.1);
      }
    }

    // If no clear specialty match, default to General Medicine
    if (sortedSpecialties.length === 0 || sortedSpecialties[0][1] < 2) {
      reasoning.push('No specific specialty indicators - General Medicine recommended');
      confidence = 0.6;
    }

    return {
      primarySpecialty,
      alternativeSpecialties,
      confidence,
      reasoning
    };
  }

  /**
   * Match patient with available facilities
   */
  async matchFacilities(
    classification: SpecialtyClassification,
    patientLocation: { latitude: number; longitude: number },
    urgencyLevel: 'critical' | 'urgent' | 'semi_urgent' | 'non_urgent',
    maxDistance: number = 50 // kilometers
  ): Promise<FacilityMatch[]> {
    // In production, this would query the database for facilities
    // For now, we'll use mock data
    const facilities = await this.getFacilitiesFromDatabase(
      patientLocation,
      maxDistance
    );

    const matches: FacilityMatch[] = [];

    for (const facility of facilities) {
      const distance = this.calculateDistance(
        patientLocation.latitude,
        patientLocation.longitude,
        facility.latitude,
        facility.longitude
      );

      const estimatedTravelTime = this.estimateTravelTime(distance);
      
      // Check if facility has the required specialty
      const hasSpecialty = this.facilityHasSpecialty(
        facility,
        classification.primarySpecialty
      );

      // Get real-time availability
      const availabilityStatus = await this.checkFacilityAvailability(
        facility.id,
        urgencyLevel
      );

      // Get current wait time
      const currentWaitTime = await this.getCurrentWaitTime(
        facility.id,
        classification.primarySpecialty,
        urgencyLevel
      );

      // Calculate match score
      const matchScore = this.calculateMatchScore(
        distance,
        hasSpecialty,
        availabilityStatus,
        currentWaitTime,
        urgencyLevel
      );

      matches.push({
        facilityId: facility.id,
        facilityName: facility.name,
        distance,
        estimatedTravelTime,
        hasSpecialty,
        availabilityStatus,
        currentWaitTime,
        matchScore
      });
    }

    // Sort by match score (highest first)
    matches.sort((a, b) => b.matchScore - a.matchScore);

    // Return top 5 matches
    return matches.slice(0, 5);
  }

  /**
   * Get complete routing recommendation
   */
  async getRoutingRecommendation(
    session: TriageSession,
    patientLocation: { latitude: number; longitude: number },
    urgencyLevel: 'critical' | 'urgent' | 'semi_urgent' | 'non_urgent'
  ): Promise<RoutingRecommendation> {
    const classification = this.classifySpecialty(session);
    
    const recommendedFacilities = await this.matchFacilities(
      classification,
      patientLocation,
      urgencyLevel
    );

    return {
      classification,
      recommendedFacilities,
      urgencyLevel
    };
  }

  /**
   * Extract clinical text from session
   */
  private extractClinicalText(session: TriageSession): string {
    const parts: string[] = [];

    // Add symptoms
    parts.push(...session.symptoms);

    // Add responses
    for (const response of session.responses) {
      parts.push(response.question);
      if (typeof response.answer === 'string') {
        parts.push(response.answer);
      } else if (Array.isArray(response.answer)) {
        parts.push(...response.answer);
      }
    }

    // Add chief complaint if available
    if (session.recommendation?.possibleConditions) {
      parts.push(...session.recommendation.possibleConditions);
    }

    return parts.join(' ');
  }

  /**
   * Extract age from session
   */
  private extractAge(session: TriageSession): number | null {
    const ageResponse = session.responses.find(r => r.questionId === 'q16_age');
    if (ageResponse && typeof ageResponse.answer === 'string') {
      const age = parseInt(ageResponse.answer);
      return isNaN(age) ? null : age;
    }
    return null;
  }

  /**
   * Extract gender from session
   */
  private extractGender(session: TriageSession): string | null {
    const genderResponse = session.responses.find(r => r.questionId === 'q17_gender');
    if (genderResponse && typeof genderResponse.answer === 'string') {
      return genderResponse.answer.toLowerCase();
    }
    return null;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
      Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Estimate travel time based on distance
   */
  private estimateTravelTime(distance: number): number {
    // Assume average speed of 30 km/h in urban areas
    const averageSpeed = 30;
    const timeInHours = distance / averageSpeed;
    return Math.round(timeInHours * 60); // Convert to minutes
  }

  /**
   * Calculate match score for facility
   */
  private calculateMatchScore(
    distance: number,
    hasSpecialty: boolean,
    availabilityStatus: string,
    currentWaitTime: number,
    urgencyLevel: string
  ): number {
    let score = 100;

    // Distance penalty (0-30 points)
    if (distance > 20) {
      score -= 30;
    } else if (distance > 10) {
      score -= 20;
    } else if (distance > 5) {
      score -= 10;
    }

    // Specialty match bonus (0-25 points)
    if (hasSpecialty) {
      score += 25;
    } else {
      score -= 15;
    }

    // Availability penalty (0-25 points)
    if (availabilityStatus === 'full') {
      score -= 25;
    } else if (availabilityStatus === 'limited') {
      score -= 10;
    }

    // Wait time penalty (0-20 points)
    if (urgencyLevel === 'critical' || urgencyLevel === 'urgent') {
      if (currentWaitTime > 60) {
        score -= 20;
      } else if (currentWaitTime > 30) {
        score -= 10;
      }
    } else {
      if (currentWaitTime > 120) {
        score -= 20;
      } else if (currentWaitTime > 60) {
        score -= 10;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Mock: Get facilities from database
   */
  private async getFacilitiesFromDatabase(
    location: { latitude: number; longitude: number },
    maxDistance: number
  ): Promise<any[]> {
    // In production, this would query the Facility table from Prisma
    // For now, return mock data
    return [
      {
        id: 'facility-1',
        name: 'City General Hospital',
        latitude: location.latitude + 0.05,
        longitude: location.longitude + 0.05,
        specialties: ['Cardiology', 'Neurology', 'Emergency Medicine', 'General Medicine']
      },
      {
        id: 'facility-2',
        name: 'District Medical Center',
        latitude: location.latitude + 0.1,
        longitude: location.longitude + 0.1,
        specialties: ['General Medicine', 'Pediatrics', 'Orthopedics']
      },
      {
        id: 'facility-3',
        name: 'Specialty Care Clinic',
        latitude: location.latitude + 0.02,
        longitude: location.longitude + 0.02,
        specialties: ['Cardiology', 'Pulmonology', 'Endocrinology']
      }
    ];
  }

  /**
   * Check if facility has specialty
   */
  private facilityHasSpecialty(facility: any, specialty: string): boolean {
    return facility.specialties?.includes(specialty) || false;
  }

  /**
   * Mock: Check facility availability
   */
  private async checkFacilityAvailability(
    facilityId: string,
    urgencyLevel: string
  ): Promise<'available' | 'limited' | 'full'> {
    // In production, this would check real-time bed/resource availability
    // For now, return mock data based on urgency
    if (urgencyLevel === 'critical') {
      return 'available'; // Emergency cases always have availability
    }
    
    // Simulate varying availability
    const random = Math.random();
    if (random < 0.6) return 'available';
    if (random < 0.9) return 'limited';
    return 'full';
  }

  /**
   * Mock: Get current wait time
   */
  private async getCurrentWaitTime(
    facilityId: string,
    specialty: string,
    urgencyLevel: string
  ): Promise<number> {
    // In production, this would query the queue optimization agent
    // For now, return mock data based on urgency
    const baseWaitTimes: Record<string, number> = {
      'critical': 0,
      'urgent': 15,
      'semi_urgent': 45,
      'non_urgent': 90
    };

    const baseTime = baseWaitTimes[urgencyLevel] || 60;
    // Add some randomness
    return baseTime + Math.floor(Math.random() * 30);
  }
}
