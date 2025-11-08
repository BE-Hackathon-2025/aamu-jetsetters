<!-- Back to Top Navigation Anchor -->

<a name="readme-top"></a>

<!-- About the Application -->

# Jetsetters — BeSmart 2025
This repository contains the codebase developed by Team AAMU (Jetsetters) for the BeSmart 2025 Hackathon. It includes a React + TypeScript frontend, a Node/TypeScript backend, and a small Python ML inference service used for anomaly detection and insights.


## Table of contents
- [Jetsetters — BeSmart 2025](#jetsetters--besmart-2025)
  - [Table of contents](#table-of-contents)
  - [Challenge Statement(s) Addressed 🎯](#challenge-statements-addressed-)
  - [Project Description 🤯](#project-description-)
  - [Project Value 💰](#project-value-)
  - [How It Works](#how-it-works)
  - [Technologies Used](#technologies-used)
    - [Frontend](#frontend)
    - [Backend](#backend)
    - [AI Integration](#ai-integration)
    - [Deployment](#deployment)
    - [Database](#database)
    - [Collaboration & Version Control](#collaboration--version-control)

## Challenge Statement(s) Addressed 🎯
BeSmart focuses on improving public health and environmental awareness through monitoring and intelligent alerts. This project addresses challenges around water system monitoring, early anomaly detection, and delivering actionable notifications to operators and communities.

Key questions we address:
- How can we detect anomalies in sensor data and notify operators quickly?
- How can we present historical and real-time water data in a way that enables fast, correct decisions?
- How can we combine ML inference with operator workflows to reduce manual triage time?


## Project Description 🤯
Jetsetters is a full-stack application built to monitor water system metrics, detect anomalies with ML support, and give administrators and community users easy tools to view incidents, alerts, and historical trends. The system includes:

- An admin dashboard for viewing alerts, incidents, chat messages, and system metrics.
- Public/community pages for reporting issues and viewing relevant water data.
- Backend services that ingest, normalize, and store operator data, run status calculations, and send notifications.
- A Python ML inference service for anomaly detection and correlation.


## Project Value 💰
This project helps utilities and community stakeholders by:
- Detecting issues early to reduce environmental and public health impacts.
- Reducing manual monitoring effort with automated anomaly correlation.
- Providing a single-pane dashboard for operators and admins.
- Enabling community engagement and reporting.


## How It Works
High-level flow:

1. Sensors / external sources push telemetry into backend ingestion endpoints.
2. Backend services normalize data and run status calculations.
3. ML inference (Python service) flags anomalies and correlates related events.
4. Notifications are created and routed (email/push) to operators and users.
5. Frontend dashboards visualize alerts, charts, incidents, and historical trends.


## Technologies Used

### Frontend
- React + TypeScript (Vite)
- Firebase (auth and possibly database/storage)

### Backend
- Node.js + TypeScript
- Express-style routes and modular services located under `backend/src/services`
- Several microservices-like modules (notifications, anomaly correlation, operator data)

### AI Integration
- A small Python ML inference service: `backend/src/services/ml-inference-service.py` — used for anomaly detection and correlation.
- Frontend and backend include hooks/services for interacting with AI or analytic endpoints (see `frontend/src/services/openai.service.ts`).

### Deployment
- Designed to be deployable to common environments (Heroku, Vercel for frontend, AWS/GCP for backend). No official Docker Compose is included by default; instructions below show how to run locally.

### Database
- Firebase is used on the frontend (see `frontend/src/config/firebase.ts`).
- Backend can be configured to use whichever datastore you choose; the repo includes types and mapping utilities to help connect operator telemetry.

### Collaboration & Version Control
- Git + GitHub for source control. Feature branches and PRs recommended.

### School Name 🏫
Alabama A&M University

### Team Name 🏷
Jetsetters (Team AAMU)


## ✨ Contributors ✨

- Thabo Ibrahim Traore 
- Solomon Agyire
- Zizwe Mtonga
- Asia Harris
- Osamwengumwenro (Godslove) Oni-Ojo 


## Team Photo
- Add `team-photo.jpg` or paste an image link here.


