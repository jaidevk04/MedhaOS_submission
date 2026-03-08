import { Router, Request, Response } from 'express';
import { SupplyChainService } from '../services/supply-chain.service';
import { ForecastRequest } from '../types';

const router = Router();
const supplyChainService = new SupplyChainService();

/**
 * GET /api/supply-chain/status/:facilityId
 * Get comprehensive supply chain status
 */
router.get('/status/:facilityId', async (req: Request, res: Response) => {
  try {
    const { facilityId } = req.params;
    const status = await supplyChainService.getSupplyChainStatus(facilityId);
    res.json(status);
  } catch (error) {
    console.error('Error getting supply chain status:', error);
    res.status(500).json({ error: 'Failed to get supply chain status' });
  }
});

/**
 * POST /api/supply-chain/forecast
 * Generate demand forecast
 */
router.post('/forecast', async (req: Request, res: Response) => {
  try {
    const request: ForecastRequest = req.body;
    
    if (!request.facilityId || !request.itemType || !request.forecastPeriod) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const forecast = await supplyChainService.generateForecast(request);
    res.json(forecast);
  } catch (error) {
    console.error('Error generating forecast:', error);
    res.status(500).json({ error: 'Failed to generate forecast' });
  }
});

/**
 * GET /api/supply-chain/inventory/:facilityId
 * Get inventory status
 */
router.get('/inventory/:facilityId', async (req: Request, res: Response) => {
  try {
    const { facilityId } = req.params;
    const inventory = await supplyChainService.getInventoryStatus(facilityId);
    res.json(inventory);
  } catch (error) {
    console.error('Error getting inventory status:', error);
    res.status(500).json({ error: 'Failed to get inventory status' });
  }
});

/**
 * GET /api/supply-chain/drug-forecasts/:facilityId
 * Get drug forecasts
 */
router.get('/drug-forecasts/:facilityId', async (req: Request, res: Response) => {
  try {
    const { facilityId } = req.params;
    const period = (req.query.period as '7d' | '14d' | '30d') || '7d';
    
    const forecasts = await supplyChainService.getDrugForecasts(facilityId, period);
    res.json(forecasts);
  } catch (error) {
    console.error('Error getting drug forecasts:', error);
    res.status(500).json({ error: 'Failed to get drug forecasts' });
  }
});

/**
 * GET /api/supply-chain/reorder-recommendations/:facilityId
 * Get reorder recommendations
 */
router.get('/reorder-recommendations/:facilityId', async (req: Request, res: Response) => {
  try {
    const { facilityId } = req.params;
    const recommendations = await supplyChainService.getReorderRecommendations(facilityId);
    res.json(recommendations);
  } catch (error) {
    console.error('Error getting reorder recommendations:', error);
    res.status(500).json({ error: 'Failed to get reorder recommendations' });
  }
});

/**
 * POST /api/supply-chain/purchase-orders/:facilityId
 * Generate purchase orders
 */
router.post('/purchase-orders/:facilityId', async (req: Request, res: Response) => {
  try {
    const { facilityId } = req.params;
    const orders = await supplyChainService.processPurchaseOrders(facilityId);
    res.json(orders);
  } catch (error) {
    console.error('Error processing purchase orders:', error);
    res.status(500).json({ error: 'Failed to process purchase orders' });
  }
});

/**
 * GET /api/supply-chain/blood-shortages/:facilityId
 * Get blood shortage alerts
 */
router.get('/blood-shortages/:facilityId', async (req: Request, res: Response) => {
  try {
    const { facilityId } = req.params;
    const shortages = await supplyChainService.getBloodShortageAlerts(facilityId);
    res.json(shortages);
  } catch (error) {
    console.error('Error getting blood shortages:', error);
    res.status(500).json({ error: 'Failed to get blood shortages' });
  }
});

/**
 * POST /api/supply-chain/donor-drive/:facilityId
 * Trigger donor drive
 */
router.post('/donor-drive/:facilityId', async (req: Request, res: Response) => {
  try {
    const { facilityId } = req.params;
    const donorDrive = await supplyChainService.handleBloodShortage(facilityId);
    
    if (!donorDrive) {
      return res.json({ message: 'No donor drive needed at this time' });
    }
    
    res.json(donorDrive);
  } catch (error) {
    console.error('Error triggering donor drive:', error);
    res.status(500).json({ error: 'Failed to trigger donor drive' });
  }
});

/**
 * GET /api/supply-chain/expiry-alerts/:facilityId
 * Get expiry alerts
 */
router.get('/expiry-alerts/:facilityId', async (req: Request, res: Response) => {
  try {
    const { facilityId } = req.params;
    const alerts = await supplyChainService.monitorExpiry(facilityId);
    res.json(alerts);
  } catch (error) {
    console.error('Error getting expiry alerts:', error);
    res.status(500).json({ error: 'Failed to get expiry alerts' });
  }
});

export default router;
