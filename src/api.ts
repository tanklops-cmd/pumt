// Backend API for Prison Muster App

const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Login to the backend
 */
export async function login(username: string, password: string): Promise<{ token: string; user: { id: string; username: string; role: string } }> {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) throw new Error('Login failed');
  return response.json();
}

/**
 * Capture current page state to audit trail
 */
export async function capturePageState(options: { pageName: string; unitId?: string }): Promise<{ id: string }> {
  const htmlSnapshot = document.documentElement.outerHTML;
  
  const payload = {
    pageName: options.pageName,
    unitId: options.unitId,
    htmlSnapshot,
    cssSnapshot: '',
    jsonState: {
      url: window.location.href,
      timestamp: new Date().toISOString(),
    },
  };

  const response = await fetch(`${API_BASE}/api/audit/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Capture failed');
  return response.json();
}

/**
 * Get all audit records (requires admin token)
 */
export async function getAuditRecords(token: string): Promise<Array<{
  id: string;
  userId: string;
  unitId: string;
  pageName: string;
  timestamp: string;
  htmlSnapshot: string;
}>> {
  const response = await fetch(`${API_BASE}/api/audit`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch audit records');
  return response.json();
}

/**
 * Get audit records for a specific user
 */
export async function getUserAuditRecords(token: string, userId: string): Promise<Array<{
  id: string;
  pageName: string;
  timestamp: string;
}>> {
  const response = await fetch(`${API_BASE}/api/audit/user/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch user audit records');
  return response.json();
}

/**
 * Get audit records for a specific unit
 */
export async function getUnitAuditRecords(token: string, unitId: string): Promise<Array<{
  id: string;
  pageName: string;
  timestamp: string;
}>> {
  const response = await fetch(`${API_BASE}/api/audit/unit/${unitId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch unit audit records');
  return response.json();
}

// ==================== DATA SYNC API ====================

export interface SyncData {
  prisoners: any[];
  dailyTasks: any[];
  musterConfirmations: any[];
  cellAlarms: any[];
  handovers: any[];
  searchTargets: any[];
  stripSearches: any[];
  unitMaintenance: any[];
  prisonerInductions: any[];
  timestamp: string;
}

/**
 * Get all data from the backend for sync
 */
export async function fetchAllData(): Promise<SyncData> {
  const response = await fetch(`${API_BASE}/api/data/sync`);
  if (!response.ok) throw new Error('Failed to fetch data');
  return response.json();
}

// ==================== PRISONERS ====================

export async function fetchPrisoners(): Promise<any[]> {
  const response = await fetch(`${API_BASE}/api/data/prisoners`);
  if (!response.ok) throw new Error('Failed to fetch prisoners');
  return response.json();
}

export async function fetchPrisonersByUnit(unitId: string): Promise<any[]> {
  const response = await fetch(`${API_BASE}/api/data/prisoners/${unitId}`);
  if (!response.ok) throw new Error('Failed to fetch prisoners');
  return response.json();
}

export async function savePrisoner(prisoner: any): Promise<any> {
  const response = await fetch(`${API_BASE}/api/data/prisoners`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prisoner),
  });
  if (!response.ok) throw new Error('Failed to save prisoner');
  return response.json();
}

export async function updatePrisoner(id: string, prisoner: any): Promise<any> {
  const response = await fetch(`${API_BASE}/api/data/prisoners/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prisoner),
  });
  if (!response.ok) throw new Error('Failed to update prisoner');
  return response.json();
}

export async function deletePrisoner(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/data/prisoners/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete prisoner');
}

// ==================== DAILY TASKS ====================

export async function fetchTasks(unitId?: string, date?: string): Promise<any[]> {
  const params = new URLSearchParams();
  if (unitId) params.append('unitId', unitId);
  if (date) params.append('date', date);
  const response = await fetch(`${API_BASE}/api/data/tasks?${params}`);
  if (!response.ok) throw new Error('Failed to fetch tasks');
  return response.json();
}

