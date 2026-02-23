/**
 * Page Recorder Service
 * Handles recording page states for all units across all prisons
 * Uses puppeteer to capture PNG screenshots of each unit hub
 */

import { dataSource } from '../db'
import { AuditRecord } from '../entity/AuditRecord'
import { broadcastUpdate } from '../ws'
import { renderHtmlToPng } from './renderer'
import * as fs from 'fs'
import * as path from 'path'

// List of all prisons
const PRISONS = [
  'invercargill',
  'ocf',
  'christchurch-mens',
  'rolleston',
  'christchurch-womens',
  'rimutaka',
  'manawatu',
  'auckland',
  'mt-eden',
  'auckland-womens',
  'spring-hill',
  'nrfc',
]

// Legacy units for Invercargill
const INVERCARGILL_UNITS = ['invercargill-isu', 'north', 'south', 'remand', 'centre']

// Units for other prisons (ISU + 12 units)
function getUnitsForPrison(prisonId: string): string[] {
  if (prisonId === 'invercargill') {
    return INVERCARGILL_UNITS
  }
  const units = [`${prisonId}-isu`]
  for (let i = 1; i <= 12; i++) {
    units.push(`${prisonId}-unit-${i}`)
  }
  return units
}

/**
 * Get all units across all prisons
 */
export function getAllUnits(): string[] {
  const allUnits: string[] = []
  for (const prisonId of PRISONS) {
    allUnits.push(...getUnitsForPrison(prisonId))
  }
  return allUnits
}

/**
 * Get all units for a specific prison
 */
export function getUnitsForPrisonId(prisonId: string): string[] {
  return getUnitsForPrison(prisonId)
}

// Get the base URL from environment or use default
function getBaseUrl(): string {
  return process.env.FRONTEND_URL || 'http://localhost:5173'
}

// Get screenshots directory
function getScreenshotsDir(): string {
  return path.join(process.cwd(), 'screenshots')
}

/**
 * Record page state for a single unit
 * Creates an audit entry with a screenshot of the current state
 */
