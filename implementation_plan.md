# CampusBridge Implementation Plan

CampusBridge is a hyperlocal, peer-to-peer service marketplace for college campuses. This document outlines the technical architecture and step-by-step implementation for the MVP.

## 1. Project Overview
- **Type:** Mobile-first P2P Service Marketplace
- **Target Audience:** College Students
- **Core Loop:** Requester creates task -> Servers bid -> Requester accepts -> Task completion via OTP -> Payment release.

## 2. Tech Stack
- **Frontend:** React Native (Expo)
- **Backend:** Node.js (Express)
- **Database:** MongoDB (Mongoose)
- **Real-time:** Socket.io
- **Maps:** Google Maps / Leaflet (React Native Maps)

## 3. System Architecture

### Multi-tenant Isolation
Every entity (`User`, `Task`) is linked to a `campusId`. This ensures data isolation and campus-level scaling.

### Core Modules
- **Auth:** JWT-based with role-based access control.
- **Tasks:** CRUD with bidding sub-collection.
- **Payments:** Internal wallet system with escrow.
- **Real-time:** Socket.io rooms per campus for live updates.

## 4. Database Schema
### Campus Collection
```json
{
  "_id": "ObjectId",
  "name": "String",
  "location": { "type": "Point", "coordinates": "[Number]" }
}
```

### User Collection
```json
{
  "_id": "ObjectId",
  "name": "String",
  "role": "requester | server | admin",
  "walletBalance": "Number",
  "campusId": "ObjectId"
}
```

### Task Collection
```json
{
  "_id": "ObjectId",
  "title": "String",
  "price": "Number",
  "status": "open | assigned | completed",
  "bids": [{ "server": "ObjectId", "amount": "Number" }],
  "otp": "String (hidden)"
}
```

## 5. Implementation Roadmap

### Phase 1: Foundation (Current)
- [x] Backend Boilerplate (Express, Socket.io, MongoDB setup)
- [x] Database Models (User, Task, Campus, Transaction)
- [x] Git Initialization & Remote Setup
- [ ] Mobile App Boilerplate (Expo, Navigation)

### Phase 2: Authentication & Multi-tenancy
- [ ] JWT Auth endpoints (Login/Signup)
- [ ] Campus management (Admin)
- [ ] Middleware for Auth and Tenant validation

### Phase 3: Task Marketplace
- [ ] Task creation & listing
- [ ] Real-time bidding system (Socket.io)
- [ ] Task lifecycle management (Assign, Start, Complete)

### Phase 4: Payments & Wallet
- [ ] Wallet ledger system
- [ ] Escrow hold/release logic
- [ ] OTP verification for completion

### Phase 5: Live Tracking & UI Polish
- [ ] GPS periodic updates from Server
- [ ] Live map view for Requester
- [ ] UI/UX overhaul using premium design principles

## 6. Development Guidelines
- Always use `campusId` in queries for multi-tenancy.
- Use `winston` for logging and global error handlers for reliability.
- Mobile UI should focus on speed and clarity (one-handed operation).
