import React, { useState, useEffect, useCallback, useRef } from 'react'
import Sidebar from './components/Sidebar'
import DashboardCards from './components/DashboardCards'
import RailNetworkMap from './components/RailNetworkMap'
import TrainSimulation from './components/TrainSimulation'
import YardAnalysis from './components/YardAnalysis'
import FleetOptimization from './components/FleetOptimization'
import MaintenanceSchedule from './components/MaintenanceSchedule'
import SimulationParameters from './components/SimulationParameters'
import EventLog from './components/EventLog'

import {
  NETWORK_NODES,
  INITIAL_TRAINS,
  FLEET_ASSETS,
  INITIAL_EVENTS,
  INITIAL_PARAMS,
} from './data/mockData'
import {
  tickTrains,
  updateNodeStatuses,
  generateNewTrain,
} from './utils/simulationEngine'

// Simulation tick interval in ms (real time)
const TICK_INTERVAL = 500

export default function App() {
  const [page, setPage] = useState('dashboard')

  // ── Core simulation state ────────────────────────────────
  const [trains, setTrains] = useState(INITIAL_TRAINS)
  const [nodes, setNodes] = useState(NETWORK_NODES)
  const [fleetAssets] = useState(FLEET_ASSETS)
  const [events, setEvents] = useState(INITIAL_EVENTS)
  const [params, setParams] = useState(INITIAL_PARAMS)
  const [isRunning, setIsRunning] = useState(false)

  // Use ref to always have fresh params inside interval closure
  const paramsRef = useRef(params)
  const trainsRef = useRef(trains)
  const nodesRef = useRef(nodes)
  useEffect(() => { paramsRef.current = params }, [params])
  useEffect(() => { trainsRef.current = trains }, [trains])
  useEffect(() => { nodesRef.current = nodes }, [nodes])

  // ── Simulation tick ──────────────────────────────────────
  const tick = useCallback(() => {
    const p = paramsRef.current

    // Advance train positions
    const { updatedTrains, newEvents: trainEvents } = tickTrains(
      trainsRef.current,
      TICK_INTERVAL / 1000,  // convert ms to seconds
      p.simulationSpeed,
      p.delayProbability
    )

    // Update node congestion status
    const newNodeEvents = []
    const updatedNodes = updateNodeStatuses(nodesRef.current, newNodeEvents)

    // Accumulate events (newest first)
    const allNewEvents = [...newNodeEvents, ...trainEvents]
    if (allNewEvents.length > 0) {
      setEvents(prev => [
        ...allNewEvents.map((e, i) => ({ ...e, id: Date.now() + i })),
        ...prev,
      ].slice(0, 200)) // cap log at 200 entries
    }

    setTrains(updatedTrains)
    setNodes(updatedNodes)
  }, [])

  // Start/stop interval
  useEffect(() => {
    if (!isRunning) return
    const id = setInterval(tick, TICK_INTERVAL)
    return () => clearInterval(id)
  }, [isRunning, tick])

  // ── Simulation controls ──────────────────────────────────
  function handleStart() {
    // Move all waiting trains to 'moving' if simulation starts
    setTrains(prev => prev.map(t => t.status === 'waiting' ? { ...t, status: 'moving' } : t))
    setIsRunning(true)
    addEvent({ type: 'departure', message: 'Simulasi dimulai — semua kereta dalam status waiting dibebaskan', severity: 'info' })
  }

  function handlePause() {
    setIsRunning(false)
    addEvent({ type: 'departure', message: 'Simulasi dijeda', severity: 'info' })
  }

  function handleReset() {
    setIsRunning(false)
    setTrains(INITIAL_TRAINS)
    setNodes(NETWORK_NODES)
    setEvents(INITIAL_EVENTS)
    addEvent({ type: 'departure', message: 'Simulasi direset ke kondisi awal', severity: 'info' })
  }

  function handleAddTrain() {
    const newTrain = generateNewTrain(trains)
    setTrains(prev => [...prev, newTrain])
    addEvent({
      type: 'departure',
      message: `Kereta baru ditambahkan: ${newTrain.id} ${newTrain.name} (${newTrain.cargoType})`,
      severity: 'info',
    })
  }

  function handleStartTrain(trainId) {
    setTrains(prev => prev.map(t =>
      t.id === trainId ? { ...t, status: 'moving' } : t
    ))
    const train = trains.find(t => t.id === trainId)
    if (train) {
      addEvent({
        type: 'departure',
        message: `${train.id} ${train.name} berangkat dari ${getNodeName(train.originId)}`,
        severity: 'info',
      })
    }
  }

  function handleParamChange(key, value) {
    setParams(prev => ({ ...prev, [key]: value }))
  }

  function addEvent(event) {
    setEvents(prev => [{ ...event, id: Date.now(), time: nowStr() }, ...prev].slice(0, 200))
  }

  // ── Render pages ─────────────────────────────────────────
  function renderPage() {
    switch (page) {
      case 'dashboard':
        return (
          <div className="flex flex-col gap-6">
            <PageHeader
              title="Operations Dashboard"
              subtitle="Ringkasan real-time operasi logistik kereta api"
              isRunning={isRunning}
            />
            <DashboardCards trains={trains} nodes={nodes} params={params} fleetAssets={fleetAssets} />
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2" style={{ minHeight: 480 }}>
                <RailNetworkMap nodes={nodes} trains={trains} />
              </div>
              <div>
                <EventLog events={events} maxHeight={480} />
              </div>
            </div>
          </div>
        )

      case 'network':
        return (
          <div className="flex flex-col gap-4" style={{ minHeight: 600 }}>
            <PageHeader title="Rail Network Map" subtitle="Visualisasi jaringan rel, node, dan status operasional" isRunning={isRunning} />
            <div style={{ height: 580 }}>
              <RailNetworkMap nodes={nodes} trains={trains} />
            </div>
          </div>
        )

      case 'simulation':
        return (
          <div className="flex flex-col gap-4">
            <PageHeader title="Train Simulation" subtitle="Kontrol dan pantau pergerakan kereta secara simulasi" isRunning={isRunning} />
            <TrainSimulation
              trains={trains}
              isRunning={isRunning}
              onStart={handleStart}
              onPause={handlePause}
              onReset={handleReset}
              onAddTrain={handleAddTrain}
              onStartTrain={handleStartTrain}
            />
          </div>
        )

      case 'yard':
        return (
          <div className="flex flex-col gap-4">
            <PageHeader title="Yard Capacity Analysis" subtitle="Analisis mendalam kapasitas dan throughput semua yard" isRunning={isRunning} />
            <YardAnalysis nodes={nodes} />
          </div>
        )

      case 'fleet':
        return (
          <div className="flex flex-col gap-4">
            <PageHeader title="Fleet Optimization" subtitle="Kalkulasi kebutuhan armada gerbong optimal" isRunning={isRunning} />
            <FleetOptimization fleetAssets={fleetAssets} />
          </div>
        )

      case 'maintenance':
        return (
          <div className="flex flex-col gap-4">
            <PageHeader title="Maintenance Scheduling" subtitle="Penjadwalan perawatan aset lokomotif dan gerbong" isRunning={isRunning} />
            <MaintenanceSchedule
              fleetAssets={fleetAssets}
              onAddEvent={addEvent}
              maintenanceThreshold={params.maintenanceThreshold}
            />
          </div>
        )

      case 'parameters':
        return (
          <div className="flex flex-col gap-4">
            <PageHeader title="Simulation Parameters" subtitle="Sesuaikan parameter untuk mengubah perilaku simulasi" isRunning={isRunning} />
            <SimulationParameters params={params} onParamChange={handleParamChange} />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar activePage={page} onNavigate={setPage} />

      <main className="flex-1 overflow-auto relative">
        {/* Top bar */}
        <div className="sticky top-0 z-20 border-b border-cyan-900/30 bg-[#040a12]/95 backdrop-blur px-6 py-3 flex items-center justify-between shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
          <div className="flex items-center gap-4">
            <div className="text-[11px] text-cyan-300 font-mono tracking-[0.2em]">
              SYS TIME {nowStr()} WIB
            </div>
            <div className="hidden md:flex items-center gap-2 border border-slate-700/60 bg-slate-950/70 px-3 py-1 text-[10px] font-mono tracking-[0.18em] text-slate-400">
              <span className="w-1.5 h-1.5 bg-orange-400" />
              OPS RAIL LOGISTICS
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SimSpeedBadge speed={params.simulationSpeed} />
            {isRunning ? (
              <div className="flex items-center gap-2 border border-green-500/30 bg-green-950/30 px-3 py-1">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] text-green-300 font-semibold tracking-[0.18em]">SIM RUNNING</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 border border-slate-700/60 bg-slate-950/60 px-3 py-1">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="text-[10px] text-slate-300 font-semibold tracking-[0.18em]">SIM PAUSED</span>
              </div>
            )}
            <button onClick={isRunning ? handlePause : handleStart} className={isRunning ? 'btn-secondary py-1 text-xs' : 'btn-success py-1 text-xs'}>
              {isRunning ? '⏸ Pause' : '▶ Start'}
            </button>
          </div>
        </div>

        <div className="p-6">
          {renderPage()}
        </div>
      </main>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────

function nowStr() {
  return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function getNodeName(nodeId) {
  return NETWORK_NODES.find(n => n.id === nodeId)?.name || nodeId
}

function SimSpeedBadge({ speed }) {
  return (
    <div className="flex items-center gap-1.5 border border-cyan-500/25 bg-cyan-950/20 px-3 py-1">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-blue-400">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
      <span className="text-[10px] text-cyan-300 font-mono font-semibold tracking-[0.18em]">TIME {speed}X</span>
    </div>
  )
}

function PageHeader({ title, subtitle, isRunning }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-white tracking-[0.16em]">{title}</h1>
        <p className="text-sm text-slate-400 mt-1 tracking-[0.06em]">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2 border border-slate-700/60 bg-slate-950/50 px-3 py-1 text-[10px] text-slate-400 tracking-[0.16em]">
        <span className={`w-1.5 h-1.5 ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
        {isRunning ? 'STATUS ONLINE' : 'STATUS STANDBY'}
      </div>
    </div>
  )
}
