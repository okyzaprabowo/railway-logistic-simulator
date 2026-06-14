import React, { useState, useMemo } from 'react'
import {
  computeYardEconomics,
  DEFAULT_ECONOMIC_INPUT,
  formatIDR,
  formatIDRShort,
} from '../utils/economicImpact'

/**
 * Panel Dampak Ekonomi Yard.
 * Menyambungkan capacity consumption (UIC 406) → kerugian finansial (Rp).
 *
 * @param {object}  metrics          - metrik simulasi { throughputRate, dwellMin, bottleneck }
 * @param {number}  waitingTrains    - kereta inbound mengantre saat ini
 * @param {number}  avgCarsPerTrain  - gerbong per kereta (dari parameter yard)
 */
export default function YardEconomics({ metrics, waitingTrains, avgCarsPerTrain }) {
  const [input, setInput] = useState(DEFAULT_ECONOMIC_INPUT)

  const setField = (field, value) =>
    setInput(prev => ({ ...prev, [field]: value }))

  const result = useMemo(() => computeYardEconomics(input), [input])

  // Auto-isi sebagian input dari hasil simulasi yard saat ini
  function fillFromSimulation() {
    const util = metrics?.bottleneck?.utilization ?? 0
    const dwell = metrics?.dwellMin ?? 0
    setInput(prev => ({
      ...prev,
      // occupation time = utilisasi bottleneck × jendela waktu
      occupationTimeMin: Math.round(util * prev.timeWindowMin),
      // delay rata-rata didekati dari dwell time hasil simulasi
      averageDelayMin: Math.max(1, Math.round(dwell)),
      // kereta terdampak/hari didekati dari antrean × jam operasi
      affectedTrainsPerDay: Math.max(1, Math.round(Math.max(waitingTrains, 1) * (prev.operatingHoursPerDay / 4))),
      // gerbong per kereta mengikuti parameter simulasi
      carsPerTrain: avgCarsPerTrain || prev.carsPerTrain,
    }))
  }

  // Komposisi total (untuk stacked bar)
  const parts = [
    { label: 'Lost Revenue',   value: result.revenue.lostRevenuePerMonth,        color: '#ef4444' },
    { label: 'Delay Cost',     value: result.delay.delayCostPerMonth,            color: '#f59e0b' },
    { label: 'Tambahan Armada', value: result.fleet.additionalFleetCostPerMonth, color: '#a855f7' },
  ]
  const total = result.totalPerMonth || 1

  const overThreshold = result.lostPaths.excessPercent > 0

  return (
    <div className="card border border-orange-500/20">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1 min-w-[240px]">
          <div className="section-title">💰 Dampak Ekonomi Congestion Yard</div>
          <div className="section-subtitle">
            Capacity consumption (UIC 406) → potensi kerugian finansial dalam rupiah
          </div>
        </div>
        <button onClick={fillFromSimulation} className="btn-primary py-1.5 text-xs">
          ⚡ Isi dari Hasil Simulasi
        </button>
      </div>

      {/* Hero number */}
      <div className={`rounded-xl p-5 mb-4 border ${overThreshold ? 'bg-red-900/20 border-red-500/30' : 'bg-green-900/15 border-green-500/30'}`}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-400 mb-1">
              Estimasi Total Kerugian / Bulan
            </div>
            <div className={`text-4xl font-bold ${overThreshold ? 'text-red-400' : 'text-green-400'}`}>
              {formatIDRShort(result.totalPerMonth)}
            </div>
            <div className="text-sm text-slate-400 mt-1 font-mono">{formatIDR(result.totalPerMonth)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Per Hari</div>
            <div className="text-xl font-semibold text-white">{formatIDRShort(result.totalPerDay)}</div>
            <div className="mt-2">
              {overThreshold ? (
                <span className="badge badge-red">⚠ Di atas ambang aman {input.safeCapacityThresholdPercent}%</span>
              ) : (
                <span className="badge badge-green">✓ Dalam ambang aman</span>
              )}
            </div>
          </div>
        </div>

        {/* Stacked composition bar */}
        <div className="mt-4">
          <div className="flex h-5 rounded-lg overflow-hidden bg-slate-800">
            {parts.map(p => (
              <div key={p.label} title={`${p.label}: ${formatIDR(p.value)}`}
                style={{ width: `${(p.value / total) * 100}%`, background: p.color }} />
            ))}
          </div>
          <div className="flex flex-wrap gap-4 mt-2">
            {parts.map(p => (
              <div key={p.label} className="text-[11px] flex items-center gap-1.5" style={{ color: p.color }}>
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: p.color }} />
                {p.label}: <span className="font-semibold">{formatIDRShort(p.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Capacity consumption chain (UIC 406) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <ChainStat label="Capacity Consumption" value={`${result.capacity.capacityConsumptionPercent}%`}
          sub={`${result.capacity.totalConsumedTime} mnt / ${input.timeWindowMin} mnt`}
          color={result.capacity.capacityConsumptionPercent > input.safeCapacityThresholdPercent ? 'red' : 'green'} />
        <ChainStat label="Kelebihan (Excess)" value={`${result.lostPaths.excessPercent}%`}
          sub={`${result.lostPaths.excessTimeMin} mnt terbuang`} color="orange" />
        <ChainStat label="Lost Train Paths" value={`${result.lostPaths.lostTrainPathsPerDay}`}
          sub="path/hari hilang" color="yellow" />
        <ChainStat label="Tambahan Gerbong" value={`+${result.fleet.additionalCars}`}
          sub={`${result.fleet.normalCars} → ${result.fleet.congestedCars} unit`} color="purple" />
      </div>

      {/* Input groups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Capacity inputs */}
        <InputGroup title="Kapasitas (UIC 406)">
          <NumberField label="Occupation Time" unit="mnt" value={input.occupationTimeMin} onChange={v => setField('occupationTimeMin', v)} />
          <NumberField label="Buffer Time" unit="mnt" value={input.bufferTimeMin} onChange={v => setField('bufferTimeMin', v)} />
          <NumberField label="Supplement Time" unit="mnt" value={input.supplementTimeMin} onChange={v => setField('supplementTimeMin', v)} />
          <NumberField label="Time Window" unit="mnt" value={input.timeWindowMin} onChange={v => setField('timeWindowMin', v)} />
          <NumberField label="Ambang Aman" unit="%" value={input.safeCapacityThresholdPercent} onChange={v => setField('safeCapacityThresholdPercent', v)} />
          <NumberField label="Avg Path Time" unit="mnt" value={input.averagePathTimeMin} onChange={v => setField('averagePathTimeMin', v)} />
          <NumberField label="Jam Operasi/Hari" unit="jam" value={input.operatingHoursPerDay} onChange={v => setField('operatingHoursPerDay', v)} />
        </InputGroup>

        {/* Revenue & delay inputs */}
        <InputGroup title="Pendapatan & Delay (Rp)">
          <NumberField label="Gerbong/Kereta" unit="grb" value={input.carsPerTrain} onChange={v => setField('carsPerTrain', v)} />
          <NumberField label="Ton/Gerbong" unit="ton" value={input.tonPerCar} onChange={v => setField('tonPerCar', v)} />
          <NumberField label="Pendapatan/Ton" unit="Rp" value={input.revenuePerTon} onChange={v => setField('revenuePerTon', v)} big />
          <NumberField label="Kereta Terdampak/Hari" unit="KA" value={input.affectedTrainsPerDay} onChange={v => setField('affectedTrainsPerDay', v)} />
          <NumberField label="Rata-rata Delay" unit="mnt" value={input.averageDelayMin} onChange={v => setField('averageDelayMin', v)} />
          <NumberField label="Biaya Delay/KA/Menit" unit="Rp" value={input.delayCostPerTrainMinute} onChange={v => setField('delayCostPerTrainMinute', v)} big />
          <NumberField label="Hari Operasi/Bulan" unit="hari" value={input.operatingDaysPerMonth} onChange={v => setField('operatingDaysPerMonth', v)} />
        </InputGroup>

        {/* Fleet inputs */}
        <InputGroup title="Tambahan Armada (Rp)">
          <NumberField label="Permintaan Harian" unit="ton" value={input.dailyDemandTon} onChange={v => setField('dailyDemandTon', v)} />
          <NumberField label="Kapasitas/Gerbong" unit="ton" value={input.capacityPerCarTon} onChange={v => setField('capacityPerCarTon', v)} />
          <NumberField label="Siklus Trip Normal" unit="hari" value={input.normalTripCycleDays} onChange={v => setField('normalTripCycleDays', v)} step={0.5} />
          <NumberField label="Siklus Trip Congested" unit="hari" value={input.congestedTripCycleDays} onChange={v => setField('congestedTripCycleDays', v)} step={0.5} />
          <NumberField label="Target Utilisasi" unit="(0-1)" value={input.targetUtilization} onChange={v => setField('targetUtilization', v)} step={0.05} />
          <NumberField label="Biaya Gerbong/Hari" unit="Rp" value={input.costPerCarPerDay} onChange={v => setField('costPerCarPerDay', v)} big />
        </InputGroup>
      </div>

      {/* Detail breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
        <BreakdownCard title="Lost Revenue" color="#ef4444"
          rows={[
            ['Ton/Kereta', `${result.revenue.tonPerTrain.toLocaleString('id-ID')} ton`],
            ['Pendapatan/Kereta', formatIDR(result.revenue.revenuePerTrain)],
            ['Kerugian/Hari', formatIDR(result.revenue.lostRevenuePerDay)],
            ['Kerugian/Bulan', formatIDR(result.revenue.lostRevenuePerMonth)],
          ]} />
        <BreakdownCard title="Delay Cost" color="#f59e0b"
          rows={[
            ['Biaya Delay/Hari', formatIDR(result.delay.delayCostPerDay)],
            ['Biaya Delay/Bulan', formatIDR(result.delay.delayCostPerMonth)],
          ]} />
        <BreakdownCard title="Tambahan Armada" color="#a855f7"
          rows={[
            ['Gerbong Normal', `${result.fleet.normalCars} unit`],
            ['Gerbong Congested', `${result.fleet.congestedCars} unit`],
            ['Tambahan', `${result.fleet.additionalCars} unit`],
            ['Biaya/Bulan', formatIDR(result.fleet.additionalFleetCostPerMonth)],
          ]} />
      </div>

      <div className="text-[10px] text-slate-600 mt-3">
        Metodologi: UIC Leaflet 406 (capacity consumption) · angka biaya bersifat parametrik/placeholder — sesuaikan dengan data aktual KAI.
      </div>
    </div>
  )
}

// ─── Sub-komponen ───────────────────────────────────────────

function ChainStat({ label, value, sub, color }) {
  const map = {
    red: 'text-red-400', green: 'text-green-400',
    orange: 'text-orange-400', yellow: 'text-yellow-400', purple: 'text-purple-400',
  }
  return (
    <div className="bg-slate-700/20 rounded-xl p-3">
      <div className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</div>
      <div className={`text-xl font-bold ${map[color]}`}>{value}</div>
      <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>
    </div>
  )
}

function InputGroup({ title, children }) {
  return (
    <div className="bg-slate-700/15 rounded-xl p-3">
      <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function NumberField({ label, unit, value, onChange, step = 1, big }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-slate-400 flex-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value}
          step={step}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className={`input-field py-1 text-xs text-right ${big ? 'w-32' : 'w-20'}`}
        />
      </div>
      <span className="text-[10px] text-slate-600 w-10">{unit}</span>
    </div>
  )
}

function BreakdownCard({ title, color, rows }) {
  return (
    <div className="bg-slate-700/15 rounded-xl p-3 border-l-2" style={{ borderColor: color }}>
      <div className="text-xs font-semibold mb-2" style={{ color }}>{title}</div>
      <div className="space-y-1.5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between items-center text-xs">
            <span className="text-slate-400">{k}</span>
            <span className="font-semibold text-white font-mono">{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
