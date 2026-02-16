import { useState, useEffect, useCallback, useRef } from 'react';
import * as api from './api';
import { connectWebSocket, subscribeToUpdates, disconnectWebSocket } from './wsClient';

// Sync interval in milliseconds (5 seconds)
const SYNC_INTERVAL = 5000;

// Storage keys for local fallback
const STORAGE_KEYS = {
  prisoners: 'prison-muster-prisoners',
  dailyTasks: 'prison-muster-daily-tasks',
  musterConfirm: 'prison-muster-confirm',
  cellAlarms: 'prison-muster-cell-alarms',
  handover: 'prison-muster-handover',
  searchTargets: 'prison-muster-search-targets',
  stripSearch: 'prison-muster-strip-search',
  unitMaintenance: 'prison-muster-unit-maintenance',
  prisonerInductions: 'prison-muster-prisoner-inductions',
  lastSync: 'prison-muster-last-sync',
};

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  error: string | null;
}

const initialSyncState: SyncState = {
  isOnline: navigator.onLine,
  isSyncing: false,
  lastSyncTime: localStorage.getItem(STORAGE_KEYS.lastSync),
  error: null,
};

/**
 * Custom hook for syncing data with the backend
 * Falls back to localStorage when offline
 */
export function useSync() {
  const [syncState, setSyncState] = useState<SyncState>(initialSyncState);
  const syncIntervalRef = useRef<number | null>(null);
  const isSyncingRef = useRef(false);

  // Save to localStorage as fallback
  const saveToLocalStorage = useCallback((key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, []);

  // Load from localStorage
  const loadFromLocalStorage = useCallback((key: string): any => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
      return null;
    }
  }, []);

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    connectWebSocket();
    
    // Subscribe to WebSocket updates
    const unsubscribe = subscribeToUpdates((data) => {
      // Save to localStorage
      saveToLocalStorage(STORAGE_KEYS.prisoners, data.prisoners);
      saveToLocalStorage(STORAGE_KEYS.dailyTasks, data.dailyTasks);
      saveToLocalStorage(STORAGE_KEYS.musterConfirm, data.musterConfirmations);
      saveToLocalStorage(STORAGE_KEYS.cellAlarms, data.cellAlarms);
      
      const handoverObj: Record<string, Record<string, any>> = {};
      for (const h of data.handovers || []) {
        if (!handoverObj[h.unitId]) handoverObj[h.unitId] = {};
        handoverObj[h.unitId][h.date] = h;
      }
      saveToLocalStorage(STORAGE_KEYS.handover, handoverObj);
      
      saveToLocalStorage(STORAGE_KEYS.searchTargets, data.searchTargets);
      
      const stripSearchObj: Record<string, Record<string, any>> = {};
      for (const s of data.stripSearches || []) {
        if (!stripSearchObj[s.unitId]) stripSearchObj[s.unitId] = {};
        stripSearchObj[s.unitId][s.date] = s;
      }
      saveToLocalStorage(STORAGE_KEYS.stripSearch, stripSearchObj);
      
      saveToLocalStorage(STORAGE_KEYS.unitMaintenance, data.unitMaintenance);
      saveToLocalStorage(STORAGE_KEYS.prisonerInductions, data.prisonerInductions);
      
      localStorage.setItem(STORAGE_KEYS.lastSync, data.timestamp);
      
      // Dispatch event for components to refresh
      window.dispatchEvent(new CustomEvent('data-synced', { detail: data }));
    });
    
    return () => {
      unsubscribe();
      disconnectWebSocket();
    };
  }, [saveToLocalStorage]);

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
      
      // Check if there's actually new data from backend (compare timestamps)
      const lastSync = localStorage.getItem(STORAGE_KEYS.lastSync);
      const backendTime = new Date(data.timestamp).getTime();
      const lastSyncTime = lastSync ? new Date(lastSync).getTime() : 0;
      
      // Only trigger re-render if backend has newer data
      const hasNewData = backendTime > lastSyncTime;
      
      // Save prisoners as-is (array)
      saveToLocalStorage(STORAGE_KEYS.prisoners, data.prisoners);
      
      // Save dailyTasks as-is (array)
      saveToLocalStorage(STORAGE_KEYS.dailyTasks, data.dailyTasks);
      
      // Save musterConfirm as-is (array)
      saveToLocalStorage(STORAGE_KEYS.musterConfirm, data.musterConfirmations);
      
      // Save cellAlarms as-is (array)
      saveToLocalStorage(STORAGE_KEYS.cellAlarms, data.cellAlarms);
      
      // Convert handovers array to nested object format { unitId: { date: handover } }
      const handoverObj: Record<string, Record<string, any>> = {};
      for (const h of data.handovers || []) {
        if (!handoverObj[h.unitId]) handoverObj[h.unitId] = {};
        handoverObj[h.unitId][h.date] = h;
      }
      saveToLocalStorage(STORAGE_KEYS.handover, handoverObj);
      
      // Save searchTargets as-is (array)
      saveToLocalStorage(STORAGE_KEYS.searchTargets, data.searchTargets);
      
      // Convert stripSearches array to nested object format { unitId: { date: record } }
      const stripSearchObj: Record<string, Record<string, any>> = {};
      for (const s of data.stripSearches || []) {
        if (!stripSearchObj[s.unitId]) stripSearchObj[s.unitId] = {};
        stripSearchObj[s.unitId][s.date] = s;
      }
      saveToLocalStorage(STORAGE_KEYS.stripSearch, stripSearchObj);
      
      // Save unitMaintenance as-is (array)
      saveToLocalStorage(STORAGE_KEYS.unitMaintenance, data.unitMaintenance);
      
      // Save prisonerInductions as-is (array)
      saveToLocalStorage(STORAGE_KEYS.prisonerInductions, data.prisonerInductions);
      
      const now = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.lastSync, now);

      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: now,
        error: null,
      }));

      // Dispatch event for components to refresh
      window.dispatchEvent(new CustomEvent('data-synced', { detail: data }));
    } catch (error) {
      console.error('Sync failed, using localStorage:', error);
      
      // Fall back to localStorage
      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        error: 'Offline mode - using local data',
      }));
    } finally {
      isSyncingRef.current = false;
    }
  }, [saveToLocalStorage]);

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

  // Get data from localStorage (for offline use)
  const getLocalData = useCallback(() => {
    return {
      prisoners: loadFromLocalStorage(STORAGE_KEYS.prisoners) || [],
      dailyTasks: loadFromLocalStorage(STORAGE_KEYS.dailyTasks) || [],
      musterConfirmations: loadFromLocalStorage(STORAGE_KEYS.musterConfirm) || [],
      cellAlarms: loadFromLocalStorage(STORAGE_KEYS.cellAlarms) || [],
      handovers: loadFromLocalStorage(STORAGE_KEYS.handover) || [],
      searchTargets: loadFromLocalStorage(STORAGE_KEYS.searchTargets) || [],
      stripSearches: loadFromLocalStorage(STORAGE_KEYS.stripSearch) || [],
      unitMaintenance: loadFromLocalStorage(STORAGE_KEYS.unitMaintenance) || [],
      prisonerInductions: loadFromLocalStorage(STORAGE_KEYS.prisonerInductions) || [],
    };
  }, [loadFromLocalStorage]);

  return {
    ...syncState,
    startAutoSync,
    stopAutoSync,
    refresh,
    getLocalData,
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
      // Save to localStorage as fallback
      const prisoners = JSON.parse(localStorage.getItem(STORAGE_KEYS.prisoners) || '[]');
      const idx = prisoners.findIndex((p: any) => p.id === prisoner.id);
      if (idx >= 0) {
        prisoners[idx] = prisoner;
      } else {
        prisoners.push(prisoner);
      }
      localStorage.setItem(STORAGE_KEYS.prisoners, JSON.stringify(prisoners));
    }
  },

  async pushTaskUpdate(task: any) {
    try {
      await api.updateTask(task.id, task);
    } catch (error) {
      // Save to localStorage as fallback
      const tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.dailyTasks) || '[]');
      const idx = tasks.findIndex((t: any) => t.id === task.id);
      if (idx >= 0) {
        tasks[idx] = task;
      } else {
        tasks.push(task);
      }
      localStorage.setItem(STORAGE_KEYS.dailyTasks, JSON.stringify(tasks));
    }
  },

  async pushMusterUpdate(muster: any) {
    try {
      await api.saveMuster(muster);
    } catch (error) {
      // Save to localStorage as fallback
      const musters = JSON.parse(localStorage.getItem(STORAGE_KEYS.musterConfirm) || '[]');
      const idx = musters.findIndex((m: any) => m.unitId === muster.unitId && m.date === muster.date);
      if (idx >= 0) {
        musters[idx] = muster;
      } else {
        musters.push(muster);
      }
      localStorage.setItem(STORAGE_KEYS.musterConfirm, JSON.stringify(musters));
    }
  },

  async pushAlarmUpdate(alarm: any) {
    try {
      await api.updateAlarm(alarm.id, alarm);
    } catch (error) {
      // Save to localStorage as fallback
      const alarms = JSON.parse(localStorage.getItem(STORAGE_KEYS.cellAlarms) || '[]');
      const idx = alarms.findIndex((a: any) => a.id === alarm.id);
      if (idx >= 0) {
        alarms[idx] = alarm;
      } else {
        alarms.push(alarm);
      }
      localStorage.setItem(STORAGE_KEYS.cellAlarms, JSON.stringify(alarms));
    }
  },

  async pushHandoverUpdate(handover: any) {
    try {
      await api.saveHandover(handover);
    } catch (error) {
      // Save to localStorage as fallback
      const handovers = JSON.parse(localStorage.getItem(STORAGE_KEYS.handover) || '{}');
      if (!handovers[handover.unitId]) handovers[handover.unitId] = {};
      handovers[handover.unitId][handover.date] = handover;
      localStorage.setItem(STORAGE_KEYS.handover, JSON.stringify(handovers));
    }
  },
};
