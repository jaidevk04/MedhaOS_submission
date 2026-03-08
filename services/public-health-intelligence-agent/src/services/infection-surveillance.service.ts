import { v4 as uuidv4 } from 'uuid';
import { subHours, isWithinInterval } from 'date-fns';
import { config } from '../config';
import {
  PatientSymptom,
  InfectionCluster,
  InfectionAlert,
  DBSCANParams,
  ClusterPoint,
} from '../types';

/**
 * Infection Surveillance Service
 * 
 * Implements DBSCAN clustering for symptom pattern detection
 * Detects Healthcare-Associated Infection (HAI) outbreaks
 * Identifies infection sources and transmission patterns
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */
export class InfectionSurveillanceService {
  private readonly minCases = config.prediction.infectionClusterMinCases;
  private readonly timeWindowHours = config.prediction.infectionClusterTimeWindowHours;

  /**
   * DBSCAN clustering algorithm implementation
   */
  private dbscan(points: ClusterPoint[], params: DBSCANParams): Map<string, number> {
    const { epsilon, minSamples, metric } = params;
    const clusters = new Map<string, number>();
    let clusterId = 0;
    
    // Initialize all points as unvisited
    const visited = new Set<string>();
    const noise = new Set<string>();
    
    for (const point of points) {
      if (visited.has(point.id)) continue;
      
      visited.add(point.id);
      
      // Find neighbors
      const neighbors = this.findNeighbors(point, points, epsilon, metric);
      
      if (neighbors.length < minSamples) {
        // Mark as noise
        noise.add(point.id);
        clusters.set(point.id, -1);
      } else {
        // Start new cluster
        this.expandCluster(point, neighbors, clusterId, clusters, visited, points, epsilon, minSamples, metric);
        clusterId++;
      }
    }
    
    return clusters;
  }

  /**
   * Find neighbors within epsilon distance
   */
  private findNeighbors(
    point: ClusterPoint,
    allPoints: ClusterPoint[],
    epsilon: number,
    metric: 'euclidean' | 'manhattan' | 'haversine'
  ): ClusterPoint[] {
    const neighbors: ClusterPoint[] = [];
    
    for (const other of allPoints) {
      if (point.id === other.id) continue;
      
      const distance = this.calculateDistance(point.coordinates, other.coordinates, metric);
      
      if (distance <= epsilon) {
        neighbors.push(other);
      }
    }
    
    return neighbors;
  }

  /**
   * Expand cluster by adding density-reachable points
   */
  private expandCluster(
    point: ClusterPoint,
    neighbors: ClusterPoint[],
    clusterId: number,
    clusters: Map<string, number>,
    visited: Set<string>,
    allPoints: ClusterPoint[],
    epsilon: number,
    minSamples: number,
    metric: 'euclidean' | 'manhattan' | 'haversine'
  ): void {
    clusters.set(point.id, clusterId);
    
    const queue = [...neighbors];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (!visited.has(current.id)) {
        visited.add(current.id);
        
        const currentNeighbors = this.findNeighbors(current, allPoints, epsilon, metric);
        
        if (currentNeighbors.length >= minSamples) {
          queue.push(...currentNeighbors);
        }
      }
      
      if (!clusters.has(current.id) || clusters.get(current.id) === -1) {
        clusters.set(current.id, clusterId);
      }
    }
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(
    coord1: number[],
    coord2: number[],
    metric: 'euclidean' | 'manhattan' | 'haversine'
  ): number {
    if (metric === 'euclidean') {
      return Math.sqrt(
        coord1.reduce((sum, val, i) => sum + Math.pow(val - coord2[i], 2), 0)
      );
    } else if (metric === 'manhattan') {
      return coord1.reduce((sum, val, i) => sum + Math.abs(val - coord2[i]), 0);
    } else if (metric === 'haversine') {
      // For geographic coordinates [lat, lon]
      const R = 6371; // Earth radius in km
      const dLat = this.toRadians(coord2[0] - coord1[0]);
      const dLon = this.toRadians(coord2[1] - coord1[1]);
      
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.toRadians(coord1[0])) *
          Math.cos(this.toRadians(coord2[0])) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }
    
