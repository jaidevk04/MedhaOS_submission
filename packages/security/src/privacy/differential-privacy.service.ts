/**
 * Differential Privacy Service
 * Implements differential privacy mechanisms for data protection
 */

import { DifferentialPrivacyConfig } from '../types';
import { securityConfig } from '../config';

export class DifferentialPrivacyService {
  private epsilon: number;

  constructor() {
    this.epsilon = securityConfig.privacy.differentialPrivacyEpsilon;
  }

  /**
   * Add Laplace noise to numeric value
   */
  addLaplaceNoise(value: number, sensitivity: number, epsilon?: number): number {
    const eps = epsilon || this.epsilon;
    const scale = sensitivity / eps;
    const noise = this.sampleLaplace(scale);
    return value + noise;
  }

  /**
   * Add Gaussian noise to numeric value
   */
  addGaussianNoise(
    value: number,
    sensitivity: number,
    epsilon?: number,
    delta: number = 1e-5
  ): number {
    const eps = epsilon || this.epsilon;
    const sigma = (sensitivity * Math.sqrt(2 * Math.log(1.25 / delta))) / eps;
    const noise = this.sampleGaussian(0, sigma);
    return value + noise;
  }

  /**
   * Apply differential privacy to query result
   */
  async applyDifferentialPrivacy(
    queryResult: number,
    config: DifferentialPrivacyConfig
  ): Promise<number> {
    switch (config.mechanism) {
      case 'LAPLACE':
        return this.addLaplaceNoise(queryResult, config.sensitivity, config.epsilon);
      case 'GAUSSIAN':
        return this.addGaussianNoise(
          queryResult,
          config.sensitivity,
          config.epsilon,
          config.delta
        );
      case 'EXPONENTIAL':
        return this.applyExponentialMechanism(queryResult, config);
      default:
        return queryResult;
    }
  }

  /**
   * Apply differential privacy to aggregate statistics
   */
  async applyToAggregates(data: {
    count: number;
    sum: number;
    mean: number;
    min: number;
    max: number;
  }): Promise<any> {
    const epsilon = this.epsilon / 5; // Split privacy budget across 5 queries

    return {
      count: Math.round(this.addLaplaceNoise(data.count, 1, epsilon)),
      sum: this.addLaplaceNoise(data.sum, 1, epsilon),
      mean: this.addLaplaceNoise(data.mean, 1, epsilon),
      min: this.addLaplaceNoise(data.min, 1, epsilon),
      max: this.addLaplaceNoise(data.max, 1, epsilon),
    };
  }

  /**
   * Apply differential privacy to histogram
   */
  async applyToHistogram(histogram: Record<string, number>): Promise<Record<string, number>> {
    const noisyHistogram: Record<string, number> = {};
    const epsilon = this.epsilon / Object.keys(histogram).length;

    for (const [key, value] of Object.entries(histogram)) {
      noisyHistogram[key] = Math.max(0, Math.round(this.addLaplaceNoise(value, 1, epsilon)));
    }

    return noisyHistogram;
  }

  /**
   * Check if privacy budget is exhausted
   */
  checkPrivacyBudget(usedEpsilon: number): boolean {
    return usedEpsilon <= this.epsilon;
  }

  /**
   * Calculate privacy loss
   */
  calculatePrivacyLoss(queries: number, epsilonPerQuery: number): number {
    return queries * epsilonPerQuery;
  }

  /**
   * Sample from Laplace distribution
   */
  private sampleLaplace(scale: number): number {
    const u = Math.random() - 0.5;
    return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  }

  /**
   * Sample from Gaussian distribution (Box-Muller transform)
   */
  private sampleGaussian(mean: number, stdDev: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + stdDev * z0;
  }

  /**
   * Apply exponential mechanism
   */
  private applyExponentialMechanism(
    value: number,
    config: DifferentialPrivacyConfig
  ): number {
    // Simplified exponential mechanism
    // In production, implement proper utility function and sampling
    const noise = this.sampleLaplace(config.sensitivity / config.epsilon);
    return value + noise;
  }

  /**
   * Apply differential privacy to patient count query
   */
  async getPrivatePatientCount(actualCount: number): Promise<number> {
    const sensitivity = 1; // Adding/removing one patient changes count by 1
    const noisyCount = this.addLaplaceNoise(actualCount, sensitivity);
    return Math.max(0, Math.round(noisyCount));
  }

  /**
   * Apply differential privacy to disease prevalence
   */
  async getPrivatePrevalence(
    diseaseCount: number,
    totalPopulation: number
  ): Promise<number> {
    const sensitivity = 1 / totalPopulation;
    const actualPrevalence = diseaseCount / totalPopulation;
    const noisyPrevalence = this.addLaplaceNoise(actualPrevalence, sensitivity);
    return Math.max(0, Math.min(1, noisyPrevalence));
  }

  /**
   * Apply differential privacy to age distribution
   */
  async getPrivateAgeDistribution(ageGroups: Record<string, number>): Promise<Record<string, number>> {
    return this.applyToHistogram(ageGroups);
  }

  /**
   * Get privacy parameters
   */
  getPrivacyParameters(): { epsilon: number; delta: number } {
    return {
      epsilon: this.epsilon,
      delta: 1e-5,
    };
  }

  /**
   * Set epsilon value
   */
  setEpsilon(epsilon: number): void {
    if (epsilon <= 0) {
      throw new Error('Epsilon must be positive');
    }
    this.epsilon = epsilon;
  }
}

export default new DifferentialPrivacyService();
