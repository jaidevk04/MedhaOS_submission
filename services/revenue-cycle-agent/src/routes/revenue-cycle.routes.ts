import { Router, Request, Response } from 'express';
import { RevenueCycleService } from '../services/revenue-cycle.service';
import { CodingRequest, ClaimGenerationRequest, PriorAuthRequest, Claim } from '../types';

const router = Router();
const revenueCycleService = new RevenueCycleService();

/**
 * POST /api/revenue-cycle/codes
 * Generate ICD-10 and CPT codes from clinical notes
 */
router.post('/codes', async (req: Request, res: Response) => {
  try {
    const codingRequest: CodingRequest = req.body;

    // Validate request
    if (!codingRequest.clinical_note) {
      return res.status(400).json({
        error: 'Clinical note is required',
      });
    }

    const response = await revenueCycleService.generateMedicalCodes(codingRequest);

    res.json(response);
  } catch (error) {
    console.error('Error generating medical codes:', error);
    res.status(500).json({
      error: 'Failed to generate medical codes',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/revenue-cycle/claims
 * Generate insurance claim
 */
router.post('/claims', async (req: Request, res: Response) => {
  try {
    const claimRequest: ClaimGenerationRequest = req.body;

    // Validate request
    if (!claimRequest.encounter_id || !claimRequest.patient_id || !claimRequest.insurance_policy_id) {
      return res.status(400).json({
        error: 'encounter_id, patient_id, and insurance_policy_id are required',
      });
    }

    const response = await revenueCycleService.generateClaim(claimRequest);

    res.json(response);
  } catch (error) {
    console.error('Error generating claim:', error);
    res.status(500).json({
      error: 'Failed to generate claim',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/revenue-cycle/detect-errors
 * Detect billing errors in a claim
 */
router.post('/detect-errors', async (req: Request, res: Response) => {
  try {
    const claim: Claim = req.body;

    if (!claim.claim_id) {
      return res.status(400).json({
        error: 'Valid claim object is required',
      });
    }

    const errors = await revenueCycleService.detectBillingErrors(claim);

    res.json({
      claim_id: claim.claim_id,
      errors_detected: errors.length,
      errors,
    });
  } catch (error) {
    console.error('Error detecting billing errors:', error);
    res.status(500).json({
      error: 'Failed to detect billing errors',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/revenue-cycle/predict-rejection
 * Predict claim rejection probability
 */
router.post('/predict-rejection', async (req: Request, res: Response) => {
  try {
    const claim: Claim = req.body;

    if (!claim.claim_id) {
      return res.status(400).json({
        error: 'Valid claim object is required',
      });
    }

    const prediction = await revenueCycleService.predictRejection(claim);

    res.json(prediction);
  } catch (error) {
    console.error('Error predicting rejection:', error);
    res.status(500).json({
      error: 'Failed to predict rejection',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/revenue-cycle/prior-authorization
 * Generate prior authorization request
 */
router.post('/prior-authorization', async (req: Request, res: Response) => {
  try {
    const authRequest: PriorAuthRequest = req.body;

    // Validate request
    if (!authRequest.encounter_id || !authRequest.patient_id || !authRequest.insurance_policy_id || !authRequest.requested_service) {
      return res.status(400).json({
        error: 'encounter_id, patient_id, insurance_policy_id, and requested_service are required',
      });
    }

    const response = await revenueCycleService.generatePriorAuthorization(authRequest);

    res.json(response);
  } catch (error) {
    console.error('Error generating prior authorization:', error);
    res.status(500).json({
      error: 'Failed to generate prior authorization',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/revenue-cycle/process-encounter
 * Complete workflow: Generate codes, claim, and validate
 */
router.post('/process-encounter', async (req: Request, res: Response) => {
  try {
    const { coding_request, insurance_policy_id, auto_submit } = req.body;

    // Validate request
    if (!coding_request || !insurance_policy_id) {
      return res.status(400).json({
        error: 'coding_request and insurance_policy_id are required',
      });
    }

    const response = await revenueCycleService.processEncounter({
      coding_request,
      insurance_policy_id,
      auto_submit,
    });

    res.json(response);
  } catch (error) {
    console.error('Error processing encounter:', error);
    res.status(500).json({
      error: 'Failed to process encounter',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/revenue-cycle/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  const health = revenueCycleService.getHealthStatus();
  res.json(health);
});

export default router;
