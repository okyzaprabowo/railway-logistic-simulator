import React, { useState } from 'react'
import { calculateFleetOptimization } from '../utils/simulationEngine'

const PRESETS = [
  { label: 'Argo Bromo (Eksklusif)', dailyDemand: 2400, carCapacity: 80, avgTripHours: 12, targetUtilization: 80, currentFleet: 30 },
  { label: 'Freight Container',       dailyDemand: 8000, carCapacity: 40, avgTripHours: 16, targetUtilization: 85, currentFleet: 50 },
  { label: 'Ekonomi Regional',        dailyDemand: 5000, carCapacity: 106,avgTripHours: 8,  targetUtilization: 75, currentFleet: 40 },
]

export default function FleetOptimization({ fleetAssets }) {
  const [inputs, setInputs] = useState(PRESETS[0])

  const result = calculateFleetOptimization(inputs)

  const setField = (field, value) => setInputs(prev => ({ ...prev, [field]: parseFloat(value) || 0 }))

  const fleetByType = {
    locomotive: fleetAssets.filter(a => a.type === 'locomotive').length,
    railcar:    fleetAssets.filter(a => a.type === 'railcar').length,
  }
  const activeAssets = fleetAssets.filter(a => a.status === 'active').length
  const inMaintenance = fleetAssets.filter(a => a.status === 'maintenance' || a.status === 'critical').length

  return (
    <div className="flex flex-col gap-4">
      <div className="card">
        <div className="section-title">Fleet Optimization Panel</div>
        <div className="section-subtitle">Hitung kebutuhan jumlah gerbong optimal berdasarkan parameter operasional</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Input panel */}
        <div className="md:col-span-2 card">
          <div className="card-header">Parameter Input</div>

          {/* Quick presets */}
          <div className="flex gap-2 flex-wrap mb-5">
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => setInputs(p)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-600/50 bg-slate-700/30 hover:border-orange-500/40 hover:text-orange-300 text-slate-400 transition-all"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Daily Cargo Demand"
              unit="penumpang/ton/TEU"
              value={inputs.dailyDemand}
              onChange={v => setField('dailyDemand', v)}
              hint="Total demand per hari"
            />
            <InputField
              label="Kapasitas per Gerbong"
              unit="seats/ton/TEU"
              value={inputs.carCapacity}
              onChange={v => setField('carCapacity', v)}
              hint="Kapasitas 1 unit gerbong"
            />
            <InputField
              label="Rata-rata Durasi Trip"
              unit="jam"
              value={inputs.avgTripHours}
              onChange={v => setField('avgTripHours', v)}
              hint="Termasuk bongkar muat"
            />
            <InputField
              label="Target Utilisasi"
              unit="%"
              value={inputs.targetUtilization}
              onChange={v => setField('targetUtilization', v)}
              hint="Efisiensi penggunaan fleet"
              min={10} max={100}
            />
            <InputField
              label="Fleet Saat Ini"
              unit="unit"
              value={inputs.currentFleet}
              onChange={v => setField('currentFleet', v)}
              hint="Jumlah gerbong existing"
            />
          </div>

          {/* Formula display */}
          <div className="mt-5 bg-[#0a0f1e] rounded-xl p-4 border border-slate-700/30">
            <div className="text-xs font-semibold text-slate-400 mb-2">Formula Kalkulasi</div>
            <div className="font-mono text-xs text-orange-300 leading-relaxed">
              recommendedCars = ⌈ (dailyDemand / carCapacity) × (avgTripHours / 24) / (targetUtilization / 100) ⌉
            </div>
            <div className="font-mono text-xs text-slate-500 mt-2">
              = ⌈ ({inputs.dailyDemand} / {inputs.carCapacity}) × ({inputs.avgTripHours} / 24) / ({inputs.targetUtilization} / 100) ⌉
            </div>
            <div className="font-mono text-xs text-green-400 mt-1">
              = <strong>{result.recommended}</strong> gerbong
            </div>
          </div>
        </div>

        {/* Result panel */}
        <div className="flex flex-col gap-3">
          {/* Main result */}
          <div className={`card border-2 ${result.status === 'shortage' ? 'border-red-500/40' : 'border-green-500/40'}`}>
            <div className="text-center py-2">
              <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Rekomendasi Fleet</div>
              <div className="text-5xl font-bold text-white">{result.recommended}</div>
              <div className="text-xs text-slate-400 mt-1">unit gerbong</div>
            </div>

            <div className="border-t border-slate-700/40 pt-3 mt-3 space-y-2.5">
              <ResultRow
                label="Est. Utilisasi"
                value={`${result.utilization}%`}
                color={result.utilization >= 85 ? 'text-red-400' : result.utilization >= 70 ? 'text-yellow-400' : 'text-green-400'}
              />
              <ResultRow label="Trips/Hari" value={result.tripsPerDay} color="text-blue-400" />
              <ResultRow label="Fleet Saat Ini" value={inputs.currentFleet} color="text-slate-300" />
              <ResultRow
                label="Surplus / Kekurangan"
                value={result.surplus >= 0 ? `+${result.surplus} (surplus)` : `${result.surplus} (kurang)`}
                color={result.surplus >= 0 ? 'text-green-400' : 'text-red-400'}
              />
            </div>
          </div>

          {/* Surplus/shortage indicator */}
          <div className={`card text-center ${result.status === 'shortage' ? 'bg-red-900/20 border-red-500/30' : 'bg-green-900/20 border-green-500/30'} border`}>
            <div className="text-3xl mb-1">{result.status === 'shortage' ? '⚠' : '✓'}</div>
            <div className={`font-bold text-sm ${result.status === 'shortage' ? 'text-red-400' : 'text-green-400'}`}>
              {result.status === 'shortage' ? 'Fleet Tidak Mencukupi' : 'Fleet Mencukupi'}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {result.status === 'shortage'
                ? `Tambah ${Math.abs(result.surplus)} gerbong`
                : `Kapasitas lebih ${result.surplus} unit`}
            </div>
          </div>

          {/* Utilization bar */}
          <div className="card">
            <div className="text-xs text-slate-400 mb-2">Utilisasi Estimasi</div>
            <div className="progress-bar h-4 rounded-lg">
              <div
                className={`progress-fill rounded-lg ${result.utilization >= 90 ? 'bg-red-500' : result.utilization >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(100, result.utilization)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>0%</span>
              <span className="font-semibold text-white">{result.utilization}%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fleet composition */}
      <div className="card">
        <div className="card-header">Komposisi Fleet Saat Ini</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FleetStat label="Total Lokomotif" value={fleetByType.locomotive} color="blue" />
          <FleetStat label="Total Gerbong" value={fleetByType.railcar} color="purple" />
          <FleetStat label="Aset Aktif" value={activeAssets} color="green" />
          <FleetStat label="Dalam Perawatan" value={inMaintenance} color="red" />
        </div>

        {/* Fleet breakdown bar */}
        <div className="mt-4">
          <div className="text-xs text-slate-400 mb-2">Status Fleet — {fleetAssets.length} total aset</div>
          <div className="flex h-6 rounded-lg overflow-hidden">
            {[
              { status: 'active',      color: '#10b981', count: activeAssets },
              { status: 'maintenance', color: '#f97316', count: fleetAssets.filter(a => a.status === 'maintenance').length },
              { status: 'critical',    color: '#ef4444', count: fleetAssets.filter(a => a.status === 'critical').length },
            ].map(s => {
              const w = (s.count / fleetAssets.length) * 100
              return (
                <div
                  key={s.status}
                  title={`${s.status}: ${s.count}`}
                  style={{ width: `${w}%`, background: s.color }}
                />
              )
            })}
          </div>
          <div className="flex gap-4 mt-2 flex-wrap">
            {['active', 'maintenance', 'critical'].map((s, i) => {
              const colors = ['text-green-400', 'text-orange-400', 'text-red-400']
              const counts = [activeAssets, fleetAssets.filter(a => a.status === 'maintenance').length, fleetAssets.filter(a => a.status === 'critical').length]
              return (
                <div key={s} className={`text-xs ${colors[i]}`}>
                  ■ {s}: {counts[i]}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function InputField({ label, unit, value, onChange, hint, min, max }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-300 mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          min={min}
          max={max}
          className="input-field pr-16"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 whitespace-nowrap">{unit}</span>
      </div>
      {hint && <div className="text-[10px] text-slate-600 mt-0.5">{hint}</div>}
    </div>
  )
}

function ResultRow({ label, value, color }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`text-xs font-semibold ${color}`}>{value}</span>
    </div>
  )
}

function FleetStat({ label, value, color }) {
  const colorMap = {
    blue:   'bg-blue-500/10 border-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    green:  'bg-green-500/10 border-green-500/20 text-green-400',
    red:    'bg-red-500/10 border-red-500/20 text-red-400',
  }
  return (
    <div className={`rounded-xl border p-3 ${colorMap[color]}`}>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs opacity-70 mt-0.5">{label}</div>
    </div>
  )
}
