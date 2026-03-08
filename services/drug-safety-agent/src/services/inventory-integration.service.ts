import { drugKnowledgeGraph } from './drug-knowledge-graph.service';
import { InventoryCheckRequest, InventoryCheckResponse, Drug } from '../types';

/**
 * Inventory Integration Service
 * Integrates with pharmacy inventory system for stock availability
 */
export class InventoryIntegrationService {
  // Mock inventory data - in production, this would query the database
  private inventory: Map<string, {
    facilityId: string;
    drugId: string;
    stock: number;
    unit: string;
    expiryDate: string;
    reorderLevel: number;
  }[]> = new Map();

  constructor() {
    this.initializeMockInventory();
  }

  /**
   * Initialize mock inventory data
   */
  private initializeMockInventory(): void {
    // Facility 1 inventory
    this.inventory.set('facility_001', [
      {
        facilityId: 'facility_001',
        drugId: 'drug_001',
        stock: 500,
        unit: 'tablets',
        expiryDate: '2025-12-31',
        reorderLevel: 100
      },
      {
        facilityId: 'facility_001',
        drugId: 'drug_002',
        stock: 250,
        unit: 'tablets',
        expiryDate: '2025-10-15',
        reorderLevel: 50
      },
      {
        facilityId: 'facility_001',
        drugId: 'drug_003',
        stock: 300,
        unit: 'tablets',
        expiryDate: '2026-03-20',
        reorderLevel: 75
      },
      {
        facilityId: 'facility_001',
        drugId: 'drug_004',
        stock: 150,
        unit: 'tablets',
        expiryDate: '2025-08-10',
        reorderLevel: 50
      },
      {
        facilityId: 'facility_001',
        drugId: 'drug_005',
        stock: 200,
        unit: 'tablets',
        expiryDate: '2025-11-30',
        reorderLevel: 60
      },
      {
        facilityId: 'facility_001',
        drugId: 'drug_006',
        stock: 400,
        unit: 'tablets',
        expiryDate: '2026-01-15',
        reorderLevel: 100
      },
      {
        facilityId: 'facility_001',
        drugId: 'drug_007',
        stock: 50,
        unit: 'vials',
        expiryDate: '2025-06-30',
        reorderLevel: 20
      },
      {
        facilityId: 'facility_001',
        drugId: 'drug_008',
        stock: 10,
        unit: 'capsules',
        expiryDate: '2025-04-15',
        reorderLevel: 100
      },
      {
        facilityId: 'facility_001',
        drugId: 'drug_009',
        stock: 180,
        unit: 'tablets',
        expiryDate: '2025-09-20',
        reorderLevel: 50
      },
      {
        facilityId: 'facility_001',
        drugId: 'drug_010',
        stock: 220,
        unit: 'tablets',
        expiryDate: '2025-12-10',
        reorderLevel: 75
      }
    ]);
  }

  /**
   * Check drug availability in inventory
   */
  async checkInventory(request: InventoryCheckRequest): Promise<InventoryCheckResponse> {
    const facilityInventory = this.inventory.get(request.facilityId) || [];
    const drugInventory = facilityInventory.find(item => item.drugId === request.drugId);

    if (!drugInventory) {
      // Drug not in inventory, find alternatives
      const alternatives = await this.findAlternatives(request.drugId, request.facilityId);
      
      return {
        available: false,
        currentStock: 0,
        unit: 'N/A',
        reorderLevel: 0,
        alternatives
      };
    }

    const daysUntilExpiry = this.calculateDaysUntilExpiry(drugInventory.expiryDate);
    const requiredQty = request.requiredQuantity || 1;

    // Check if stock is sufficient
    const available = drugInventory.stock >= requiredQty;

    // Check if stock is low
    const isLowStock = drugInventory.stock <= drugInventory.reorderLevel;

    // Check if expiring soon (within 30 days)
    const expiringSoon = daysUntilExpiry <= 30;

    const response: InventoryCheckResponse = {
      available,
      currentStock: drugInventory.stock,
      unit: drugInventory.unit,
      expiryDate: drugInventory.expiryDate,
      daysUntilExpiry,
      reorderLevel: drugInventory.reorderLevel
    };

    // If low stock or expiring soon, suggest alternatives
    if (isLowStock || expiringSoon || !available) {
      response.alternatives = await this.findAlternatives(request.drugId, request.facilityId);
    }

    return response;
  }

