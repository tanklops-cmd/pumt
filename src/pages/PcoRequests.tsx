import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import GlassLayout from '../components/GlassLayout'
import { 
  fetchPcoQueue,
  pcoApproveRequest,
  pcoDeclineRequest,
  fetchRequestDetails,
  PrisonerRequest,
  PrisonerRequestAction
} from '../api'

export default function PcoRequests() {
  const { prisonId, unitId } = useParams<{ prisonId?: string; unitId?: string }>()
  const [requests, setRequests] = useState<PrisonerRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<PrisonerRequest | null>(null)
  const [requestDetails, setRequestDetails] = useState<{ request: PrisonerRequest; actions: PrisonerRequestAction[] } | null>(null)
  
  // Action form state
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState<string>('')
  const [pcoNotes, setPcoNotes] = useState('')
  const [declinedReason, setDeclinedReason] = useState('')
  const [pcoId, setPcoId] = useState('pco-user')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadRequests()
  }, [unitId])

  useEffect(() => {
    if (selectedRequest) {
      loadRequestDetails(selectedRequest.id)
    }
  }, [selectedRequest])

  const loadRequests = async () => {
    setLoading(true)
    try {
      const data = await fetchPcoQueue(unitId)
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
        await pcoApproveRequest(selectedRequest.id, {
          pcoId,
          pcoNotes,
        })
      } else if (actionType === 'decline') {
        await pcoDeclineRequest(selectedRequest.id, {
          pcoId,
          pcoNotes,
          declinedReason,
        })
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

  return (
    <GlassLayout>
      <div className="mb-6">
        <Link to={prisonId ? `/prison/${prisonId}/unit/${unitId}/pco` : `/unit/${unitId}/pco`} className="text-corrections-blue hover:underline text-sm mb-1 inline-block">← Back to PCO Hub</Link>
        <h1 className="text-2xl font-bold text-corrections-charcoal">PCO Approval Queue</h1>
        <p className="text-slate-600">Property requests requiring PCO sign-off</p>
      </div>

      {/* PCO Queue */}
      <div className="card">
        {loading ? (
          <div className="p-4 text-center text-slate-500">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <div className="flex justify-center mb-2">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p>No property requests pending PCO approval</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 sticky top-0">
                <tr>
                  <th className="text-left p-3">Prisoner</th>
                  <th className="text-left p-3">Cell</th>
                  <th className="text-left p-3">Category</th>
                  <th className="text-left p-3">Items</th>
                  <th className="text-left p-3">Submitted</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-t border-slate-200 hover:bg-slate-50">
                    <td className="p-3 font-medium">{req.prisonerName}</td>
                    <td className="p-3">{req.prisonerCell}</td>
                    <td className="p-3 capitalize">{req.metadata?.propertyCategory || '-'}</td>
                    <td className="p-3">
                      <div className="max-w-xs truncate">
                        {req.metadata?.propertyItems?.slice(0, 2).join(', ')}
                        {req.metadata?.propertyItems?.length > 2 && ` +${req.metadata.propertyItems.length - 2} more`}
                      </div>
                    </td>
                    <td className="p-3 text-slate-500">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="text-corrections-blue hover:underline text-sm"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Detail Modal */}
      {selectedRequest && !showActionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">PCO Review</h2>
                <button onClick={() => setSelectedRequest(null)} className="text-2xl text-slate-400 hover:text-slate-600">×</button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500">Prisoner</label>
                    <p className="font-medium">{selectedRequest.prisonerName}</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Cell</label>
                    <p className="font-medium">{selectedRequest.prisonerCell}</p>
                  </div>
                </div>

                {/* Property Details */}
                {selectedRequest.metadata && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="font-medium mb-2">Property Request</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-slate-500">Category:</span> {selectedRequest.metadata.propertyCategory}
                      </div>
                      {selectedRequest.metadata.urgency && (
                        <div>
                          <span className="text-slate-500">Urgency:</span> {selectedRequest.metadata.urgency}
                        </div>
                      )}
                      {selectedRequest.metadata.notes && (
                        <div className="col-span-2">
                          <span className="text-slate-500">Notes:</span> {selectedRequest.metadata.notes}
                        </div>
                      )}
                    </div>
                    <div className="mt-3">
                      <span className="text-sm text-slate-500">Items requested:</span>
                      <ul className="mt-1 list-disc list-inside">
                        {selectedRequest.metadata.propertyItems?.map((item, i) => (
                          <li key={i} className="text-sm">{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Staff Notes */}
                {selectedRequest.staffNotes && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <label className="text-xs text-blue-600">Staff Notes</label>
                    <p className="text-blue-800">{selectedRequest.staffNotes}</p>
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

                {/* PCO Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <button onClick={() => openActionModal('approve')} className="btn-corrections bg-green-600 hover:bg-green-700">
                    Approve Request
                  </button>
                  <button onClick={() => openActionModal('decline')} className="btn-outline text-red-600 border-red-300 hover:bg-red-50">
                    Decline Request
                  </button>
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
              {actionType === 'approve' ? 'Approve Property Request' : 'Decline Property Request'}
            </h3>

            <div className="space-y-4">
              {actionType === 'decline' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Reason for Decline *</label>
                  <textarea 
                    value={declinedReason} 
                    onChange={(e) => setDeclinedReason(e.target.value)} 
                    rows={3} 
                    className="w-full border rounded-lg px-3 py-2" 
                    required 
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">PCO ID</label>
                <input 
                  type="text" 
                  value={pcoId} 
                  onChange={(e) => setPcoId(e.target.value)} 
                  className="w-full border rounded-lg px-3 py-2" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea 
                  value={pcoNotes} 
                  onChange={(e) => setPcoNotes(e.target.value)} 
                  rows={2} 
                  className="w-full border rounded-lg px-3 py-2" 
                />
              </div>

              {actionType === 'approve' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-800">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-sm">Approving this request will trigger an email notification to the prisoner's outside contact.</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={handleAction} disabled={isSubmitting} className="btn-corrections flex-1">
                {isSubmitting ? 'Processing...' : actionType === 'approve' ? 'Confirm Approval' : 'Confirm Decline'}
              </button>
              <button onClick={() => setShowActionModal(false)} className="btn-outline">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </GlassLayout>
  )
}
