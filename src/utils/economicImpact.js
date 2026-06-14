// ============================================================
// ECONOMIC IMPACT — Capacity Consumption & Kerugian Finansial
//
// Metodologi capacity consumption mengacu pada UIC Leaflet 406 "Capacity":
//   Consumed time = Occupation + Buffer + Supplement
//   Capacity Consumption (%) = Consumed / Time Window
// Ambang aman (safe threshold) UIC: ±75% (jam sibuk) / ±60% (harian).
// Di atas ambang → kapasitas "hilang" (lost train paths) → kerugian Rp.
//
// Referensi:
//  - UIC Leaflet 406 "Capacity", International Union of Railways, 2013.
//  - Abril, M. et al. "An Assessment of Railway Capacity." Transp. Research Part E, 2008.
//  - PM 36/2011 (Perjalanan KA) & GAPEKA — konteks kapasitas lintas KAI.
// ============================================================

// ─── 1. Capacity Consumption (UIC 406) ──────────────────────
export function calculateCapacityConsumption({
  occupationTimeMin,
  bufferTimeMin,
  supplementTimeMin,
  timeWindowMin
}) {
  const totalConsumedTime =
    occupationTimeMin + bufferTimeMin + supplementTimeMin;

  const capacityConsumptionPercent =
    (totalConsumedTime / timeWindowMin) * 100;

  return {
    totalConsumedTime,
    capacityConsumptionPercent: Number(capacityConsumptionPercent.toFixed(2))
  };
}

// ─── 2. Lost Train Paths (kapasitas terbuang di atas ambang) ─
export function calculateLostTrainPaths({
  capacityConsumptionPercent,
  safeCapacityThresholdPercent,
  timeWindowMin,
  averagePathTimeMin,
  operatingHoursPerDay
}) {
  const excessPercent = Math.max(
    capacityConsumptionPercent - safeCapacityThresholdPercent,
    0
  );

  const excessTimeMin = (excessPercent / 100) * timeWindowMin;

  const lostTrainPathsPerHour = excessTimeMin / averagePathTimeMin;

  const lostTrainPathsPerDay =
    lostTrainPathsPerHour * operatingHoursPerDay;

  return {
    excessPercent: Number(excessPercent.toFixed(2)),
    excessTimeMin: Number(excessTimeMin.toFixed(2)),
    lostTrainPathsPerHour: Number(lostTrainPathsPerHour.toFixed(2)),
    lostTrainPathsPerDay: Number(lostTrainPathsPerDay.toFixed(2))
  };
}

// ─── 3. Lost Revenue (potensi pendapatan yang hilang) ────────
export function calculateLostRevenue({
  lostTrainPathsPerDay,
  carsPerTrain,
  tonPerCar,
  revenuePerTon,
  operatingDaysPerMonth
}) {
  const tonPerTrain = carsPerTrain * tonPerCar;
  const revenuePerTrain = tonPerTrain * revenuePerTon;

  const lostRevenuePerDay = lostTrainPathsPerDay * revenuePerTrain;
  const lostRevenuePerMonth =
    lostRevenuePerDay * operatingDaysPerMonth;

  return {
    tonPerTrain,
    revenuePerTrain,
    lostRevenuePerDay,
    lostRevenuePerMonth
  };
}

// ─── 4. Delay Cost (biaya keterlambatan) ─────────────────────
export function calculateDelayCost({
  affectedTrainsPerDay,
  averageDelayMin,
  delayCostPerTrainMinute,
  operatingDaysPerMonth
}) {
  const delayCostPerDay =
    affectedTrainsPerDay *
    averageDelayMin *
    delayCostPerTrainMinute;

  const delayCostPerMonth = delayCostPerDay * operatingDaysPerMonth;

  return {
    delayCostPerDay,
    delayCostPerMonth
  };
}

// ─── 5. Additional Fleet Cost (akibat siklus trip memanjang) ─
export function calculateAdditionalFleetCost({
  dailyDemandTon,
  capacityPerCarTon,
  normalTripCycleDays,
  congestedTripCycleDays,
  targetUtilization,
  costPerCarPerDay,
  operatingDaysPerMonth
}) {
  const normalCars = Math.ceil(
    (dailyDemandTon / capacityPerCarTon) *
    normalTripCycleDays /
    targetUtilization
  );

  const congestedCars = Math.ceil(
    (dailyDemandTon / capacityPerCarTon) *
    congestedTripCycleDays /
    targetUtilization
  );

  const additionalCars = Math.max(congestedCars - normalCars, 0);

  const additionalFleetCostPerDay =
    additionalCars * costPerCarPerDay;

  const additionalFleetCostPerMonth =
    additionalFleetCostPerDay * operatingDaysPerMonth;

  return {
    normalCars,
    congestedCars,
    additionalCars,
    additionalFleetCostPerDay,
    additionalFleetCostPerMonth
  };
}

