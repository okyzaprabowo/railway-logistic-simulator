import React, { useRef, useEffect } from 'react'

const EVENT_CONFIG = {
  departure:   { icon: '🚆', color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20',   label: 'DEPARTURE' },
  arrival:     { icon: '🟢', color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20',  label: 'ARRIVAL' },
  congestion:  { icon: '🔴', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20',label: 'CONGESTION' },
  maintenance: { icon: '🔧', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20',label: 'MAINTENANCE' },
  delay:       { icon: '⚠️', color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20',      label: 'DELAY' },
}

const SEVERITY_STRIP = {
  info:    'bg-blue-500',
  warning: 'bg-yellow-500',
  error:   'bg-red-500',
}

export default function EventLog({ events, maxHeight = 420 }) {
  const bottomRef = useRef(null)

  // Auto-scroll to latest (events are newest-first so scroll to top)
  useEffect(() => {
    // newest event is at index 0, so we scroll container to top
  }, [events.length])

  const counts = {
    total:      events.length,
    departure:  events.filter(e => e.type === 'departure').length,
    arrival:    events.filter(e => e.type === 'arrival').length,
    delay:      events.filter(e => e.type === 'delay').length,
    congestion: events.filter(e => e.type === 'congestion').length,
    maintenance:events.filter(e => e.type === 'maintenance').length,
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Summary row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {[
          { label: 'Total', value: counts.total, color: 'text-slate-300' },
          { label: 'Departure', value: counts.departure, color: 'text-blue-400' },
          { label: 'Arrival', value: counts.arrival, color: 'text-green-400' },
          { label: 'Delay', value: counts.delay, color: 'text-red-400' },
          { label: 'Congestion', value: counts.congestion, color: 'text-yellow-400' },
          { label: 'Maintenance', value: counts.maintenance, color: 'text-orange-400' },
        ].map(s => (
          <div key={s.label} className="card text-center py-2">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Log entries */}
      <div
        className="card p-0 overflow-hidden"
        style={{ maxHeight }}
      >
        <div className="px-4 py-3 border-b border-slate-700/40 flex items-center justify-between">
          <div className="text-sm font-bold text-white">Event Log</div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-slate-400">Live</span>
          </div>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: maxHeight - 52 }}>
          {events.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              Belum ada event. Mulai simulasi untuk melihat log.
            </div>
          ) : (
            <div className="divide-y divide-slate-700/20">
              {events.map((event, i) => {
                const cfg = EVENT_CONFIG[event.type] || EVENT_CONFIG.departure
                const strip = SEVERITY_STRIP[event.severity] || SEVERITY_STRIP.info
                return (
                  <div
                    key={event.id || i}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-700/10 transition-colors relative ${i === 0 ? 'bg-slate-700/20' : ''}`}
                  >
                    {/* Severity strip */}
                    <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${strip}`} />

                    <div className="text-base shrink-0 mt-0.5">{cfg.icon}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-bold ${cfg.color}`}>{cfg.label}</span>
                        {i === 0 && <span className="badge badge-orange text-[9px]">NEW</span>}
                      </div>
                      <div className="text-xs text-slate-200 leading-relaxed">{event.message}</div>
                    </div>

                    <div className="font-mono text-[10px] text-slate-500 shrink-0 mt-0.5">{event.time}</div>
                  </div>
                )
              })}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  )
}
