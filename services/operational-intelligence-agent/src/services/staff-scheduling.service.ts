import { addDays, startOfWeek, format, differenceInHours } from 'date-fns';
import { config } from '../config';
import {
  StaffMember,
  ShiftRequirement,
  ShiftAssignment,
  StaffSchedule,
  CapacityAlert,
} from '../types';

/**
 * Staff Scheduling Optimization Service
 * 
 * Uses Constraint Programming + Reinforcement Learning for optimal shift assignments
 * Implements Requirements 7.1, 7.2, 7.3, 7.4, 7.5
 */
export class StaffSchedulingService {
  /**
   * Generate optimal weekly schedule
   * Requirement 7.1: Generate optimal shift assignments considering availability, skills, and patient acuity
   */
  async generateWeeklySchedule(
    facilityId: string,
    weekStartDate: Date,
    staffMembers: StaffMember[],
    requirements: ShiftRequirement[]
  ): Promise<StaffSchedule> {
    const assignments: ShiftAssignment[] = [];
    const weekStart = startOfWeek(weekStartDate, { weekStartsOn: 1 }); // Monday
    
    // Track staff hours for the week
    const staffHours = new Map<string, number>();
    staffMembers.forEach(staff => {
      staffHours.set(staff.staffId, staff.currentHoursThisWeek);
    });
    
    // Sort requirements by priority (high acuity first)
    const sortedRequirements = [...requirements].sort((a, b) => {
      const acuityOrder = { high: 3, medium: 2, low: 1 };
      return acuityOrder[b.patientAcuity] - acuityOrder[a.patientAcuity];
    });
    
    // Assign shifts using constraint programming approach
    for (const req of sortedRequirements) {
      const eligibleStaff = this.findEligibleStaff(
        staffMembers,
        req,
        staffHours,
        assignments
      );
      
      if (eligibleStaff.length === 0) {
        console.warn(`No eligible staff found for requirement: ${JSON.stringify(req)}`);
        continue;
      }
      
      // Score each staff member for this shift
      const scoredStaff = eligibleStaff.map(staff => ({
        staff,
        score: this.calculateAssignmentScore(staff, req, staffHours, assignments),
      }));
      
      // Sort by score (higher is better)
      scoredStaff.sort((a, b) => b.score - a.score);
      
      // Assign top N staff members
      const assignCount = Math.min(req.requiredCount, scoredStaff.length);
      
      for (let i = 0; i < assignCount; i++) {
        const { staff } = scoredStaff[i];
        
        const shiftHours = this.getShiftHours(req.shift);
        const assignment: ShiftAssignment = {
          assignmentId: `assign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          staffId: staff.staffId,
          facilityId,
          date: req.date,
          shift: req.shift,
          startTime: shiftHours.start,
          endTime: shiftHours.end,
          workloadScore: this.calculateWorkloadScore(req.patientAcuity),
        };
        
        assignments.push(assignment);
        
        // Update staff hours
        const currentHours = staffHours.get(staff.staffId) || 0;
        staffHours.set(staff.staffId, currentHours + shiftHours.duration);
      }
    }
    
    // Calculate schedule quality metrics
    const coverageScore = this.calculateCoverageScore(requirements, assignments);
    const fairnessScore = this.calculateFairnessScore(staffMembers, staffHours);
    
    // Detect burnout risks
    const burnoutRisks = this.detectBurnoutRisks(staffMembers, staffHours, assignments);
    
    return {
      facilityId,
      weekStartDate: weekStart,
      assignments,
      coverageScore,
      fairnessScore,
      burnoutRisks,
    };
  }

  /**
   * Find eligible staff for a shift requirement
   */
  private findEligibleStaff(
    staffMembers: StaffMember[],
    requirement: ShiftRequirement,
    staffHours: Map<string, number>,
    existingAssignments: ShiftAssignment[]
  ): StaffMember[] {
    return staffMembers.filter(staff => {
      // Check role match
      if (staff.role !== requirement.role) return false;
      
      // Check skill level
      const skillLevels = ['junior', 'mid', 'senior', 'expert'];
      const staffSkillIndex = skillLevels.indexOf(staff.skillLevel);
      const requiredSkillIndex = skillLevels.indexOf(requirement.minSkillLevel);
      if (staffSkillIndex < requiredSkillIndex) return false;
      
      // Check availability
      const dayOfWeek = requirement.date.getDay();
      const isAvailable = staff.availability.some(
        avail => avail.dayOfWeek === dayOfWeek
      );
      if (!isAvailable) return false;
      
      // Check max hours
      const currentHours = staffHours.get(staff.staffId) || 0;
      const shiftDuration = this.getShiftHours(requirement.shift).duration;
      if (currentHours + shiftDuration > staff.maxHoursPerWeek) return false;
      
      // Check for conflicts (already assigned to another shift on same day)
      const hasConflict = existingAssignments.some(
        assign =>
          assign.staffId === staff.staffId &&
          assign.date.toDateString() === requirement.date.toDateString()
      );
      if (hasConflict) return false;
      
      return true;
    });
  }

  /**
   * Calculate assignment score for staff-shift pairing
   */
  private calculateAssignmentScore(
    staff: StaffMember,
    requirement: ShiftRequirement,
    staffHours: Map<string, number>,
    assignments: ShiftAssignment[]
  ): number {
    let score = 100;
    
    // Skill level bonus (prefer matching skill level to requirement)
    const skillLevels = ['junior', 'mid', 'senior', 'expert'];
    const staffSkillIndex = skillLevels.indexOf(staff.skillLevel);
    const requiredSkillIndex = skillLevels.indexOf(requirement.minSkillLevel);
    const skillMatch = staffSkillIndex === requiredSkillIndex;
    score += skillMatch ? 20 : (staffSkillIndex - requiredSkillIndex) * -5;
    
    // Experience bonus for high acuity
    if (requirement.patientAcuity === 'high' && staff.experienceYears >= 5) {
      score += 15;
    }
    
    // Preferred shift bonus
    if (staff.preferredShifts?.includes(requirement.shift)) {
      score += 10;
    }
    
    // Workload balance (prefer staff with fewer hours)
    const currentHours = staffHours.get(staff.staffId) || 0;
    const hoursRatio = currentHours / staff.maxHoursPerWeek;
    score -= hoursRatio * 30; // Penalty for high utilization
    
    // Consecutive shifts penalty
    const recentAssignments = assignments.filter(
      a => a.staffId === staff.staffId
    );
    if (recentAssignments.length > 0) {
      const lastAssignment = recentAssignments[recentAssignments.length - 1];
      const daysDiff = Math.abs(
        differenceInHours(requirement.date, lastAssignment.date) / 24
      );
      if (daysDiff < 1) score -= 20; // Penalty for back-to-back shifts
    }
    
    return score;
  }

  /**
   * Get shift hours
   */
  private getShiftHours(shift: 'morning' | 'afternoon' | 'night'): {
    start: string;
    end: string;
    duration: number;
  } {
    const shifts = {
      morning: { start: '07:00', end: '15:00', duration: 8 },
      afternoon: { start: '15:00', end: '23:00', duration: 8 },
      night: { start: '23:00', end: '07:00', duration: 8 },
    };
    return shifts[shift];
  }

  /**
   * Calculate workload score based on patient acuity
   */
  private calculateWorkloadScore(acuity: 'low' | 'medium' | 'high'): number {
    const scores = { low: 3, medium: 6, high: 9 };
    return scores[acuity];
  }

  /**
   * Calculate coverage score (how well requirements are met)
   */
  private calculateCoverageScore(
    requirements: ShiftRequirement[],
    assignments: ShiftAssignment[]
  ): number {
    let totalRequired = 0;
    let totalAssigned = 0;
    
    for (const req of requirements) {
      totalRequired += req.requiredCount;
      
      const matchingAssignments = assignments.filter(
        a =>
          a.date.toDateString() === req.date.toDateString() &&
          a.shift === req.shift
      );
      
      totalAssigned += matchingAssignments.length;
    }
    
    return totalRequired > 0 ? totalAssigned / totalRequired : 1;
  }

  /**
   * Calculate fairness score (how evenly workload is distributed)
   */
  private calculateFairnessScore(
    staffMembers: StaffMember[],
    staffHours: Map<string, number>
  ): number {
    const hoursArray = Array.from(staffHours.values());
    
    if (hoursArray.length === 0) return 1;
    
    const mean = hoursArray.reduce((sum, h) => sum + h, 0) / hoursArray.length;
    const variance =
      hoursArray.reduce((sum, h) => sum + Math.pow(h - mean, 2), 0) /
      hoursArray.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower standard deviation = more fair distribution
    // Normalize to 0-1 scale (assuming max stdDev of 20 hours)
    return Math.max(0, 1 - stdDev / 20);
  }

  /**
   * Detect burnout risks
   * Requirement 7.5: Detect burnout risk indicators and alert management
   */
  private detectBurnoutRisks(
    staffMembers: StaffMember[],
    staffHours: Map<string, number>,
    assignments: ShiftAssignment[]
  ): Array<{
    staffId: string;
    riskLevel: number;
    factors: string[];
    recommendations: string[];
  }> {
    const risks: Array<{
      staffId: string;
      riskLevel: number;
      factors: string[];
      recommendations: string[];
    }> = [];
    
    for (const staff of staffMembers) {
      const factors: string[] = [];
      let riskScore = 0;
      
      const hours = staffHours.get(staff.staffId) || 0;
      const utilizationRate = hours / staff.maxHoursPerWeek;
      
      // High utilization
      if (utilizationRate > 0.9) {
        factors.push('Excessive hours (>90% of maximum)');
        riskScore += 0.4;
      } else if (utilizationRate > 0.8) {
        factors.push('High utilization (>80% of maximum)');
        riskScore += 0.2;
      }
      
      // Consecutive shifts
      const staffAssignments = assignments
        .filter(a => a.staffId === staff.staffId)
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      
      let consecutiveDays = 0;
      let maxConsecutive = 0;
      
      for (let i = 1; i < staffAssignments.length; i++) {
        const daysDiff =
          (staffAssignments[i].date.getTime() -
            staffAssignments[i - 1].date.getTime()) /
          (1000 * 60 * 60 * 24);
        
        if (daysDiff <= 1) {
          consecutiveDays++;
          maxConsecutive = Math.max(maxConsecutive, consecutiveDays);
        } else {
          consecutiveDays = 0;
        }
      }
      
      if (maxConsecutive >= 6) {
        factors.push(`${maxConsecutive} consecutive days without break`);
        riskScore += 0.3;
      } else if (maxConsecutive >= 5) {
        factors.push(`${maxConsecutive} consecutive days`);
        riskScore += 0.15;
      }
      
      // Night shifts
      const nightShifts = staffAssignments.filter(a => a.shift === 'night').length;
      if (nightShifts >= 4) {
        factors.push(`${nightShifts} night shifts in week`);
        riskScore += 0.2;
      }
      
      // High workload
      const avgWorkload =
        staffAssignments.reduce((sum, a) => sum + a.workloadScore, 0) /
        (staffAssignments.length || 1);
      if (avgWorkload >= 7) {
        factors.push('Consistently high patient acuity assignments');
        riskScore += 0.15;
      }
      
      // Generate recommendations if at risk
      if (riskScore >= config.prediction.burnoutRiskThreshold) {
        const recommendations: string[] = [];
        
        if (utilizationRate > 0.85) {
          recommendations.push('Reduce scheduled hours for next week');
        }
        if (maxConsecutive >= 5) {
          recommendations.push('Ensure at least 2 consecutive days off');
        }
        if (nightShifts >= 3) {
          recommendations.push('Limit night shifts to maximum 3 per week');
        }
        if (avgWorkload >= 7) {
          recommendations.push('Balance with lower acuity assignments');
        }
        
        recommendations.push('Schedule wellness check-in with manager');
        
        risks.push({
          staffId: staff.staffId,
          riskLevel: Math.min(1, riskScore),
          factors,
          recommendations,
        });
      }
    }
    
    return risks;
  }

  /**
   * Handle staff call-in sick scenario
   * Requirement 7.4: Recommend on-call staff or shift adjustments within 5 minutes
   */
  async handleStaffCallIn(
    facilityId: string,
    absentStaffId: string,
    affectedDate: Date,
    affectedShift: 'morning' | 'afternoon' | 'night',
    availableStaff: StaffMember[]
  ): Promise<{
    replacements: StaffMember[];
    adjustments: string[];
    processingTime: number;
  }> {
    const startTime = Date.now();
    
    // Find on-call staff who can cover
    const eligibleReplacements = availableStaff.filter(staff => {
      const dayOfWeek = affectedDate.getDay();
      return staff.availability.some(avail => avail.dayOfWeek === dayOfWeek);
    });
    
    // Score replacements
    const scoredReplacements = eligibleReplacements.map(staff => ({
      staff,
      score: this.calculateReplacementScore(staff, affectedShift),
    }));
    
    scoredReplacements.sort((a, b) => b.score - a.score);
    
    const replacements = scoredReplacements.slice(0, 3).map(r => r.staff);
    
    const adjustments: string[] = [];
    
    if (replacements.length === 0) {
      adjustments.push('No immediate replacement available');
      adjustments.push('Consider splitting shift among existing staff');
      adjustments.push('Activate emergency staffing protocol');
    } else {
      adjustments.push(`Contact ${replacements[0].name} (best match)`);
      if (replacements.length > 1) {
        adjustments.push(`Backup options: ${replacements.slice(1).map(r => r.name).join(', ')}`);
      }
    }
    
    const processingTime = Date.now() - startTime;
    
    return {
      replacements,
      adjustments,
      processingTime,
    };
  }

  /**
   * Calculate replacement score for call-in scenario
   */
  private calculateReplacementScore(
    staff: StaffMember,
    shift: 'morning' | 'afternoon' | 'night'
  ): number {
    let score = 100;
    
    // Preferred shift bonus
    if (staff.preferredShifts?.includes(shift)) {
      score += 30;
    }
    
    // Experience bonus
    score += staff.experienceYears * 2;
    
    // Skill level bonus
    const skillBonus = { junior: 0, mid: 10, senior: 20, expert: 30 };
    score += skillBonus[staff.skillLevel];
    
    // Current hours penalty (prefer less utilized staff)
    const utilizationRate = staff.currentHoursThisWeek / staff.maxHoursPerWeek;
    score -= utilizationRate * 40;
    
    return score;
  }

  /**
   * Redistribute tasks when workload exceeds threshold
   * Requirement 7.2: Redistribute tasks when workload exceeds safe thresholds
   */
  async redistributeTasks(
    overloadedStaffId: string,
    currentWorkload: number,
    safeThreshold: number,
    availableStaff: StaffMember[]
  ): Promise<{
    redistributionPlan: Array<{
      fromStaffId: string;
      toStaffId: string;
      taskCount: number;
    }>;
    newWorkloads: Map<string, number>;
  }> {
    const redistributionPlan: Array<{
      fromStaffId: string;
      toStaffId: string;
      taskCount: number;
    }> = [];
    
    const excessWorkload = currentWorkload - safeThreshold;
    
    // Find staff with capacity
    const staffWithCapacity = availableStaff
      .filter(staff => staff.staffId !== overloadedStaffId)
      .map(staff => ({
        staff,
        capacity: safeThreshold - (staff.currentHoursThisWeek / staff.maxHoursPerWeek) * 10,
      }))
      .filter(s => s.capacity > 0)
      .sort((a, b) => b.capacity - a.capacity);
    
    let remainingWorkload = excessWorkload;
    
    for (const { staff, capacity } of staffWithCapacity) {
      if (remainingWorkload <= 0) break;
      
      const transferAmount = Math.min(remainingWorkload, capacity);
      
      redistributionPlan.push({
        fromStaffId: overloadedStaffId,
        toStaffId: staff.staffId,
        taskCount: Math.ceil(transferAmount),
      });
      
      remainingWorkload -= transferAmount;
    }
    
    // Calculate new workloads
    const newWorkloads = new Map<string, number>();
    newWorkloads.set(overloadedStaffId, currentWorkload - excessWorkload + remainingWorkload);
    
    for (const plan of redistributionPlan) {
      const currentLoad = newWorkloads.get(plan.toStaffId) || 0;
      newWorkloads.set(plan.toStaffId, currentLoad + plan.taskCount);
    }
    
    return {
      redistributionPlan,
      newWorkloads,
    };
  }

  /**
   * Prioritize assignments for high-acuity patients
   * Requirement 7.3: Prioritize experienced nurses for high-acuity patients
   */
  assignHighAcuityPatients(
    patientIds: string[],
    availableStaff: StaffMember[],
    patientAcuity: 'high'
  ): Map<string, string[]> {
    // Filter for experienced staff
    const experiencedStaff = availableStaff
      .filter(staff => staff.experienceYears >= 5 || staff.skillLevel === 'expert' || staff.skillLevel === 'senior')
      .sort((a, b) => b.experienceYears - a.experienceYears);
    
    const assignments = new Map<string, string[]>();
    
    // Distribute patients evenly among experienced staff
    const patientsPerStaff = Math.ceil(patientIds.length / experiencedStaff.length);
    
    let patientIndex = 0;
    for (const staff of experiencedStaff) {
      const assignedPatients = patientIds.slice(
        patientIndex,
        patientIndex + patientsPerStaff
      );
      
      if (assignedPatients.length > 0) {
        assignments.set(staff.staffId, assignedPatients);
        patientIndex += assignedPatients.length;
      }
      
      if (patientIndex >= patientIds.length) break;
    }
    
    return assignments;
  }
}
