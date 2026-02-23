import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import GlassLayout from '../components/GlassLayout'
import { createPrisonerRequest, PrisonerRequest } from '../api'

interface PrisonerKioskProps {
  prisoner?: {
    id: string
    name: string
    cell: string
  }
}

export default function PrisonerKiosk({ prisoner: initialPrisoner }: PrisonerKioskProps) {
  const { prisonId, unitId } = useParams<{ prisonId?: string; unitId?: string }>()
  const navigate = useNavigate()
  
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  // Form state
  const [prisonerName, setPrisonerName] = useState(initialPrisoner?.name || '')
  const [prisonerCell, setPrisonerCell] = useState(initialPrisoner?.cell || '')
  const [prisonerId, setPrisonerId] = useState(initialPrisoner?.id || '')
  
  // Visit fields
  const [contactName, setContactName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  
  // Property fields
  const [propertyItems, setPropertyItems] = useState<string[]>([])
  const [propertyCategory, setPropertyCategory] = useState('')
  const [urgency, setUrgency] = useState('normal')

  const requestTypes = [
    {
      id: 'social_visit',
      label: 'Social Visit',
      description: 'Request an in-person visit from family or friends',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      id: 'avl_visit',
      label: 'AVL Visit',
      description: 'Request a video call visit',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'property_request',
      label: 'Property',
      description: 'Request items from outside',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedType || !prisonerName || !prisonerCell) {
      alert('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      let metadata: any = {}
      
      if (selectedType === 'social_visit' || selectedType === 'avl_visit') {
        metadata = {
          contactName,
          relationship,
          preferredDate,
          preferredTime,
          reason,
          notes,
        }
      } else if (selectedType === 'property_request') {
        metadata = {
          propertyItems,
          propertyCategory,
          urgency,
          notes,
        }
      }

      await createPrisonerRequest({
        prisonerId: prisonerId || `prisoner-${Date.now()}`,
        prisonerName,
        prisonerCell,
        type: selectedType,
        unitId: unitId || 'north',
        metadata,
        createdBy: 'prisoner',
      })

      setSubmitted(true)
    } catch (error) {
      console.error('Failed to submit request:', error)
      alert('Failed to submit request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <GlassLayout>
        <div className="max-w-lg mx-auto text-center py-12">
          <div className="flex justify-center mb-4">
            <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-green-600 mb-4">Request Submitted!</h1>
          <p className="text-lg text-slate-600 mb-8">
            Your request has been sent to staff for review. You will be notified when a decision is made.
          </p>
          <button
            onClick={() => {
              setSubmitted(false)
              setSelectedType(null)
              setContactName('')
              setRelationship('')
              setPreferredDate('')
              setPreferredTime('')
              setReason('')
              setNotes('')
              setPropertyItems([])
              setPropertyCategory('')
            }}
            className="px-8 py-4 bg-corrections-blue text-white rounded-xl text-xl font-medium hover:bg-corrections-blue-dark transition-colors"
          >
            Submit Another Request
          </button>
        </div>
      </GlassLayout>
    )
  }

  return (
    <GlassLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-corrections-charcoal">Submit a Request</h1>
          <p className="text-slate-600">Select the type of request you'd like to make</p>
        </div>

        {!selectedType ? (
          <div className="grid gap-4">
            {requestTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className="bg-white border-2 border-slate-200 rounded-xl p-6 text-left hover:border-corrections-blue hover:bg-corrections-blue-pale transition-all"
              >
                <div className="flex items-center gap-4">
                  <span className="text-corrections-blue">{type.icon}</span>
                  <div>
                    <h3 className="text-xl font-bold text-corrections-charcoal">{type.label}</h3>
                    <p className="text-slate-600">{type.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <button
              type="button"
              onClick={() => setSelectedType(null)}
              className="text-corrections-blue hover:underline mb-4"
            >
              ← Back to request types
            </button>

            <div className="bg-corrections-blue-pale rounded-xl p-6">
              <h2 className="text-xl font-bold text-corrections-charcoal mb-4">
                {requestTypes.find((t) => t.id === selectedType)?.label}
              </h2>

              {/* Prisoner Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Your Name *</label>
                  <input
                    type="text"
                    value={prisonerName}
                    onChange={(e) => setPrisonerName(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-3 text-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cell Number *</label>
                  <input
                    type="text"
                    value={prisonerCell}
                    onChange={(e) => setPrisonerCell(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-3 text-lg"
                    required
                  />
                </div>
              </div>

              {/* Visit-specific fields */}
              {(selectedType === 'social_visit' || selectedType === 'avl_visit') && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name *</label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-4 py-3"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Relationship *</label>
                      <select
                        value={relationship}
                        onChange={(e) => setRelationship(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-4 py-3"
                        required
                      >
                        <option value="">Select...</option>
                        <option value="family">Family</option>
                        <option value="friend">Friend</option>
                        <option value="legal">Legal Representative</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Date</label>
                      <input
                        type="date"
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-4 py-3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Time</label>
                      <select
                        value={preferredTime}
                        onChange={(e) => setPreferredTime(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-4 py-3"
                      >
                        <option value="">Any time</option>
                        <option value="morning">Morning (9am-12pm)</option>
                        <option value="afternoon">Afternoon (1pm-4pm)</option>
                        <option value="evening">Evening (5pm-8pm)</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Visit</label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={2}
                      className="w-full border border-slate-300 rounded-lg px-4 py-3"
                    />
                  </div>
                </>
              )}

              {/* Property-specific fields */}
              {selectedType === 'property_request' && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                    <select
                      value={propertyCategory}
                      onChange={(e) => setPropertyCategory(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-4 py-3"
                      required
                    >
                      <option value="">Select category...</option>
                      <option value="clothing">Clothing</option>
                      <option value="hygiene">Hygiene Items</option>
                      <option value="documents">Documents</option>
                      <option value="electronics">Electronics</option>
                      <option value="books">Books/Reading Material</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Items Requested (one per line)</label>
                    <textarea
                      value={propertyItems.join('\n')}
                      onChange={(e) => setPropertyItems(e.target.value.split('\n').filter(Boolean))}
                      rows={3}
                      placeholder="e.g.,&#10;2x t-shirts&#10;1x jeans&#10;toothpaste"
                      className="w-full border border-slate-300 rounded-lg px-4 py-3"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Urgency</label>
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-4 py-3"
                    >
                      <option value="low">Low - Within 2 weeks</option>
                      <option value="normal">Normal - Within 1 week</option>
                      <option value="high">High - Within 3 days</option>
                    </select>
                  </div>
                </>
              )}

              {/* Common fields */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Additional Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Any additional information..."
                  className="w-full border border-slate-300 rounded-lg px-4 py-3"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-corrections-blue text-white rounded-xl text-xl font-bold hover:bg-corrections-blue-dark transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        )}
      </div>
    </GlassLayout>
  )
}
