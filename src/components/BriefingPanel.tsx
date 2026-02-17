import { useState, useEffect } from 'react'
import { fetchPrisonBriefing, savePrisonBriefing, type PrisonBriefing } from '../api'

interface BriefingPanelProps {
  prisonId: string
}

export default function BriefingPanel({ prisonId }: BriefingPanelProps) {
  const [briefing, setBriefing] = useState<PrisonBriefing>({
    prisonId,
    title: '',
    content: '',
    postedBy: '',
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedContent, setEditedContent] = useState('')
  const [editedPostedBy, setEditedPostedBy] = useState('')

  useEffect(() => {
    loadBriefing()
  }, [prisonId])

  const loadBriefing = async () => {
    try {
      const data = await fetchPrisonBriefing(prisonId)
      setBriefing(data)
      setEditedTitle(data.title || '')
      setEditedContent(data.content || '')
      setEditedPostedBy(data.postedBy || '')
    } catch (error) {
      console.error('Failed to load briefing:', error)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      console.log('Saving briefing for prison:', prisonId)
      const updated = await savePrisonBriefing({
        prisonId,
        title: editedTitle,
        content: editedContent,
        postedBy: editedPostedBy,
      })
      console.log('Briefing saved:', updated)
      setBriefing(updated)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save briefing:', error)
      alert('Failed to save briefing: ' + (error as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedTitle(briefing.title || '')
    setEditedContent(briefing.content || '')
    setEditedPostedBy(briefing.postedBy || '')
    setIsEditing(false)
  }

  const hasContent = briefing.title || briefing.content

  return (
    <div className="bg-white/60 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-corrections-charcoal flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-corrections-blue"></span>
          Prison Briefing
        </h2>
        {!isEditing && hasContent && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-corrections-blue hover:underline"
          >
            Edit Briefing
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              placeholder="e.g., Today's Updates"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder="Enter briefing information for all staff..."
              rows={4}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Posted By</label>
            <input
              type="text"
              value={editedPostedBy}
              onChange={(e) => setEditedPostedBy(e.target.value)}
              placeholder="Your name"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-corrections-blue text-white rounded-lg hover:bg-corrections-blue-dark transition-colors text-sm font-medium disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Briefing'}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-slate-100 text-corrections-charcoal border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : hasContent ? (
        <div>
          <h3 className="text-lg font-semibold text-corrections-charcoal mb-2">
            {briefing.title}
          </h3>
          <div className="prose prose-sm max-w-none text-corrections-charcoal/80 whitespace-pre-wrap">
            {briefing.content}
          </div>
          {briefing.postedBy && (
            <p className="text-xs text-corrections-stone mt-3">
              Posted by {briefing.postedBy}
              {briefing.updatedAt && ` • ${new Date(briefing.updatedAt).toLocaleString()}`}
            </p>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-corrections-stone text-sm mb-3">No briefing posted yet</p>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-corrections-blue-pale text-corrections-blue border border-corrections-blue/30 rounded-lg hover:bg-corrections-blue/10 transition-colors text-sm font-medium"
          >
            Add Briefing
          </button>
        </div>
      )}
    </div>
  )
}
