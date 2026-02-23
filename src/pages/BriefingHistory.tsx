import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import GlassLayout from '../components/GlassLayout'
import { fetchBriefings, uploadBriefing, deleteBriefing, BriefingPDF } from '../api'

export default function BriefingHistory() {
  const navigate = useNavigate()
  const [briefings, setBriefings] = useState<BriefingPDF[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [selectedBriefing, setSelectedBriefing] = useState<BriefingPDF | null>(null)
  
  // Upload form state
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [unit, setUnit] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  // Get API base URL
  const API_BASE = import.meta.env.VITE_API_URL || ''

  const loadBriefings = async () => {
    try {
      setLoading(true)
      const data = await fetchBriefings()
      setBriefings(data)
    } catch (err) {
      console.error('Failed to load briefings:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBriefings()
  }, [])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !title || !date || !unit) {
      setError('Please fill all fields and select a PDF file')
      return
    }

    try {
      setUploading(true)
      setError('')
      await uploadBriefing(file, title, date, unit, 'Admin')
      await loadBriefings()
      setShowUpload(false)
      setTitle('')
      setDate(new Date().toISOString().slice(0, 10))
      setUnit('')
      setFile(null)
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this briefing?')) return
    try {
      await deleteBriefing(id)
      await loadBriefings()
      if (selectedBriefing?.id === id) {
        setSelectedBriefing(null)
      }
    } catch (err) {
      console.error('Failed to delete briefing:', err)
    }
  }

  return (
    <GlassLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link to="/" className="text-corrections-blue hover:underline text-sm mb-1 inline-block">← All prisons</Link>
            <h1 className="text-2xl font-bold text-corrections-charcoal">Briefing History</h1>
            <p className="text-slate-600">View and manage PDF briefings</p>
          </div>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="btn-corrections"
          >
            {showUpload ? 'Cancel' : 'Upload New Briefing'}
          </button>
        </div>

        {/* Upload Form */}
        {showUpload && (
          <div className="card mb-6">
            <div className="px-4 py-3 bg-corrections-blue text-white font-semibold">
              Upload PDF Briefing
            </div>
            <div className="p-4">
              <form onSubmit={handleUpload} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      placeholder="e.g., Morning Briefing"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      placeholder="e.g., North, South, ISU"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">PDF File</label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="btn-corrections"
                  >
                    {uploading ? 'Uploading...' : 'Upload Briefing'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PDF Viewer */}
        {selectedBriefing && (
          <div className="card mb-6">
            <div className="px-4 py-3 bg-corrections-blue text-white font-semibold flex items-center justify-between">
              <span>{selectedBriefing.title}</span>
              <button
                onClick={() => setSelectedBriefing(null)}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-sm"
              >
                Close
              </button>
            </div>
            <div className="h-[70vh]">
              <iframe
                src={`${API_BASE}/api/briefings/${selectedBriefing.id}/file`}
                className="w-full h-full"
                title="PDF Viewer"
              />
            </div>
          </div>
        )}

        {/* Briefings List */}
        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading...</div>
        ) : briefings.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No briefings yet. Upload your first PDF briefing to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {briefings.map((briefing) => (
              <div key={briefing.id} className="card">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{briefing.title}</h3>
                      <p className="text-sm text-slate-500">
                        {new Date(briefing.date).toLocaleDateString()}
                      </p>
                    </div>
                    <svg className="w-8 h-8 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z"/>
                    </svg>
                  </div>
                  <div className="text-sm text-slate-600 mb-3">
                    <p><strong>Unit:</strong> {briefing.unit}</p>
                    <p><strong>Uploaded by:</strong> {briefing.uploadedBy}</p>
                    <p><strong>File:</strong> {briefing.originalFileName}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedBriefing(briefing)}
                      className="btn-corrections text-sm py-1"
                    >
                      View PDF
                    </button>
                    <button
                      onClick={() => handleDelete(briefing.id)}
                      className="btn-outline text-sm py-1 text-red-600 border-red-300 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </GlassLayout>
  )
}
