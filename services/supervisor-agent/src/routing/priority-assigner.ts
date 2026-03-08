import { Event, Priority, EventType } from '../types';

/**
 * Priority Assigner - Assigns priority levels to events based on multiple factors
 */
export class PriorityAssigner {
  /**
   * Assign priority to event
   */
  assignPriority(event: Event): Priority {
    // If priority already set, validate and return
    if (event.priority) {
      return event.priority;
    }

    const scores = this.calculatePriorityScores(event);
    const totalScore = this.aggregateScores(scores);

    return this.scoreToPriority(totalScore);
  }

  /**
   * Calculate priority scores from different factors
   */
  private calculatePriorityScores(event: Event): {
    urgencyScore: number;
    clinicalScore: number;
    timeScore: number;
    resourceScore: number;
    impactScore: number;
  } {
    return {
      urgencyScore: this.calculateUrgencyScore(event),
      clinicalScore: this.calculateClinicalScore(event),
      timeScore: this.calculateTimeScore(event),
      resourceScore: this.calculateResourceScore(event),
      impactScore: this.calculateImpactScore(event),
    };
  }

  /**
   * Calculate urgency score (0-100)
   */
  private calculateUrgencyScore(event: Event): number {
    const payload = event.payload;

    // Direct urgency score
    if (payload.urgencyScore !== undefined) {
      return Math.min(100, Math.max(0, payload.urgencyScore));
    }

    // Severity level mapping
    if (payload.severity) {
      const severityMap: Record<string, number> = {
        CRITICAL: 100,
        HIGH: 80,
        MODERATE: 50,
        LOW: 20,
        MINIMAL: 10,
      };
      return severityMap[payload.severity.toUpperCase()] || 50;
    }

    // Alert level mapping
    if (payload.alertLevel) {
      const alertMap: Record<string, number> = {
        CRITICAL: 100,
        WARNING: 70,
        INFO: 30,
      };
      return alertMap[payload.alertLevel.toUpperCase()] || 30;
    }

    return 50; // Default moderate urgency
  }

  /**
   * Calculate clinical score based on medical factors (0-100)
   */
  private calculateClinicalScore(event: Event): number {
    if (event.eventType !== EventType.CLINICAL) {
      return 0;
    }

    const payload = event.payload;
    let score = 0;

    // Vital signs abnormalities
    if (payload.vitals) {
      const vitals = payload.vitals;

      // Blood pressure
      if (vitals.bloodPressure) {
        const [systolic, diastolic] = vitals.bloodPressure
          .split('/')
          .map(Number);
        if (systolic > 180 || systolic < 90 || diastolic > 120 || diastolic < 60) {
          score += 30;
        } else if (systolic > 140 || diastolic > 90) {
          score += 15;
        }
      }

      // Heart rate
      if (vitals.heartRate) {
        if (vitals.heartRate > 120 || vitals.heartRate < 50) {
          score += 25;
        } else if (vitals.heartRate > 100 || vitals.heartRate < 60) {
          score += 10;
        }
      }

      // Oxygen saturation
      if (vitals.spo2) {
        if (vitals.spo2 < 90) {
          score += 30;
        } else if (vitals.spo2 < 94) {
          score += 15;
        }
      }

      // Temperature
      if (vitals.temperature) {
        if (vitals.temperature > 103 || vitals.temperature < 95) {
          score += 20;
        } else if (vitals.temperature > 100.4) {
          score += 10;
        }
      }

      // Respiratory rate
      if (vitals.respiratoryRate) {
        if (vitals.respiratoryRate > 24 || vitals.respiratoryRate < 12) {
          score += 20;
        }
      }
    }

    // Critical symptoms
    if (payload.symptoms) {
      const criticalSymptoms = [
        'chest pain',
        'difficulty breathing',
        'severe bleeding',
        'loss of consciousness',
        'stroke',
        'seizure',
        'severe trauma',
      ];

      const symptoms = Array.isArray(payload.symptoms)
        ? payload.symptoms
        : [payload.symptoms];

      for (const symptom of symptoms) {
        if (
          criticalSymptoms.some((critical) =>
            symptom.toLowerCase().includes(critical)
          )
        ) {
          score += 40;
          break;
        }
      }
    }

    // Medical history risk factors
    if (payload.medicalHistory) {
      const highRiskConditions = [
        'heart disease',
        'diabetes',
        'cancer',
        'immunocompromised',
        'organ transplant',
      ];

      const history = Array.isArray(payload.medicalHistory)
        ? payload.medicalHistory
        : [payload.medicalHistory];

      for (const condition of history) {
        if (
          highRiskConditions.some((risk) =>
            condition.toLowerCase().includes(risk)
          )
        ) {
          score += 10;
          break;
        }
      }
    }

    return Math.min(100, score);
  }

