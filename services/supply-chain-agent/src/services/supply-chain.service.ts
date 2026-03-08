import { DrugInventoryForecastingService } from './drug-inventory-forecasting.service';
import { BloodBankForecastingService } from './blood-bank-forecasting.service';
import { InventoryManagementService } from './inventory-management.service';
import { 
  ForecastRequest,
  InventoryStatusResponse,
  DrugForecast,
  BloodForecast,
  PurchaseOrder,
  DonorDrive
} from '../types';

/**
 * Main Supply Chain Intelligence Service
 * Orchestrates drug inventory forecasting, blood bank management, and inventory operations
 */
export class SupplyChainService {
  private drugForecastService: DrugInventoryForecastingService;
  private bloodForecastService: BloodBankForecastingService;
  private inventoryService: InventoryManagementService;

  constructor() {
    this.drugForecastService = new DrugInventoryForecastingService();
    this.bloodForecastService = new BloodBankForecastingService();
    this.inventoryService = new InventoryManagementService();
  }

  /**
   * Get comprehensive supply chain status
   */
  async getSupplyChainStatus(facilityId: string) {
    const inventoryStatus = await this.inventoryService.getInventoryStatus(facilityId);
    const drugForecasts = await this.getDrugForecasts(facilityId, '7d');
    const bloodForecasts = await this.bloodForecastService.generateAllBloodGroupForecasts(
      facilityId,
      '7d'
    );
    
    return {
      facilityId,
      timestamp: new Date(),
      inventory: inventoryStatus,
      drugForecasts: {
        count: drugForecasts.length,
        highRisk: drugForecasts.filter(f => f.stockoutRisk === 'high').length
      },
      bloodForecasts: {
        count: bloodForecasts.length,
        critical: bloodForecasts.filter(f => f.shortageRisk === 'critical').length,
        high: bloodForecasts.filter(f => f.shortageRisk === 'high').length
      }
    };
  }

  /**
   * Generate forecast based on request
   */
  async generateForecast(request: ForecastRequest): Promise<DrugForecast | BloodForecast> {
    if (request.itemType === 'drug' && request.itemId) {
      return this.drugForecastService.generateForecast(
        request.facilityId,
        request.itemId,
        request.forecastPeriod
      );
    } else if (request.itemType === 'blood' && request.itemId) {
      return this.bloodForecastService.generateBloodForecast(
        request.facilityId,
        request.itemId as any,
        request.forecastPeriod
      );
    }
    
    throw new Error('Invalid forecast request');
  }

  /**
   * Get drug forecasts for facility
   */
  async getDrugForecasts(
    facilityId: string,
    forecastPeriod: '7d' | '14d' | '30d'
  ): Promise<DrugForecast[]> {
    // In production, get all drugs for facility
    const mockDrugIds = ['drug-001', 'drug-002', 'drug-003'];
    const forecasts: DrugForecast[] = [];
    
    for (const drugId of mockDrugIds) {
      const forecast = await this.drugForecastService.generateForecast(
        facilityId,
        drugId,
        forecastPeriod
      );
      forecasts.push(forecast);
    }
    
    return forecasts;
  }

  /**
   * Get inventory status
   */
  async getInventoryStatus(facilityId: string): Promise<InventoryStatusResponse> {
    return this.inventoryService.getInventoryStatus(facilityId);
  }

  /**
   * Generate and process purchase orders
   */
  async processPurchaseOrders(facilityId: string): Promise<PurchaseOrder[]> {
    const orders = await this.inventoryService.generatePurchaseOrder(facilityId);
    
    // In production, this would:
    // 1. Save orders to database
    // 2. Send to procurement system
    // 3. Notify purchasing department
    // 4. Track order status
    
    console.log(`📦 Generated ${orders.length} purchase orders for ${facilityId}`);
    for (const order of orders) {
      console.log(`   ${order.orderId}: ${order.items.length} items, Priority: ${order.priority}`);
    }
    
    return orders;
  }

  /**
   * Handle blood shortage and trigger donor drive
   */
  async handleBloodShortage(facilityId: string): Promise<DonorDrive | null> {
    const donorDrive = await this.inventoryService.triggerDonorDrive(facilityId);
    
    if (donorDrive) {
      // Notify donors
      await this.inventoryService.notifyDonors(
        facilityId,
        donorDrive.bloodGroups,
        'urgent'
      );
    }
    
    return donorDrive;
  }

  /**
   * Monitor and alert on expiring items
   */
  async monitorExpiry(facilityId: string) {
    const alerts = await this.inventoryService.monitorExpiryDates(facilityId);
    
    console.log(`⏰ Found ${alerts.length} expiry alerts for ${facilityId}`);
    
    // In production, send notifications to pharmacy/blood bank staff
    for (const alert of alerts.filter(a => a.severity === 'critical')) {
      console.log(`   CRITICAL: ${alert.message}`);
    }
    
    return alerts;
  }

  /**
   * Get reorder recommendations
   */
  async getReorderRecommendations(facilityId: string) {
    return this.drugForecastService.generateReorderRecommendations(facilityId);
  }

  /**
   * Get blood shortage alerts
   */
  async getBloodShortageAlerts(facilityId: string) {
    return this.bloodForecastService.identifyCriticalShortages(facilityId);
  }
}
