import { useState, useEffect } from 'react'
import Layout from '../Layout'
import { UNITS } from '../constants'
import type { UnitId } from '../types'
import { fetchUnitConfig, saveUnitConfig, type UnitConfig } from '../api'

const STORAGE_ADMIN_KEY = 'prison-muster-admin-ok'

export default function UnitConfigPage() {
  const [authenticated, setAuthenticated] = useState(() => {
    try {
      const exp = sessionStorage.getItem(STORAGE_ADMIN_KEY)
      if (!exp) return false
      return Date.now() < parseInt(exp, 10)
    } catch {
      return false
    }
  })
  const [selectedUnit, setSelectedUnit] = useState<UnitId>('south')
  const [config, setConfig] = useState<UnitConfig>({ unitId: 'south', cells: [], facilities: [] })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  
  // Cell range inputs
  const [cellStart, setCellStart] = useState('')
  const [cellEnd, setCellEnd] = useState('')
  const [cellExceptions, setCellExceptions] = useState('')
  
  // Facility input
  const [newFacility, setNewFacility] = useState('')
  const [editingFacility, setEditingFacility] = useState<string | null>(null)
  const [editingFacilityValue, setEditingFacilityValue] = useState('')

  useEffect(() => {
    if (authenticated) {
      loadConfig(selectedUnit)
    }
  }, [selectedUnit, authenticated])

  const loadConfig = async (unitId: UnitId) => {
    setLoading(true)
    try {
      const data = await fetchUnitConfig(unitId)
      setConfig(data)
    } catch (e) {
      console.error('Failed to load config:', e)
      setConfig({ unitId, cells: [], facilities: [] })
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (config.cells.length < 3) {
      setMessage('Minimum 3 cells required')
      return
    }
    if (config.facilities.length < 2) {
      setMessage('Minimum 2 facilities required')
      return
    }
    
    setSaving(true)
    setMessage('')
    try {
      await saveUnitConfig(config)
      setMessage('Configuration saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (e) {
      console.error('Failed to save:', e)
      setMessage('Failed to save configuration')
    }
    setSaving(false)
  }

  const addCellRange = () => {
    const start = parseInt(cellStart, 10)
    const end = parseInt(cellEnd, 10)
    const exceptions = cellExceptions.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))
    
    if (isNaN(start) || isNaN(end) || start > end) {
      setMessage('Invalid cell range')
      return
    }
    
    const newCells: string[] = []
    for (let i = start; i <= end; i++) {
      if (!exceptions.includes(i)) {
        newCells.push(String(i))
      }
    }
    
    const updatedCells = [...new Set([...config.cells, ...newCells])].sort((a, b) => 
      parseInt(a, 10) - parseInt(b, 10)
    )
    
    setConfig({ ...config, cells: updatedCells })
    setCellStart('')
    setCellEnd('')
    setCellExceptions('')
    setMessage('')
  }

  const addSingleCell = (cell: string) => {
    const num = parseInt(cell, 10)
    if (isNaN(num)) {
      setMessage('Invalid cell number')
      return
    }
    if (config.cells.includes(cell)) {
      setMessage('Cell already exists')
      return
    }
    setConfig({
      ...config,
      cells: [...config.cells, cell].sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
    })
    setMessage('')
  }

  const removeCell = (cell: string) => {
    setConfig({
      ...config,
      cells: config.cells.filter(c => c !== cell)
    })
  }

  const addFacility = () => {
    const facility = newFacility.trim()
    if (!facility) return
    if (config.facilities.includes(facility)) {
      setMessage('Facility already exists')
      return
    }
    setConfig({
      ...config,
      facilities: [...config.facilities, facility]
    })
    setNewFacility('')
    setMessage('')
  }

  const updateFacility = (oldValue: string, newValue: string) => {
    if (!newValue.trim()) return
    setConfig({
      ...config,
      facilities: config.facilities.map(f => f === oldValue ? newValue.trim() : f)
    })
    setEditingFacility(null)
    setEditingFacilityValue('')
  }

  const removeFacility = (facility: string) => {
    setConfig({
      ...config,
      facilities: config.facilities.filter(f => f !== facility)
    })
  }

  const canSave = config.cells.length >= 3 && config.facilities.length >= 2

  if (!authenticated) {
    return (
      <Layout>
        <div className="max-w-md mx-auto card p-6">
          <h1 className="text-xl font-bold text-corrections-charcoal mb-2">Administration Required</h1>
          <p className="text-sm text-slate-600">Please log in as admin to configure units.</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-corrections-charcoal">Unit Configuration</h1>
        <p className="text-sm text-slate-600">Configure cells and facilities for each unit</p>
      </div>

      {/* Unit Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">Select Unit</label>
        <select
          value={selectedUnit}
          onChange={(e) => setSelectedUnit(e.target.value as UnitId)}
          className="border border-slate-300 rounded-lg px-3 py-2 w-full max-w-xs"
        >
          {UNITS.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center p-8 text-slate-500">Loading configuration...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cell Configuration */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-corrections-charcoal mb-4">Cell Configuration</h2>
            
            {/* Add Range */}
            <div className="mb-4 p-4 bg-slate-50 rounded-lg">
              <h3 className="text-sm font-medium text-slate-700 mb-2">Add Cell Range</h3>
              <div className="flex flex-wrap gap-2 items-end">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Start</label>
                  <input
                    type="number"
                    value={cellStart}
                    onChange={(e) => setCellStart(e.target.value)}
                    placeholder="1"
                    className="border border-slate-300 rounded px-2 py-1 w-20"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">End</label>
                  <input
                    type="number"
                    value={cellEnd}
                    onChange={(e) => setCellEnd(e.target.value)}
                    placeholder="50"
                    className="border border-slate-300 rounded px-2 py-1 w-20"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Except</label>
                  <input
                    type="text"
                    value={cellExceptions}
                    onChange={(e) => setCellExceptions(e.target.value)}
                    placeholder="20, 25"
                    className="border border-slate-300 rounded px-2 py-1 w-24"
                  />
                </div>
                <button
                  type="button"
                  onClick={addCellRange}
                  className="btn-corrections text-sm"
                >
                  Add Range
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">e.g., 1-50 except 20 → cells 1-19,21-50</p>
            </div>

            {/* Add Single Cell */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-slate-700 mb-2">Add Single Cell</h3>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={cellStart}
                  onChange={(e) => setCellStart(e.target.value)}
                  placeholder="Cell number"
                  className="border border-slate-300 rounded px-2 py-1 flex-1"
                  min="1"
                />
                <button
                  type="button"
                  onClick={() => { addSingleCell(cellStart); setCellStart('') }}
                  className="btn-outline text-sm"
                >
                  Add Cell
                </button>
              </div>
            </div>

            {/* Cell List */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-slate-700">
                  Cells ({config.cells.length})
                  {config.cells.length < 3 && <span className="text-red-500 ml-2">- Min 3 required</span>}
                </h3>
              </div>
              <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto border border-slate-200 rounded p-2">
                {config.cells.length === 0 ? (
                  <p className="text-sm text-slate-500 p-2">No cells configured</p>
                ) : (
                  config.cells.map((cell) => (
                    <span
                      key={cell}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-sm"
                    >
                      {cell}
                      <button
                        type="button"
                        onClick={() => removeCell(cell)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Facility Configuration */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-corrections-charcoal mb-4">Facility Configuration</h2>
            
            {/* Add Facility */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-slate-700 mb-2">Add Facility</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFacility}
                  onChange={(e) => setNewFacility(e.target.value)}
                  placeholder="e.g., Kitchen, Yard, Laundry"
                  className="border border-slate-300 rounded px-3 py-2 flex-1"
                />
                <button
                  type="button"
                  onClick={addFacility}
                  className="btn-corrections"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Facility List */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-slate-700">
                  Facilities ({config.facilities.length})
                  {config.facilities.length < 2 && <span className="text-red-500 ml-2">- Min 2 required</span>}
                </h3>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {config.facilities.length === 0 ? (
                  <p className="text-sm text-slate-500 p-2">No facilities configured</p>
                ) : (
                  config.facilities.map((facility) => (
                    <div
                      key={facility}
                      className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded"
                    >
                      {editingFacility === facility ? (
                        <>
                          <input
                            type="text"
                            value={editingFacilityValue}
                            onChange={(e) => setEditingFacilityValue(e.target.value)}
                            className="border border-slate-300 rounded px-2 py-1 flex-1"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => updateFacility(facility, editingFacilityValue)}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => { setEditingFacility(null); setEditingFacilityValue('') }}
                            className="text-slate-600 hover:text-slate-800 text-sm"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1">{facility}</span>
                          <button
                            type="button"
                            onClick={() => { setEditingFacility(facility); setEditingFacilityValue(facility) }}
                            className="text-corrections-blue hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFacility(facility)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Button & Message */}
      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave || saving}
          className="btn-corrections disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
        {message && (
          <span className={`text-sm ${message.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </span>
        )}
      </div>
    </Layout>
  )
}
