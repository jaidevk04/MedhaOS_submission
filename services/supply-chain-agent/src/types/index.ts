// Drug Inventory Types
export interface DrugUsagePattern {
  drugId: string;
  drugName: string;
  facilityId: string;
  dailyUsage: number[];
  weeklyUsage: number[];
  monthlyUsage: number[];
  seasonalFactors: Record<string, number>;
  trendDirection: 'increasing' | 'decreasing' | 'stable';
}

export interface DrugForecast {
  drugId: string;
  drugName: string;
  facilityId: string;
  forecastPeriod: '7d' | '14d' | '30d';
  predictedDemand: number[];
  confidenceInterval: {
    lower: number[];
    upper: number[];
  };
  currentStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  stockoutRisk: 'low' | 'medium' | 'high';
  generatedAt: Date;
}

export interface DrugInventoryItem {
  itemId: string;
  drugId: string;
  drugName: string;
  facilityId: string;
  currentStock: number;
  unit: string;
  reorderLevel: number;
  expiryDate: Date;
  batchNumber: string;
  supplier: string;
  lastUpdated: Date;
}

// Blood Bank Types
export interface BloodUsagePattern {
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  facilityId: string;
  dailyUsage: number[];
  weeklyUsage: number[];
  emergencyUsageRate: number;
  surgeryUsageRate: number;
  traumaUsageRate: number;
}

export interface BloodForecast {
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  facilityId: string;
  forecastPeriod: '7d' | '14d' | '30d';
  predictedDemand: number[];
  confidenceInterval: {
    lower: number[];
    upper: number[];
  };
  currentStock: number;
  criticalThreshold: number;
  shortageRisk: 'low' | 'medium' | 'high' | 'critical';
  recommendedDonorDrive: boolean;
  generatedAt: Date;
}

export interface BloodInventoryItem {
  itemId: string;
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  facilityId: string;
  units: number;
  expiryDate: Date;
  donorId?: string;
  collectionDate: Date;
  status: 'available' | 'reserved' | 'expired' | 'used';
  lastUpdated: Date;
}

// Purchase Order Types
export interface PurchaseOrder {
  orderId: string;
  facilityId: string;
  orderType: 'drug' | 'blood' | 'supply';
  items: PurchaseOrderItem[];
  supplier: string;
  totalAmount: number;
  status: 'draft' | 'pending' | 'approved' | 'ordered' | 'received';
  priority: 'routine' | 'urgent' | 'emergency';
  createdAt: Date;
  expectedDelivery?: Date;
}

export interface PurchaseOrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

// Alert Types
export interface InventoryAlert {
  alertId: string;
  facilityId: string;
  alertType: 'low_stock' | 'critical_stock' | 'expiry_warning' | 'stockout_predicted' | 'blood_shortage';
  severity: 'low' | 'medium' | 'high' | 'critical';
  itemId: string;
  itemName: string;
  message: string;
  currentStock: number;
  recommendedAction: string;
  createdAt: Date;
  acknowledged: boolean;
}

// Donor Drive Types
export interface DonorDrive {
  driveId: string;
  facilityId: string;
  bloodGroups: string[];
  targetUnits: number;
  startDate: Date;
  endDate: Date;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  registeredDonors: number;
  collectedUnits: number;
  createdAt: Date;
}

// API Request/Response Types
export interface ForecastRequest {
  facilityId: string;
  itemType: 'drug' | 'blood';
  itemId?: string;
  forecastPeriod: '7d' | '14d' | '30d';
}

export interface InventoryStatusResponse {
  facilityId: string;
  totalItems: number;
  lowStockItems: number;
  criticalStockItems: number;
  expiringItems: number;
  alerts: InventoryAlert[];
  lastUpdated: Date;
}

export interface ReorderRecommendation {
  itemId: string;
  itemName: string;
  currentStock: number;
  reorderPoint: number;
  recommendedQuantity: number;
  urgency: 'low' | 'medium' | 'high';
  estimatedStockoutDate?: Date;
  supplier: string;
}
