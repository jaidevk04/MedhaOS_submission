import { subDays, differenceInMilliseconds } from 'date-fns';
import { WorkflowEvent, WorkflowBottleneck } from '../types';

/**
 * Workflow Optimization Service
 * 
 * Uses Process Mining + LLM analysis for bottleneck detection and improvement recommendations
 * Implements Requirement 6.4
 */
export class WorkflowOptimizationService {
  /**
   * Collect workflow events for analysis
   */
  async collectWorkflowEvents(
    facilityId: string,
    processName: string,
    daysBack: number = 30
  ): Promise<WorkflowEvent[]> {
    // In production, this would query from database
    // Simulate workflow events for common hospital processes
    const endDate = new Date();
    const startDate = subDays(endDate, daysBack);
    
    const events: WorkflowEvent[] = [];
    const processes = {
      'patient-admission': [
        'registration',
        'insurance-verification',
        'triage',
        'bed-assignment',
        'admission-complete',
      ],
      'diagnostic-imaging': [
        'order-placed',
        'patient-transport',
        'image-acquisition',
        'radiologist-review',
        'report-finalized',
      ],
      'medication-administration': [
        'prescription-entry',
        'pharmacy-verification',
        'medication-preparation',
        'nurse-administration',
        'documentation',
      ],
      'discharge-process': [
        'discharge-order',
        'medication-reconciliation',
        'discharge-instructions',
        'billing-clearance',
        'patient-departure',
      ],
    };
    
    const steps = processes[processName as keyof typeof processes] || processes['patient-admission'];
    
    // Simulate events
    const eventsPerDay = 20;
    for (let day = 0; day < daysBack; day++) {
      for (let i = 0; i < eventsPerDay; i++) {
        const eventDate = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000);
        
        for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
          const step = steps[stepIndex];
          
          // Simulate realistic durations with bottlenecks
          let baseDuration = 10 * 60 * 1000; // 10 minutes base
          
          // Add step-specific variations
          if (step.includes('verification') || step.includes('review')) {
            baseDuration = 20 * 60 * 1000; // 20 minutes
          }
          if (step.includes('transport')) {
            baseDuration = 15 * 60 * 1000; // 15 minutes
          }
          
          // Add random variation and occasional delays
          const randomFactor = 0.5 + Math.random();
          const hasDelay = Math.random() < 0.15; // 15% chance of delay
          const delayFactor = hasDelay ? 2 + Math.random() * 3 : 1;
          
          const duration = baseDuration * randomFactor * delayFactor;
          
          events.push({
            eventId: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            facilityId,
            timestamp: new Date(eventDate.getTime() + stepIndex * duration),
            processName,
            stepName: step,
            duration,
            staffInvolved: [`staff-${Math.floor(Math.random() * 50)}`],
            resourcesUsed: [`resource-${Math.floor(Math.random() * 20)}`],
            outcome: hasDelay ? 'delayed' : 'success',
            metadata: {
              patientId: `patient-${day}-${i}`,
              priority: Math.random() < 0.2 ? 'high' : 'normal',
            },
          });
        }
      }
    }
    
    return events;
  }

  /**
   * Perform process mining to identify bottlenecks
   * Requirement 6.4: Implement process mining for bottleneck detection
   */
  async identifyBottlenecks(
    facilityId: string,
    processName: string
  ): Promise<WorkflowBottleneck[]> {
    const events = await this.collectWorkflowEvents(facilityId, processName, 30);
    
    // Group events by step
    const stepGroups = new Map<string, WorkflowEvent[]>();
    
    for (const event of events) {
      const existing = stepGroups.get(event.stepName) || [];
      existing.push(event);
      stepGroups.set(event.stepName, existing);
    }
    
    const bottlenecks: WorkflowBottleneck[] = [];
    
    // Analyze each step
    for (const [stepName, stepEvents] of stepGroups.entries()) {
      const durations = stepEvents.map(e => e.duration).sort((a, b) => a - b);
      
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const p95Index = Math.floor(durations.length * 0.95);
      const p95Duration = durations[p95Index];
      
      const frequency = stepEvents.length;
      const delayRate = stepEvents.filter(e => e.outcome === 'delayed').length / frequency;
      
      // Calculate impact score (0-100)
      // Higher score = more significant bottleneck
      const durationImpact = Math.min(100, (avgDuration / (30 * 60 * 1000)) * 100); // Normalize to 30 min
      const frequencyImpact = Math.min(100, (frequency / 100) * 100); // Normalize to 100 events
      const delayImpact = delayRate * 100;
      
      const impactScore = (durationImpact * 0.4 + frequencyImpact * 0.3 + delayImpact * 0.3);
      
      // Identify root causes
      const rootCauses = this.identifyRootCauses(stepEvents, avgDuration, delayRate);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(
        stepName,
        rootCauses,
        avgDuration,
        delayRate
      );
      
      // Only include significant bottlenecks (impact > 40)
      if (impactScore > 40) {
        bottlenecks.push({
          processName,
          stepName,
          facilityId,
          averageDuration: avgDuration,
          p95Duration,
          frequency,
          impactScore,
          rootCauses,
          recommendations,
        });
      }
    }
    
    // Sort by impact score (highest first)
    bottlenecks.sort((a, b) => b.impactScore - a.impactScore);
    
    return bottlenecks;
  }

  /**
   * Identify root causes of bottlenecks
   */
  private identifyRootCauses(
    events: WorkflowEvent[],
    avgDuration: number,
    delayRate: number
  ): string[] {
    const causes: string[] = [];
    
    // High delay rate
    if (delayRate > 0.2) {
      causes.push(`High delay rate (${(delayRate * 100).toFixed(1)}% of cases delayed)`);
    }
    
    // Long average duration
    if (avgDuration > 30 * 60 * 1000) {
      causes.push(`Excessive average duration (${(avgDuration / 60000).toFixed(1)} minutes)`);
    }
    
    // Resource contention
    const resourceUsage = new Map<string, number>();
    events.forEach(e => {
      e.resourcesUsed.forEach(resource => {
        resourceUsage.set(resource, (resourceUsage.get(resource) || 0) + 1);
      });
    });
    
    const maxResourceUsage = Math.max(...Array.from(resourceUsage.values()));
    if (maxResourceUsage > events.length * 0.3) {
      causes.push('Resource contention detected (same resources overutilized)');
    }
    
    // Staff bottleneck
    const staffUsage = new Map<string, number>();
    events.forEach(e => {
      e.staffInvolved.forEach(staff => {
        staffUsage.set(staff, (staffUsage.get(staff) || 0) + 1);
      });
    });
    
    const maxStaffUsage = Math.max(...Array.from(staffUsage.values()));
    if (maxStaffUsage > events.length * 0.4) {
      causes.push('Staff bottleneck (limited staff availability)');
    }
    
    // Time-of-day patterns
    const hourlyDistribution = new Array(24).fill(0);
    events.forEach(e => {
      const hour = e.timestamp.getHours();
      hourlyDistribution[hour]++;
    });
    
    const peakHour = hourlyDistribution.indexOf(Math.max(...hourlyDistribution));
    const peakCount = hourlyDistribution[peakHour];
    const avgCount = hourlyDistribution.reduce((sum, c) => sum + c, 0) / 24;
    
    if (peakCount > avgCount * 2) {
      causes.push(`Peak hour congestion (${peakHour}:00 has 2x average volume)`);
    }
    
    // High variability
    const durations = events.map(e => e.duration);
    const variance = durations.reduce((sum, d) => {
      const diff = d - avgDuration;
      return sum + diff * diff;
    }, 0) / durations.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / avgDuration;
    
    if (coefficientOfVariation > 0.5) {
      causes.push('High process variability (inconsistent execution times)');
    }
    
    return causes;
  }

  /**
   * Generate improvement recommendations using LLM-like logic
   * Requirement 6.4: Build recommendation engine for improvements
   */
  private generateRecommendations(
    stepName: string,
    rootCauses: string[],
    avgDuration: number,
    delayRate: number
  ): string[] {
    const recommendations: string[] = [];
    
    // Address specific root causes
    for (const cause of rootCauses) {
      if (cause.includes('delay rate')) {
        recommendations.push('Implement real-time monitoring and alerts for delays');
        recommendations.push('Analyze delay patterns to identify preventable causes');
      }
      
      if (cause.includes('average duration')) {
        recommendations.push('Review and streamline step procedures');
        recommendations.push('Provide additional training to reduce processing time');
        recommendations.push('Consider automation opportunities');
      }
      
      if (cause.includes('Resource contention')) {
        recommendations.push('Increase resource capacity during peak hours');
        recommendations.push('Implement resource scheduling system');
        recommendations.push('Consider adding redundant resources');
      }
      
      if (cause.includes('Staff bottleneck')) {
        recommendations.push('Increase staffing levels for this step');
        recommendations.push('Cross-train staff to provide backup coverage');
        recommendations.push('Redistribute workload across available staff');
      }
      
      if (cause.includes('Peak hour')) {
        recommendations.push('Implement appointment scheduling to smooth demand');
        recommendations.push('Add staff during identified peak hours');
        recommendations.push('Encourage off-peak utilization where possible');
      }
      
      if (cause.includes('variability')) {
        recommendations.push('Standardize procedures with clear protocols');
        recommendations.push('Implement checklists to ensure consistency');
        recommendations.push('Provide refresher training on best practices');
      }
    }
    
    // Step-specific recommendations
    if (stepName.includes('verification') || stepName.includes('review')) {
      recommendations.push('Implement automated verification checks where possible');
      recommendations.push('Use decision support tools to accelerate review');
    }
    
    if (stepName.includes('transport')) {
      recommendations.push('Optimize transport routing and scheduling');
      recommendations.push('Consider dedicated transport staff');
    }
    
    if (stepName.includes('documentation')) {
      recommendations.push('Implement voice-to-text documentation');
      recommendations.push('Use templates and auto-population');
    }
    
    // General recommendations
    if (delayRate > 0.15) {
      recommendations.push('Establish service level agreements (SLAs) for this step');
      recommendations.push('Create escalation protocols for delays');
    }
    
    if (avgDuration > 20 * 60 * 1000) {
      recommendations.push('Conduct time-motion study to identify waste');
      recommendations.push('Implement lean process improvement methodology');
    }
    
    // Remove duplicates
    return Array.from(new Set(recommendations));
  }

  /**
   * Analyze workflow efficiency metrics
   */
  async analyzeWorkflowEfficiency(
    facilityId: string,
    processName: string
  ): Promise<{
    totalCases: number;
    averageCycleTime: number;
    p95CycleTime: number;
    successRate: number;
    bottleneckCount: number;
    efficiencyScore: number;
  }> {
    const events = await this.collectWorkflowEvents(facilityId, processName, 30);
    
    // Group events by patient/case
    const caseGroups = new Map<string, WorkflowEvent[]>();
    
    for (const event of events) {
      const caseId = event.metadata?.patientId || event.eventId;
      const existing = caseGroups.get(caseId) || [];
      existing.push(event);
      caseGroups.set(caseId, existing);
    }
    
    // Calculate cycle times
    const cycleTimes: number[] = [];
    let successfulCases = 0;
    
    for (const [caseId, caseEvents] of caseGroups.entries()) {
      const sortedEvents = caseEvents.sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      );
      
      if (sortedEvents.length > 0) {
        const firstEvent = sortedEvents[0];
        const lastEvent = sortedEvents[sortedEvents.length - 1];
        
        const cycleTime = differenceInMilliseconds(
          lastEvent.timestamp,
          firstEvent.timestamp
        );
        
        cycleTimes.push(cycleTime);
        
        const allSuccess = sortedEvents.every(e => e.outcome === 'success');
        if (allSuccess) successfulCases++;
      }
    }
    
    cycleTimes.sort((a, b) => a - b);
    
    const avgCycleTime = cycleTimes.reduce((sum, t) => sum + t, 0) / cycleTimes.length;
    const p95Index = Math.floor(cycleTimes.length * 0.95);
    const p95CycleTime = cycleTimes[p95Index];
    
    const successRate = successfulCases / caseGroups.size;
    
    // Identify bottlenecks
    const bottlenecks = await this.identifyBottlenecks(facilityId, processName);
    
    // Calculate efficiency score (0-100)
    // Higher is better
    const cycleTimeScore = Math.max(0, 100 - (avgCycleTime / (60 * 60 * 1000)) * 20); // Normalize to 1 hour
    const successScore = successRate * 100;
    const bottleneckScore = Math.max(0, 100 - bottlenecks.length * 10);
    
    const efficiencyScore = (cycleTimeScore * 0.4 + successScore * 0.4 + bottleneckScore * 0.2);
    
    return {
      totalCases: caseGroups.size,
      averageCycleTime: avgCycleTime,
      p95CycleTime,
      successRate,
      bottleneckCount: bottlenecks.length,
      efficiencyScore,
    };
  }

  /**
   * Generate comprehensive workflow optimization report
   */
  async generateOptimizationReport(
    facilityId: string,
    processNames: string[]
  ): Promise<{
    facilityId: string;
    generatedAt: Date;
    processes: Array<{
      processName: string;
      efficiency: any;
      bottlenecks: WorkflowBottleneck[];
      priorityRecommendations: string[];
    }>;
    overallScore: number;
  }> {
    const processes: Array<{
      processName: string;
      efficiency: any;
      bottlenecks: WorkflowBottleneck[];
      priorityRecommendations: string[];
    }> = [];
    
    let totalEfficiency = 0;
    
    for (const processName of processNames) {
      const efficiency = await this.analyzeWorkflowEfficiency(facilityId, processName);
      const bottlenecks = await this.identifyBottlenecks(facilityId, processName);
      
      // Get top 3 recommendations from highest impact bottlenecks
      const priorityRecommendations = bottlenecks
        .slice(0, 3)
        .flatMap(b => b.recommendations.slice(0, 2));
      
      processes.push({
        processName,
        efficiency,
        bottlenecks,
        priorityRecommendations,
      });
      
      totalEfficiency += efficiency.efficiencyScore;
    }
    
    const overallScore = totalEfficiency / processNames.length;
    
    return {
      facilityId,
      generatedAt: new Date(),
      processes,
      overallScore,
    };
  }

  /**
   * Simulate workflow improvement impact
   */
  async simulateImprovement(
    facilityId: string,
    processName: string,
    bottleneck: WorkflowBottleneck,
    improvementPercentage: number
  ): Promise<{
    currentMetrics: any;
    projectedMetrics: any;
    estimatedImpact: {
      cycleTimeReduction: number;
      capacityIncrease: number;
      costSavings: number;
    };
  }> {
    const currentMetrics = await this.analyzeWorkflowEfficiency(facilityId, processName);
    
    // Project improvements
    const stepImpactRatio = bottleneck.averageDuration / currentMetrics.averageCycleTime;
    const cycleTimeReduction = currentMetrics.averageCycleTime * stepImpactRatio * (improvementPercentage / 100);
    
    const projectedCycleTime = currentMetrics.averageCycleTime - cycleTimeReduction;
    const capacityIncrease = (currentMetrics.averageCycleTime / projectedCycleTime - 1) * 100;
    
    // Estimate cost savings (assuming $100/hour operational cost)
    const hoursSaved = (cycleTimeReduction / (1000 * 60 * 60)) * currentMetrics.totalCases;
    const costSavings = hoursSaved * 100;
    
    const projectedMetrics = {
      ...currentMetrics,
      averageCycleTime: projectedCycleTime,
      efficiencyScore: Math.min(100, currentMetrics.efficiencyScore + improvementPercentage * 0.5),
    };
    
    return {
      currentMetrics,
      projectedMetrics,
      estimatedImpact: {
        cycleTimeReduction,
        capacityIncrease,
        costSavings,
      },
    };
  }
}
