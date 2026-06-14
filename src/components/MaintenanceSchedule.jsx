import React, { useState } from 'react'
import { getMaintenancePriority, daysSinceMaintenance } from '../utils/simulationEngine'

const PRIORITY_CONFIG = {
  high:   { badge: 'badge-red',    label: 'High Priority',   color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
  medium: { badge: 'badge-yellow', label: 'Medium Priority', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  normal: { badge: 'badge-green',  label: 'Normal',          color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
}

const STATUS_CONFIG = {
  active:      { badge: 'badge-green',  label: 'Active' },
  maintenance: { badge: 'badge-orange', label: 'In Maintenance' },
  critical:    { badge: 'badge-red',    label: 'Critical' },
}

export default function MaintenanceSchedule({ fleetAssets, onAddEvent, maintenanceThreshold }) {
  const [filter, setFilter] = useState('all')
  const [scheduled, setScheduled] = useState(new Set())

  // Annotate assets with priority
  const annotated = fleetAssets.map(asset => ({
    ...asset,
    priority: getMaintenancePriority(asset.conditionScore),
    daysSince: daysSinceMaintenance(asset.lastMaintenance),
  }))

  const filtered = annotated.filter(a => {
    if (filter === 'all') return true
    if (filter === 'high') return a.priority === 'high'
    if (filter === 'medium') return a.priority === 'medium'
    if (filter === 'locomotive') return a.type === 'locomotive'
    if (filter === 'railcar') return a.type === 'railcar'
    return true
  })

  const counts = {
    high:   annotated.filter(a => a.priority === 'high').length,
    medium: annotated.filter(a => a.priority === 'medium').length,
    normal: annotated.filter(a => a.priority === 'normal').length,
  }

  function scheduleMaintenance(assetId) {
    if (scheduled.has(assetId)) return
    setScheduled(prev => new Set([...prev, assetId]))
    const asset = annotated.find(a => a.id === assetId)
    onAddEvent({
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      type: 'maintenance',
      message: `Maintenance dijadwalkan untuk ${asset.name} (${asset.id}) — Prioritas ${asset.priority.toUpperCase()}`,
      severity: asset.priority === 'high' ? 'error' : 'warning',
    })
  }

  function scheduleAll() {
    const highPriority = annotated.filter(a => a.priority === 'high' && !scheduled.has(a.id))
    highPriority.forEach(a => scheduleMaintenance(a.id))
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1">
            <div className="section-title">Jadwal Maintenance Aset</div>
            <div className="section-subtitle">Prioritas perawatan berdasarkan condition score dan jarak tempuh</div>
          </div>
          <button onClick={scheduleAll} className="btn-danger">
            <WrenchIcon /> Jadwalkan Semua High Priority
          </button>
        </div>

        {/* Priority summary cards */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
            <div key={key} className={`rounded-xl border p-3 ${cfg.bg}`}>
              <div className={`text-2xl font-bold ${cfg.color}`}>{counts[key]}</div>
              <div className="text-xs text-slate-400 mt-0.5">{cfg.label}</div>
              {key === 'high' && (
                <div className="text-[10px] text-red-400 mt-1 blink">Perlu tindakan segera</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all',        label: `Semua (${annotated.length})` },
          { key: 'high',       label: `High (${counts.high})` },
          { key: 'medium',     label: `Medium (${counts.medium})` },
          { key: 'locomotive', label: 'Lokomotif' },
          { key: 'railcar',    label: 'Gerbong' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-all font-medium ${
              filter === f.key
                ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                : 'bg-slate-700/30 border-slate-600/40 text-slate-400 hover:text-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Asset table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/40">
              {['Asset ID', 'Nama', 'Tipe', 'Jarak (km)', 'Last Maint.', 'Hari Lalu', 'Condition', 'Prioritas', 'Status', 'Aksi'].map(h => (
                <th key={h} className="table-cell text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest pb-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(asset => {
              const pc = PRIORITY_CONFIG[asset.priority]
              const sc = STATUS_CONFIG[asset.status] || STATUS_CONFIG.active
              const isScheduled = scheduled.has(asset.id)
              return (
                <tr key={asset.id} className={`table-row ${asset.priority === 'high' ? 'bg-red-950/20' : ''}`}>
                  <td className="table-cell font-mono text-xs text-slate-300">{asset.id}</td>
                  <td className="table-cell font-semibold text-white text-xs">{asset.name}</td>
                  <td className="table-cell">
                    <span className={`badge ${asset.type === 'locomotive' ? 'badge-blue' : 'badge-purple'} text-[10px]`}>
                      {asset.type === 'locomotive' ? 'Lokomotif' : 'Gerbong'}
                    </span>
                  </td>
                  <td className="table-cell text-slate-300 font-mono text-xs">
                    {asset.mileage.toLocaleString()}
                  </td>
                  <td className="table-cell text-slate-400 text-xs">{asset.lastMaintenance}</td>
                  <td className="table-cell">
                    <span className={`text-xs font-semibold ${asset.daysSince > 90 ? 'text-red-400' : asset.daysSince > 60 ? 'text-yellow-400' : 'text-slate-300'}`}>
                      {asset.daysSince}h
                    </span>
                  </td>
                  <td className="table-cell" style={{ minWidth: 110 }}>
                    <div className="flex items-center gap-2">
                      <div className="progress-bar w-16">
                        <div
                          className={`progress-fill ${asset.conditionScore < 60 ? 'bg-red-500' : asset.conditionScore < 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${asset.conditionScore}%` }}
                        />
                      </div>
                      <span className={`text-xs font-semibold ${pc.color}`}>{asset.conditionScore}</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${pc.badge} text-[10px]`}>{pc.label}</span>
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${sc.badge} text-[10px]`}>{sc.label}</span>
                  </td>
                  <td className="table-cell">
                    {isScheduled ? (
                      <span className="text-green-400 text-xs font-semibold">✓ Dijadwalkan</span>
                    ) : (
                      <button
                        onClick={() => scheduleMaintenance(asset.id)}
                        disabled={asset.status === 'maintenance'}
                        className={`px-2 py-1 text-[10px] rounded font-semibold transition-colors ${
                          asset.priority === 'high'
                            ? 'bg-red-600/60 hover:bg-red-500 text-white'
                            : 'bg-slate-600/60 hover:bg-slate-500 text-slate-200'
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        Schedule
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Maintenance timeline visualization */}
      <div className="card">
        <div className="card-header">Condition Score Distribution</div>
        <div className="space-y-2">
          {annotated.sort((a, b) => a.conditionScore - b.conditionScore).map(asset => {
            const pc = PRIORITY_CONFIG[asset.priority]
            return (
              <div key={asset.id} className="flex items-center gap-3">
                <div className="w-24 text-xs text-slate-400 truncate shrink-0">{asset.name.split(' ').slice(0, 2).join(' ')}</div>
                <div className="flex-1 progress-bar h-5 rounded-lg overflow-hidden">
                  <div
                    className={`h-full rounded-lg flex items-center px-2 transition-all duration-700 ${
                      asset.conditionScore < 60 ? 'bg-red-500' : asset.conditionScore < 80 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${asset.conditionScore}%` }}
                  >
                    <span className="text-[10px] text-white font-semibold">{asset.conditionScore}</span>
                  </div>
                </div>
                <span className={`badge ${pc.badge} text-[10px] shrink-0`}>{pc.label.split(' ')[0]}</span>
              </div>
            )
          })}
        </div>
        <div className="flex gap-3 mt-3 text-xs">
          <span className="text-red-400">■ High (&lt;60)</span>
          <span className="text-yellow-400">■ Medium (60–80)</span>
          <span className="text-green-400">■ Normal (&gt;80)</span>
          <span className="text-slate-500 ml-auto">Threshold: {maintenanceThreshold}</span>
        </div>
      </div>
    </div>
  )
}

function WrenchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  )
}
