// ============================================================
// MOCK DATA — Rail Logistics Simulator
// Realistic data based on Indonesian railway operations (KAI)
// ============================================================

// Koordinat menggunakan lat/lng nyata (WGS84) untuk OpenStreetMap
export const NETWORK_NODES = [
  // Major yards
  { id: 'YRD-CGK',  name: 'Cikarang Yard',        type: 'yard',    capacity: 120, currentLoad: 97,  lat: -6.2600, lng: 107.1450, throughputPerHour: 18, status: 'congested' },
  { id: 'YRD-SDT',  name: 'Surabaya Darat Yard',  type: 'yard',    capacity: 100, currentLoad: 64,  lat: -7.2090, lng: 112.7300, throughputPerHour: 14, status: 'normal' },
  { id: 'YRD-SMG',  name: 'Semarang Yard',         type: 'yard',    capacity: 80,  currentLoad: 31,  lat: -6.9900, lng: 110.4050, throughputPerHour: 10, status: 'normal' },

  // Stations
  { id: 'STA-GMR',  name: 'Gambir',                type: 'station', capacity: 20,  currentLoad: 14,  lat: -6.1766, lng: 106.8300, throughputPerHour: 22, status: 'normal' },
  { id: 'STA-PSS',  name: 'Pasar Senen',           type: 'station', capacity: 16,  currentLoad: 15,  lat: -6.1730, lng: 106.8450, throughputPerHour: 19, status: 'congested' },
  { id: 'STA-BDG',  name: 'Bandung',               type: 'station', capacity: 18,  currentLoad: 11,  lat: -6.9135, lng: 107.6390, throughputPerHour: 14, status: 'normal' },
  { id: 'STA-YK',   name: 'Yogyakarta',            type: 'station', capacity: 14,  currentLoad: 9,   lat: -7.7892, lng: 110.3647, throughputPerHour: 12, status: 'normal' },
  { id: 'STA-SBY',  name: 'Surabaya Gubeng',       type: 'station', capacity: 22,  currentLoad: 16,  lat: -7.2653, lng: 112.7517, throughputPerHour: 17, status: 'normal' },
  { id: 'STA-MLG',  name: 'Malang',                type: 'station', capacity: 12,  currentLoad: 8,   lat: -7.9666, lng: 112.6326, throughputPerHour: 9,  status: 'normal' },

  // Depots
  { id: 'DEP-JKTK', name: 'Depo Jakarta Kota',    type: 'depot',   capacity: 60,  currentLoad: 42,  lat: -6.1375, lng: 106.8130, throughputPerHour: 8,  status: 'normal' },
  { id: 'DEP-SBY',  name: 'Depo Surabaya',        type: 'depot',   capacity: 50,  currentLoad: 27,  lat: -7.2500, lng: 112.7450, throughputPerHour: 6,  status: 'normal' },

  // Repair / Maintenance Facilities
  { id: 'REP-MNC',  name: 'Balai Yasa Manggarai', type: 'repair',  capacity: 30,  currentLoad: 22,  lat: -6.2100, lng: 106.8570, throughputPerHour: 4,  status: 'maintenance' },
  { id: 'REP-SBY',  name: 'Balai Yasa Surabaya',  type: 'repair',  capacity: 25,  currentLoad: 8,   lat: -7.2400, lng: 112.7600, throughputPerHour: 3,  status: 'normal' },
]

export const NETWORK_EDGES = [
  { from: 'STA-GMR',  to: 'YRD-CGK',  distance: 42,  maxSpeed: 120, trackType: 'double', congestion: 0.65 },
  { from: 'STA-PSS',  to: 'YRD-CGK',  distance: 40,  maxSpeed: 120, trackType: 'double', congestion: 0.72 },
  { from: 'STA-GMR',  to: 'DEP-JKTK', distance: 8,   maxSpeed: 60,  trackType: 'single', congestion: 0.30 },
  { from: 'STA-GMR',  to: 'REP-MNC',  distance: 5,   maxSpeed: 40,  trackType: 'single', congestion: 0.20 },
  { from: 'STA-GMR',  to: 'STA-BDG',  distance: 180, maxSpeed: 150, trackType: 'double', congestion: 0.55 },
  { from: 'STA-BDG',  to: 'STA-YK',   distance: 330, maxSpeed: 120, trackType: 'double', congestion: 0.40 },
  { from: 'YRD-CGK',  to: 'YRD-SMG',  distance: 440, maxSpeed: 100, trackType: 'double', congestion: 0.60 },
  { from: 'STA-YK',   to: 'YRD-SMG',  distance: 135, maxSpeed: 120, trackType: 'double', congestion: 0.35 },
  { from: 'YRD-SMG',  to: 'YRD-SDT',  distance: 310, maxSpeed: 100, trackType: 'double', congestion: 0.48 },
  { from: 'YRD-SDT',  to: 'STA-SBY',  distance: 12,  maxSpeed: 60,  trackType: 'single', congestion: 0.25 },
  { from: 'STA-SBY',  to: 'DEP-SBY',  distance: 5,   maxSpeed: 40,  trackType: 'single', congestion: 0.15 },
  { from: 'STA-SBY',  to: 'REP-SBY',  distance: 8,   maxSpeed: 40,  trackType: 'single', congestion: 0.10 },
  { from: 'STA-SBY',  to: 'STA-MLG',  distance: 95,  maxSpeed: 90,  trackType: 'single', congestion: 0.38 },
  { from: 'YRD-CGK',  to: 'STA-GMR',  distance: 42,  maxSpeed: 120, trackType: 'double', congestion: 0.65 },
]

