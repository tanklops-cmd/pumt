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
  if (!response.ok) {
    const error = new Error(`Failed to update task (${response.status})`);
    (error as any).status = response.status;
    throw error;
  }
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

// ==================== PRISON BRIEFING ====================

export interface PrisonBriefing {
  prisonId: string;
  title: string;
  content: string;
  postedBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function fetchPrisonBriefing(prisonId: string): Promise<PrisonBriefing> {
  const response = await fetch(`${API_BASE}/api/data/briefing/${prisonId}`);
  if (!response.ok) throw new Error('Failed to fetch prison briefing');
  return response.json();
}

export async function savePrisonBriefing(briefing: PrisonBriefing): Promise<PrisonBriefing> {
  const response = await fetch(`${API_BASE}/api/data/briefing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(briefing),
  });
  if (!response.ok) throw new Error('Failed to save prison briefing');
  return response.json();
}

// ==================== NOTIFICATIONS ====================

export async function fetchNotifications(): Promise<any[]> {
  const response = await fetch(`${API_BASE}/api/data/notifications`);
  if (!response.ok) throw new Error('Failed to fetch notifications');
  return response.json();
}

export async function saveNotification(notification: any): Promise<any> {
  const response = await fetch(`${API_BASE}/api/data/notifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notification),
  });
  if (!response.ok) throw new Error('Failed to save notification');
  return response.json();
}

export async function dismissNotification(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/data/notifications/${id}/dismiss`, {
    method: 'PUT',
  });
  if (!response.ok) throw new Error('Failed to dismiss notification');
}

export async function clearNotifications(): Promise<void> {
  const response = await fetch(`${API_BASE}/api/data/notifications`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to clear notifications');
}

// ==================== SACRA REMINDERS ====================

export async function fetchSacraReminders(unitId?: string): Promise<any[]> {
  const params = new URLSearchParams();
  if (unitId) params.append('unitId', unitId);
  const response = await fetch(`${API_BASE}/api/data/sacra-reminders?${params}`);
  if (!response.ok) throw new Error('Failed to fetch sacra reminders');
  return response.json();
}

export async function saveSacraReminder(reminder: any): Promise<any> {
  const response = await fetch(`${API_BASE}/api/data/sacra-reminders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reminder),
  });
  if (!response.ok) throw new Error('Failed to save sacra reminder');
  return response.json();
}

export async function dismissSacraReminder(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/data/sacra-reminders/${id}/dismiss`, {
    method: 'PUT',
  });
  if (!response.ok) throw new Error('Failed to dismiss sacra reminder');
}

export async function dismissAllSacraReminders(unitId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/data/sacra-reminders/dismiss-all`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ unitId }),
  });
  if (!response.ok) throw new Error('Failed to dismiss all sacra reminders');
}

// ==================== CONTROL HANDOVER ====================

export async function fetchControlHandover(date: string): Promise<any> {
  const response = await fetch(`${API_BASE}/api/data/control-handover?date=${date}`);
  if (!response.ok) throw new Error('Failed to fetch control handover');
  return response.json();
}

export async function saveControlHandover(handover: any): Promise<any> {
  const response = await fetch(`${API_BASE}/api/data/control-handover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(handover),
  });
  if (!response.ok) throw new Error('Failed to save control handover');
  return response.json();
}

// ==================== ISU OBSERVATIONS ====================

export async function fetchIsuObservations(unitId?: string, prisonerId?: string): Promise<any[]> {
  const params = new URLSearchParams();
  if (unitId) params.append('unitId', unitId);
  if (prisonerId) params.append('prisonerId', prisonerId);
  const response = await fetch(`${API_BASE}/api/data/isu-observations?${params}`);
  if (!response.ok) throw new Error('Failed to fetch ISU observations');
  return response.json();
}

export async function saveIsuObservation(observation: any): Promise<any> {
  const response = await fetch(`${API_BASE}/api/data/isu-observations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(observation),
  });
  if (!response.ok) throw new Error('Failed to save ISU observation');
  return response.json();
}

export async function deleteIsuObservation(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/data/isu-observations/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete ISU observation');
}