    return 0;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Detect symptom clusters using DBSCAN
   */
  async detectSymptomClusters(
    facilityId: string,
    timeWindow?: { start: Date; end: Date }
  ): Promise<InfectionCluster[]> {
    // Set default time window if not provided
    const endTime = timeWindow?.end || new Date();
    const startTime = timeWindow?.start || subHours(endTime, this.timeWindowHours);
    
    // Fetch patient symptoms within time window
    const symptoms = await this.fetchPatientSymptoms(facilityId, startTime, endTime);
    
    if (symptoms.length < this.minCases) {
      return [];
    }
    
    // Convert symptoms to cluster points
    const points = this.convertToClusterPoints(symptoms);
    
    // Run DBSCAN clustering
    const dbscanParams: DBSCANParams = {
      epsilon: 0.5, // Adjust based on facility layout
      minSamples: this.minCases,
      metric: 'euclidean',
    };
    
    const clusterAssignments = this.dbscan(points, dbscanParams);
    
    // Group points by cluster
    const clusterGroups = new Map<number, ClusterPoint[]>();
    
    for (const [pointId, clusterId] of clusterAssignments.entries()) {
      if (clusterId === -1) continue; // Skip noise
      
      if (!clusterGroups.has(clusterId)) {
        clusterGroups.set(clusterId, []);
      }
      
      const point = points.find(p => p.id === pointId)!;
      clusterGroups.get(clusterId)!.push(point);
    }
    
    // Create infection clusters
    const infectionClusters: InfectionCluster[] = [];
    
    for (const [clusterId, clusterPoints] of clusterGroups.entries()) {
      const cluster = await this.createInfectionCluster(
        facilityId,
        clusterPoints,
        symptoms,
        { start: startTime, end: endTime }
      );
      
      infectionClusters.push(cluster);
    }
    
    return infectionClusters;
  }

  /**
   * Fetch patient symptoms from database
   */
  private async fetchPatientSymptoms(
    facilityId: string,
    startTime: Date,
    endTime: Date
  ): Promise<PatientSymptom[]> {
    // In production, query from database
    // For now, return mock data
    const mockSymptoms: PatientSymptom[] = [];
    
    // Simulate some clustered cases
    for (let i = 0; i < 5; i++) {
      mockSymptoms.push({
        patientId: `patient-${i}`,
        facilityId,
        wardId: 'ward-icu',
        timestamp: new Date(startTime.getTime() + i * 3600000),
        symptoms: ['fever', 'cough', 'difficulty_breathing'],
        temperature: 38.5 + Math.random(),
        labConfirmed: i > 2,
        infectionType: 'respiratory',
        location: {
          building: 'main',
          floor: '3',
          room: `301-${i}`,
        },
      });
    }
    
    return mockSymptoms;
  }

  /**
   * Convert patient symptoms to cluster points
   */
  private convertToClusterPoints(symptoms: PatientSymptom[]): ClusterPoint[] {
    return symptoms.map(symptom => ({
      id: symptom.patientId,
      coordinates: [
        // Use room number as spatial coordinate (simplified)
        parseInt(symptom.location.room.split('-')[0]) || 0,
        parseInt(symptom.location.room.split('-')[1]) || 0,
        // Temporal coordinate (hours since epoch / 1000)
        symptom.timestamp.getTime() / 3600000,
      ],
      timestamp: symptom.timestamp,
      metadata: {
        wardId: symptom.wardId,
        symptoms: symptom.symptoms,
        temperature: symptom.temperature,
        labConfirmed: symptom.labConfirmed,
      },
    }));
  }

  /**
   * Create infection cluster from cluster points
   */
  private async createInfectionCluster(
    facilityId: string,
    clusterPoints: ClusterPoint[],
    allSymptoms: PatientSymptom[],
    timeWindow: { start: Date; end: Date }
  ): Promise<InfectionCluster> {
    const clusterId = uuidv4();
    
    // Get patient IDs in cluster
    const patientIds = clusterPoints.map(p => p.id);
    
    // Determine infection type (most common)
    const infectionTypes = clusterPoints
      .map(p => allSymptoms.find(s => s.patientId === p.id)?.infectionType)
      .filter(Boolean) as string[];
    
    const infectionType = this.getMostCommon(infectionTypes) || 'unknown';
    
    // Calculate spatial pattern
    const spatialPattern = this.calculateSpatialPattern(clusterPoints);
    
    // Determine if HAI
    const isHAI = await this.determineIfHAI(clusterPoints, allSymptoms);
    
    // Identify transmission pattern
    const transmissionPattern = this.identifyTransmissionPattern(clusterPoints, allSymptoms);
    
    // Identify likely source
    const sourceIdentification = await this.identifyInfectionSource(
      facilityId,
      clusterPoints,
      allSymptoms
    );
    
    // Calculate cluster score
    const clusterScore = this.calculateClusterScore(clusterPoints, spatialPattern);
    
    // Get ward ID (most common)
    const wardIds = clusterPoints.map(p => p.metadata.wardId as string);
    const wardId = this.getMostCommon(wardIds);
    
    return {
      clusterId,
      facilityId,
      wardId,
      detectionTimestamp: new Date(),
      infectionType,
      caseCount: clusterPoints.length,
      patients: patientIds,
      timeWindow,
      spatialPattern,
      clusterScore,
      isHAI,
      transmissionPattern,
      sourceIdentification,
    };
  }

