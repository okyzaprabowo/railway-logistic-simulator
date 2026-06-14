# Rail Logistics Simulator

Interactive rail operations simulator built with React, Vite, Tailwind CSS, and Leaflet. The project models train movement, yard capacity, fleet planning, and congestion-related economic impact using mock data inspired by Indonesian railway operations.

## Overview

This application is designed as an operations-planning and demo tool for rail logistics scenarios. It combines:

- live train movement simulation across a rail network
- yard throughput and bottleneck analysis
- fleet sizing calculations
- maintenance-priority review for rolling stock
- parameter-driven what-if analysis
- congestion cost estimation in IDR

The current sidebar exposes the main operational modules:

- `Train Simulation`
- `Yard Analysis`
- `Fleet Optimization`

Additional views such as dashboard, network map, maintenance, and simulation parameters are already implemented in the codebase and can be re-enabled from `src/components/Sidebar.jsx`.

## Key Features

### 1. Train Simulation

- Starts, pauses, and resets the live simulation loop
- Tracks train status, delays, progress, cargo type, and consist size
- Allows manual dispatch of waiting trains
- Generates new trains dynamically with randomized routes and properties
- Logs departures, arrivals, delays, and congestion events

Core logic lives in:

- `src/components/TrainSimulation.jsx`
- `src/utils/simulationEngine.js`

### 2. Rail Network Visualization

- Renders the Java rail network on an interactive Leaflet map
- Displays yards, stations, depots, and repair facilities
- Draws track segments with congestion styling
- Animates moving trains between origin and destination nodes
- Shows node-level operational details in map popups and side panels

Core logic lives in:

- `src/components/RailNetworkMap.jsx`
- `src/data/mockData.js`

### 3. Yard Capacity Analysis

- Simulates a 3-stage yard flow:
  `Inbound -> Arrival -> Classification -> Departure -> Dispatch`
- Uses Poisson arrivals for inbound trains
- Estimates dwell time with Little's Law
- Detects bottlenecks from utilization and queue buildup
- Supports live runs, reset, and fast-forward 24-hour scenarios
- Builds capacity curves and dwell-time histograms

Core logic lives in:

- `src/components/YardAnalysis.jsx`
- `src/utils/yardSimulation.js`

### 4. Fleet Optimization

- Calculates recommended railcar counts from demand, trip duration, and utilization
- Includes quick presets for passenger and freight scenarios
- Compares recommended fleet against current fleet size
- Summarizes active, maintenance, and critical assets

Core logic lives in:

- `src/components/FleetOptimization.jsx`
- `src/utils/simulationEngine.js`

### 5. Maintenance Scheduling

- Scores maintenance priority from condition score and maintenance age
- Filters rolling stock by type and urgency
- Schedules high-priority maintenance actions
- Pushes maintenance events into the shared event log

Core logic lives in:

- `src/components/MaintenanceSchedule.jsx`
- `src/utils/simulationEngine.js`

### 6. Economic Impact of Congestion

- Applies a capacity-consumption chain based on UIC 406 concepts
- Estimates lost train paths, lost revenue, delay cost, and extra fleet cost
- Outputs daily and monthly losses in IDR
- Can prefill some inputs from the yard simulation state

Core logic lives in:

- `src/components/YardEconomics.jsx`
- `src/utils/economicImpact.js`

## Modeling Notes

This is a planning/demo simulator, not an operations-grade dispatching system. The implementation uses simplified but explainable models:

- **Train movement:** time-compressed discrete simulation with route progress from speed and edge distance
- **Random delay injection:** probabilistic delay events during movement
- **Node congestion:** derived from `currentLoad / capacity`
- **Yard analysis:** time-stepped queueing model with Poisson arrivals
- **Dwell estimation:** Little's Law, `W = L / lambda`
- **Economic impact:** parametrized capacity and cost calculations using placeholder business assumptions

The dataset is mock data stored in `src/data/mockData.js`.

## Tech Stack

- `React 18`
- `Vite 5`
- `Tailwind CSS`
- `Leaflet`
- `react-leaflet`

## Getting Started

### Prerequisites

- `Node.js` 18+ recommended
- `npm`

### Install

```bash
npm install
```

### Run the Development Server

```bash
npm run dev
```

Then open the local URL shown by Vite, usually:

- `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Preview the Production Build

```bash
npm run preview
```

## Available Scripts

- `npm run dev` starts the Vite development server
- `npm run build` creates the production bundle
- `npm run preview` serves the production build locally

## Project Structure

```text
.
|-- index.html
|-- package.json
|-- src
|   |-- App.jsx
|   |-- main.jsx
|   |-- index.css
|   |-- components
|   |   |-- DashboardCards.jsx
|   |   |-- EventLog.jsx
|   |   |-- FleetOptimization.jsx
|   |   |-- MaintenanceSchedule.jsx
|   |   |-- RailNetworkMap.jsx
|   |   |-- Sidebar.jsx
|   |   |-- SimulationParameters.jsx
|   |   |-- TrainSimulation.jsx
|   |   |-- YardAnalysis.jsx
|   |   `-- YardEconomics.jsx
|   |-- data
|   |   `-- mockData.js
|   `-- utils
|       |-- economicImpact.js
|       |-- simulationEngine.js
|       `-- yardSimulation.js
|-- tailwind.config.js
|-- postcss.config.js
`-- vite.config.js
```

## Configuration and Customization

### Update Mock Data

Edit `src/data/mockData.js` to change:

- network nodes and edges
- initial train list
- fleet assets
- initial event log entries
- simulation default parameters

### Re-enable Hidden Pages

Some modules are already implemented but commented out in `src/components/Sidebar.jsx`. Re-enable entries there if you want those views visible in the navigation.

### Tune Simulation Logic

Adjust the following files to change system behavior:

- `src/utils/simulationEngine.js` for train motion, delay behavior, and fleet formulas
- `src/utils/yardSimulation.js` for queueing logic, throughput, dwell, and capacity curves
- `src/utils/economicImpact.js` for cost assumptions and financial formulas

## Current Notes

- The UI mixes English labels with Indonesian operational text
- Several formulas and assumptions are intentionally visible in the UI for demo and educational use
- Maintenance and parameter views exist in the app, but are not enabled in the current sidebar menu
- All operational values are mock values unless replaced with real data

## Recommended Next Improvements

- Add route planning across multiple edges instead of direct origin-destination interpolation
- Persist scenarios and user-adjusted parameters
- Add automated tests for simulation utilities
- Add charts or exports for historical run comparison
- Connect to a real backend or operational dataset

## License

No license file is currently included in this repository. Add one if this project will be shared outside its current environment.
