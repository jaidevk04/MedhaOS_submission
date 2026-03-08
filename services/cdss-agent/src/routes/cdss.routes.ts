import { Router, Request, Response } from 'express';
import { CDSSService } from '../services/cdss.service';
import { DocumentIngestionService } from '../services/document-ingestion.service';
import { VectorDatabaseService } from '../services/vector-database.service';

const router = Router();
const cdssService = new CDSSService();
const ingestionService = new DocumentIngestionService();
const vectorDbService = new VectorDatabaseService();

/**
 * POST /api/cdss/request
 * Process a CDSS request
 */
router.post('/request', async (req: Request, res: Response) => {
  try {
    const request = req.body;
    const response = await cdssService.processRequest(request);
    res.json(response);
  } catch (error: any) {
    console.error('Error processing CDSS request:', error);
    res.status(500).json({
      error: 'Failed to process CDSS request',
      message: error.message
    });
  }
});

/**
 * POST /api/cdss/diagnosis
 * Generate differential diagnosis
 */
router.post('/diagnosis', async (req: Request, res: Response) => {
  try {
    const { patientContext } = req.body;
    
    if (!patientContext) {
      return res.status(400).json({ error: 'Patient context is required' });
    }

    const response = await cdssService.processRequest({
      requestType: 'diagnosis',
      patientContext
    });

    res.json(response);
  } catch (error: any) {
    console.error('Error generating diagnosis:', error);
    res.status(500).json({
      error: 'Failed to generate differential diagnosis',
      message: error.message
    });
  }
});

/**
 * POST /api/cdss/literature-search
 * Search medical literature
 */
router.post('/literature-search', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const response = await cdssService.processRequest({
      requestType: 'literature_search',
      query
    });

    res.json(response);
  } catch (error: any) {
    console.error('Error searching literature:', error);
    res.status(500).json({
      error: 'Failed to search medical literature',
      message: error.message
    });
  }
});

/**
 * POST /api/cdss/trial-matching
 * Match patient to clinical trials
 */
router.post('/trial-matching', async (req: Request, res: Response) => {
  try {
    const { patientProfile } = req.body;
    
    if (!patientProfile) {
      return res.status(400).json({ error: 'Patient profile is required' });
    }

    const response = await cdssService.processRequest({
      requestType: 'trial_matching',
      patientProfile
    });

    res.json(response);
  } catch (error: any) {
    console.error('Error matching trials:', error);
    res.status(500).json({
      error: 'Failed to match clinical trials',
      message: error.message
    });
  }
});

/**
 * POST /api/cdss/compliance-check
 * Validate documentation compliance
 */
router.post('/compliance-check', async (req: Request, res: Response) => {
  try {
    const encounterData = req.body;
    
    if (!encounterData.encounterId && !encounterData.id) {
      return res.status(400).json({ error: 'Encounter ID is required' });
    }

    const response = await cdssService.processRequest({
      requestType: 'compliance_check',
      encounterId: encounterData.encounterId || encounterData.id,
      ...encounterData
    });

    res.json(response);
  } catch (error: any) {
    console.error('Error checking compliance:', error);
    res.status(500).json({
      error: 'Failed to check compliance',
      message: error.message
    });
  }
});

/**
 * POST /api/cdss/prior-authorization
 * Generate prior authorization request
 */
router.post('/prior-authorization', async (req: Request, res: Response) => {
  try {
    const { authorizationRequest } = req.body;
    
    if (!authorizationRequest) {
      return res.status(400).json({ error: 'Authorization request is required' });
    }

    const response = await cdssService.processRequest({
      requestType: 'prior_auth',
      authorizationRequest
    });

    res.json(response);
  } catch (error: any) {
    console.error('Error generating prior authorization:', error);
    res.status(500).json({
      error: 'Failed to generate prior authorization',
      message: error.message
    });
  }
});

/**
 * POST /api/cdss/recommendations
 * Get clinical recommendations for a condition
 */
router.post('/recommendations', async (req: Request, res: Response) => {
  try {
    const { condition, patientContext } = req.body;
    
    if (!condition) {
      return res.status(400).json({ error: 'Condition is required' });
    }

    const response = await cdssService.getClinicalRecommendations(condition, patientContext);
    res.json(response);
  } catch (error: any) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({
      error: 'Failed to get clinical recommendations',
      message: error.message
    });
  }
});

/**
 * POST /api/cdss/drug-information
 * Get drug information
 */
router.post('/drug-information', async (req: Request, res: Response) => {
  try {
    const { drugName, indication } = req.body;
    
    if (!drugName) {
      return res.status(400).json({ error: 'Drug name is required' });
    }

    const response = await cdssService.getDrugInformation(drugName, indication);
    res.json(response);
  } catch (error: any) {
    console.error('Error getting drug information:', error);
    res.status(500).json({
      error: 'Failed to get drug information',
      message: error.message
    });
  }
});

/**
 * POST /api/cdss/ingest/pubmed
 * Ingest documents from PubMed
 */
router.post('/ingest/pubmed', async (req: Request, res: Response) => {
  try {
    const { query, maxResults } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Run ingestion asynchronously
    ingestionService.ingestFromPubMed(query, maxResults || 100)
      .catch(error => console.error('Error in background ingestion:', error));

    res.json({
      message: 'Document ingestion started',
      query,
      maxResults: maxResults || 100
    });
  } catch (error: any) {
    console.error('Error starting ingestion:', error);
    res.status(500).json({
      error: 'Failed to start document ingestion',
      message: error.message
    });
  }
});

/**
 * POST /api/cdss/ingest/guidelines
 * Ingest medical guidelines
 */
router.post('/ingest/guidelines', async (req: Request, res: Response) => {
  try {
    const { guidelines } = req.body;
    
    if (!guidelines || !Array.isArray(guidelines)) {
      return res.status(400).json({ error: 'Guidelines array is required' });
    }

    await ingestionService.ingestGuidelines(guidelines);

    res.json({
      message: 'Guidelines ingested successfully',
      count: guidelines.length
    });
  } catch (error: any) {
    console.error('Error ingesting guidelines:', error);
    res.status(500).json({
      error: 'Failed to ingest guidelines',
      message: error.message
    });
  }
});

/**
 * GET /api/cdss/knowledge-base/stats
 * Get knowledge base statistics
 */
router.get('/knowledge-base/stats', async (req: Request, res: Response) => {
  try {
    const stats = await vectorDbService.getStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      error: 'Failed to get knowledge base statistics',
      message: error.message
    });
  }
});

export default router;
