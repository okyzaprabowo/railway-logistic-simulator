import React, { useState, useRef, useEffect } from 'react'
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  Popup,
  Tooltip,
  useMap,
} from 'react-leaflet'
import { NETWORK_EDGES } from '../data/mockData'

// ── Node visual config ────────────────────────────────────
const NODE_CONFIG = {
  yard:    { color: '#3b82f6', fillColor: '#1d4ed8', label: 'Yard',        radius: 14 },
  station: { color: '#10b981', fillColor: '#065f46', label: 'Stasiun',     radius: 12 },
  depot:   { color: '#8b5cf6', fillColor: '#4c1d95', label: 'Depo',        radius: 11 },
  repair:  { color: '#f97316', fillColor: '#7c2d12', label: 'Balai Yasa',  radius: 10 },
}

const STATUS_STYLE = {
  normal:      { color: '#10b981', badge: 'badge-green',  label: 'Normal' },
  congested:   { color: '#ef4444', badge: 'badge-red',    label: 'Congested' },
  maintenance: { color: '#f97316', badge: 'badge-orange', label: 'Maintenance' },
}

// Warna edge berdasarkan congestion level
function edgeColor(congestion) {
  if (congestion > 0.7) return '#ef4444'
  if (congestion > 0.5) return '#f59e0b'
  return '#334155'
}

// Komponen yang menggeser peta agar semua node terlihat
function FitBounds({ nodes }) {
  const map = useMap()
  useEffect(() => {
    if (nodes.length === 0) return
    const bounds = nodes.map(n => [n.lat, n.lng])
    map.fitBounds(bounds, { padding: [40, 40] })
  }, [])  // eslint-disable-line
  return null
}

