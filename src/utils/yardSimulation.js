// ============================================================
// YARD CAPACITY SIMULATION ENGINE
// Model: tandem queueing network 3 tahap untuk classification yard
//   Inbound (antre) → Arrival → Classification → Departure → Dispatch
//
// Pendekatan: time-stepped discrete simulation (Δt = 1 menit simulasi).
// Kedatangan kereta bersifat stokastik (proses Poisson).
// Dwell time diestimasi memakai LITTLE'S LAW:  W = L / λ
//
// Referensi:
//  - Little, J.D.C. "A Proof for the Queuing Formula L = λW." Operations Research, 1961.
//  - Law, A.M. "Simulation Modeling and Analysis", 5th ed. (time-stepped DES)
//  - Kraft, E.R. "A Scheduling-Based Approach to Improving Yard Performance." Transportation Science, 2002.
//  - Yagar, S. & Mann, M.V. "Classification Yard Performance." J. of Advanced Transportation, 1979.
// ============================================================

// Parameter default — bisa diubah dari UI (what-if analysis)
export const DEFAULT_YARD_PARAMS = {
  arrivalRate: 6,        // λ — kedatangan kereta per jam (Poisson)
  avgCarsPerTrain: 24,   // rata-rata gerbong per kereta inbound
  sections: {
    // capacity = slot gerbong; serviceRate = laju proses keluar seksi (gerbong/jam)
    arrival:        { capacity: 30, serviceRate: 220, label: 'Arrival' },
    classification: { capacity: 50, serviceRate: 180, label: 'Classification' },
    departure:      { capacity: 40, serviceRate: 200, label: 'Departure' },
  },
}

// Buat state awal simulasi yard
export function createYardState() {
  return {
    clock: 0,            // menit simulasi berjalan
    inboundCars: 0,      // gerbong menunggu di luar (kereta belum bisa masuk)
    waitingTrains: 0,    // jumlah kereta inbound yang mengantre
    occupied: { arrival: 0, classification: 0, departure: 0 },
    cumArrived: 0,       // total gerbong yang sudah masuk sistem
    cumDispatched: 0,    // total gerbong yang sudah berangkat (throughput kumulatif)
    recentDispatch: [],  // window gerbong berangkat per step (untuk laju throughput)
    dwellSamples: [],    // sampel dwell time (menit) untuk histogram
    history: [],         // time-series untuk grafik
  }
}

// ─── Poisson sampler (algoritma Knuth) ──────────────────────
// Mengembalikan jumlah kejadian dalam satu interval dengan mean λ.
function samplePoisson(mean) {
  if (mean <= 0) return 0
  const L = Math.exp(-mean)
  let k = 0
  let p = 1
  do {
    k++
    p *= Math.random()
  } while (p > L)
  return k - 1
}

const freeSpace = (capacity, occupied) => Math.max(0, capacity - occupied)

/**
 * Maju satu langkah simulasi (Δt menit).
 *
 * Urutan proses DOWNSTREAM-FIRST: Departure dulu, baru ke hulu. Dengan begitu
 * setiap gerbong berpindah maksimal SATU tahap per langkah, dan ruang yang baru
 * kosong langsung bisa dipakai tahap di atasnya — mencegah "teleport" antar tahap.
 *
 * @param {object} state   - state yard saat ini
 * @param {object} params  - parameter (arrivalRate, avgCarsPerTrain, sections)
 * @param {number} dtMin   - durasi langkah dalam menit simulasi
 * @returns {object} state baru
 */