export const INITIAL_TRAINS = [
  {
    id: 'KA-1001', name: 'Argo Bromo Anggrek',
    originId: 'STA-GMR', destinationId: 'STA-SBY',
    speed: 120, cargoType: 'Penumpang', railCars: 12,
    status: 'moving', progress: 0.15,
    departureTime: '06:00', eta: '17:30',
    weight: 680, delay: 0,
    color: '#3b82f6',
  },
  {
    id: 'KA-2045', name: 'Sancaka Pagi',
    originId: 'STA-YK', destinationId: 'STA-SBY',
    speed: 90, cargoType: 'Penumpang', railCars: 8,
    status: 'moving', progress: 0.42,
    departureTime: '07:15', eta: '12:10',
    weight: 450, delay: 12,
    color: '#8b5cf6',
  },
  {
    id: 'KA-3012', name: 'Freight Cikarang-Surabaya',
    originId: 'YRD-CGK', destinationId: 'YRD-SDT',
    speed: 80, cargoType: 'Container', railCars: 20,
    status: 'moving', progress: 0.68,
    departureTime: '03:00', eta: '15:45',
    weight: 1800, delay: 25,
    color: '#f59e0b',
  },
  {
    id: 'KA-4008', name: 'Logistik Bandung',
    originId: 'STA-BDG', destinationId: 'YRD-CGK',
    speed: 70, cargoType: 'Barang Umum', railCars: 16,
    status: 'waiting', progress: 0,
    departureTime: '09:00', eta: '13:30',
    weight: 1200, delay: 0,
    color: '#10b981',
  },
  {
    id: 'KA-5003', name: 'Malabar',
    originId: 'STA-GMR', destinationId: 'STA-MLG',
    speed: 100, cargoType: 'Penumpang', railCars: 10,
    status: 'delayed', progress: 0.28,
    departureTime: '08:30', eta: '20:00',
    weight: 560, delay: 45,
    color: '#ef4444',
  },
  {
    id: 'KA-6011', name: 'Gajayana',
    originId: 'STA-SBY', destinationId: 'STA-GMR',
    speed: 110, cargoType: 'Penumpang', railCars: 11,
    status: 'moving', progress: 0.55,
    departureTime: '05:00', eta: '16:45',
    weight: 620, delay: 0,
    color: '#06b6d4',
  },
]