  /**
   * Calculate spatial pattern of cluster
   */
  private calculateSpatialPattern(points: ClusterPoint[]): {
    centroid: { x: number; y: number };
    radius: number;
    density: number;
  } {
    // Calculate centroid
    const centroidX = points.reduce((sum, p) => sum + p.coordinates[0], 0) / points.length;
    const centroidY = points.reduce((sum, p) => sum + p.coordinates[1], 0) / points.length;
    
    // Calculate radius (max distance from centroid)
    const distances = points.map(p =>
      Math.sqrt(
        Math.pow(p.coordinates[0] - centroidX, 2) +
        Math.pow(p.coordinates[1] - centroidY, 2)
      )
    );
    const radius = Math.max(...distances);
    
    // Calculate density
    const area = Math.PI * radius * radius;
    const density = area > 0 ? points.length / area : 0;
    
    return {
      centroid: { x: centroidX, y: centroidY },
      radius,
      density,
    };
  }

  /**
   * Determine if cluster represents Healthcare-Associated Infection
   */
  private async determineIfHAI(
    clusterPoints: ClusterPoint[],
    allSymptoms: PatientSymptom[]
  ): Promise<boolean> {
    // HAI criteria:
    // 1. Infection onset > 48 hours after admission
    // 2. Clustered in specific ward/unit
    // 3. Similar infection type
    
    // For now, simplified logic
    const labConfirmedCount = clusterPoints.filter(
      p => p.metadata.labConfirmed
    ).length;
    
    const labConfirmedRatio = labConfirmedCount / clusterPoints.length;
    
    // If >50% lab confirmed and clustered, likely HAI
    return labConfirmedRatio > 0.5 && clusterPoints.length >= this.minCases;
  }

  /**
   * Identify transmission pattern
   */
  private identifyTransmissionPattern(
    clusterPoints: ClusterPoint[],
    allSymptoms: PatientSymptom[]
  ): 'person-to-person' | 'environmental' | 'device-related' | 'unknown' {
    // Analyze temporal and spatial patterns
    
    // Sort by timestamp
    const sortedPoints = [...clusterPoints].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
    
    // Check if cases are sequential (person-to-person)
    const timeGaps = [];
    for (let i = 1; i < sortedPoints.length; i++) {
      const gap = sortedPoints[i].timestamp.getTime() - sortedPoints[i - 1].timestamp.getTime();
      timeGaps.push(gap / 3600000); // Convert to hours
    }
    
    const avgTimeGap = timeGaps.reduce((a, b) => a + b, 0) / timeGaps.length;
    
    // If cases occur within 24-48 hours of each other, likely person-to-person
    if (avgTimeGap < 48) {
      return 'person-to-person';
    }
    
    // If cases are more spread out but in same location, likely environmental
    if (avgTimeGap > 48 && avgTimeGap < 168) {
      return 'environmental';
    }
    
    return 'unknown';
  }

  /**
   * Identify likely infection source
   */
  private async identifyInfectionSource(
    facilityId: string,
    clusterPoints: ClusterPoint[],
    allSymptoms: PatientSymptom[]
  ): Promise<{
    likelySource: string;
    confidence: number;
    evidence: string[];
  }> {
    const evidence: string[] = [];
    
    // Analyze spatial clustering
    const wardIds = clusterPoints.map(p => p.metadata.wardId as string);
    const uniqueWards = new Set(wardIds);
    
    if (uniqueWards.size === 1) {
      evidence.push(`All cases in same ward: ${Array.from(uniqueWards)[0]}`);
    }
    
    // Analyze temporal pattern
    const timestamps = clusterPoints.map(p => p.timestamp.getTime());
    const timeSpan = Math.max(...timestamps) - Math.min(...timestamps);
    const timeSpanHours = timeSpan / 3600000;
    
    evidence.push(`Cases occurred within ${timeSpanHours.toFixed(1)} hours`);
    
    // Determine likely source
    let likelySource = 'Unknown';
    let confidence = 0.5;
    
    if (uniqueWards.size === 1 && timeSpanHours < 48) {
      likelySource = `Ward ${Array.from(uniqueWards)[0]} - possible environmental contamination or staff transmission`;
      confidence = 0.75;
    } else if (timeSpanHours < 24) {
      likelySource = 'Rapid spread suggests common source exposure';
      confidence = 0.70;
    }
    
    return {
      likelySource,
      confidence,
      evidence,
    };
  }