export async function saveTask(task: any): Promise<any> {
  const response = await fetch(`${API_BASE}/api/data/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  if (!response.ok) throw new Error('Failed to save task');
  return response.json();
}

export async function updateTask(id: string, task: any): Promise<any> {
  const response = await fetch(`${API_BASE}/api/data/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  if (!response.ok) throw new Error('Failed to update task');
  return response.json();
}

export async function bulkSaveTasks(tasks: any[]): Promise<void> {
  const response = await fetch(`${API_BASE}/api/data/tasks/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tasks }),
  });
  if (!response.ok) throw new Error('Failed to bulk save tasks');
}

// ==================== MUSTER ====================

export async function fetchMuster(unitId?: string, date?: string): Promise<any[]> {
  const params = new URLSearchParams();
  if (unitId) params.append('unitId', unitId);
  if (date) params.append('date', date);
  const response = await fetch(`${API_BASE}/api/data/muster?${params}`);
  if (!response.ok) throw new Error('Failed to fetch muster');
  return response.json();
}

export async function saveMuster(muster: any): Promise<any> {
  const response = await fetch(`${API_BASE}/api/data/muster`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(muster),
  });
  if (!response.ok) throw new Error('Failed to save muster');
  return response.json();
}

// ==================== CELL ALARMS ====================

export async function fetchAlarms(unitId?: string, weekKey?: string): Promise<any[]> {
  const params = new URLSearchParams();
  if (unitId) params.append('unitId', unitId);
  if (weekKey) params.append('weekKey', weekKey);
  const response = await fetch(`${API_BASE}/api/data/alarms?${params}`);
  if (!response.ok) throw new Error('Failed to fetch alarms');
  return response.json();
}

export async function saveAlarm(alarm: any): Promise<any> {
  const response = await fetch(`${API_BASE}/api/data/alarms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(alarm),
  });
  if (!response.ok) throw new Error('Failed to save alarm');
  return response.json();
}

export async function updateAlarm(id: string, alarm: any): Promise<any> {
  const response = await fetch(`${API_BASE}/api/data/alarms/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(alarm),
  });
  if (!response.ok) throw new Error('Failed to update alarm');
  return response.json();
}

export async function bulkSaveAlarms(alarms: any[]): Promise<void> {
  const response = await fetch(`${API_BASE}/api/data/alarms/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alarms }),
  });
  if (!response.ok) throw new Error('Failed to bulk save alarms');
}

// ==================== HANDOVER ====================

export async function fetchHandover(unitId?: string, date?: string): Promise<any[]> {
  const params = new URLSearchParams();
  if (unitId) params.append('unitId', unitId);
  if (date) params.append('date', date);
  const response = await fetch(`${API_BASE}/api/data/handover?${params}`);
  if (!response.ok) throw new Error('Failed to fetch handover');
  return response.json();
}

export async function saveHandover(handover: any): Promise<any> {
  const response = await fetch(`${API_BASE}/api/data/handover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(handover),
  });
  if (!response.ok) throw new Error('Failed to save handover');
  return response.json();
}

// ==================== SEARCH TARGETS ====================

export async function fetchSearches(unitId?: string, date?: string): Promise<any[]> {
  const params = new URLSearchParams();
  if (unitId) params.append('unitId', unitId);
  if (date) params.append('date', date);
  const response = await fetch(`${API_BASE}/api/data/searches?${params}`);
  if (!response.ok) throw new Error('Failed to fetch searches');
  return response.json();
}

export async function saveSearches(unitId: string, date: string, targets: any[]): Promise<void> {
  const response = await fetch(`${API_BASE}/api/data/searches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ unitId, date, targets }),
  });
  if (!response.ok) throw new Error('Failed to save searches');
}

