import { create } from 'zustand';
import type { Task } from '@/types';
import { offlineStorage } from '@/lib/offlineStorage';

interface TaskState {
  tasks: Task[];
  filteredTasks: Task[];
  filter: 'all' | 'urgent' | 'soon' | 'routine';
  searchQuery: string;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string, notes?: string) => void;
  setFilter: (filter: 'all' | 'urgent' | 'soon' | 'routine') => void;
  setSearchQuery: (query: string) => void;
  reorderTasks: (tasks: Task[]) => void;
  fetchTasks: () => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  filteredTasks: [],
  filter: 'all',
  searchQuery: '',

  setTasks: (tasks) => {
    set({ tasks });
    applyFilters(get());
  },

  addTask: (task) => {
    const tasks = [...get().tasks, task];
    set({ tasks });
    offlineStorage.saveTasks(tasks);
    applyFilters(get());
  },

  updateTask: (id, updates) => {
    const tasks = get().tasks.map((task) =>
      task.id === id ? { ...task, ...updates } : task
    );
    set({ tasks });
    offlineStorage.saveTasks(tasks);
    applyFilters(get());
  },

  deleteTask: (id) => {
    const tasks = get().tasks.filter((task) => task.id !== id);
    set({ tasks });
    offlineStorage.saveTasks(tasks);
    applyFilters(get());
  },

  completeTask: (id, notes) => {
    const tasks = get().tasks.map((task) =>
      task.id === id
        ? {
            ...task,
            status: 'completed' as const,
            completedAt: new Date().toISOString(),
            notes,
          }
        : task
    );
    set({ tasks });
    offlineStorage.saveTasks(tasks);
    applyFilters(get());
  },

  setFilter: (filter) => {
    set({ filter });
    applyFilters(get());
  },

  setSearchQuery: (searchQuery) => {
    set({ searchQuery });
    applyFilters(get());
  },

  reorderTasks: (tasks) => {
    set({ tasks });
    offlineStorage.saveTasks(tasks);
    applyFilters(get());
  },

  fetchTasks: async () => {
    try {
      // Try to fetch from API
      const response = await fetch(
        `${import.meta.env.VITE_NURSE_SERVICE_URL}/api/tasks`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.ok) {
        const tasks = await response.json();
        set({ tasks });
        offlineStorage.saveTasks(tasks);
        applyFilters(get());
      } else {
        // Fallback to offline storage
        const tasks = await offlineStorage.getTasks();
        set({ tasks });
        applyFilters(get());
      }
    } catch (error) {
      // Offline mode - load from IndexedDB
      const tasks = await offlineStorage.getTasks();
      set({ tasks });
      applyFilters(get());
    }
  },
}));

function applyFilters(state: TaskState) {
  let filtered = state.tasks;

  // Apply priority filter
  if (state.filter !== 'all') {
    filtered = filtered.filter((task) => task.priority === state.filter);
  }

  // Apply search filter
  if (state.searchQuery) {
    const query = state.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (task) =>
        task.title.toLowerCase().includes(query) ||
        task.patientName.toLowerCase().includes(query) ||
        task.room.toLowerCase().includes(query)
    );
  }

  // Sort by priority and due time
  filtered.sort((a, b) => {
    const priorityOrder = { urgent: 0, soon: 1, routine: 2 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.dueTime).getTime() - new Date(b.dueTime).getTime();
  });

  state.filteredTasks = filtered;
}