  /**
   * Calculate cluster score (0-1)
   */
  private calculateClusterScore(
    clusterPoints: ClusterPoint[],
    spatialPattern: { centroid: { x: number; y: number }; radius: number; density: number }
  ): number {
    // Factors: size, density, lab confirmation rate
    const sizeFactor = Math.min(clusterPoints.length / 10, 1);
    const densityFactor = Math.min(spatialPattern.density, 1);
    const labConfirmedFactor = clusterPoints.filter(p => p.metadata.labConfirmed).length / clusterPoints.length;
    
    return (sizeFactor * 0.3 + densityFactor * 0.3 + labConfirmedFactor * 0.4);
  }

  /**
   * Create infection alert
   */
  async createInfectionAlert(cluster: InfectionCluster): Promise<InfectionAlert> {
    const alertId = uuidv4();
    
    // Determine severity
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    
    if (cluster.isHAI && cluster.caseCount >= 5) {
      severity = 'critical';
    } else if (cluster.isHAI || cluster.caseCount >= 4) {
      severity = 'high';
    } else if (cluster.caseCount >= this.minCases) {
      severity = 'medium';
    }
    
    // Generate recommendations
    const recommendations = this.generateInfectionRecommendations(cluster);
    
    const alert: InfectionAlert = {
      alertId,
      facilityId: cluster.facilityId,
      alertType: cluster.isHAI ? 'hai_outbreak' : 'cluster_detected',
      severity,
      infectionType: cluster.infectionType,
      affectedCount: cluster.caseCount,
      detectionTime: cluster.detectionTimestamp,
      location: cluster.wardId || 'Multiple wards',
      recommendations,
      isolationRequired: severity === 'critical' || severity === 'high',
      contactTracingRequired: true,
      environmentalSamplingRequired: cluster.transmissionPattern === 'environmental',
    };
    
    // In production, save to database and trigger notifications
    console.log('Infection alert created:', alert);
    
    return alert;
  }

  /**
   * Generate recommendations for infection control
   */
  private generateInfectionRecommendations(cluster: InfectionCluster): string[] {
    const recommendations: string[] = [];
    
    if (cluster.isHAI) {
      recommendations.push('Activate infection control team immediately');
      recommendations.push('Review and reinforce hand hygiene protocols');
      recommendations.push('Audit PPE usage and compliance');
    }
    
    if (cluster.transmissionPattern === 'person-to-person') {
      recommendations.push('Implement contact precautions');
      recommendations.push('Conduct contact tracing for all affected patients');
      recommendations.push('Screen healthcare workers for colonization');
    }
    
    if (cluster.transmissionPattern === 'environmental') {
      recommendations.push('Conduct environmental sampling');
      recommendations.push('Deep clean and disinfect affected areas');
      recommendations.push('Review cleaning protocols and schedules');
    }
    
    if (cluster.caseCount >= 5) {
      recommendations.push('Consider ward closure for deep cleaning');
      recommendations.push('Notify hospital administration and public health authorities');
    }
    
    recommendations.push(`Isolate affected patients in ${cluster.wardId || 'designated area'}`);
    recommendations.push('Increase surveillance for new cases');
    recommendations.push('Review antibiotic stewardship practices');
    
    return recommendations;
  }

  /**
   * Get most common element in array
   */
  private getMostCommon<T>(arr: T[]): T | undefined {
    if (arr.length === 0) return undefined;
    
    const counts = new Map<T, number>();
    
    for (const item of arr) {
      counts.set(item, (counts.get(item) || 0) + 1);
    }
    
    let maxCount = 0;
    let mostCommon: T | undefined;
    
    for (const [item, count] of counts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = item;
      }
    }
    
    return mostCommon;
  }

  /**
   * Monitor facility for infection clusters
   */
  async monitorFacility(facilityId: string): Promise<InfectionAlert[]> {
    const clusters = await this.detectSymptomClusters(facilityId);
    const alerts: InfectionAlert[] = [];
    
    for (const cluster of clusters) {
      const alert = await this.createInfectionAlert(cluster);
      alerts.push(alert);
    }
    
    return alerts;
  }
}
