/**
 * Page Record API Routes
 * Handles manual and scheduled recording of all units
 */

import { Router, Request, Response } from 'express'
import { 
  recordUnitPage, 
  recordAllUnits, 
  recordAllUnitsForPrison,
  getScheduleConfig, 
  setScheduleConfig,
  getAllUnits 
} from '../services/pageRecorder'

const router = Router()

/**
 * POST /api/record/all
 * Record page states for ALL units across ALL prisons
 */
router.post('/all', async (req: Request, res: Response) => {
  try {
    const triggeredBy = req.body.triggeredBy || req.body.userId || 'manual'
    
    const result = await recordAllUnits(triggeredBy)
    
    res.json({
      success: true,
      message: `Recorded ${result.successful} of ${result.totalUnits} units`,
      ...result,
    })
  } catch (error) {
    console.error('Error recording all units:', error)
    res.status(500).json({ error: 'Failed to record all units' })
  }
})

/**
 * POST /api/record/prison/:prisonId
 * Record page states for all units in a specific prison
 */
router.post('/prison/:prisonId', async (req: Request, res: Response) => {
  try {
    const prisonId = req.params.prisonId as string
    const triggeredBy = (req.body.triggeredBy as string) || (req.body.userId as string) || 'manual'
    
    const result = await recordAllUnitsForPrison(prisonId, triggeredBy)
    
    res.json({
      success: true,
      message: `Recorded ${result.results.filter(r => r.success).length} units for ${prisonId}`,
      ...result,
    })
  } catch (error) {
    console.error('Error recording prison units:', error)
    res.status(500).json({ error: 'Failed to record prison units' })
  }
})

/**
 * GET /api/record/schedule
 * Get current schedule configuration
 */
router.get('/schedule', async (_req: Request, res: Response) => {
  try {
    const config = getScheduleConfig()
    res.json(config)
  } catch (error) {
    console.error('Error getting schedule config:', error)
    res.status(500).json({ error: 'Failed to get schedule config' })
  }
})

/**
 * POST /api/record/schedule
 * Set schedule configuration
 */
router.post('/schedule', async (req: Request, res: Response) => {
  try {
    const { enabled, time, triggeredBy } = req.body
    
    if (!time) {
      return res.status(400).json({ error: 'Time is required' })
    }
    
    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(time)) {
      return res.status(400).json({ error: 'Invalid time format. Use HH:MM (e.g., 00:00 or 14:30)' })
    }
    
    setScheduleConfig({
      enabled: Boolean(enabled),
      time,
      triggeredBy: triggeredBy || 'scheduler',
    })
    
    const config = getScheduleConfig()
    res.json({
      success: true,
      message: `Schedule ${enabled ? 'enabled' : 'disabled'}. Will trigger at ${time}`,
      ...config,
    })
  } catch (error) {
    console.error('Error setting schedule config:', error)
    res.status(500).json({ error: 'Failed to set schedule config' })
  }
})

/**
 * POST /api/record/:unitId
 * Record page state for a single unit
 */
router.post('/:unitId', async (req: Request, res: Response) => {
  try {
    const unitId = req.params.unitId as string
    const triggeredBy = (req.body.triggeredBy as string) || (req.body.userId as string) || 'manual'
    const pageName = (req.body.pageName as string) || 'UnitHub'
    
    const result = await recordUnitPage(unitId, triggeredBy, pageName)
    
    if (result.success) {
      res.json({
        success: true,
        message: `Recorded page state for unit ${unitId}`,
        ...result,
      })
    } else {
      res.status(500).json({
        success: false,
        message: `Failed to record page state for unit ${unitId}`,
        ...result,
      })
    }
  } catch (error) {
    console.error('Error recording unit:', error)
    res.status(500).json({ error: 'Failed to record unit' })
  }
})

/**
 * GET /api/record/units
 * Get list of all units across all prisons
 */
router.get('/units', async (_req: Request, res: Response) => {
  try {
    const units = getAllUnits()
    res.json({
      total: units.length,
      units,
    })
  } catch (error) {
    console.error('Error getting units:', error)
    res.status(500).json({ error: 'Failed to get units' })
  }
})

export default router
