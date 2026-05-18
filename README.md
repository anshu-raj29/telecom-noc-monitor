# Telecom NOC Monitor

Telecom NOC Monitor is a full-stack network operations dashboard for monitoring telecom tower health, signal quality, KPI trends, alerts, and ML-driven performance insights.

## Demo

[Watch the demo recording](./demo.mp4)

The demo video is stored with Git LFS because it is larger than GitHub's normal file-size limit.

## Features

- Network health dashboard with KPI cards and live-style metrics
- Tower-level drill-down pages
- Health distribution and tower comparison charts
- Risk matrix and alert panels for operational review
- CSV ingestion for signal metrics, raw data, and processed data
- Backend analytics APIs for dashboard, alerts, tower details, and ML overview

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Recharts, Lucide React
- Backend: Node.js, Express, Mongoose
- Database: MongoDB
- Data: CSV-based telecom signal metrics
- Large files: Git LFS for the demo video

## Project Structure

```text
.
├── backend/                 # Express API and data services
├── frontend/                # React dashboard
├── demo.mp4                 # Demo recording linked above
├── processed_dataset.csv    # Processed telecom dataset
├── raw_dataset.csv          # Raw telecom dataset
└── signal_metrics.csv       # Signal metrics used for seeding
```

## Getting Started

### Prerequisites

- Node.js
- MongoDB running locally, or a MongoDB connection string
- Git LFS if you want to clone the demo video

### Backend

```bash
cd backend
npm install
npm start
```

The backend runs on `http://localhost:8000` by default.

To use a custom MongoDB database, create `backend/.env`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/telecom_intel
PORT=8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://127.0.0.1:5179`.

If your backend is running somewhere else, set:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## API Overview

- `GET /health`
- `GET /dashboard`
- `GET /kpis`
- `GET /alerts`
- `GET /network-health`
- `GET /tower/:towerId`
- `GET /ml/overview`

## Notes

- `node_modules`, build output, logs, and environment files are intentionally ignored.
- The backend seeds MongoDB from `signal_metrics.csv` when the database is empty.
- The demo video is tracked as `demo.mp4` at the repository root and linked from this README.
