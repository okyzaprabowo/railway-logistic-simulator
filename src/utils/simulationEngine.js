// ============================================================
// SIMULATION ENGINE — Rail Logistics Simulator
// Handles train movement, event generation, and state updates
// ============================================================

import { NETWORK_EDGES, NETWORK_NODES } from '../data/mockData'

// ─── Time compression (Discrete-Event Simulation) ───────────
// Jarak & kecepatan kereta bersifat REALISTIS (ratusan km @ ~80–120 km/h),
// sehingga pada waktu nyata pergerakan per-tick nyaris tak terlihat di peta.
// TIME_SCALE memampatkan waktu: 1 detik nyata = TIME_SCALE detik simulasi.
// Nilai 600 → 1 detik nyata ≈ 10 menit operasional, sehingga perjalanan
// antar-kota selesai dalam puluhan detik (ideal untuk demo/presentasi).
// Referensi: Law, A.M. "Simulation Modeling and Analysis" — konsep time compression pada DES.
export const TIME_SCALE = 600

/**
 * Find the edge connecting two nodes (bidirectional lookup).
 * Returns null if no direct connection exists.
 */
export function getEdge(fromId, toId) {
  return NETWORK_EDGES.find(
    e => (e.from === fromId && e.to === toId) || (e.from === toId && e.to === fromId)
  ) || null
}

/**
 * Advance each moving train's progress by one simulation tick.
 * Progress is 0–1 (fraction of journey complete).
 *
 * @param {Array}  trains         - current train array
 * @param {number} deltaSeconds   - real seconds elapsed this tick
 * @param {number} simSpeed       - simulation speed multiplier (1x, 2x, 4x)
 * @param {number} delayProb      - probability (0–1) of a random delay per tick
 * @returns {{ updatedTrains, newEvents }}
 */
export function tickTrains(trains, deltaSeconds, simSpeed, delayProb) {
  const newEvents = []
  const updatedTrains = trains.map(train => {
    if (train.status !== 'moving') return train

    // simulated seconds = real seconds × multiplier × kompresi waktu
    const simSeconds = deltaSeconds * simSpeed * TIME_SCALE

    const edge = getEdge(train.originId, train.destinationId)
    const distance = edge ? edge.distance : 300 // fallback 300 km

    // Progress increment = speed × time / distance  (speed in km/h, time in detik)
    const progressDelta = (train.speed / 3600) * simSeconds / distance

    const newProgress = Math.min(1, train.progress + progressDelta)

    // Random delay injection
    let extraDelay = train.delay
    if (Math.random() < delayProb * (deltaSeconds / 60)) {
      const delayMin = Math.floor(Math.random() * 15) + 5
      extraDelay += delayMin
      newEvents.push({
        time: currentTimeString(),
        type: 'delay',
        message: `${train.id} ${train.name} mengalami keterlambatan ${delayMin} menit`,
        severity: 'warning',
      })
    }

    // Arrival detection — kereta tiba di tujuan
    if (newProgress >= 1) {
      newEvents.push({
        time: currentTimeString(),
        type: 'arrival',
        message: `${train.id} ${train.name} tiba di ${getNodeName(train.destinationId)}`,
        severity: 'info',
      })

      // Recycle: kereta langsung berangkat balik (membalik origin↔destination).
      // Ini menjaga simulasi tetap hidup & bergerak terus untuk keperluan demo.
      newEvents.push({
        time: currentTimeString(),
        type: 'departure',
        message: `${train.id} ${train.name} berangkat kembali dari ${getNodeName(train.destinationId)}`,
        severity: 'info',
      })
      return {
        ...train,
        originId: train.destinationId,
        destinationId: train.originId,
        progress: 0,
        status: 'moving',
        delay: extraDelay,
      }
    }

    return { ...train, progress: newProgress, delay: extraDelay }
  })

  return { updatedTrains, newEvents }
}

/**
 * Update node congestion status based on current load.
 * Congested if load/capacity > 0.80, normal otherwise.
 */