  /**
   * Calculate time sensitivity score (0-100)
   */
  private calculateTimeScore(event: Event): number {
    const payload = event.payload;
    let score = 0;

    // Time-sensitive flag
    if (payload.timeSensitive === true) {
      score += 50;
    }

    // Scheduled time
    if (payload.scheduledTime || payload.appointmentTime) {
      const scheduledTime = new Date(
        payload.scheduledTime || payload.appointmentTime
      );
      const now = new Date();
      const minutesUntil = (scheduledTime.getTime() - now.getTime()) / 60000;

      if (minutesUntil < 0) {
        // Overdue
        score += 80;
      } else if (minutesUntil < 15) {
        score += 60;
      } else if (minutesUntil < 60) {
        score += 40;
      } else if (minutesUntil < 240) {
        score += 20;
      }
    }

    // Wait time
    if (payload.waitTime) {
      const waitMinutes =
        typeof payload.waitTime === 'number'
          ? payload.waitTime
          : parseInt(payload.waitTime, 10);

      if (waitMinutes > 120) {
        score += 40;
      } else if (waitMinutes > 60) {
        score += 25;
      } else if (waitMinutes > 30) {
        score += 15;
      }
    }

    // Expiry time (for medications, blood products)
    if (payload.expiryDate) {
      const expiryDate = new Date(payload.expiryDate);
      const now = new Date();
      const daysUntilExpiry =
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

      if (daysUntilExpiry < 0) {
        score += 100; // Expired
      } else if (daysUntilExpiry < 7) {
        score += 60;
      } else if (daysUntilExpiry < 30) {
        score += 30;
      }
    }

    return Math.min(100, score);
  }

  /**
   * Calculate resource availability score (0-100)
   */
  private calculateResourceScore(event: Event): number {
    const payload = event.payload;
    let score = 0;

    // Stock levels
    if (payload.stockLevel !== undefined) {
      const stockLevel =
        typeof payload.stockLevel === 'number'
          ? payload.stockLevel
          : parseInt(payload.stockLevel, 10);

      if (stockLevel === 0) {
        score += 100;
      } else if (stockLevel < 5) {
        score += 80;
      } else if (stockLevel < 10) {
        score += 60;
      } else if (stockLevel < 20) {
        score += 40;
      }
    }

    // Bed occupancy
    if (payload.bedOccupancy !== undefined) {
      const occupancy =
        typeof payload.bedOccupancy === 'number'
          ? payload.bedOccupancy
          : parseFloat(payload.bedOccupancy);

      if (occupancy >= 100) {
        score += 100;
      } else if (occupancy >= 95) {
        score += 80;
      } else if (occupancy >= 90) {
        score += 60;
      } else if (occupancy >= 85) {
        score += 40;
      }
    }

    // ICU occupancy
    if (payload.icuOccupancy !== undefined) {
      const occupancy =
        typeof payload.icuOccupancy === 'number'
          ? payload.icuOccupancy
          : parseFloat(payload.icuOccupancy);

      if (occupancy >= 100) {
        score += 100;
      } else if (occupancy >= 95) {
        score += 85;
      } else if (occupancy >= 90) {
        score += 70;
      } else if (occupancy >= 85) {
        score += 50;
      }
    }

    // Staff availability
    if (payload.staffAvailability !== undefined) {
      const availability =
        typeof payload.staffAvailability === 'number'
          ? payload.staffAvailability
          : parseFloat(payload.staffAvailability);

      if (availability < 50) {
        score += 70;
      } else if (availability < 70) {
        score += 40;
      } else if (availability < 85) {
        score += 20;
      }
    }

    return Math.min(100, score);
  }