  /**
   * Calculate days until expiry
   */
  private calculateDaysUntilExpiry(expiryDate: string): number {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Find alternative drugs with better availability
   */
  private async findAlternatives(
    drugId: string,
    facilityId: string
  ): Promise<Array<{
    drugId: string;
    drugName: string;
    stock: number;
    expiryDate?: string;
  }>> {
    const alternatives: Array<{
      drugId: string;
      drugName: string;
      stock: number;
      expiryDate?: string;
    }> = [];

    const drug = drugKnowledgeGraph.getDrugById(drugId);
    if (!drug) {
      return alternatives;
    }

    // Find drugs in same therapeutic class
    const allDrugs = drugKnowledgeGraph.getAllDrugs();
    const sameClassDrugs = allDrugs.filter(d =>
      d.therapeuticClass === drug.therapeuticClass &&
      d.id !== drug.id
    );

    const facilityInventory = this.inventory.get(facilityId) || [];

    for (const altDrug of sameClassDrugs) {
      const altInventory = facilityInventory.find(item => item.drugId === altDrug.id);
      
      if (altInventory && altInventory.stock > altInventory.reorderLevel) {
        const daysUntilExpiry = this.calculateDaysUntilExpiry(altInventory.expiryDate);
        
        // Only suggest if not expiring within 30 days
        if (daysUntilExpiry > 30) {
          alternatives.push({
            drugId: altDrug.id,
            drugName: altDrug.name,
            stock: altInventory.stock,
            expiryDate: altInventory.expiryDate
          });
        }
      }
    }

    return alternatives.slice(0, 3); // Return top 3 alternatives
  }

  /**
   * Validate expiry date
   */
  async validateExpiry(drugId: string, facilityId: string): Promise<{
    valid: boolean;
    daysUntilExpiry: number;
    warning?: string;
  }> {
    const facilityInventory = this.inventory.get(facilityId) || [];
    const drugInventory = facilityInventory.find(item => item.drugId === drugId);

    if (!drugInventory) {
      return {
        valid: false,
        daysUntilExpiry: 0,
        warning: 'Drug not found in inventory'
      };
    }

    const daysUntilExpiry = this.calculateDaysUntilExpiry(drugInventory.expiryDate);

    if (daysUntilExpiry <= 0) {
      return {
        valid: false,
        daysUntilExpiry,
        warning: 'Drug has expired'
      };
    }

    if (daysUntilExpiry <= 30) {
      return {
        valid: true,
        daysUntilExpiry,
        warning: `Drug expires in ${daysUntilExpiry} days. Consider alternative.`
      };
    }

    return {
      valid: true,
      daysUntilExpiry
    };
  }

  /**
   * Get stock level status
   */
  async getStockStatus(drugId: string, facilityId: string): Promise<{
    status: 'in_stock' | 'low_stock' | 'out_of_stock';
    currentStock: number;
    reorderLevel: number;
    message: string;
  }> {
    const facilityInventory = this.inventory.get(facilityId) || [];
    const drugInventory = facilityInventory.find(item => item.drugId === drugId);

    if (!drugInventory) {
      return {
        status: 'out_of_stock',
        currentStock: 0,
        reorderLevel: 0,
        message: 'Drug not available in inventory'
      };
    }

    if (drugInventory.stock === 0) {
      return {
        status: 'out_of_stock',
        currentStock: 0,
        reorderLevel: drugInventory.reorderLevel,
        message: 'Out of stock. Consider alternatives.'
      };
    }

    if (drugInventory.stock <= drugInventory.reorderLevel) {
      return {
        status: 'low_stock',
        currentStock: drugInventory.stock,
        reorderLevel: drugInventory.reorderLevel,
        message: `Low stock (${drugInventory.stock} ${drugInventory.unit} remaining). Reorder recommended.`
      };
    }

    return {
      status: 'in_stock',
      currentStock: drugInventory.stock,
      reorderLevel: drugInventory.reorderLevel,
      message: `In stock (${drugInventory.stock} ${drugInventory.unit} available)`
    };
  }

  /**
   * Update inventory (for testing purposes)
   */
  updateInventory(
    facilityId: string,
    drugId: string,
    quantity: number,
    operation: 'add' | 'subtract'
  ): void {
    const facilityInventory = this.inventory.get(facilityId);
    if (!facilityInventory) {
      return;
    }

    const drugInventory = facilityInventory.find(item => item.drugId === drugId);
    if (!drugInventory) {
      return;
    }

    if (operation === 'add') {
      drugInventory.stock += quantity;
    } else {
      drugInventory.stock = Math.max(0, drugInventory.stock - quantity);
    }
  }
}

export const inventoryIntegrationService = new InventoryIntegrationService();
