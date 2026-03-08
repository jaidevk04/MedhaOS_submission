/**
 * Recovery Plan Store
 * Manages post-discharge recovery plans, progress tracking, and educational content
 */

import { create } from 'zustand';

export interface RecoveryPhase {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed';
  progress: number; // 0-100
  milestones: RecoveryMilestone[];
  activities: RecoveryActivity[];
}

export interface RecoveryMilestone {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  completedDate?: string;
}

export interface RecoveryActivity {
  id: string;
  type: 'medication' | 'exercise' | 'diet' | 'checkup' | 'restriction';
  title: string;
  description: string;
  frequency?: string;
  completed: boolean;
  icon: string;
}

export interface EducationalContent {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'article' | 'infographic';
  category: string;
  language: string;
  duration?: number; // in seconds for videos
  thumbnailUrl?: string;
  contentUrl: string;
  watched: boolean;
  watchProgress?: number; // 0-100 for videos
  tags: string[];
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai' | 'doctor';
  timestamp: string;
  type: 'text' | 'quick_reply' | 'alert';
  quickReplies?: string[];
}

export interface RecoveryPlan {
  id: string;
  patientId: string;
  condition: string;
  dischargeDate: string;
  phases: RecoveryPhase[];
  educationalContent: EducationalContent[];
  followUpAppointments: FollowUpAppointment[];
  emergencyContacts: EmergencyContact[];
  overallProgress: number; // 0-100
}

export interface FollowUpAppointment {
  id: string;
  date: string;
  time: string;
  doctor: string;
  specialty: string;
  purpose: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  available24x7: boolean;
}

interface RecoveryState {
  recoveryPlan: RecoveryPlan | null;
  chatMessages: ChatMessage[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setRecoveryPlan: (plan: RecoveryPlan) => void;
  updatePhaseProgress: (phaseId: string, progress: number) => void;
  completeMilestone: (phaseId: string, milestoneId: string) => void;
  completeActivity: (phaseId: string, activityId: string) => void;
  
  // Educational content actions
  markContentAsWatched: (contentId: string) => void;
  updateWatchProgress: (contentId: string, progress: number) => void;
  getContentByCategory: (category: string) => EducationalContent[];
  getRecommendedContent: () => EducationalContent[];
  
  // Chat actions
  addMessage: (message: ChatMessage) => void;
  clearChat: () => void;
  
  // Progress calculations
  calculateOverallProgress: () => number;
  getCurrentPhase: () => RecoveryPhase | null;
  getUpcomingMilestones: () => RecoveryMilestone[];
  
  // Loading and error
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useRecoveryStore = create<RecoveryState>((set, get) => ({
  recoveryPlan: null,
  chatMessages: [],
  isLoading: false,
  error: null,

  setRecoveryPlan: (plan) => set({ recoveryPlan: plan }),

  updatePhaseProgress: (phaseId, progress) => set((state) => {
    if (!state.recoveryPlan) return state;
    
    return {
      recoveryPlan: {
        ...state.recoveryPlan,
        phases: state.recoveryPlan.phases.map((phase) =>
          phase.id === phaseId ? { ...phase, progress } : phase
        ),
      },
    };
  }),

  completeMilestone: (phaseId, milestoneId) => set((state) => {
    if (!state.recoveryPlan) return state;
    
    return {
      recoveryPlan: {
        ...state.recoveryPlan,
        phases: state.recoveryPlan.phases.map((phase) =>
          phase.id === phaseId
            ? {
                ...phase,
                milestones: phase.milestones.map((milestone) =>
                  milestone.id === milestoneId
                    ? {
                        ...milestone,
                        completed: true,
                        completedDate: new Date().toISOString(),
                      }
                    : milestone
                ),
              }
            : phase
        ),
      },
    };
  }),

  completeActivity: (phaseId, activityId) => set((state) => {
    if (!state.recoveryPlan) return state;
    
    return {
      recoveryPlan: {
        ...state.recoveryPlan,
        phases: state.recoveryPlan.phases.map((phase) =>
          phase.id === phaseId
            ? {
                ...phase,
                activities: phase.activities.map((activity) =>
                  activity.id === activityId
                    ? { ...activity, completed: true }
                    : activity
                ),
              }
            : phase
        ),
      },
    };
  }),

  markContentAsWatched: (contentId) => set((state) => {
    if (!state.recoveryPlan) return state;
    
    return {
      recoveryPlan: {
        ...state.recoveryPlan,
        educationalContent: state.recoveryPlan.educationalContent.map((content) =>
          content.id === contentId
            ? { ...content, watched: true, watchProgress: 100 }
            : content
        ),
      },
    };
  }),

  updateWatchProgress: (contentId, progress) => set((state) => {
    if (!state.recoveryPlan) return state;
    
    return {
      recoveryPlan: {
        ...state.recoveryPlan,
        educationalContent: state.recoveryPlan.educationalContent.map((content) =>
          content.id === contentId
            ? { ...content, watchProgress: progress }
            : content
        ),
      },
    };
  }),

  getContentByCategory: (category) => {
    const plan = get().recoveryPlan;
    if (!plan) return [];
    
    return plan.educationalContent.filter(
      (content) => content.category === category
    );
  },

  getRecommendedContent: () => {
    const plan = get().recoveryPlan;
    if (!plan) return [];
    
    // Return unwatched content first, then watched
    return plan.educationalContent
      .sort((a, b) => {
        if (a.watched === b.watched) return 0;
        return a.watched ? 1 : -1;
      })
      .slice(0, 5);
  },

  addMessage: (message) => set((state) => ({
    chatMessages: [...state.chatMessages, message],
  })),

  clearChat: () => set({ chatMessages: [] }),

  calculateOverallProgress: () => {
    const plan = get().recoveryPlan;
    if (!plan || plan.phases.length === 0) return 0;
    
    const totalProgress = plan.phases.reduce(
      (sum, phase) => sum + phase.progress,
      0
    );
    
    return Math.round(totalProgress / plan.phases.length);
  },

  getCurrentPhase: () => {
    const plan = get().recoveryPlan;
    if (!plan) return null;
    
    return plan.phases.find((phase) => phase.status === 'active') || null;
  },

  getUpcomingMilestones: () => {
    const plan = get().recoveryPlan;
    if (!plan) return [];
    
    const currentPhase = get().getCurrentPhase();
    if (!currentPhase) return [];
    
    return currentPhase.milestones
      .filter((milestone) => !milestone.completed)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 3);
  },

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),
}));
