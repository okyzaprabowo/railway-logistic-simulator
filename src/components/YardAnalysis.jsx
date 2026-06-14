import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  DEFAULT_YARD_PARAMS,
  createYardState,
  stepYard,
  runScenario,
  buildCapacityCurve,
  buildDwellHistogram,
} from '../utils/yardSimulation'
import YardEconomics from './YardEconomics'

// Setiap tick nyata (150ms) memajukan SIM_DT menit simulasi
const TICK_MS = 150
const SIM_DT = 2

export default function YardAnalysis() {
  const [params, setParams] = useState(DEFAULT_YARD_PARAMS)
  const [state, setState] = useState(createYardState())
  const [isRunning, setIsRunning] = useState(false)
  const [capacityCurve, setCapacityCurve] = useState([])

  const paramsRef = useRef(params)
  const stateRef = useRef(state)
  useEffect(() => { paramsRef.current = params }, [params])
  useEffect(() => { stateRef.current = state }, [state])

  // Loop simulasi
  useEffect(() => {
    if (!isRunning) return
    const id = setInterval(() => {
      setState(stepYard(stateRef.current, paramsRef.current, SIM_DT))
    }, TICK_MS)
    return () => clearInterval(id)
  }, [isRunning])

  function reset() {
    setIsRunning(false)
    setState(createYardState())
  }

  // Ubah parameter section (capacity / serviceRate)
  function setSection(sectionKey, field, value) {
    setParams(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionKey]: { ...prev.sections[sectionKey], [field]: value },
      },
    }))
  }
  function setTop(field, value) {
    setParams(prev => ({ ...prev, [field]: value }))
  }

  // Jalankan skenario 24 jam (fast-forward) lalu pakai hasilnya sebagai state
  function run24h() {
    setIsRunning(false)
    setState(runScenario(params, 24, SIM_DT))
  }

  // Hitung kurva kapasitas: throughput & dwell vs laju kedatangan λ
  function computeCapacityCurve() {
    const lambdas = [2, 4, 6, 8, 10, 12, 14, 16]
    setCapacityCurve(buildCapacityCurve(params, lambdas, 10))
  }

  const m = state.metrics || {
    throughputRate: 0, dwellMin: 0, L: 0,
    util: { arrival: 0, classification: 0, departure: 0 },
    bottleneck: { section: 'arrival', utilization: 0, level: 'normal' },
  }

  const dwellHist = useMemo(() => buildDwellHistogram(state.dwellSamples, 10), [state.dwellSamples])

  const bottleneckColor = {
    normal:   'text-green-400',
    warning:  'text-yellow-400',
    critical: 'text-red-400',
  }[m.bottleneck.level]

  const sectionMeta = [
    { key: 'arrival',        color: '#3b82f6', label: 'Arrival' },
    { key: 'classification', color: '#f59e0b', label: 'Classification' },
    { key: 'departure',      color: '#10b981', label: 'Departure' },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Header + kontrol */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[240px]">
            <div className="section-title">Yard Capacity Simulator</div>
            <div className="section-subtitle">
              Model antrean 3-tahap (Arrival → Classification → Departure) · kedatangan Poisson · dwell via Little's Law
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-xs text-slate-400 mr-2 font-mono">
              t = {formatClock(state.clock)}
            </div>
            {isRunning ? (
              <button onClick={() => setIsRunning(false)} className="btn-secondary">⏸ Pause</button>
            ) : (
              <button onClick={() => setIsRunning(true)} className="btn-success">▶ Run</button>
            )}
            <button onClick={run24h} className="btn-primary">⏩ Run 24 Jam</button>
            <button onClick={reset} className="btn-danger">↺ Reset</button>
          </div>
        </div>
      </div>

      {/* KPI cards — semua dihitung dari simulasi */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Throughput"
          value={m.throughputRate.toFixed(0)}
          unit="gerbong/jam"
          color="green"
          hint="Laju dispatch keluar yard"
        />
        <KpiCard
          label="Avg Dwell Time"
          value={m.dwellMin.toFixed(0)}
          unit="menit (W = L/λ)"
          color="purple"
          hint={`L = ${m.L.toFixed(0)} gerbong dalam sistem`}
        />
        <KpiCard
          label="Kereta Mengantre"
          value={state.waitingTrains}
          unit="inbound waiting"
          color={state.waitingTrains >= 3 ? 'red' : state.waitingTrains >= 1 ? 'yellow' : 'green'}
          hint={`${state.inboundCars.toFixed(0)} gerbong di luar`}
        />
        <KpiCard
          label="Bottleneck"
          value={capitalize(m.bottleneck.section)}
          unit={`${(m.bottleneck.utilization * 100).toFixed(0)}% utilisasi`}
          color={m.bottleneck.level === 'critical' ? 'red' : m.bottleneck.level === 'warning' ? 'yellow' : 'green'}
          hint={m.bottleneck.level === 'critical' ? '⚠ Kapasitas kritis' : 'Seksi tersibuk'}
          small
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Live yard sections */}
        <div className="card xl:col-span-2">
          <div className="card-header">Okupansi Seksi — Real-time</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sectionMeta.map(sec => {
              const occ = state.occupied[sec.key]
              const capacity = params.sections[sec.key].capacity
              const pct = Math.round((occ / capacity) * 100)
              const status = pct >= 85 ? 'CONGESTED' : pct >= 50 ? 'BUSY' : 'AVAILABLE'
              const statusBadge = pct >= 85 ? 'badge-red' : pct >= 50 ? 'badge-yellow' : 'badge-green'
              const barColor = pct >= 85 ? 'bg-red-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-green-500'
              return (
                <div key={sec.key} className="bg-slate-700/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: sec.color }} />
                      <span className="font-semibold text-white text-sm">{sec.label}</span>
                    </div>
                    <span className={`badge ${statusBadge} text-[10px]`}>{status}</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{pct}%</div>
                  <div className="text-xs text-slate-400 mb-2">{occ.toFixed(0)}/{capacity} slot · {params.sections[sec.key].serviceRate} grb/jam</div>
                  <div className="progress-bar h-2.5">
                    <div className={`progress-fill ${barColor}`} style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                  {/* Slot grid */}
                  <div className="mt-3 flex flex-wrap gap-0.5">
                    {Array.from({ length: capacity }).map((_, i) => (
                      <div
                        key={i}
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{
                          background: i < occ
                            ? (pct >= 85 ? '#ef4444' : pct >= 50 ? '#f59e0b' : '#10b981')
                            : 'rgba(148,163,184,0.1)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Flow diagram inbound → out */}
          <div className="mt-4 flex items-center gap-2 text-xs">
            <FlowBox label="Inbound" value={`${state.waitingTrains} KA`} color="#64748b" pulse={state.waitingTrains > 0} />
            <Arrow />
            <FlowBox label="Arrival" value={state.occupied.arrival.toFixed(0)} color="#3b82f6" />
            <Arrow />
            <FlowBox label="Classify" value={state.occupied.classification.toFixed(0)} color="#f59e0b" />
            <Arrow />
            <FlowBox label="Departure" value={state.occupied.departure.toFixed(0)} color="#10b981" />
            <Arrow />
            <FlowBox label="Dispatch" value={`${state.cumDispatched.toFixed(0)} grb`} color="#22c55e" />
          </div>
        </div>

        {/* What-if controls */}
        <div className="card">
          <div className="card-header">What-If Parameters</div>
          <div className="space-y-4">
            <Slider label="Laju Kedatangan (λ)" unit="KA/jam" value={params.arrivalRate} min={1} max={20} step={1}
              onChange={v => setTop('arrivalRate', v)} color="#3b82f6" />
            <Slider label="Gerbong / Kereta" unit="gerbong" value={params.avgCarsPerTrain} min={8} max={60} step={2}
              onChange={v => setTop('avgCarsPerTrain', v)} color="#8b5cf6" />
            <div className="border-t border-slate-700/40 pt-3">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Kapasitas Jalur (slot)</div>
              {sectionMeta.map(sec => (
                <Slider key={sec.key} label={sec.label} unit="slot"
                  value={params.sections[sec.key].capacity} min={10} max={100} step={5}
                  onChange={v => setSection(sec.key, 'capacity', v)} color={sec.color} dense />
              ))}
            </div>
            <div className="border-t border-slate-700/40 pt-3">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Laju Layanan (gerbong/jam)</div>
              {sectionMeta.map(sec => (
                <Slider key={sec.key} label={sec.label} unit="grb/jam"
                  value={params.sections[sec.key].serviceRate} min={60} max={400} step={20}
                  onChange={v => setSection(sec.key, 'serviceRate', v)} color={sec.color} dense />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grafik time-series */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-header">Okupansi Seksi vs Waktu</div>
          <TimeSeriesChart
            data={state.history}
            series={sectionMeta.map(s => ({ key: s.key, color: s.color, label: s.label }))}
            height={180}
          />
        </div>
        <div className="card">
          <div className="card-header">Throughput & Kereta Mengantre vs Waktu</div>
          <TimeSeriesChart
            data={state.history}
            series={[
              { key: 'throughput', color: '#22c55e', label: 'Throughput (grb/jam)' },
              { key: 'waiting', color: '#ef4444', label: 'Antrean (KA ×10)', scale: 10 },
            ]}
            height={180}
          />
        </div>
      </div>

      {/* Dwell histogram + capacity curve */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-header">Distribusi Dwell Time (histogram)</div>
          {dwellHist.length > 0 ? (
            <Histogram bins={dwellHist} color="#a855f7" unit="mnt" />
          ) : (
            <EmptyHint text="Jalankan simulasi untuk mengumpulkan sampel dwell time" />
          )}
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="card-header mb-0">Kurva Kapasitas (throughput vs λ)</div>
            <button onClick={computeCapacityCurve} className="btn-secondary py-1 text-xs">Hitung</button>
          </div>
          {capacityCurve.length > 0 ? (
            <CapacityCurve data={capacityCurve} />
          ) : (
            <EmptyHint text="Klik 'Hitung' untuk menjalankan skenario λ = 2..16 KA/jam dan menemukan titik saturasi yard" />
          )}
        </div>
      </div>

      {/* Dampak ekonomi dalam rupiah */}
      <YardEconomics
        metrics={m}
        waitingTrains={state.waitingTrains}
        avgCarsPerTrain={params.avgCarsPerTrain}
      />
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// Sub-komponen UI
// ════════════════════════════════════════════════════════════

function KpiCard({ label, value, unit, color, hint, small }) {
  const map = {
    green:  'border-green-500/30 bg-green-500/5',
    purple: 'border-purple-500/30 bg-purple-500/5',
    red:    'border-red-500/30 bg-red-500/5',
    yellow: 'border-yellow-500/30 bg-yellow-500/5',
  }
  const textMap = {
    green: 'text-green-400', purple: 'text-purple-400',
    red: 'text-red-400', yellow: 'text-yellow-400',
  }
  return (
    <div className={`card border ${map[color]}`}>
      <div className="card-header mb-1">{label}</div>
      <div className={`font-bold text-white ${small ? 'text-xl' : 'text-3xl'}`}>{value}</div>
      <div className={`text-xs mt-0.5 ${textMap[color]}`}>{unit}</div>
      {hint && <div className="text-[10px] text-slate-500 mt-1">{hint}</div>}
    </div>
  )
}

function Slider({ label, unit, value, min, max, step, onChange, color, dense }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className={dense ? 'mb-2' : ''}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-slate-300">{label}</span>
        <span className="text-xs font-mono font-semibold" style={{ color }}>{value} <span className="text-slate-500">{unit}</span></span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
        style={{ background: `linear-gradient(to right, ${color} ${pct}%, #1e293b ${pct}%)` }}
      />
    </div>
  )
}

function FlowBox({ label, value, color, pulse }) {
  return (
    <div className="flex-1 rounded-lg px-2 py-2 text-center border" style={{ borderColor: color + '40', background: color + '12' }}>
      <div className="text-[9px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`text-sm font-bold ${pulse ? 'blink' : ''}`} style={{ color }}>{value}</div>
    </div>
  )
}

function Arrow() {
  return <div className="text-slate-600 text-xs shrink-0">▶</div>
}

function EmptyHint({ text }) {
  return (
    <div className="flex items-center justify-center text-center text-xs text-slate-500 py-10 px-4">
      {text}
    </div>
  )
}

// ─── Time-series chart (multi-series, auto-scale) ───────────
function TimeSeriesChart({ data, series, height = 180 }) {
  const width = 480
  const pad = { top: 10, right: 10, bottom: 20, left: 32 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom

  if (!data || data.length < 2) {
    return <EmptyHint text="Menunggu data simulasi…" />
  }

  // skala Y dari semua seri (dengan faktor scale opsional)
  let maxY = 0
  series.forEach(s => {
    data.forEach(d => {
      const v = (d[s.key] || 0) * (s.scale || 1)
      if (v > maxY) maxY = v
    })
  })
  maxY = maxY || 1
  const n = data.length
  const x = i => pad.left + (i / (n - 1)) * innerW
  const y = v => pad.top + innerH - (v / maxY) * innerH

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: height }}>
        {/* gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map(f => (
          <g key={f}>
            <line x1={pad.left} y1={pad.top + innerH * f} x2={width - pad.right} y2={pad.top + innerH * f}
              stroke="rgba(148,163,184,0.08)" strokeWidth="1" />
            <text x={pad.left - 4} y={pad.top + innerH * f + 3} textAnchor="end" fill="#475569" fontSize="8">
              {Math.round(maxY * (1 - f))}
            </text>
          </g>
        ))}
        {series.map(s => {
          const path = data.map((d, i) => {
            const v = (d[s.key] || 0) * (s.scale || 1)
            return `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`
          }).join(' ')
          return <path key={s.key} d={path} fill="none" stroke={s.color} strokeWidth="1.8" opacity="0.9" />
        })}
      </svg>
      <div className="flex flex-wrap gap-3 mt-1">
        {series.map(s => (
          <span key={s.key} className="text-[10px] flex items-center gap-1" style={{ color: s.color }}>
            <span className="w-3 h-0.5 rounded" style={{ background: s.color }} />{s.label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Histogram ──────────────────────────────────────────────
function Histogram({ bins, color, unit }) {
  const width = 480, height = 180
  const pad = { top: 10, right: 10, bottom: 26, left: 28 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom
  const maxCount = Math.max(...bins.map(b => b.count), 1)
  const barW = innerW / bins.length

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: height }}>
      {bins.map((b, i) => {
        const h = (b.count / maxCount) * innerH
        return (
          <g key={i}>
            <rect
              x={pad.left + i * barW + 2} y={pad.top + innerH - h}
              width={barW - 4} height={h}
              fill={color} opacity="0.8" rx="2"
            />
            <text x={pad.left + i * barW + barW / 2} y={height - 14} textAnchor="middle" fill="#475569" fontSize="7">
              {Math.round(b.binStart)}
            </text>
          </g>
        )
      })}
      <text x={width / 2} y={height - 2} textAnchor="middle" fill="#64748b" fontSize="9">Dwell time ({unit})</text>
    </svg>
  )
}

// ─── Capacity curve (throughput & dwell vs λ) ───────────────
function CapacityCurve({ data }) {
  const width = 480, height = 180
  const pad = { top: 10, right: 36, bottom: 26, left: 32 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom

  const maxTh = Math.max(...data.map(d => d.throughput), 1)
  const maxDw = Math.max(...data.map(d => d.dwell), 1)
  const maxL = Math.max(...data.map(d => d.lambda), 1)
  const minL = Math.min(...data.map(d => d.lambda), 0)
  const x = l => pad.left + ((l - minL) / (maxL - minL || 1)) * innerW
  const yTh = v => pad.top + innerH - (v / maxTh) * innerH
  const yDw = v => pad.top + innerH - (v / maxDw) * innerH

  const thPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(d.lambda).toFixed(1)} ${yTh(d.throughput).toFixed(1)}`).join(' ')
  const dwPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(d.lambda).toFixed(1)} ${yDw(d.dwell).toFixed(1)}`).join(' ')

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: height }}>
        {[0, 0.5, 1].map(f => (
          <line key={f} x1={pad.left} y1={pad.top + innerH * f} x2={width - pad.right} y2={pad.top + innerH * f}
            stroke="rgba(148,163,184,0.08)" strokeWidth="1" />
        ))}
        {/* throughput (hijau) */}
        <path d={thPath} fill="none" stroke="#22c55e" strokeWidth="2" />
        {data.map((d, i) => <circle key={i} cx={x(d.lambda)} cy={yTh(d.throughput)} r="2.5" fill="#22c55e" />)}
        {/* dwell (merah, sumbu kanan) */}
        <path d={dwPath} fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 3" />
        {data.map((d, i) => <circle key={i} cx={x(d.lambda)} cy={yDw(d.dwell)} r="2.5" fill="#ef4444" />)}
        {/* x labels */}
        {data.map((d, i) => (
          <text key={i} x={x(d.lambda)} y={height - 14} textAnchor="middle" fill="#475569" fontSize="8">{d.lambda}</text>
        ))}
        <text x={width / 2} y={height - 2} textAnchor="middle" fill="#64748b" fontSize="9">Laju kedatangan λ (KA/jam)</text>
      </svg>
      <div className="flex gap-4 mt-1">
        <span className="text-[10px] flex items-center gap-1 text-green-400"><span className="w-3 h-0.5 bg-green-500" />Throughput (grb/jam)</span>
        <span className="text-[10px] flex items-center gap-1 text-red-400"><span className="w-3 h-0.5 bg-red-500" style={{ borderTop: '1px dashed' }} />Dwell time (mnt)</span>
      </div>
    </div>
  )
}

// ─── helpers ────────────────────────────────────────────────
function formatClock(min) {
  const h = Math.floor(min / 60)
  const mm = Math.floor(min % 60)
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}
function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
