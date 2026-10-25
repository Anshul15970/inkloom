# Inkloom Phased Implementation Roadmap

### Phase 1: Foundational Architecture & Core Scaffolding (Current)
- [x] Initial repository inspection and architectural design document
- [x] Multi-tenant isolation model and role-permission matrix
- [x] Unified database schema (PostgreSQL + pgvector)
- [x] Project workspace scaffolding (`backend`, `frontend`, `extension`)
- [x] Core abstractions: `BaseLLMProvider`, `VectorStore`, `DeterministicVisionChecker`
- [x] Base FastAPI setup with health check and CORS

### Phase 2: Golden Facts Ingestion & Semantic RAG Engine
- [ ] CSV/Excel parser for Golden Facts
- [ ] Vector embedding generation and pgvector index storage
- [ ] RAG retrieval pipeline with brand-scoped semantic search
- [ ] Gemini claim verification with grounded guideline citations

### Phase 3: Split Vision Engine
- [ ] OpenCV dominant hex color extraction (K-Means) & CIELAB Delta-E distance
- [ ] Logo template matching & boundary clearance check
- [ ] Channel aspect ratio and resolution validation
- [ ] Gemini Multimodal aesthetic vibe evaluation

### Phase 4: Creator Studio, Chrome Extension & Human Review
- [ ] React Creator Studio with live in-browser text & image audit
- [ ] Chrome Manifest V3 extension (DOM extraction, side panel, inline badge)
- [ ] Review Queue module for escalation, comments, and approvals
- [ ] Brand manager workspace configuration screens

### Phase 5: Governance Analytics & Production Hardening
- [ ] Analytics dashboard: recurring violations, compliance trend tracking
- [ ] Comprehensive unit and integration test suite
- [ ] Docker compose orchestration for local developer setup