export default function RailNetworkMap({ nodes, trains }) {
  const [selected, setSelected] = useState(null)
  const selectedNode = nodes.find(n => n.id === selected)

  // Center di tengah Jawa
  const center = [-7.0, 109.5]

  return (
    <div className="flex gap-4 h-full">
      {/* Map */}
      <div className="flex-1 rounded-xl overflow-hidden border border-slate-700/50 relative" style={{ minHeight: 460 }}>
        <MapContainer
          center={center}
          zoom={7}
          style={{ height: '100%', width: '100%', background: '#0d1530' }}
          zoomControl={true}
          attributionControl={true}
        >
          {/* Dark-themed OSM tile layer (CartoDB Dark Matter) */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
            subdomains="abcd"
            maxZoom={19}
          />

          <FitBounds nodes={nodes} />

          {/* Edges / Tracks */}
          {NETWORK_EDGES.map((edge, i) => {
            const from = nodes.find(n => n.id === edge.from)
            const to   = nodes.find(n => n.id === edge.to)
            if (!from || !to) return null
            return (
              <Polyline
                key={i}
                positions={[[from.lat, from.lng], [to.lat, to.lng]]}
                pathOptions={{
                  color: edgeColor(edge.congestion),
                  weight: edge.trackType === 'double' ? 3 : 1.5,
                  dashArray: edge.trackType === 'single' ? '6 4' : undefined,
                  opacity: 0.75,
                }}
              >
                <Tooltip sticky>
                  <div className="text-xs">
                    <div className="font-semibold">{from.name} → {to.name}</div>
                    <div>{edge.distance} km · {edge.trackType} track · {Math.round(edge.congestion * 100)}% congestion</div>
                  </div>
                </Tooltip>
              </Polyline>
            )
          })}

          {/* Moving trains — interpolated position along edge */}
          {trains.filter(t => t.status === 'moving').map(train => {
            const from = nodes.find(n => n.id === train.originId)
            const to   = nodes.find(n => n.id === train.destinationId)
            if (!from || !to) return null
            const lat = from.lat + (to.lat - from.lat) * train.progress
            const lng = from.lng + (to.lng - from.lng) * train.progress
            return (
              <CircleMarker
                key={train.id}
                center={[lat, lng]}
                radius={7}
                pathOptions={{
                  color: train.color,
                  fillColor: train.color,
                  fillOpacity: 0.95,
                  weight: 2,
                }}
              >
                <Tooltip permanent={false} direction="top" offset={[0, -8]}>
                  <div className="text-xs font-semibold">{train.id}</div>
                  <div className="text-[10px] text-slate-400">{train.name}</div>
                  <div className="text-[10px]">{Math.round(train.progress * 100)}% · {train.speed} km/h</div>
                </Tooltip>
              </CircleMarker>
            )
          })}

          {/* Nodes */}
          {nodes.map(node => {
            const cfg = NODE_CONFIG[node.type] || NODE_CONFIG.station
            const ss  = STATUS_STYLE[node.status] || STATUS_STYLE.normal
            const isSelected = node.id === selected
            const loadPct = Math.round((node.currentLoad / node.capacity) * 100)

            return (
              <CircleMarker
                key={node.id}
                center={[node.lat, node.lng]}
                radius={cfg.radius}
                pathOptions={{
                  color: isSelected ? '#f97316' : ss.color,
                  fillColor: cfg.fillColor,
                  fillOpacity: 0.9,
                  weight: isSelected ? 3 : 2,
                }}
                eventHandlers={{
                  click: () => setSelected(isSelected ? null : node.id),
                }}
              >
                {/* Permanent label tooltip */}
                <Tooltip
                  permanent
                  direction="top"
                  offset={[0, -(cfg.radius + 4)]}
                  className="leaflet-node-label"
                >
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#e2e8f0', background: 'transparent', border: 'none', boxShadow: 'none' }}>
                    {node.name}
                  </span>
                </Tooltip>

                {/* Popup on click */}
                <Popup>
                  <NodePopup node={node} cfg={cfg} ss={ss} loadPct={loadPct} trains={trains} />
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>

        {/* Floating legend */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-[#0a0f1e]/90 border border-slate-700/50 rounded-xl p-3 space-y-1.5 text-xs">
          <div className="font-semibold text-slate-300 mb-2">Legenda</div>
          {Object.entries(NODE_CONFIG).map(([type, cfg]) => (
            <div key={type} className="flex items-center gap-2 text-slate-300">
              <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: cfg.color, background: cfg.fillColor }} />
              {cfg.label}
            </div>
          ))}
          <div className="border-t border-slate-700/40 pt-1.5 space-y-1">
            <div className="flex items-center gap-2 text-slate-400"><div className="w-4 h-0.5 bg-red-500 rounded" />Congested</div>
            <div className="flex items-center gap-2 text-slate-400"><div className="w-4 h-0.5 bg-yellow-500 rounded" />High Load</div>
            <div className="flex items-center gap-2 text-slate-400"><div className="w-4 h-0.5 bg-slate-500 rounded" />Normal</div>
          </div>
        </div>

        {/* Live trains badge */}
        <div className="absolute top-4 left-4 z-[1000] bg-[#0a0f1e]/90 border border-slate-700/50 rounded-xl px-3 py-2">
          <div className="text-xs font-bold text-white">Peta Jaringan Rel</div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {trains.filter(t => t.status === 'moving').length} kereta aktif · Klik node untuk detail
          </div>
        </div>
      </div>

      {/* Side panel */}
      <div className="w-64 flex flex-col gap-3 shrink-0">
        {/* Node detail */}
        <div className="card flex-1 overflow-auto">
          {selectedNode ? (
            <NodeDetailPanel node={selectedNode} trains={trains} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div className="w-12 h-12 rounded-full bg-slate-700/40 flex items-center justify-center mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <div className="text-sm text-slate-400">Klik node pada peta</div>
              <div className="text-xs text-slate-600 mt-1">untuk melihat detail operasional</div>
            </div>
          )}
        </div>

        {/* Network summary */}
        <div className="card">
          <div className="card-header">Ringkasan Jaringan</div>
          <div className="space-y-2">
            {['normal', 'congested', 'maintenance'].map(s => {
              const ss = STATUS_STYLE[s]
              const count = nodes.filter(n => n.status === s).length
              return (
                <div key={s} className="flex items-center justify-between">
                  <span className={`badge ${ss.badge}`}>{ss.label}</span>
                  <span className="text-sm font-semibold text-white">{count} node</span>
                </div>
              )
            })}
            <div className="border-t border-slate-700/40 pt-2 flex items-center justify-between">
              <span className="text-xs text-slate-400">Kereta bergerak</span>
              <span className="text-sm font-semibold text-blue-400">
                {trains.filter(t => t.status === 'moving').length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function NodePopup({ node, cfg, ss, loadPct, trains }) {
  const nodeTrains = trains.filter(t => t.originId === node.id || t.destinationId === node.id)
  return (
    <div style={{ minWidth: 180, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{node.name}</div>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>
        {cfg.label} · {node.id}
      </div>
      <div style={{ fontSize: 11, marginBottom: 4 }}>
        <strong>Kapasitas:</strong> {node.currentLoad}/{node.capacity} ({loadPct}%)
      </div>
      <div style={{ fontSize: 11, marginBottom: 4 }}>
        <strong>Throughput:</strong> {node.throughputPerHour}/jam
      </div>
      <div style={{ fontSize: 11, marginBottom: 6 }}>
        <strong>Status:</strong>{' '}
        <span style={{ color: ss.color, fontWeight: 600 }}>{ss.label}</span>
      </div>
      {nodeTrains.length > 0 && (
        <div style={{ fontSize: 11 }}>
          <strong>Kereta terkait:</strong>
          {nodeTrains.slice(0, 3).map(t => (
            <div key={t.id} style={{ color: t.color, marginTop: 2 }}>• {t.id} {t.name}</div>
          ))}
        </div>
      )}
    </div>
  )
}

function NodeDetailPanel({ node, trains }) {
  const cfg = NODE_CONFIG[node.type] || NODE_CONFIG.station
  const ss  = STATUS_STYLE[node.status] || STATUS_STYLE.normal
  const loadPct = Math.round((node.currentLoad / node.capacity) * 100)
  const nodeTrains = trains.filter(t => t.originId === node.id || t.destinationId === node.id)

  return (
    <div>
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border"
          style={{ background: cfg.fillColor + '60', borderColor: cfg.color + '40' }}
        >
          <div className="w-3 h-3 rounded-full" style={{ background: cfg.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white text-sm leading-tight">{node.name}</div>
          <div className="text-xs text-slate-400 mt-0.5">{node.id}</div>
          <span className={`badge ${ss.badge} mt-1`}>{ss.label}</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-400">Kapasitas</span>
          <span className={`font-semibold ${loadPct >= 80 ? 'text-red-400' : loadPct >= 60 ? 'text-yellow-400' : 'text-green-400'}`}>
            {loadPct}%
          </span>
        </div>
        <div className="progress-bar">
          <div
            className={`progress-fill ${loadPct >= 80 ? 'bg-red-500' : loadPct >= 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
            style={{ width: `${loadPct}%` }}
          />
        </div>
        <div className="text-xs text-slate-500 mt-1">{node.currentLoad} / {node.capacity} posisi</div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-slate-700/20 rounded-lg p-2">
          <div className="text-[10px] text-slate-500 uppercase tracking-wide">Throughput</div>
          <div className="text-sm font-semibold text-white mt-0.5">{node.throughputPerHour}/jam</div>
        </div>
        <div className="bg-slate-700/20 rounded-lg p-2">
          <div className="text-[10px] text-slate-500 uppercase tracking-wide">Tipe</div>
          <div className="text-sm font-semibold text-white mt-0.5">{cfg.label}</div>
        </div>
        <div className="bg-slate-700/20 rounded-lg p-2 col-span-2">
          <div className="text-[10px] text-slate-500 uppercase tracking-wide">Koordinat</div>
          <div className="text-xs font-mono text-slate-300 mt-0.5">{node.lat.toFixed(4)}, {node.lng.toFixed(4)}</div>
        </div>
      </div>

      {nodeTrains.length > 0 && (
        <div>
          <div className="card-header">Kereta Terkait</div>
          <div className="space-y-1.5">
            {nodeTrains.slice(0, 5).map(t => (
              <div key={t.id} className="flex items-center gap-2 bg-slate-700/20 rounded-lg px-2 py-1.5">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: t.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-200 truncate">{t.id}</div>
                  <div className="text-[10px] text-slate-500 truncate">{t.name}</div>
                </div>
                <span className={`badge text-[10px] ${
                  t.status === 'moving' ? 'badge-blue' :
                  t.status === 'delayed' ? 'badge-red' :
                  t.status === 'arrived' ? 'badge-green' : 'badge-gray'
                }`}>{t.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
