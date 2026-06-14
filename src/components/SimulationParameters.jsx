import React from 'react'

const PARAM_DEFS = [
  {
    key: 'simulationSpeed',
    label: 'Simulation Speed',
    unit: 'x',
    min: 1, max: 10, step: 1,
    description: 'Multiplier kecepatan waktu simulasi',
    color: 'blue',
    getValue: v => `${v}x`,
  },
  {
    key: 'trainArrivalRate',
    label: 'Train Arrival Rate',
    unit: 'kereta/jam',
    min: 1, max: 20, step: 1,
    description: 'Frekuensi kedatangan kereta baru di jaringan',
    color: 'green',
    getValue: v => v,
  },
  {
    key: 'loadingUnloadingTime',
    label: 'Loading/Unloading Time',
    unit: 'menit',
    min: 5, max: 120, step: 5,
    description: 'Durasi rata-rata bongkar/muat di stasiun atau yard',
    color: 'purple',
    getValue: v => `${v}m`,
  },
  {
    key: 'yardCapacity',
    label: 'Yard Capacity',
    unit: 'posisi',
    min: 20, max: 300, step: 10,
    description: 'Kapasitas maksimum yard utama (Cikarang)',
    color: 'orange',
    getValue: v => v,
  },
  {
    key: 'delayProbability',
    label: 'Delay Probability',
    unit: '%',
    min: 0, max: 100, step: 1,
    description: 'Probabilitas keterlambatan acak per interval',
    color: 'red',
    getValue: v => `${Math.round(v * 100)}%`,
    displayVal: v => Math.round(v * 100),
    parseVal: v => v / 100,
  },
  {
    key: 'maintenanceThreshold',
    label: 'Maintenance Threshold',
    unit: 'skor',
    min: 20, max: 90, step: 5,
    description: 'Condition score minimum sebelum maintenance wajib',
    color: 'yellow',
    getValue: v => v,
  },
]

const colorSlider = {
  blue:   '#3b82f6',
  green:  '#10b981',
  purple: '#8b5cf6',
  orange: '#f97316',
  red:    '#ef4444',
  yellow: '#f59e0b',
}

export default function SimulationParameters({ params, onParamChange }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="card">
        <div className="section-title">Parameter Simulasi</div>
        <div className="section-subtitle">Ubah parameter untuk menyesuaikan kondisi simulasi secara real-time</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PARAM_DEFS.map(def => {
          const raw = params[def.key]
          const displayValue = def.displayVal ? def.displayVal(raw) : raw
          const sliderValue = def.displayVal ? def.displayVal(raw) : raw

          return (
            <div key={def.key} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-white text-sm">{def.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{def.description}</div>
                </div>
                <div
                  className="text-xl font-bold font-mono px-3 py-1 rounded-lg"
                  style={{ color: colorSlider[def.color], background: colorSlider[def.color] + '15' }}
                >
                  {def.getValue(raw)}
                </div>
              </div>

              <div className="space-y-2">
                <input
                  type="range"
                  min={def.displayVal ? def.displayVal(def.min) : def.min}
                  max={def.displayVal ? def.displayVal(def.max) : def.max}
                  step={def.step}
                  value={sliderValue}
                  onChange={e => {
                    const v = parseFloat(e.target.value)
                    onParamChange(def.key, def.parseVal ? def.parseVal(v) : v)
                  }}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${colorSlider[def.color]} 0%, ${colorSlider[def.color]} ${
                      ((sliderValue - (def.displayVal ? def.displayVal(def.min) : def.min)) /
                      ((def.displayVal ? def.displayVal(def.max) : def.max) - (def.displayVal ? def.displayVal(def.min) : def.min))) * 100
                    }%, #1e293b ${
                      ((sliderValue - (def.displayVal ? def.displayVal(def.min) : def.min)) /
                      ((def.displayVal ? def.displayVal(def.max) : def.max) - (def.displayVal ? def.displayVal(def.min) : def.min))) * 100
                    }%, #1e293b 100%)`,
                  }}
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>{def.displayVal ? def.displayVal(def.min) : def.min} {def.unit}</span>
                  <span>{def.displayVal ? def.displayVal(def.max) : def.max} {def.unit}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Current params summary */}
      <div className="card">
        <div className="card-header">Konfigurasi Aktif</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {PARAM_DEFS.map(def => (
            <div key={def.key} className="flex items-center gap-3 bg-slate-700/20 rounded-lg px-3 py-2">
              <div
                className="w-2 h-8 rounded-full shrink-0"
                style={{ background: colorSlider[def.color] }}
              />
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wide leading-tight">{def.label}</div>
                <div className="text-sm font-semibold text-white">{def.getValue(params[def.key])}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Impact analysis */}
        <div className="mt-4 bg-[#0a0f1e] rounded-xl p-4 border border-slate-700/30">
          <div className="text-xs font-semibold text-slate-400 mb-3">Analisis Dampak Parameter</div>
          <div className="space-y-2 text-xs text-slate-400">
            {params.delayProbability > 0.3 && (
              <div className="flex items-start gap-2 text-yellow-400">
                <span>⚠</span>
                <span>Delay probability tinggi ({Math.round(params.delayProbability * 100)}%) — ekspektasi banyak keterlambatan</span>
              </div>
            )}
            {params.yardCapacity < 80 && (
              <div className="flex items-start gap-2 text-red-400">
                <span>⚠</span>
                <span>Kapasitas yard rendah ({params.yardCapacity}) — risiko congestion tinggi</span>
              </div>
            )}
            {params.simulationSpeed >= 4 && (
              <div className="flex items-start gap-2 text-blue-400">
                <span>ℹ</span>
                <span>Mode fast-forward ({params.simulationSpeed}x) — event log akan update lebih cepat</span>
              </div>
            )}
            {params.maintenanceThreshold > 70 && (
              <div className="flex items-start gap-2 text-orange-400">
                <span>ℹ</span>
                <span>Threshold maintenance tinggi ({params.maintenanceThreshold}) — lebih banyak aset akan diklasifikasikan perlu maintenance</span>
              </div>
            )}
            {params.delayProbability <= 0.1 && params.yardCapacity >= 100 && (
              <div className="flex items-start gap-2 text-green-400">
                <span>✓</span>
                <span>Parameter optimal — kondisi operasional ideal</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
