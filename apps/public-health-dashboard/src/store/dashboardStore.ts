import { create } from 'zustand';
import {
  DiseaseData,
  DistrictRiskData,
  MapLayer,
  MapLayerType,
  OutbreakAlert,
  OutbreakEvent,
  RRTDeployment,
  MedicalSupply,
  HospitalCapacity,
  ResourceGap,
  TrendData,
  MediaEvent,
  Campaign,
  DashboardFilters,
} from '@/types';

interface DashboardState {
  // Map data
  diseaseData: DiseaseData[];
  districtRiskData: DistrictRiskData[];
  mapLayers: MapLayer[];
  selectedDistrict: string | null;
  mapViewport: {
    latitude: number;
    longitude: number;
    zoom: number;
  };

  // Outbreak alerts
  outbreakAlerts: OutbreakAlert[];
  selectedAlert: OutbreakAlert | null;

  // Outbreak timeline
  outbreakEvents: OutbreakEvent[];
  selectedEvent: OutbreakEvent | null;

  // Resource allocation
  rrtDeployments: RRTDeployment[];
  medicalSupplies: MedicalSupply[];
  hospitalCapacities: HospitalCapacity[];
  resourceGaps: ResourceGap[];

  // Syndromic trends
  trendData: TrendData[];
  selectedSyndromes: string[];

  // Media scanning
  mediaEvents: MediaEvent[];
  unverifiedMediaCount: number;

  // Campaigns
  campaigns: Campaign[];
  activeCampaign: Campaign | null;

  // Filters
  filters: DashboardFilters;

  // Loading states
  loading: {
    map: boolean;
    alerts: boolean;
    timeline: boolean;
    resources: boolean;
    trends: boolean;
    media: boolean;
    campaigns: boolean;
  };

  // Actions
  setDiseaseData: (data: DiseaseData[]) => void;
  setDistrictRiskData: (data: DistrictRiskData[]) => void;
  toggleMapLayer: (layerId: MapLayerType) => void;
  setMapLayerOpacity: (layerId: MapLayerType, opacity: number) => void;
  setSelectedDistrict: (districtId: string | null) => void;
  setMapViewport: (viewport: Partial<DashboardState['mapViewport']>) => void;

  setOutbreakAlerts: (alerts: OutbreakAlert[]) => void;
  addOutbreakAlert: (alert: OutbreakAlert) => void;
  setSelectedAlert: (alert: OutbreakAlert | null) => void;

  setOutbreakEvents: (events: OutbreakEvent[]) => void;
  setSelectedEvent: (event: OutbreakEvent | null) => void;

  setRRTDeployments: (deployments: RRTDeployment[]) => void;
  addRRTDeployment: (deployment: RRTDeployment) => void;
  setMedicalSupplies: (supplies: MedicalSupply[]) => void;
  setHospitalCapacities: (capacities: HospitalCapacity[]) => void;
  setResourceGaps: (gaps: ResourceGap[]) => void;

  setTrendData: (data: TrendData[]) => void;
  toggleSyndrome: (syndrome: string) => void;

  setMediaEvents: (events: MediaEvent[]) => void;
  addMediaEvent: (event: MediaEvent) => void;
  verifyMediaEvent: (eventId: string, verifiedBy: string) => void;

  setCampaigns: (campaigns: Campaign[]) => void;
  setActiveCampaign: (campaign: Campaign | null) => void;
  updateCampaignReach: (campaignId: string, reach: Partial<Campaign['reach']>) => void;

  setFilters: (filters: Partial<DashboardFilters>) => void;
  resetFilters: () => void;

  setLoading: (key: keyof DashboardState['loading'], value: boolean) => void;
}

const defaultFilters: DashboardFilters = {
  dateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString(),
  },
  states: [],
  districts: [],
  diseases: [],
  riskLevels: [],
};

const defaultMapLayers: MapLayer[] = [
  { id: 'syndromic', name: 'Syndromic Data', enabled: true, opacity: 0.8 },
  { id: 'lab', name: 'Lab Confirmed', enabled: true, opacity: 0.8 },
  { id: 'environmental', name: 'Environmental Factors', enabled: false, opacity: 0.6 },
  { id: 'mobility', name: 'Population Mobility', enabled: false, opacity: 0.6 },
];

