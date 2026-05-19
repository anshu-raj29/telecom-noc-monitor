# Telecom NOC Monitor

Telecom NOC Monitor is a full-stack telecom Network Operations Center (NOC) dashboard designed for monitoring telecom tower health, KPI performance, anomaly detection, and ML-driven operational risk forecasting.

The platform provides a centralized monitoring interface for telecom operators to analyze signal quality, throughput, latency, network degradation, and predictive outage risks across multiple localities and tower sites.

---

## Features

### Core Features
- Telecom NOC-style monitoring dashboard
- Real-time style KPI tracking with periodic refresh
- Telecom tower/site health monitoring
- Network availability and degradation analysis
- Alert generation and prioritization
- Interactive tower drill-down analytics
- Historical KPI trend visualization

### Analytics & ML Features
- ML-driven risk prediction system
- Predictive UP / DEGRADED / DOWN classification
- Custom anomaly detection engine
- Congestion forecasting logic
- Health score computation
- Risk matrix analysis
- Failure risk prioritization

### Visualization Features
- Interactive KPI charts
- Throughput analytics graphs
- Signal trend monitoring
- Risk heatmaps and matrices
- Tower status visualization
- Dashboard analytics cards
- Historical performance tracking

---

## Tech Stack

### Frontend
- React.js
- Vite
- Tailwind CSS
- Recharts
- Axios
- React Router DOM
- Lucide React

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose

### Data & Analytics
- CSV Parsing
- Custom ML Logic
- Anomaly Detection
- Predictive Risk Scoring
- Congestion Forecasting

---

## System Architecture

The application follows a full-stack architecture:

1. Telecom KPI datasets are ingested from CSV files.
2. Metrics are stored in MongoDB.
3. Backend analytics engines compute:
   - health scores
   - anomaly scores
   - congestion risk
   - predictive operational risk
4. REST APIs expose processed analytics data.
5. React frontend visualizes insights using charts and monitoring dashboards.

---

## Key Functionalities

- KPI Monitoring
- Tower Health Analysis
- Signal Quality Tracking
- Throughput Analysis
- Latency Monitoring
- Risk Prediction
- Alert Management
- Historical Trend Analysis
- Predictive Analytics Dashboard

---

## ML & Risk Analysis

The platform includes a custom predictive analytics pipeline that combines:

- Decision-tree style classification
- Percentile-based anomaly detection
- Congestion forecasting
- Operational risk scoring
- Failure probability estimation

The system generates:
- Failure Risk Score
- Predicted Tower Status
- Priority Ranking
- Confidence Metrics

---

## Dashboard Modules

- Performance Overview
- KPI Status
- Throughput Analysis
- Network Alerts
- Risk Analytics
- Tower Detail View
- Telecom Health Monitoring

---

## Project Objective

The project simulates a real-world telecom NOC environment where operators can proactively monitor network performance, identify risky localities, and prioritize operational responses before service degradation impacts users.

---

## Future Improvements

- Real-time WebSocket integration
- Role-based authentication
- Live telecom API integrations
- Advanced ML model training
- Distributed monitoring support
- Cloud deployment & scaling
- Predictive maintenance automation

---

## Author

Anshu Raj