export const FLEET_ASSETS = [
  { id: 'LOC-001', type: 'locomotive', name: 'CC 206 13 01', mileage: 487200, lastMaintenance: '2026-03-10', conditionScore: 72, series: 'CC 206', status: 'active' },
  { id: 'LOC-002', type: 'locomotive', name: 'CC 206 14 22', mileage: 621000, lastMaintenance: '2026-01-15', conditionScore: 51, series: 'CC 206', status: 'maintenance' },
  { id: 'LOC-003', type: 'locomotive', name: 'CC 201 84 07', mileage: 980000, lastMaintenance: '2025-11-20', conditionScore: 38, series: 'CC 201', status: 'critical' },
  { id: 'LOC-004', type: 'locomotive', name: 'CC 300 19 03', mileage: 210000, lastMaintenance: '2026-05-01', conditionScore: 94, series: 'CC 300', status: 'active' },
  { id: 'LOC-005', type: 'locomotive', name: 'CC 206 15 18', mileage: 345000, lastMaintenance: '2026-04-10', conditionScore: 83, series: 'CC 206', status: 'active' },
  { id: 'RC-0101', type: 'railcar',   name: 'K1 19 101',    mileage: 320000, lastMaintenance: '2026-02-28', conditionScore: 68, series: 'K1 Eksekutif', status: 'active' },
  { id: 'RC-0102', type: 'railcar',   name: 'K1 19 102',    mileage: 318000, lastMaintenance: '2026-02-28', conditionScore: 70, series: 'K1 Eksekutif', status: 'active' },
  { id: 'RC-0201', type: 'railcar',   name: 'K2 17 201',    mileage: 540000, lastMaintenance: '2025-12-01', conditionScore: 44, series: 'K2 Bisnis', status: 'maintenance' },
  { id: 'RC-0301', type: 'railcar',   name: 'GD 14 501',    mileage: 720000, lastMaintenance: '2025-10-15', conditionScore: 33, series: 'Gerbong Datar', status: 'critical' },
  { id: 'RC-0401', type: 'railcar',   name: 'PPCW 19 801',  mileage: 180000, lastMaintenance: '2026-05-20', conditionScore: 91, series: 'Container', status: 'active' },
  { id: 'RC-0402', type: 'railcar',   name: 'PPCW 19 802',  mileage: 185000, lastMaintenance: '2026-05-20', conditionScore: 89, series: 'Container', status: 'active' },
  { id: 'RC-0501', type: 'railcar',   name: 'K3 16 701',    mileage: 610000, lastMaintenance: '2026-01-05', conditionScore: 57, series: 'K3 Ekonomi', status: 'active' },
]

export const INITIAL_EVENTS = [
  { id: 1, time: '08:47', type: 'departure',    message: 'KA-1001 Argo Bromo Anggrek departed from Gambir', severity: 'info' },
  { id: 2, time: '08:52', type: 'congestion',   message: 'YRD-CGK Cikarang Yard reached 80% capacity — congestion warning', severity: 'warning' },
  { id: 3, time: '09:01', type: 'delay',        message: 'KA-5003 Malabar delayed 45 minutes due to track maintenance', severity: 'error' },
  { id: 4, time: '09:10', type: 'arrival',      message: 'KA-6011 Gajayana arrived at Semarang Yard', severity: 'info' },
  { id: 5, time: '09:15', type: 'maintenance',  message: 'LOC-003 CC 201 84 07 scheduled for immediate maintenance (score: 38)', severity: 'error' },
  { id: 6, time: '09:22', type: 'departure',    message: 'KA-3012 Freight Cikarang-Surabaya departed from Cikarang Yard', severity: 'info' },
  { id: 7, time: '09:30', type: 'congestion',   message: 'STA-PSS Pasar Senen nearing capacity (94%)', severity: 'warning' },
]

export const INITIAL_PARAMS = {
  simulationSpeed: 1,        // multiplier: 1x, 2x, 4x
  trainArrivalRate: 4,       // trains per hour
  loadingUnloadingTime: 30,  // minutes
  yardCapacity: 120,         // max cars
  delayProbability: 0.15,    // 0–1
  maintenanceThreshold: 60,  // condition score
}

export const YARD_DATA = [
  {
    id: 'YRD-CGK', name: 'Cikarang Yard',
    maxCapacity: 120, currentOccupancy: 97,
    inboundTrains: 5, outboundTrains: 3,
    avgDwellTime: 4.2, // hours
    sections: [
      { name: 'Arrival', capacity: 30, occupied: 28 },
      { name: 'Classification', capacity: 50, occupied: 45 },
      { name: 'Departure', capacity: 40, occupied: 24 },
    ]
  },
  {
    id: 'YRD-SDT', name: 'Surabaya Darat Yard',
    maxCapacity: 100, currentOccupancy: 64,
    inboundTrains: 3, outboundTrains: 4,
    avgDwellTime: 3.1,
    sections: [
      { name: 'Arrival', capacity: 25, occupied: 18 },
      { name: 'Classification', capacity: 45, occupied: 30 },
      { name: 'Departure', capacity: 30, occupied: 16 },
    ]
  },
  {
    id: 'YRD-SMG', name: 'Semarang Yard',
    maxCapacity: 80, currentOccupancy: 31,
    inboundTrains: 2, outboundTrains: 2,
    avgDwellTime: 2.8,
    sections: [
      { name: 'Arrival', capacity: 20, occupied: 9 },
      { name: 'Classification', capacity: 35, occupied: 14 },
      { name: 'Departure', capacity: 25, occupied: 8 },
    ]
  },
]