export const useDashboardStore = create<DashboardState>((set) => ({
  // Initial state
  diseaseData: [],
  districtRiskData: [],
  mapLayers: defaultMapLayers,
  selectedDistrict: null,
  mapViewport: {
    latitude: 20.5937,
    longitude: 78.9629,
    zoom: 4,
  },

  outbreakAlerts: [],
  selectedAlert: null,

  outbreakEvents: [],
  selectedEvent: null,

  rrtDeployments: [],
  medicalSupplies: [],
  hospitalCapacities: [],
  resourceGaps: [],

  trendData: [],
  selectedSyndromes: [],

  mediaEvents: [],
  unverifiedMediaCount: 0,

  campaigns: [],
  activeCampaign: null,

  filters: defaultFilters,

  loading: {
    map: false,
    alerts: false,
    timeline: false,
    resources: false,
    trends: false,
    media: false,
    campaigns: false,
  },

  // Actions
  setDiseaseData: (data) => set({ diseaseData: data }),
  
  setDistrictRiskData: (data) => set({ districtRiskData: data }),
  
  toggleMapLayer: (layerId) =>
    set((state) => ({
      mapLayers: state.mapLayers.map((layer) =>
        layer.id === layerId ? { ...layer, enabled: !layer.enabled } : layer
      ),
    })),
  
  setMapLayerOpacity: (layerId, opacity) =>
    set((state) => ({
      mapLayers: state.mapLayers.map((layer) =>
        layer.id === layerId ? { ...layer, opacity } : layer
      ),
    })),
  
  setSelectedDistrict: (districtId) => set({ selectedDistrict: districtId }),
  
  setMapViewport: (viewport) =>
    set((state) => ({
      mapViewport: { ...state.mapViewport, ...viewport },
    })),

  setOutbreakAlerts: (alerts) => set({ outbreakAlerts: alerts }),
  
  addOutbreakAlert: (alert) =>
    set((state) => ({
      outbreakAlerts: [alert, ...state.outbreakAlerts],
    })),
  
  setSelectedAlert: (alert) => set({ selectedAlert: alert }),

  setOutbreakEvents: (events) => set({ outbreakEvents: events }),
  
  setSelectedEvent: (event) => set({ selectedEvent: event }),

  setRRTDeployments: (deployments) => set({ rrtDeployments: deployments }),
  
  addRRTDeployment: (deployment) =>
    set((state) => ({
      rrtDeployments: [deployment, ...state.rrtDeployments],
    })),
  
  setMedicalSupplies: (supplies) => set({ medicalSupplies: supplies }),
  
  setHospitalCapacities: (capacities) => set({ hospitalCapacities: capacities }),
  
  setResourceGaps: (gaps) => set({ resourceGaps: gaps }),

  setTrendData: (data) => set({ trendData: data }),
  
  toggleSyndrome: (syndrome) =>
    set((state) => ({
      selectedSyndromes: state.selectedSyndromes.includes(syndrome)
        ? state.selectedSyndromes.filter((s) => s !== syndrome)
        : [...state.selectedSyndromes, syndrome],
    })),

  setMediaEvents: (events) =>
    set({
      mediaEvents: events,
      unverifiedMediaCount: events.filter((e) => !e.verified).length,
    }),
  
  addMediaEvent: (event) =>
    set((state) => ({
      mediaEvents: [event, ...state.mediaEvents],
      unverifiedMediaCount: event.verified
        ? state.unverifiedMediaCount
        : state.unverifiedMediaCount + 1,
    })),
  
  verifyMediaEvent: (eventId, verifiedBy) =>
    set((state) => ({
      mediaEvents: state.mediaEvents.map((event) =>
        event.id === eventId
          ? { ...event, verified: true, verifiedAt: new Date().toISOString(), verifiedBy }
          : event
      ),
      unverifiedMediaCount: Math.max(0, state.unverifiedMediaCount - 1),
    })),

  setCampaigns: (campaigns) => set({ campaigns }),
  
  setActiveCampaign: (campaign) => set({ activeCampaign: campaign }),
  
  updateCampaignReach: (campaignId, reach) =>
    set((state) => ({
      campaigns: state.campaigns.map((campaign) =>
        campaign.id === campaignId
          ? { ...campaign, reach: { ...campaign.reach, ...reach } }
          : campaign
      ),
      activeCampaign:
        state.activeCampaign?.id === campaignId
          ? { ...state.activeCampaign, reach: { ...state.activeCampaign.reach, ...reach } }
          : state.activeCampaign,
    })),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),
  
  resetFilters: () => set({ filters: defaultFilters }),

  setLoading: (key, value) =>
    set((state) => ({
      loading: { ...state.loading, [key]: value },
    })),
}));
