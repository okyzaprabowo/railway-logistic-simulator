import React from 'react'

const NAV_ITEMS = [
  // { id: 'dashboard',    label: 'Dashboard',          icon: GridIcon },
  // { id: 'network',      label: 'Rail Network',        icon: NetworkIcon },
  { id: 'simulation',   label: 'Train Simulation',    icon: TrainIcon },
  { id: 'yard',         label: 'Yard Analysis',       icon: YardIcon },
  { id: 'fleet',        label: 'Fleet Optimization',  icon: FleetIcon },
  // { id: 'maintenance',  label: 'Maintenance',         icon: WrenchIcon },
  // { id: 'parameters',   label: 'Parameters',          icon: SlidersIcon },
]

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="w-64 min-h-screen bg-[#0d1530] border-r border-slate-700/40 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
              <rect x="9" y="11" width="14" height="10" rx="2" />
              <circle cx="12" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-tight">Rail Logistics</div>
            <div className="text-[10px] text-orange-400 font-semibold uppercase tracking-widest">Simulator v1.0</div>
          </div>
        </div>
      </div>

      {/* Live indicator */}
      <div className="px-5 py-3 border-b border-slate-700/40">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-slate-400">Simulasi Aktif</span>
          <span className="ml-auto text-xs font-mono text-green-400">LIVE</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-2 mb-3">Menu Utama</div>
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          const active = activePage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={active ? 'sidebar-item-active w-full text-left' : 'sidebar-item-inactive w-full text-left'}
            >
              <Icon size={16} className={active ? 'text-orange-400' : 'text-slate-500'} />
              <span>{item.label}</span>
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400" />}
            </button>
          )
        })}
      </nav>

      {/* Bottom info */}
      <div className="px-5 py-4 border-t border-slate-700/40">
        <div className="text-[10px] text-slate-500 leading-relaxed">
          <div className="font-semibold text-slate-400 mb-1">KAI Capacity Simulator</div>
          <div>© 2026 Rail Operations</div>
          <div className="mt-1 text-slate-600">For internal planning use</div>
        </div>
      </div>
    </aside>
  )
}

// ─── Inline SVG Icons ────────────────────────────────────────

function GridIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  )
}

function NetworkIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="2" /><circle cx="5" cy="19" r="2" /><circle cx="19" cy="19" r="2" />
      <line x1="12" y1="7" x2="5" y2="17" /><line x1="12" y1="7" x2="19" y2="17" /><line x1="5" y1="19" x2="19" y2="19" />
    </svg>
  )
}

function TrainIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="13" rx="2" />
      <path d="M4 11h16" /><circle cx="8.5" cy="18.5" r="2.5" /><circle cx="15.5" cy="18.5" r="2.5" />
      <path d="M10 21h4" />
    </svg>
  )
}

function YardIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function FleetIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function WrenchIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  )
}

function SlidersIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  )
}
