import React from 'react'
import { NETWORK_NODES } from '../data/mockData'

const STATUS_CONFIG = {
  moving:  { badge: 'badge-blue',   label: 'Moving',  dot: 'bg-blue-400' },
  waiting: { badge: 'badge-gray',   label: 'Waiting', dot: 'bg-slate-400' },
  arrived: { badge: 'badge-green',  label: 'Arrived', dot: 'bg-green-400' },
  delayed: { badge: 'badge-red',    label: 'Delayed', dot: 'bg-red-400' },
}

export default function TrainSimulation({ trains, isRunning, onStart, onPause, onReset, onAddTrain, onStartTrain }) {
  const moving  = trains.filter(t => t.status === 'moving').length
  const waiting = trains.filter(t => t.status === 'waiting').length
  const arrived = trains.filter(t => t.status === 'arrived').length
  const delayed = trains.filter(t => t.status === 'delayed').length

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1">
            <div className="section-title">Simulasi Pergerakan Kereta</div>
            <div className="section-subtitle">Kontrol dan monitor pergerakan kereta secara real-time</div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status indicators */}
            <div className="hidden md:flex items-center gap-3 mr-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400" />{moving} Moving</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-400" />{waiting} Waiting</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" />{delayed} Delayed</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400" />{arrived} Arrived</span>
            </div>

            {isRunning ? (
              <button onClick={onPause} className="btn-secondary">
                <PauseIcon /> Pause
              </button>
            ) : (
              <button onClick={onStart} className="btn-success">
                <PlayIcon /> Start
              </button>
            )}
            <button onClick={onReset} className="btn-danger">
              <ResetIcon /> Reset
            </button>
            <button onClick={onAddTrain} className="btn-primary">
              <PlusIcon /> Add Train
            </button>
          </div>
        </div>

        {/* Progress overview bars */}
        <div className="mt-4 grid grid-cols-4 gap-3">
          {[
            { label: 'Moving',  count: moving,  total: trains.length, color: 'bg-blue-500' },
            { label: 'Waiting', count: waiting, total: trains.length, color: 'bg-slate-500' },
            { label: 'Delayed', count: delayed, total: trains.length, color: 'bg-red-500' },
            { label: 'Arrived', count: arrived, total: trains.length, color: 'bg-green-500' },
          ].map(s => (
            <div key={s.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">{s.label}</span>
                <span className="text-white font-semibold">{s.count}</span>
              </div>
              <div className="progress-bar">
                <div className={`progress-fill ${s.color}`} style={{ width: `${trains.length ? (s.count / trains.length) * 100 : 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Train list */}
      <div className="card flex-1">
        <div className="card-header">Daftar Kereta Aktif ({trains.length})</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/40">
                {['ID', 'Nama', 'Origin → Dest', 'Cargo', 'Gerbong', 'Progress', 'Status', 'Keterlambatan', 'Aksi'].map(h => (
                  <th key={h} className="table-cell text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest pb-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trains.map(train => {
                const sc = STATUS_CONFIG[train.status] || STATUS_CONFIG.waiting
                const originName = NETWORK_NODES.find(n => n.id === train.originId)?.name || train.originId
                const destName = NETWORK_NODES.find(n => n.id === train.destinationId)?.name || train.destinationId
                const pct = Math.round(train.progress * 100)
                return (
                  <tr key={train.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: train.color }} />
                        <span className="font-mono text-xs text-slate-300">{train.id}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="font-medium text-white text-xs">{train.name}</div>
                    </td>
                    <td className="table-cell">
                      <div className="text-xs text-slate-300 whitespace-nowrap">
                        <span className="text-slate-500">{originName.split(' ')[0]}</span>
                        <span className="text-slate-600 mx-1">→</span>
                        <span className="text-slate-300">{destName.split(' ')[0]}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="badge badge-blue text-[10px]">{train.cargoType}</span>
                    </td>
                    <td className="table-cell text-slate-300 text-xs">{train.railCars}</td>
                    <td className="table-cell" style={{ minWidth: 120 }}>
                      <div className="flex items-center gap-2">
                        <div className="progress-bar flex-1">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${pct}%`,
                              background: train.status === 'delayed' ? '#ef4444' : train.color,
                            }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 w-7 text-right">{pct}%</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${sc.badge} text-[10px]`}>{sc.label}</span>
                    </td>
                    <td className="table-cell">
                      {train.delay > 0 ? (
                        <span className="text-red-400 text-xs font-semibold">+{train.delay}m</span>
                      ) : (
                        <span className="text-green-400 text-xs">On Time</span>
                      )}
                    </td>
                    <td className="table-cell">
                      {train.status === 'waiting' && (
                        <button
                          onClick={() => onStartTrain(train.id)}
                          className="px-2 py-1 bg-blue-600/60 hover:bg-blue-500 text-white text-[10px] rounded font-semibold transition-colors"
                        >
                          Berangkat
                        </button>
                      )}
                      {train.status === 'arrived' && (
                        <span className="text-green-400 text-[10px]">✓ Selesai</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Speed chart mini */}
      <div className="card">
        <div className="card-header">Distribusi Kecepatan</div>
        <div className="flex items-end gap-1 h-16">
          {trains.map(train => {
            const h = (train.speed / 160) * 64
            return (
              <div key={train.id} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t transition-all duration-500"
                  style={{ height: h, background: train.color, opacity: train.status === 'arrived' ? 0.3 : 0.8 }}
                />
                <div className="text-[8px] text-slate-600 rotate-0">{train.speed}</div>
              </div>
            )
          })}
        </div>
        <div className="text-[10px] text-slate-600 mt-1 text-right">km/h per kereta</div>
      </div>
    </div>
  )
}

// ─── Icons ──────────────────────────────────────────────────
function PlayIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
}
function PauseIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
}
function ResetIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
}
function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
}
