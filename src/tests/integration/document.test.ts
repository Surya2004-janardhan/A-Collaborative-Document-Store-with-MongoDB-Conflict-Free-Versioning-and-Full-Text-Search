import request from 'supertest';
import app from '../../index.js';
import * as dbHandler from '../setup.js';
import Document from '../../models/Document.js';

beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clear());
afterAll(async () => await dbHandler.close());

describe('Document API Integration Tests', () => {
  
  describe('POST /api/documents', () => {
    it('Positive: should create a new document with valid data', async () => {
      const res = await request(app)
        .post('/api/documents')
        .send({
          title: 'Test Doc',
          content: 'Some content here',
          tags: ['test'],
          authorName: 'John Doe'
        });
      
      expect(res.status).toBe(201);
      expect(res.body.slug).toBeDefined();
      expect(res.body.version).toBe(1);
    });

    it('Negative: should fail if title is missing', async () => {
      const res = await request(app)
        .post('/api/documents')
        .send({
          content: 'No title here',
          authorName: 'No Title'
        });
      // Currently our controller doesn't have strict validation middleware yet,
      // it might return 500 or 201 with missing fields. 
      // This test highlights the need for validation.
      expect(res.status).not.toBe(201);
    });

    it('Edge Case: should handle special characters in title for slug generation', async () => {
      const res = await request(app)
        .post('/api/documents')
        .send({
          title: 'Special @#$% Characters!',
          content: 'Content',
          authorName: 'Edge case'
        });
      expect(res.status).toBe(201);
      expect(res.body.slug).toMatch(/special-.*characters/);
    });
  });

  describe('GET /api/documents/:slug', () => {
    it('Positive: should retrieve an existing document', async () => {
      const doc = await Document.create({
        slug: 'test-slug',
        title: 'Title',
        content: 'Content',
        metadata: { author: { name: 'A', id: '1', email: null } }
      });

      const res = await request(app).get(`/api/documents/${doc.slug}`);
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Title');
    });

    it('Negative: should return 404 for non-existent document', async () => {
      const res = await request(app).get('/api/documents/ghost-slug');
      expect(res.status).toBe(404);
    });

    it('Edge Case (Phase 4): should perform lazy migration for old author schema', async () => {
      const doc = await (Document as any).create({
        slug: 'old-doc',
        title: 'Old Title',
        content: 'Old Content',
        metadata: { 
          author: 'Old Author string', // Old schema: string
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      const res = await request(app).get('/api/documents/old-doc');
      expect(res.status).toBe(200);
      expect(typeof res.body.metadata.author).toBe('object');
      expect(res.body.metadata.author.name).toBe('Old Author string');
    });
  });
});