// ==================== PDF BRIEFINGS ====================

export interface BriefingPDF {
  id: string;
  title: string;
  date: string;
  unit: string;
  uploadedBy: string;
  filePath: string;
  originalFileName: string;
  createdAt: string;
}

/**
 * Fetch all PDF briefings
 */
export async function fetchBriefings(): Promise<BriefingPDF[]> {
  const response = await fetch(`${API_BASE}/api/briefings`);
  if (!response.ok) throw new Error('Failed to fetch briefings');
  return response.json();
}

/**
 * Fetch a single briefing by ID
 */
export async function fetchBriefing(id: string): Promise<BriefingPDF> {
  const response = await fetch(`${API_BASE}/api/briefings/${id}`);
  if (!response.ok) throw new Error('Failed to fetch briefing');
  return response.json();
}

/**
 * Upload a new PDF briefing
 */
export async function uploadBriefing(
  file: File,
  title: string,
  date: string,
  unit: string,
  uploadedBy: string
): Promise<BriefingPDF> {
  const formData = new FormData();
  formData.append('pdf', file);
  formData.append('title', title);
  formData.append('date', date);
  formData.append('unit', unit);
  formData.append('uploadedBy', uploadedBy);

  const response = await fetch(`${API_BASE}/api/briefings/upload`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || 'Failed to upload briefing');
  }
  return response.json();
}

/**
 * Delete a briefing
 */
// ==================== PRISONER REQUESTS ====================

export interface PrisonerRequest {
  id: string
  prisonerId: string
  prisonerName: string
  prisonerCell: string
  type: 'social_visit' | 'avl_visit' | 'property_request'
  status: 'pending' | 'scheduled' | 'completed' | 'declined' | 'pco_required' | 'pco_approved' | 'pco_declined'
  unitId: string
  metadata: {
    contactName?: string
    relationship?: string
    preferredDate?: string
    preferredTime?: string
    reason?: string
    notes?: string
    propertyItems?: string[]
    propertyCategory?: string
    urgency?: string
  }
  staffNotes?: string
  pcoNotes?: string
  scheduledTime?: string
  declinedReason?: string
  createdBy?: string
  staffId?: string
  pcoId?: string
  createdAt: string
  updatedAt: string
}

export interface PrisonerRequestAction {
  id: string
  requestId: string
  action: string
  performedBy: string
  staffId?: string
  previousStatus?: string
  newStatus?: string
  changes?: Record<string, any>
  notes?: string
  performedAt: string
}

