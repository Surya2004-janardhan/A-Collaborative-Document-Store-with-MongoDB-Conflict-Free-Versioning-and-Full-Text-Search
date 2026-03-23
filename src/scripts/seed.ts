import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Document from '../src/models/Document';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/wikidb';

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    const count = await Document.countDocuments();
    if (count > 0) {
      console.log(`Database already has ${count} documents. Skipping seed.`);
      process.exit(0);
    }

    console.log('Seeding 10,000 documents...');
    
    const batchSize = 1000;
    const totalDocs = 10000;
    
    for (let i = 0; i < totalDocs; i += batchSize) {
      const docs = [];
      for (let j = 0; j < batchSize; j++) {
        const index = i + j;
        const isOldSchema = Math.random() < 0.1; // 10% old schema
        
        const author = isOldSchema 
          ? `Old Author ${index}` 
          : { id: `user-${index}`, name: `Author ${index}`, email: `author${index}@example.com` };

        docs.push({
          slug: `doc-slug-${index}`,
          title: `Document Title ${index}`,
          content: `This is the content for document ${index}. It contains some text for full-text search index evaluation. Wikipedia stub mock.`,
          version: 1,
          tags: ['seed', index % 2 === 0 ? 'even' : 'odd', 'test'],
          metadata: {
            author: author,
            createdAt: new Date(),
            updatedAt: new Date(),
            wordCount: 20
          },
          revision_history: [{
            version: 1,
            updatedAt: new Date(),
            authorId: isOldSchema ? 'unknown' : `user-${index}`,
            contentDiff: 'Initial version'
          }]
        });
      }
      
      await Document.insertMany(docs);
      console.log(`Inserted ${i + batchSize} documents...`);
    }

    console.log('Seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
