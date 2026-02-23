import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import GlassLayout from '../components/GlassLayout'
import { 
  fetchPrisonerRequests, 
  fetchPendingRequests, 
  approveRequest, 
  declineRequest, 
  forwardToPco,
  completeRequest,
  fetchRequestDetails,
  PrisonerRequest,
  PrisonerRequestAction
} from '../api'

export default function StaffRequests() {
  const { prisonId, unitId } = useParams<{ prisonId?: string; unitId?: string }>()
  const [requests, setRequests] = useState<PrisonerRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('pending')
  const [selectedRequest, setSelectedRequest] = useState<PrisonerRequest | null>(null)
  const [requestDetails, setRequestDetails] = useState<{ request: PrisonerRequest; actions: PrisonerRequestAction[] } | null>(null)
  
  // Action form state
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState<string>('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [declineReason, setDeclineReason] = useState('')
  const [staffNotes, setStaffNotes] = useState('')
  const [staffId, setStaffId] = useState('staff-user')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadRequests()
  }, [filter, unitId])

  useEffect(() => {
    if (selectedRequest) {
      loadRequestDetails(selectedRequest.id)
    }
  }, [selectedRequest])

  const loadRequests = async () => {
    setLoading(true)
    try {
      let data: PrisonerRequest[]
      if (filter === 'pending') {
        data = await fetchPendingRequests(unitId)
      } else {
        data = await fetchPrisonerRequests({ 
          unitId, 
          status: filter === 'all' ? undefined : filter 
        })
      }
      setRequests(data)
    } catch (error) {
      console.error('Failed to load requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRequestDetails = async (id: string) => {
    try {
      const data = await fetchRequestDetails(id)
      setRequestDetails(data)
    } catch (error) {
      console.error('Failed to load request details:', error)
    }
  }

  const handleAction = async () => {
    if (!selectedRequest) return
    setIsSubmitting(true)
    try {
      if (actionType === 'approve') {
        const scheduledDateTime = scheduledDate && scheduledTime 
          ? `${scheduledDate}T${scheduledTime}:00`
          : undefined
        await approveRequest(selectedRequest.id, {
          scheduledTime: scheduledDateTime,
          staffId,
          staffNotes,
        })
      } else if (actionType === 'decline') {
        await declineRequest(selectedRequest.id, {
          declinedReason: declineReason,
          staffId,
          staffNotes,
        })
      } else if (actionType === 'forward') {
        await forwardToPco(selectedRequest.id, {
          staffId,
          staffNotes,
        })
      } else if (actionType === 'complete') {
        await completeRequest(selectedRequest.id, staffId)
      }
      
      setShowActionModal(false)
      loadRequests()
      setSelectedRequest(null)
    } catch (error) {
      console.error('Failed to perform action:', error)
      alert('Failed to perform action')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openActionModal = (action: string) => {
    setActionType(action)
    setShowActionModal(true)
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    scheduled: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    declined: 'bg-red-100 text-red-800',
    pco_required: 'bg-purple-100 text-purple-800',
    pco_approved: 'bg-green-100 text-green-800',
    pco_declined: 'bg-red-100 text-red-800',
  }

  const typeLabels: Record<string, string> = {
    social_visit: 'Social Visit',
    avl_visit: 'AVL Visit',
    property_request: 'Property',
  }

  const filters = [
    { id: 'pending', label: 'Pending' },
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'completed', label: 'Completed' },
    { id: 'declined', label: 'Declined' },
  ]

  return (
    <GlassLayout>
      <div className="mb-6">
        <Link to={prisonId ? `/prison/${prisonId}` : '/'} className="text-corrections-blue hover:underline text-sm mb-1 inline-block">← Back to Units</Link>
        <h1 className="text-2xl font-bold text-corrections-charcoal">Request Management</h1>
        <p className="text-slate-600">Review and manage prisoner requests</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              filter === f.id 
                ? 'bg-corrections-blue text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 sticky top-0">
              <tr>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Prisoner</th>
                <th className="text-left p-3">Cell</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Created</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-500">Loading...</td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-500">No requests found</td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="border-t border-slate-200 hover:bg-slate-50">
                    <td className="p-3 font-medium">{typeLabels[req.type] || req.type}</td>
                    <td className="p-3">{req.prisonerName}</td>
                    <td className="p-3">{req.prisonerCell}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[req.status] || 'bg-slate-100'}`}>
                        {req.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="text-corrections-blue hover:underline text-sm"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Detail Modal */}
      {selectedRequest && !showActionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Request Details</h2>
                <button onClick={() => setSelectedRequest(null)} className="text-2xl text-slate-400 hover:text-slate-600">×</button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500">Type</label>
                    <p className="font-medium">{typeLabels[selectedRequest.type] || selectedRequest.type}</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Status</label>
                    <p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[selectedRequest.status]}`}>
                        {selectedRequest.status.replace('_', ' ')}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Prisoner</label>
                    <p className="font-medium">{selectedRequest.prisonerName}</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Cell</label>
                    <p className="font-medium">{selectedRequest.prisonerCell}</p>
                  </div>
                </div>

                {/* Request-specific details */}
                {selectedRequest.metadata && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="font-medium mb-2">Request Details</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {selectedRequest.metadata.contactName && (
                        <div><span className="text-slate-500">Contact:</span> {selectedRequest.metadata.contactName}</div>
                      )}
                      {selectedRequest.metadata.relationship && (
                        <div><span className="text-slate-500">Relationship:</span> {selectedRequest.metadata.relationship}</div>
                      )}
                      {selectedRequest.metadata.preferredDate && (
                        <div><span className="text-slate-500">Preferred Date:</span> {selectedRequest.metadata.preferredDate}</div>
                      )}
                      {selectedRequest.metadata.propertyCategory && (
                        <div><span className="text-slate-500">Category:</span> {selectedRequest.metadata.propertyCategory}</div>
                      )}
                      {selectedRequest.metadata.propertyItems && (
                        <div className="col-span-2">
                          <span className="text-slate-500">Items:</span>
                          <ul className="list-disc list-inside">
                            {selectedRequest.metadata.propertyItems.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedRequest.scheduledTime && (
                  <div>
                    <label className="text-xs text-slate-500">Scheduled Time</label>
                    <p className="font-medium">{new Date(selectedRequest.scheduledTime).toLocaleString()}</p>
                  </div>
                )}

                {selectedRequest.staffNotes && (
                  <div>
                    <label className="text-xs text-slate-500">Staff Notes</label>
                    <p>{selectedRequest.staffNotes}</p>
                  </div>
                )}

                {selectedRequest.declinedReason && (
                  <div className="bg-red-50 rounded-lg p-4">
                    <label className="text-xs text-red-600">Declined Reason</label>
                    <p className="text-red-800">{selectedRequest.declinedReason}</p>
                  </div>
                )}

                {/* Action History */}
                {requestDetails?.actions && requestDetails.actions.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Action History</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {requestDetails.actions.map((action) => (
                        <div key={action.id} className="text-sm bg-slate-50 p-2 rounded">
                          <div className="flex justify-between">
                            <span className="font-medium">{action.action}</span>
                            <span className="text-slate-500">{new Date(action.performedAt).toLocaleString()}</span>
                          </div>
                          <div className="text-slate-600">By: {action.performedBy}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  {selectedRequest.status === 'pending' && (
                    <>
                      {selectedRequest.type !== 'property_request' ? (
                        <>
                          <button onClick={() => openActionModal('approve')} className="btn-corrections">Approve & Schedule</button>
                          <button onClick={() => openActionModal('decline')} className="btn-outline text-red-600 border-red-300 hover:bg-red-50">Decline</button>
                        </>
                      ) : (
                        <button onClick={() => openActionModal('forward')} className="btn-corrections">Forward to PCO</button>
                      )}
                    </>
                  )}
                  {selectedRequest.status === 'scheduled' && (
                    <button onClick={() => openActionModal('complete')} className="btn-corrections">Mark Complete</button>
                  )}
                  <button onClick={() => setSelectedRequest(null)} className="btn-outline">Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">
              {actionType === 'approve' && 'Approve & Schedule Request'}
              {actionType === 'decline' && 'Decline Request'}
              {actionType === 'forward' && 'Forward to PCO'}
              {actionType === 'complete' && 'Mark Complete'}
            </h3>

            <div className="space-y-4">
              {actionType === 'approve' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Scheduled Date</label>
                    <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Scheduled Time</label>
                    <input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
                  </div>
                </>
              )}

              {actionType === 'decline' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Reason for Decline *</label>
                  <textarea value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} rows={3} className="w-full border rounded-lg px-3 py-2" required />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Staff ID</label>
                <input type="text" value={staffId} onChange={(e) => setStaffId(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea value={staffNotes} onChange={(e) => setStaffNotes(e.target.value)} rows={2} className="w-full border rounded-lg px-3 py-2" />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={handleAction} disabled={isSubmitting} className="btn-corrections flex-1">
                {isSubmitting ? 'Processing...' : 'Confirm'}
              </button>
              <button onClick={() => setShowActionModal(false)} className="btn-outline">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </GlassLayout>
  )
}