export async function createPrisonerRequest(request: {
  prisonerId: string
  prisonerName: string
  prisonerCell: string
  type: string
  unitId: string
  metadata: any
  createdBy?: string
}): Promise<PrisonerRequest> {
  const response = await fetch(`${API_BASE}/api/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!response.ok) throw new Error('Failed to create request')
  return response.json()
}

export async function fetchPrisonerRequests(filters?: {
  unitId?: string
  status?: string
  type?: string
  prisonerId?: string
}): Promise<PrisonerRequest[]> {
  const params = new URLSearchParams()
  if (filters?.unitId) params.set('unitId', filters.unitId)
  if (filters?.status) params.set('status', filters.status)
  if (filters?.type) params.set('type', filters.type)
  if (filters?.prisonerId) params.set('prisonerId', filters.prisonerId)
  const response = await fetch(`${API_BASE}/api/requests?${params}`)
  if (!response.ok) throw new Error('Failed to fetch requests')
  return response.json()
}

export async function fetchPendingRequests(unitId?: string): Promise<PrisonerRequest[]> {
  const params = unitId ? `?unitId=${unitId}` : ''
  const response = await fetch(`${API_BASE}/api/requests/pending${params}`)
  if (!response.ok) throw new Error('Failed to fetch pending requests')
  return response.json()
}

export async function fetchPcoQueue(unitId?: string): Promise<PrisonerRequest[]> {
  const params = unitId ? `?unitId=${unitId}` : ''
  const response = await fetch(`${API_BASE}/api/requests/pco-queue${params}`)
  if (!response.ok) throw new Error('Failed to fetch PCO queue')
  return response.json()
}

export async function fetchRequestDetails(id: string): Promise<{ request: PrisonerRequest; actions: PrisonerRequestAction[] }> {
  const response = await fetch(`${API_BASE}/api/requests/${id}`)
  if (!response.ok) throw new Error('Failed to fetch request')
  return response.json()
}

export async function approveRequest(id: string, data: {
  scheduledTime?: string
  staffId: string
  staffNotes?: string
}): Promise<PrisonerRequest> {
  const response = await fetch(`${API_BASE}/api/requests/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to approve request')
  return response.json()
}

export async function declineRequest(id: string, data: {
  declinedReason: string
  staffId: string
  staffNotes?: string
}): Promise<PrisonerRequest> {
  const response = await fetch(`${API_BASE}/api/requests/${id}/decline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to decline request')
  return response.json()
}

export async function forwardToPco(id: string, data: {
  staffId: string
  staffNotes?: string
}): Promise<PrisonerRequest> {
  const response = await fetch(`${API_BASE}/api/requests/${id}/forward-to-pco`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to forward request')
  return response.json()
}

export async function pcoApproveRequest(id: string, data: {
  pcoId: string
  pcoNotes?: string
}): Promise<PrisonerRequest> {
  const response = await fetch(`${API_BASE}/api/requests/${id}/pco-approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to approve request')
  return response.json()
}

export async function pcoDeclineRequest(id: string, data: {
  pcoId: string
  pcoNotes?: string
  declinedReason: string
}): Promise<PrisonerRequest> {
  const response = await fetch(`${API_BASE}/api/requests/${id}/pco-decline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to decline request')
  return response.json()
}

export async function completeRequest(id: string, staffId: string): Promise<PrisonerRequest> {
  const response = await fetch(`${API_BASE}/api/requests/${id}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ staffId }),
  })
  if (!response.ok) throw new Error('Failed to complete request')
  return response.json()
}

// ============ Page Record API ============

export interface RecordAllUnitsResponse {
  success: boolean
  message: string
  totalUnits: number
  successful: number
  failed: number
  timestamp: string
  triggeredBy?: string
}

export interface ScheduleConfig {
  enabled: boolean
  time: string
  triggeredBy: string
}

export async function recordAllUnits(triggeredBy?: string): Promise<RecordAllUnitsResponse> {
  const response = await fetch(`${API_BASE}/api/record/all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ triggeredBy: triggeredBy || 'manual' }),
  })
  if (!response.ok) throw new Error('Failed to record all units')
  return response.json()
}

export async function recordUnit(unitId: string, triggeredBy?: string): Promise<{ success: boolean; unitId: string }> {
  const response = await fetch(`${API_BASE}/api/record/${encodeURIComponent(unitId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ triggeredBy: triggeredBy || 'manual' }),
  })
  if (!response.ok) throw new Error('Failed to record unit')
  return response.json()
}

export async function recordPrisonUnits(prisonId: string, triggeredBy?: string): Promise<RecordAllUnitsResponse> {
  const response = await fetch(`${API_BASE}/api/record/prison/${encodeURIComponent(prisonId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ triggeredBy: triggeredBy || 'manual' }),
  })
  if (!response.ok) throw new Error('Failed to record prison units')
  return response.json()
}

export async function getScheduleConfig(): Promise<ScheduleConfig> {
  const response = await fetch(`${API_BASE}/api/record/schedule`)
  if (!response.ok) throw new Error('Failed to get schedule config')
  return response.json()
}

export async function setScheduleConfig(config: { enabled: boolean; time: string; triggeredBy?: string }): Promise<ScheduleConfig> {
  const response = await fetch(`${API_BASE}/api/record/schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })
  if (!response.ok) throw new Error('Failed to set schedule config')
  return response.json()
}

export async function getAllUnits(): Promise<{ total: number; units: string[] }> {
  const response = await fetch(`${API_BASE}/api/record/units`)
  if (!response.ok) throw new Error('Failed to get units')
  return response.json()
}

export async function deleteBriefing(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/briefings/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete briefing');
}