export async function deleteSearches(unitId: string, date: string): Promise<void> {
  const params = new URLSearchParams();
  params.append('unitId', unitId);
  params.append('date', date);
  const response = await fetch(`${API_BASE}/api/data/searches?${params}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete searches');
}

// ==================== STRIP SEARCH ====================

export async function fetchStripSearch(unitId?: string, date?: string): Promise<any[]> {
  const params = new URLSearchParams();
  if (unitId) params.append('unitId', unitId);
  if (date) params.append('date', date);
  const response = await fetch(`${API_BASE}/api/data/strip-search?${params}`);
  if (!response.ok) throw new Error('Failed to fetch strip search');
  return response.json();
}

export async function saveStripSearch(data: any): Promise<any> {
  const response = await fetch(`${API_BASE}/api/data/strip-search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to save strip search');
  return response.json();
}

// ==================== MAINTENANCE ====================

export async function fetchMaintenance(unitId?: string): Promise<any[]> {
  const params = new URLSearchParams();
  if (unitId) params.append('unitId', unitId);
  const response = await fetch(`${API_BASE}/api/data/maintenance?${params}`);
  if (!response.ok) throw new Error('Failed to fetch maintenance');
  return response.json();
}

export async function saveMaintenance(entry: any): Promise<any> {
  const response = await fetch(`${API_BASE}/api/data/maintenance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  if (!response.ok) throw new Error('Failed to save maintenance');
  return response.json();
}

export async function updateMaintenance(id: string, entry: any): Promise<any> {
  const response = await fetch(`${API_BASE}/api/data/maintenance/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  if (!response.ok) throw new Error('Failed to update maintenance');
  return response.json();
}

export async function deleteMaintenance(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/data/maintenance/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete maintenance');
}

// ==================== INDUCTIONS ====================

export async function fetchInductions(unitId?: string): Promise<any[]> {
  const params = new URLSearchParams();
  if (unitId) params.append('unitId', unitId);
  const response = await fetch(`${API_BASE}/api/data/inductions?${params}`);
  if (!response.ok) throw new Error('Failed to fetch inductions');
  return response.json();
}

export async function saveInduction(induction: any): Promise<any> {
  const response = await fetch(`${API_BASE}/api/data/inductions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(induction),
  });
  if (!response.ok) throw new Error('Failed to save induction');
  return response.json();
}

export async function updateInduction(id: string, induction: any): Promise<any> {
  const response = await fetch(`${API_BASE}/api/data/inductions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(induction),
  });
  if (!response.ok) throw new Error('Failed to update induction');
  return response.json();
}

// Legacy stub functions
export async function sendFullMuster(prisonId: string, payload: any): Promise<{ ok: boolean }> {
  console.warn('sendFullMuster called (stub)', prisonId, payload);
  return { ok: true };
}

// ==================== AUDIT ENTRIES ====================

export async function saveAuditEntry(entry: { action: string; detail?: string; unitId?: string }): Promise<any> {
  const response = await fetch(`${API_BASE}/api/data/audit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  if (!response.ok) throw new Error('Failed to save audit entry');
  return response.json();
}

export async function fetchAuditEntries(): Promise<any[]> {
  const response = await fetch(`${API_BASE}/api/data/audit`);
  if (!response.ok) throw new Error('Failed to fetch audit entries');
  return response.json();
}

// ==================== UNIT CONFIG ====================

export interface UnitConfig {
  unitId: string;
  cells: string[];
  facilities: string[];
}

export async function fetchUnitConfig(unitId: string): Promise<UnitConfig> {
  const response = await fetch(`${API_BASE}/api/data/unit-config/${unitId}`);
  if (!response.ok) throw new Error('Failed to fetch unit config');
  return response.json();
}

export async function saveUnitConfig(config: UnitConfig): Promise<UnitConfig> {
  const response = await fetch(`${API_BASE}/api/data/unit-config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!response.ok) throw new Error('Failed to save unit config');
  return response.json();
}

export async function deleteUnitConfig(unitId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/data/unit-config/${unitId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete unit config');
}
