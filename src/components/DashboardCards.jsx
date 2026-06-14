import React from 'react'

export default function DashboardCards({ trains, nodes, params, fleetAssets }) {
  // ── Computed metrics ──────────────────────────────────────
  const totalTrains = trains.length
  const activeTrains = trains.filter(t => t.status === 'moving').length
  const totalRailCars = trains.reduce((s, t) => s + t.railCars, 0) + fleetAssets.filter(a => a.type === 'railcar').length
  const activeRoutes = [...new Set(trains.filter(t => t.status === 'moving').map(t => `${t.originId}-${t.destinationId}`))].length
  const yardNodes = nodes.filter(n => n.type === 'yard')
  const totalYardCap = yardNodes.reduce((s, n) => s + n.capacity, 0)
  const totalYardLoad = yardNodes.reduce((s, n) => s + n.currentLoad, 0)
  const yardUtilPct = totalYardCap ? Math.round((totalYardLoad / totalYardCap) * 100) : 0
  const throughput = nodes.reduce((s, n) => s + n.throughputPerHour, 0)
  const maintenanceQueue = fleetAssets.filter(a => a.conditionScore < params.maintenanceThreshold).length
  const delayedTrains = trains.filter(t => t.status === 'delayed' || t.delay > 0).length

  const cards = [
    {
      label: 'Total Kereta',
      value: totalTrains,
      sub: `${activeTrains} sedang bergerak`,
      icon: TrainIcon,
      color: 'blue',
      trend: activeTrains > 0 ? 'up' : 'neutral',
    },
    {
      label: 'Total Gerbong',
      value: totalRailCars,
      sub: `Fleet aktif`,
      icon: CarsIcon,
      color: 'purple',
      trend: 'neutral',
    },
    {
      label: 'Rute Aktif',
      value: activeRoutes,
      sub: `Jalur operasional`,
      icon: RouteIcon,
      color: 'cyan',
      trend: 'neutral',
    },
    {
      label: 'Kapasitas Yard',
      value: `${yardUtilPct}%`,
      sub: `${totalYardLoad}/${totalYardCap} posisi`,
      icon: YardIcon,
      color: yardUtilPct >= 80 ? 'red' : yardUtilPct >= 60 ? 'yellow' : 'green',
      trend: yardUtilPct >= 80 ? 'down' : 'up',
      progress: yardUtilPct,
    },
    {
      label: 'Throughput',
      value: `${throughput}`,
      sub: `gerbong/jam (total)',`,
      icon: ThroughputIcon,
      color: 'green',
      trend: 'up',
    },
    {
      label: 'Antrean Maintenance',
      value: maintenanceQueue,
      sub: `Perlu perhatian segera`,
      icon: WrenchIcon,
      color: maintenanceQueue > 3 ? 'red' : maintenanceQueue > 1 ? 'yellow' : 'green',
      trend: maintenanceQueue > 3 ? 'down' : 'neutral',
    },
    {
      label: 'Keterlambatan',
      value: delayedTrains,
      sub: `Kereta terlambat aktif`,
      icon: DelayIcon,
      color: delayedTrains > 2 ? 'red' : delayedTrains > 0 ? 'yellow' : 'green',
      trend: delayedTrains > 0 ? 'down' : 'neutral',
    },
    {
      label: 'Node Jaringan',
      value: nodes.length,
      sub: `${nodes.filter(n => n.status === 'congested').length} congested`,
      icon: NetworkIcon,
      color: 'orange',
      trend: 'neutral',
    },
  ]

  const colorMap = {
    blue:   { icon: 'text-blue-400',   ring: 'border-blue-500/30',   bg: 'bg-blue-500/10',   bar: 'bg-blue-500' },
    purple: { icon: 'text-purple-400', ring: 'border-purple-500/30', bg: 'bg-purple-500/10', bar: 'bg-purple-500' },
    cyan:   { icon: 'text-cyan-400',   ring: 'border-cyan-500/30',   bg: 'bg-cyan-500/10',   bar: 'bg-cyan-500' },
    green:  { icon: 'text-green-400',  ring: 'border-green-500/30',  bg: 'bg-green-500/10',  bar: 'bg-green-500' },
    yellow: { icon: 'text-yellow-400', ring: 'border-yellow-500/30', bg: 'bg-yellow-500/10', bar: 'bg-yellow-500' },
    red:    { icon: 'text-red-400',    ring: 'border-red-500/30',    bg: 'bg-red-500/10',    bar: 'bg-red-500' },
    orange: { icon: 'text-orange-400', ring: 'border-orange-500/30', bg: 'bg-orange-500/10', bar: 'bg-orange-500' },
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const c = colorMap[card.color] || colorMap.blue
        const Icon = card.icon
        return (
          <div key={i} className={`card border ${c.ring} relative overflow-hidden group hover:border-opacity-70 transition-all`}>
            {/* Background accent */}
            <div className={`absolute top-0 right-0 w-20 h-20 ${c.bg} rounded-full -translate-y-6 translate-x-6 opacity-60 group-hover:scale-110 transition-transform`} />

            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 ${c.bg} ${c.ring} border rounded-lg flex items-center justify-center`}>
                  <Icon className={c.icon} size={16} />
                </div>
                <TrendIndicator trend={card.trend} color={card.color} />
              </div>

              <div className="stat-value mb-0.5">{card.value}</div>
              <div className="card-header mb-1">{card.label}</div>
              <div className="text-xs text-slate-500">{card.sub}</div>

              {card.progress !== undefined && (
                <div className="mt-3">
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${c.bar}`}
                      style={{ width: `${Math.min(100, card.progress)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TrendIndicator({ trend, color }) {
  if (trend === 'up') return (
    <span className="text-green-400 text-xs font-mono">▲</span>
  )
  if (trend === 'down') return (
    <span className="text-red-400 text-xs font-mono">▼</span>
  )
  return <span className="text-slate-600 text-xs font-mono">─</span>
}

// ─── Icons ──────────────────────────────────────────────────
function TrainIcon({ size, className }) {
  return <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="13" rx="2"/><path d="M4 11h16"/><circle cx="8.5" cy="18.5" r="2.5"/><circle cx="15.5" cy="18.5" r="2.5"/><path d="M10 21h4"/></svg>
}
function CarsIcon({ size, className }) {
  return <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
}
function RouteIcon({ size, className }) {
  return <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
}
function YardIcon({ size, className }) {
  return <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
}
function ThroughputIcon({ size, className }) {
  return <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
}
function WrenchIcon({ size, className }) {
  return <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
}
function DelayIcon({ size, className }) {
  return <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
}
function NetworkIcon({ size, className }) {
  return <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><line x1="12" y1="7" x2="5" y2="17"/><line x1="12" y1="7" x2="19" y2="17"/><line x1="5" y1="19" x2="19" y2="19"/></svg>
}
