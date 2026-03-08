import { Router, Request, Response } from 'express';
import { EducationalContentService } from '../services/educational-content.service';
import { Patient, DischargeData } from '../types';

const router = Router();
const contentService = new EducationalContentService();

/**
 * GET /api/educational-content/recommendations/:patientId
 * Get personalized content recommendations for a patient
 */
router.post('/recommendations', async (req: Request, res: Response) => {
  try {
    const { patient, dischargeData } = req.body;

    if (!patient || !dischargeData) {
      return res.status(400).json({
        success: false,
        error: 'Patient and discharge data are required',
      });
    }

    const recommendations = await contentService.getPersonalizedRecommendations(
      patient as Patient,
      dischargeData as DischargeData
    );

    res.status(200).json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get content recommendations',
    });
  }
});

/**
 * GET /api/educational-content/category/:category
 * Get all content for a specific category
 */
router.get('/category/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const { language = 'en' } = req.query;

    const content = await contentService.getContentByCategory(
      category,
      language as string
    );

    res.status(200).json({
      success: true,
      data: content,
    });
  } catch (error) {
    console.error('Error getting content by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get content',
    });
  }
});

/**
 * GET /api/educational-content/:contentId
 * Get specific content by ID
 */
router.get('/:contentId', async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;

    const content = await contentService.getContentById(contentId);

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found',
      });
    }

    res.status(200).json({
      success: true,
      data: content,
    });
  } catch (error) {
    console.error('Error getting content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get content',
    });
  }
});

/**
 * GET /api/educational-content/search
 * Search content by query
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, language = 'en' } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      });
    }

    const results = await contentService.searchContent(
      q as string,
      language as string
    );

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error searching content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search content',
    });
  }
});

/**
 * GET /api/educational-content/type/:type
 * Get content by type (video, article, infographic)
 */
router.get('/type/:type', async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const { language = 'en' } = req.query;

    if (!['video', 'article', 'infographic'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid content type. Must be video, article, or infographic',
      });
    }

    const content = await contentService.getContentByType(
      type as 'video' | 'article' | 'infographic',
      language as string
    );

    res.status(200).json({
      success: true,
      data: content,
    });
  } catch (error) {
    console.error('Error getting content by type:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get content',
    });
  }
});

/**
 * GET /api/educational-content/categories
 * Get all available categories
 */
router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await contentService.getAvailableCategories();

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get categories',
    });
  }
});

/**
 * GET /api/educational-content/languages
 * Get all supported languages
 */
router.get('/languages', async (_req: Request, res: Response) => {
  try {
    const languages = await contentService.getSupportedLanguages();

    res.status(200).json({
      success: true,
      data: languages,
    });
  } catch (error) {
    console.error('Error getting languages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get languages',
    });
  }
});

/**
 * POST /api/educational-content/track-view
 * Track content view for analytics
 */
router.post('/track-view', async (req: Request, res: Response) => {
  try {
    const { patientId, contentId, duration } = req.body;

    if (!patientId || !contentId) {
      return res.status(400).json({
        success: false,
        error: 'Patient ID and content ID are required',
      });
    }

    await contentService.trackContentView(patientId, contentId, duration);

    res.status(200).json({
      success: true,
      message: 'Content view tracked successfully',
    });
  } catch (error) {
    console.error('Error tracking content view:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track content view',
    });
  }
});

/**
 * POST /api/educational-content/admin/add
 * Add new content to library (admin only)
 */
router.post('/admin/add', async (req: Request, res: Response) => {
  try {
    const { category, content } = req.body;

    if (!category || !content) {
      return res.status(400).json({
        success: false,
        error: 'Category and content are required',
      });
    }

    const addedContent = await contentService.addContent(category, content);

    res.status(201).json({
      success: true,
      data: addedContent,
    });
  } catch (error) {
    console.error('Error adding content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add content',
    });
  }
});

/**
 * PUT /api/educational-content/admin/:contentId
 * Update existing content (admin only)
 */
router.put('/admin/:contentId', async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;
    const updates = req.body;

    const updatedContent = await contentService.updateContent(contentId, updates);

    if (!updatedContent) {
      return res.status(404).json({
        success: false,
        error: 'Content not found',
      });
    }

    res.status(200).json({
      success: true,
      data: updatedContent,
    });
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update content',
    });
  }
});

/**
 * DELETE /api/educational-content/admin/:contentId
 * Delete content (admin only)
 */
router.delete('/admin/:contentId', async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;

    const deleted = await contentService.deleteContent(contentId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Content not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Content deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete content',
    });
  }
});

export default router;
