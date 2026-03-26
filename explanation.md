# Technical Explanation: Collaborative Document Store

This document provides a comprehensive deep-dive into the architecture, data structures, and core logic of the Wiki backend.

## 🏗 Schema Design & Rationale

The project uses a single collection `documents`, but with a highly structured schema designed for concurrency and evolution.

### 1. The Document Model (`src/models/Document.ts`)
- **`slug`**: A human-readable, unique identifier derived from the title. It is indexed (`unique: true`) for O(1) retrieval.
- **`version`**: An integer used for **Optimistic Concurrency Control (OCC)**. Every update increments this value.
- **`revision_history`**: An array of historical snapshots. To prevent unbounded document growth, we use MongoDB's `$slice` operator to keep only the last 20 revisions.
- **`metadata.author`**: Initially a string, now a structured object:
  ```typescript
  {
    id: string | null;
    name: string;
    email: string | null;
  }
  ```

---

## 🔄 Core Logic Deep Dive

### 1. Collaborative Updates (Optimistic Concurrency Control)

The "Lost Update" problem occurs when two users edit the same version of a document, and the second one to save overwrites the first one's changes unknowingly.

**How we solve it:**
When a client sends an update, they MUST include the `version` they are currently looking at.

```typescript
// excerpt from src/controllers/documentController.ts
const updatedDoc = await Document.findOneAndUpdate(
  { slug, version: req.body.version }, // 1. Match version
  {
    $set: {
      title: req.body.title,
      content: req.body.content,
      tags: req.body.tags,
      'metadata.updatedAt': new Date()
    },
    $inc: { version: 1 }, // 2. Atomically increment version
    $push: {
      revision_history: {
        $each: [{
          content: req.body.content,
          editor: req.body.authorName || 'Anonymous',
          timestamp: new Date()
        }],
        $slice: -20 // 3. Keep only the last 20 revisions
      }
    }
  },
  { new: true }
);
```

If another user updated the document in the meantime, the `version` in the database will no longer match `req.body.version`. `findOneAndUpdate` will return `null`. We then catch this and return a `409 Conflict` with the latest data, forcing the user to resolve the conflict.

### 2. Full-Text Search Logic

We use MongoDB's **Text Search** engine. The schema has a compound text index:
```typescript
DocumentSchema.index({ title: 'text', content: 'text' }, { weights: { title: 10, content: 5 } });
```
- **Weights**: Matching words in the `title` are 2x more important than matches in the `content`.
- **Relevance Scoring**:
  ```typescript
  const docs = await Document.find(
    { $text: { $search: query } },
    { score: { $meta: 'textScore' } }
  ).sort({ score: { $meta: 'textScore' } });
  ```
  The results are automatically ranked by relevance (`textScore`).

### 3. Analytics & Aggregation

#### Most Edited Documents
We use the `$size` operator inside a `$project` stage to count the elements in the `revision_history` array without having to fetch the whole array into memory.
```typescript
{ $project: { title: 1, editCount: { $size: '$revision_history' } } }
```

#### Tag Co-occurrence (Association Discovery)
This is our most complex pipeline. It finds which tags appear together in the same documents.
1. **$unwind**: Flattens the tags array so we have one document per tag.
2. **Self-Join**: We use `$lookup` to join the collection with itself to find every other tag in the same document.
3. **De-duplication**: To avoid counting `[A, B]` and `[B, A]` as two different pairs, we use `$match` with `$lt` to ensure we only count pairs where Tag A comes before Tag B alphabetically.

### 4. Dual-Strategy Migration

#### Lazy (On-Read)
Implemented in the `getDocumentBySlug` controller. 
- **The Check**: `if (typeof doc.metadata.author === 'string')`.
- **The Action**: We transform it into the object format before sending the response. This "fixes" the data for the API consumer immediately without waiting for a database-wide update.

#### Background (Batch)
The `src/scripts/migrate_author_schema.ts` script uses `bulkWrite` for efficiency.
- **Target**: `{ 'metadata.author': { $type: 'string' } }`.
- **Performance**: We process in batches of 1,000 to avoid locking the database for long periods, making it safe for production use.

---

## 🛠 File Structure Overview

- `src/index.ts`: Server entry point and database connection logic.
- `src/routes/documentRoutes.ts`: Routing table. Maps URLs to Controller functions.
- `src/controllers/documentController.ts`: **The Core Business Engine**. Contains all CRUD, OCC, Search, and Analytics logic.
- `src/models/Document.ts`: **Data Definition**. Mongoose schema, TypeScript interfaces, and Index configurations.
- `src/scripts/seed.ts`: Industrial-grade seeder using Wikipedia data.
- `src/scripts/migrate_author_schema.ts`: Maintenance utility for mass data updates.

---

## 🧪 Testing Architecture

Tests reside in `src/tests/` and use **Jest** + **Supertest**.
- **`setup.ts`**: Manages the persistent test connection to `wikidb_test`.
- **Integration Tests**: Verify end-to-end API contracts (Status codes, JSON structures).
- **Concurrency Tests**: Specifically stress-test the OCC logic by firing simultaneous requests and verifying that only one increments the version while the others receive `409`.
