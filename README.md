# Collaborative Document Store (Wiki Backend)

A production-ready wiki backend built with Node.js, TypeScript, and MongoDB. This project implements advanced database patterns including Optimistic Concurrency Control (OCC), schema evolution, and complex aggregation pipelines.

## 🚀 Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js (v20+ recommended for local development)

### Environment Setup
1. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
2. Configure your environment variables in `.env` (default values should work for Docker).

### Running with Docker (Recommended)
Launch the entire stack (MongoDB + API):
```bash
docker-compose up --build
```

### Running Tests
To run the automated test suite (includes unit, integration, and concurrency tests):
```bash
npm test
```
*Note: Tests use an in-memory database and do not require a running MongoDB instance.*

### Initial Data Seeding
The database must be seeded with initial documents for testing:
```bash
# Locally
npm run seed

# Via Docker
docker-compose exec api npm run seed
```

## 🛠 Features & Architecture

### Core Technologies
- **Runtime**: Node.js (ES Modules)
- **Language**: TypeScript
- **Database**: MongoDB 7.0
- **Framework**: Express.js

### Advanced Patterns
- **Optimistic Concurrency Control (OCC)**: Version-based atomic updates to prevent lost updates in collaborative editing.
- **Schema Evolution**: Dual-strategy migration (Lazy On-Read for immediate availability + Background Batch for consistency).
- **Revision History**: Capped history stored directly within documents for high-performance retrieval.
- **Full-Text Search**: Relevance-scored search with tag-based filtering.

## 📡 API Endpoints

### Documents
- `POST /api/documents`: Create a new wiki page.
- `GET /api/documents/:slug`: Retrieve a page by slug (triggers lazy migration).
- `PUT /api/documents/:slug`: Update a page with OCC version check.
- `DELETE /api/documents/:slug`: Remove a page.

### Search & Discovery
- `GET /api/search?q=searchterm&tags=tag1,tag2`: Full-text search with relevance ranking.

### Analytics
- `GET /api/analytics/most-edited`: Top 10 documents by revision count.
- `GET /api/analytics/tag-cooccurrence`: Relationship map of frequently paired tags.

## 🧹 Maintenance Scripts

### Schema Migration
To migrate documents from the old author schema to the new structured format:
```bash
npm run migrate # Runs src/scripts/migrate_author_schema.ts
```

## 🧪 Submission Checklist
- [x] Fully containerized (Docker Compose)
- [x] Automating seeding (10k docs)
- [x] Document CRUD & OCC
- [x] Full-text search with Relevance
- [x] Analytics (Aggregations)
- [x] Schema Migration (Lazy + Background)