export function stepYard(state, params, dtMin = 1) {
  const s = params.sections
  const next = {
    ...state,
    clock: state.clock + dtMin,
    occupied: { ...state.occupied },
  }

  // Konversi laju layanan (gerbong/jam) → kapasitas perpindahan per langkah
  const cap = {
    arrival:        (s.arrival.serviceRate * dtMin) / 60,
    classification: (s.classification.serviceRate * dtMin) / 60,
    departure:      (s.departure.serviceRate * dtMin) / 60,
  }

  // (1) DEPARTURE → DISPATCH (gerbong meninggalkan yard = throughput)
  const dispatch = Math.min(next.occupied.departure, cap.departure)
  next.occupied.departure -= dispatch
  next.cumDispatched += dispatch

  // (2) CLASSIFICATION → DEPARTURE (dibatasi laju & ruang departure)
  const toDep = Math.min(
    next.occupied.classification,
    cap.classification,
    freeSpace(s.departure.capacity, next.occupied.departure)
  )
  next.occupied.classification -= toDep
  next.occupied.departure += toDep

  // (3) ARRIVAL → CLASSIFICATION (dibatasi laju & ruang classification)
  const toCls = Math.min(
    next.occupied.arrival,
    cap.arrival,
    freeSpace(s.classification.capacity, next.occupied.classification)
  )
  next.occupied.arrival -= toCls
  next.occupied.classification += toCls

  // (4) INBOUND (antre) → ARRIVAL (dibatasi ruang arrival)
  const toArr = Math.min(next.inboundCars, freeSpace(s.arrival.capacity, next.occupied.arrival))
  next.inboundCars -= toArr
  next.occupied.arrival += toArr

  // (5) KEDATANGAN BARU — proses Poisson dengan mean λ·Δt
  const meanArrivals = (params.arrivalRate * dtMin) / 60
  const newTrains = samplePoisson(meanArrivals)
  const newCars = newTrains * params.avgCarsPerTrain
  next.inboundCars += newCars
  next.cumArrived += newCars

  // Estimasi kereta yang mengantre (gerbong inbound ÷ rata-rata gerbong/kereta)
  next.waitingTrains = Math.ceil(next.inboundCars / params.avgCarsPerTrain)

  // ─── Metrik turunan ───────────────────────────────────────

  // Laju throughput sesaat (gerbong/jam) dari rolling window ~30 langkah
  next.recentDispatch = [...state.recentDispatch, dispatch].slice(-30)
  const windowCars = next.recentDispatch.reduce((a, b) => a + b, 0)
  const windowMin = next.recentDispatch.length * dtMin
  const throughputRate = windowMin > 0 ? (windowCars / windowMin) * 60 : 0

  // LITTLE'S LAW: W = L / λ
  //   L = gerbong dalam sistem (termasuk yang mengantre di luar)
  //   λ = laju throughput (gerbong/jam) → W dalam jam, dikonversi ke menit
  const L =
    next.inboundCars +
    next.occupied.arrival +
    next.occupied.classification +
    next.occupied.departure
  const dwellMin = throughputRate > 0 ? (L / throughputRate) * 60 : 0

  // Simpan sampel dwell saat sistem sudah "warm up" (clock > 30 menit)
  if (next.clock > 30 && dwellMin > 0 && dwellMin < 600) {
    next.dwellSamples = [...state.dwellSamples, dwellMin].slice(-300)
  }

  // Utilisasi per seksi
  const util = {
    arrival:        next.occupied.arrival / s.arrival.capacity,
    classification: next.occupied.classification / s.classification.capacity,
    departure:      next.occupied.departure / s.departure.capacity,
  }

  // Catat time-series (batasi 240 titik agar grafik ringan)
  next.history = [
    ...state.history,
    {
      t: next.clock,
      arrival: next.occupied.arrival,
      classification: next.occupied.classification,
      departure: next.occupied.departure,
      waiting: next.waitingTrains,
      throughput: throughputRate,
      dwell: dwellMin,
      L,
    },
  ].slice(-240)

  // Lampirkan snapshot metrik terkini (mempermudah UI)
  next.metrics = {
    throughputRate,
    dwellMin,
    L,
    util,
    bottleneck: detectBottleneck(util, next.waitingTrains),
  }

  return next
}

/**
 * Deteksi bottleneck: seksi dengan utilisasi tertinggi.
 * Status CRITICAL bila utilisasi ≥ 0.85 atau ada antrean inbound menumpuk.
 */
export function detectBottleneck(util, waitingTrains) {
  const entries = Object.entries(util)
  const [section, value] = entries.reduce((max, cur) => (cur[1] > max[1] ? cur : max))
  let level = 'normal'
  if (value >= 0.85 || waitingTrains >= 3) level = 'critical'
  else if (value >= 0.65 || waitingTrains >= 1) level = 'warning'
  return { section, utilization: value, level }
}

/**
 * Jalankan skenario cepat (fast-forward) sejumlah jam simulasi tanpa animasi.
 * Berguna untuk what-if analysis: ubah parameter → lihat hasil agregat.
 *
 * @returns {object} state akhir (lengkap dengan history & metrics)
 */
export function runScenario(params, hours = 24, dtMin = 1) {
  let state = createYardState()
  const steps = Math.round((hours * 60) / dtMin)
  for (let i = 0; i < steps; i++) {
    state = stepYard(state, params, dtMin)
  }
  return state
}

/**
 * Kurva kapasitas: throughput rata-rata sebagai fungsi laju kedatangan (λ).
 * Menunjukkan titik saturasi yard — di mana menambah kedatangan tidak lagi
 * menaikkan throughput (yard jenuh) tapi justru menaikkan dwell & antrean.
 *
 * @returns {Array<{lambda, throughput, dwell, waiting}>}
 */
export function buildCapacityCurve(params, lambdaValues, hours = 12) {
  return lambdaValues.map(lambda => {
    const result = runScenario({ ...params, arrivalRate: lambda }, hours)
    const h = result.history
    // rata-rata pada paruh kedua simulasi (setelah steady-state)
    const tail = h.slice(Math.floor(h.length / 2))
    const avg = key => tail.reduce((a, r) => a + r[key], 0) / (tail.length || 1)
    return {
      lambda,
      throughput: avg('throughput'),
      dwell: avg('dwell'),
      waiting: avg('waiting'),
    }
  })
}

/**
 * Bangun histogram dwell time dari sampel.
 * @returns {Array<{binStart, binEnd, count}>}
 */
export function buildDwellHistogram(samples, binCount = 10) {
  if (!samples.length) return []
  const min = Math.min(...samples)
  const max = Math.max(...samples)
  const range = max - min || 1
  const binSize = range / binCount
  const bins = Array.from({ length: binCount }, (_, i) => ({
    binStart: min + i * binSize,
    binEnd: min + (i + 1) * binSize,
    count: 0,
  }))
  samples.forEach(v => {
    let idx = Math.floor((v - min) / binSize)
    if (idx >= binCount) idx = binCount - 1
    if (idx < 0) idx = 0
    bins[idx].count++
  })
  return bins
}
