import { useState, useEffect, useCallback, useRef } from 'react';
import * as api from './api';
import { connectWebSocket, subscribeToUpdates, disconnectWebSocket } from './wsClient';

// Sync interval in milliseconds (5 seconds)
const SYNC_INTERVAL = 5000;

// In-memory data store (replaces localStorage)
const inMemoryData: {
  prisoners: any[];
  dailyTasks: any[];
  musterConfirmations: any[];
  cellAlarms: any[];
  handovers: Record<string, Record<string, any>>;
  searchTargets: any[];
  stripSearches: Record<string, Record<string, any>>;
  unitMaintenance: any[];
  prisonerInductions: any[];
  notifications: any[];
  sacraReminders: any[];
  controlHandover: Record<string, any>;
  lastSync: string | null;
} = {
  prisoners: [],
  dailyTasks: [],
  musterConfirmations: [],
  cellAlarms: [],
  handovers: {},
  searchTargets: [],
  stripSearches: {},
  unitMaintenance: [],
  prisonerInductions: [],
  notifications: [],
  sacraReminders: [],
  controlHandover: {},
  lastSync: null,
};

// Export getter functions for store.ts to use
export function getInMemoryData() {
  return inMemoryData;
}

export function setInMemoryData(key: keyof typeof inMemoryData, value: any) {
  (inMemoryData as any)[key] = value;
}

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  error: string | null;
}

const initialSyncState: SyncState = {
  isOnline: navigator.onLine,
  isSyncing: false,
  lastSyncTime: null,
  error: null,
};

/**
 * Custom hook for syncing data with the backend
 */
