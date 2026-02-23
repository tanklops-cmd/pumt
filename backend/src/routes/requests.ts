import { Router, Request, Response } from 'express'
import { dataSource } from '../db'
import { PrisonerRequest, PrisonerRequestAction, RequestType, RequestStatus, RequestAction } from '../entity/PrisonerRequest'

const router = Router()
const requestRepo = () => dataSource.getRepository(PrisonerRequest)
const actionRepo = () => dataSource.getRepository(PrisonerRequestAction)

// Create a new request
router.post('/', async (req: Request, res: Response) => {
  try {
    const { 
      prisonerId, 
      prisonerName, 
      prisonerCell, 
      type, 
      unitId, 
      metadata,
      createdBy 
    } = req.body

    const request = requestRepo().create({
      prisonerId,
      prisonerName,
      prisonerCell,
      type: type as RequestType,
      unitId,
      status: RequestStatus.PENDING,
      metadata: metadata || {},
      createdBy: createdBy || 'prisoner',
    })

    const saved = await requestRepo().save(request)

    // Log the action
    await logAction(saved.id, RequestAction.CREATED, 'prisoner', null, RequestStatus.PENDING, { type, prisonerId })

    // Broadcast via WebSocket
    broadcastRequestUpdate('created', saved)

    res.json(saved)
  } catch (error) {
    console.error('Error creating request:', error)
    res.status(500).json({ error: 'Failed to create request' })
  }
})

// Get all requests (with optional filters)
router.get('/', async (req: Request, res: Response) => {
  try {
    const unitId = req.query.unitId as string | undefined
    const status = req.query.status as string | undefined
    const type = req.query.type as string | undefined
    const prisonerId = req.query.prisonerId as string | undefined
    
    let query = requestRepo().createQueryBuilder('request')
      .orderBy('request.createdAt', 'DESC')

    if (unitId) {
      query = query.andWhere('request.unitId = :unitId', { unitId })
    }
    if (status) {
      query = query.andWhere('request.status = :status', { status })
    }
    if (type) {
      query = query.andWhere('request.type = :type', { type })
    }
    if (prisonerId) {
      query = query.andWhere('request.prisonerId = :prisonerId', { prisonerId })
    }

    const requests = await query.getMany()
    res.json(requests)
  } catch (error) {
    console.error('Error fetching requests:', error)
    res.status(500).json({ error: 'Failed to fetch requests' })
  }
})

// Get pending requests for staff (visits and AVL)
router.get('/pending', async (req: Request, res: Response) => {
  try {
    const unitId = req.query.unitId as string | undefined
    
    const requests = await requestRepo()
      .createQueryBuilder('request')
      .where('request.status IN (:...statuses)', { 
        statuses: [RequestStatus.PENDING, RequestStatus.SCHEDULED] 
      })
      .andWhere('request.type IN (:...types)', { 
        types: [RequestType.SOCIAL_VISIT, RequestType.AVL_VISIT] 
      })
      .andWhere(unitId ? 'request.unitId = :unitId' : '1=1', { unitId })
      .orderBy('request.createdAt', 'DESC')
      .getMany()

    res.json(requests)
  } catch (error) {
    console.error('Error fetching pending requests:', error)
    res.status(500).json({ error: 'Failed to fetch pending requests' })
  }
})

// Get property requests requiring PCO approval
router.get('/pco-queue', async (req: Request, res: Response) => {
  try {
    const unitId = req.query.unitId as string | undefined
    
    const requests = await requestRepo()
      .createQueryBuilder('request')
      .where('request.status = :status', { status: RequestStatus.PCO_REQUIRED })
      .andWhere('request.type = :type', { type: RequestType.PROPERTY_REQUEST })
      .andWhere(unitId ? 'request.unitId = :unitId' : '1=1', { unitId })
      .orderBy('request.createdAt', 'DESC')
      .getMany()

    res.json(requests)
  } catch (error) {
    console.error('Error fetching PCO queue:', error)
    res.status(500).json({ error: 'Failed to fetch PCO queue' })
  }
})

// Get a single request by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const request = await requestRepo().findOne({ where: { id } })
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }

    // Get action history
    const actions = await actionRepo()
      .createQueryBuilder('action')
      .where('action.requestId = :id', { id })
      .orderBy('action.performedAt', 'ASC')
      .getMany()

    res.json({ request, actions })
  } catch (error) {
    console.error('Error fetching request:', error)
    res.status(500).json({ error: 'Failed to fetch request' })
  }
})

// Staff: Approve/Schedule a visit request
router.post('/:id/approve', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const { scheduledTime, staffId, staffNotes } = req.body
    const staffIdStr = staffId as string

    const request = await requestRepo().findOne({ where: { id } })
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }

    const previousStatus = request.status
    request.status = RequestStatus.SCHEDULED
    request.scheduledTime = scheduledTime ? new Date(scheduledTime) : null
    request.staffNotes = staffNotes
    request.staffId = staffIdStr

    const saved = await requestRepo().save(request)

    // Log action
    await logAction(id, RequestAction.SCHEDULED, staffIdStr, previousStatus, RequestStatus.SCHEDULED, { scheduledTime, staffNotes })

    // Broadcast
    broadcastRequestUpdate('updated', saved)

    res.json(saved)
  } catch (error) {
    console.error('Error approving request:', error)
    res.status(500).json({ error: 'Failed to approve request' })
  }
})

