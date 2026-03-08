import { TemporalRelation, ClinicalFact } from '../types';

export class TemporalExtractionService {
  /**
   * Extract temporal relations from clinical facts and text
   */
  public extractTemporalRelations(
    text: string,
    facts: ClinicalFact[]
  ): TemporalRelation[] {
    const relations: TemporalRelation[] = [];
    
    // Extract time expressions
    const timeExpressions = this.extractTimeExpressions(text);
    
    // Match facts with time expressions
    for (const fact of facts) {
      const nearbyTimeExpressions = this.findNearbyTimeExpressions(
        fact,
        timeExpressions,
        text
      );
      
      for (const timeExpr of nearbyTimeExpressions) {
        const relationType = this.determineRelationType(fact, timeExpr, text);
        
        relations.push({
          event: fact.value,
          timeExpression: timeExpr.value,
          relationType,
          confidence: 0.80,
        });
      }
    }
    
    return relations;
  }

  /**
   * Extract time expressions from text
   */
  private extractTimeExpressions(text: string): Array<{
    value: string;
    startOffset: number;
    endOffset: number;
    type: 'absolute' | 'relative' | 'duration';
  }> {
    const expressions: Array<{
      value: string;
      startOffset: number;
      endOffset: number;
      type: 'absolute' | 'relative' | 'duration';
    }> = [];
    
    // Absolute time patterns
    const absolutePatterns = [
      /\d{1,2}\/\d{1,2}\/\d{2,4}/g, // Dates: 01/15/2024
      /\d{1,2}:\d{2}\s*(AM|PM)?/gi, // Times: 2:30 PM
      /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/gi,
      /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/gi,
    ];
    
    for (const pattern of absolutePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        expressions.push({
          value: match[0],
          startOffset: match.index,
          endOffset: match.index + match[0].length,
          type: 'absolute',
        });
      }
    }
    
    // Relative time patterns
    const relativePatterns = [
      /(\d+)\s+(hours?|days?|weeks?|months?|years?)\s+ago/gi,
      /yesterday|today|tomorrow/gi,
      /last (night|week|month|year)/gi,
      /this (morning|afternoon|evening|week|month|year)/gi,
      /since (yesterday|last week|last month)/gi,
    ];
    
    for (const pattern of relativePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        expressions.push({
          value: match[0],
          startOffset: match.index,
          endOffset: match.index + match[0].length,
          type: 'relative',
        });
      }
    }
    
    // Duration patterns
    const durationPatterns = [
      /for (\d+)\s+(hours?|days?|weeks?|months?|years?)/gi,
      /(\d+)\s+(hours?|days?|weeks?|months?|years?)\s+duration/gi,
    ];
    
    for (const pattern of durationPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        expressions.push({
          value: match[0],
          startOffset: match.index,
          endOffset: match.index + match[0].length,
          type: 'duration',
        });
      }
    }
    
    return expressions;
  }

  /**
   * Find time expressions near a clinical fact
   */
  private findNearbyTimeExpressions(
    fact: ClinicalFact,
    timeExpressions: Array<{
      value: string;
      startOffset: number;
      endOffset: number;
      type: string;
    }>,
    text: string
  ): Array<{ value: string; offset: number; type: string }> {
    const nearby: Array<{ value: string; offset: number; type: string }> = [];
    const maxDistance = 100; // characters
    
    for (const timeExpr of timeExpressions) {
      const distance = Math.min(
        Math.abs(timeExpr.startOffset - fact.startOffset),
        Math.abs(timeExpr.endOffset - fact.endOffset)
      );
      
      if (distance <= maxDistance) {
        nearby.push({
          value: timeExpr.value,
          offset: timeExpr.startOffset,
          type: timeExpr.type,
        });
      }
    }
    
    return nearby;
  }

  /**
   * Determine temporal relation type
   */
  private determineRelationType(
    fact: ClinicalFact,
    timeExpr: { value: string; offset: number; type: string },
    text: string
  ): 'before' | 'after' | 'during' | 'overlap' {
    // Extract context between fact and time expression
    const start = Math.min(fact.startOffset, timeExpr.offset);
    const end = Math.max(fact.endOffset, timeExpr.offset + timeExpr.value.length);
    
    if (start >= 0 && end <= text.length) {
      const context = text.substring(start, end).toLowerCase();
      
      // Check for temporal keywords
      if (context.includes('before') || context.includes('prior to')) {
        return 'before';
      }
      if (context.includes('after') || context.includes('following')) {
        return 'after';
      }
      if (context.includes('during') || context.includes('while')) {
        return 'during';
      }
    }
    
    // Default based on time expression type
    if (timeExpr.type === 'duration') {
      return 'during';
    }
    
    // If time expression comes before fact in text, assume "after"
    if (timeExpr.offset < fact.startOffset) {
      return 'after';
    }
    
    return 'overlap';
  }

  /**
   * Normalize time expressions to standard format
   */
  public normalizeTimeExpression(timeExpr: string): {
    normalized: string;
    type: 'absolute' | 'relative' | 'duration';
  } {
    const lower = timeExpr.toLowerCase();
    
    // Relative time normalization
    if (lower.includes('ago')) {
      const match = lower.match(/(\d+)\s+(hour|day|week|month|year)/);
      if (match) {
        return {
          normalized: `${match[1]} ${match[2]}${match[1] !== '1' ? 's' : ''} ago`,
          type: 'relative',
        };
      }
    }
    
    if (lower === 'yesterday') {
      return { normalized: '1 day ago', type: 'relative' };
    }
    
    if (lower === 'today') {
      return { normalized: 'current day', type: 'relative' };
    }
    
    // Duration normalization
    if (lower.includes('for')) {
      const match = lower.match(/for\s+(\d+)\s+(hour|day|week|month|year)/);
      if (match) {
        return {
          normalized: `${match[1]} ${match[2]}${match[1] !== '1' ? 's' : ''}`,
          type: 'duration',
        };
      }
    }
    
    return {
      normalized: timeExpr,
      type: 'absolute',
    };
  }

  /**
   * Create timeline from temporal relations
   */
  public createTimeline(relations: TemporalRelation[]): Array<{
    event: string;
    timepoint: string;
    order: number;
  }> {
    const timeline: Array<{
      event: string;
      timepoint: string;
      order: number;
    }> = [];
    
    // Sort relations by time (simplified)
    const sorted = [...relations].sort((a, b) => {
      const orderA = this.getTimeOrder(a.timeExpression);
      const orderB = this.getTimeOrder(b.timeExpression);
      return orderB - orderA; // Most recent first
    });
    
    sorted.forEach((relation, index) => {
      timeline.push({
        event: relation.event,
        timepoint: relation.timeExpression,
        order: index,
      });
    });
    
    return timeline;
  }

  /**
   * Get numeric order for time expression (for sorting)
   */
  private getTimeOrder(timeExpr: string): number {
    const lower = timeExpr.toLowerCase();
    
    // Parse relative time
    const agoMatch = lower.match(/(\d+)\s+(hour|day|week|month|year)s?\s+ago/);
    if (agoMatch) {
      const value = parseInt(agoMatch[1]);
      const unit = agoMatch[2];
      
      const multipliers: Record<string, number> = {
        hour: 1,
        day: 24,
        week: 24 * 7,
        month: 24 * 30,
        year: 24 * 365,
      };
      
      return -(value * (multipliers[unit] || 1)); // Negative for past
    }
    
    if (lower === 'today' || lower === 'now') {
      return 0;
    }
    
    if (lower === 'yesterday') {
      return -24;
    }
    
    return 0; // Default
  }
}

export const temporalExtractionService = new TemporalExtractionService();
