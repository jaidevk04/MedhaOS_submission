import { 
  DrugInventoryItem,
  BloodInventoryItem,
  InventoryAlert,
  PurchaseOrder,
  PurchaseOrderItem,
  InventoryStatusResponse,
  DonorDrive
} from '../types';
import { config } from '../config';
import { DrugInventoryForecastingService } from './drug-inventory-forecasting.service';
import { BloodBankForecastingService } from './blood-bank-forecasting.service';

/**
 * Inventory Management Service
 * Handles stock tracking, expiry monitoring, purchase orders, and donor drives
 * Requirements: 9.2, 9.3, 9.5
 */
export class InventoryManagementService {
  private drugForecastService: DrugInventoryForecastingService;
  private bloodForecastService: BloodBankForecastingService;

  constructor() {
    this.drugForecastService = new DrugInventoryForecastingService();
    this.bloodForecastService = new BloodBankForecastingService();
  }

  /**
   * Get comprehensive inventory status for a facility
   */
  async getInventoryStatus(facilityId: string): Promise<InventoryStatusResponse> {
    // Get all inventory items
    const drugItems = await this.getAllDrugInventory(facilityId);
    const bloodItems = await this.getAllBloodInventory(facilityId);
    
    const totalItems = drugItems.length + bloodItems.length;
    
    // Identify issues
    const lowStockItems = this.identifyLowStock(drugItems, bloodItems);
    const criticalStockItems = this.identifyCriticalStock(drugItems, bloodItems);
    const expiringItems = this.identifyExpiringItems(drugItems, bloodItems);
    
    // Generate alerts
    const alerts = await this.generateAlerts(
      facilityId,
      lowStockItems,
      criticalStockItems,
      expiringItems
    );
    
    return {
      facilityId,
      totalItems,
      lowStockItems: lowStockItems.length,
      criticalStockItems: criticalStockItems.length,
      expiringItems: expiringItems.length,
      alerts,
      lastUpdated: new Date()
    };
  }

  /**
   * Track stock levels in real-time
   */
  async trackStockLevel(
    facilityId: string,
    itemId: string,
    itemType: 'drug' | 'blood'
  ): Promise<{ currentStock: number; status: string; alerts: string[] }> {
    let currentStock = 0;
    let reorderLevel = 0;
    let criticalLevel = 0;
    
    if (itemType === 'drug') {
      const item = await this.getDrugInventoryItem(facilityId, itemId);
      currentStock = item.currentStock;
      reorderLevel = item.reorderLevel;
      criticalLevel = Math.floor(reorderLevel * 0.5);
    } else {
      const item = await this.getBloodInventoryItem(facilityId, itemId);
      currentStock = item.units;
      criticalLevel = config.thresholds.bloodCriticalUnits;
      reorderLevel = criticalLevel * 2;
    }
    
    // Determine status
    let status = 'adequate';
    const alerts: string[] = [];
    
    if (currentStock <= criticalLevel) {
      status = 'critical';
      alerts.push('CRITICAL: Stock level critically low');
    } else if (currentStock <= reorderLevel) {
      status = 'low';
      alerts.push('WARNING: Stock level below reorder point');
    }
    
    return { currentStock, status, alerts };
  }