// ─── Penggabung: jalankan seluruh rantai kalkulasi ──────────
// Mengembalikan seluruh hasil antara + total dampak ekonomi (Rp/hari & Rp/bulan).
export function computeYardEconomics(input) {
  const capacity = calculateCapacityConsumption({
    occupationTimeMin: input.occupationTimeMin,
    bufferTimeMin: input.bufferTimeMin,
    supplementTimeMin: input.supplementTimeMin,
    timeWindowMin: input.timeWindowMin,
  })

  const lostPaths = calculateLostTrainPaths({
    capacityConsumptionPercent: capacity.capacityConsumptionPercent,
    safeCapacityThresholdPercent: input.safeCapacityThresholdPercent,
    timeWindowMin: input.timeWindowMin,
    averagePathTimeMin: input.averagePathTimeMin,
    operatingHoursPerDay: input.operatingHoursPerDay,
  })

  const revenue = calculateLostRevenue({
    lostTrainPathsPerDay: lostPaths.lostTrainPathsPerDay,
    carsPerTrain: input.carsPerTrain,
    tonPerCar: input.tonPerCar,
    revenuePerTon: input.revenuePerTon,
    operatingDaysPerMonth: input.operatingDaysPerMonth,
  })

  const delay = calculateDelayCost({
    affectedTrainsPerDay: input.affectedTrainsPerDay,
    averageDelayMin: input.averageDelayMin,
    delayCostPerTrainMinute: input.delayCostPerTrainMinute,
    operatingDaysPerMonth: input.operatingDaysPerMonth,
  })

  const fleet = calculateAdditionalFleetCost({
    dailyDemandTon: input.dailyDemandTon,
    capacityPerCarTon: input.capacityPerCarTon,
    normalTripCycleDays: input.normalTripCycleDays,
    congestedTripCycleDays: input.congestedTripCycleDays,
    targetUtilization: input.targetUtilization,
    costPerCarPerDay: input.costPerCarPerDay,
    operatingDaysPerMonth: input.operatingDaysPerMonth,
  })

  const totalPerDay =
    revenue.lostRevenuePerDay +
    delay.delayCostPerDay +
    fleet.additionalFleetCostPerDay

  const totalPerMonth =
    revenue.lostRevenuePerMonth +
    delay.delayCostPerMonth +
    fleet.additionalFleetCostPerMonth

  return { capacity, lostPaths, revenue, delay, fleet, totalPerDay, totalPerMonth }
}

// ─── Default input (angka realistis KAI angkutan barang) ─────
export const DEFAULT_ECONOMIC_INPUT = {
  // Capacity (UIC 406)
  occupationTimeMin: 48,          // waktu okupansi infrastruktur per jendela
  bufferTimeMin: 5,               // waktu sela antar-path
  supplementTimeMin: 5,           // suplemen/margin operasi
  timeWindowMin: 60,              // jendela analisis (1 jam)
  safeCapacityThresholdPercent: 75, // ambang aman UIC (jam sibuk)
  averagePathTimeMin: 8,          // headway rata-rata per path
  operatingHoursPerDay: 20,       // jam operasi per hari
  // Pendapatan
  carsPerTrain: 30,               // gerbong per kereta
  tonPerCar: 50,                  // ton muatan per gerbong
  revenuePerTon: 500000,          // Rp pendapatan per ton per trip
  operatingDaysPerMonth: 30,
  // Biaya keterlambatan
  affectedTrainsPerDay: 12,       // kereta terdampak per hari
  averageDelayMin: 30,            // rata-rata delay (menit)
  delayCostPerTrainMinute: 50000, // Rp per kereta per menit delay
  // Tambahan armada akibat congestion
  dailyDemandTon: 15000,          // permintaan harian (ton)
  capacityPerCarTon: 50,          // kapasitas per gerbong (ton)
  normalTripCycleDays: 2,         // siklus trip normal (hari)
  congestedTripCycleDays: 3,      // siklus trip saat congestion (hari)
  targetUtilization: 0.85,        // target utilisasi armada
  costPerCarPerDay: 1500000,      // Rp biaya kepemilikan gerbong per hari
}

// ─── Formatter Rupiah ───────────────────────────────────────
const idr = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})
export function formatIDR(value) {
  if (!isFinite(value)) return 'Rp 0'
  return idr.format(Math.round(value))
}

// Versi ringkas: Rp 1,2 M / Rp 850 jt — enak untuk hero number
export function formatIDRShort(value) {
  if (!isFinite(value) || value === 0) return 'Rp 0'
  const abs = Math.abs(value)
  if (abs >= 1e12) return `Rp ${(value / 1e12).toFixed(2)} T`
  if (abs >= 1e9)  return `Rp ${(value / 1e9).toFixed(2)} M`
  if (abs >= 1e6)  return `Rp ${(value / 1e6).toFixed(1)} jt`
  if (abs >= 1e3)  return `Rp ${(value / 1e3).toFixed(0)} rb`
  return `Rp ${Math.round(value)}`
}