  /**
   * Calculate impact score (0-100)
   */
  private calculateImpactScore(event: Event): number {
    const payload = event.payload;
    let score = 0;

    // Number of affected patients
    if (payload.affectedPatients !== undefined) {
      const count =
        typeof payload.affectedPatients === 'number'
          ? payload.affectedPatients
          : parseInt(payload.affectedPatients, 10);

      if (count > 100) {
        score += 80;
      } else if (count > 50) {
        score += 60;
      } else if (count > 10) {
        score += 40;
      } else if (count > 1) {
        score += 20;
      }
    }

    // Outbreak probability
    if (payload.outbreakProbability !== undefined) {
      const probability =
        typeof payload.outbreakProbability === 'number'
          ? payload.outbreakProbability
          : parseFloat(payload.outbreakProbability);

      score += probability; // 0-100 scale
    }

    // Financial impact
    if (payload.financialImpact !== undefined) {
      const impact =
        typeof payload.financialImpact === 'number'
          ? payload.financialImpact
          : parseFloat(payload.financialImpact);

      if (impact > 1000000) {
        score += 60;
      } else if (impact > 100000) {
        score += 40;
      } else if (impact > 10000) {
        score += 20;
      }
    }

    // System-wide impact
    if (payload.systemWide === true) {
      score += 50;
    }

    return Math.min(100, score);
  }

  /**
   * Aggregate scores with weights
   */
  private aggregateScores(scores: {
    urgencyScore: number;
    clinicalScore: number;
    timeScore: number;
    resourceScore: number;
    impactScore: number;
  }): number {
    const weights = {
      urgency: 0.35,
      clinical: 0.30,
      time: 0.15,
      resource: 0.10,
      impact: 0.10,
    };

    const totalScore =
      scores.urgencyScore * weights.urgency +
      scores.clinicalScore * weights.clinical +
      scores.timeScore * weights.time +
      scores.resourceScore * weights.resource +
      scores.impactScore * weights.impact;

    return totalScore;
  }

  /**
   * Convert score to priority level
   */
  private scoreToPriority(score: number): Priority {
    if (score >= 75) {
      return Priority.CRITICAL;
    } else if (score >= 50) {
      return Priority.URGENT;
    } else if (score >= 25) {
      return Priority.ROUTINE;
    } else {
      return Priority.SCHEDULED;
    }
  }

  /**
   * Get priority explanation
   */
  getPriorityExplanation(event: Event): string {
    const scores = this.calculatePriorityScores(event);
    const totalScore = this.aggregateScores(scores);
    const priority = this.scoreToPriority(totalScore);

    const factors: string[] = [];

    if (scores.urgencyScore > 50) {
      factors.push(`High urgency (${scores.urgencyScore.toFixed(0)})`);
    }
    if (scores.clinicalScore > 50) {
      factors.push(`Critical clinical factors (${scores.clinicalScore.toFixed(0)})`);
    }
    if (scores.timeScore > 50) {
      factors.push(`Time-sensitive (${scores.timeScore.toFixed(0)})`);
    }
    if (scores.resourceScore > 50) {
      factors.push(`Resource constraints (${scores.resourceScore.toFixed(0)})`);
    }
    if (scores.impactScore > 50) {
      factors.push(`High impact (${scores.impactScore.toFixed(0)})`);
    }

    const explanation = factors.length > 0
      ? `Priority ${priority} assigned based on: ${factors.join(', ')}`
      : `Priority ${priority} assigned (score: ${totalScore.toFixed(0)})`;

    return explanation;
  }
}
