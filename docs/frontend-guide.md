# 📱 Frontend Developer Guide — Straw2Cash APIs & Integration

> **Single source of truth** for the frontend team. Combines all three backend services (Go, Java, Python), all user roles, all endpoints, and integration patterns.
>
> **Owner of this doc:** Member 4 (Frontend) — keep it updated
> **Last updated:** After all backends feature-complete
> **File location:** `docs/frontend-guide.md`

---

## 📑 Table of Contents

1. [System Overview](#1-system-overview)
2. [Service Map & Ports](#2-service-map--ports)
3. [Authentication Flow](#3-authentication-flow)
4. [User Roles & Permissions](#4-user-roles--permissions)
5. [The Complete Farmer Journey](#5-the-complete-farmer-journey)
6. [API Reference by Service](#6-api-reference-by-service)
7. [Data Models (TypeScript Types)](#7-data-models-typescript-types)
8. [Error Handling](#8-error-handling)
9. [Localization (Hindi/Punjabi)](#9-localization-hindipunjabi)
10. [Voice & Chat Integration](#10-voice--chat-integration)
11. [Maps & Hotspot Visualization](#11-maps--hotspot-visualization)
12. [Low-Bandwidth & Offline Strategy](#12-low-bandwidth--offline-strategy)
13. [Integration Pitfalls & Gotchas](#13-integration-pitfalls--gotchas)
14. [Local Dev Setup](#14-local-dev-setup)
15. [Demo Credentials](#15-demo-credentials)

---

## 1. System Overview

**Straw2Cash** is a marketplace connecting farmers with buyers of paddy straw (biomass plants, brick kilns, paper mills, cattle-feed makers). It arranges baler + transport, tracks fire hotspots, and quantifies environmental impact.

### The 4 services and how they talk

```
                    ┌──────────────────────┐
                    │  FRONTEND (You)      │
                    │  React + TS + Maps   │
                    │  Port 5173           │
                    └──────────┬───────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  Go Backend   │   │  Java Backend    │   │  Python Backend  │
│  Port 8000    │   │  Port 8080       │   │  Port 8001       │
│               │   │                  │   │                  │
│  Matching     │   │  Money:          │   │  AI/ML:          │
│  Scheduling   │   │  - Pricing       │   │  - Residue calc  │
│  Profiles     │   │  - Contracts     │   │  - Hotspots      │
│  Listings     │   │  - Settlements   │   │  - AI assistant  │
│  Requirements │   │  - Users/Roles   │   │  - Demand        │
│  Matches      │   │  - Impact        │   │    insights      │
└───────────────┘   └──────────────────┘   └──────────────────┘
```

### The rule of thumb

| Question | Call this service |
|---|---|
| "Who is this user? What profiles exist?" | **Go** |
| "What's this straw worth in ₹?" | **Java** |
| "How much straw do I have?" | **Python** |
| "Where are fire hotspots?" | **Python** |
| "Match me with a buyer" | **Go** |
| "Sign this contract" | **Java** |
| "What's my payout breakdown?" | **Java** |
| "Ask the AI assistant anything" | **Python** |
| "Track environmental impact" | **Java** |

---

## 2. Service Map & Ports

| Service | Port | Base URL (local) | Purpose |
|---|---|---|---|
| **Frontend** | `5173` | `http://localhost:5173` | You |
| **Go Backend** | `8000` | `http://localhost:8000` | Matching, profiles, listings |
| **Java Backend** | `8080` | `http://localhost:8080` | Money, contracts, auth |
| **Python Backend** | `8001` | `http://localhost:8001` | AI, residue, hotspots |

---

## 3. Authentication Flow

Java backend is the auth authority.
- Login: `POST /api/v1/auth/login`
- Register: `POST /api/v1/users/register`
- Profile: `GET /api/v1/users/me`
- Token stored in `localStorage.setItem('straw2cash_token', token)`
- Token lifetime: 24 hours (86400s)

---

## 4. User Roles & Permissions

- **FARMER**: Owns crop residue, lists straw, signs contracts as seller
- **BUYER**: Biomass plant / kiln / mill / feed maker, creates requirements, matches, signs, settles
- **BALER**: Owns baler machine + transport, provides baling + transport service
- **AUTHORITY**: Government / pollution board, views regional impact + hotspot map

---

## 15. Demo Credentials

| Role | Phone | Password |
|---|---|---|
| FARMER | `9000000001` | `farmer123` |
| BUYER | `9000000002` | `buyer123` |
| AUTHORITY | `9000000003` | `auth123` |
| BALER | `9000000004` | `baler123` |