  /**
   * Monitor expiry dates and generate warnings
   */
  async monitorExpiryDates(facilityId: string): Promise<InventoryAlert[]> {
    const drugItems = await this.getAllDrugInventory(facilityId);
    const bloodItems = await this.getAllBloodInventory(facilityId);
    
    const alerts: InventoryAlert[] = [];
    const now = new Date();
    const warningThreshold = new Date();
    warningThreshold.setDate(now.getDate() + config.thresholds.expiryWarningDays);
    
    // Check drug expiry
    for (const item of drugItems) {
      if (item.expiryDate <= now) {
        alerts.push({
          alertId: `alert-${Date.now()}-${item.itemId}`,
          facilityId,
          alertType: 'expiry_warning',
          severity: 'critical',
          itemId: item.itemId,
          itemName: item.drugName,
          message: `${item.drugName} has EXPIRED (Batch: ${item.batchNumber})`,
          currentStock: item.currentStock,
          recommendedAction: 'Remove from inventory immediately and dispose properly',
          createdAt: new Date(),
          acknowledged: false
        });
      } else if (item.expiryDate <= warningThreshold) {
        const daysUntilExpiry = Math.ceil(
          (item.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        alerts.push({
          alertId: `alert-${Date.now()}-${item.itemId}`,
          facilityId,
          alertType: 'expiry_warning',
          severity: daysUntilExpiry <= 7 ? 'high' : 'medium',
          itemId: item.itemId,
          itemName: item.drugName,
          message: `${item.drugName} expires in ${daysUntilExpiry} days (Batch: ${item.batchNumber})`,
          currentStock: item.currentStock,
          recommendedAction: `Prioritize usage or transfer to another facility`,
          createdAt: new Date(),
          acknowledged: false
        });
      }
    }
    
    // Check blood expiry (blood typically expires in 35-42 days)
    for (const item of bloodItems) {
      if (item.expiryDate <= now) {
        alerts.push({
          alertId: `alert-${Date.now()}-${item.itemId}`,
          facilityId,
          alertType: 'expiry_warning',
          severity: 'critical',
          itemId: item.itemId,
          itemName: `Blood ${item.bloodGroup}`,
          message: `Blood unit ${item.bloodGroup} has EXPIRED`,
          currentStock: item.units,
          recommendedAction: 'Remove from blood bank immediately',
          createdAt: new Date(),
          acknowledged: false
        });
      } else if (item.expiryDate <= warningThreshold) {
        const daysUntilExpiry = Math.ceil(
          (item.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        alerts.push({
          alertId: `alert-${Date.now()}-${item.itemId}`,
          facilityId,
          alertType: 'expiry_warning',
          severity: daysUntilExpiry <= 7 ? 'high' : 'medium',
          itemId: item.itemId,
          itemName: `Blood ${item.bloodGroup}`,
          message: `Blood unit ${item.bloodGroup} expires in ${daysUntilExpiry} days`,
          currentStock: item.units,
          recommendedAction: 'Prioritize for use or transfer',
          createdAt: new Date(),
          acknowledged: false
        });
      }
    }
    
    return alerts.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * Generate automated purchase orders for drugs
   */
  async generatePurchaseOrder(facilityId: string): Promise<PurchaseOrder[]> {
    // Get reorder recommendations
    const recommendations = await this.drugForecastService.generateReorderRecommendations(
      facilityId
    );
    
    if (recommendations.length === 0) {
      return [];
    }
    
    // Group by supplier
    const supplierGroups = new Map<string, typeof recommendations>();
    
    for (const rec of recommendations) {
      const supplier = rec.supplier;
      if (!supplierGroups.has(supplier)) {
        supplierGroups.set(supplier, []);
      }
      supplierGroups.get(supplier)!.push(rec);
    }
    
    // Create purchase orders
    const purchaseOrders: PurchaseOrder[] = [];
    
    for (const [supplier, items] of supplierGroups) {
      const orderItems: PurchaseOrderItem[] = items.map(item => ({
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: item.recommendedQuantity,
        unit: 'units',
        unitPrice: 10, // Mock price
        totalPrice: item.recommendedQuantity * 10
      }));
      
      const totalAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
      
      // Determine priority based on urgency
      const maxUrgency = items.reduce((max, item) => {
        const urgencyOrder = { high: 2, medium: 1, low: 0 };
        return Math.max(max, urgencyOrder[item.urgency]);
      }, 0);
      
      const priority = maxUrgency === 2 ? 'emergency' : maxUrgency === 1 ? 'urgent' : 'routine';
      
      purchaseOrders.push({
        orderId: `PO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        facilityId,
        orderType: 'drug',
        items: orderItems,
        supplier,
        totalAmount,
        status: 'draft',
        priority,
        createdAt: new Date()
      });
    }
    
    return purchaseOrders;
  }

  /**
   * Trigger donor drive for blood shortages
   */
  async triggerDonorDrive(facilityId: string): Promise<DonorDrive | null> {
    // Identify critical blood shortages
    const criticalShortages = await this.bloodForecastService.identifyCriticalShortages(
      facilityId
    );
    
    if (criticalShortages.length === 0) {
      return null;
    }
    
    // Get blood groups that need donor drives
    const bloodGroupsNeeded = criticalShortages
      .filter(f => f.recommendedDonorDrive)
      .map(f => f.bloodGroup);
    
    if (bloodGroupsNeeded.length === 0) {
      return null;
    }
    
    // Create donor drive
    const donorDrive = await this.bloodForecastService.createDonorDriveRecommendation(
      facilityId,
      bloodGroupsNeeded
    );
    
    // In production, this would:
    // 1. Create donor drive in database
    // 2. Send notifications to registered donors
    // 3. Post on social media
    // 4. Coordinate with blood donation organizations
    
    console.log(`🩸 Donor Drive Triggered for ${facilityId}`);
    console.log(`   Blood Groups Needed: ${bloodGroupsNeeded.join(', ')}`);
    console.log(`   Target Units: ${donorDrive.targetUnits}`);
    console.log(`   Start Date: ${donorDrive.startDate.toLocaleDateString()}`);
    
    return donorDrive;
  }

  /**
   * Send notifications to registered donors
   */
  async notifyDonors(
    facilityId: string,
    bloodGroups: string[],
    urgency: 'routine' | 'urgent' | 'emergency'
  ): Promise<{ notified: number; message: string }> {
    // In production, this would:
    // 1. Query registered donors with matching blood groups
    // 2. Send SMS/WhatsApp/Email notifications
    // 3. Track notification delivery
    
    const mockDonorCount = Math.floor(Math.random() * 100) + 50;
    
    const urgencyMessages = {
      routine: 'We invite you to donate blood at your convenience',
      urgent: 'Your blood donation is urgently needed',
      emergency: 'EMERGENCY: Critical blood shortage - please donate immediately'
    };
    
    const message = `${urgencyMessages[urgency]}. Blood groups needed: ${bloodGroups.join(', ')}`;
    
    console.log(`📧 Notifying ${mockDonorCount} donors: ${message}`);
    
    return {
      notified: mockDonorCount,
      message
    };
  }

  // Helper methods

  private async getAllDrugInventory(facilityId: string): Promise<DrugInventoryItem[]> {
    // Mock data - in production, query database
    return [
      {
        itemId: 'drug-001',
        drugId: 'drug-001',
        drugName: 'Paracetamol 500mg',
        facilityId,
        currentStock: 150,
        unit: 'tablets',
        reorderLevel: 200,
        expiryDate: new Date('2025-12-31'),
        batchNumber: 'BATCH-001',
        supplier: 'PharmaCorp',
        lastUpdated: new Date()
      },
      {
        itemId: 'drug-002',
        drugId: 'drug-002',
        drugName: 'Amoxicillin 250mg',
        facilityId,
        currentStock: 15,
        unit: 'capsules',
        reorderLevel: 150,
        expiryDate: new Date('2026-03-15'),
        batchNumber: 'BATCH-002',
        supplier: 'MediSupply',
        lastUpdated: new Date()
      },
      {
        itemId: 'drug-003',
        drugId: 'drug-003',
        drugName: 'Insulin Glargine',
        facilityId,
        currentStock: 25,
        unit: 'vials',
        reorderLevel: 50,
        expiryDate: new Date('2026-03-20'),
        batchNumber: 'BATCH-003',
        supplier: 'PharmaCorp',
        lastUpdated: new Date()
      }
    ];
  }

  private async getAllBloodInventory(facilityId: string): Promise<BloodInventoryItem[]> {
    // Mock data - in production, query database
    const now = new Date();
    const expirySoon = new Date(now);
    expirySoon.setDate(expirySoon.getDate() + 10);
    
    return [
      {
        itemId: 'blood-001',
        bloodGroup: 'O+',
        facilityId,
        units: 45,
        expiryDate: new Date('2026-04-15'),
        collectionDate: new Date('2026-03-01'),
        status: 'available',
        lastUpdated: new Date()
      },
      {
        itemId: 'blood-002',
        bloodGroup: 'O-',
        facilityId,
        units: 3,
        expiryDate: expirySoon,
        collectionDate: new Date('2026-02-20'),
        status: 'available',
        lastUpdated: new Date()
      },
      {
        itemId: 'blood-003',
        bloodGroup: 'AB-',
        facilityId,
        units: 2,
        expiryDate: new Date('2026-04-10'),
        collectionDate: new Date('2026-02-28'),
        status: 'available',
        lastUpdated: new Date()
      }
    ];
  }

  private async getDrugInventoryItem(
    facilityId: string,
    itemId: string
  ): Promise<DrugInventoryItem> {
    const items = await this.getAllDrugInventory(facilityId);
    const item = items.find(i => i.itemId === itemId);
    if (!item) {
      throw new Error(`Drug item ${itemId} not found`);
    }
    return item;
  }

  private async getBloodInventoryItem(
    facilityId: string,
    itemId: string
  ): Promise<BloodInventoryItem> {
    const items = await this.getAllBloodInventory(facilityId);
    const item = items.find(i => i.itemId === itemId);
    if (!item) {
      throw new Error(`Blood item ${itemId} not found`);
    }
    return item;
  }

  private identifyLowStock(
    drugItems: DrugInventoryItem[],
    bloodItems: BloodInventoryItem[]
  ): Array<DrugInventoryItem | BloodInventoryItem> {
    const lowStock: Array<DrugInventoryItem | BloodInventoryItem> = [];
    
    for (const item of drugItems) {
      if (item.currentStock <= item.reorderLevel && item.currentStock > item.reorderLevel * 0.5) {
        lowStock.push(item);
      }
    }
    
    for (const item of bloodItems) {
      const threshold = config.thresholds.bloodCriticalUnits * 2;
      if (item.units <= threshold && item.units > config.thresholds.bloodCriticalUnits) {
        lowStock.push(item);
      }
    }
    
    return lowStock;
  }

  private identifyCriticalStock(
    drugItems: DrugInventoryItem[],
    bloodItems: BloodInventoryItem[]
  ): Array<DrugInventoryItem | BloodInventoryItem> {
    const criticalStock: Array<DrugInventoryItem | BloodInventoryItem> = [];
    
    for (const item of drugItems) {
      if (item.currentStock <= item.reorderLevel * 0.5) {
        criticalStock.push(item);
      }
    }
    
    for (const item of bloodItems) {
      if (item.units <= config.thresholds.bloodCriticalUnits) {
        criticalStock.push(item);
      }
    }
    
    return criticalStock;
  }

  private identifyExpiringItems(
    drugItems: DrugInventoryItem[],
    bloodItems: BloodInventoryItem[]
  ): Array<DrugInventoryItem | BloodInventoryItem> {
    const expiringItems: Array<DrugInventoryItem | BloodInventoryItem> = [];
    const now = new Date();
    const threshold = new Date();
    threshold.setDate(now.getDate() + config.thresholds.expiryWarningDays);
    
    for (const item of drugItems) {
      if (item.expiryDate <= threshold) {
        expiringItems.push(item);
      }
    }
    
    for (const item of bloodItems) {
      if (item.expiryDate <= threshold) {
        expiringItems.push(item);
      }
    }
    
    return expiringItems;
  }

  private async generateAlerts(
    facilityId: string,
    lowStockItems: Array<DrugInventoryItem | BloodInventoryItem>,
    criticalStockItems: Array<DrugInventoryItem | BloodInventoryItem>,
    expiringItems: Array<DrugInventoryItem | BloodInventoryItem>
  ): Promise<InventoryAlert[]> {
    const alerts: InventoryAlert[] = [];
    
    // Critical stock alerts
    for (const item of criticalStockItems) {
      const isDrug = 'drugName' in item;
      alerts.push({
        alertId: `alert-${Date.now()}-${item.itemId}`,
        facilityId,
        alertType: 'critical_stock',
        severity: 'critical',
        itemId: item.itemId,
        itemName: isDrug ? item.drugName : `Blood ${item.bloodGroup}`,
        message: `CRITICAL: Stock critically low`,
        currentStock: isDrug ? item.currentStock : item.units,
        recommendedAction: 'Place emergency order immediately',
        createdAt: new Date(),
        acknowledged: false
      });
    }
    
    // Low stock alerts
    for (const item of lowStockItems) {
      const isDrug = 'drugName' in item;
      alerts.push({
        alertId: `alert-${Date.now()}-${item.itemId}`,
        facilityId,
        alertType: 'low_stock',
        severity: 'medium',
        itemId: item.itemId,
        itemName: isDrug ? item.drugName : `Blood ${item.bloodGroup}`,
        message: `Stock below reorder point`,
        currentStock: isDrug ? item.currentStock : item.units,
        recommendedAction: 'Place order soon',
        createdAt: new Date(),
        acknowledged: false
      });
    }
    
    // Add expiry alerts
    const expiryAlerts = await this.monitorExpiryDates(facilityId);
    alerts.push(...expiryAlerts);
    
    return alerts.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }
}
