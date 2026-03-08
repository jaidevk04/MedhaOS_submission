/**
 * Compliance Reporting Service
 * Generates compliance reports across all standards
 */

import { ComplianceReport, ComplianceCheck } from '../types';
import abdmComplianceService from './abdm-compliance.service';
import dishaActComplianceService from './disha-act-compliance.service';
import iso27001ComplianceService from './iso27001-compliance.service';

export class ComplianceReportingService {
  /**
   * Generate comprehensive compliance report
   */
  async generateComplianceReport(): Promise<ComplianceReport> {
    const allChecks: ComplianceCheck[] = [];

    // Collect checks from all standards
    const abdmChecks = await abdmComplianceService.performComplianceChecks();
    const dishaChecks = await dishaActComplianceService.performComplianceChecks();
    const isoChecks = await iso27001ComplianceService.performComplianceChecks();

    allChecks.push(...abdmChecks, ...dishaChecks, ...isoChecks);

    const summary = {
      total: allChecks.length,
      compliant: allChecks.filter((c) => c.status === 'COMPLIANT').length,
      nonCompliant: allChecks.filter((c) => c.status === 'NON_COMPLIANT').length,
      notApplicable: allChecks.filter((c) => c.status === 'NOT_APPLICABLE').length,
    };

    return {
      reportId: this.generateReportId(),
      standard: 'ALL',
      generatedAt: new Date(),
      overallStatus: this.calculateOverallStatus(summary),
      checks: allChecks,
      summary,
    };
  }

  /**
   * Generate report for specific standard
   */
  async generateStandardReport(
    standard: 'ABDM' | 'DISHA_ACT' | 'ISO_27001'
  ): Promise<ComplianceReport> {
    let checks: ComplianceCheck[] = [];

    switch (standard) {
      case 'ABDM':
        checks = await abdmComplianceService.performComplianceChecks();
        break;
      case 'DISHA_ACT':
        checks = await dishaActComplianceService.performComplianceChecks();
        break;
      case 'ISO_27001':
        checks = await iso27001ComplianceService.performComplianceChecks();
        break;
    }

    const summary = {
      total: checks.length,
      compliant: checks.filter((c) => c.status === 'COMPLIANT').length,
      nonCompliant: checks.filter((c) => c.status === 'NON_COMPLIANT').length,
      notApplicable: checks.filter((c) => c.status === 'NOT_APPLICABLE').length,
    };

    return {
      reportId: this.generateReportId(),
      standard,
      generatedAt: new Date(),
      overallStatus: this.calculateOverallStatus(summary),
      checks,
      summary,
    };
  }

  /**
   * Get compliance dashboard data
   */
  async getComplianceDashboard(): Promise<any> {
    const abdmSummary = await abdmComplianceService.getComplianceSummary();
    const dishaSummary = await dishaActComplianceService.getComplianceSummary();
    const isoSummary = await iso27001ComplianceService.getComplianceSummary();

    return {
      standards: [
        {
          name: 'ABDM',
          ...abdmSummary,
        },
        {
          name: 'DISHA Act',
          ...dishaSummary,
        },
        {
          name: 'ISO 27001',
          ...isoSummary,
        },
      ],
      overallCompliance: this.calculateOverallCompliance([
        abdmSummary,
        dishaSummary,
        isoSummary,
      ]),
      lastUpdated: new Date(),
    };
  }

  /**
   * Get non-compliant controls
   */
  async getNonCompliantControls(): Promise<ComplianceCheck[]> {
    const report = await this.generateComplianceReport();
    return report.checks.filter((check) => check.status === 'NON_COMPLIANT');
  }

  /**
   * Get controls requiring attention
   */
  async getControlsRequiringAttention(): Promise<ComplianceCheck[]> {
    const report = await this.generateComplianceReport();
    const now = new Date();

    return report.checks.filter((check) => {
      // Controls that are non-compliant or due for review soon
      const daysUntilReview = Math.floor(
        (check.nextCheck.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return check.status === 'NON_COMPLIANT' || daysUntilReview <= 7;
    });
  }

  /**
   * Export report to JSON
   */
  async exportReportJSON(reportId?: string): Promise<string> {
    const report = reportId
      ? await this.getReportById(reportId)
      : await this.generateComplianceReport();

    return JSON.stringify(report, null, 2);
  }

  /**
   * Export report to CSV
   */
  async exportReportCSV(reportId?: string): Promise<string> {
    const report = reportId
      ? await this.getReportById(reportId)
      : await this.generateComplianceReport();

    const headers = [
      'Check ID',
      'Standard',
      'Control',
      'Description',
      'Status',
      'Evidence',
      'Last Checked',
      'Next Check',
    ];

    const rows = report.checks.map((check) => [
      check.checkId,
      check.standard,
      check.control,
      check.description,
      check.status,
      check.evidence || '',
      check.lastChecked.toISOString(),
      check.nextCheck.toISOString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

    return csv;
  }

  /**
   * Get report by ID (simulated)
   */
  private async getReportById(reportId: string): Promise<ComplianceReport> {
    // In production, retrieve from database
    return this.generateComplianceReport();
  }

  /**
   * Calculate overall status
   */
  private calculateOverallStatus(summary: {
    total: number;
    compliant: number;
    nonCompliant: number;
  }): 'COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'NON_COMPLIANT' {
    if (summary.nonCompliant === 0) return 'COMPLIANT';
    if (summary.nonCompliant <= summary.total / 2) return 'PARTIALLY_COMPLIANT';
    return 'NON_COMPLIANT';
  }

  /**
   * Calculate overall compliance percentage
   */
  private calculateOverallCompliance(summaries: any[]): number {
    const totalChecks = summaries.reduce((sum, s) => sum + s.totalChecks, 0);
    const totalCompliant = summaries.reduce((sum, s) => sum + s.compliant, 0);

    return totalChecks > 0 ? Math.round((totalCompliant / totalChecks) * 100) : 0;
  }

  /**
   * Generate unique report ID
   */
  private generateReportId(): string {
    return `RPT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
}

export default new ComplianceReportingService();