export function updateNodeStatuses(nodes, newEvents) {
  return nodes.map(node => {
    const ratio = node.currentLoad / node.capacity
    let newStatus = node.status

    if (ratio >= 0.8 && node.status === 'normal') {
      newStatus = 'congested'
      newEvents.push({
        time: currentTimeString(),
        type: 'congestion',
        message: `${node.name} mencapai ${Math.round(ratio * 100)}% kapasitas — status CONGESTED`,
        severity: 'warning',
      })
    } else if (ratio < 0.7 && node.status === 'congested') {
      newStatus = 'normal'
    }

    return { ...node, status: newStatus }
  })
}

/**
 * Fleet Optimization Calculator.
 * Calculates recommended number of rail cars given operational parameters.
 *
 * Formula:
 *   requiredCars = ceil((dailyDemand / carCapacity) × avgTripDuration / targetUtilization)
 *
 * Where avgTripDuration is in days (tripHours / 24).
 *
 * @param {object} params
 * @returns {object} optimization result
 */
export function calculateFleetOptimization({ dailyDemand, carCapacity, avgTripHours, targetUtilization, currentFleet }) {
  if (!dailyDemand || !carCapacity || !avgTripHours || !targetUtilization) {
    return { recommended: 0, utilization: 0, status: 'idle', surplus: 0 }
  }

  const tripsPerDay = dailyDemand / carCapacity
  const tripDurationDays = avgTripHours / 24
  // Cars needed = trips/day × duration in days / utilization rate
  const recommended = Math.ceil((tripsPerDay * tripDurationDays) / (targetUtilization / 100))
  const actualUtilization = Math.min(100, ((currentFleet / recommended) * targetUtilization)).toFixed(1)
  const surplus = currentFleet - recommended

  return {
    recommended,
    utilization: parseFloat(actualUtilization),
    surplus,
    status: surplus >= 0 ? 'surplus' : 'shortage',
    tripsPerDay: Math.round(tripsPerDay),
  }
}

/**
 * Determine maintenance priority based on condition score.
 * High  → score < 60
 * Medium → 60–80
 * Normal → > 80
 */
export function getMaintenancePriority(conditionScore) {
  if (conditionScore < 60) return 'high'
  if (conditionScore <= 80) return 'medium'
  return 'normal'
}

/**
 * Get days since last maintenance date.
 */
export function daysSinceMaintenance(lastMaintenanceDate) {
  const last = new Date(lastMaintenanceDate)
  const now = new Date()
  return Math.floor((now - last) / (1000 * 60 * 60 * 24))
}

// ─── Helpers ────────────────────────────────────────────────

function currentTimeString() {
  return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function getNodeName(nodeId) {
  return NETWORK_NODES.find(n => n.id === nodeId)?.name || nodeId
}

/**
 * Generate a new train with random properties for the Add Train feature.
 */
export function generateNewTrain(existingTrains) {
  const nodes = NETWORK_NODES.filter(n => n.type === 'station' || n.type === 'yard')
  const origin = nodes[Math.floor(Math.random() * nodes.length)]
  const destinations = nodes.filter(n => n.id !== origin.id)
  const destination = destinations[Math.floor(Math.random() * destinations.length)]

  const cargoTypes = ['Penumpang', 'Container', 'Barang Umum', 'BBM', 'Batu Bara', 'Semen']
  const trainNames = ['Argo Lawu', 'Taksaka', 'Bima', 'Logistik Ekspres', 'Brantas', 'Tumapel']
  const colors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#f97316']

  const id = `KA-${7000 + existingTrains.length}`
  return {
    id,
    name: trainNames[Math.floor(Math.random() * trainNames.length)],
    originId: origin.id,
    destinationId: destination.id,
    speed: 70 + Math.floor(Math.random() * 60),
    cargoType: cargoTypes[Math.floor(Math.random() * cargoTypes.length)],
    railCars: 8 + Math.floor(Math.random() * 16),
    status: 'waiting',
    progress: 0,
    departureTime: currentTimeString().slice(0, 5),
    eta: '—',
    weight: 400 + Math.floor(Math.random() * 1600),
    delay: 0,
    color: colors[Math.floor(Math.random() * colors.length)],
  }
}
