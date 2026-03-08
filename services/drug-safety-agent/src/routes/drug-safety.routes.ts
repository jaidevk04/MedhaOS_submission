import { Router, Request, Response } from 'express';
import { drugSafetyService } from '../services/drug-safety.service';
import { drugKnowledgeGraph } from '../services/drug-knowledge-graph.service';
import { inventoryIntegrationService } from '../services/inventory-integration.service';
import { SafetyCheckRequest, InventoryCheckRequest } from '../types';

const router = Router();

/**
 * POST /api/safety-check
 * Perform comprehensive drug safety check
 */
router.post('/safety-check', async (req: Request, res: Response) => {
  try {
    const request: SafetyCheckRequest = req.body;

    // Validate request
    if (!request.patientId || !request.proposedDrug || !request.currentMedications || !request.allergies) {
      return res.status(400).json({
        error: 'Missing required fields: patientId, proposedDrug, currentMedications, allergies'
      });
    }

    const result = await drugSafetyService.performSafetyCheck(request);

    res.json(result);
  } catch (error) {
    console.error('Error performing safety check:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/drugs/search
 * Search for drugs by name
 */
router.get('/drugs/search', (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;

    if (!query) {
      return res.status(400).json({
        error: 'Missing query parameter: q'
      });
    }

    const results = drugKnowledgeGraph.searchDrugs(query);

    res.json({
      query,
      count: results.length,
      results
    });
  } catch (error) {
    console.error('Error searching drugs:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/drugs/:id
 * Get drug details by ID
 */
router.get('/drugs/:id', (req: Request, res: Response) => {
  try {
    const drugId = req.params.id;
    const drug = drugKnowledgeGraph.getDrugById(drugId);

    if (!drug) {
      return res.status(404).json({
        error: 'Drug not found'
      });
    }

    res.json(drug);
  } catch (error) {
    console.error('Error getting drug:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/drugs/:id/interactions
 * Get drug interactions for a specific drug
 */
router.get('/drugs/:id/interactions', (req: Request, res: Response) => {
  try {
    const drugId = req.params.id;
    const drug = drugKnowledgeGraph.getDrugById(drugId);

    if (!drug) {
      return res.status(404).json({
        error: 'Drug not found'
      });
    }

    const interactions = drugKnowledgeGraph.getInteractions(drugId);

    res.json({
      drugId,
      drugName: drug.name,
      interactionCount: interactions.length,
      interactions
    });
  } catch (error) {
    console.error('Error getting interactions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/inventory/check
 * Check drug availability in inventory
 */
router.post('/inventory/check', async (req: Request, res: Response) => {
  try {
    const request: InventoryCheckRequest = req.body;

    if (!request.drugId || !request.facilityId) {
      return res.status(400).json({
        error: 'Missing required fields: drugId, facilityId'
      });
    }

    const result = await inventoryIntegrationService.checkInventory(request);

    res.json(result);
  } catch (error) {
    console.error('Error checking inventory:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/inventory/:facilityId/:drugId/status
 * Get stock status for a drug at a facility
 */
router.get('/inventory/:facilityId/:drugId/status', async (req: Request, res: Response) => {
  try {
    const { facilityId, drugId } = req.params;

    const status = await inventoryIntegrationService.getStockStatus(drugId, facilityId);

    res.json(status);
  } catch (error) {
    console.error('Error getting stock status:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/inventory/:facilityId/:drugId/expiry
 * Validate expiry date for a drug
 */
router.get('/inventory/:facilityId/:drugId/expiry', async (req: Request, res: Response) => {
  try {
    const { facilityId, drugId } = req.params;

    const validation = await inventoryIntegrationService.validateExpiry(drugId, facilityId);

    res.json(validation);
  } catch (error) {
    console.error('Error validating expiry:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/stats
 * Get knowledge graph statistics
 */
router.get('/stats', (_req: Request, res: Response) => {
  try {
    const stats = {
      totalDrugs: drugKnowledgeGraph.getDrugCount(),
      totalInteractions: drugKnowledgeGraph.getInteractionCount(),
      service: 'Drug Safety Agent',
      version: '1.0.0'
    };

    res.json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
