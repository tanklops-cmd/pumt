import { useState, useEffect } from 'react'
import { fetchPrisonBriefing, savePrisonBriefing, type PrisonBriefing, fetchBriefings, uploadBriefing, deleteBriefing, type BriefingPDF } from '../api'

interface BriefingPanelProps {
  prisonId: string
}

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function BriefingPanel({ prisonId }: BriefingPanelProps) {
  // Text briefing state (legacy)
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

  // PDF briefings state
  const [pdfBriefings, setPdfBriefings] = useState<BriefingPDF[]>([])
  const [selectedPdf, setSelectedPdf] = useState<BriefingPDF | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  // Upload form state
  const [pdfTitle, setPdfTitle] = useState('')
  const [pdfDate, setPdfDate] = useState(new Date().toISOString().slice(0, 10))
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfUnit, setPdfUnit] = useState('')

  useEffect(() => {
    loadBriefing()
    loadPdfBriefings()
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

  const loadPdfBriefings = async () => {
    try {
      const data = await fetchBriefings()
      // Show all briefings or filter by matching unit/prison
      setPdfBriefings(data.filter(b => 
        b.unit.toLowerCase() === prisonId.toLowerCase() || 
        b.unit.toLowerCase() === 'all' ||
        b.unit.toLowerCase() === 'invercargill'
      ))
    } catch (error) {
      console.error('Failed to load PDF briefings:', error)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updated = await savePrisonBriefing({
        prisonId,
        title: editedTitle,
        content: editedContent,
        postedBy: editedPostedBy,
      })
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

  const handlePdfUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pdfFile || !pdfTitle || !pdfDate) {
      alert('Please fill all fields and select a PDF file')
      return
    }

    try {
      setUploading(true)
      await uploadBriefing(pdfFile, pdfTitle, pdfDate, prisonId, 'Admin')
      await loadPdfBriefings()
      setShowUpload(false)
      setPdfTitle('')
      setPdfDate(new Date().toISOString().slice(0, 10))
      setPdfFile(null)
      setPdfUnit('')
    } catch (error) {
      console.error('Failed to upload PDF:', error)
      alert('Failed to upload PDF')
    } finally {
      setUploading(false)
    }
  }

  const handleDeletePdf = async (id: string) => {
    if (!confirm('Delete this briefing?')) return
    try {
      await deleteBriefing(id)
      await loadPdfBriefings()
      if (selectedPdf?.id === id) {
        setSelectedPdf(null)
      }
    } catch (error) {
      console.error('Failed to delete PDF:', error)
    }
  }

  const hasTextContent = briefing.title || briefing.content
  
  // Always show PDF section for uploads
  const showPdfSection = true

  return (
    <div className="bg-white/60 backdrop-blur-sm border border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm mb-6 w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-corrections-charcoal flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-corrections-blue"></span>
          Prison Briefing
        </h2>
        {!isEditing && hasTextContent && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-corrections-blue hover:underline"
          >
            Edit Briefing
          </button>
        )}
      </div>

      {/* PDF Viewer Section */}
      {selectedPdf ? (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-slate-800">Viewing: {selectedPdf.title}</h3>
            <button
              onClick={() => setSelectedPdf(null)}
              className="text-sm text-corrections-blue hover:underline"
            >
              Close Viewer
            </button>
          </div>
          <div className="h-[60vh] border border-slate-200 rounded-lg overflow-hidden">
            <iframe
              src={`${API_BASE}/api/briefings/${selectedPdf.id}/file`}
              className="w-full h-full"
              title="PDF Viewer"
            />
          </div>
        </div>
      ) : (
        // PDF List - always show section for uploads
        showPdfSection && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-slate-800">PDF Briefings</h3>
              <button
                onClick={() => setShowUpload(!showUpload)}
                className="text-sm text-corrections-blue hover:underline"
              >
                {showUpload ? 'Cancel' : 'Upload PDF'}
              </button>
            </div>

            {/* Upload Form */}
            {showUpload && (
              <form onSubmit={handlePdfUpload} className="bg-slate-50 p-4 rounded-lg mb-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Title"
                    value={pdfTitle}
                    onChange={(e) => setPdfTitle(e.target.value)}
                    className="border border-slate-300 rounded px-3 py-2 text-sm"
                    required
                  />
                  <input
                    type="date"
                    value={pdfDate}
                    onChange={(e) => setPdfDate(e.target.value)}
                    className="border border-slate-300 rounded px-3 py-2 text-sm"
                    required
                  />
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    className="border border-slate-300 rounded px-3 py-2 text-sm"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-corrections-blue text-white rounded-lg hover:bg-corrections-blue-dark text-sm disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </form>
            )}

            {/* PDF List */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {pdfBriefings.map((pdf) => (
                <div key={pdf.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                  <div className="flex-1 cursor-pointer" onClick={() => setSelectedPdf(pdf)}>
                    <div className="font-medium text-sm text-slate-800 hover:text-corrections-blue">
                      {pdf.title}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(pdf.date).toLocaleDateString()} • {pdf.originalFileName}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePdf(pdf.id)}
                    className="text-red-500 hover:text-red-700 text-xs ml-2"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* Legacy Text Briefing Section */}
      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              placeholder="e.g., Today's Updates"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm break-words"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder="Enter briefing information for all staff..."
              rows={4}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm break-words"
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
      ) : hasTextContent ? (
        <div className="break-words">
          <h3 className="text-lg font-semibold text-corrections-charcoal mb-2 break-words">
            {briefing.title}
          </h3>
          <div className="text-corrections-charcoal/80 whitespace-pre-wrap break-words overflow-hidden">
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
