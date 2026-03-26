import request from 'supertest';
import app from '../../index.js';
import * as dbHandler from '../setup.js';
import Document from '../../models/Document.js';

beforeAll(async () => {
    await dbHandler.connect();
    // Pre-seed some data for search
    await Document.create([
        {
            slug: 'mongo-doc',
            title: 'MongoDB Guide',
            content: 'Learn how to use MongoDB effectively.',
            tags: ['database', 'guide'],
            metadata: { author: { name: 'Admin', id: '0', email: null } }
        },
        {
            slug: 'node-doc',
            title: 'Node.js Tutorial',
            content: 'Building APIs with Node.js and Express. A comprehensive guide.',
            tags: ['javascript', 'guide'],
            metadata: { author: { name: 'Admin', id: '0', email: null } }
        }
    ]);
    // Ensure text index is created (in-memory mongo might need a moment)
    await Document.syncIndexes();
});

afterAll(async () => await dbHandler.close());

describe('Search & Analytics API', () => {
  describe('GET /api/search', () => {
    it('Positive: should return relevant documents for a query', async () => {
      const res = await request(app).get('/api/search?q=MongoDB');
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].title).toBe('MongoDB Guide');
      expect(res.body[0].score).toBeDefined();
    });

    it('Positive: should filter by tags', async () => {
      const res = await request(app).get('/api/search?q=guide&tags=javascript');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].slug).toBe('node-doc');
    });

    it('Negative: should return empty list for unmatched query', async () => {
      const res = await request(app).get('/api/search?q=unobtainium');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(0);
    });
  });

  describe('Analytics', () => {
    it('GET /api/analytics/most-edited: should return top documents', async () => {
      const res = await request(app).get('/api/analytics/most-edited');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/analytics/tag-cooccurrence: should return tag pairs', async () => {
      const res = await request(app).get('/api/analytics/tag-cooccurrence');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
