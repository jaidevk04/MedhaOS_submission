import { Router, Request, Response } from 'express';
import { ClinicalNLPService } from '../services/clinical-nlp.service';
import { SOAPNoteService } from '../services/soap-note.service';

const router = Router();
const clinicalNLP = new ClinicalNLPService();
const soapNoteService = new SOAPNoteService();

/**
 * POST /api/clinical/extract-symptoms
 * Extract symptoms from clinical text
 */
router.post('/extract-symptoms', async (req: Request, res: Response) => {
  try {
    const { text, language } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const result = await clinicalNLP.extractSymptoms({ text, language });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Symptom extraction error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Symptom extraction failed',
    });
  }
});

/**
 * POST /api/clinical/extract-facts
 * Extract clinical facts from conversation
 */
router.post('/extract-facts', async (req: Request, res: Response) => {
  try {
    const { conversationText, speakerLabels } = req.body;

    if (!conversationText) {
      return res.status(400).json({ error: 'Conversation text is required' });
    }

    const result = await clinicalNLP.extractClinicalFacts({
      conversationText,
      speakerLabels,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Clinical fact extraction error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Clinical fact extraction failed',
    });
  }
});

/**
 * POST /api/clinical/extract-entities
 * Extract named entities from clinical text
 */
router.post('/extract-entities', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const entities = await clinicalNLP.extractEntities(text);

    res.json({
      success: true,
      data: {
        entities,
        count: entities.length,
      },
    });
  } catch (error: any) {
    console.error('Entity extraction error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Entity extraction failed',
    });
  }
});

/**
 * POST /api/clinical/generate-soap-note
 * Generate SOAP note from conversation
 */
router.post('/generate-soap-note', async (req: Request, res: Response) => {
  try {
    const { conversationText, extractedFacts, patientContext } = req.body;

    if (!conversationText) {
      return res.status(400).json({ error: 'Conversation text is required' });
    }

    const result = await soapNoteService.generateSOAPNote({
      conversationText,
      extractedFacts,
      patientContext,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('SOAP note generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'SOAP note generation failed',
    });
  }
});

/**
 * POST /api/clinical/analyze-conversation
 * Complete analysis: extract facts + generate SOAP note
 */
router.post('/analyze-conversation', async (req: Request, res: Response) => {
  try {
    const { conversationText, speakerLabels, patientContext } = req.body;

    if (!conversationText) {
      return res.status(400).json({ error: 'Conversation text is required' });
    }

    // Step 1: Extract clinical facts
    const facts = await clinicalNLP.extractClinicalFacts({
      conversationText,
      speakerLabels,
    });

    // Step 2: Generate SOAP note
    const soapNote = await soapNoteService.generateSOAPNote({
      conversationText,
      extractedFacts: facts,
      patientContext,
    });

    res.json({
      success: true,
      data: {
        extractedFacts: facts,
        soapNote: soapNote.soapNote,
        confidence: soapNote.confidence,
        requiresReview: soapNote.requiresReview,
        reviewReasons: soapNote.reviewReasons,
        totalProcessingTime: facts.processingTime + soapNote.processingTime,
      },
    });
  } catch (error: any) {
    console.error('Conversation analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Conversation analysis failed',
    });
  }
});

/**
 * GET /api/clinical/symptom-categories
 * Get available symptom categories
 */
router.get('/symptom-categories', (req: Request, res: Response) => {
  const { SYMPTOM_CATEGORIES } = require('../types/clinical.types');

  res.json({
    success: true,
    data: {
      categories: Object.keys(SYMPTOM_CATEGORIES),
      symptoms: SYMPTOM_CATEGORIES,
    },
  });
});

export default router;
