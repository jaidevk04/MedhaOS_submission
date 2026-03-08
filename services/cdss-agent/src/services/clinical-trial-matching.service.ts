import axios from 'axios';
import { config } from '../config';
import { ClinicalTrial, PatientProfile, TrialMatchResult, TrialMatchingResponse } from '../types';

/**
 * Clinical Trial Matching Service
 * Matches patients to relevant clinical trials based on eligibility criteria
 */
export class ClinicalTrialMatchingService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = config.clinicalTrials.apiUrl;
  }

  /**
   * Search for clinical trials by condition
   */
  async searchTrials(condition: string, location?: { country: string; state?: string }): Promise<ClinicalTrial[]> {
    try {
      const params: any = {
        'query.cond': condition,
        'query.locn': location ? `${location.state || ''}, ${location.country}` : 'India',
        'filter.overallStatus': 'RECRUITING',
        pageSize: 50
      };

      const response = await axios.get(`${this.apiUrl}/studies`, { params });
      const studies = response.data.studies || [];

      return studies.map((study: any) => this.parseTrialData(study));
    } catch (error) {
      console.error('Error searching clinical trials:', error);
      return [];
    }
  }

  /**
   * Match patient to clinical trials
   */
  async matchPatientToTrials(patientProfile: PatientProfile): Promise<TrialMatchingResponse> {
    try {
      const startTime = Date.now();

      // Step 1: Search for trials based on patient's diagnoses
      const allTrials: ClinicalTrial[] = [];
      for (const diagnosis of patientProfile.diagnoses) {
        const trials = await this.searchTrials(diagnosis, patientProfile.location);
        allTrials.push(...trials);
      }

      // Remove duplicates
      const uniqueTrials = this.deduplicateTrials(allTrials);

      console.log(`Found ${uniqueTrials.length} unique trials for patient ${patientProfile.patientId}`);

      // Step 2: Evaluate eligibility for each trial
      const matches: TrialMatchResult[] = [];
      for (const trial of uniqueTrials) {
        const matchResult = this.evaluateEligibility(patientProfile, trial);
        if (matchResult.matchScore > 0) {
          matches.push(matchResult);
        }
      }

      // Step 3: Sort by match score
      matches.sort((a, b) => b.matchScore - a.matchScore);

      const processingTime = Date.now() - startTime;
      console.log(`Trial matching completed in ${processingTime}ms`);

      return {
        patientId: patientProfile.patientId,
        matches: matches.slice(0, 20), // Top 20 matches
        totalTrialsEvaluated: uniqueTrials.length,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error matching patient to trials:', error);
      throw error;
    }
  }

  /**
   * Evaluate patient eligibility for a trial
   */
  private evaluateEligibility(patient: PatientProfile, trial: ClinicalTrial): TrialMatchResult {
    let matchScore = 0;
    const matchReasons: string[] = [];
    const missingInformation: string[] = [];
    let eligibilityStatus: 'eligible' | 'potentially_eligible' | 'not_eligible' = 'potentially_eligible';

    // Check age eligibility
    const ageEligible = this.checkAgeEligibility(patient.age, trial.eligibilityCriteria);
    if (ageEligible.eligible) {
      matchScore += 20;
      matchReasons.push(ageEligible.reason);
    } else if (ageEligible.reason) {
      eligibilityStatus = 'not_eligible';
      return {
        trial,
        matchScore: 0,
        matchReasons: [ageEligible.reason],
        eligibilityStatus: 'not_eligible',
        missingInformation: []
      };
    }

    // Check gender eligibility
    const genderEligible = this.checkGenderEligibility(patient.gender, trial.eligibilityCriteria);
    if (genderEligible.eligible) {
      matchScore += 20;
      matchReasons.push(genderEligible.reason);
    } else if (genderEligible.reason) {
      eligibilityStatus = 'not_eligible';
      return {
        trial,
        matchScore: 0,
        matchReasons: [genderEligible.reason],
        eligibilityStatus: 'not_eligible',
        missingInformation: []
      };
    }

    // Check condition match
    const conditionMatch = this.checkConditionMatch(patient.diagnoses, trial.conditions);
    matchScore += conditionMatch.score;
    if (conditionMatch.reasons.length > 0) {
      matchReasons.push(...conditionMatch.reasons);
    }

    // Check genetic profile match (if available)
    if (patient.geneticProfile && trial.eligibilityCriteria.inclusionCriteria.some(c => 
      c.toLowerCase().includes('mutation') || c.toLowerCase().includes('biomarker')
    )) {
      const geneticMatch = this.checkGeneticMatch(patient.geneticProfile, trial.eligibilityCriteria);
      matchScore += geneticMatch.score;
      matchReasons.push(...geneticMatch.reasons);
      if (geneticMatch.missing.length > 0) {
        missingInformation.push(...geneticMatch.missing);
      }
    }

    // Check location proximity
    const locationMatch = this.checkLocationMatch(patient.location, trial.locations);
    matchScore += locationMatch.score;
    if (locationMatch.reason) {
      matchReasons.push(locationMatch.reason);
    }

    // Check exclusion criteria
    const exclusionCheck = this.checkExclusionCriteria(patient, trial.eligibilityCriteria);
    if (!exclusionCheck.eligible) {
      eligibilityStatus = 'not_eligible';
      return {
        trial,
        matchScore: 0,
        matchReasons: [exclusionCheck.reason],
        eligibilityStatus: 'not_eligible',
        missingInformation: []
      };
    }

    // Determine final eligibility status
    if (matchScore >= 70 && missingInformation.length === 0) {
      eligibilityStatus = 'eligible';
    } else if (matchScore >= 40) {
      eligibilityStatus = 'potentially_eligible';
    } else {
      eligibilityStatus = 'not_eligible';
    }

    return {
      trial,
      matchScore,
      matchReasons,
      eligibilityStatus,
      missingInformation: missingInformation.length > 0 ? missingInformation : undefined
    };
  }

  /**
   * Check age eligibility
   */
  private checkAgeEligibility(age: number, criteria: ClinicalTrial['eligibilityCriteria']): { eligible: boolean; reason: string } {
    if (criteria.minAge && age < criteria.minAge) {
      return { eligible: false, reason: `Patient age (${age}) below minimum age (${criteria.minAge})` };
    }
    if (criteria.maxAge && age > criteria.maxAge) {
      return { eligible: false, reason: `Patient age (${age}) above maximum age (${criteria.maxAge})` };
    }
    return { eligible: true, reason: 'Age criteria met' };
  }

  /**
   * Check gender eligibility
   */
  private checkGenderEligibility(gender: string, criteria: ClinicalTrial['eligibilityCriteria']): { eligible: boolean; reason: string } {
    if (!criteria.gender || criteria.gender.length === 0 || criteria.gender.includes('ALL')) {
      return { eligible: true, reason: 'Gender criteria met (all genders eligible)' };
    }
    
    const normalizedGender = gender.toUpperCase();
    if (criteria.gender.includes(normalizedGender)) {
      return { eligible: true, reason: 'Gender criteria met' };
    }
    
    return { eligible: false, reason: `Trial limited to ${criteria.gender.join(', ')}` };
  }

  /**
   * Check condition match
   */
  private checkConditionMatch(patientDiagnoses: string[], trialConditions: string[]): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    for (const diagnosis of patientDiagnoses) {
      for (const condition of trialConditions) {
        if (this.conditionsMatch(diagnosis, condition)) {
          score += 30;
          reasons.push(`Patient diagnosis "${diagnosis}" matches trial condition "${condition}"`);
          break;
        }
      }
    }

    return { score: Math.min(score, 40), reasons };
  }

  /**
   * Check if conditions match (fuzzy matching)
   */
  private conditionsMatch(diagnosis: string, trialCondition: string): boolean {
    const d = diagnosis.toLowerCase();
    const t = trialCondition.toLowerCase();
    
    // Exact match
    if (d === t) return true;
    
    // Substring match
    if (d.includes(t) || t.includes(d)) return true;
    
    // Common medical term matching
    const diagnosisTerms = d.split(/\s+/);
    const trialTerms = t.split(/\s+/);
    const commonTerms = diagnosisTerms.filter(term => 
      term.length > 3 && trialTerms.some(tt => tt.includes(term) || term.includes(tt))
    );
    
    return commonTerms.length >= 2;
  }

  /**
   * Check genetic profile match
   */
  private checkGeneticMatch(
    geneticProfile: NonNullable<PatientProfile['geneticProfile']>,
    criteria: ClinicalTrial['eligibilityCriteria']
  ): { score: number; reasons: string[]; missing: string[] } {
    let score = 0;
    const reasons: string[] = [];
    const missing: string[] = [];

    const inclusionText = criteria.inclusionCriteria.join(' ').toLowerCase();

    // Check for specific mutations
    if (geneticProfile.mutations && geneticProfile.mutations.length > 0) {
      for (const mutation of geneticProfile.mutations) {
        if (inclusionText.includes(mutation.toLowerCase())) {
          score += 20;
          reasons.push(`Patient has required mutation: ${mutation}`);
        }
      }
    } else if (inclusionText.includes('mutation')) {
      missing.push('Genetic mutation information required');
    }

    // Check for biomarkers
    if (geneticProfile.biomarkers) {
      for (const [biomarker, value] of Object.entries(geneticProfile.biomarkers)) {
        if (inclusionText.includes(biomarker.toLowerCase())) {
          score += 15;
          reasons.push(`Patient has relevant biomarker: ${biomarker}`);
        }
      }
    } else if (inclusionText.includes('biomarker')) {
      missing.push('Biomarker information required');
    }

    return { score: Math.min(score, 30), reasons, missing };
  }

  /**
   * Check location proximity
   */
  private checkLocationMatch(
    patientLocation: PatientProfile['location'],
    trialLocations: ClinicalTrial['locations']
  ): { score: number; reason?: string } {
    // Check if trial has locations in patient's country
    const sameCountry = trialLocations.some(loc => 
      loc.country.toLowerCase() === patientLocation.country.toLowerCase()
    );

    if (!sameCountry) {
      return { score: 0 };
    }

    // Check if trial has locations in patient's state
    const sameState = trialLocations.some(loc => 
      loc.state?.toLowerCase() === patientLocation.state.toLowerCase()
    );

    if (sameState) {
      return { score: 10, reason: `Trial site available in ${patientLocation.state}` };
    }

    return { score: 5, reason: `Trial site available in ${patientLocation.country}` };
  }

  /**
   * Check exclusion criteria
   */
  private checkExclusionCriteria(
    patient: PatientProfile,
    criteria: ClinicalTrial['eligibilityCriteria']
  ): { eligible: boolean; reason: string } {
    const exclusionText = criteria.exclusionCriteria.join(' ').toLowerCase();

    // Check comorbidities against exclusion criteria
    if (patient.comorbidities) {
      for (const comorbidity of patient.comorbidities) {
        if (exclusionText.includes(comorbidity.toLowerCase())) {
          return { 
            eligible: false, 
            reason: `Patient has excluded comorbidity: ${comorbidity}` 
          };
        }
      }
    }

    // Check previous treatments against exclusion criteria
    if (patient.previousTreatments) {
      for (const treatment of patient.previousTreatments) {
        if (exclusionText.includes(treatment.toLowerCase())) {
          return { 
            eligible: false, 
            reason: `Patient has received excluded treatment: ${treatment}` 
          };
        }
      }
    }

    return { eligible: true, reason: 'No exclusion criteria violated' };
  }

  /**
   * Parse trial data from API response
   */
  private parseTrialData(study: any): ClinicalTrial {
    const protocolSection = study.protocolSection || {};
    const identificationModule = protocolSection.identificationModule || {};
    const statusModule = protocolSection.statusModule || {};
    const conditionsModule = protocolSection.conditionsModule || {};
    const interventionsModule = protocolSection.armsInterventionsModule || {};
    const eligibilityModule = protocolSection.eligibilityModule || {};
    const contactsLocationsModule = protocolSection.contactsLocationsModule || {};

    return {
      nctId: identificationModule.nctId || '',
      title: identificationModule.briefTitle || 'Unknown Title',
      status: statusModule.overallStatus || 'UNKNOWN',
      phase: protocolSection.designModule?.phases?.[0] || 'N/A',
      conditions: conditionsModule.conditions || [],
      interventions: interventionsModule.interventions?.map((i: any) => i.name) || [],
      eligibilityCriteria: {
        inclusionCriteria: this.parseEligibilityCriteria(eligibilityModule.eligibilityCriteria, 'inclusion'),
        exclusionCriteria: this.parseEligibilityCriteria(eligibilityModule.eligibilityCriteria, 'exclusion'),
        minAge: this.parseAge(eligibilityModule.minimumAge),
        maxAge: this.parseAge(eligibilityModule.maximumAge),
        gender: eligibilityModule.sex ? [eligibilityModule.sex.toUpperCase()] : ['ALL']
      },
      locations: contactsLocationsModule.locations?.map((loc: any) => ({
        facility: loc.facility || '',
        city: loc.city || '',
        state: loc.state || '',
        country: loc.country || ''
      })) || [],
      contactInfo: contactsLocationsModule.centralContacts?.[0] ? {
        name: contactsLocationsModule.centralContacts[0].name || '',
        phone: contactsLocationsModule.centralContacts[0].phone,
        email: contactsLocationsModule.centralContacts[0].email
      } : undefined,
      studyUrl: `https://clinicaltrials.gov/study/${identificationModule.nctId}`
    };
  }

  /**
   * Parse eligibility criteria text
   */
  private parseEligibilityCriteria(criteriaText: string, type: 'inclusion' | 'exclusion'): string[] {
    if (!criteriaText) return [];

    const sections = criteriaText.split(/Inclusion Criteria:|Exclusion Criteria:/i);
    const relevantSection = type === 'inclusion' ? sections[1] : sections[2];
    
    if (!relevantSection) return [];

    return relevantSection
      .split(/\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.match(/^[-•*]/))
      .slice(0, 20); // Limit to 20 criteria
  }

  /**
   * Parse age string to number
   */
  private parseAge(ageString?: string): number | undefined {
    if (!ageString) return undefined;
    
    const match = ageString.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : undefined;
  }

  /**
   * Remove duplicate trials
   */
  private deduplicateTrials(trials: ClinicalTrial[]): ClinicalTrial[] {
    const seen = new Set<string>();
    return trials.filter(trial => {
      if (seen.has(trial.nctId)) {
        return false;
      }
      seen.add(trial.nctId);
      return true;
    });
  }

  /**
   * Get trial details by NCT ID
   */
  async getTrialDetails(nctId: string): Promise<ClinicalTrial | null> {
    try {
      const response = await axios.get(`${this.apiUrl}/studies/${nctId}`);
      const study = response.data.protocolSection;
      
      if (!study) return null;
      
      return this.parseTrialData({ protocolSection: study });
    } catch (error) {
      console.error(`Error fetching trial details for ${nctId}:`, error);
      return null;
    }
  }
}