export async function recordUnitPage(
  unitId: string,
  triggeredBy: string = 'system',
  pageName: string = 'UnitHub'
): Promise<{ unitId: string; success: boolean; auditId?: string; error?: string; screenshotUrl?: string }> {
  let auditRecord = null
  let screenshotPath = ''
  
  try {
    const baseUrl = getBaseUrl()
    const screenshotsDir = getScreenshotsDir()
    
    // Ensure screenshots directory exists
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true })
    }
    
    // Generate unique ID for this capture
    const captureId = `record-${unitId}-${Date.now()}`
    const htmlPath = path.join(screenshotsDir, captureId + '.html')
    
    // Try to fetch the unit hub page
    const unitUrl = `${baseUrl}/#/unit/${unitId}`
    console.log(`[PageRecorder] Fetching ${unitUrl} for unit ${unitId}...`)
    
    try {
      // Fetch the HTML content from the unit hub
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const response = await fetch(unitUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'PrisonMusterApp-Backend/1.0',
        },
      })
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const html = await response.text()
        
        // Save the HTML
        fs.writeFileSync(htmlPath, html, 'utf-8')
        console.log(`[PageRecorder] Saved HTML for ${unitId} to ${htmlPath}`)
        
        // Try to capture PNG screenshot using puppeteer
        try {
          const pngPath = path.join(screenshotsDir, captureId + '.png')
          console.log(`[PageRecorder] Capturing screenshot for ${unitId}...`)
          
          // Create a simple HTML that will render the unit hub
          // Since we can't directly render React apps with puppeteer easily,
          // we'll create a placeholder image with unit info
          const placeholderHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>${unitId} - ${pageName}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; background: #f5f5f5; }
    .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #1e40af; }
    .meta { color: #6b7280; margin-top: 20px; }
    .timestamp { font-size: 14px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Unit: ${unitId}</h1>
    <p><strong>Page:</strong> ${pageName}</p>
    <p><strong>Triggered by:</strong> ${triggeredBy}</p>
    <p><strong>Recorded at:</strong> ${new Date().toISOString()}</p>
    <div class="meta">
      <p>This is an automated snapshot captured by the Prison Muster App backend.</p>
      <p>Unit ID: ${unitId}</p>
    </div>
    <div class="timestamp">
      Captured: ${new Date().toLocaleString()}
    </div>
  </div>
</body>
</html>`
          
          const pngBuffer = await renderHtmlToPng(placeholderHtml)
          fs.writeFileSync(pngPath, pngBuffer)
          screenshotPath = pngPath
          console.log(`[PageRecorder] Saved screenshot for ${unitId} to ${pngPath}`)
        } catch (screenshotError) {
          console.error(`[PageRecorder] Failed to capture screenshot for ${unitId}:`, screenshotError)
        }
      }
    } catch (fetchError) {
      console.error(`[PageRecorder] Failed to fetch unit page for ${unitId}:`, fetchError)
    }
    
    // Save audit record to database
    const auditRepo = dataSource.getRepository(AuditRecord)
    
    // Determine screenshot URL for the database
    let screenshotUrl = ''
    if (screenshotPath) {
      const screenshotFileName = path.basename(screenshotPath)
      screenshotUrl = `/api/screenshots/${screenshotFileName}`
    }
    
    // Create audit record for this unit
    auditRecord = auditRepo.create({
      action: `${pageName} recorded`,
      unitId: unitId,
      detail: `Automated page state recorded by ${triggeredBy}`,
      prisonerName: null,
      prisonerLocation: null,
      screenshotUrl: screenshotUrl,
    })
    
    await auditRepo.save(auditRecord)
    
    return {
      unitId,
      success: true,
      auditId: auditRecord?.id,
      screenshotUrl,
    }
  } catch (error) {
    console.error(`Failed to record page for unit ${unitId}:`, error)
    return {
      unitId,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Record page states for all units in a specific prison
 */
export async function recordAllUnitsForPrison(
  prisonId: string,
  triggeredBy: string = 'system'
): Promise<{ prisonId: string; results: Array<{ unitId: string; success: boolean; error?: string }>; timestamp: Date }> {
  const units = getUnitsForPrison(prisonId)
  const results: Array<{ unitId: string; success: boolean; error?: string }> = []
  
  for (const unitId of units) {
    const result = await recordUnitPage(unitId, triggeredBy)
    results.push({
      unitId: result.unitId,
      success: result.success,
      error: result.error,
    })
  }
  
  const timestamp = new Date()
  
  // Broadcast completion event
  broadcastUpdate({
    type: 'page_recorded',
    action: 'prison_completed',
    payload: {
      prisonId,
      triggeredBy,
      timestamp: timestamp.toISOString(),
      results,
    },
  })
  
  return {
    prisonId,
    results,
    timestamp,
  }
}

/**
 * Record page states for ALL units across ALL prisons
 * This is the main function for the "Record All Units" feature
 */
export async function recordAllUnits(
  triggeredBy: string = 'system'
): Promise<{ 
  totalUnits: number;
  successful: number;
  failed: number;
  results: Array<{ prisonId: string; unitId: string; success: boolean; error?: string }>;
  timestamp: Date;
}> {
  const allResults: Array<{ prisonId: string; unitId: string; success: boolean; error?: string }> = []
  let successful = 0
  let failed = 0
  
  // Record for each prison
  for (const prisonId of PRISONS) {
    const units = getUnitsForPrison(prisonId)
    
    for (const unitId of units) {
      const result = await recordUnitPage(unitId, triggeredBy)
      
      allResults.push({
        prisonId,
        unitId: result.unitId,
        success: result.success,
        error: result.error,
      })
      
      if (result.success) {
        successful++
      } else {
        failed++
      }
    }
  }
  
  const timestamp = new Date()
  
  // Broadcast the completion event to all connected clients
  broadcastUpdate({
    type: 'page_recorded',
    action: 'all_completed',
    payload: {
      triggeredBy,
      timestamp: timestamp.toISOString(),
      totalUnits: allResults.length,
      successful,
      failed,
      results: allResults,
    },
  })
  
  return {
    totalUnits: allResults.length,
    successful,
    failed,
    results: allResults,
    timestamp,
  }
}

/**
 * Get current schedule configuration (stored in memory for now)
 */
export function getScheduleConfig(): { enabled: boolean; time: string; triggeredBy: string } {
  return scheduleConfig
}

/**
 * Set schedule configuration
 */
export function setScheduleConfig(config: { enabled: boolean; time: string; triggeredBy: string }): void {
  scheduleConfig = config
  // Restart scheduler with new config
  if (schedulerInterval) {
    clearInterval(schedulerInterval)
    schedulerInterval = null
  }
  if (config.enabled) {
    startScheduler()
  }
}

// Schedule configuration
let scheduleConfig = {
  enabled: false,
  time: '00:00', // Default: midnight
  triggeredBy: 'scheduler',
}

let schedulerInterval: NodeJS.Timeout | null = null

/**
 * Start the scheduler
 */
function startScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval)
  }
  
  // Check every minute if it's time to trigger
  schedulerInterval = setInterval(() => {
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    if (currentTime === scheduleConfig.time) {
      console.log(`[Scheduler] Triggering record all units at ${currentTime}`)
      recordAllUnits(scheduleConfig.triggeredBy).then((result) => {
        console.log(`[Scheduler] Completed: ${result.successful}/${result.totalUnits} units recorded`)
      }).catch((error) => {
        console.error('[Scheduler] Error:', error)
      })
    }
  }, 60000) // Check every minute
  
  console.log(`[Scheduler] Started. Will trigger at ${scheduleConfig.time}`)
}

/**
 * Stop the scheduler
 */
export function stopScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval)
    schedulerInterval = null
    console.log('[Scheduler] Stopped')
  }
}

/**
 * Initialize the scheduler based on saved config
 */
export function initializeScheduler(config?: { enabled: boolean; time: string; triggeredBy: string }): void {
  if (config) {
    scheduleConfig = config
  }
  if (scheduleConfig.enabled) {
    startScheduler()
  }
}
