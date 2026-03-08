import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Task, Patient, Message, HandoffNote } from '@/types';

interface NurseTabletDB extends DBSchema {
  tasks: {
    key: string;
    value: Task;
    indexes: { 'by-priority': string; 'by-status': string };
  };
  patients: {
    key: string;
    value: Patient;
  };
  messages: {
    key: string;
    value: Message;
    indexes: { 'by-read': boolean };
  };
  handoffNotes: {
    key: string;
    value: HandoffNote;
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      type: 'task' | 'patient' | 'message' | 'handoff';
      action: 'create' | 'update' | 'delete';
      data: any;
      timestamp: string;
    };
  };
}

class OfflineStorage {
  private db: IDBPDatabase<NurseTabletDB> | null = null;

  async init() {
    if (this.db) return this.db;

    this.db = await openDB<NurseTabletDB>('nurse-tablet-db', 1, {
      upgrade(db) {
        // Tasks store
        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
        taskStore.createIndex('by-priority', 'priority');
        taskStore.createIndex('by-status', 'status');

        // Patients store
        db.createObjectStore('patients', { keyPath: 'id' });

        // Messages store
        const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
        messageStore.createIndex('by-read', 'read');

        // Handoff notes store
        db.createObjectStore('handoffNotes', { keyPath: 'id' });

        // Sync queue store
        db.createObjectStore('syncQueue', { keyPath: 'id' });
      },
    });

    return this.db;
  }

  async getTasks(): Promise<Task[]> {
    const db = await this.init();
    return db.getAll('tasks');
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    const db = await this.init();
    const tx = db.transaction('tasks', 'readwrite');
    await Promise.all([
      ...tasks.map((task) => tx.store.put(task)),
      tx.done,
    ]);
  }

  async getPatients(): Promise<Patient[]> {
    const db = await this.init();
    return db.getAll('patients');
  }

  async savePatients(patients: Patient[]): Promise<void> {
    const db = await this.init();
    const tx = db.transaction('patients', 'readwrite');
    await Promise.all([
      ...patients.map((patient) => tx.store.put(patient)),
      tx.done,
    ]);
  }

  async getMessages(): Promise<Message[]> {
    const db = await this.init();
    return db.getAll('messages');
  }

  async saveMessage(message: Message): Promise<void> {
    const db = await this.init();
    await db.put('messages', message);
  }

  async getHandoffNotes(): Promise<HandoffNote[]> {
    const db = await this.init();
    return db.getAll('handoffNotes');
  }

  async saveHandoffNote(note: HandoffNote): Promise<void> {
    const db = await this.init();
    await db.put('handoffNotes', note);
  }

  async addToSyncQueue(item: {
    type: 'task' | 'patient' | 'message' | 'handoff';
    action: 'create' | 'update' | 'delete';
    data: any;
  }): Promise<void> {
    const db = await this.init();
    await db.put('syncQueue', {
      id: `${Date.now()}-${Math.random()}`,
      ...item,
      timestamp: new Date().toISOString(),
    });
  }

  async getSyncQueue() {
    const db = await this.init();
    return db.getAll('syncQueue');
  }

  async clearSyncQueue(): Promise<void> {
    const db = await this.init();
    await db.clear('syncQueue');
  }

  async clearAll(): Promise<void> {
    const db = await this.init();
    await Promise.all([
      db.clear('tasks'),
      db.clear('patients'),
      db.clear('messages'),
      db.clear('handoffNotes'),
      db.clear('syncQueue'),
    ]);
  }
}

export const offlineStorage = new OfflineStorage();