// Staff: Decline a request
router.post('/:id/decline', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const { declinedReason, staffId, staffNotes } = req.body
    const staffIdStr = staffId as string

    const request = await requestRepo().findOne({ where: { id } })
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }

    const previousStatus = request.status
    request.status = RequestStatus.DECLINED
    request.declinedReason = declinedReason
    request.staffNotes = staffNotes
    request.staffId = staffIdStr

    const saved = await requestRepo().save(request)

    // Log action
    await logAction(id, RequestAction.DECLINED, staffIdStr, previousStatus, RequestStatus.DECLINED, { declinedReason, staffNotes })

    // Broadcast
    broadcastRequestUpdate('updated', saved)

    res.json(saved)
  } catch (error) {
    console.error('Error declining request:', error)
    res.status(500).json({ error: 'Failed to decline request' })
  }
})

// Staff: Forward property request to PCO
router.post('/:id/forward-to-pco', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const { staffId, staffNotes } = req.body
    const staffIdStr = staffId as string

    const request = await requestRepo().findOne({ where: { id } })
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }

    const previousStatus = request.status
    request.status = RequestStatus.PCO_REQUIRED
    request.staffNotes = staffNotes
    request.staffId = staffIdStr

    const saved = await requestRepo().save(request)

    // Log action
    await logAction(id, RequestAction.FORWARDED_TO_PCO, staffIdStr, previousStatus, RequestStatus.PCO_REQUIRED, { staffNotes })

    // Broadcast
    broadcastRequestUpdate('updated', saved)

    res.json(saved)
  } catch (error) {
    console.error('Error forwarding to PCO:', error)
    res.status(500).json({ error: 'Failed to forward request' })
  }
})

// PCO: Approve property request
router.post('/:id/pco-approve', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const { pcoId, pcoNotes } = req.body
    const pcoIdStr = pcoId as string

    const request = await requestRepo().findOne({ where: { id } })
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }

    const previousStatus = request.status
    request.status = RequestStatus.PCO_APPROVED
    request.pcoNotes = pcoNotes
    request.pcoId = pcoIdStr

    const saved = await requestRepo().save(request)

    // Log action
    await logAction(id, RequestAction.PCO_APPROVED, pcoIdStr, previousStatus, RequestStatus.PCO_APPROVED, { pcoNotes })

    // TODO: Send email notification to contact
    // await sendPropertyApprovalEmail(request)

    // Broadcast
    broadcastRequestUpdate('updated', saved)

    res.json(saved)
  } catch (error) {
    console.error('Error PCO approving request:', error)
    res.status(500).json({ error: 'Failed to approve request' })
  }
})

// PCO: Decline property request
router.post('/:id/pco-decline', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const { pcoId, pcoNotes, declinedReason } = req.body
    const pcoIdStr = pcoId as string

    const request = await requestRepo().findOne({ where: { id } })
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }

    const previousStatus = request.status
    request.status = RequestStatus.PCO_DECLINED
    request.pcoNotes = pcoNotes
    request.declinedReason = declinedReason
    request.pcoId = pcoIdStr

    const saved = await requestRepo().save(request)

    // Log action
    await logAction(id, RequestAction.PCO_DECLINED, pcoIdStr, previousStatus, RequestStatus.PCO_DECLINED, { pcoNotes, declinedReason })

    // Broadcast
    broadcastRequestUpdate('updated', saved)

    res.json(saved)
  } catch (error) {
    console.error('Error PCO declining request:', error)
    res.status(500).json({ error: 'Failed to decline request' })
  }
})

// Mark request as completed
router.post('/:id/complete', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const { staffId } = req.body
    const staffIdStr = staffId as string

    const request = await requestRepo().findOne({ where: { id } })
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }

    const previousStatus = request.status
    request.status = RequestStatus.COMPLETED

    const saved = await requestRepo().save(request)

    // Log action
    await logAction(id, RequestAction.COMPLETED, staffIdStr, previousStatus, RequestStatus.COMPLETED, {})

    // Broadcast
    broadcastRequestUpdate('updated', saved)

    res.json(saved)
  } catch (error) {
    console.error('Error completing request:', error)
    res.status(500).json({ error: 'Failed to complete request' })
  }
})

// Helper function to log actions
async function logAction(
  requestId: string, 
  action: RequestAction, 
  performedBy: string, 
  previousStatus: string | null, 
  newStatus: string | null,
  changes: Record<string, any>
) {
  const actionRecord = actionRepo().create({
    requestId,
    action,
    performedBy,
    previousStatus,
    newStatus,
    changes,
  })
  await actionRepo().save(actionRecord)
}

// Helper to broadcast WebSocket updates
function broadcastRequestUpdate(type: string, request: PrisonerRequest) {
  try {
    const { broadcast } = require('../ws')
    broadcast({ type: 'prisoner_request', action: type, payload: request })
  } catch (e) {
    // WebSocket not available
  }
}

export default router
