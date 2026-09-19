# Arcturus Connexa — Engineering Documentation Index
## Architecture, System Design, Schemas & User Manuals

Welcome to the central technical documentation suite for **Arcturus Connexa** (`arcturus`). This directory contains comprehensive specifications covering product requirements, system design, database architecture, dataflow diagrams, role-based user manuals, and project overviews.

---

## Documentation Directory

| Document | File Name | Scope & Purpose |
| :--- | :--- | :--- |
| **1. Product Requirements Document** | [PRD.md](./PRD.md) | Comprehensive functional and non-functional requirements, persona matrix, 11 feature epics, and KPIs across frontend and backend. |
| **2. Project Design Document** | [PDD.md](./PDD.md) | Technical system architecture, component hierarchies, state management, middleware pipeline, REST API standards, and deployment topology. |
| **3. Database Schema & Dataflow** | [DATABASE_SCHEMA_DATAFLOW.md](./DATABASE_SCHEMA_DATAFLOW.md) | Current Mongoose model fields, nested schemas, model relationships, authorization rules, Entity-Relationship diagram, and end-to-end dataflow sequence diagrams. |
| **4. User Manual & Role Guides** | [USER_MANUAL.md](./USER_MANUAL.md) | Step-by-step registration and onboarding guides for all 6 user roles, feature walkthroughs, and troubleshooting FAQs. |
| **5. Full Project Overview** | [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) | In-depth breakdown of the 10 architectural pillars, problems solved, local setup guide, and future roadmap. |

---

## Quick Reference: Core System Epics

1. **Identity & Auth:** Email verification via 6-digit OTP, bcrypt hashing, password history tracking, JWT session tokens.
2. **Social Feed & Activity Stream:** Infinite feed, polls, events, celebrations, documents, 6-tier reactions, nested comments, reposts.
3. **Ephemeral Tales:** 24-hour stories engine with MongoDB TTL automatic purge index.
4. **Encrypted Messaging:** 1-on-1 private messaging protected at rest via AES-256-CBC cipher with dynamic IVs.
5. **Verified Organizations:** Corporate registration with mandatory legal document upload (incorporation cert, business license, tax ID) and Super Admin audit lightbox.
6. **CampusLink Placement Engine:** Higher-education placement management, 4-dimension readiness matrix, Google Gemma 3 AI diagnostics, multi-stage drives, and SHA-256 offer verification.
7. **Enterprise Job Portal & ATS:** Job search, workplace type filtering, and candidate recruitment pipeline tracking.
8. **Learning Hub Masterclasses:** Curated Vinh Giang communication syllabus, interactive YouTube controls deck, strict 80% active watch-time anti-cheat engine, and verified certificates.
9. **Arcturus Games:** Six daily cognitive mini-games (Sudoku, Zip, Tango, Queens, Crossclimb, Pinpoint) with global competitive leaderboards.
10. **Targeted Ad Exchange:** Self-serve campaign builder with audience targeting, impression logging, and sponsored feed card delivery.
11. **Operations Hub (Admin):** Super Admin command center with real-time KPI metrics, organization review, user moderation, and course curriculum CMS.

---
*Maintained by the Arcturus Engineering Team. For questions or modifications, consult [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md).*

