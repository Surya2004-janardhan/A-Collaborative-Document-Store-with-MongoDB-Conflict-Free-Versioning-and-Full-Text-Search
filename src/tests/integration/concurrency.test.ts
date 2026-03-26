import request from 'supertest';
import app from '../../index.js';
import * as dbHandler from '../setup.js';
import Document from '../../models/Document.js';

beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clear());
afterAll(async () => await dbHandler.close());

describe('Concurrency & Conflict Resolution (OCC)', () => {
  it('Positive: should allow update when version matches', async () => {
    const doc = await Document.create({
      slug: 'occ-doc',
      title: 'Original',
      content: 'Content',
      version: 1,
      metadata: { author: { name: 'A', id: '1', email: null } }
    });

    const res = await request(app)
      .put(`/api/documents/${doc.slug}`)
      .send({
        title: 'Updated',
        content: 'New content',
        version: 1
      });

    expect(res.status).toBe(200);
    expect(res.body.version).toBe(2);
  });

  it('Negative: should return 409 Conflict when version is outdated', async () => {
    const doc = await Document.create({
      slug: 'conflict-doc',
      title: 'Original',
      content: 'Content',
      version: 2, // Current version is 2
      metadata: { author: { name: 'A', id: '1', email: null } }
    });

    const res = await request(app)
      .put(`/api/documents/${doc.slug}`)
      .send({
        title: 'Stale Update',
        content: 'New content',
        version: 1 // Client sends version 1
      });

    expect(res.status).toBe(409);
    expect(res.body.version).toBe(2); // Should return the latest version
  });

  it('Concurrency Case: should handle rapid simultaneous updates correctly', async () => {
    const doc = await Document.create({
      slug: 'rapid-doc',
      title: 'Init',
      content: 'Init',
      version: 1,
      metadata: { author: { name: 'A', id: '1', email: null } }
    });

    // Simulate two users saving at the same time
    const [res1, res2] = await Promise.all([
      request(app).put(`/api/documents/${doc.slug}`).send({ title: 'U1', content: 'C1', version: 1 }),
      request(app).put(`/api/documents/${doc.slug}`).send({ title: 'U2', content: 'C2', version: 1 })
    ]);

    // One should succeed (200), one should fail (409)
    const statuses = [res1.status, res2.status];
    expect(statuses).toContain(200);
    expect(statuses).toContain(409);
  });
});