export function useSync() {
  const [syncState, setSyncState] = useState<SyncState>(initialSyncState);
  const syncIntervalRef = useRef<number | null>(null);
  const isSyncingRef = useRef(false);

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    connectWebSocket();
    
    // Subscribe to WebSocket updates
    const unsubscribe = subscribeToUpdates((data) => {
      // Update in-memory store with deduplication
      // Use Map to keep first occurrence (by ID) to avoid duplicates
      const taskMap = new Map();
      for (const t of data.dailyTasks || []) {
        taskMap.set(t.id, t);
      }
      inMemoryData.dailyTasks = Array.from(taskMap.values());
      inMemoryData.prisoners = data.prisoners || [];
      inMemoryData.musterConfirmations = data.musterConfirmations || [];
      inMemoryData.cellAlarms = data.cellAlarms || [];
      
      const handoverObj: Record<string, Record<string, any>> = {};
      for (const h of data.handovers || []) {
        if (!handoverObj[h.unitId]) handoverObj[h.unitId] = {};
        handoverObj[h.unitId][h.date] = h;
      }
      inMemoryData.handovers = handoverObj;
      
      inMemoryData.searchTargets = data.searchTargets || [];
      
      const stripSearchObj: Record<string, Record<string, any>> = {};
      for (const s of data.stripSearches || []) {
        if (!stripSearchObj[s.unitId]) stripSearchObj[s.unitId] = {};
        stripSearchObj[s.unitId][s.date] = s;
      }
      inMemoryData.stripSearches = stripSearchObj;
      
      inMemoryData.unitMaintenance = data.unitMaintenance || [];
      inMemoryData.prisonerInductions = data.prisonerInductions || [];
      
      inMemoryData.lastSync = data.timestamp;
      
      // Dispatch event for components to refresh
      window.dispatchEvent(new CustomEvent('data-synced', { detail: data }));
    });
    
    return () => {
      unsubscribe();
      disconnectWebSocket();
    };
  }, []);

  // Perform sync with backend
  const performSync = useCallback(async (showSyncing = true) => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    if (showSyncing) {
      setSyncState(prev => ({ ...prev, isSyncing: true, error: null }));
    }

    try {
      // Try to fetch from backend
      const data = await api.fetchAllData();
      
      // Update in-memory store with deduplication
      // Use Map to keep first occurrence (by ID) to avoid duplicates
      const taskMap = new Map();
      for (const t of data.dailyTasks || []) {
        taskMap.set(t.id, t);
      }
      inMemoryData.dailyTasks = Array.from(taskMap.values());
      
      inMemoryData.prisoners = data.prisoners || [];
      inMemoryData.musterConfirmations = data.musterConfirmations || [];
      inMemoryData.cellAlarms = data.cellAlarms || [];
      
      // Convert handovers array to nested object format { unitId: { date: handover } }
      const handoverObj: Record<string, Record<string, any>> = {};
      for (const h of data.handovers || []) {
        if (!handoverObj[h.unitId]) handoverObj[h.unitId] = {};
        handoverObj[h.unitId][h.date] = h;
      }
      inMemoryData.handovers = handoverObj;
      
      inMemoryData.searchTargets = data.searchTargets || [];
      
      // Convert stripSearches array to nested object format { unitId: { date: record } }
      const stripSearchObj: Record<string, Record<string, any>> = {};
      for (const s of data.stripSearches || []) {
        if (!stripSearchObj[s.unitId]) stripSearchObj[s.unitId] = {};
        stripSearchObj[s.unitId][s.date] = s;
      }
      inMemoryData.stripSearches = stripSearchObj;
      
      inMemoryData.unitMaintenance = data.unitMaintenance || [];
      inMemoryData.prisonerInductions = data.prisonerInductions || [];
      
      const now = new Date().toISOString();
      inMemoryData.lastSync = now;

      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: now,
        error: null,
      }));

      // Dispatch event for components to refresh
      window.dispatchEvent(new CustomEvent('data-synced', { detail: data }));
    } catch (error) {
      console.error('Sync failed:', error);
      
      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        error: 'Failed to sync with server',
      }));
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  // Start periodic sync
  const startAutoSync = useCallback(() => {
    if (syncIntervalRef.current) return;
    
    // Initial sync
    performSync();
    
    // Set up interval
    syncIntervalRef.current = window.setInterval(() => {
      if (navigator.onLine) {
        performSync(false); // Don't show syncing indicator for background syncs
      }
    }, SYNC_INTERVAL);
  }, [performSync]);

  // Stop periodic sync
  const stopAutoSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  }, []);

  // Manual refresh
  const refresh = useCallback(() => {
    return performSync(true);
  }, [performSync]);

  // Get data from in-memory store
  const getInMemoryStore = useCallback(() => {
    return inMemoryData;
  }, []);

  return {
    ...syncState,
    startAutoSync,
    stopAutoSync,
    refresh,
    getInMemoryStore,
  };
}

/**
 * Hook for components to subscribe to data changes
 */
export function useDataSync() {
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    const handleDataSync = (event: Event) => {
      setLastUpdate((event as CustomEvent).detail?.timestamp || new Date().toISOString());
    };

    window.addEventListener('data-synced', handleDataSync);
    return () => window.removeEventListener('data-synced', handleDataSync);
  }, []);

  return { lastUpdate };
}

// Sync utility functions (for use outside React components)
export const syncUtils = {
  // Push changes to backend
  async pushPrisonerUpdate(prisoner: any) {
    try {
      if (prisoner.id) {
        await api.updatePrisoner(prisoner.id, prisoner);
      } else {
        await api.savePrisoner(prisoner);
      }
    } catch (error) {
      console.error('Failed to push prisoner update:', error);
    }
  },

  async pushTaskUpdate(task: any) {
    try {
      await api.updateTask(task.id, task);
    } catch (error) {
      console.error('Failed to push task update:', error);
    }
  },

  async pushMusterUpdate(muster: any) {
    try {
      await api.saveMuster(muster);
    } catch (error) {
      console.error('Failed to push muster update:', error);
    }
  },

  async pushAlarmUpdate(alarm: any) {
    try {
      await api.updateAlarm(alarm.id, alarm);
    } catch (error) {
      console.error('Failed to push alarm update:', error);
    }
  },

  async pushHandoverUpdate(handover: any) {
    try {
      await api.saveHandover(handover);
    } catch (error) {
      console.error('Failed to push handover update:', error);
    }
  },
};
