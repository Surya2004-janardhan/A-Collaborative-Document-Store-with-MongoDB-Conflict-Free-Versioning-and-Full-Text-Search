# Technical Explanation: Collaborative Document Store

This document provides a deep dive into the architecture, data flows, and design decisions of the Wiki backend.

## 🏗 System Architecture

The system follows a classic Layered Architecture:
1. **Model Layer**: Defines Mongoose schemas and TypeScript interfaces for Document entities.
2. **Controller Layer**: Handles business logic, OCC validation, and aggregation pipelines.
3. **Route Layer**: Exposes RESTful endpoints.
4. **Maintenance Layer**: Standalone scripts for DB seeding and schema migrations.

---

## 🔄 Core Data Flows

### 1. Collaborative Update Flow (Optimistic Concurrency Control)
To prevent "Lost Updates", we avoid pessimistic locks and use versioning:
1. **Read**: User A and User B both fetch Version 5 of a document.
2. **Edit**: Both make changes locally.
3. **Submit (User A)**: User A sends Version 5. The server checks the DB. Since it's still Version 5, the update succeeds and increments it to Version 6.
4. **Submit (User B)**: User B sends Version 5. The server checks the DB and finds Version 6.
5. **Conflict**: The server returns `409 Conflict` along with the latest Version 6 data, allowing User B to merge changes.

**Implementation**:
```typescript
Document.findOneAndUpdate(
  { slug, version: expectedVersion }, // Match exact version
  { 
    $set: { ... }, 
    $inc: { version: 1 }, // Increment version atomically
    $push: { revision_history: { ... } } // Add revision
  }
)
```

### 2. Schema Evolution Flow
When the `author` field changed from a simple `string` to a structured `object`, we implemented a zero-downtime strategy:

#### A. Lazy Migration (On-Read)
In the `getDocumentBySlug` flow:
- Fetch doc from DB.
- If `metadata.author` is a `string`, wrap it in the new object format ` { id: null, name: string, email: null }` before returning to the user.
- This ensures the API is always consistent even if the DB is partially migrated.

#### B. Background Migration (Batch)
The `migrate_author_schema.ts` script:
- Queries for docs where `metadata.author` type is `string`.
- Processes in batches of 1,000 to minimize DB load.
- Uses `bulkWrite` for high performance.

---

## 📂 Key Functions & Logic

### `searchDocuments` (Full-Text Search)
Uses MongoDB's `$text` operator. We project a `textScore` meta-field to rank results by how well they match the search query, then sort descending by that score.

### `getMostEdited` (Aggregation)
Uses the `$project` stage with `$size` operator on the `revision_history` array to calculate the number of edits without manual counting.

### `getTagCooccurrence` (Advanced Aggregation)
1. `$unwind` on tags to get individual items.
2. `$lookup` back to the same collection to find pairings.
3. `$match` with `$expr: { $lt: ['$tagA', '$tagB'] }` to ensure each pair is only counted once (avoiding duplicates like [A,B] and [B,A]).
4. `$group` by the pair to count occurrences.

---

## 🛠 File Structure
- `src/index.ts`: Application entry and DB connection.
- `src/models/Document.ts`: The "Source of Truth" for document structure and indexes.
- `src/controllers/documentController.ts`: The "Brain" containing all aggregation logic and OCC checks.
- `src/routes/documentRoutes.ts`: REST mapping for the controllers.
- `src/scripts/seed.ts`: High-performance data generator (10k docs).
- `src/scripts/migrate_author_schema.ts`: Bulk migration utility.
